"""
Rate Limiting Middleware for ProtoThrive

Integrates with Durable Objects for distributed rate limiting
across all Cloudflare edge locations.

Features:
- User-based rate limiting
- IP-based rate limiting
- API key rate limiting
- Custom rate limit headers
- Graceful degradation if DO unavailable
"""

from typing import Dict, Optional, Any
import json
import hashlib
from urllib.parse import urlparse

# Cloudflare imports
from js import Response, Request


class RateLimitMiddleware:
    """
    Rate limiting middleware using Durable Objects.

    Provides consistent rate limiting across all edge locations
    with automatic failover to local rate limiting if needed.
    """

    def __init__(self, env: Dict[str, Any]):
        """
        Initialize rate limit middleware.

        Args:
            env: Environment with Durable Object bindings
        """
        self.env = env
        self.rate_limiter_namespace = env.get("RATE_LIMITER")
        self.enabled = env.get("ENABLE_RATE_LIMITING", "true").lower() == "true"

        # Fallback configuration if DO is unavailable
        self.fallback_limits = {
            "user": {"per_minute": 100, "per_hour": 2000},
            "ip": {"per_minute": 60, "per_hour": 1000},
            "api_key": {"per_minute": 200, "per_hour": 5000}
        }

        # Local tracking for fallback (simple in-memory)
        self.local_counters: Dict[str, Dict[str, int]] = {}

    async def check_rate_limit(
        self,
        request: Request,
        user: Optional[Dict[str, Any]] = None
    ) -> Optional[Response]:
        """
        Check rate limits for the request.

        Args:
            request: Incoming request
            user: Authenticated user data (if available)

        Returns:
            Response if rate limited, None if allowed
        """
        if not self.enabled:
            return None

        # Extract identifiers
        ip_address = self._get_client_ip(request)
        user_id = user.get("id") if user else None
        api_key = self._get_api_key(request)

        # Determine which identifier to use for rate limiting
        if user_id:
            identifier = f"user_{user_id}"
            limit_type = "user"
        elif api_key:
            identifier = f"api_{self._hash_api_key(api_key)}"
            limit_type = "api_key"
        else:
            identifier = f"ip_{ip_address}"
            limit_type = "ip"

        # Check rate limit
        result = await self._check_with_durable_object(
            identifier,
            limit_type,
            request
        )

        if not result.get("allowed", True):
            # Rate limit exceeded - return 429 response
            return self._create_rate_limit_response(result)

        # Add rate limit headers to indicate current status
        request.rate_limit_headers = self._create_rate_limit_headers(result)

        return None

    async def _check_with_durable_object(
        self,
        identifier: str,
        limit_type: str,
        request: Request
    ) -> Dict[str, Any]:
        """
        Check rate limit using Durable Object.

        Falls back to local rate limiting if DO is unavailable.
        """
        if not self.rate_limiter_namespace:
            # Fallback to local rate limiting
            return self._check_local_rate_limit(identifier, limit_type)

        try:
            # Get Durable Object instance
            # Use consistent hashing for identifier to get same DO instance
            id_hash = hashlib.sha256(identifier.encode()).hexdigest()
            stub = self.rate_limiter_namespace.get(
                self.rate_limiter_namespace.idFromString(id_hash)
            )

            # Make request to Durable Object
            do_request = Request.new(
                "http://rate-limiter/check",
                method="POST",
                headers={"Content-Type": "application/json"},
                body=json.dumps({
                    "identifier": identifier,
                    "type": limit_type,
                    "increment": True
                })
            )

            response = await stub.fetch(do_request)
            result = await response.json()

            return result

        except Exception as e:
            print(f"Rate limiter DO error: {e}, falling back to local")
            # Fallback to local rate limiting
            return self._check_local_rate_limit(identifier, limit_type)

    def _check_local_rate_limit(
        self,
        identifier: str,
        limit_type: str
    ) -> Dict[str, Any]:
        """
        Local fallback rate limiting (simplified).

        This is less accurate than DO but provides basic protection.
        """
        import time
        current_minute = int(time.time() / 60)

        # Initialize counter if needed
        if identifier not in self.local_counters:
            self.local_counters[identifier] = {}

        counter_key = f"{current_minute}"
        if counter_key not in self.local_counters[identifier]:
            self.local_counters[identifier] = {counter_key: 0}

        # Increment counter
        self.local_counters[identifier][counter_key] += 1

        # Check limit
        limit = self.fallback_limits.get(limit_type, {}).get("per_minute", 60)
        count = self.local_counters[identifier][counter_key]

        if count > limit:
            return {
                "allowed": False,
                "remaining": 0,
                "reset_at": (current_minute + 1) * 60,
                "retry_after": 60,
                "reason": "Rate limit exceeded (local fallback)"
            }

        return {
            "allowed": True,
            "remaining": max(0, limit - count),
            "reset_at": (current_minute + 1) * 60,
            "retry_after": 0
        }

    def _create_rate_limit_response(self, result: Dict[str, Any]) -> Response:
        """Create 429 Too Many Requests response"""
        headers = {
            "Content-Type": "application/json",
            "Retry-After": str(result.get("retry_after", 60))
        }

        # Add rate limit headers
        headers.update(self._create_rate_limit_headers(result))

        body = {
            "error": "Rate limit exceeded",
            "code": "RATE-429",
            "message": result.get("reason", "Too many requests"),
            "retry_after": result.get("retry_after", 60)
        }

        return Response.new(
            json.dumps(body),
            status=429,
            headers=headers
        )

    def _create_rate_limit_headers(self, result: Dict[str, Any]) -> Dict[str, str]:
        """Create standard rate limit headers"""
        return {
            "X-RateLimit-Limit": str(result.get("limit_per_minute", 60)),
            "X-RateLimit-Remaining": str(result.get("remaining", 0)),
            "X-RateLimit-Reset": str(int(result.get("reset_at", 0))),
            "X-RateLimit-Retry-After": str(result.get("retry_after", 0))
        }

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP from request.

        Handles Cloudflare headers and proxies.
        """
        # Try Cloudflare's CF-Connecting-IP first
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip

        # Try X-Forwarded-For
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            # Take first IP in the chain
            return xff.split(",")[0].strip()

        # Try X-Real-IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to remote address (may be Cloudflare's IP)
        # In Workers, we might not have direct access to this
        return "unknown"

    def _get_api_key(self, request: Request) -> Optional[str]:
        """Extract API key from request"""
        # Check Authorization header for API key
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("ApiKey "):
            return auth_header[7:]

        # Check X-API-Key header
        return request.headers.get("X-API-Key")

    def _hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()[:16]

    def add_rate_limit_headers(
        self,
        response: Response,
        rate_limit_result: Optional[Dict[str, Any]] = None
    ) -> Response:
        """
        Add rate limit headers to response.

        Args:
            response: Response to modify
            rate_limit_result: Rate limit check result

        Returns:
            Response with rate limit headers
        """
        if not rate_limit_result:
            return response

        headers = dict(response.headers)
        headers.update(self._create_rate_limit_headers(rate_limit_result))

        return Response.new(
            response.body,
            status=response.status,
            headers=headers
        )


# Export for use in application
__all__ = ['RateLimitMiddleware']