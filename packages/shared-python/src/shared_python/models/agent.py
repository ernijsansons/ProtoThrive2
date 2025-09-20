"""Shared agent coordination models."""
from __future__ import annotations

from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl

AgentName = Literal["enterprise", "lightweight", "fallback"]
AgentMode = Literal["single", "fallback", "ensemble"]


class AgentCostSummary(BaseModel):
    estimate: float = Field(..., ge=0)
    actual: float = Field(..., ge=0)
    remaining: float = Field(..., ge=0)


class AgentCostDetail(AgentCostSummary):
    consumed: float = Field(..., ge=0)


class AgentTraceItem(BaseModel):
    agent: AgentName
    success: bool
    confidence: float = Field(..., ge=0, le=1)
    cost: float = Field(..., ge=0)
    error: Optional[str] = None
    report_url: Optional[HttpUrl] = Field(
        default=None, description="Optional link to a detailed execution report."
    )


class AgentRunRequest(BaseModel):
    task: str = Field(..., min_length=1)
    context: Dict[str, Any] = Field(default_factory=dict)
    budget: Optional[float] = Field(default=None, ge=0)
    mode: Optional[AgentMode] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentRunResult(BaseModel):
    run_id: str = Field(..., description="Unique identifier for the orchestrated agent run.")
    task: str = Field(..., min_length=1)
    mode: AgentMode
    confidence: float = Field(..., ge=0, le=1)
    fallback_used: bool = Field(
        ..., description="True when the fallback agent produced the final result."
    )
    cost: AgentCostDetail
    trace: list[AgentTraceItem]
    output: Dict[str, Any]
    budget_consumed: float = Field(..., ge=0)
    budget_remaining: float = Field(..., ge=0)
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    user_id: Optional[str] = None
    roadmap_id: Optional[str] = None


__all__ = [
    "AgentName",
    "AgentMode",
    "AgentCostSummary",
    "AgentCostDetail",
    "AgentTraceItem",
    "AgentRunRequest",
    "AgentRunResult",
]
