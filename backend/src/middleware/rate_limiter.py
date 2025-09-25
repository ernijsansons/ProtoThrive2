"""
Rate limiting middleware for Cloudflare Workers
Uses KV store for tracking request counts per IP/user
"""

import time
import json
from typing import Dict, Any, Optional, Callable
from js import Response

class RateLimiter:
    """Rate limiting implementation using Cloudflare KV"""

    def __init__(self, env: Dict[str, Any]):
        self.env = env
        self.kv = getattr(env, 'KV', None)

    async def check_rate_limit(self, key: str, limit: int, window: int) -> tuple[bool, dict]:
        """
        Check if request is within rate limit

        Args:
            key: Unique identifier (IP, user_id, etc.)
            limit: Maximum requests allowed
            window: Time window in seconds

        Returns:
            (is_allowed, rate_info)
        """
        if not self.kv:
            # If KV is not available, allow all requests
            return True, {"remaining": limit, "reset_time": int(time.time()) + window}

        current_time = int(time.time())
        bucket_key = f"rate_limit:{key}:{current_time // window}"

        try:
            # Get current count
            current_data = await self.kv.get(bucket_key)
            if current_data:
                data = json.loads(current_data)
                count = data.get("count", 0)
            else:
                count = 0

            # Check if limit exceeded
            if count >= limit:
                rate_info = {
                    "remaining": 0,
                    "reset_time": (current_time // window + 1) * window,
                    "retry_after": (current_time // window + 1) * window - current_time
                }
                return False, rate_info

            # Increment count
            new_count = count + 1
            new_data = {
                "count": new_count,
                "first_request": current_data.get("first_request", current_time) if current_data else current_time
            }

            # Store with TTL
            await self.kv.put(bucket_key, json.dumps(new_data), {"expirationTtl": window + 60})

            rate_info = {
                "remaining": limit - new_count,
                "reset_time": (current_time // window + 1) * window
            }

            return True, rate_info

        except Exception as e:
            print(f"Rate limit check failed: {e}")
            # On error, allow the request
            return True, {"remaining": limit, "reset_time": current_time + window}

def get_rate_limit_key(request, user_id: Optional[str] = None) -> str:
    """Generate rate limit key from request"""
    # Use user ID if available, otherwise fall back to IP
    if user_id:
        return f"user:{user_id}"

    # Get IP from request headers
    ip = (request.headers.get("CF-Connecting-IP") or
          request.headers.get("X-Forwarded-For") or
          request.headers.get("X-Real-IP") or
          "unknown")

    return f"ip:{ip}"

async def rate_limit_middleware(env: Dict[str, Any], limits: Dict[str, tuple[int, int]]):
    """
    Rate limiting middleware factory

    Args:
        env: Cloudflare environment
        limits: Dict of path patterns to (limit, window) tuples
    """
    rate_limiter = RateLimiter(env)

    async def middleware(request, next_handler: Callable):
        # Parse request path
        from urllib.parse import urlparse
        parsed = urlparse(request.url)
        path = parsed.path.strip('/')

        # Remove /api prefix if present
        if path.startswith('api/'):
            path = path[4:]

        # Determine rate limit for this endpoint
        limit, window = get_endpoint_limits(path, limits)

        # Skip rate limiting for health checks
        if path == "health" or path == "":
            return await next_handler(request)

        # Get rate limit key
        # Try to extract user from auth header if available
        user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header:
            try:
                # This would need to be updated to extract user from JWT
                # For now, we'll just use IP-based limiting
                pass
            except:
                pass

        key = get_rate_limit_key(request, user_id)

        # Check rate limit
        is_allowed, rate_info = await rate_limiter.check_rate_limit(key, limit, window)

        if not is_allowed:
            headers = {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(rate_info["reset_time"]),
                "Retry-After": str(rate_info.get("retry_after", window))
            }

            error_response = {
                "error": "Rate limit exceeded",
                "code": "RATE-429",
                "limit": limit,
                "window": window,
                "reset_time": rate_info["reset_time"]
            }

            return Response.new(json.dumps(error_response), status=429, headers=headers)

        # Add rate limit headers to response
        response = await next_handler(request)

        # Add rate limit headers
        response.headers.set("X-RateLimit-Limit", str(limit))
        response.headers.set("X-RateLimit-Remaining", str(rate_info["remaining"]))
        response.headers.set("X-RateLimit-Reset", str(rate_info["reset_time"]))

        return response

    return middleware

def get_endpoint_limits(path: str, limits: Dict[str, tuple[int, int]]) -> tuple[int, int]:
    """Get rate limit for specific endpoint"""

    # Default limits per endpoint type
    default_limits = {
        "auth": (10, 60),        # 10 requests per minute for auth
        "roadmaps": (100, 60),   # 100 requests per minute for roadmaps
        "snippets": (50, 60),    # 50 requests per minute for snippets
        "agent": (10, 3600),     # 10 requests per hour for AI agent
        "default": (100, 60)     # Default: 100 requests per minute
    }

    # Check custom limits first
    for pattern, limit_config in limits.items():
        if pattern in path:
            return limit_config

    # Check default patterns
    if path.startswith("auth"):
        return default_limits["auth"]
    elif path.startswith("roadmaps"):
        return default_limits["roadmaps"]
    elif path.startswith("snippets"):
        return default_limits["snippets"]
    elif path.startswith("agent"):
        return default_limits["agent"]
    else:
        return default_limits["default"]