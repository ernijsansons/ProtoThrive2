# Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration

import time
import threading
import logging
import hashlib
import json

# Configure module logger
logger = logging.getLogger(__name__)

class MockKV:
    """Thread-safe Mock KV store with TTL support and unique key generation"""

    def __init__(self):
        self.store = {}
        self.lock = threading.RLock()  # Reentrant lock for thread safety

    def generate_cache_key(self, roadmap_id, task_id, user_id=None):
        """
        Generate a deterministic unique cache key using hash

        Args:
            roadmap_id (str): Roadmap identifier
            task_id (str): Task identifier
            user_id (str, optional): User identifier for additional uniqueness

        Returns:
            str: Unique cache key based on deterministic hash
        """
        components = [roadmap_id, task_id]
        if user_id:
            components.append(user_id)

        # Create deterministic hash
        key_string = "_".join(components)
        hash_object = hashlib.sha256(key_string.encode())
        cache_key = f"cache_{hash_object.hexdigest()[:16]}"

        logger.debug(f"Generated cache key: {cache_key} for components: {components}")
        return cache_key

    def get(self, key):
        """
        Thread-safe retrieval of cached value with TTL check

        Args:
            key (str): Cache key

        Returns:
            Any: Cached data if valid, None otherwise
        """
        with self.lock:
            logger.debug(f"Thermonuclear Get: {key}")
            val = self.store.get(key)
            if val and val['expire'] > time.time():
                logger.info(f"Cache hit for key: {key}, TTL remaining: {val['expire'] - time.time():.1f}s")
                return val['data']
            elif val:
                logger.info(f"Cache expired for key: {key}")
                # Clean up expired entry
                del self.store[key]
            else:
                logger.info(f"Cache miss for key: {key}")
            return None

    def put(self, key, data, ttl=3600):
        """
        Thread-safe storage of value with TTL

        Args:
            key (str): Cache key
            data (Any): Data to cache
            ttl (int): Time to live in seconds (default: 3600)
        """
        with self.lock:
            expire_time = time.time() + ttl
            logger.debug(f"Thermonuclear Put: {key} with TTL: {ttl}s")
            self.store[key] = {'data': data, 'expire': expire_time}
            logger.info(f"Cached data for key: {key}, expires at: {expire_time}")

    def clear(self):
        """Clear all cached entries (thread-safe)"""
        with self.lock:
            logger.info(f"Clearing cache: {len(self.store)} entries removed")
            self.store.clear()

    def size(self):
        """Get current cache size (thread-safe)"""
        with self.lock:
            return len(self.store)

    def cleanup_expired(self):
        """Remove all expired entries (thread-safe)"""
        with self.lock:
            current_time = time.time()
            expired_keys = [
                key for key, val in self.store.items()
                if val['expire'] <= current_time
            ]
            for key in expired_keys:
                del self.store[key]
            if expired_keys:
                logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")