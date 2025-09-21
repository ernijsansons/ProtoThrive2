"""
ProtoThrive Security Middleware - Production Security Implementation
CORS, Rate Limiting, Input Validation, and Security Headers

Ref: CLAUDE.md Phase 1 - Security Implementation
"""

import json
import time
import re
from typing import Dict, Any, Optional, List, Tuple
from js import Response, console

class SecurityError(Exception):
    """Security-related errors"""
    pass

class RateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self):
        self.clients = {}
        self.cleanup_interval = 300  # 5 minutes
        self.last_cleanup = time.time()

    def _cleanup_old_entries(self):
        """Remove old entries to prevent memory leaks"""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            cutoff = now - 3600  # Remove entries older than 1 hour
            self.clients = {
                ip: data for ip, data in self.clients.items()
                if data.get('last_request', 0) > cutoff
            }
            self.last_cleanup = now

    def is_rate_limited(self, client_ip: str, limit: int = 100, window: int = 3600) -> bool:
        """
        Check if client is rate limited

        Args:
            client_ip: Client IP address
            limit: Maximum requests per window
            window: Time window in seconds

        Returns:
            True if rate limited, False otherwise
        """
        now = time.time()
        self._cleanup_old_entries()

        if client_ip not in self.clients:
            self.clients[client_ip] = {
                'requests': [],
                'last_request': now
            }

        client_data = self.clients[client_ip]
        client_data['last_request'] = now

        # Remove requests outside the window
        cutoff = now - window
        client_data['requests'] = [
            req_time for req_time in client_data['requests']
            if req_time > cutoff
        ]

        # Add current request
        client_data['requests'].append(now)

        # Check if limit exceeded
        if len(client_data['requests']) > limit:
            console.log(f"Rate limit exceeded for IP {client_ip}: {len(client_data['requests'])}/{limit}")
            return True

        return False

# Global rate limiter instance
rate_limiter = RateLimiter()

def get_client_ip(request) -> str:
    """Extract client IP from request headers"""
    # Check for Cloudflare headers
    cf_connecting_ip = request.headers.get('CF-Connecting-IP')
    if cf_connecting_ip:
        return cf_connecting_ip

    # Check for other proxy headers
    x_forwarded_for = request.headers.get('X-Forwarded-For')
    if x_forwarded_for:
        # Take the first IP in the chain
        return x_forwarded_for.split(',')[0].strip()

    x_real_ip = request.headers.get('X-Real-IP')
    if x_real_ip:
        return x_real_ip

    # Fallback (though this won't be available in Cloudflare Workers)
    return request.headers.get('Remote-Addr', 'unknown')

def validate_json_payload(data: Any, max_size: int = 1024 * 100) -> Dict[str, Any]:
    """
    Validate JSON payload for security with enhanced checks

    Args:
        data: JSON data to validate
        max_size: Maximum size in bytes

    Returns:
        Validated data

    Raises:
        SecurityError: If validation fails
    """
    if not isinstance(data, dict):
        raise SecurityError("Payload must be a JSON object")

    # SECURITY FIX: Check for excessive nesting depth
    def check_depth(obj, current_depth=0, max_depth=10):
        if current_depth > max_depth:
            raise SecurityError("JSON payload too deeply nested")

        if isinstance(obj, dict):
            for value in obj.values():
                check_depth(value, current_depth + 1, max_depth)
        elif isinstance(obj, list):
            for item in obj:
                check_depth(item, current_depth + 1, max_depth)

    check_depth(data)

    # Check size (approximate)
    payload_str = json.dumps(data)
    if len(payload_str.encode('utf-8')) > max_size:
        raise SecurityError(f"Payload too large (max {max_size} bytes)")

    # SECURITY FIX: Enhanced suspicious patterns
    suspicious_patterns = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',  # JavaScript protocols
        r'vbscript:',    # VBScript protocols
        r'data:text/html',  # Data URLs with HTML
        r'eval\s*\(',    # eval() calls
        r'Function\s*\(',  # Function constructor
        r'setTimeout\s*\(',  # setTimeout calls
        r'setInterval\s*\(',  # setInterval calls
        r'document\.',   # DOM manipulation
        r'window\.',     # Window object access
        r'location\.',   # Location object access
        r'__proto__',    # Prototype pollution
        r'constructor',  # Constructor access
        r'alert\s*\(',   # Alert functions
        r'confirm\s*\(',  # Confirm functions
        r'prompt\s*\(',  # Prompt functions
        r'onload',       # Event handlers
        r'onerror',      # Error handlers
        r'onclick',      # Click handlers
    ]

    def validate_value(key: str, value: Any, depth: int = 0):
        if depth > 5:  # Prevent infinite recursion
            return

        if isinstance(value, str):
            # SECURITY FIX: Length limit per field
            if len(value) > 50000:
                raise SecurityError(f"Field '{key}' too long")

            for pattern in suspicious_patterns:
                if re.search(pattern, value, re.IGNORECASE):
                    console.error(f"Suspicious pattern detected in field '{key}': {pattern}")
                    raise SecurityError(f"Invalid content in field '{key}'")

        elif isinstance(value, dict):
            for sub_key, sub_value in value.items():
                validate_value(f"{key}.{sub_key}", sub_value, depth + 1)

        elif isinstance(value, list):
            for i, item in enumerate(value):
                validate_value(f"{key}[{i}]", item, depth + 1)

    for key, value in data.items():
        validate_value(key, value)

    return data

def validate_uuid_format(uuid_str: str) -> bool:
    """Validate UUID format"""
    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    return bool(re.match(uuid_pattern, uuid_str, re.IGNORECASE))

def sanitize_sql_input(input_str: str) -> str:
    """Basic SQL injection prevention"""
    if not isinstance(input_str, str):
        return str(input_str)

    # Remove or escape dangerous SQL characters
    dangerous_chars = ["'", '"', ';', '--', '/*', '*/', 'xp_', 'sp_']
    sanitized = input_str

    for char in dangerous_chars:
        if char in sanitized:
            console.log(f"Removed dangerous SQL character: {char}")
            sanitized = sanitized.replace(char, '')

    return sanitized.strip()

def get_security_headers() -> Dict[str, str]:
    """Get security headers for responses"""
    return {
        # CORS headers
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",

        # Security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",

        # Additional security headers
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
    }

async def security_middleware(request, next_handler):
    """
    Main security middleware function

    Args:
        request: Request object
        next_handler: Next handler function

    Returns:
        Response with security checks applied
    """
    start_time = time.time()

    try:
        # Get client IP
        client_ip = get_client_ip(request)
        console.log(f"Request from IP: {client_ip}")

        # Rate limiting check
        if rate_limiter.is_rate_limited(client_ip, limit=100, window=3600):
            console.error(f"Rate limit exceeded for IP: {client_ip}")
            return Response.new(
                json.dumps({
                    "error": "Rate limit exceeded",
                    "code": "SEC-429",
                    "retry_after": 3600
                }),
                status=429,
                headers=get_security_headers()
            )

        # Handle CORS preflight
        if request.method == "OPTIONS":
            return Response.new(
                json.dumps({"status": "ok"}),
                status=200,
                headers=get_security_headers()
            )

        # Validate request headers
        content_type = request.headers.get('Content-Type', '')
        if request.method in ['POST', 'PUT', 'PATCH']:
            if not content_type.startswith('application/json'):
                return Response.new(
                    json.dumps({
                        "error": "Content-Type must be application/json",
                        "code": "SEC-400"
                    }),
                    status=400,
                    headers=get_security_headers()
                )

        # Call next handler
        response = await next_handler(request)

        # Add security headers to response
        if hasattr(response, 'headers'):
            security_headers = get_security_headers()
            for key, value in security_headers.items():
                response.headers.set(key, value)

        # Log request completion
        duration = (time.time() - start_time) * 1000
        console.log(f"Request completed in {duration:.2f}ms for IP: {client_ip}")

        return response

    except SecurityError as e:
        console.error(f"Security error: {str(e)}")
        return Response.new(
            json.dumps({
                "error": str(e),
                "code": "SEC-400"
            }),
            status=400,
            headers=get_security_headers()
        )
    except Exception as e:
        console.error(f"Security middleware error: {str(e)}")
        return Response.new(
            json.dumps({
                "error": "Security check failed",
                "code": "SEC-500"
            }),
            status=500,
            headers=get_security_headers()
        )

class InputValidator:
    """Input validation utilities"""

    @staticmethod
    def validate_roadmap_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate roadmap creation/update data"""
        validated = validate_json_payload(data, max_size=1024 * 500)  # 500KB max

        # Required fields
        if 'json_graph' not in validated:
            raise SecurityError("Missing required field: json_graph")

        # Validate json_graph
        json_graph = validated['json_graph']
        if isinstance(json_graph, str):
            try:
                graph_data = json.loads(json_graph)
            except json.JSONDecodeError:
                raise SecurityError("Invalid JSON in json_graph field")
        elif isinstance(json_graph, dict):
            graph_data = json_graph
        else:
            raise SecurityError("json_graph must be a JSON string or object")

        # Validate graph structure
        if not isinstance(graph_data, dict):
            raise SecurityError("json_graph must be a JSON object")

        if 'nodes' not in graph_data or 'edges' not in graph_data:
            raise SecurityError("json_graph must contain 'nodes' and 'edges' arrays")

        if not isinstance(graph_data['nodes'], list) or not isinstance(graph_data['edges'], list):
            raise SecurityError("nodes and edges must be arrays")

        # Limit graph size
        if len(graph_data['nodes']) > 1000:
            raise SecurityError("Too many nodes (max 1000)")

        if len(graph_data['edges']) > 5000:
            raise SecurityError("Too many edges (max 5000)")

        # Validate optional fields
        if 'vibe_mode' in validated:
            if not isinstance(validated['vibe_mode'], bool):
                raise SecurityError("vibe_mode must be a boolean")

        if 'thrive_score' in validated:
            score = validated['thrive_score']
            if not isinstance(score, (int, float)) or score < 0 or score > 1:
                raise SecurityError("thrive_score must be a number between 0 and 1")

        return validated

    @staticmethod
    def validate_snippet_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate code snippet data"""
        validated = validate_json_payload(data, max_size=1024 * 50)  # 50KB max

        # Required fields
        if 'code' not in validated:
            raise SecurityError("Missing required field: code")

        # Validate code content
        code = validated['code']
        if not isinstance(code, str):
            raise SecurityError("code must be a string")

        if len(code) > 50000:  # 50KB max for code
            raise SecurityError("Code too long (max 50KB)")

        # Validate category
        if 'category' in validated:
            category = validated['category']
            if not isinstance(category, str):
                raise SecurityError("category must be a string")

            allowed_categories = ['ui', 'api', 'database', 'auth', 'cache', 'deploy', 'test', 'general']
            if category not in allowed_categories:
                raise SecurityError(f"Invalid category. Allowed: {', '.join(allowed_categories)}")

        # Validate version
        if 'version' in validated:
            version = validated['version']
            if not isinstance(version, int) or version < 1:
                raise SecurityError("version must be a positive integer")

        return validated

# Export main functions
__all__ = [
    'security_middleware',
    'InputValidator',
    'validate_json_payload',
    'validate_uuid_format',
    'sanitize_sql_input',
    'get_security_headers',
    'SecurityError',
    'rate_limiter'
]