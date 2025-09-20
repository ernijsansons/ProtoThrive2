"""Database utilities for ProtoThrive Cloudflare Worker."""
from __future__ import annotations

import json
import uuid
from typing import Any, List, Optional, TypedDict, Union, Mapping

from pydantic import BaseModel


class User(TypedDict):
    id: str
    email: str
    role: str
    created_at: str
    deleted_at: Optional[str]


class Roadmap(TypedDict):
    id: str
    user_id: str
    json_graph: str
    status: str
    vibe_mode: int
    thrive_score: float
    created_at: str
    updated_at: str


class Snippet(TypedDict):
    id: str
    category: str
    code: str
    ui_preview_url: Optional[str]
    version: int
    created_at: str
    updated_at: str


class AgentLog(TypedDict):
    id: str
    roadmap_id: str
    task_type: str
    output: str
    status: str
    model_used: str
    token_count: int
    timestamp: str


class Insight(TypedDict):
    id: str
    roadmap_id: str
    type: str
    data: str
    score: float
    created_at: str


class AgentRunRecord(TypedDict):
    id: str
    user_id: Optional[str]
    roadmap_id: Optional[str]
    task: str
    mode: str
    confidence: float
    cost_estimate: float
    cost_actual: float
    cost_consumed: float
    cost_remaining: float
    fallback_used: int
    metadata_json: Optional[str]
    context_json: Optional[str]


class AgentRunTraceRecord(TypedDict):
    id: str
    run_id: str
    agent: str
    success: int
    confidence: float
    cost: float
    error: Optional[str]
    report_url: Optional[str]


def _to_mapping(payload: Union[BaseModel, Mapping[str, Any]]) -> Mapping[str, Any]:
    if isinstance(payload, BaseModel):
        return payload.model_dump()
    return payload


def _convert_roadmap_vibe_mode(roadmap_data: Mapping[str, Any]) -> Roadmap:
    mutable = dict(roadmap_data)
    mutable["vibe_mode"] = bool(mutable.get("vibe_mode", 0))
    return mutable  # type: ignore[return-value]


async def queryRoadmap(id: str, user_id: str, env: Any) -> Roadmap:
    try:
        stmt = env["DB"].prepare(
            "SELECT * FROM roadmaps WHERE id = ? AND user_id = ?"
        ).bind(id, user_id)
        result = await stmt.first()
        if not result:
            raise ValueError({"code": "GRAPH-404", "message": "Roadmap not found"})
        return _convert_roadmap_vibe_mode(result)
    except Exception as exc:
        if isinstance(exc, ValueError) and getattr(exc, "args", []) and exc.args[0].get("code") == "GRAPH-404":
            raise
        raise ValueError({"code": "DB-500", "message": str(exc) or "Database error"})


async def queryUserRoadmaps(user_id: str, status: Optional[str], env: Any) -> List[Roadmap]:
    try:
        query = "SELECT * FROM roadmaps WHERE user_id = ?"
        binds: List[Any] = [user_id]
        if status:
            query += " AND status = ?"
            binds.append(status)
        query += " ORDER BY updated_at DESC"
        stmt = env["DB"].prepare(query).bind(*binds)
        results = await stmt.all()
        return [_convert_roadmap_vibe_mode(row) for row in results]
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to query roadmaps"})


async def insertRoadmap(user_id: str, body: Union[BaseModel, Mapping[str, Any]], env: Any) -> dict:
    payload = _to_mapping(body)
    try:
        roadmap_id = str(uuid.uuid4())
        stmt = env["DB"].prepare(
            "INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) "
            "VALUES (?, ?, ?, 'draft', ?, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ).bind(
            roadmap_id,
            user_id,
            payload.get("json_graph"),
            1 if payload.get("vibe_mode") else 0,
        )
        await stmt.run()
        return {"id": roadmap_id}
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to insert roadmap"})


async def updateRoadmapStatus(id: str, user_id: str, status: str, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            "UPDATE roadmaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
        ).bind(status, id, user_id)
        result = await stmt.run()
        if result["meta"]["changes"] == 0:
            raise ValueError({"code": "GRAPH-404", "message": "Roadmap not found or unauthorized"})
    except Exception as exc:
        if isinstance(exc, ValueError) and getattr(exc, "args", []) and exc.args[0].get("code") == "GRAPH-404":
            raise
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to update status"})


async def updateRoadmapScore(id: str, score: float, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            "UPDATE roadmaps SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(score, id)
        await stmt.run()
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to update thrive score"})


async def querySnippets(category: Optional[str], env: Any) -> List[Snippet]:
    try:
        query = "SELECT * FROM snippets"
        binds: List[Any] = []
        if category:
            query += " WHERE category = ?"
            binds.append(category)
        query += " ORDER BY updated_at DESC"
        stmt = env["DB"].prepare(query)
        if binds:
            stmt = stmt.bind(*binds)
        results = await stmt.all()
        return results
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to query snippets"})


async def insertSnippet(snippet: Union[BaseModel, Mapping[str, Any]], env: Any) -> dict:
    payload = _to_mapping(snippet)
    try:
        snippet_id = str(uuid.uuid4())
        stmt = env["DB"].prepare(
            "INSERT INTO snippets (id, category, code, ui_preview_url, version, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ).bind(
            snippet_id,
            payload.get("category"),
            payload.get("code"),
            payload.get("ui_preview_url"),
        )
        await stmt.run()
        return {"id": snippet_id}
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to insert snippet"})


async def insertAgentLog(log: Union[BaseModel, Mapping[str, Any]], env: Any) -> dict:
    payload = _to_mapping(log)
    try:
        log_id = str(uuid.uuid4())
        stmt = env["DB"].prepare(
            "INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        ).bind(
            log_id,
            payload.get("roadmap_id"),
            payload.get("task_type"),
            payload.get("output"),
            payload.get("status"),
            payload.get("model_used"),
            payload.get("token_count"),
        )
        await stmt.run()
        return {"id": log_id}
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to insert agent log"})


async def queryAgentLogs(roadmap_id: str, env: Any) -> List[AgentLog]:
    try:
        stmt = env["DB"].prepare(
            "SELECT * FROM agent_logs WHERE roadmap_id = ? ORDER BY timestamp DESC"
        ).bind(roadmap_id)
        results = await stmt.all()
        return results
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to query agent logs"})


async def insertInsight(insight: Union[BaseModel, Mapping[str, Any]], env: Any) -> dict:
    payload = _to_mapping(insight)
    try:
        insight_id = str(uuid.uuid4())
        stmt = env["DB"].prepare(
            "INSERT INTO insights (id, roadmap_id, type, data, score, created_at) "
            "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        ).bind(
            insight_id,
            payload.get("roadmap_id"),
            payload.get("type"),
            payload.get("data"),
            payload.get("score"),
        )
        await stmt.run()
        return {"id": insight_id}
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to insert insight"})


async def softDeleteUser(user_id: str, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(user_id)
        await stmt.run()
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to soft delete user"})


async def queryUser(user_id: str, env: Any) -> Optional[User]:
    try:
        stmt = env["DB"].prepare("SELECT * FROM users WHERE id = ?").bind(user_id)
        result = await stmt.first()
        if not result:
            return None
        return result
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to query user"})


async def insertAgentRun(
    run: Union[BaseModel, Mapping[str, Any]],
    trace: List[Union[BaseModel, Mapping[str, Any]]],
    env: Any,
) -> AgentRunRecord:
    payload = dict(_to_mapping(run))
    run_id = payload.get("run_id") or str(uuid.uuid4())
    record: AgentRunRecord = {
        "id": run_id,
        "user_id": payload.get("user_id"),
        "roadmap_id": payload.get("roadmap_id"),
        "task": payload.get("task"),
        "mode": payload.get("mode"),
        "confidence": float(payload.get("confidence", 0.0)),
        "cost_estimate": float(payload.get("cost", {}).get("estimate", 0.0)),
        "cost_actual": float(payload.get("cost", {}).get("actual", 0.0)),
        "cost_consumed": float(payload.get("budget_consumed", payload.get("cost", {}).get("consumed", 0.0))),
        "cost_remaining": float(payload.get("budget_remaining", payload.get("cost", {}).get("remaining", 0.0))),
        "fallback_used": 1 if payload.get("fallback_used") else 0,
        "metadata_json": json.dumps(payload.get("metadata")) if payload.get("metadata") else None,
        "context_json": json.dumps(payload.get("context")) if payload.get("context") else None,
    }

    try:
        stmt = env["DB"].prepare(
            "INSERT INTO agent_runs (id, user_id, roadmap_id, task, mode, confidence, cost_estimate, cost_actual, cost_consumed, cost_remaining, fallback_used, metadata_json, context_json, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        ).bind(
            record["id"],
            record["user_id"],
            record["roadmap_id"],
            record["task"],
            record["mode"],
            record["confidence"],
            record["cost_estimate"],
            record["cost_actual"],
            record["cost_consumed"],
            record["cost_remaining"],
            record["fallback_used"],
            record["metadata_json"],
            record["context_json"],
        )
        await stmt.run()

        for item in trace:
            trace_payload = _to_mapping(item)
            trace_id = str(uuid.uuid4())
            trace_record: AgentRunTraceRecord = {
                "id": trace_id,
                "run_id": record["id"],
                "agent": trace_payload.get("agent"),
                "success": 1 if trace_payload.get("success") else 0,
                "confidence": float(trace_payload.get("confidence", 0.0)),
                "cost": float(trace_payload.get("cost", 0.0)),
                "error": trace_payload.get("error"),
                "report_url": trace_payload.get("report_url"),
            }
            stmt_trace = env["DB"].prepare(
                "INSERT INTO agent_run_traces (id, run_id, agent, success, confidence, cost, error, report_url, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
            ).bind(
                trace_record["id"],
                trace_record["run_id"],
                trace_record["agent"],
                trace_record["success"],
                trace_record["confidence"],
                trace_record["cost"],
                trace_record["error"],
                trace_record["report_url"],
            )
            await stmt_trace.run()
        return record
    except Exception as exc:
        raise ValueError({"code": "DB-500", "message": str(exc) or "Failed to insert agent run"})
