# Ref: CLAUDE.md Terminal 3 Phase 3 - AI Core Cache (Enhanced)
# Thermonuclear Intelligent Caching System with TTL and Invalidation Strategies

# Import enhanced cache implementation
from .cache_enhanced import ThermonuclearCache, CacheStrategy, InvalidationTrigger, CacheEntry, CacheStats

# Legacy compatibility class
class MockKV:
    def __init__(self):
        # Use enhanced cache as backend with sensible defaults
        self._cache = ThermonuclearCache(
            max_size=500,
            max_memory_mb=50.0,
            default_ttl=3600,
            strategy=CacheStrategy.ADAPTIVE
        )
        print("Thermonuclear Cache Initialized (Enhanced Backend)")

    def get(self, key):
        """Legacy get method with enhanced backend"""
        result = self._cache.get(key)
        if result is not None:
            print(f"Thermonuclear Cache Hit: {key}")
            return result
        else:
            print(f"Thermonuclear Cache Miss: {key}")
            return None

    def put(self, key, data, ttl=3600):
        """Legacy put method with enhanced backend"""
        success = self._cache.put(
            key=key,
            data=data,
            ttl=ttl,
            tags=["legacy"],
            quality_score=0.8
        )
        if success:
            print(f"Thermonuclear Cache Put: {key}, TTL: {ttl}s")
        else:
            print(f"Thermonuclear Cache Put Failed: {key}")

    def get_stats(self):
        """Get cache statistics"""
        return self._cache.get_detailed_stats()

    def clear(self):
        """Clear all cache entries"""
        self._cache.clear()

    def shutdown(self):
        """Shutdown cache system"""
        return self._cache.shutdown()


