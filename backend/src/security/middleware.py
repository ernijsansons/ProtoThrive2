"""
Security Middleware for ProtoThrive Backend
Implements comprehensive security checks and protection
"""

import time
import hashlib
from typing import Any, Dict, Optional, Set, Union
from js import Request, Response, console
from .validation import SecurityValidationError, validate_auth_header

class SecurityMiddleware:
    """Comprehensive security middleware"""

    def __init__(self):
        # In-memory rate limiting (use Redis in production)
        self.rate_limit_store: Dict[str, Dict[str, Any]] = {}
        self.blocked_ips: Set[str] = set()

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        # Check various headers for real IP
        headers_to_check = [
            'CF-Connecting-IP',  # Cloudflare
            'X-Forwarded-For',
            'X-Real-IP',
            'X-Client-IP'
        ]

        for header in headers_to_check:
            ip = request.headers.get(header)
            if ip:
                # Take first IP if comma-separated
                return ip.split(',')[0].strip()

        # Fallback to request IP (may not be available in Workers)
        return 'unknown'

    def check_rate_limit(self, ip: str, endpoint: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """Check if request exceeds rate limit"""
        current_time = time.time()
        key = f"{ip}:{endpoint}"

        if key not in self.rate_limit_store:
            self.rate_limit_store[key] = {
                'requests': [],
                'blocked_until': 0
            }

        store = self.rate_limit_store[key]

        # Check if currently blocked
        if current_time < store['blocked_until']:
            return False

        # Clean old requests outside window
        store['requests'] = [
            req_time for req_time in store['requests']
            if current_time - req_time < window_seconds
        ]

        # Check rate limit
        if len(store['requests']) >= max_requests:
            # Block for 1 hour
            store['blocked_until'] = current_time + 3600
            console.log(f"Rate limit exceeded for IP {ip} on endpoint {endpoint}")
            return False

        # Add current request
        store['requests'].append(current_time)
        return True

    def validate_request_headers(self, request: Request) -> Optional[str]:
        """Validate request headers for security"""
        # Check Content-Type for POST/PUT requests
        method = request.method.upper()
        if method in ['POST', 'PUT', 'PATCH']:
            content_type = request.headers.get('Content-Type', '')
            if not content_type.startswith('application/json'):
                return "Invalid Content-Type. Must be application/json"

        # Check for suspicious User-Agent patterns
        user_agent = request.headers.get('User-Agent', '')
        if not user_agent or len(user_agent) > 500:
            return "Invalid or missing User-Agent"

        # Check for suspicious headers that might indicate automated attacks
        suspicious_headers = [
            'X-Forwarded-Proto',
            'X-Forwarded-Host',
            'X-Original-URL',
            'X-Rewrite-URL'
        ]

        for header in suspicious_headers:
            if header in request.headers:
                value = request.headers.get(header)
                if value and ('script' in value.lower() or '<' in value):
                    return f"Suspicious {header} header detected"

        return None

    def check_blocked_ip(self, ip: str) -> bool:
        """Check if IP is blocked"""
        return ip in self.blocked_ips

    def block_ip(self, ip: str, reason: str = "Security violation"):
        """Block an IP address"""
        self.blocked_ips.add(ip)
        console.log(f"Blocked IP {ip}: {reason}")

    async def validate_request_body(self, request: Request) -> Optional[str]:
        """Validate request body for security issues"""
        method = request.method.upper()
        if method not in ['POST', 'PUT', 'PATCH']:
            return None

        try:
            body_text = await request.text()
            if not body_text:
                return None

            # Check body size
            if len(body_text) > 100000:  # 100KB limit
                return "Request body too large"

            # Check for common injection patterns
            body_lower = body_text.lower()

            # Check for script injection
            if '<script' in body_lower or 'javascript:' in body_lower:
                return "Script injection detected in request body"

            # Check for SQL injection patterns
            sql_patterns = ['union select', 'drop table', 'delete from', 'insert into']
            for pattern in sql_patterns:
                if pattern in body_lower:
                    return "SQL injection pattern detected in request body"

        except Exception as e:
            console.error(f"Error validating request body: {str(e)}")
            return "Error processing request body"

        return None

    async def process_request(self, request: Request) -> Any:
        """Process request through security middleware"""

        # Get client IP
        client_ip = self.get_client_ip(request)

        # Check if IP is blocked
        if self.check_blocked_ip(client_ip):
            console.log(f"Blocked request from IP: {client_ip}")
            return self.create_error_response("Access denied", 403)

        # Validate headers
        header_error = self.validate_request_headers(request)
        if header_error:
            console.log(f"Header validation failed for IP {client_ip}: {header_error}")
            self.block_ip(client_ip, f"Header validation: {header_error}")
            return self.create_error_response("Invalid request headers", 400)

        # Validate request body
        body_error = await self.validate_request_body(request)
        if body_error:
            console.log(f"Body validation failed for IP {client_ip}: {body_error}")
            self.block_ip(client_ip, f"Body validation: {body_error}")
            return self.create_error_response("Invalid request body", 400)

        # Check rate limiting
        endpoint = self.get_endpoint_from_path(request.url)
        if not self.check_rate_limit(client_ip, endpoint):
            console.log(f"Rate limit exceeded for IP {client_ip} on endpoint {endpoint}")
            return self.create_error_response("Rate limit exceeded", 429)

        # Request passed all security checks
        return None

    def get_endpoint_from_path(self, url: str) -> str:
        """Extract endpoint from URL for rate limiting"""
        try:
            from urllib.parse import urlparse
            path = urlparse(url).path
            # Remove /api prefix and get first path segment
            if path.startswith('/api/'):
                path = path[5:]
            return path.split('/')[0] if path else 'root'
        except:
            return 'unknown'

    def create_error_response(self, message: str, status: int) -> Any:
        """Create standardized error response"""
        import json
        return Response.new(
            json.dumps({
                "error": message,
                "code": f"SEC-{status}",
                "timestamp": time.time()
            }),
            status=status,
            headers={
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block"
            }
        )

class AuthenticationMiddleware:
    """Authentication middleware"""

    @staticmethod
    async def validate_auth(request: Request) -> Optional[Dict[str, Any]]:
        """Validate authentication for protected endpoints"""
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return None

            # Validate auth header format
            token = validate_auth_header(auth_header)
            if not token:
                return None

            # For MVP, use simple token validation
            # TODO: Implement proper JWT validation with PyJWT
            if token == 'mock_token_for_development':
                return {
                    'id': 'dev_user_123',
                    'email': 'developer@protothrive.com',
                    'role': 'vibe_coder'
                }

            # Basic JWT format check (header.payload.signature)
            import re
            if re.match(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$', token):
                return {
                    'id': 'authenticated_user',
                    'email': 'user@protothrive.com',
                    'role': 'vibe_coder'
                }

            return None

        except SecurityValidationError as e:
            console.error(f"Auth validation error: {str(e)}")
            return None
        except Exception as e:
            console.error(f"Unexpected auth error: {str(e)}")
            return None

    @staticmethod
    def create_auth_error_response() -> Any:
        """Create authentication error response"""
        import json
        return Response.new(
            json.dumps({
                "error": "Authentication required",
                "code": "AUTH-401",
                "timestamp": time.time()
            }),
            status=401,
            headers={
                "Content-Type": "application/json",
                "WWW-Authenticate": "Bearer"
            }
        )

# Global middleware instances
security_middleware = SecurityMiddleware()
auth_middleware = AuthenticationMiddleware()