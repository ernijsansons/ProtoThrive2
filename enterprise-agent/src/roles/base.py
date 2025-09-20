"""Role primitives leveraged by the agent orchestrator."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict

if TYPE_CHECKING:  # pragma: no cover - for linting only
    from src.agent_orchestrator import AgentOrchestrator


class BaseRole:
    """Shared helpers for role implementations."""

    def __init__(self, orchestrator: "AgentOrchestrator") -> None:
        self.orchestrator = orchestrator

    # ------------------------------------------------------------------ helpers
    def call_model(self, model: str, prompt: str, role: str, operation: str) -> str:
        return self.orchestrator._call_model(model, prompt, role, operation)

    def route_to_model(self, text: str, domain: str, vuln_flag: bool = False) -> str:
        return self.orchestrator.route_to_model(text, domain, vuln_flag)

    def domain_pack(self, domain: str) -> Dict[str, Any]:
        return self.orchestrator.domain_packs.get(domain, {})

    def invoke_codex_cli(self, task_type: str, params: list[str], domain: str) -> str:
        return self.orchestrator._invoke_codex_cli(task_type, params, domain)

    def parse_json(self, text: str) -> Dict[str, Any]:
        return self.orchestrator._parse_json(text)

    def store_memory(self, scope: str, key: str, value: Any) -> None:
        self.orchestrator.memory.store(scope, key, value)

    def telemetry(self, event: Dict[str, Any]) -> None:
        telemetry = getattr(self.orchestrator, "telemetry", None)
        if callable(telemetry):
            telemetry(event)


__all__ = ["BaseRole"]
