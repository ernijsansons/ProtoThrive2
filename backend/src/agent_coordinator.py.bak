"""Agent coordination layer for ProtoThrive backend.

Provides cost-aware orchestration across the Enterprise Agent and
backup lightweight agent. Supports multiple execution modes
(single, fallback, ensemble) and enforces per-request budgets.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

try:
    from js import fetch  # type: ignore
except ImportError:  # pragma: no cover - local execution fallback
    fetch = None  # pyright: ignore


class AgentExecutionError(Exception):
    """Raised when an agent run fails or budget constraints are violated."""

    def __init__(self, message: str, *, code: str = "AGENT-500", status: int = 500, metadata: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status
        self.metadata = metadata or {}


@dataclass
class AgentResult:
    success: bool
    output: Dict[str, Any]
    confidence: float
    cost_estimate: float
    cost_actual: float
    validation: Dict[str, Any] = field(default_factory=dict)
    agent: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class CoordinatorOutcome:
    """Aggregated outcome returned to the API layer."""

    result: AgentResult
    trace: List[AgentResult]
    mode: str
    budget_consumed: float
    budget_remaining: float
    fallback_used: bool


@dataclass
class AgentRequest:
    task: str
    context: Dict[str, Any]


class AgentAdapter:
    """Base class for all agent adapters."""

    name: str = "base"
    default_cost_estimate: float = 0.05

    def __init__(self, env: Dict[str, Any]):
        self.env = env

    def estimate_cost(self, request: AgentRequest) -> float:
        return self.default_cost_estimate

    async def run(self, request: AgentRequest, remaining_budget: float, metadata: Dict[str, Any]) -> AgentResult:
        raise NotImplementedError


class EnterpriseAgentAdapter(AgentAdapter):
    """Adapter that delegates to the Enterprise Coding Agent CLI/API."""

    name = "enterprise"
    default_cost_estimate = 0.12

    async def run(self, request: AgentRequest, remaining_budget: float, metadata: Dict[str, Any]) -> AgentResult:
        endpoint = self.env.get("ENTERPRISE_AGENT_URL")
        if not endpoint:
            raise AgentExecutionError(
                "ENTERPRISE_AGENT_URL not configured", code="ENT-404", status=501
            )

        headers = {"Content-Type": "application/json"}
        token = self.env.get("ENTERPRISE_AGENT_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"

        payload = {
            "task": request.task,
            "context": request.context,
            "budget": remaining_budget,
            "mode": metadata.get("mode"),
        }

        response_status, response_text = await _http_post(endpoint, payload, headers)
        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as exc:  # pragma: no cover - network edge case
            raise AgentExecutionError("Invalid response from Enterprise Agent", code="ENT-500") from exc

        success = bool(data.get("success", True))
        confidence = float(data.get("confidence", 0.0))
        cost_summary = data.get("cost_summary") or {}
        validation = data.get("validation") or {}
        output: Dict[str, Any] = {}
        if isinstance(data.get("output"), dict):
            output = data["output"]
        elif data.get("code"):
            output = {"code": data.get("code")}

        return AgentResult(
            success=success,
            output=output,
            confidence=confidence,
            cost_estimate=float(cost_summary.get("estimate", self.default_cost_estimate)),
            cost_actual=float(cost_summary.get("actual", cost_summary.get("total_cost", self.default_cost_estimate))),
            validation=validation,
            agent=self.name,
            raw=data,
            error=data.get("error"),
        )


class LightweightAgentAdapter(AgentAdapter):
    """Adapter that reuses the lightweight Python orchestrator as fallback."""

    name = "lightweight"
    default_cost_estimate = 0.02

    async def run(self, request: AgentRequest, remaining_budget: float, metadata: Dict[str, Any]) -> AgentResult:
        try:
            from src.core import orchestrator  # Lazy import to avoid heavy dependency at cold start
        except Exception as exc:  # pragma: no cover - import failure
            raise AgentExecutionError("Lightweight orchestrator unavailable", code="LITE-404", metadata={"detail": str(exc)}) from exc

        json_graph = request.context.get("json_graph")
        if not isinstance(json_graph, str):
            json_graph = json.dumps(request.context.get("graph", {"nodes": [], "edges": []}))

        try:
            outputs = orchestrator.orchestrate(json_graph)
        except Exception as exc:
            raise AgentExecutionError("Lightweight agent execution failed", code="LITE-500", metadata={"detail": str(exc)}) from exc

        success = bool(outputs)
        confidence = 0.55 if success else 0.2
        return AgentResult(
            success=success,
            output={"generated": outputs},
            confidence=confidence,
            cost_estimate=self.default_cost_estimate,
            cost_actual=self.default_cost_estimate,
            validation={},
            agent=self.name,
            raw={"outputs": outputs},
            error=None if success else "No output generated",
        )


class AgentCoordinator:
    """Cost-aware agent coordination and fallback logic."""

    def __init__(self, env: Dict[str, Any]):
        self.env = env
        self.mode = env.get("AGENT_MODE", "single").lower()
        self.default_budget = float(env.get("AGENT_BUDGET_DEFAULT", "0.40"))
        self.max_budget = float(env.get("AGENT_BUDGET_MAX", "1.00"))
        self.fallback_min_budget = float(env.get("AGENT_BUDGET_FALLBACK_MIN", "0.05"))
        self.confidence_threshold = float(env.get("AGENT_CONFIDENCE_THRESHOLD", "0.8"))
        self.parallel_secondary = env.get("AGENT_PARALLEL_SECONDARY", "false").lower() == "true"

        self.primary_adapter = EnterpriseAgentAdapter(env)
        self.secondary_adapter = LightweightAgentAdapter(env)

    async def run_task(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        *,
        budget: Optional[float] = None,
        mode_override: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CoordinatorOutcome:
        if not task:
            raise AgentExecutionError("Task prompt is required", code="REQ-400", status=400)

        mode = (mode_override or self.mode or "single").lower()
        remaining_budget = min(self.max_budget, budget or self.default_budget)
        if remaining_budget <= 0:
            raise AgentExecutionError("Budget exhausted", code="COST-400", status=402)

        request = AgentRequest(task=task, context=context or {})
        metadata = metadata or {}

        trace: List[AgentResult] = []
        budget_consumed = 0.0

        primary_result, remaining_budget = await self._attempt_adapter(
            self.primary_adapter, request, remaining_budget, metadata
        )
        trace.append(primary_result)
        budget_consumed += primary_result.cost_actual

        use_secondary = False
        if mode == "fallback":
            use_secondary = (not primary_result.success) or (primary_result.confidence < self.confidence_threshold)
        elif mode == "ensemble":
            use_secondary = True

        secondary_result: Optional[AgentResult] = None
        if use_secondary and remaining_budget >= self.fallback_min_budget:
            secondary_result, remaining_budget = await self._attempt_adapter(
                self.secondary_adapter, request, remaining_budget, metadata, skip_on_error=True
            )
            if secondary_result:
                trace.append(secondary_result)
                budget_consumed += secondary_result.cost_actual

        chosen = self._select_result(trace, mode)
        fallback_used = any(result.agent != chosen.agent for result in trace if result.success)

        if not chosen.success:
            raise AgentExecutionError(
                "No agent produced a successful result",
                code="AGENT-417",
                status=502,
                metadata={"trace": [self._result_metadata(r) for r in trace]},
            )

        return CoordinatorOutcome(
            result=chosen,
            trace=trace,
            mode=mode,
            budget_consumed=budget_consumed,
            budget_remaining=remaining_budget,
            fallback_used=fallback_used,
        )

    async def _attempt_adapter(
        self,
        adapter: AgentAdapter,
        request: AgentRequest,
        remaining_budget: float,
        metadata: Dict[str, Any],
        *,
        skip_on_error: bool = False,
    ) -> Tuple[AgentResult, float]:
        estimated_cost = adapter.estimate_cost(request)
        if estimated_cost > remaining_budget:
            raise AgentExecutionError(
                f"Insufficient budget for {adapter.name} (estimate {estimated_cost:.2f})",
                code="COST-401",
                status=402,
                metadata={"adapter": adapter.name, "estimate": estimated_cost, "remaining_budget": remaining_budget},
            )

        try:
            result = await adapter.run(request, remaining_budget, metadata)
        except AgentExecutionError:
            raise
        except Exception as exc:
            if skip_on_error:
                print(f"Agent {adapter.name} failed: {exc}")
                dummy = AgentResult(
                    success=False,
                    output={},
                    confidence=0.0,
                    cost_estimate=estimated_cost,
                    cost_actual=0.0,
                    validation={},
                    agent=adapter.name,
                    raw={"error": str(exc)},
                    error=str(exc),
                )
                return dummy, remaining_budget
            raise AgentExecutionError(
                f"Agent {adapter.name} execution error",
                code="AGENT-500",
                metadata={"adapter": adapter.name, "detail": str(exc)},
            ) from exc

        cost_used = max(result.cost_actual, estimated_cost)
        remaining_budget = max(0.0, remaining_budget - cost_used)
        return result, remaining_budget

    def _select_result(self, results: List[AgentResult], mode: str) -> AgentResult:
        successes = [r for r in results if r.success]
        if not successes:
            return max(results, key=lambda r: r.confidence)
        # Prefer highest confidence; use cost as tiebreaker
        return max(successes, key=lambda r: (r.confidence, -r.cost_actual))

    def _result_metadata(self, result: AgentResult) -> Dict[str, Any]:
        return {
            "agent": result.agent,
            "confidence": result.confidence,
            "cost_actual": result.cost_actual,
            "success": result.success,
            "error": result.error,
        }


def _status_from_code(code: Optional[str]) -> int:
    if not code:
        return 500
    if code.startswith("AUTH-"):
        return 401
    if code.startswith("VAL-"):
        return 400
    if code.startswith("GRAPH-"):
        return 404
    if code.startswith("COST-"):
        return 402
    if code.startswith("HTTP-"):
        try:
            return int(code.split("-")[1])
        except (IndexError, ValueError):
            return 500
    return 500


async def _http_post(url: str, payload: Dict[str, Any], headers: Dict[str, str]) -> Tuple[int, str]:
    """Performs an HTTP POST compatible with both Pyodide and CPython."""

    if fetch is not None:  # Cloudflare Workers / Pyodide environment
        init = {
            "method": "POST",
            "headers": headers,
            "body": json.dumps(payload),
        }
        response = await fetch(url, init)
        text = await response.text()
        return int(response.status), str(text)

    # Local fallback for testing (requires httpx)
    try:  # pragma: no cover - requires optional dependency
        import httpx
    except ImportError as exc:
        raise AgentExecutionError(
            "HTTP client unavailable; install httpx for local execution",
            code="NET-501",
        ) from exc

    async with httpx.AsyncClient(timeout=30.0) as client:  # pragma: no cover - requires httpx
        response = await client.post(url, json=payload, headers=headers)
        return response.status_code, response.text