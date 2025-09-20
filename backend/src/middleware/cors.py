"""
CORS Security Middleware for ProtoThrive

Implements secure Cross-Origin Resource Sharing (CORS) policies
to prevent unauthorized cross-origin requests while allowing
legitimate frontend applications to access the API.

Security improvements:
- Origin whitelist validation
- Environment-specific allowed origins
- Proper preflight handling
- CSRF token support
"""

from typing import Dict, List, Optional, Any
from urllib.parse import urlparse
import os

# Import Cloudflare Workers types
from js import Response, Request


class CORSConfig:
    """CORS configuration with security best practices"""

    def __init__(self, env: Dict[str, Any]):
        """
        Initialize CORS configuration from environment.

        Args:
            env: Environment variables and bindings
        """
        self.env = env

        # Get allowed origins from environment or use defaults
        origins_str = env.get("ALLOWED_ORIGINS", "")
        if origins_str:
            self.allowed_origins = [
                origin.strip() for origin in origins_str.split(",")
            ]
        else:
            # Default origins based on environment
            environment = env.get("ENVIRONMENT", "development")
            self.allowed_origins = self._get_default_origins(environment)

        # CORS settings
        self.allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        self.allowed_headers = [
            "Content-Type",
            "Authorization",
            "X-CSRF-Token",
            "X-Request-ID",
            "X-Agent-Budget",
            "X-Agent-Mode"
        ]
        self.exposed_headers = [
            "X-Request-ID",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
        self.max_age = 86400  # 24 hours for preflight cache
        self.credentials = True  # Allow credentials (cookies, auth headers)

    def _get_default_origins(self, environment: str) -> List[str]:
        """
        Get default allowed origins based on environment.

        Security: Production should have strict origin list
        """
        if environment == "production":
            return [
                "https://protothrive.com",
                "https://www.protothrive.com",
                "https://app.protothrive.com",
                "https://dashboard.protothrive.com"
            ]
        elif environment == "staging":
            return [
                "https://staging.protothrive.com",
                "https://staging-app.protothrive.com",
                "http://localhost:3000",
                "http://localhost:5000"
            ]
        else:  # development
            return [
                "http://localhost:3000",
                "http://localhost:5000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5000",
                "http://127.0.0.1:5173",
                # Allow Cloudflare preview URLs in development
                "https://*.pages.dev",
                "https://*.workers.dev"
            ]

    def is_origin_allowed(self, origin: Optional[str]) -> bool:
        """
        Check if origin is allowed.

        Args:
            origin: Origin header from request

        Returns:
            True if origin is allowed, False otherwise
        """
        if not origin:
            return False

        # Check exact match
        if origin in self.allowed_origins:
            return True

        # Check wildcard patterns (only in non-production)
        if self.env.get("ENVIRONMENT") != "production":
            for allowed in self.allowed_origins:
                if "*" in allowed:
                    # Convert wildcard to regex pattern
                    pattern = allowed.replace(".", r"\.").replace("*", ".*")
                    import re
                    if re.match(f"^{pattern}$", origin):
                        return True

        return False

    def get_cors_headers(self, request: Request) -> Dict[str, str]:
        """
        Generate CORS headers based on request.

        Args:
            request: Incoming request object

        Returns:
            Dictionary of CORS headers
        """
        headers = {}
        origin = request.headers.get("Origin")

        if origin and self.is_origin_allowed(origin):
            # Set origin-specific headers
            headers["Access-Control-Allow-Origin"] = origin
            headers["Vary"] = "Origin"

            # Allow credentials only for allowed origins
            if self.credentials:
                headers["Access-Control-Allow-Credentials"] = "true"
        elif self.env.get("ENVIRONMENT") == "development":
            # In development, be more permissive but log warnings
            print(f"CORS Warning: Origin '{origin}' not in allowed list")
            headers["Access-Control-Allow-Origin"] = origin or "*"
        else:
            # In production, reject unknown origins
            # Don't set Access-Control-Allow-Origin header
            pass

        # Set other CORS headers
        headers["Access-Control-Allow-Methods"] = ", ".join(self.allowed_methods)
        headers["Access-Control-Allow-Headers"] = ", ".join(self.allowed_headers)
        headers["Access-Control-Expose-Headers"] = ", ".join(self.exposed_headers)
        headers["Access-Control-Max-Age"] = str(self.max_age)

        # Security headers
        headers["X-Content-Type-Options"] = "nosniff"
        headers["X-Frame-Options"] = "DENY"
        headers["X-XSS-Protection"] = "1; mode=block"
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        if self.env.get("ENVIRONMENT") == "production":
            headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.protothrive.com; "
                "frame-ancestors 'none';"
            )

        return headers

    def handle_preflight(self, request: Request) -> Response:
        """
        Handle CORS preflight requests.

        Args:
            request: Preflight OPTIONS request

        Returns:
            Response with appropriate CORS headers
        """
        origin = request.headers.get("Origin")

        if not origin or not self.is_origin_allowed(origin):
            # Reject preflight for unauthorized origins
            return Response.new(
                "Forbidden",
                status=403,
                headers={"Content-Type": "text/plain"}
            )

        # Generate CORS headers
        headers = self.get_cors_headers(request)

        # Return successful preflight response
        return Response.new(
            "",
            status=200,
            headers=headers
        )


class CORSMiddleware:
    """
    CORS middleware for request processing.

    Usage:
        cors = CORSMiddleware(env)

        # Handle preflight
        if request.method == "OPTIONS":
            return cors.handle_preflight(request)

        # Add CORS headers to response
        response = cors.add_cors_headers(request, response)
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize CORS middleware with configuration"""
        self.config = CORSConfig(env)

    def handle_preflight(self, request: Request) -> Response:
        """Handle CORS preflight requests"""
        return self.config.handle_preflight(request)

    def add_cors_headers(self, request: Request, response: Response) -> Response:
        """
        Add CORS headers to response.

        Args:
            request: Original request
            response: Response to modify

        Returns:
            Response with CORS headers added
        """
        cors_headers = self.config.get_cors_headers(request)

        # Clone response and add headers
        new_headers = dict(response.headers)
        new_headers.update(cors_headers)

        return Response.new(
            response.body,
            status=response.status,
            headers=new_headers
        )

    def validate_csrf_token(self, request: Request) -> bool:
        """
        Validate CSRF token for state-changing operations.

        Args:
            request: Request to validate

        Returns:
            True if CSRF token is valid or not required
        """
        # CSRF protection only for state-changing methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Check CSRF token
        csrf_header = request.headers.get("X-CSRF-Token")
        csrf_cookie = self._get_cookie(request, "csrf_token")

        if not csrf_header or not csrf_cookie:
            return False

        # Validate token matches
        return csrf_header == csrf_cookie

    def _get_cookie(self, request: Request, name: str) -> Optional[str]:
        """Extract cookie value from request"""
        cookie_header = request.headers.get("Cookie", "")
        for cookie in cookie_header.split(";"):
            parts = cookie.strip().split("=", 1)
            if len(parts) == 2 and parts[0] == name:
                return parts[1]
        return None


# Export for use in main application
__all__ = ['CORSMiddleware', 'CORSConfig']