"""
Rate Limiter Durable Object for ProtoThrive

Implements distributed rate limiting using Cloudflare Durable Objects
with sliding window algorithm for accurate rate limiting across
all edge locations.

Features:
- Per-user rate limiting
- Per-IP rate limiting
- API key rate limiting
- Sliding window algorithm
- Automatic cleanup of old entries
- DDoS protection
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import json
import hashlib
from dataclasses import dataclass, asdict
from enum import Enum

# Cloudflare Durable Object imports
from js import DurableObject, Response, Request


class RateLimitType(Enum):
    """Types of rate limiting"""
    USER = "user"
    IP = "ip"
    API_KEY = "api_key"
    GLOBAL = "global"


@dataclass
class RateLimitConfig:
    """Configuration for rate limits"""
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    burst_size: int = 10
    block_duration_seconds: int = 300  # 5 minutes


@dataclass
class RateLimitWindow:
    """Sliding window data"""
    count: int
    window_start: float
    window_end: float
    blocked_until: Optional[float] = None


class RateLimiterDurableObject(DurableObject):
    """
    Durable Object for distributed rate limiting.

    Each instance handles rate limiting for a specific identifier
    (user, IP, or API key) with consistent state across all edges.
    """

    def __init__(self, state: Any, env: Dict[str, Any]):
        """Initialize rate limiter with state storage"""
        super().__init__(state, env)
        self.state = state
        self.env = env

        # Default configurations per type
        self.configs = {
            RateLimitType.USER: RateLimitConfig(
                requests_per_minute=100,
                requests_per_hour=2000,
                requests_per_day=20000
            ),
            RateLimitType.IP: RateLimitConfig(
                requests_per_minute=60,
                requests_per_hour=1000,
                requests_per_day=10000
            ),
            RateLimitType.API_KEY: RateLimitConfig(
                requests_per_minute=200,
                requests_per_hour=5000,
                requests_per_day=50000
            ),
            RateLimitType.GLOBAL: RateLimitConfig(
                requests_per_minute=1000,
                requests_per_hour=50000,
                requests_per_day=500000
            )
        }

        # Window tracking
        self.windows: Dict[str, List[float]] = {}
        self.blocked: Dict[str, float] = {}

    async def fetch(self, request: Request) -> Response:
        """
        Handle rate limit check request.

        Expected request body:
        {
            "identifier": "user_123",
            "type": "user",
            "increment": true
        }
        """
        try:
            body = await request.json()
            identifier = body.get("identifier")
            limit_type = RateLimitType(body.get("type", "user"))
            increment = body.get("increment", True)

            if not identifier:
                return Response.new(
                    json.dumps({"error": "Identifier required"}),
                    status=400,
                    headers={"Content-Type": "application/json"}
                )

            # Check rate limit
            result = await self.check_rate_limit(
                identifier,
                limit_type,
                increment
            )

            return Response.new(
                json.dumps(asdict(result)),
                status=200,
                headers={"Content-Type": "application/json"}
            )

        except Exception as e:
            return Response.new(
                json.dumps({"error": str(e)}),
                status=500,
                headers={"Content-Type": "application/json"}
            )

    async def check_rate_limit(
        self,
        identifier: str,
        limit_type: RateLimitType,
        increment: bool = True
    ) -> Dict[str, Any]:
        """
        Check if identifier has exceeded rate limit.

        Returns:
            Dictionary with:
            - allowed: bool - Whether request is allowed
            - remaining: int - Requests remaining in window
            - reset_at: float - When window resets (timestamp)
            - retry_after: int - Seconds until retry (if blocked)
        """
        current_time = datetime.utcnow().timestamp()
        config = self.configs[limit_type]

        # Create composite key for storage
        key = f"{limit_type.value}:{identifier}"

        # Check if currently blocked
        if key in self.blocked:
            blocked_until = self.blocked[key]
            if current_time < blocked_until:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": blocked_until,
                    "retry_after": int(blocked_until - current_time),
                    "reason": "Rate limit exceeded - blocked"
                }
            else:
                # Block expired, remove it
                del self.blocked[key]

        # Get or create window
        if key not in self.windows:
            self.windows[key] = []

        window = self.windows[key]

        # Clean old entries (older than 1 day)
        cutoff_time = current_time - 86400
        self.windows[key] = [t for t in window if t > cutoff_time]
        window = self.windows[key]

        # Check limits for different time windows
        checks = [
            (60, config.requests_per_minute, "per_minute"),
            (3600, config.requests_per_hour, "per_hour"),
            (86400, config.requests_per_day, "per_day")
        ]

        for window_seconds, limit, limit_name in checks:
            window_start = current_time - window_seconds
            recent_requests = [t for t in window if t > window_start]

            if len(recent_requests) >= limit:
                # Rate limit exceeded - block the identifier
                self.blocked[key] = current_time + config.block_duration_seconds

                # Save state to durable storage
                await self.state.storage.put(f"blocked:{key}", self.blocked[key])

                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": current_time + window_seconds,
                    "retry_after": config.block_duration_seconds,
                    "reason": f"Rate limit exceeded - {limit_name}",
                    "limit": limit,
                    "window": limit_name
                }

        # Check burst protection
        if len(window) > 0:
            recent_burst = [t for t in window if t > current_time - 1]  # Last second
            if len(recent_burst) >= config.burst_size:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "reset_at": current_time + 1,
                    "retry_after": 1,
                    "reason": "Burst limit exceeded"
                }

        # Request allowed
        if increment:
            # Add current request to window
            self.windows[key].append(current_time)

            # Save state periodically (every 10 requests)
            if len(self.windows[key]) % 10 == 0:
                await self.state.storage.put(f"window:{key}", self.windows[key])

        # Calculate remaining requests (use minute window as primary)
        minute_window = [t for t in window if t > current_time - 60]
        remaining = config.requests_per_minute - len(minute_window)

        return {
            "allowed": True,
            "remaining": max(0, remaining),
            "reset_at": current_time + 60,
            "retry_after": 0,
            "requests_in_minute": len(minute_window),
            "limit_per_minute": config.requests_per_minute
        }

    async def reset_limits(self, identifier: str, limit_type: RateLimitType) -> None:
        """Reset rate limits for specific identifier"""
        key = f"{limit_type.value}:{identifier}"

        if key in self.windows:
            del self.windows[key]
        if key in self.blocked:
            del self.blocked[key]

        # Clear from durable storage
        await self.state.storage.delete(f"window:{key}")
        await self.state.storage.delete(f"blocked:{key}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get statistics about current rate limiting state"""
        current_time = datetime.utcnow().timestamp()

        stats = {
            "active_windows": len(self.windows),
            "blocked_identifiers": len(self.blocked),
            "identifiers": {}
        }

        for key, window in self.windows.items():
            limit_type, identifier = key.split(":", 1)
            minute_window = [t for t in window if t > current_time - 60]
            hour_window = [t for t in window if t > current_time - 3600]

            stats["identifiers"][key] = {
                "type": limit_type,
                "identifier": identifier,
                "requests_per_minute": len(minute_window),
                "requests_per_hour": len(hour_window),
                "is_blocked": key in self.blocked
            }

        return stats


class RateLimiterStub:
    """
    Stub implementation for local testing without Durable Objects.

    This provides the same interface but uses in-memory storage.
    """

    def __init__(self):
        self.windows: Dict[str, List[float]] = {}
        self.blocked: Dict[str, float] = {}
        self.configs = {
            RateLimitType.USER: RateLimitConfig(),
            RateLimitType.IP: RateLimitConfig(),
            RateLimitType.API_KEY: RateLimitConfig(),
            RateLimitType.GLOBAL: RateLimitConfig()
        }

    async def check_rate_limit(
        self,
        identifier: str,
        limit_type: str = "user",
        increment: bool = True
    ) -> Dict[str, Any]:
        """Stub implementation of rate limit checking"""
        # For testing, always allow with mock data
        return {
            "allowed": True,
            "remaining": 50,
            "reset_at": datetime.utcnow().timestamp() + 60,
            "retry_after": 0
        }


# Export for use in application
__all__ = [
    'RateLimiterDurableObject',
    'RateLimiterStub',
    'RateLimitType',
    'RateLimitConfig'
]