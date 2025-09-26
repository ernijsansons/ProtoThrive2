"""
Integration between database layer and existing monitoring service
Ref: CLAUDE.md - Secure Database Implementation

Provides seamless integration with the existing monitoring infrastructure
for comprehensive observability of database operations.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

import structlog

logger = structlog.get_logger()


class DatabaseMonitoringIntegration:
    """
    Integrates database operations with the existing monitoring service

    Features:
    - Automatic span creation for database operations
    - Performance metrics collection
    - Error tracking and alerting
    - Connection pool monitoring
    - Query performance analysis
    """

    def __init__(self, monitoring_service):
        """
        Initialize database monitoring integration

        Args:
            monitoring_service: Existing MonitoringService instance
        """
        self.monitoring = monitoring_service
        self.logger = logger.bind(component="db_monitoring")

    @asynccontextmanager
    async def monitor_query(
        self,
        operation: str,
        table: str,
        query: Optional[str] = None,
        params_count: int = 0
    ):
        """
        Context manager for monitoring database queries with comprehensive metrics

        Args:
            operation: Type of operation (select, insert, update, delete)
            table: Database table being operated on
            query: SQL query being executed (optional, for debugging)
            params_count: Number of parameters bound to query

        Yields:
            span_id: Monitoring span ID for additional logging
        """
        # Start distributed tracing span
        span_id = self.monitoring.tracer.start_span(
            f"db.{table}.{operation}",
            tags={
                "component": "database",
                "db.table": table,
                "db.operation": operation,
                "db.params_count": params_count
            }
        )

        # Start timer for performance measurement
        timer = self.monitoring.timer(
            f"database.{operation}.duration",
            {"table": table}
        )

        start_time = time.time()
        error_occurred = False
        rows_affected = 0

        try:
            # Increment operation counter
            self.monitoring.increment(
                f"database.{operation}.total",
                {"table": table}
            )

            # Log operation start
            self.logger.debug(
                "database_operation_started",
                operation=operation,
                table=table,
                span_id=span_id,
                params_count=params_count
            )

            yield span_id

            # If we get here, operation was successful
            self.monitoring.increment(
                f"database.{operation}.success",
                {"table": table}
            )

        except Exception as e:
            error_occurred = True
            error_type = type(e).__name__

            # Record error metrics
            self.monitoring.increment(
                f"database.{operation}.error",
                {"table": table, "error_type": error_type}
            )

            # Add error information to span
            self.monitoring.tracer.add_span_log(
                span_id,
                "error",
                str(e),
                {
                    "error_type": error_type,
                    "operation": operation,
                    "table": table
                }
            )

            # Log error
            self.logger.error(
                "database_operation_failed",
                operation=operation,
                table=table,
                error=str(e),
                error_type=error_type,
                span_id=span_id
            )

            raise

        finally:
            # Stop timer
            timer()

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Record detailed performance metrics
            self.monitoring.histogram(
                f"database.{operation}.duration_ms",
                duration_ms,
                {"table": table}
            )

            # Add performance tags to span
            span_tags = {
                "db.table": table,
                "db.operation": operation,
                "db.duration_ms": duration_ms
            }

            # Finish distributed tracing span
            self.monitoring.tracer.finish_span(
                span_id,
                span_tags,
                error_occurred
            )

            # Log operation completion
            self.logger.info(
                "database_operation_completed",
                operation=operation,
                table=table,
                duration_ms=duration_ms,
                success=not error_occurred,
                span_id=span_id
            )

            # Check for slow queries and alert
            await self._check_slow_query(operation, table, duration_ms)

    async def monitor_transaction(
        self,
        transaction_id: str,
        operations_count: int = 0
    ):
        """
        Monitor database transaction performance

        Args:
            transaction_id: Unique transaction identifier
            operations_count: Number of operations in transaction
        """
        # Record transaction metrics
        self.monitoring.increment("database.transactions.total")

        # Track transaction duration if operations provided
        if operations_count > 0:
            self.monitoring.histogram(
                "database.transaction.operations_count",
                operations_count
            )

        self.logger.info(
            "database_transaction_monitored",
            transaction_id=transaction_id,
            operations_count=operations_count
        )

    async def record_connection_metrics(
        self,
        active_connections: int,
        idle_connections: int,
        total_connections: int
    ) -> None:
        """
        Record database connection pool metrics

        Args:
            active_connections: Number of active connections
            idle_connections: Number of idle connections
            total_connections: Total number of connections
        """
        # Record gauge metrics for connection pool
        self.monitoring.gauge("database.connections.active", active_connections)
        self.monitoring.gauge("database.connections.idle", idle_connections)
        self.monitoring.gauge("database.connections.total", total_connections)

        # Calculate connection utilization
        utilization = active_connections / max(total_connections, 1)
        self.monitoring.gauge("database.connections.utilization", utilization)

        self.logger.debug(
            "connection_metrics_recorded",
            active=active_connections,
            idle=idle_connections,
            total=total_connections,
            utilization=utilization
        )

        # Alert on high connection utilization
        if utilization > 0.9:
            await self.monitoring.send_alert(
                title="High Database Connection Utilization",
                message=f"Connection utilization at {utilization:.1%} ({active_connections}/{total_connections})",
                severity="warning",
                tags={"component": "database", "metric": "connections"}
            )

    async def record_query_performance(
        self,
        table: str,
        operation: str,
        rows_affected: int,
        duration_ms: float,
        query_complexity: Optional[str] = None
    ) -> None:
        """
        Record detailed query performance metrics

        Args:
            table: Database table operated on
            operation: Type of operation performed
            rows_affected: Number of rows affected by operation
            duration_ms: Query execution duration in milliseconds
            query_complexity: Optional complexity indicator (simple, complex, etc.)
        """
        tags = {
            "table": table,
            "operation": operation
        }

        if query_complexity:
            tags["complexity"] = query_complexity

        # Record performance metrics
        self.monitoring.histogram("database.rows_affected", rows_affected, tags)
        self.monitoring.histogram("database.query_duration", duration_ms, tags)

        # Record efficiency metric (rows per second)
        if duration_ms > 0:
            rows_per_second = (rows_affected / duration_ms) * 1000
            self.monitoring.histogram("database.rows_per_second", rows_per_second, tags)

        self.logger.debug(
            "query_performance_recorded",
            table=table,
            operation=operation,
            rows_affected=rows_affected,
            duration_ms=duration_ms,
            query_complexity=query_complexity
        )

    async def record_cache_performance(
        self,
        cache_type: str,
        operation: str,
        hit: bool,
        duration_ms: float
    ) -> None:
        """
        Record database cache performance metrics

        Args:
            cache_type: Type of cache (query, connection, etc.)
            operation: Cache operation (get, set, invalidate)
            hit: Whether operation was a cache hit
            duration_ms: Operation duration in milliseconds
        """
        tags = {
            "cache_type": cache_type,
            "operation": operation
        }

        # Record cache hit/miss metrics
        if operation == "get":
            status = "hit" if hit else "miss"
            self.monitoring.increment(f"database.cache.{status}", tags)

        # Record cache operation duration
        self.monitoring.histogram("database.cache.duration_ms", duration_ms, tags)

        self.logger.debug(
            "cache_performance_recorded",
            cache_type=cache_type,
            operation=operation,
            hit=hit,
            duration_ms=duration_ms
        )

    async def track_data_integrity_check(
        self,
        check_type: str,
        table: str,
        passed: bool,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Track data integrity check results

        Args:
            check_type: Type of integrity check performed
            table: Table checked
            passed: Whether check passed
            details: Additional check details
        """
        tags = {
            "check_type": check_type,
            "table": table,
            "status": "passed" if passed else "failed"
        }

        self.monitoring.increment("database.integrity_checks.total", tags)

        if not passed:
            # Alert on integrity check failure
            await self.monitoring.send_alert(
                title=f"Database Integrity Check Failed",
                message=f"Integrity check '{check_type}' failed for table '{table}'",
                severity="error",
                tags={**tags, "details": str(details) if details else ""}
            )

        self.logger.info(
            "integrity_check_tracked",
            check_type=check_type,
            table=table,
            passed=passed,
            details=details
        )

    async def _check_slow_query(
        self,
        operation: str,
        table: str,
        duration_ms: float
    ) -> None:
        """
        Check for slow queries and send alerts if necessary

        Args:
            operation: Database operation type
            table: Table operated on
            duration_ms: Query duration in milliseconds
        """
        # Define slow query thresholds
        slow_thresholds = {
            "select": 1000,    # 1 second
            "insert": 500,     # 500ms
            "update": 750,     # 750ms
            "delete": 1000     # 1 second
        }

        warning_threshold = slow_thresholds.get(operation, 1000)
        critical_threshold = warning_threshold * 5

        if duration_ms > critical_threshold:
            severity = "critical"
        elif duration_ms > warning_threshold:
            severity = "warning"
        else:
            return  # No alert needed

        await self.monitoring.send_alert(
            title=f"Slow Database Query Detected",
            message=f"{operation.upper()} operation on table '{table}' took {duration_ms:.2f}ms",
            severity=severity,
            tags={
                "component": "database",
                "operation": operation,
                "table": table,
                "duration_ms": duration_ms
            }
        )

    async def record_migration_metrics(
        self,
        migration_version: str,
        success: bool,
        duration_ms: int,
        error: Optional[str] = None
    ) -> None:
        """
        Record database migration performance metrics

        Args:
            migration_version: Version of migration executed
            success: Whether migration succeeded
            duration_ms: Migration execution duration
            error: Error message if migration failed
        """
        tags = {
            "migration_version": migration_version,
            "status": "success" if success else "failed"
        }

        self.monitoring.increment("database.migrations.total", tags)
        self.monitoring.histogram("database.migrations.duration_ms", duration_ms, tags)

        if not success and error:
            await self.monitoring.send_alert(
                title=f"Database Migration Failed",
                message=f"Migration {migration_version} failed: {error}",
                severity="critical",
                tags={**tags, "error": error}
            )

        self.logger.info(
            "migration_metrics_recorded",
            migration_version=migration_version,
            success=success,
            duration_ms=duration_ms,
            error=error
        )


# Export monitoring integration
__all__ = ['DatabaseMonitoringIntegration']