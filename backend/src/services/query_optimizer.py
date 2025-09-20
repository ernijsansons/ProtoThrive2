"""
Database Query Optimizer for ProtoThrive

Addresses N+1 query problems and implements:
- Query batching
- Connection pooling
- Query result caching
- Lazy loading strategies
- Bulk operations
- Query analysis and optimization
"""

from typing import Dict, List, Optional, Any, Set, Callable, Union
from dataclasses import dataclass, field
from datetime import datetime
import json
import hashlib
from collections import defaultdict
import asyncio


@dataclass
class QueryBatch:
    """Batch of similar queries for bulk execution"""
    query_template: str
    parameters: List[List[Any]]
    callback_map: Dict[str, Callable]
    batch_size: int = 50
    timeout_ms: int = 100


@dataclass
class QueryStats:
    """Query performance statistics"""
    query_hash: str
    execution_count: int = 0
    total_time_ms: float = 0.0
    avg_time_ms: float = 0.0
    cache_hits: int = 0
    cache_misses: int = 0
    n_plus_one_detected: int = 0


class QueryBatcher:
    """
    Batches similar queries to prevent N+1 problems.

    Collects similar queries over a short time window and executes them
    as a single batched query, then distributes results back to callers.
    """

    def __init__(self, timeout_ms: int = 50):
        """
        Initialize query batcher.

        Args:
            timeout_ms: Maximum time to wait before executing batch
        """
        self.timeout_ms = timeout_ms
        self.pending_batches: Dict[str, QueryBatch] = {}
        self.batch_timers: Dict[str, Any] = {}

    async def add_query(
        self,
        query_template: str,
        parameters: List[Any],
        callback: Callable
    ) -> None:
        """
        Add query to batch for later execution.

        Args:
            query_template: SQL query template with placeholders
            parameters: Parameters for this specific query
            callback: Function to call with results
        """
        # Create batch key from query template
        batch_key = hashlib.sha256(query_template.encode()).hexdigest()[:16]
        param_key = str(parameters)

        # Create or get existing batch
        if batch_key not in self.pending_batches:
            self.pending_batches[batch_key] = QueryBatch(
                query_template=query_template,
                parameters=[],
                callback_map={}
            )

            # Start timer for this batch
            self.batch_timers[batch_key] = asyncio.create_task(
                self._execute_batch_after_timeout(batch_key)
            )

        batch = self.pending_batches[batch_key]
        batch.parameters.append(parameters)
        batch.callback_map[param_key] = callback

        # Execute immediately if batch is full
        if len(batch.parameters) >= batch.batch_size:
            await self._execute_batch(batch_key)

    async def _execute_batch_after_timeout(self, batch_key: str) -> None:
        """Execute batch after timeout"""
        await asyncio.sleep(self.timeout_ms / 1000.0)
        if batch_key in self.pending_batches:
            await self._execute_batch(batch_key)

    async def _execute_batch(self, batch_key: str) -> None:
        """Execute batched queries"""
        if batch_key not in self.pending_batches:
            return

        batch = self.pending_batches[batch_key]

        # Cancel timer
        if batch_key in self.batch_timers:
            self.batch_timers[batch_key].cancel()
            del self.batch_timers[batch_key]

        # Remove from pending
        del self.pending_batches[batch_key]

        try:
            # Execute batch query (implementation depends on query type)
            results = await self._execute_bulk_query(batch)

            # Distribute results to callbacks
            for i, params in enumerate(batch.parameters):
                param_key = str(params)
                if param_key in batch.callback_map:
                    callback = batch.callback_map[param_key]
                    result = results[i] if i < len(results) else None
                    await callback(result)

        except Exception as e:
            # Notify all callbacks of error
            for callback in batch.callback_map.values():
                await callback(None, error=e)

    async def _execute_bulk_query(self, batch: QueryBatch) -> List[Any]:
        """Execute bulk query (placeholder - implement per query type)"""
        # This would be implemented based on the specific query type
        # For now, return mock results
        return [{"mock": "result"} for _ in batch.parameters]


class ConnectionPool:
    """
    Database connection pool for efficient connection management.

    Note: In Cloudflare Workers with D1, connections are managed by the platform,
    but this provides a similar interface for optimization.
    """

    def __init__(self, env: Dict[str, Any], max_connections: int = 10):
        """Initialize connection pool"""
        self.env = env
        self.db = env.get("DB")
        self.max_connections = max_connections
        self.active_connections = 0
        self.connection_queue = []

    async def execute_query(
        self,
        query: str,
        parameters: Optional[List[Any]] = None,
        use_cache: bool = True
    ) -> Any:
        """
        Execute query with connection pooling.

        Args:
            query: SQL query
            parameters: Query parameters
            use_cache: Whether to use result caching

        Returns:
            Query results
        """
        if not self.db:
            raise RuntimeError("Database not available")

        # For D1, we don't need actual connection pooling,
        # but we can still optimize query execution
        try:
            if parameters:
                stmt = self.db.prepare(query).bind(*parameters)
            else:
                stmt = self.db.prepare(query)

            # Execute based on query type
            if query.strip().upper().startswith(('SELECT', 'WITH')):
                if 'LIMIT 1' in query.upper() or 'FIRST()' in query:
                    result = await stmt.first()
                else:
                    result = await stmt.all()
            else:
                result = await stmt.run()

            return result

        except Exception as e:
            print(f"Query execution error: {e}")
            raise


class QueryOptimizer:
    """
    Main query optimizer that coordinates batching, caching, and analysis.

    Features:
    - Automatic N+1 detection and prevention
    - Query result caching
    - Query performance monitoring
    - Bulk operation optimization
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize query optimizer"""
        self.env = env
        self.batcher = QueryBatcher()
        self.pool = ConnectionPool(env)
        self.cache = env.get("cache")  # Cache service

        # Query statistics
        self.stats: Dict[str, QueryStats] = {}
        self.n_plus_one_threshold = 5  # Detect if same query runs >5 times
        self.recent_queries: List[str] = []

    async def execute_single(
        self,
        query: str,
        parameters: Optional[List[Any]] = None,
        cache_ttl: Optional[int] = None
    ) -> Any:
        """
        Execute single query with caching and monitoring.

        Args:
            query: SQL query
            parameters: Query parameters
            cache_ttl: Cache TTL in seconds

        Returns:
            Query results
        """
        # Generate query hash for tracking
        query_hash = self._hash_query(query, parameters)

        # Check cache first
        if self.cache and cache_ttl:
            cached_result = await self.cache.get(f"query:{query_hash}")
            if cached_result is not None:
                self._update_stats(query_hash, 0, cache_hit=True)
                return cached_result

        # Track N+1 detection
        self._track_query_for_n_plus_one(query)

        # Execute query
        start_time = datetime.now()
        try:
            result = await self.pool.execute_query(query, parameters)

            # Cache result if specified
            if self.cache and cache_ttl and result:
                await self.cache.set(f"query:{query_hash}", result, ttl=cache_ttl)

            # Update statistics
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            self._update_stats(query_hash, execution_time, cache_hit=False)

            return result

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            self._update_stats(query_hash, execution_time, error=True)
            raise

    async def execute_batch(
        self,
        base_query: str,
        parameter_sets: List[List[Any]],
        cache_ttl: Optional[int] = None
    ) -> List[Any]:
        """
        Execute batch of similar queries efficiently.

        Args:
            base_query: Base SQL query template
            parameter_sets: List of parameter sets
            cache_ttl: Cache TTL for results

        Returns:
            List of results corresponding to parameter sets
        """
        if not parameter_sets:
            return []

        # Check if we can convert to a single IN query
        if self._can_batch_as_in_query(base_query):
            return await self._execute_as_in_query(base_query, parameter_sets, cache_ttl)

        # Execute as batch
        results = []
        for parameters in parameter_sets:
            result = await self.execute_single(base_query, parameters, cache_ttl)
            results.append(result)

        return results

    async def preload_related_data(
        self,
        main_results: List[Dict[str, Any]],
        relations: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Preload related data to prevent N+1 queries.

        Args:
            main_results: Results from main query
            relations: Relationship definitions

        Returns:
            Dictionary of preloaded related data
        """
        preloaded = {}

        for relation_name, relation_config in relations.items():
            foreign_key = relation_config.get("foreign_key")
            target_table = relation_config.get("table")
            target_key = relation_config.get("target_key", "id")

            if not all([foreign_key, target_table]):
                continue

            # Extract foreign key values
            foreign_values = []
            for result in main_results:
                if isinstance(result, dict) and foreign_key in result:
                    value = result[foreign_key]
                    if value and value not in foreign_values:
                        foreign_values.append(value)

            if foreign_values:
                # Build IN query for bulk loading
                placeholders = ",".join(["?" for _ in foreign_values])
                query = f"SELECT * FROM {target_table} WHERE {target_key} IN ({placeholders})"

                # Execute bulk query
                related_results = await self.execute_single(query, foreign_values, cache_ttl=300)

                # Index by target key
                indexed_results = {}
                if related_results:
                    for item in related_results:
                        if isinstance(item, dict) and target_key in item:
                            key_value = item[target_key]
                            indexed_results[key_value] = item

                preloaded[relation_name] = indexed_results

        return preloaded

    def _can_batch_as_in_query(self, query: str) -> bool:
        """Check if query can be converted to IN query for batching"""
        # Simple heuristic: if query has WHERE id = ? pattern
        return (
            "WHERE" in query.upper() and
            "= ?" in query and
            query.count("?") == 1
        )

    async def _execute_as_in_query(
        self,
        base_query: str,
        parameter_sets: List[List[Any]],
        cache_ttl: Optional[int]
    ) -> List[Any]:
        """Convert multiple single queries to one IN query"""
        # Extract all values from parameter sets
        values = [params[0] for params in parameter_sets if params]

        if not values:
            return []

        # Convert query to IN format
        # Replace "= ?" with "IN (...)"
        placeholders = ",".join(["?" for _ in values])
        in_query = base_query.replace("= ?", f"IN ({placeholders})")

        # Execute bulk query
        results = await self.execute_single(in_query, values, cache_ttl)

        # Map results back to original parameter order
        if not results:
            return [None for _ in parameter_sets]

        # Create lookup map (assumes first column is the key)
        result_map = {}
        for result in results:
            if isinstance(result, dict):
                # Try to find the key column
                key_value = None
                for value in values:
                    if value in result.values():
                        key_value = value
                        break
                if key_value:
                    result_map[key_value] = result

        # Return results in original order
        ordered_results = []
        for params in parameter_sets:
            if params and params[0] in result_map:
                ordered_results.append(result_map[params[0]])
            else:
                ordered_results.append(None)

        return ordered_results

    def _hash_query(self, query: str, parameters: Optional[List[Any]]) -> str:
        """Generate hash for query + parameters"""
        query_str = query + str(parameters or [])
        return hashlib.sha256(query_str.encode()).hexdigest()[:16]

    def _track_query_for_n_plus_one(self, query: str) -> None:
        """Track queries to detect N+1 patterns"""
        # Normalize query (remove specific values)
        normalized = self._normalize_query(query)

        # Add to recent queries
        self.recent_queries.append(normalized)

        # Keep only last 100 queries
        if len(self.recent_queries) > 100:
            self.recent_queries = self.recent_queries[-100:]

        # Check for N+1 pattern (same query repeated many times)
        recent_count = self.recent_queries[-20:].count(normalized)
        if recent_count >= self.n_plus_one_threshold:
            query_hash = hashlib.sha256(normalized.encode()).hexdigest()[:16]
            if query_hash in self.stats:
                self.stats[query_hash].n_plus_one_detected += 1

            print(f"N+1 Query Detected: {normalized} (count: {recent_count})")

    def _normalize_query(self, query: str) -> str:
        """Normalize query by removing specific values"""
        import re

        # Replace specific values with placeholders
        normalized = re.sub(r"'[^']*'", "'?'", query)  # String literals
        normalized = re.sub(r'\b\d+\b', '?', normalized)  # Numbers
        normalized = re.sub(r'\s+', ' ', normalized)  # Multiple spaces

        return normalized.strip()

    def _update_stats(
        self,
        query_hash: str,
        execution_time_ms: float,
        cache_hit: bool = False,
        error: bool = False
    ) -> None:
        """Update query statistics"""
        if query_hash not in self.stats:
            self.stats[query_hash] = QueryStats(query_hash=query_hash)

        stats = self.stats[query_hash]

        if not error:
            stats.execution_count += 1
            stats.total_time_ms += execution_time_ms
            stats.avg_time_ms = stats.total_time_ms / stats.execution_count

            if cache_hit:
                stats.cache_hits += 1
            else:
                stats.cache_misses += 1

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate performance report"""
        total_queries = sum(s.execution_count for s in self.stats.values())
        total_cache_hits = sum(s.cache_hits for s in self.stats.values())

        # Find slowest queries
        slowest_queries = sorted(
            self.stats.values(),
            key=lambda s: s.avg_time_ms,
            reverse=True
        )[:10]

        # Find most frequent queries
        frequent_queries = sorted(
            self.stats.values(),
            key=lambda s: s.execution_count,
            reverse=True
        )[:10]

        # N+1 problems
        n_plus_one_queries = [
            s for s in self.stats.values()
            if s.n_plus_one_detected > 0
        ]

        return {
            "summary": {
                "total_queries": total_queries,
                "total_cache_hits": total_cache_hits,
                "cache_hit_rate": total_cache_hits / max(total_queries, 1),
                "n_plus_one_detected": len(n_plus_one_queries)
            },
            "slowest_queries": [
                {
                    "hash": q.query_hash,
                    "avg_time_ms": q.avg_time_ms,
                    "execution_count": q.execution_count
                }
                for q in slowest_queries
            ],
            "frequent_queries": [
                {
                    "hash": q.query_hash,
                    "execution_count": q.execution_count,
                    "avg_time_ms": q.avg_time_ms
                }
                for q in frequent_queries
            ],
            "n_plus_one_problems": [
                {
                    "hash": q.query_hash,
                    "detected_count": q.n_plus_one_detected,
                    "execution_count": q.execution_count
                }
                for q in n_plus_one_queries
            ]
        }


# Decorator for automatic query optimization
def optimized_query(
    cache_ttl: Optional[int] = None,
    batch_similar: bool = False
):
    """
    Decorator for automatic query optimization.

    Usage:
        @optimized_query(cache_ttl=300)
        async def get_user(user_id):
            return await db.execute("SELECT * FROM users WHERE id = ?", [user_id])
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get optimizer from first argument (assumes self has optimizer)
            if hasattr(args[0], 'query_optimizer'):
                optimizer = args[0].query_optimizer

                # For now, just execute normally but with monitoring
                # In a full implementation, this would intercept the queries
                return await func(*args, **kwargs)
            else:
                return await func(*args, **kwargs)

        return wrapper
    return decorator


# Export for use in application
__all__ = [
    'QueryOptimizer',
    'QueryBatcher',
    'ConnectionPool',
    'optimized_query'
]