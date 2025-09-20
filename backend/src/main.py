from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, parse_qs
import json
import uuid

# Cloudflare Workers Python runtime imports
from js import Response, Request

from agent_coordinator import AgentCoordinator, AgentExecutionError

# Ref: CLAUDE.md Terminal 1 & 3 - Main Python Worker Application
# Thermonuclear Backend API for ProtoThrive (Python Cloudflare Worker)

def json_response(payload: Dict[str, Any], status: int = 200, *, headers: Optional[Dict[str, str]] = None) -> Response:
    base_headers = {"Content-Type": "application/json"}
    if headers:
        base_headers.update(headers)
    return Response.new(json.dumps(payload), status=status, headers=base_headers)

def _safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))

def _status_from_code(code: Optional[str]) -> int:
    if not code:
        return 500
    if code.startswith('AUTH-'):
        return 401
    if code.startswith('VAL-'):
        return 400
    if code.startswith('GRAPH-'):
        return 404
    if code.startswith('HTTP-'):
        try:
            return int(code.split('-')[1])
        except (IndexError, ValueError):
            return 500
    return 500


# Import ported utilities
from utils.db import (
    queryRoadmap, insertRoadmap, updateRoadmapStatus, queryUserRoadmaps,
    querySnippets, insertSnippet, insertAgentLog, queryAgentLogs, insertInsight,
    updateRoadmapScore, softDeleteUser, queryUser
)
from utils.validation import (
    validate_roadmap_body, validate_roadmap_update, validate_snippet_body,
    validate_agent_log_body, validate_insight_body, validate_query_params,
    validate_uuid, UserRoleEnum
)

class Worker:
    def __init__(self, env: Dict[str, Any]):
        self.env = env
        self.agent_coordinator = AgentCoordinator(env)

    async def fetch(self, request: Request) -> Response:
        url = urlparse(request.url)
        path = url.path
        method = request.method

        try:
            auth_header = request.headers.get("Authorization")
            user = await self.validate_jwt(auth_header)
            if not user:
                return json_response({"error": "Unauthorized", "code": "AUTH-401"}, status=401)

            if path == "/health":
                return json_response({"status": "ok", "service": "protothrive-backend-python"})

            if path == "/":
                try:
                    result = await self.env["DB"].prepare("SELECT 1 as test").first()
                    return json_response({
                        "status": "Thermonuclear Backend Up - Ready",
                        "db": "Connected" if result else "Not Connected",
                        "service": "protothrive-backend-python",
                        "endpoints": ["/health", "/api/roadmaps", "/api/snippets"]
                    })
                except Exception as e:
                    print(f"Thermonuclear DB Test Error: {e}")
                    return json_response({
                        "status": "Thermonuclear Backend Up - Ready",
                        "db": "Error",
                        "service": "protothrive-backend-python",
                        "endpoints": ["/health", "/api/roadmaps", "/api/snippets"]
                    })

            if path == "/api/agent/run":
                if method != "POST":
                    return json_response({"error": "Method Not Allowed", "code": "HTTP-405"}, status=405)
                try:
                    body = await request.json()
                except Exception:
                    return json_response({"error": "Invalid JSON body", "code": "VAL-400"}, status=400)
                task = body.get("task")
                if not task:
                    return json_response({"error": "Task prompt is required", "code": "VAL-400"}, status=400)

                budget_override = body.get("budget")
                header_budget = request.headers.get("X-Agent-Budget") if hasattr(request, 'headers') else None
                if header_budget and budget_override is None:
                    try:
                        budget_override = float(header_budget)
                    except (TypeError, ValueError):
                        return json_response({"error": "Invalid budget override", "code": "VAL-400"}, status=400)
                if isinstance(budget_override, str):
                    try:
                        budget_override = float(budget_override)
                    except ValueError:
                        return json_response({"error": "Invalid budget override", "code": "VAL-400"}, status=400)

                mode_override = body.get("mode") or (request.headers.get("X-Agent-Mode") if hasattr(request, 'headers') else None)

                header_snapshot = {}
                if hasattr(request, 'headers'):
                    try:
                        header_snapshot = {key: request.headers.get(key) for key in request.headers.keys()}
                    except Exception:
                        header_snapshot = {}

                try:
                    outcome = await self.agent_coordinator.run_task(
                        task,
                        context=body.get("context") or body,
                        budget=budget_override if isinstance(budget_override, (int, float)) else None,
                        mode_override=mode_override,
                        metadata={"headers": header_snapshot},
                    )
                except AgentExecutionError as exc:
                    return json_response({
                        "error": exc.message,
                        "code": exc.code,
                        "metadata": exc.metadata,
                    }, status=exc.status)

                response_payload = {
                    "agent": outcome.result.agent,
                    "mode": outcome.mode,
                    "confidence": outcome.result.confidence,
                    "cost": {
                        "estimate": outcome.result.cost_estimate,
                        "actual": outcome.result.cost_actual,
                        "consumed": outcome.budget_consumed,
                        "remaining": outcome.budget_remaining,
                    },
                    "output": outcome.result.output,
                    "validation": outcome.result.validation,
                    "fallback_used": outcome.fallback_used,
                    "trace": [
                        {
                            "agent": item.agent,
                            "success": item.success,
                            "confidence": item.confidence,
                            "cost": item.cost_actual,
                            "error": item.error,
                        }
                        for item in outcome.trace
                    ],
                }
                return json_response(response_payload)

            if path.startswith("/api/roadmaps"):
                if method == "GET":
                    parts = path.split('/')
                    if len(parts) == 4:
                        roadmap_id = parts[-1]
                        if not validate_uuid(roadmap_id):
                            return json_response({"error": "Invalid roadmap ID format", "code": "VAL-400"}, status=400)
                        roadmap = await queryRoadmap(roadmap_id, user["id"], self.env)
                        query_map = {k: v[0] for k, v in parse_qs(url.query).items() if v}
                        agent_payload = None
                        if query_map.get("run_agent") == "1":
                            agent_task = query_map.get("agent_task") or f"Analyze roadmap {roadmap_id}"
                            budget_override = _safe_float(query_map.get("agent_budget"))
                            mode_override = query_map.get("agent_mode")
                            context = {
                                "json_graph": roadmap.get("json_graph"),
                                "roadmap_id": roadmap_id,
                                "user": user,
                            }
                            try:
                                outcome = await self.agent_coordinator.run_task(
                                    agent_task,
                                    context=context,
                                    budget=budget_override,
                                    mode_override=mode_override,
                                    metadata={"source": "roadmap:get"},
                                )
                            except AgentExecutionError as exc:
                                agent_payload = {
                                    "error": exc.message,
                                    "code": exc.code,
                                    "metadata": exc.metadata,
                                }
                            else:
                                agent_payload = {
                                    "success": outcome.result.success,
                                    "agent": outcome.result.agent,
                                    "confidence": outcome.result.confidence,
                                    "cost": {
                                        "estimate": outcome.result.cost_estimate,
                                        "actual": outcome.result.cost_actual,
                                        "consumed": outcome.budget_consumed,
                                        "remaining": outcome.budget_remaining,
                                    },
                                    "output": outcome.result.output,
                                    "fallback_used": outcome.fallback_used,
                                    "trace": [
                                        {
                                            "agent": item.agent,
                                            "success": item.success,
                                            "confidence": item.confidence,
                                            "cost": item.cost_actual,
                                            "error": item.error,
                                        }
                                        for item in outcome.trace
                                    ],
                                }
                        payload = dict(roadmap)
                        if agent_payload:
                            payload["agent_report"] = agent_payload
                        return json_response(payload)
                    query_map = {k: v[0] for k, v in parse_qs(url.query).items() if v}
                    validated = validate_query_params(query_map).model_dump()
                    roadmaps = await queryUserRoadmaps(user["id"], validated.get("status"), self.env)
                    return json_response({"roadmaps": roadmaps, "total": len(roadmaps)})

                if method == "POST":
                    body = await request.json()
                    validated_body = validate_roadmap_body(body)
                    result = await insertRoadmap(user["id"], validated_body, self.env)
                    await updateRoadmapStatus(result["id"], user["id"], "active", self.env)

                    generate_plan = bool(body.get("generate_plan") or body.get("auto_generate"))
                    agent_payload = None
                    thrive_score = 0.73
                    if generate_plan:
                        agent_task = body.get("agent_task") or f"Generate roadmap plan for {result['id']}"
                        budget_override = _safe_float(body.get("agent_budget"))
                        mode_override = body.get("agent_mode")
                        context = {
                            "json_graph": validated_body["json_graph"],
                            "user_id": user["id"],
                            "request": body,
                        }
                        try:
                            outcome = await self.agent_coordinator.run_task(
                                agent_task,
                                context=context,
                                budget=budget_override,
                                mode_override=mode_override,
                                metadata={"source": "roadmap:create"},
                            )
                        except AgentExecutionError as exc:
                            agent_payload = {
                                "error": exc.message,
                                "code": exc.code,
                                "metadata": exc.metadata,
                            }
                        else:
                            agent_payload = {
                                "success": outcome.result.success,
                                "agent": outcome.result.agent,
                                "confidence": outcome.result.confidence,
                                "cost": {
                                    "estimate": outcome.result.cost_estimate,
                                    "actual": outcome.result.cost_actual,
                                    "consumed": outcome.budget_consumed,
                                    "remaining": outcome.budget_remaining,
                                },
                                "output": outcome.result.output,
                                "fallback_used": outcome.fallback_used,
                                "trace": [
                                    {
                                        "agent": item.agent,
                                        "success": item.success,
                                        "confidence": item.confidence,
                                        "cost": item.cost_actual,
                                        "error": item.error,
                                    }
                                    for item in outcome.trace
                                ],
                            }
                            if outcome.result.success:
                                candidate_score = outcome.result.output.get("score") if isinstance(outcome.result.output, dict) else None
                                if isinstance(candidate_score, (int, float)):
                                    thrive_score = _clamp(float(candidate_score))
                                else:
                                    thrive_score = _clamp(outcome.result.confidence)
                    await updateRoadmapScore(result["id"], thrive_score, self.env)

                    response_body = {
                        "id": result["id"],
                        "thrive_score": thrive_score,
                    }
                    if agent_payload:
                        response_body["agent_report"] = agent_payload
                    return json_response(response_body, status=201)

                return json_response({"error": "Method Not Allowed", "code": "HTTP-405"}, status=405)

            if path.startswith("/api/snippets"):
                if method == "GET":
                    query_params = parse_qs(url.query)
                    category = query_params.get("category", [None])[0]
                    snippets = await querySnippets(category, self.env)
                    return json_response({"snippets": snippets, "total": len(snippets)})
                if method == "POST":
                    body = await request.json()
                    validated_body = validate_snippet_body(body)
                    result = await insertSnippet(validated_body, self.env)
                    return json_response(result, status=201)
                return json_response({"error": "Method Not Allowed", "code": "HTTP-405"}, status=405)

            if path == "/api/events":
                return Response.new(
                    "event: message\ndata: \"message\": \"Welcome to SSE!\"\n\n",
                    headers={
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    }
                )

            return json_response({"error": "Not Found", "code": "HTTP-404"}, status=404)

        except ValueError as err:
            payload = err.args[0] if err.args else {"error": str(err), "code": "SRV-500"}
            if not isinstance(payload, dict):
                payload = {"error": str(err), "code": "SRV-500"}
            return json_response(payload, status=_status_from_code(payload.get("code")))
        except Exception as err:
            print(f"Thermonuclear Unhandled Error: {err}")
            return json_response({"error": "Internal Server Error", "code": "SRV-500"}, status=500)


# Cloudflare Workers entry point
async def fetch(request: Request, env: Dict[str, Any]) -> Response:
    worker = Worker(env)
    return await worker.fetch(request)