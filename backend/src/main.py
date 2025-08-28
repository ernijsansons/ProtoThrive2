# Ref: CLAUDE.md Terminal 1 & 3 - Main Python Worker Application
# Thermonuclear Backend API for ProtoThrive (Python Port)

from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse, parse_qs
import json
import uuid
import asyncio

# Import ported utilities
from utils.db import (
    queryRoadmap, insertRoadmap, updateRoadmapStatus, queryUserRoadmaps,
    querySnippets, insertSnippet, insertAgentLog, queryAgentLogs, insertInsight,
    updateRoadmapScore, softDeleteUser,
    User, Roadmap, Snippet, AgentLog, Insight
)
from utils.validation import (
    validate_roadmap_body, validate_roadmap_update, validate_snippet_body,
    validate_agent_log_body, validate_insight_body, validate_query_params,
    validate_uuid, UserRoleEnum
)

# Import AI Core orchestrator directly
from ai_core.orchestrator import orchestrate

# GraphQL with Graphene
import graphene

# Define GraphQL types
class UserType(graphene.ObjectType):
    id = graphene.String()
    email = graphene.String()
    role = graphene.String()
    created_at = graphene.String()
    deleted_at = graphene.String()

class RoadmapType(graphene.ObjectType):
    id = graphene.String()
    user_id = graphene.String()
    json_graph = graphene.String()
    status = graphene.String()
    vibe_mode = graphene.Boolean()
    thrive_score = graphene.Float()
    created_at = graphene.String()
    updated_at = graphene.String()

class SnippetType(graphene.ObjectType):
    id = graphene.String()
    category = graphene.String()
    code = graphene.String()
    ui_preview_url = graphene.String()
    version = graphene.Int()
    created_at = graphene.String()
    updated_at = graphene.String()

class AgentLogType(graphene.ObjectType):
    id = graphene.String()
    roadmap_id = graphene.String()
    task_type = graphene.String()
    output = graphene.String()
    status = graphene.String()
    model_used = graphene.String()
    token_count = graphene.Int()
    timestamp = graphene.String()

class InsightType(graphene.ObjectType):
    id = graphene.String()
    roadmap_id = graphene.String()
    type = graphene.String()
    data = graphene.String()
    score = graphene.Float()
    created_at = graphene.String()

class Query(graphene.ObjectType):
    get_roadmap = graphene.Field(RoadmapType, id=graphene.String(required=True))
    get_user_roadmaps = graphene.List(RoadmapType, status=graphene.String())
    get_snippets = graphene.List(SnippetType, category=graphene.String())
    get_agent_logs = graphene.List(AgentLogType, roadmap_id=graphene.String(required=True))

    async def resolve_get_roadmap(self, info, id):
        user = info.context["user"]
        env = info.context["env"]
        try:
            return await queryRoadmap(id, user["id"], env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

    async def resolve_get_user_roadmaps(self, info, status=None):
        user = info.context["user"]
        env = info.context["env"]
        try:
            return await queryUserRoadmaps(user["id"], status, env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

    async def resolve_get_snippets(self, info, category=None):
        env = info.context["env"]
        try:
            return await querySnippets(category, env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

    async def resolve_get_agent_logs(self, info, roadmap_id):
        env = info.context["env"]
        try:
            return await queryAgentLogs(roadmap_id, env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

class CreateRoadmapInput(graphene.InputObjectType):
    json_graph = graphene.String(required=True)
    vibe_mode = graphene.Boolean(required=True)

class UpdateRoadmapStatusInput(graphene.InputObjectType):
    id = graphene.String(required=True)
    status = graphene.String(required=True)

class CreateSnippetInput(graphene.InputObjectType):
    category = graphene.String(required=True)
    code = graphene.String(required=True)
    ui_preview_url = graphene.String()

class CreateRoadmap(graphene.Mutation):
    class Arguments:
        input = CreateRoadmapInput(required=True)

    Output = RoadmapType

    async def mutate(self, info, input):
        user = info.context["user"]
        env = info.context["env"]
        try:
            validated_body = validate_roadmap_body(input)
            result = await insertRoadmap(user["id"], validated_body, env)

            # Trigger AI Orchestration
            try:
                orchestrator_output = await orchestrate(validated_body.json_graph)
                print(f"AI Orchestrator Output: {orchestrator_output}")
                # Parse output and update thrive_score
                # For now, use dummy values as per CLAUDE.md
                await updateRoadmapStatus(result["id"], user["id"], "active", env) # Set status to active
                await updateRoadmapScore(result["id"], 0.73, env) # Update thrive score
            except Exception as ai_error:
                print(f"Error triggering AI Orchestrator: {ai_error}")
                # Decide how to handle AI orchestration failure (e.g., log, notify, partial success)

            return await queryRoadmap(result["id"], user["id"], env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

class UpdateRoadmapStatusMutation(graphene.Mutation):
    class Arguments:
        input = UpdateRoadmapStatusInput(required=True)

    Output = RoadmapType

    async def mutate(self, info, input):
        user = info.context["user"]
        env = info.context["env"]
        try:
            await updateRoadmapStatus(input.id, user["id"], input.status, env)
            return await queryRoadmap(input.id, user["id"], env)
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

class CreateSnippet(graphene.Mutation):
    class Arguments:
        input = CreateSnippetInput(required=True)

    Output = SnippetType

    async def mutate(self, info, input):
        env = info.context["env"]
        try:
            validated_body = validate_snippet_body(input)
            result = await insertSnippet(validated_body, env)
            # Find the created snippet to return it
            snippets = await querySnippets(None, env)
            return next(s for s in snippets if s["id"] == result["id"])
        except ValueError as e:
            raise graphene.client.GraphQLError(json.dumps(e.args[0]))

class Mutation(graphene.ObjectType):
    create_roadmap = CreateRoadmap.Field()
    update_roadmap_status = UpdateRoadmapStatusMutation.Field()
    create_snippet = CreateSnippet.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

class Worker:
    def __init__(self, env: Dict[str, Any]):
        self.env = env

    async def fetch(self, request: Request) -> Response:
        url = urlparse(request.url)
        path = url.path
        method = request.method

        # Authentication Middleware (Mock)
        auth_header = request.headers.get("Authorization")
        user = await self.validate_jwt(auth_header)
        if not user:
            return Response(json.dumps({"error": "Unauthorized", "code": "AUTH-401"}), status=401, headers={"Content-Type": "application/json"})

        # Set user context for GraphQL
        info_context = {"user": user, "env": self.env}

        # REST Endpoints
        if path == "/health":
            return Response(json.dumps({"status": "ok", "service": "protothrive-backend-python"}), headers={"Content-Type": "application/json"})
        elif path == "/":
            try:
                result = await self.env["DB"].prepare("SELECT 1 as test").first()
                return Response(json.dumps({
                    "status": "Thermonuclear Backend Up - Ready",
                    "db": "Connected" if result else "Not Connected",
                    "service": "protothrive-backend-python",
                    "endpoints": ["/health", "/api/roadmaps", "/api/snippets", "/graphql"]
                }), headers={"Content-Type": "application/json"})
            except Exception as e:
                print(f"Thermonuclear DB Test Error: {e}")
                return Response(json.dumps({
                    "status": "Thermonuclear Backend Up - Ready",
                    "db": "Error",
                    "service": "protothrive-backend-python",
                    "endpoints": ["/health", "/api/roadmaps", "/api/snippets", "/graphql"]
                }), headers={"Content-Type": "application/json"})
        elif path.startswith("/api/roadmaps"):
            if method == "GET":
                parts = path.split('/')
                if len(parts) == 4: # /api/roadmaps/:id
                    roadmap_id = parts[-1]
                    if not validate_uuid(roadmap_id):
                        return Response(json.dumps({"error": "Invalid roadmap ID format", "code": "VAL-400"}), status=400, headers={"Content-Type": "application/json"})
                    try:
                        roadmap = await queryRoadmap(roadmap_id, user["id"], self.env)
                        return Response(json.dumps(roadmap), headers={"Content-Type": "application/json"})
                    except ValueError as e:
                        error_data = e.args[0]
                        status_code = 404 if error_data.get("code") == "GRAPH-404" else 500
                        return Response(json.dumps(error_data), status=status_code, headers={"Content-Type": "application/json"})
                else: # /api/roadmaps
                    query_params = parse_qs(url.query)
                    params = validate_query_params(query_params) # This expects dict, parse_qs returns dict of lists
                    # Need to convert list values to single values for validation
                    single_value_params = {k: v[0] if isinstance(v, list) else v for k, v in params.items()}
                    
                    try:
                        roadmaps = await queryUserRoadmaps(user["id"], single_value_params.get("status"), self.env)
                        return Response(json.dumps({"roadmaps": roadmaps, "total": len(roadmaps)}), headers={"Content-Type": "application/json"})
                    except ValueError as e:
                        return Response(json.dumps(e.args[0]), status=500, headers={"Content-Type": "application/json"})
            elif method == "POST":
                try:
                    body = await request.json()
                    validated_body = validate_roadmap_body(body)
                    result = await insertRoadmap(user["id"], validated_body, self.env)

                    # Trigger AI Orchestration
                    try:
                        orchestrator_output = await orchestrate(validated_body.json_graph)
                        print(f"AI Orchestrator Output: {orchestrator_output}")
                        # Update roadmap status and thrive score based on AI output
                        # For now, use dummy values as per CLAUDE.md
                        await updateRoadmapStatus(result["id"], user["id"], "active", self.env) # Set status to active
                        await updateRoadmapScore(result["id"], 0.73, self.env) # Update thrive score
                    except Exception as ai_error:
                        print(f"Error triggering AI Orchestrator: {ai_error}")
                        # Decide how to handle AI orchestration failure (e.g., log, notify, partial success)

                    return Response(json.dumps(result), status=201, headers={"Content-Type": "application/json"})
                except ValueError as e:
                    error_data = e.args[0]
                    status_code = 400 if error_data.get("code") == "VAL-400" else 500
                    return Response(json.dumps(error_data), status=status_code, headers={"Content-Type": "application/json"})
            else:
                return Response("Method Not Allowed", status=405)
        elif path == "/graphql":
            if method == "POST":
                try:
                    body = await request.json()
                    query = body.get("query")
                    variables = body.get("variables")
                    result = await schema.execute(query, variables=variables, context=info_context)
                    
                    if result.errors:
                        # Graphene errors are already formatted, just return them
                        return Response(json.dumps({"errors": [str(e) for e in result.errors]}), status=400, headers={"Content-Type": "application/json"})
                    
                    return Response(json.dumps(result.data), headers={"Content-Type": "application/json"})
                except Exception as e:
                    print(f"GraphQL Error: {e}")
                    return Response(json.dumps({"error": str(e), "code": "GRAPHQL-500"}), status=500, headers={"Content-Type": "application/json"})
            else:
                return Response("Method Not Allowed", status=405)
        else:
            return Response("Not Found", status=404)

    async def validate_jwt(self, auth_header: Optional[str]) -> Optional[Dict[str, Any]]:
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ")[1]
        # Mock JWT validation - extract user ID from token
        user_id = token.split(".")[1] if "." in token else None
        if not user_id or not validate_uuid(user_id):
            return None
        # Mock user data as per CLAUDE.md
        return {"id": "uuid-thermo-1", "role": "vibe_coder"}

# Mermaid ERD for ProtoThrive Database
# ```mermaid
# erDiagram
#     users ||--o{ roadmaps : creates
#     roadmaps ||--o{ agent_logs : generates
#     roadmaps ||--o{ insights : analyzes
#
#     users {
#         string id PK
#         string email UK
#         string role
#         timestamp created_at
#         timestamp deleted_at
#     }
#
#     roadmaps {
#         string id PK
#         string user_id FK
#         text json_graph
#         string status
#         boolean vibe_mode
#         float thrive_score
#         timestamp created_at
#         timestamp updated_at
#     }
#
#     snippets {
#         string id PK
#         string category
#         text code
#         string ui_preview_url
#         integer version
#         timestamp created_at
#         timestamp updated_at
#     }
#
#     agent_logs {
#         string id PK
#         string roadmap_id FK
#         string task_type
#         text output
#         string status
#         string model_used
#         integer token_count
#         timestamp timestamp
#     }
#
#     insights {
#         string id PK
#         string roadmap_id FK
#         string type
#         text data
#         float score
#         timestamp created_at
#     }
# ```
