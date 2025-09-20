import asyncio
import sys
from pathlib import Path

import pytest

sys.path.append(str((Path(__file__).resolve().parents[1] / "src")))

from agent_coordinator import (
    AgentCoordinator,
    AgentResult,
    AgentAdapter,
    AgentExecutionError,
)


class StubAdapter(AgentAdapter):
    def __init__(self, name: str, result: AgentResult, estimate: float = 0.05):
        super().__init__({})
        self.name = name
        self._result = result
        self._estimate = estimate

    def estimate_cost(self, request):
        return self._estimate

    async def run(self, request, remaining_budget, metadata):
        return self._result


def test_single_mode_primary_success():
    env = {"AGENT_MODE": "single", "AGENT_BUDGET_DEFAULT": "0.20"}
    coordinator = AgentCoordinator(env)
    primary_result = AgentResult(
        success=True,
        output={"code": "print('hi')"},
        confidence=0.95,
        cost_estimate=0.05,
        cost_actual=0.04,
        validation={},
        agent="stub-primary",
    )
    coordinator.primary_adapter = StubAdapter("stub-primary", primary_result)
    coordinator.secondary_adapter = StubAdapter("stub-secondary", primary_result)

    outcome = asyncio.run(coordinator.run_task("Do something", {"json_graph": "{}"}))

    assert outcome.result.agent == "stub-primary"
    assert outcome.budget_consumed == pytest.approx(0.04)
    assert outcome.fallback_used is False


def test_fallback_triggers_on_low_confidence():
    env = {
        "AGENT_MODE": "fallback",
        "AGENT_CONFIDENCE_THRESHOLD": "0.8",
        "AGENT_BUDGET_DEFAULT": "0.30",
    }
    coordinator = AgentCoordinator(env)

    low_conf_primary = AgentResult(
        success=True,
        output={},
        confidence=0.3,
        cost_estimate=0.05,
        cost_actual=0.05,
        validation={},
        agent="primary",
    )
    strong_secondary = AgentResult(
        success=True,
        output={"plan": "fallback"},
        confidence=0.9,
        cost_estimate=0.02,
        cost_actual=0.02,
        validation={},
        agent="secondary",
    )

    coordinator.primary_adapter = StubAdapter("primary", low_conf_primary)
    coordinator.secondary_adapter = StubAdapter("secondary", strong_secondary)

    outcome = asyncio.run(coordinator.run_task("Task", {"json_graph": "{}"}))

    assert outcome.result.agent == "secondary"
    assert outcome.fallback_used is True
    assert len(outcome.trace) == 2


def test_budget_enforcement_prevents_expensive_run():
    env = {
        "AGENT_MODE": "single",
        "AGENT_BUDGET_DEFAULT": "0.05",
        "AGENT_BUDGET_MAX": "0.05",
    }
    coordinator = AgentCoordinator(env)

    expensive_result = AgentResult(
        success=True,
        output={},
        confidence=1.0,
        cost_estimate=0.2,
        cost_actual=0.2,
        validation={},
        agent="expensive",
    )
    coordinator.primary_adapter = StubAdapter("expensive", expensive_result, estimate=0.2)

    with pytest.raises(AgentExecutionError) as excinfo:
        asyncio.run(coordinator.run_task("Task", {"json_graph": "{}"}))

    assert excinfo.value.code == "COST-401"