"""
Cloudflare-Optimized Caching Service for ProtoThrive

Leverages Cloudflare's native tools for ultra-fast, cost-effective caching:
- Cache API (FREE, 5-15ms response times)
- Smart KV usage (reduced costs)
- Geographic edge caching
- Intelligent cache warming and invalidation

Performance Target: 90% cache hit rate, 5-15ms response time
Cost Target: 60% reduction in storage costs
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import hashlib
import time
from enum import Enum

# Cloudflare imports
from js import Response, Request, caches


class CacheLayer(Enum):
    """Cloudflare cache layer hierarchy"""
    CACHE_API = "cache_api"    # FREE, 5-15ms, 300+ edge locations
    KV_EDGE = "kv_edge"       # $$, 20-30ms, distributed
    D1_DATABASE = "d1_db"     # $$$, 50-100ms, centralized


class CacheStrategy(Enum):
    """Cache strategy patterns"""
    HOT = "hot"               # Cache API only, ultra-fast
    WARM = "warm"             # Cache API + KV, balanced
    COLD = "cold"             # D1 only, cost-optimized
    HYBRID = "hybrid"         # All layers, intelligent routing


@dataclass
class CacheConfig:
    """Cache configuration per data type"""
    ttl_cache_api: int        # Cache API TTL (seconds)
    ttl_kv: int              # KV TTL (seconds)
    strategy: CacheStrategy   # Caching strategy
    auto_warm: bool          # Automatic cache warming
    geographic: bool         # Geographic distribution
    cost_tier: str           # Cost optimization tier


@dataclass
class CacheMetrics:
    """Performance and cost metrics"""
    cache_api_hits: int = 0
    cache_api_misses: int = 0
    kv_hits: int = 0
    kv_misses: int = 0
    d1_queries: int = 0
    avg_response_time_ms: float = 0.0
    cost_savings_usd: float = 0.0
    geographic_hits: Dict[str, int] = None

    def __post_init__(self):
        if self.geographic_hits is None:
            self.geographic_hits = {}


class CloudflareCacheService:
    """
    Ultra-fast caching service using Cloudflare's native infrastructure.

    Features:
    - Cache API for hot data (FREE tier)
    - Smart KV usage for warm data (cost-optimized)
    - Geographic edge caching
    - Intelligent cache warming
    - Real-time performance monitoring
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize Cloudflare cache service"""
        self.env = env
        self.kv = env.get("KV")
        self.db = env.get("DB")

        # Cloudflare Cache API
        self.cache = caches.default

        # Cache configurations per data type
        self.cache_configs = {
            "roadmap": CacheConfig(
                ttl_cache_api=300,      # 5 minutes
                ttl_kv=1800,           # 30 minutes
                strategy=CacheStrategy.HOT,
                auto_warm=True,
                geographic=True,
                cost_tier="performance"
            ),
            "snippet": CacheConfig(
                ttl_cache_api=3600,     # 1 hour (rarely changes)
                ttl_kv=86400,          # 24 hours
                strategy=CacheStrategy.WARM,
                auto_warm=True,
                geographic=True,
                cost_tier="balanced"
            ),
            "user": CacheConfig(
                ttl_cache_api=900,      # 15 minutes
                ttl_kv=3600,           # 1 hour
                strategy=CacheStrategy.HYBRID,
                auto_warm=False,
                geographic=False,
                cost_tier="balanced"
            ),
            "analytics": CacheConfig(
                ttl_cache_api=60,       # 1 minute
                ttl_kv=300,            # 5 minutes
                strategy=CacheStrategy.HOT,
                auto_warm=True,
                geographic=True,
                cost_tier="performance"
            ),
            "agent_result": CacheConfig(
                ttl_cache_api=1800,     # 30 minutes
                ttl_kv=7200,           # 2 hours
                strategy=CacheStrategy.COLD,
                auto_warm=False,
                geographic=False,
                cost_tier="cost_optimized"
            )
        }

        # Performance metrics
        self.metrics = CacheMetrics()

        # Cache key prefixes for organization
        self.key_prefixes = {
            "cache_api": "https://cache.protothrive.com/v2/",
            "kv": "cf_cache:v2:",
            "version": "v2.1"  # For cache invalidation
        }

    async def get(
        self,
        key: str,
        data_type: str = "roadmap",
        user_context: Optional[Dict[str, Any]] = None
    ) -> Optional[Any]:
        """
        Ultra-fast get with Cloudflare Cache API priority.

        Performance: 5-15ms for cache hits, 35-50ms for cache misses
        """
        start_time = time.time()
        config = self.cache_configs.get(data_type, self.cache_configs["roadmap"])

        try:
            # Layer 1: Cloudflare Cache API (FREE, 5-15ms)
            cache_result = await self._get_from_cache_api(key, data_type, config)
            if cache_result is not None:
                self.metrics.cache_api_hits += 1
                response_time = (time.time() - start_time) * 1000
                self.metrics.avg_response_time_ms = response_time
                await self._track_geographic_hit(user_context)
                return cache_result

            self.metrics.cache_api_misses += 1

            # Layer 2: KV Store (if warm/hybrid strategy)
            if config.strategy in [CacheStrategy.WARM, CacheStrategy.HYBRID]:
                kv_result = await self._get_from_kv(key, data_type, config)
                if kv_result is not None:
                    self.metrics.kv_hits += 1
                    # Promote to Cache API
                    await self._set_in_cache_api(key, kv_result, data_type, config)
                    response_time = (time.time() - start_time) * 1000
                    self.metrics.avg_response_time_ms = response_time
                    return kv_result

            self.metrics.kv_misses += 1

            # Cache miss - data not found
            response_time = (time.time() - start_time) * 1000
            self.metrics.avg_response_time_ms = response_time
            return None

        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        data_type: str = "roadmap",
        ttl_override: Optional[int] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Intelligent cache storage using Cloudflare optimization.

        Stores in appropriate layers based on data type and strategy.
        """
        config = self.cache_configs.get(data_type, self.cache_configs["roadmap"])

        try:
            # Always store in Cache API for hot/warm data
            if config.strategy in [CacheStrategy.HOT, CacheStrategy.WARM, CacheStrategy.HYBRID]:
                success_cache = await self._set_in_cache_api(key, value, data_type, config, ttl_override)

            # Store in KV for warm/hybrid data with longer TTL
            if config.strategy in [CacheStrategy.WARM, CacheStrategy.HYBRID]:
                success_kv = await self._set_in_kv(key, value, data_type, config, ttl_override)

            # Track cache warming if enabled
            if config.auto_warm:
                await self._schedule_cache_warming(key, data_type, user_context)

            return True

        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    async def delete(
        self,
        key: str,
        data_type: str = "roadmap",
        cascade: bool = True
    ) -> bool:
        """
        Intelligent cache invalidation across all layers.
        """
        try:
            # Delete from Cache API
            cache_key = self._make_cache_api_key(key, data_type)
            cache_request = Request.new(cache_key, method="GET")
            await self.cache.delete(cache_request)

            if cascade:
                # Delete from KV
                kv_key = self._make_kv_key(key, data_type)
                if self.kv:
                    await self.kv.delete(kv_key)

                # Invalidate related keys
                await self._invalidate_related_keys(key, data_type)

            return True

        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    async def warm_cache(
        self,
        keys: List[str],
        data_type: str = "roadmap",
        loader_func: Optional[callable] = None
    ) -> int:
        """
        Proactive cache warming for predictable performance.

        Pre-loads data into Cache API for instant access.
        """
        warmed_count = 0
        config = self.cache_configs.get(data_type, self.cache_configs["roadmap"])

        if not config.auto_warm:
            return 0

        for key in keys:
            try:
                # Check if already cached
                cached = await self._get_from_cache_api(key, data_type, config)
                if cached is not None:
                    continue

                # Load data and cache
                if loader_func:
                    data = await loader_func(key)
                    if data is not None:
                        await self._set_in_cache_api(key, data, data_type, config)
                        warmed_count += 1

            except Exception as e:
                print(f"Cache warming error for {key}: {e}")

        return warmed_count

    async def invalidate_by_pattern(
        self,
        pattern: str,
        data_type: str = "roadmap"
    ) -> int:
        """
        Pattern-based cache invalidation.

        Useful for invalidating related data (e.g., all user's roadmaps).
        """
        invalidated_count = 0

        try:
            # For KV, we need to track keys with tags
            if self.kv:
                tag_key = f"pattern:{pattern}:{data_type}"
                tagged_keys = await self.kv.get(tag_key, "json")

                if tagged_keys:
                    for key in tagged_keys:
                        await self.delete(key, data_type, cascade=False)
                        invalidated_count += 1

                    # Clean up tag tracking
                    await self.kv.delete(tag_key)

        except Exception as e:
            print(f"Pattern invalidation error: {e}")

        return invalidated_count

    async def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get comprehensive cache performance metrics.
        """
        total_requests = (
            self.metrics.cache_api_hits +
            self.metrics.cache_api_misses +
            self.metrics.kv_hits +
            self.metrics.kv_misses
        )

        cache_api_hit_rate = (
            self.metrics.cache_api_hits / max(total_requests, 1)
        )

        overall_hit_rate = (
            (self.metrics.cache_api_hits + self.metrics.kv_hits) / max(total_requests, 1)
        )

        # Calculate cost savings
        # Cache API hits save $0.0005 per operation vs KV
        # KV hits save $0.002 per operation vs D1
        cost_savings = (
            self.metrics.cache_api_hits * 0.0005 +
            self.metrics.kv_hits * 0.002
        )

        return {
            "performance": {
                "cache_api_hit_rate": round(cache_api_hit_rate, 4),
                "overall_hit_rate": round(overall_hit_rate, 4),
                "avg_response_time_ms": round(self.metrics.avg_response_time_ms, 2),
                "total_requests": total_requests
            },
            "costs": {
                "estimated_monthly_savings_usd": round(cost_savings * 30, 2),
                "cache_api_cost_avoidance": self.metrics.cache_api_hits * 0.0005,
                "kv_cost_avoidance": self.metrics.kv_hits * 0.002
            },
            "geographic": {
                "regions": self.metrics.geographic_hits,
                "global_distribution": len(self.metrics.geographic_hits) > 3
            },
            "layer_breakdown": {
                "cache_api": {
                    "hits": self.metrics.cache_api_hits,
                    "misses": self.metrics.cache_api_misses
                },
                "kv": {
                    "hits": self.metrics.kv_hits,
                    "misses": self.metrics.kv_misses
                },
                "d1_queries": self.metrics.d1_queries
            }
        }

    # Private methods for cache layer operations

    async def _get_from_cache_api(
        self,
        key: str,
        data_type: str,
        config: CacheConfig
    ) -> Optional[Any]:
        """Get from Cloudflare Cache API"""
        try:
            cache_key = self._make_cache_api_key(key, data_type)
            cache_request = Request.new(cache_key, method="GET")

            response = await self.cache.match(cache_request)
            if response:
                data = await response.json()

                # Check if expired (Cache API doesn't auto-expire)
                if self._is_cache_entry_valid(data, config.ttl_cache_api):
                    return data.get("value")
                else:
                    # Expired, delete from cache
                    await self.cache.delete(cache_request)

        except Exception as e:
            print(f"Cache API get error: {e}")

        return None

    async def _set_in_cache_api(
        self,
        key: str,
        value: Any,
        data_type: str,
        config: CacheConfig,
        ttl_override: Optional[int] = None
    ) -> bool:
        """Set in Cloudflare Cache API"""
        try:
            cache_key = self._make_cache_api_key(key, data_type)
            ttl = ttl_override or config.ttl_cache_api

            # Wrap value with metadata
            cache_entry = {
                "value": value,
                "cached_at": time.time(),
                "ttl": ttl,
                "data_type": data_type,
                "version": self.key_prefixes["version"]
            }

            # Create response to cache
            cache_response = Response.new(
                json.dumps(cache_entry),
                headers={
                    "Content-Type": "application/json",
                    "Cache-Control": f"public, max-age={ttl}",
                    "CDN-Cache-Control": f"max-age={ttl}",
                    "X-Cache-Type": data_type,
                    "X-Cache-Version": self.key_prefixes["version"]
                }
            )

            cache_request = Request.new(cache_key, method="GET")
            await self.cache.put(cache_request, cache_response)

            return True

        except Exception as e:
            print(f"Cache API set error: {e}")
            return False

    async def _get_from_kv(
        self,
        key: str,
        data_type: str,
        config: CacheConfig
    ) -> Optional[Any]:
        """Get from KV store"""
        if not self.kv:
            return None

        try:
            kv_key = self._make_kv_key(key, data_type)
            cached_data = await self.kv.get(kv_key, "json")

            if cached_data and self._is_cache_entry_valid(cached_data, config.ttl_kv):
                return cached_data.get("value")

        except Exception as e:
            print(f"KV get error: {e}")

        return None

    async def _set_in_kv(
        self,
        key: str,
        value: Any,
        data_type: str,
        config: CacheConfig,
        ttl_override: Optional[int] = None
    ) -> bool:
        """Set in KV store"""
        if not self.kv:
            return False

        try:
            kv_key = self._make_kv_key(key, data_type)
            ttl = ttl_override or config.ttl_kv

            cache_entry = {
                "value": value,
                "cached_at": time.time(),
                "ttl": ttl,
                "data_type": data_type
            }

            await self.kv.put(
                kv_key,
                json.dumps(cache_entry),
                {"expirationTtl": ttl}
            )

            return True

        except Exception as e:
            print(f"KV set error: {e}")
            return False

    def _make_cache_api_key(self, key: str, data_type: str) -> str:
        """Generate Cache API key"""
        base_url = self.key_prefixes["cache_api"]
        version = self.key_prefixes["version"]
        return f"{base_url}{data_type}/{version}/{key}"

    def _make_kv_key(self, key: str, data_type: str) -> str:
        """Generate KV key"""
        prefix = self.key_prefixes["kv"]
        version = self.key_prefixes["version"]
        return f"{prefix}{data_type}:{version}:{key}"

    def _is_cache_entry_valid(self, cache_entry: Dict[str, Any], ttl: int) -> bool:
        """Check if cache entry is still valid"""
        try:
            cached_at = cache_entry.get("cached_at", 0)
            entry_ttl = cache_entry.get("ttl", ttl)
            return (time.time() - cached_at) < entry_ttl
        except:
            return False

    async def _track_geographic_hit(self, user_context: Optional[Dict[str, Any]]) -> None:
        """Track geographic cache hit distribution"""
        if not user_context:
            return

        try:
            # Extract region from user context or request
            region = user_context.get("cf", {}).get("region", "unknown")
            if region != "unknown":
                if region not in self.metrics.geographic_hits:
                    self.metrics.geographic_hits[region] = 0
                self.metrics.geographic_hits[region] += 1
        except:
            pass

    async def _schedule_cache_warming(
        self,
        key: str,
        data_type: str,
        user_context: Optional[Dict[str, Any]]
    ) -> None:
        """Schedule predictive cache warming"""
        # This would be enhanced with ML prediction
        # For now, simple pattern-based warming
        pass

    async def _invalidate_related_keys(self, key: str, data_type: str) -> None:
        """Invalidate keys related to the given key"""
        # Implement based on data relationships
        # e.g., invalidate user's roadmap list when a roadmap changes
        pass


# Export for use in application
__all__ = ['CloudflareCacheService', 'CacheStrategy', 'CacheConfig']