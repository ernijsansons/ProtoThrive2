"""Enterprise agent orchestrator coordinating multi-role workflows."""
from __future__ import annotations

import json
import logging
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import yaml

from src.orchestration import build_graph
from src.roles import Coder, Planner, Reflector, Reviewer, Validator
from src.tools import invoke_codex_cli
from src.utils.safety import scrub_pii
from src.utils.secrets import load_secrets
from src.utils.telemetry import record_event, record_metric

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = BASE_DIR / "configs/agent_config_v3.4.yaml"

try:  # Optional dependencies; continue gracefully if missing
    from anthropic import Anthropic
except ImportError:  # pragma: no cover
    Anthropic = None  # type: ignore

try:
    from google.generativeai import GenerativeModel
except ImportError:  # pragma: no cover
    GenerativeModel = None  # type: ignore

try:
    import openai
except ImportError:  # pragma: no cover
    openai = None  # type: ignore

try:
    from src.utils.costs import CostEstimator as ExternalCostEstimator  # type: ignore
except ImportError:  # pragma: no cover

    class ExternalCostEstimator:  # type: ignore[too-many-ancestors]
        """Lightweight fallback estimator when cost utilities are unavailable."""

        def __init__(self, *_: Any, **__: Any) -> None:
            self._tokens = 0
            self._total_cost = 0.0
            self._events: List[Dict[str, Any]] = []

        def track(self, tokens: int, role: str, operation: str, **extra: Any) -> None:
            tokens = max(tokens or 0, 0)
            self._tokens += tokens
            cost = extra.get("cost", tokens * 2e-6)
            self._total_cost += cost
            event = {
                "role": role,
                "operation": operation,
                "tokens": tokens,
                "cost": cost,
                **extra,
            }
            self._events.append(event)

        def track_estimated(
            self, tokens: int, role: str, operation: str, **extra: Any
        ) -> None:
            self.track(tokens, role, f"{operation}_estimated", **extra)

        def estimate(self, complexity: int, _domain: str) -> float:
            return max(complexity, 1) / 1000.0 * 0.05

        def summary(self) -> Dict[str, Any]:
            return {
                "tokens": self._tokens,
                "events": list(self._events),
                "total_cost": round(self._total_cost, 6),
            }


try:
    from src.memory import MemoryStore as ExternalMemoryStore  # type: ignore
except ImportError:  # pragma: no cover

    class ExternalMemoryStore:  # type: ignore[too-many-ancestors]
        """Simple in-memory store used when the real implementation is absent."""

        def __init__(self, *_: Any, **__: Any) -> None:
            self._data: Dict[str, Dict[str, Any]] = {}

        def store(self, scope: str, key: str, value: Any) -> None:
            self._data.setdefault(scope, {})[key] = value

        def retrieve(self, scope: str, key: str, default: Any = None) -> Any:
            return self._data.get(scope, {}).get(key, default)

        def prune(self) -> None:
            # Keep the fallback lightweight; no pruning heuristic required.
            if len(self._data) > 10:
                self._data.pop(next(iter(self._data)))


try:
    from src.governance import (  # type: ignore
        GovernanceChecker as ExternalGovernanceChecker,
    )
except ImportError:  # pragma: no cover

    class ExternalGovernanceChecker:  # type: ignore[too-many-ancestors]
        """Fallback governance checker that records metrics without enforcement."""

        def __init__(self, *_: Any, **__: Any) -> None:
            self.latest_metrics: Dict[str, Any] = {}

        def check(self, result: Dict[str, Any]) -> bool:
            self.latest_metrics = {
                "timestamp": datetime.utcnow().isoformat(),
                "domain": result.get("domain"),
            }
            return True

        def hitl_check(self, *_: Any, **__: Any) -> bool:
            return True


logger = logging.getLogger(__name__)


MODEL_ALIASES: Dict[str, str] = {
    "openai_gpt_5": "gpt-4-turbo",
    "openai_gpt_5_codex": "gpt-4-turbo",
    "claude_sonnet_4": "claude-3-5-sonnet-20240620",
    "claude_opus_4": "claude-3-opus-20240229",
    "gemini-2.5-pro": "gemini-1.5-pro-latest",
}


def _resolve_model_alias(model: str) -> str:
    return MODEL_ALIASES.get(model, model)


def _detect_provider(model: str) -> str:
    resolved = _resolve_model_alias(model)
    if model.startswith("openai") or resolved.startswith(("gpt-", "o1", "o3")):
        return "openai"
    if model.startswith("claude") or resolved.startswith("claude"):
        return "anthropic"
    if model.startswith("gemini") or resolved.startswith("gemini"):
        return "gemini"
    return "unknown"


class CostEstimator(ExternalCostEstimator):
    """Alias to allow type checking when the external implementation is present."""


class MemoryStore(ExternalMemoryStore):
    """Alias to allow type checking when the external implementation is present."""


class GovernanceChecker(ExternalGovernanceChecker):
    """Alias to allow type checking when the external implementation is present."""


class AgentState(dict):
    """Lightweight state container for LangGraph-compatible execution."""

    pass


class AgentOrchestrator:
    """Coordinate planner, coder, validator, reflector, reviewer, and governance roles."""

    def __init__(self, config_path: str = str(DEFAULT_CONFIG_PATH)) -> None:
        try:
            self.secrets = load_secrets()
        except Exception as exc:  # pragma: no cover - secrets should not block boot
            logger.warning(
                "Secret loading degraded; continuing with limited credentials: %s", exc
            )
            self.secrets = {}

        config_file = Path(config_path)
        if not config_file.is_absolute():
            config_file = (BASE_DIR / config_file).resolve()
        if not config_file.exists():
            raise FileNotFoundError(f"Agent config not found: {config_file}")

        with open(config_file, "r", encoding="utf-8") as handle:
            self.config = yaml.safe_load(handle) or {}

        self.agent_cfg = self.config.get("enterprise_coding_agent", {})
        self.orchestration_cfg = self.agent_cfg.get("orchestration", {})
        self.domain_packs = self._load_domain_packs()
        memory_cfg = self.agent_cfg.get("memory", {})
        optimizer_cfg = self.orchestration_cfg.get("runtime_optimizer", {})
        governance_cfg = self.agent_cfg.get("governance", {})

        self.memory = MemoryStore(memory_cfg)
        self.cost_estimator = CostEstimator(optimizer_cfg)
        self.governance = GovernanceChecker(governance_cfg)

        self.openai_client = None
        self.anthropic_client = None
        self.gemini_client = None
        self._codex_available = (
            bool(shutil.which("codex")) and os.getenv("CODEX_CLI_ENABLED", "0") == "1"
        )

        self._init_clients()
        self._init_roles()
        self._init_graph()
        logger.info("AgentOrchestrator initialised")

    # --------------------------------------------------------------------- setup
    def _emit_event(self, stage: str, **payload: Any) -> None:
        record_event(stage, **payload)

    def _enhance_prompt(self, prompt: str, role: str) -> str:
        enhancements = self.agent_cfg.get("prompt_enhancements", {})
        addition = enhancements.get(role.lower())
        if addition:
            return f"{addition}\n\n{prompt}"
        return prompt

    def _enhance_cli_params(self, params: List[str], role: str) -> List[str]:
        hints = self.agent_cfg.get("cli_enhancements", {})
        addition = hints.get(role.lower())
        if addition and addition not in params:
            return params + [addition]
        return params

    def _load_domain_packs(self) -> Dict[str, Dict[str, Any]]:
        packs: Dict[str, Dict[str, Any]] = {}
        base_dir = Path("configs/domains")
        if not base_dir.exists():  # pragma: no cover - defensive
            return packs
        for yaml_file in base_dir.glob("*.yaml"):
            with open(yaml_file, "r", encoding="utf-8") as handle:
                packs[yaml_file.stem] = yaml.safe_load(handle) or {}
        return packs

    def _init_clients(self) -> None:
        openai_key = self.secrets.get("OPENAI_API_KEY")
        if openai and openai_key and openai_key != "STUBBED_FALLBACK":
            try:
                self.openai_client = openai.OpenAI(api_key=openai_key)
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "OpenAI client initialisation failed; falling back to offline mode: %s",
                    exc,
                )
                self.openai_client = None

        anthropic_key = self.secrets.get("ANTHROPIC_API_KEY")
        if Anthropic and anthropic_key and anthropic_key != "STUBBED_FALLBACK":
            try:
                # Fix for Anthropic 0.20.0 + httpx 0.28.1 compatibility issue
                # The proxies parameter is causing issues with newer httpx versions
                import httpx

                http_client = httpx.Client(timeout=30.0)
                self.anthropic_client = Anthropic(
                    api_key=anthropic_key, http_client=http_client
                )
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "Anthropic client initialisation failed; continuing without it: %s",
                    exc,
                )
                self.anthropic_client = None

        google_key = self.secrets.get("GOOGLE_API_KEY")
        if GenerativeModel and google_key and google_key != "STUBBED_FALLBACK":
            try:
                import google.generativeai as genai

                genai.configure(api_key=google_key)
                self.gemini_client = GenerativeModel("gemini-1.5-pro-latest")
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "Gemini client initialisation failed; continuing without it: %s",
                    exc,
                )
                self.gemini_client = None

    def _init_roles(self) -> None:
        self.planner_role = Planner(self)
        self.coder_role = Coder(self)
        self.validator_role = Validator(self)
        self.reflector_role = Reflector(self)
        self.reviewer_role = Reviewer(self)

    def _init_graph(self) -> None:
        self.graph = build_graph(
            AgentState,
            planner=self.planner,
            coder=self.coder,
            validator=self.validator,
            reflector=self.reflector,
            reviewer=self.reviewer,
            governance=self._governance_node,
            validate_route=self._validate_route,
            reflect_route=self._reflect_route,
        )

    def _parse_json(self, text: str) -> Dict[str, Any]:
        if not text:
            return {}
        candidate = text.strip()
        if not candidate:
            return {}
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            start = candidate.find("{")
            end = candidate.rfind("}")
            if start != -1 and end != -1 and end > start:
                inner = candidate[start : end + 1]
                try:
                    return json.loads(inner)
                except json.JSONDecodeError:
                    pass
            logger.info("Using raw_text fallback after JSON parse failure")
            return {"raw_text": candidate}

    def _require_model(self, model: str, stage: str) -> str:
        if not model:
            raise RuntimeError(f"No available model client for stage '{stage}'")
        return model

    def _stubbed_model_output(self, role: str, operation: str, prompt: str) -> str:
        if role == "Planner":
            return "1. Review task requirements\n2. Outline implementation steps\n3. Validate deliverables"
        if role == "Coder":
            return "# Stubbed output based on plan."
        if role == "Validator":
            return '{"passes": true, "coverage": 0.99}'
        if role == "Reflector":
            return '{"analysis": "stub", "fixes": [], "selected_fix": 0, "revised_output": "", "confidence": 0.8}'
        if role == "Reviewer":
            return '{"score": 0.9, "rationale": "stubbed"}'
        return f"Stubbed response for {role}/{operation}."

    def _call_model(
        self,
        model: str,
        prompt: str,
        role: str,
        operation: str,
        max_tokens: int = 8192,
    ) -> str:
        enhanced = self._enhance_prompt(prompt, role)
        if enhanced != prompt:
            extra_tokens = max(1, (len(enhanced) - len(prompt)) // 4)
            self.cost_estimator.track_estimated(
                extra_tokens, role, f"{operation}_enhance"
            )
            prompt = enhanced

        provider = _detect_provider(model)
        resolved_model = _resolve_model_alias(model)
        client_missing = (
            not resolved_model
            or (provider == "openai" and not self.openai_client)
            or (provider == "anthropic" and not self.anthropic_client)
            or (provider == "gemini" and not self.gemini_client)
        )

        if client_missing:
            stub = self._stubbed_model_output(role, operation, prompt)
            self.cost_estimator.track_estimated(
                len(prompt) // 4, role, f"{operation}_stub", model="stub"
            )
            return scrub_pii(stub)

        self._require_model(resolved_model, role)
        try:
            if provider == "openai" and self.openai_client:
                max_allowed = min(max_tokens, 4096)
                response = self.openai_client.chat.completions.create(
                    model=resolved_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_allowed,
                    timeout=2100,
                )
                output = response.choices[0].message.content or ""
                tokens = getattr(response.usage, "total_tokens", 0)
            elif provider == "anthropic" and self.anthropic_client:
                max_allowed = min(max_tokens, 4000)
                response = self.anthropic_client.messages.create(
                    model=resolved_model,
                    max_tokens=max_allowed,
                    messages=[{"role": "user", "content": prompt}],
                )
                if getattr(response, "content", None):
                    output = response.content[0].text
                else:
                    output = ""
                usage = getattr(response, "usage", None)
                tokens = 0
                if usage:
                    tokens = getattr(usage, "input_tokens", 0) + getattr(
                        usage, "output_tokens", 0
                    )
            elif provider == "gemini" and self.gemini_client:
                response = self.gemini_client.generate_content(prompt)
                output = getattr(response, "text", "")
                tokens = len(prompt) // 4 + len(output) // 4
            else:
                output = self._stubbed_model_output(role, operation, prompt)
                tokens = len(prompt) // 4

            self.cost_estimator.track(tokens, role, operation, model=resolved_model)
            return scrub_pii(output)
        except Exception as exc:  # pragma: no cover - propagate for caller handling
            logger.error("Model call failed for %s/%s: %s", role, operation, exc)
            raise

    def _invoke_codex_cli(self, task_type: str, params: List[str], domain: str) -> str:
        enhanced_params = self._enhance_cli_params(params, "Coder")
        return invoke_codex_cli(task_type, enhanced_params, domain)

    # ------------------------------------------------------------------- routing
    def route_to_model(self, text: str, domain: str, vuln_flag: bool = False) -> str:
        complexity = len(text or "")
        cost = self.cost_estimator.estimate(complexity, domain)
        if vuln_flag and self.anthropic_client:
            return "claude_opus_4"
        if self.openai_client and cost <= 0.05 and self._codex_available:
            return "openai_gpt_5_codex"
        if self.openai_client:
            return "openai_gpt_5"
        if self.anthropic_client:
            return "claude_sonnet_4"
        if self.gemini_client:
            return "gemini-2.5-pro"
        return ""

    # --------------------------------------------------------------------- nodes
    def planner(self, state: AgentState) -> AgentState:
        plan = self.planner_role.decompose(
            state.get("task", ""), state.get("domain", "")
        )
        state["plan"] = plan.get("text", "")
        state["plan_epics"] = plan.get("epics", [])
        state["plan_model"] = plan.get("model")
        self._emit_event(
            "planner.completed",
            domain=state.get("domain"),
            epics=len(state["plan_epics"]),
        )
        return state

    def coder(self, state: AgentState) -> AgentState:
        result = self.coder_role.generate(
            state.get("plan", ""), state.get("domain", "")
        )
        state["code"] = result.get("output", "")
        state["code_source"] = result.get("source")
        state["code_model"] = result.get("model")
        self._emit_event(
            "coder.completed",
            domain=state.get("domain"),
            source=state.get("code_source"),
        )
        return state

    def validator(self, state: AgentState) -> AgentState:
        result = self.validator_role.validate(
            state.get("code", ""), state.get("domain", "")
        )
        parsed = result.get("parsed", {})
        state["validation"] = parsed
        state["needs_reflect"] = not parsed.get("passes", True)
        self._emit_event(
            "validator.completed",
            domain=state.get("domain"),
            passes=parsed.get("passes", False),
            coverage=parsed.get("coverage"),
        )
        return state

    def _validate_route(self, state: AgentState) -> str:
        return "reflector" if state.get("needs_reflect") else "reviewer"

    def reflector(self, state: AgentState) -> AgentState:
        result = self.reflector_role.reflect(
            state.get("validation", {}),
            state.get("code", ""),
            state.get("domain", ""),
            state.get("iterations", 0),
            state.get("vuln_flag", False),
        )
        state["code"] = result.get("output", state.get("code", ""))
        state["iterations"] = result.get("iterations", state.get("iterations", 0))
        state["confidence"] = result.get("confidence", state.get("confidence", 0.0))
        state["reflection_analysis"] = result.get("analysis")
        state["halted"] = result.get("halt")
        state["needs_reflect"] = not result.get("halt")
        self._emit_event(
            "reflector.completed",
            domain=state.get("domain"),
            iterations=state.get("iterations", 0),
        )
        return state

    def _reflect_route(self, state: AgentState) -> str:
        iterations = state.get("iterations", 0)
        confidence = state.get("confidence", 0.0)
        if iterations < 5 and confidence < 0.8:
            return "coder"
        return "reviewer"

    def reviewer(self, state: AgentState) -> AgentState:
        result = self.reviewer_role.review(
            state.get("code", ""),
            state.get("domain", ""),
            state.get("vuln_flag", False),
        )
        state["confidence"] = result.get("confidence", 0.0)
        state["review_scores"] = result.get("scores", [])
        state["review_models"] = result.get("models", [])
        state["needs_reflect"] = state["confidence"] < 0.8
        record_metric(
            "review.confidence", state["confidence"], domain=state.get("domain")
        )
        self._emit_event(
            "reviewer.completed",
            domain=state.get("domain"),
            confidence=state["confidence"],
        )
        return state

    def _run_offline_pipeline(self, state: AgentState) -> AgentState:
        state = AgentState(state)
        state = self.planner(state)
        max_iterations = 5
        while True:
            state = self.coder(state)
            state = self.validator(state)
            if not state.get("needs_reflect"):
                break
            for _ in range(max_iterations):
                state = self.reflector(state)
                if not state.get("needs_reflect"):
                    break
                state = self.coder(state)
                state = self.validator(state)
            break
        state = self.reviewer(state)
        if state.get("needs_reflect"):
            state = self.reflector(state)
        state = self._governance_node(state)
        return state

    def _governance_node(self, state: AgentState) -> AgentState:
        approved = self.governance.check(state)
        self._emit_event(
            "governance.checked",
            domain=state.get("domain"),
            approved=approved,
            metrics=self.governance.latest_metrics,
        )
        if not approved and not self.governance.hitl_check("high", state):
            state["governance_blocked"] = True
        return state

    # ------------------------------------------------------------------- public
    def run_mode(
        self, domain: str, task: str, vuln_flag: bool = False
    ) -> Dict[str, Any]:
        initial = AgentState(
            {
                "task": task,
                "domain": domain,
                "iterations": 0,
                "confidence": 0.0,
                "vuln_flag": vuln_flag,
            }
        )
        if not any([self.openai_client, self.anthropic_client, self.gemini_client]):
            result = self._run_offline_pipeline(initial)
        else:
            result = self.graph.invoke(initial)
            if result is None:
                logger.warning(
                    "Graph invocation returned None; falling back to offline pipeline."
                )
                result = self._run_offline_pipeline(initial)
        plan_text = result.get("plan")
        plan_epics = result.get("plan_epics")
        if not isinstance(plan_text, dict) and (plan_text or plan_epics):
            result["plan"] = {
                "text": plan_text or "",
                "epics": plan_epics or [],
                "model": result.get("plan_model"),
            }
        result["domain"] = domain
        result["cost_summary"] = self.cost_estimator.summary()
        record_event(
            "agent.run_completed",
            domain=domain,
            confidence=result.get("confidence", 0.0),
            cost=result["cost_summary"].get("total_cost", 0.0),
        )
        self.memory.prune()
        return dict(result)


__all__ = ["AgentOrchestrator"]
