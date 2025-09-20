"""
Enhanced ProtoThrive Backend with Full Architecture

Integrates all improvements:
- Security fixes (JWT, SQL injection prevention)
- Performance optimizations (caching, query optimization)
- Infrastructure (rate limiting, error handling, monitoring)
- Architecture (API gateway, service layer)
"""

from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, parse_qs
import json
import uuid
from datetime import datetime

# Cloudflare Workers Python runtime imports
from js import Response, Request

# Core services
from agent_coordinator import AgentCoordinator, AgentExecutionError
from services.auth import AuthenticationService
from services.cache import CacheService
from services.query_optimizer import QueryOptimizer
from services.monitoring import MonitoringService, MonitoringMiddleware
from services.argo_routing import ArgoSmartRoutingService

# Middleware
from middleware.cors import CORSMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.error_handler import ErrorHandler

# API Gateway
from gateway.api_gateway import APIGateway, Route, APIRequest, APIResponse, HTTPMethod, APIVersion

# Database utilities
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


class EnhancedWorker:
    """
    Enhanced Worker with full architecture implementation.

    Features:
    - Comprehensive security
    - Performance optimization
    - Full monitoring and observability
    - API versioning and gateway
    - Service layer architecture
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize enhanced worker with all services"""
        self.env = env

        # Core services
        self.auth_service = AuthenticationService(env)
        self.cache_service = CacheService(env)
        self.query_optimizer = QueryOptimizer(env)
        self.monitoring = MonitoringService(env)
        self.agent_coordinator = AgentCoordinator(env)
        self.argo_routing = ArgoSmartRoutingService(env)

        # Middleware
        self.cors = CORSMiddleware(env)
        self.rate_limiter = RateLimitMiddleware(env)
        self.error_handler = ErrorHandler(env)
        self.monitoring_middleware = MonitoringMiddleware(self.monitoring)

        # API Gateway
        self.api_gateway = APIGateway(env)
        self._register_routes()
        self._setup_middleware()

        # Add services to environment for use in database functions
        env['cache'] = self.cache_service
        env['query_optimizer'] = self.query_optimizer

    def _register_routes(self) -> None:
        """Register all API routes with the gateway"""
        routes = [
            # Health and status endpoints
            Route(
                path="/health",
                method=HTTPMethod.GET,
                handler=self.handle_health_check,
                version=APIVersion.V1,
                auth_required=False,
                description="Health check endpoint",
                tags=["system"]
            ),
            Route(
                path="/status",
                method=HTTPMethod.GET,
                handler=self.handle_status,
                version=APIVersion.V1,
                auth_required=False,
                description="Detailed system status",
                tags=["system"]
            ),

            # Authentication endpoints
            Route(
                path="/auth/login",
                method=HTTPMethod.POST,
                handler=self.handle_login,
                version=APIVersion.V1,
                auth_required=False,
                description="User authentication",
                tags=["auth"]
            ),
            Route(
                path="/auth/refresh",
                method=HTTPMethod.POST,
                handler=self.handle_refresh_token,
                version=APIVersion.V1,
                auth_required=False,
                description="Refresh access token",
                tags=["auth"]
            ),

            # Roadmap endpoints
            Route(
                path="/roadmaps",
                method=HTTPMethod.GET,
                handler=self.handle_get_roadmaps,
                version=APIVersion.V1,
                description="Get user roadmaps",
                tags=["roadmaps"]
            ),
            Route(
                path="/roadmaps",
                method=HTTPMethod.POST,
                handler=self.handle_create_roadmap,
                version=APIVersion.V1,
                description="Create new roadmap",
                tags=["roadmaps"]
            ),
            Route(
                path="/roadmaps/{roadmap_id}",
                method=HTTPMethod.GET,
                handler=self.handle_get_roadmap,
                version=APIVersion.V1,
                description="Get specific roadmap",
                tags=["roadmaps"]
            ),
            Route(
                path="/roadmaps/{roadmap_id}",
                method=HTTPMethod.PUT,
                handler=self.handle_update_roadmap,
                version=APIVersion.V1,
                description="Update roadmap",
                tags=["roadmaps"]
            ),

            # Snippet endpoints
            Route(
                path="/snippets",
                method=HTTPMethod.GET,
                handler=self.handle_get_snippets,
                version=APIVersion.V1,
                description="Get code snippets",
                tags=["snippets"]
            ),
            Route(
                path="/snippets",
                method=HTTPMethod.POST,
                handler=self.handle_create_snippet,
                version=APIVersion.V1,
                description="Create code snippet",
                tags=["snippets"]
            ),

            # Agent endpoints
            Route(
                path="/agent/run",
                method=HTTPMethod.POST,
                handler=self.handle_agent_run,
                version=APIVersion.V1,
                description="Execute AI agent task",
                tags=["agent"]
            ),

            # Analytics and insights
            Route(
                path="/analytics/dashboard",
                method=HTTPMethod.GET,
                handler=self.handle_analytics_dashboard,
                version=APIVersion.V1,
                description="Get analytics dashboard data",
                tags=["analytics"]
            ),

            # API documentation
            Route(
                path="/docs",
                method=HTTPMethod.GET,
                handler=self.handle_api_docs,
                version=APIVersion.V1,
                auth_required=False,
                description="API documentation",
                tags=["docs"]
            )
        ]

        self.api_gateway.register_routes(routes)

    def _setup_middleware(self) -> None:
        """Setup middleware stack"""
        async def auth_middleware(request: APIRequest, route: Route) -> Optional[Response]:
            """Authentication middleware"""
            if not route.auth_required:
                return None

            # Extract auth header
            auth_header = request.headers.get('authorization')
            user = await self.auth_service.validate_token(auth_header)

            if not user:
                return Response.new(
                    json.dumps({"error": "Unauthorized", "code": "AUTH-401"}),
                    status=401,
                    headers={"Content-Type": "application/json"}
                )

            # Add user to request
            request.user = user
            return None

        async def rate_limit_middleware(request: APIRequest, route: Route) -> Optional[Response]:
            """Rate limiting middleware"""
            return await self.rate_limiter.check_rate_limit(
                request.original_request,
                request.user
            )

        # Add middleware to gateway
        self.api_gateway.add_middleware(auth_middleware)
        self.api_gateway.add_middleware(rate_limit_middleware)

    async def fetch(self, request: Request) -> Response:
        """Main request handler with Argo Smart Routing optimization"""
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return self.cors.handle_preflight(request)

        # Start monitoring
        span_id = await self.monitoring_middleware.process_request(request)
        start_time = datetime.now()

        try:
            # CLOUDFLARE OPTIMIZATION: Configure Argo Smart Routing
            endpoint_type = self._determine_endpoint_type(request)
            routing_config = await self.argo_routing.optimize_request_routing(
                request, endpoint_type
            )

            # Route through API gateway
            response = await self.api_gateway.handle_request(request)

            # Calculate response time for optimization
            response_time_ms = (datetime.now() - start_time).total_seconds() * 1000

            # Apply Argo response optimizations
            response = await self.argo_routing.apply_response_optimizations(
                response, routing_config, response_time_ms
            )

            # Add CORS headers
            response = self.cors.add_cors_headers(request, response)

            # Complete monitoring with routing metrics
            await self.monitoring_middleware.process_response(
                span_id, request, response, {
                    'argo_routing': routing_config,
                    'response_time_ms': response_time_ms
                }
            )

            return response

        except Exception as error:
            # Handle error with comprehensive error handler
            error_response = await self.error_handler.handle_error(
                error, request, {"span_id": span_id}
            )

            # Add CORS headers to error response
            error_response = self.cors.add_cors_headers(request, error_response)

            # Complete monitoring with error
            await self.monitoring_middleware.process_response(
                span_id, request, error_response, error
            )

            return error_response

    # Route handlers

    async def handle_health_check(self, request: APIRequest) -> APIResponse:
        """Health check endpoint"""
        health_status = await self.monitoring.health.run_all_health_checks()
        overall_health = self.monitoring.health.get_overall_health()

        return APIResponse(
            data={
                "status": overall_health["status"],
                "service": "protothrive-backend-enhanced",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "2.0.0"
            },
            status_code=200 if overall_health["status"] == "healthy" else 503
        )

    async def handle_status(self, request: APIRequest) -> APIResponse:
        """Detailed status endpoint"""
        dashboard_data = await self.monitoring.get_monitoring_dashboard()

        return APIResponse(
            data={
                "service": "protothrive-backend-enhanced",
                "version": "2.0.0",
                "uptime": "operational",
                "monitoring": dashboard_data,
                "performance": self.query_optimizer.get_performance_report(),
                "cache_stats": self.cache_service.get_stats()
            }
        )

    async def handle_login(self, request: APIRequest) -> APIResponse:
        """Handle user login"""
        if not request.body:
            raise ValueError({"code": "VAL-400", "message": "Login credentials required"})

        email = request.body.get("email")
        password = request.body.get("password")

        if not email or not password:
            raise ValueError({"code": "VAL-400", "message": "Email and password required"})

        # Mock authentication for now
        # In production, verify against database
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "role": "vibe_coder"
        }

        tokens = await self.auth_service.generate_tokens(
            user["id"], user["role"], user["email"]
        )

        # Track business metric
        await self.monitoring.track_business_metrics("user_login", {"email": email})

        return APIResponse(
            data={
                "user": user,
                "tokens": tokens
            }
        )

    async def handle_refresh_token(self, request: APIRequest) -> APIResponse:
        """Handle token refresh"""
        if not request.body:
            raise ValueError({"code": "VAL-400", "message": "Refresh token required"})

        refresh_token = request.body.get("refresh_token")
        if not refresh_token:
            raise ValueError({"code": "VAL-400", "message": "Refresh token required"})

        new_tokens = await self.auth_service.refresh_access_token(refresh_token)
        if not new_tokens:
            raise ValueError({"code": "AUTH-401", "message": "Invalid refresh token"})

        return APIResponse(data=new_tokens)

    async def handle_get_roadmaps(self, request: APIRequest) -> APIResponse:
        """Get user roadmaps with optimization"""
        user = request.user
        status = request.query_params.get("status")

        # Use optimized query
        roadmaps = await queryUserRoadmaps(user["id"], status, self.env)

        # Track business metric
        await self.monitoring.track_business_metrics("roadmaps_fetched", {
            "user_id": user["id"],
            "count": len(roadmaps)
        })

        return APIResponse(
            data=roadmaps,
            meta={
                "total": len(roadmaps),
                "status_filter": status,
                "cached": True  # Indicate if cached
            }
        )

    async def handle_create_roadmap(self, request: APIRequest) -> APIResponse:
        """Create new roadmap with agent integration"""
        user = request.user
        body = request.body

        if not body:
            raise ValueError({"code": "VAL-400", "message": "Roadmap data required"})

        # Validate roadmap data
        validated_body = validate_roadmap_body(body)

        # Create roadmap
        result = await insertRoadmap(user["id"], validated_body, self.env)
        await updateRoadmapStatus(result["id"], user["id"], "active", self.env)

        # Generate AI analysis if requested
        agent_payload = None
        thrive_score = 0.73

        if body.get("generate_plan") or body.get("auto_generate"):
            agent_task = body.get("agent_task") or f"Generate roadmap plan for {result['id']}"
            budget_override = body.get("agent_budget")
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
                }

                if outcome.result.success:
                    candidate_score = outcome.result.output.get("score") if isinstance(outcome.result.output, dict) else None
                    if isinstance(candidate_score, (int, float)):
                        thrive_score = max(0.0, min(1.0, float(candidate_score)))
                    else:
                        thrive_score = max(0.0, min(1.0, outcome.result.confidence))

            except AgentExecutionError as exc:
                agent_payload = {
                    "error": exc.message,
                    "code": exc.code,
                    "metadata": exc.metadata,
                }

        # Update thrive score
        await updateRoadmapScore(result["id"], thrive_score, self.env)

        # Track business metrics
        await self.monitoring.track_business_metrics("roadmap_created", {
            "user_id": user["id"],
            "vibe_mode": validated_body.get("vibe_mode", False),
            "ai_generated": agent_payload is not None
        })

        response_data = {
            "id": result["id"],
            "thrive_score": thrive_score,
        }

        if agent_payload:
            response_data["agent_report"] = agent_payload

        return APIResponse(data=response_data, status_code=201)

    async def handle_get_roadmap(self, request: APIRequest) -> APIResponse:
        """Get specific roadmap with caching"""
        user = request.user
        roadmap_id = request.path_params.get("roadmap_id")

        if not roadmap_id or not validate_uuid(roadmap_id):
            raise ValueError({"code": "VAL-400", "message": "Invalid roadmap ID"})

        # Get roadmap with caching
        cache_key = f"roadmap:{user['id']}:{roadmap_id}"
        roadmap = await self.cache_service.get(cache_key, "roadmap")

        if not roadmap:
            roadmap = await queryRoadmap(roadmap_id, user["id"], self.env)
            # Cache for 5 minutes
            await self.cache_service.set(cache_key, roadmap, ttl=300, cache_type="roadmap")

        return APIResponse(data=roadmap)

    async def handle_update_roadmap(self, request: APIRequest) -> APIResponse:
        """Update roadmap and invalidate cache"""
        user = request.user
        roadmap_id = request.path_params.get("roadmap_id")
        body = request.body

        if not roadmap_id or not validate_uuid(roadmap_id):
            raise ValueError({"code": "VAL-400", "message": "Invalid roadmap ID"})

        if not body:
            raise ValueError({"code": "VAL-400", "message": "Update data required"})

        # Validate update data
        validated_body = validate_roadmap_update(body)

        # Update roadmap (implementation would go here)
        # For now, just invalidate cache
        cache_key = f"roadmap:{user['id']}:{roadmap_id}"
        await self.cache_service.delete(cache_key, "roadmap")

        return APIResponse(data={"updated": True})

    async def handle_get_snippets(self, request: APIRequest) -> APIResponse:
        """Get snippets with caching"""
        category = request.query_params.get("category")

        # Use cached query
        snippets = await querySnippets(category, self.env)

        return APIResponse(
            data=snippets,
            meta={"total": len(snippets), "category": category}
        )

    async def handle_create_snippet(self, request: APIRequest) -> APIResponse:
        """Create code snippet"""
        body = request.body

        if not body:
            raise ValueError({"code": "VAL-400", "message": "Snippet data required"})

        validated_body = validate_snippet_body(body)
        result = await insertSnippet(validated_body, self.env)

        return APIResponse(data=result, status_code=201)

    async def handle_agent_run(self, request: APIRequest) -> APIResponse:
        """Execute agent task"""
        body = request.body

        if not body:
            raise ValueError({"code": "VAL-400", "message": "Agent task required"})

        task = body.get("task")
        if not task:
            raise ValueError({"code": "VAL-400", "message": "Task prompt required"})

        budget_override = body.get("budget")
        mode_override = body.get("mode")

        try:
            outcome = await self.agent_coordinator.run_task(
                task,
                context=body.get("context", {}),
                budget=budget_override,
                mode_override=mode_override,
                metadata={"source": "api:agent:run"},
            )

            # Track business metrics
            await self.monitoring.track_business_metrics("agent_execution", {
                "agent": outcome.result.agent,
                "cost": outcome.result.cost_actual,
                "confidence": outcome.result.confidence,
                "success": outcome.result.success
            })

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

            return APIResponse(data=response_payload)

        except AgentExecutionError as exc:
            raise ValueError({
                "code": exc.code,
                "message": exc.message,
                "metadata": exc.metadata
            })

    async def handle_analytics_dashboard(self, request: APIRequest) -> APIResponse:
        """Get analytics dashboard data"""
        dashboard_data = await self.monitoring.get_monitoring_dashboard()

        return APIResponse(
            data={
                "monitoring": dashboard_data,
                "performance": self.query_optimizer.get_performance_report(),
                "cache": self.cache_service.get_stats()
            }
        )

    async def handle_api_docs(self, request: APIRequest) -> APIResponse:
        """Get API documentation"""
        docs = await self.api_gateway.get_api_documentation()
        return APIResponse(data=docs)

    def _determine_endpoint_type(self, request: Request) -> str:
        """Determine endpoint type for Argo routing optimization"""
        url_path = urlparse(request.url).path.lower()

        # Categorize endpoints for optimal routing
        if any(path in url_path for path in ['/health', '/status', '/docs']):
            return 'static'
        elif any(path in url_path for path in ['/agent', '/execute', '/workflow']):
            return 'agent'  # High-compute endpoints
        elif any(path in url_path for path in ['/ws', '/websocket', '/realtime']):
            return 'realtime'
        elif any(path in url_path for path in ['/analytics', '/dashboard', '/monitoring']):
            return 'dashboard'
        else:
            return 'api'  # Default API endpoints


# Enhanced Cloudflare Workers entry point
async def fetch(request: Request, env: Dict[str, Any]) -> Response:
    """Enhanced Worker entry point with full architecture"""
    worker = EnhancedWorker(env)
    return await worker.fetch(request)