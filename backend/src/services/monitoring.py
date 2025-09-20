"""
Comprehensive Monitoring and Observability Service for ProtoThrive

Enhanced with production-ready integrations:
- Application Performance Monitoring (APM)
- Error tracking and alerting (Sentry integration)
- Business metrics and KPIs (Datadog integration)
- Distributed tracing
- Health checks and uptime monitoring
- Custom dashboards and alerting
"""

from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import json
import time
import uuid
import hashlib
from collections import defaultdict

# Cloudflare imports
from js import Response, Request

# Production monitoring integrations
try:
    from .sentry_integration import SentryIntegrationService, SentryContext, ErrorCategory, SentryLevel
    from .datadog_integration import DatadogIntegrationService, OptimizationMetrics, MetricType as DatadogMetricType
except ImportError:
    # Fallback for development
    SentryIntegrationService = None
    DatadogIntegrationService = None


class MetricType(Enum):
    """Types of metrics"""
    COUNTER = "counter"        # Cumulative count
    GAUGE = "gauge"           # Point-in-time value
    HISTOGRAM = "histogram"   # Distribution of values
    TIMER = "timer"          # Duration measurements


class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class Metric:
    """Metric data point"""
    name: str
    value: float
    type: MetricType
    timestamp: float
    tags: Dict[str, str]
    unit: Optional[str] = None


@dataclass
class TraceSpan:
    """Distributed tracing span"""
    span_id: str
    trace_id: str
    parent_span_id: Optional[str]
    operation_name: str
    start_time: float
    end_time: Optional[float]
    duration_ms: Optional[float]
    tags: Dict[str, str]
    logs: List[Dict[str, Any]]
    error: bool = False


@dataclass
class HealthCheck:
    """Health check result"""
    name: str
    status: str  # "healthy", "degraded", "unhealthy"
    latency_ms: float
    details: Optional[Dict[str, Any]] = None
    last_check: Optional[float] = None


class MetricCollector:
    """
    Collects and aggregates metrics for monitoring.

    Features:
    - Multiple metric types (counter, gauge, histogram, timer)
    - Tag-based filtering and aggregation
    - Automatic metric aggregation
    - Memory-efficient storage with rotation
    """

    def __init__(self, max_metrics: int = 10000):
        """Initialize metric collector"""
        self.metrics: List[Metric] = []
        self.max_metrics = max_metrics

        # Aggregated metrics (for performance)
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, List[float]] = defaultdict(list)

    def record_counter(
        self,
        name: str,
        value: float = 1.0,
        tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Record counter metric"""
        tags = tags or {}
        metric_key = f"{name}:{self._serialize_tags(tags)}"

        metric = Metric(
            name=name,
            value=value,
            type=MetricType.COUNTER,
            timestamp=time.time(),
            tags=tags
        )

        self._store_metric(metric)
        self.counters[metric_key] += value

    def record_gauge(
        self,
        name: str,
        value: float,
        tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Record gauge metric"""
        tags = tags or {}
        metric_key = f"{name}:{self._serialize_tags(tags)}"

        metric = Metric(
            name=name,
            value=value,
            type=MetricType.GAUGE,
            timestamp=time.time(),
            tags=tags
        )

        self._store_metric(metric)
        self.gauges[metric_key] = value

    def record_histogram(
        self,
        name: str,
        value: float,
        tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Record histogram metric"""
        tags = tags or {}
        metric_key = f"{name}:{self._serialize_tags(tags)}"

        metric = Metric(
            name=name,
            value=value,
            type=MetricType.HISTOGRAM,
            timestamp=time.time(),
            tags=tags
        )

        self._store_metric(metric)
        self.histograms[metric_key].append(value)

        # Keep only last 1000 values per histogram
        if len(self.histograms[metric_key]) > 1000:
            self.histograms[metric_key] = self.histograms[metric_key][-1000:]

    def start_timer(self, name: str, tags: Optional[Dict[str, str]] = None) -> Callable:
        """Start timer and return stop function"""
        start_time = time.time()
        tags = tags or {}

        def stop_timer():
            duration = (time.time() - start_time) * 1000  # Convert to ms
            self.record_histogram(name, duration, {**tags, "unit": "ms"})

        return stop_timer

    def get_metric_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics"""
        # Calculate histogram statistics
        histogram_stats = {}
        for key, values in self.histograms.items():
            if values:
                sorted_values = sorted(values)
                n = len(sorted_values)
                histogram_stats[key] = {
                    "count": n,
                    "min": min(sorted_values),
                    "max": max(sorted_values),
                    "mean": sum(sorted_values) / n,
                    "p50": sorted_values[int(n * 0.5)],
                    "p95": sorted_values[int(n * 0.95)],
                    "p99": sorted_values[int(n * 0.99)]
                }

        return {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "histograms": histogram_stats,
            "total_metrics": len(self.metrics)
        }

    def _store_metric(self, metric: Metric) -> None:
        """Store metric with rotation"""
        self.metrics.append(metric)

        # Rotate metrics if we exceed max
        if len(self.metrics) > self.max_metrics:
            # Remove oldest 20%
            remove_count = self.max_metrics // 5
            self.metrics = self.metrics[remove_count:]

    def _serialize_tags(self, tags: Dict[str, str]) -> str:
        """Serialize tags for use as key"""
        sorted_items = sorted(tags.items())
        return ",".join(f"{k}={v}" for k, v in sorted_items)


class DistributedTracer:
    """
    Distributed tracing for request flows.

    Tracks requests across services and operations to identify
    performance bottlenecks and error sources.
    """

    def __init__(self):
        """Initialize tracer"""
        self.active_spans: Dict[str, TraceSpan] = {}
        self.completed_traces: List[TraceSpan] = []
        self.max_traces = 1000

    def start_span(
        self,
        operation_name: str,
        parent_span_id: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> str:
        """Start new span"""
        span_id = str(uuid.uuid4())[:8]
        trace_id = trace_id or str(uuid.uuid4())[:16]

        span = TraceSpan(
            span_id=span_id,
            trace_id=trace_id,
            parent_span_id=parent_span_id,
            operation_name=operation_name,
            start_time=time.time(),
            end_time=None,
            duration_ms=None,
            tags={},
            logs=[]
        )

        self.active_spans[span_id] = span
        return span_id

    def finish_span(
        self,
        span_id: str,
        tags: Optional[Dict[str, str]] = None,
        error: bool = False
    ) -> None:
        """Finish span"""
        if span_id not in self.active_spans:
            return

        span = self.active_spans[span_id]
        span.end_time = time.time()
        span.duration_ms = (span.end_time - span.start_time) * 1000
        span.error = error

        if tags:
            span.tags.update(tags)

        # Move to completed traces
        self.completed_traces.append(span)
        del self.active_spans[span_id]

        # Rotate completed traces
        if len(self.completed_traces) > self.max_traces:
            self.completed_traces = self.completed_traces[-self.max_traces:]

    def add_span_log(
        self,
        span_id: str,
        level: str,
        message: str,
        fields: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add log to span"""
        if span_id in self.active_spans:
            log_entry = {
                "timestamp": time.time(),
                "level": level,
                "message": message,
                "fields": fields or {}
            }
            self.active_spans[span_id].logs.append(log_entry)

    def get_trace(self, trace_id: str) -> List[TraceSpan]:
        """Get all spans for a trace"""
        trace_spans = []

        # Check active spans
        for span in self.active_spans.values():
            if span.trace_id == trace_id:
                trace_spans.append(span)

        # Check completed spans
        for span in self.completed_traces:
            if span.trace_id == trace_id:
                trace_spans.append(span)

        # Sort by start time
        return sorted(trace_spans, key=lambda s: s.start_time)

    def get_trace_summary(self) -> Dict[str, Any]:
        """Get tracing summary statistics"""
        total_traces = len(set(s.trace_id for s in self.completed_traces))
        error_count = sum(1 for s in self.completed_traces if s.error)

        # Calculate operation statistics
        operation_stats = defaultdict(lambda: {"count": 0, "durations": []})
        for span in self.completed_traces:
            if span.duration_ms:
                op_stats = operation_stats[span.operation_name]
                op_stats["count"] += 1
                op_stats["durations"].append(span.duration_ms)

        # Calculate averages
        for op_name, stats in operation_stats.items():
            durations = stats["durations"]
            if durations:
                stats["avg_duration_ms"] = sum(durations) / len(durations)
                stats["max_duration_ms"] = max(durations)

        return {
            "total_traces": total_traces,
            "total_spans": len(self.completed_traces),
            "error_count": error_count,
            "error_rate": error_count / max(len(self.completed_traces), 1),
            "operation_stats": dict(operation_stats)
        }


class HealthMonitor:
    """
    Application health monitoring.

    Performs health checks on various system components
    and tracks overall system health.
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize health monitor"""
        self.env = env
        self.health_checks: Dict[str, HealthCheck] = {}
        self.check_interval = 60  # seconds

    async def register_health_check(
        self,
        name: str,
        check_function: Callable,
        interval: Optional[int] = None
    ) -> None:
        """Register health check"""
        # For now, just run the check once
        await self.run_health_check(name, check_function)

    async def run_health_check(
        self,
        name: str,
        check_function: Callable
    ) -> HealthCheck:
        """Run individual health check"""
        start_time = time.time()

        try:
            result = await check_function()
            latency_ms = (time.time() - start_time) * 1000

            if isinstance(result, bool):
                status = "healthy" if result else "unhealthy"
                details = None
            elif isinstance(result, dict):
                status = result.get("status", "healthy")
                details = result.get("details")
            else:
                status = "unhealthy"
                details = {"error": "Invalid health check result"}

            health_check = HealthCheck(
                name=name,
                status=status,
                latency_ms=latency_ms,
                details=details,
                last_check=time.time()
            )

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            health_check = HealthCheck(
                name=name,
                status="unhealthy",
                latency_ms=latency_ms,
                details={"error": str(e)},
                last_check=time.time()
            )

        self.health_checks[name] = health_check
        return health_check

    async def run_all_health_checks(self) -> Dict[str, HealthCheck]:
        """Run all registered health checks"""
        # Built-in health checks
        await self.run_health_check("database", self._check_database)
        await self.run_health_check("kv_store", self._check_kv_store)
        await self.run_health_check("memory", self._check_memory)

        return self.health_checks

    async def _check_database(self) -> Dict[str, Any]:
        """Check database connectivity"""
        try:
            if not self.env.get("DB"):
                return {"status": "unhealthy", "details": {"error": "Database not configured"}}

            # Simple connectivity test
            result = await self.env["DB"].prepare("SELECT 1 as test").first()

            if result and result.get("test") == 1:
                return {"status": "healthy", "details": {"connection": "ok"}}
            else:
                return {"status": "unhealthy", "details": {"error": "Invalid response"}}

        except Exception as e:
            return {"status": "unhealthy", "details": {"error": str(e)}}

    async def _check_kv_store(self) -> Dict[str, Any]:
        """Check KV store connectivity"""
        try:
            if not self.env.get("KV"):
                return {"status": "degraded", "details": {"warning": "KV not configured"}}

            # Test write/read
            test_key = f"health_check_{int(time.time())}"
            test_value = "health_test"

            await self.env["KV"].put(test_key, test_value, {"expirationTtl": 60})
            retrieved = await self.env["KV"].get(test_key)

            if retrieved == test_value:
                return {"status": "healthy", "details": {"kv": "ok"}}
            else:
                return {"status": "unhealthy", "details": {"error": "KV read/write failed"}}

        except Exception as e:
            return {"status": "unhealthy", "details": {"error": str(e)}}

    async def _check_memory(self) -> Dict[str, Any]:
        """Check memory usage"""
        try:
            # In Workers, we don't have direct memory access,
            # but we can check if basic operations work
            test_data = {"test": "memory_check", "timestamp": time.time()}
            serialized = json.dumps(test_data)
            deserialized = json.loads(serialized)

            if deserialized["test"] == "memory_check":
                return {"status": "healthy", "details": {"memory": "ok"}}
            else:
                return {"status": "unhealthy", "details": {"error": "Memory operations failed"}}

        except Exception as e:
            return {"status": "unhealthy", "details": {"error": str(e)}}

    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        if not self.health_checks:
            return {"status": "unknown", "details": "No health checks run"}

        healthy_count = sum(1 for hc in self.health_checks.values() if hc.status == "healthy")
        degraded_count = sum(1 for hc in self.health_checks.values() if hc.status == "degraded")
        unhealthy_count = sum(1 for hc in self.health_checks.values() if hc.status == "unhealthy")

        total_checks = len(self.health_checks)

        if unhealthy_count > 0:
            overall_status = "unhealthy"
        elif degraded_count > 0:
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        return {
            "status": overall_status,
            "checks": {
                "total": total_checks,
                "healthy": healthy_count,
                "degraded": degraded_count,
                "unhealthy": unhealthy_count
            },
            "details": {name: asdict(hc) for name, hc in self.health_checks.items()}
        }


class MonitoringService:
    """
    Main monitoring service that coordinates all monitoring components.

    Provides unified interface for:
    - Metrics collection
    - Distributed tracing
    - Health monitoring
    - Alerting
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize monitoring service with production integrations"""
        self.env = env
        self.metrics = MetricCollector()
        self.tracer = DistributedTracer()
        self.health = HealthMonitor(env)

        # PRODUCTION INTEGRATIONS: Sentry + Datadog
        self.sentry = SentryIntegrationService(env) if SentryIntegrationService else None
        self.datadog = DatadogIntegrationService(env) if DatadogIntegrationService else None

        # Enhanced monitoring features
        self.optimization_tracking_enabled = True
        self.geographic_monitoring_enabled = True
        self.cost_monitoring_enabled = True

        print(f"Thermonuclear Monitoring: Initialized with Sentry={'✅' if self.sentry and self.sentry.enabled else '❌'} "
              f"Datadog={'✅' if self.datadog and self.datadog.enabled else '❌'}")

    # Convenience methods for metrics
    def increment(self, name: str, tags: Optional[Dict[str, str]] = None) -> None:
        """Increment counter metric"""
        self.metrics.record_counter(name, 1.0, tags)

    def gauge(self, name: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
        """Record gauge metric"""
        self.metrics.record_gauge(name, value, tags)

    def histogram(self, name: str, value: float, tags: Optional[Dict[str, str]] = None) -> None:
        """Record histogram metric"""
        self.metrics.record_histogram(name, value, tags)

    def timer(self, name: str, tags: Optional[Dict[str, str]] = None) -> Callable:
        """Create timer"""
        return self.metrics.start_timer(name, tags)

    # ENHANCED PRODUCTION MONITORING METHODS

    async def record_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        category: str = "performance",
        user_id: Optional[str] = None,
        region: Optional[str] = None
    ) -> Optional[str]:
        """Record error with enhanced context for production monitoring"""

        # Record in local metrics
        self.increment("errors.total", {"category": category, "region": region or "unknown"})

        # Send to Sentry if available
        sentry_event_id = None
        if self.sentry:
            sentry_context = SentryContext(
                user_id=user_id,
                region=region,
                optimization_feature=context.get('optimization_feature') if context else None,
                endpoint=context.get('endpoint') if context else None,
                response_time_ms=context.get('response_time_ms') if context else None
            )

            error_category = ErrorCategory.AUTHENTICATION if 'auth' in category else ErrorCategory.PERFORMANCE

            sentry_event_id = await self.sentry.capture_exception(
                error,
                context=sentry_context,
                category=error_category,
                extra_data=context
            )

        return sentry_event_id

    async def track_optimization_performance(
        self,
        cache_hit_rate: float,
        response_time_p50: float,
        response_time_p99: float,
        database_query_time: float,
        cost_per_request: float,
        region: Optional[str] = None,
        optimization_feature: Optional[str] = None
    ) -> None:
        """Track optimization performance metrics"""

        if not self.optimization_tracking_enabled:
            return

        # Record local metrics
        self.gauge("performance.cache_hit_rate", cache_hit_rate, {"region": region})
        self.gauge("performance.response_time.p50", response_time_p50, {"region": region})
        self.gauge("performance.response_time.p99", response_time_p99, {"region": region})
        self.gauge("performance.database.query_time", database_query_time, {"region": region})
        self.gauge("cost.per_request", cost_per_request, {"region": region})

        # Send to Datadog if available
        if self.datadog:
            optimization_metrics = OptimizationMetrics(
                cache_hit_rate=cache_hit_rate,
                response_time_p50=response_time_p50,
                response_time_p99=response_time_p99,
                database_query_time=database_query_time,
                cost_per_request=cost_per_request,
                optimization_score=self._calculate_optimization_score(
                    response_time_p50, cache_hit_rate
                )
            )

            await self.datadog.track_optimization_metrics(
                optimization_metrics,
                region=region,
                optimization_feature=optimization_feature
            )

    async def track_cache_performance(
        self,
        cache_tier: str,
        hit_rate: float,
        response_time_ms: float,
        region: Optional[str] = None
    ) -> None:
        """Track cache performance by tier"""

        # Record local metrics
        self.gauge(f"cache.{cache_tier}.hit_rate", hit_rate, {"region": region})
        self.gauge(f"cache.{cache_tier}.response_time", response_time_ms, {"region": region})

        # Send to Datadog if available
        if self.datadog:
            await self.datadog.track_cache_performance(
                cache_tier, hit_rate, response_time_ms, region
            )

    async def track_geographic_performance(
        self,
        region: str,
        avg_response_time: float,
        request_count: int,
        error_rate: float
    ) -> None:
        """Track geographic performance distribution"""

        if not self.geographic_monitoring_enabled:
            return

        # Record local metrics
        self.gauge("geographic.response_time", avg_response_time, {"region": region})
        self.increment("geographic.requests", {"region": region})
        self.gauge("geographic.error_rate", error_rate, {"region": region})

        # Send to Datadog if available
        if self.datadog:
            await self.datadog.track_geographic_performance(
                region, avg_response_time, request_count, error_rate
            )

    async def track_cost_metrics(
        self,
        current_monthly_cost: float,
        projected_monthly_cost: float,
        cost_savings: float,
        service_breakdown: Dict[str, float]
    ) -> None:
        """Track cost optimization metrics"""

        if not self.cost_monitoring_enabled:
            return

        # Record local metrics
        self.gauge("cost.monthly.current", current_monthly_cost)
        self.gauge("cost.monthly.projected", projected_monthly_cost)
        self.gauge("cost.savings.monthly", cost_savings)

        # Send to Datadog if available
        if self.datadog:
            await self.datadog.track_cost_metrics(
                current_monthly_cost,
                projected_monthly_cost,
                cost_savings,
                service_breakdown
            )

    async def detect_performance_regression(
        self,
        metric_name: str,
        current_value: float,
        baseline_value: float,
        threshold_pct: float = 20.0,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Detect and alert on performance regressions"""

        degradation_pct = ((current_value - baseline_value) / baseline_value) * 100

        if degradation_pct >= threshold_pct:
            # Record regression
            self.increment("performance.regressions", {
                "metric": metric_name,
                "severity": "critical" if degradation_pct > 50 else "warning"
            })

            # Send to Sentry if available
            if self.sentry:
                await self.sentry.capture_performance_regression(
                    metric_name,
                    current_value,
                    baseline_value,
                    threshold_pct,
                    SentryContext(**context) if context else None
                )

            return True

        return False

    def _calculate_optimization_score(
        self,
        response_time_p50: float,
        cache_hit_rate: float
    ) -> float:
        """Calculate overall optimization score (0.0-1.0)"""

        # Response time score (target: 25ms)
        if response_time_p50 <= 25:
            time_score = 1.0
        elif response_time_p50 <= 50:
            time_score = 0.9
        elif response_time_p50 <= 100:
            time_score = 0.7
        else:
            time_score = 0.5

        # Cache score (target: 90%)
        cache_score = min(cache_hit_rate / 90.0, 1.0)

        # Weighted average
        return (time_score * 0.6) + (cache_score * 0.4)

    # Convenience methods for tracing
    def trace_request(self, request: Request) -> str:
        """Start tracing for HTTP request"""
        trace_id = request.headers.get("X-Trace-ID") or str(uuid.uuid4())[:16]
        span_id = self.tracer.start_span(
            f"{request.method} {request.url}",
            trace_id=trace_id
        )

        # Add request tags
        if span_id in self.tracer.active_spans:
            span = self.tracer.active_spans[span_id]
            span.tags.update({
                "http.method": request.method,
                "http.url": request.url,
                "http.user_agent": request.headers.get("User-Agent", ""),
                "component": "http"
            })

        return span_id

    def finish_request_trace(
        self,
        span_id: str,
        response: Response,
        error: Optional[Exception] = None
    ) -> None:
        """Finish HTTP request trace"""
        tags = {
            "http.status_code": str(response.status)
        }

        if error:
            tags["error"] = True
            tags["error.type"] = type(error).__name__
            tags["error.message"] = str(error)

        self.tracer.finish_span(span_id, tags, error is not None)

    async def track_business_metrics(self, event: str, data: Dict[str, Any]) -> None:
        """Track business-specific metrics"""
        tags = {"event": event}

        # Add common business metrics
        if event == "roadmap_created":
            self.increment("roadmaps.created", tags)
            if data.get("vibe_mode"):
                self.increment("roadmaps.vibe_mode", tags)

        elif event == "agent_execution":
            self.increment("agent.executions", tags)
            self.histogram("agent.cost", data.get("cost", 0), tags)
            self.histogram("agent.confidence", data.get("confidence", 0), tags)

        elif event == "api_request":
            self.increment("api.requests", tags)
            self.histogram("api.response_time", data.get("response_time_ms", 0), tags)

        elif event == "error_occurred":
            self.increment("errors.total", {**tags, "error_code": data.get("code", "unknown")})

    async def send_alert(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.WARNING,
        tags: Optional[Dict[str, str]] = None
    ) -> None:
        """Send alert to configured channels"""
        alert_data = {
            "title": title,
            "message": message,
            "severity": severity.value,
            "timestamp": datetime.utcnow().isoformat(),
            "tags": tags or {}
        }

        # Log alert
        print(f"ALERT [{severity.value.upper()}]: {title} - {message}")

        # Send to external services (if configured)
        if self.sentry_dsn:
            await self._send_to_sentry(alert_data)

        if self.datadog_api_key:
            await self._send_to_datadog(alert_data)

    async def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Get complete monitoring dashboard data"""
        return {
            "metrics": self.metrics.get_metric_summary(),
            "tracing": self.tracer.get_trace_summary(),
            "health": self.health.get_overall_health(),
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _send_to_sentry(self, alert_data: Dict[str, Any]) -> None:
        """Send alert to Sentry"""
        # Implement Sentry integration
        pass

    async def _send_to_datadog(self, alert_data: Dict[str, Any]) -> None:
        """Send alert to Datadog"""
        # Implement Datadog integration
        pass


# Monitoring middleware for automatic request tracking
class MonitoringMiddleware:
    """Middleware for automatic monitoring of requests"""

    def __init__(self, monitoring: MonitoringService):
        self.monitoring = monitoring

    async def process_request(self, request: Request) -> str:
        """Start monitoring for request"""
        span_id = self.monitoring.trace_request(request)

        # Record request metrics
        self.monitoring.increment("http.requests", {
            "method": request.method,
            "endpoint": self._normalize_path(request.url)
        })

        return span_id

    async def process_response(
        self,
        span_id: str,
        request: Request,
        response: Response,
        error: Optional[Exception] = None
    ) -> None:
        """Complete monitoring for request"""
        # Finish trace
        self.monitoring.finish_request_trace(span_id, response, error)

        # Record response metrics
        tags = {
            "method": request.method,
            "status_code": str(response.status),
            "endpoint": self._normalize_path(request.url)
        }

        self.monitoring.increment("http.responses", tags)

        if error:
            self.monitoring.increment("http.errors", tags)

    def _normalize_path(self, url: str) -> str:
        """Normalize URL path for metrics"""
        from urllib.parse import urlparse
        path = urlparse(url).path

        # Replace IDs with placeholders
        import re
        path = re.sub(r'/[0-9a-f-]{36}', '/{id}', path)  # UUIDs
        path = re.sub(r'/\d+', '/{id}', path)  # Numeric IDs

        return path


# Export for use in application
__all__ = [
    'MonitoringService',
    'MonitoringMiddleware',
    'MetricCollector',
    'DistributedTracer',
    'HealthMonitor',
    'AlertSeverity'
]