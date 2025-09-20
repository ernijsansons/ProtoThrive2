"""
API Gateway for ProtoThrive

Provides centralized API management with:
- Request routing and versioning
- Request/response transformation
- Rate limiting and authentication
- API documentation and validation
- Load balancing and circuit breaking
- Request/response logging
"""

from typing import Dict, List, Optional, Any, Callable, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import re
from urllib.parse import urlparse, parse_qs

# Cloudflare imports
from js import Response, Request


class APIVersion(Enum):
    """API version definitions"""
    V1 = "v1"
    V2 = "v2"
    BETA = "beta"


class HTTPMethod(Enum):
    """HTTP methods"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    OPTIONS = "OPTIONS"


@dataclass
class Route:
    """API route definition"""
    path: str
    method: HTTPMethod
    handler: Callable
    version: APIVersion
    auth_required: bool = True
    rate_limit: Optional[Dict[str, int]] = None
    request_schema: Optional[Dict[str, Any]] = None
    response_schema: Optional[Dict[str, Any]] = None
    deprecated: bool = False
    tags: List[str] = field(default_factory=list)
    description: str = ""


@dataclass
class APIRequest:
    """Normalized API request"""
    original_request: Request
    path: str
    method: str
    version: APIVersion
    path_params: Dict[str, str]
    query_params: Dict[str, str]
    headers: Dict[str, str]
    body: Optional[Any] = None
    user: Optional[Dict[str, Any]] = None
    trace_id: Optional[str] = None


@dataclass
class APIResponse:
    """API response wrapper"""
    data: Any
    status_code: int = 200
    headers: Dict[str, str] = field(default_factory=dict)
    meta: Optional[Dict[str, Any]] = None


class RequestTransformer:
    """
    Transforms incoming requests into normalized format.

    Handles:
    - URL parsing and parameter extraction
    - Request body parsing and validation
    - Header normalization
    - Version detection
    """

    def __init__(self):
        self.path_patterns = {}

    def register_path_pattern(self, pattern: str, route: Route) -> None:
        """Register path pattern for parameter extraction"""
        # Convert path pattern to regex
        regex_pattern = pattern
        param_names = []

        # Replace {param} with capture groups
        for match in re.finditer(r'\{(\w+)\}', pattern):
            param_name = match.group(1)
            param_names.append(param_name)
            regex_pattern = regex_pattern.replace(
                f'{{{param_name}}}',
                '([^/]+)',
                1
            )

        self.path_patterns[pattern] = {
            'regex': f"^{regex_pattern}$",
            'params': param_names,
            'route': route
        }

    async def transform_request(self, request: Request) -> APIRequest:
        """Transform request into normalized format"""
        url = urlparse(request.url)
        path = url.path
        method = request.method

        # Extract version from path or header
        version = self._extract_version(path, request.headers)
        path = self._strip_version_from_path(path)

        # Extract path parameters
        path_params = self._extract_path_params(path)

        # Parse query parameters
        query_params = {k: v[0] for k, v in parse_qs(url.query).items() if v}

        # Parse request body
        body = None
        if method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
            except:
                # Handle non-JSON bodies
                try:
                    body_text = await request.text()
                    if body_text:
                        body = {"raw": body_text}
                except:
                    pass

        # Normalize headers
        headers = {k.lower(): v for k, v in request.headers.items()}

        return APIRequest(
            original_request=request,
            path=path,
            method=method,
            version=version,
            path_params=path_params,
            query_params=query_params,
            headers=headers,
            body=body,
            trace_id=headers.get('x-trace-id')
        )

    def _extract_version(
        self,
        path: str,
        headers: Dict[str, str]
    ) -> APIVersion:
        """Extract API version from path or headers"""
        # Check path first: /api/v1/...
        if path.startswith('/api/v1/'):
            return APIVersion.V1
        elif path.startswith('/api/v2/'):
            return APIVersion.V2
        elif path.startswith('/api/beta/'):
            return APIVersion.BETA

        # Check Accept header: application/json; version=v1
        accept_header = headers.get('accept', '')
        if 'version=v1' in accept_header:
            return APIVersion.V1
        elif 'version=v2' in accept_header:
            return APIVersion.V2
        elif 'version=beta' in accept_header:
            return APIVersion.BETA

        # Check custom header
        api_version = headers.get('x-api-version', '').lower()
        if api_version == 'v1':
            return APIVersion.V1
        elif api_version == 'v2':
            return APIVersion.V2
        elif api_version == 'beta':
            return APIVersion.BETA

        # Default to v1
        return APIVersion.V1

    def _strip_version_from_path(self, path: str) -> str:
        """Remove version prefix from path"""
        patterns = ['/api/v1/', '/api/v2/', '/api/beta/', '/api/']
        for pattern in patterns:
            if path.startswith(pattern):
                return '/' + path[len(pattern):]
        return path

    def _extract_path_params(self, path: str) -> Dict[str, str]:
        """Extract parameters from path"""
        for pattern, config in self.path_patterns.items():
            match = re.match(config['regex'], path)
            if match:
                params = {}
                for i, param_name in enumerate(config['params']):
                    params[param_name] = match.group(i + 1)
                return params
        return {}


class ResponseTransformer:
    """
    Transforms responses into consistent format.

    Handles:
    - Response wrapping and metadata
    - Error response formatting
    - Header standardization
    - Content negotiation
    """

    def __init__(self):
        self.default_headers = {
            "Content-Type": "application/json",
            "X-API-Version": "v1",
            "X-Response-Time": ""
        }

    def transform_response(
        self,
        api_response: APIResponse,
        api_request: APIRequest,
        processing_time_ms: float
    ) -> Response:
        """Transform API response to HTTP response"""
        # Build response body
        if isinstance(api_response.data, dict) and 'error' in api_response.data:
            # Error response
            response_body = api_response.data
        else:
            # Success response with metadata
            response_body = {
                "data": api_response.data,
                "meta": api_response.meta or {},
                "version": api_request.version.value,
                "timestamp": datetime.utcnow().isoformat()
            }

        # Build headers
        headers = {**self.default_headers, **api_response.headers}
        headers["X-API-Version"] = api_request.version.value
        headers["X-Response-Time"] = f"{processing_time_ms:.2f}ms"

        if api_request.trace_id:
            headers["X-Trace-ID"] = api_request.trace_id

        return Response.new(
            json.dumps(response_body),
            status=api_response.status_code,
            headers=headers
        )

    def transform_error(
        self,
        error: Exception,
        api_request: APIRequest,
        processing_time_ms: float
    ) -> Response:
        """Transform error to HTTP response"""
        # Extract error details
        if hasattr(error, 'code'):
            error_code = error.code
            status_code = self._get_status_from_code(error_code)
        else:
            error_code = "SRV-500"
            status_code = 500

        error_response = APIResponse(
            data={
                "error": {
                    "code": error_code,
                    "message": str(error),
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": api_request.path,
                    "method": api_request.method
                }
            },
            status_code=status_code
        )

        return self.transform_response(error_response, api_request, processing_time_ms)

    def _get_status_from_code(self, error_code: str) -> int:
        """Get HTTP status code from error code"""
        if error_code.startswith('AUTH-'):
            return 401
        elif error_code.startswith('VAL-'):
            return 400
        elif error_code.startswith('RATE-'):
            return 429
        elif error_code.startswith('DB-'):
            return 500
        else:
            return 500


class RouteRegistry:
    """
    Manages API route registration and lookup.

    Features:
    - Version-based routing
    - Pattern matching for path parameters
    - Route metadata and documentation
    - Deprecation warnings
    """

    def __init__(self):
        self.routes: Dict[str, Dict[str, Route]] = {
            version.value: {} for version in APIVersion
        }
        self.transformer = RequestTransformer()

    def register_route(self, route: Route) -> None:
        """Register API route"""
        version_routes = self.routes[route.version.value]
        route_key = f"{route.method.value}:{route.path}"
        version_routes[route_key] = route

        # Register path pattern for parameter extraction
        self.transformer.register_path_pattern(route.path, route)

    def find_route(self, api_request: APIRequest) -> Optional[Route]:
        """Find matching route for request"""
        version_routes = self.routes[api_request.version.value]
        route_key = f"{api_request.method}:{api_request.path}"

        # Try exact match first
        if route_key in version_routes:
            return version_routes[route_key]

        # Try pattern matching
        for pattern, config in self.transformer.path_patterns.items():
            if re.match(config['regex'], api_request.path):
                route = config['route']
                if (route.method.value == api_request.method and
                    route.version == api_request.version):
                    return route

        return None

    def get_route_documentation(self) -> Dict[str, Any]:
        """Generate API documentation"""
        docs = {
            "title": "ProtoThrive API",
            "description": "Comprehensive API for ProtoThrive platform",
            "versions": {}
        }

        for version, routes in self.routes.items():
            version_docs = {
                "version": version,
                "routes": []
            }

            for route_key, route in routes.items():
                route_doc = {
                    "path": route.path,
                    "method": route.method.value,
                    "description": route.description,
                    "auth_required": route.auth_required,
                    "deprecated": route.deprecated,
                    "tags": route.tags
                }

                if route.request_schema:
                    route_doc["request_schema"] = route.request_schema

                if route.response_schema:
                    route_doc["response_schema"] = route.response_schema

                version_docs["routes"].append(route_doc)

            docs["versions"][version] = version_docs

        return docs


class APIGateway:
    """
    Main API Gateway that coordinates all components.

    Features:
    - Centralized request routing
    - Automatic API versioning
    - Request/response transformation
    - Middleware integration
    - Circuit breaking and fallbacks
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize API gateway"""
        self.env = env
        self.registry = RouteRegistry()
        self.request_transformer = RequestTransformer()
        self.response_transformer = ResponseTransformer()

        # Middleware stack
        self.middleware_stack = []

        # Circuit breaker for error handling
        self.circuit_breaker_thresholds = {
            "error_rate": 0.5,  # 50% error rate
            "min_requests": 10,  # Minimum requests before activating
            "window_seconds": 60  # Time window
        }

    def add_middleware(self, middleware: Callable) -> None:
        """Add middleware to the stack"""
        self.middleware_stack.append(middleware)

    def register_routes(self, routes: List[Route]) -> None:
        """Register multiple routes"""
        for route in routes:
            self.registry.register_route(route)

    async def handle_request(self, request: Request) -> Response:
        """Main request handler"""
        start_time = datetime.now()

        try:
            # Transform request
            api_request = await self.request_transformer.transform_request(request)

            # Find matching route
            route = self.registry.find_route(api_request)
            if not route:
                return self._create_not_found_response(api_request)

            # Check if route is deprecated
            if route.deprecated:
                print(f"Deprecated route accessed: {route.path}")

            # Apply middleware
            for middleware in self.middleware_stack:
                result = await middleware(api_request, route)
                if isinstance(result, Response):
                    # Middleware returned early response (e.g., auth failure)
                    return result

            # Execute route handler
            api_response = await route.handler(api_request)

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            # Transform response
            return self.response_transformer.transform_response(
                api_response,
                api_request,
                processing_time
            )

        except Exception as error:
            # Calculate processing time for error
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            # Transform error response
            return self.response_transformer.transform_error(
                error,
                api_request if 'api_request' in locals() else None,
                processing_time
            )

    def _create_not_found_response(self, api_request: APIRequest) -> Response:
        """Create 404 response"""
        error_response = APIResponse(
            data={
                "error": {
                    "code": "ROUTE-404",
                    "message": f"Route not found: {api_request.method} {api_request.path}",
                    "available_versions": [v.value for v in APIVersion]
                }
            },
            status_code=404
        )

        return self.response_transformer.transform_response(
            error_response,
            api_request,
            0
        )

    async def get_api_documentation(self) -> Dict[str, Any]:
        """Get complete API documentation"""
        return self.registry.get_route_documentation()

    async def get_health_status(self) -> Dict[str, Any]:
        """Get gateway health status"""
        return {
            "status": "healthy",
            "registered_routes": sum(len(routes) for routes in self.registry.routes.values()),
            "middleware_count": len(self.middleware_stack),
            "supported_versions": [v.value for v in APIVersion]
        }


# Convenience decorators for route definition
def api_route(
    path: str,
    method: HTTPMethod = HTTPMethod.GET,
    version: APIVersion = APIVersion.V1,
    auth_required: bool = True,
    description: str = "",
    tags: Optional[List[str]] = None
):
    """Decorator for defining API routes"""
    def decorator(handler_func):
        route = Route(
            path=path,
            method=method,
            handler=handler_func,
            version=version,
            auth_required=auth_required,
            description=description,
            tags=tags or []
        )
        return route
    return decorator


# Export for use in application
__all__ = [
    'APIGateway',
    'Route',
    'APIRequest',
    'APIResponse',
    'APIVersion',
    'HTTPMethod',
    'api_route'
]