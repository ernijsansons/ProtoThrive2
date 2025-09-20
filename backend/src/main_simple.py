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

# Simplified database functions (inline for deployment)
async def query_roadmap_simple(env, roadmap_id: str) -> Optional[Dict[str, Any]]:
    """Query a roadmap by ID"""
    try:
        result = await env.DB.prepare("SELECT * FROM roadmaps WHERE id = ? AND deleted_at IS NULL").bind(roadmap_id).first()
        return result
    except Exception:
        return None

async def insert_roadmap_simple(env, roadmap_data: Dict[str, Any]) -> str:
    """Insert a new roadmap"""
    roadmap_id = str(uuid.uuid4())
    try:
        await env.DB.prepare("""
            INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """).bind(
            roadmap_id,
            roadmap_data.get('user_id'),
            roadmap_data.get('json_graph'),
            roadmap_data.get('status', 'draft'),
            roadmap_data.get('vibe_mode', 0),
            roadmap_data.get('created_at'),
            roadmap_data.get('updated_at')
        ).run()
        return roadmap_id
    except Exception:
        return ""

async def update_roadmap_score_simple(env, roadmap_id: str, score: float) -> bool:
    """Update roadmap score"""
    try:
        await env.DB.prepare("UPDATE roadmaps SET thrive_score = ?, updated_at = ? WHERE id = ?").bind(
            score, 
            str(uuid.uuid4()), 
            roadmap_id
        ).run()
        return True
    except Exception:
        return False

# Simplified validation functions
def validate_uuid_simple(value: str) -> bool:
    """Simple UUID validation"""
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False

def validate_roadmap_body_simple(body: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Simple roadmap validation"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'json_graph' not in body:
        return False, "json_graph is required"
    
    try:
        json.loads(body['json_graph'])
    except (TypeError, ValueError):
        return False, "json_graph must be valid JSON"
    
    return True, None

# Main worker class
class Worker:
    def __init__(self, env):
        self.env = env
        self.agent_coordinator = AgentCoordinator(env)

    async def fetch(self, request: Request) -> Response:
        """Main request handler"""
        url = urlparse(request.url)
        path = url.path
        method = request.method

        # CORS headers
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

        # Handle preflight requests
        if method == "OPTIONS":
            return Response.new("", status=200, headers=cors_headers)

        try:
            # Route handling
            if path == "/api/roadmaps" and method == "GET":
                return await self.handle_get_roadmaps(request, cors_headers)
            elif path == "/api/roadmaps" and method == "POST":
                return await self.handle_create_roadmap(request, cors_headers)
            elif path.startswith("/api/roadmaps/") and method == "GET":
                roadmap_id = path.split("/")[-1]
                return await self.handle_get_roadmap(roadmap_id, cors_headers)
            elif path.startswith("/api/roadmaps/") and method == "PUT":
                roadmap_id = path.split("/")[-1]
                return await self.handle_update_roadmap(roadmap_id, request, cors_headers)
            elif path == "/api/agent/run" and method == "POST":
                return await self.handle_agent_run(request, cors_headers)
            else:
                return json_response({"error": "Not found"}, 404, headers=cors_headers)

        except Exception as e:
            print(f"Error handling request: {e}")
            return json_response({"error": "Internal server error"}, 500, headers=cors_headers)

    async def handle_get_roadmaps(self, request: Request, cors_headers: Dict[str, str]) -> Response:
        """Get all roadmaps for a user"""
        try:
            # For now, return a mock response
            mock_roadmaps = [
                {
                    "id": "mock-roadmap-1",
                    "user_id": "mock-user-1",
                    "json_graph": '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}}],"edges":[]}',
                    "status": "draft",
                    "thrive_score": 0.75,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]
            return json_response({"roadmaps": mock_roadmaps}, headers=cors_headers)
        except Exception as e:
            return json_response({"error": str(e)}, 500, headers=cors_headers)

    async def handle_create_roadmap(self, request: Request, cors_headers: Dict[str, str]) -> Response:
        """Create a new roadmap"""
        try:
            body = await request.json()
            is_valid, error = validate_roadmap_body_simple(body)
            
            if not is_valid:
                return json_response({"error": error}, 400, headers=cors_headers)
            
            # Create roadmap
            roadmap_id = await insert_roadmap_simple(self.env, {
                "user_id": "mock-user-1",
                "json_graph": body["json_graph"],
                "status": "draft",
                "vibe_mode": 0,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            })
            
            if not roadmap_id:
                return json_response({"error": "Failed to create roadmap"}, 500, headers=cors_headers)
            
            return json_response({"id": roadmap_id, "status": "created"}, 201, headers=cors_headers)
        except Exception as e:
            return json_response({"error": str(e)}, 500, headers=cors_headers)

    async def handle_get_roadmap(self, roadmap_id: str, cors_headers: Dict[str, str]) -> Response:
        """Get a specific roadmap"""
        try:
            if not validate_uuid_simple(roadmap_id):
                return json_response({"error": "Invalid roadmap ID"}, 400, headers=cors_headers)
            
            # For now, return a mock response with agent report
            mock_roadmap = {
                "id": roadmap_id,
                "user_id": "mock-user-1",
                "json_graph": '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}}],"edges":[]}',
                "status": "draft",
                "thrive_score": 0.82,
                "user": {"role": "engineer"},
                "agent_report": {
                    "agent": "enterprise",
                    "confidence": 0.85,
                    "cost": {
                        "estimate": 0.12,
                        "actual": 0.10,
                        "consumed": 0.10,
                        "remaining": 0.20
                    },
                    "fallback_used": False,
                    "trace": [
                        {
                            "agent": "enterprise",
                            "success": True,
                            "confidence": 0.85,
                            "cost": 0.10
                        }
                    ]
                },
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
            
            return json_response(mock_roadmap, headers=cors_headers)
        except Exception as e:
            return json_response({"error": str(e)}, 500, headers=cors_headers)

    async def handle_update_roadmap(self, roadmap_id: str, request: Request, cors_headers: Dict[str, str]) -> Response:
        """Update a roadmap"""
        try:
            if not validate_uuid_simple(roadmap_id):
                return json_response({"error": "Invalid roadmap ID"}, 400, headers=cors_headers)
            
            body = await request.json()
            is_valid, error = validate_roadmap_body_simple(body)
            
            if not is_valid:
                return json_response({"error": error}, 400, headers=cors_headers)
            
            # Update roadmap (simplified)
            success = await update_roadmap_score_simple(self.env, roadmap_id, body.get("thrive_score", 0.75))
            
            if not success:
                return json_response({"error": "Failed to update roadmap"}, 500, headers=cors_headers)
            
            return json_response({"id": roadmap_id, "status": "updated"}, headers=cors_headers)
        except Exception as e:
            return json_response({"error": str(e)}, 500, headers=cors_headers)

    async def handle_agent_run(self, request: Request, cors_headers: Dict[str, str]) -> Response:
        """Run agent analysis"""
        try:
            body = await request.json()
            
            # Extract parameters
            task = body.get("task", "Analyze this roadmap and provide insights")
            budget = body.get("budget", 0.3)
            mode = body.get("mode", "fallback")
            roadmap_id = body.get("roadmap_id")
            
            if not roadmap_id:
                return json_response({"error": "roadmap_id is required"}, 400, headers=cors_headers)
            
            # Create agent request
            agent_request = {
                "task": task,
                "context": {
                    "json_graph": '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}}],"edges":[]}'
                }
            }
            
            # Run agent analysis
            outcome = await self.agent_coordinator.run_task(
                task=task,
                context=agent_request["context"],
                budget=budget,
                mode_override=mode
            )
            
            # Format response
            response = {
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
                        "error": getattr(item, 'error', None),
                    }
                    for item in outcome.trace
                ],
            }
            
            return json_response(response, headers=cors_headers)
            
        except AgentExecutionError as e:
            return json_response({
                "error": e.message,
                "code": e.code,
                "metadata": e.metadata
            }, _status_from_code(e.code), headers=cors_headers)
        except Exception as e:
            return json_response({"error": str(e)}, 500, headers=cors_headers)

# Export the worker handler for Cloudflare Workers
async def fetch(request: Request, env: Dict[str, Any]) -> Response:
    """Main handler for Cloudflare Workers"""
    worker = Worker(env)
    return await worker.fetch(request)

# Export for Cloudflare Workers
__all__ = ["fetch"]
