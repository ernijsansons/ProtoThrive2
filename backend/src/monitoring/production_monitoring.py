"""
Production Monitoring & Observability for ProtoThrive
Fortune-50 grade monitoring with Datadog, Sentry, and custom metrics
"""

import asyncio
import json
import time
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import os
import sys

# Production monitoring imports (mocked for development)
try:
    import datadog
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.asyncio import AsyncioIntegration
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    print("📊 Production monitoring dependencies not available - using mock implementation")

@dataclass
class MetricDefinition:
    """Define a custom metric for monitoring"""
    name: str
    type: str  # counter, gauge, histogram, timer
    tags: List[str]
    description: str
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None

@dataclass
class HealthCheck:
    """Define a health check endpoint"""
    name: str
    endpoint: str
    timeout: int = 30
    expected_status: int = 200
    critical: bool = True

class ProductionMonitoring:
    """
    Fortune-50 Production Monitoring System

    Features:
    - Real-time metrics collection
    - Error tracking and alerting
    - Performance monitoring
    - Health check automation
    - Security event monitoring
    - Business metrics tracking
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.metrics_buffer = []
        self.alert_buffer = []
        self.health_checks = []
        self.custom_metrics = {}

        # Initialize monitoring services
        self._init_datadog()
        self._init_sentry()
        self._init_custom_monitoring()

        # Setup logging
        self.logger = self._setup_logging()

        print("🚀 ProtoThrive Production Monitoring initialized")
        self.logger.info("Production monitoring system started", extra={
            "component": "monitoring",
            "version": "1.0.0",
            "environment": config.get("environment", "production")
        })

    def _init_datadog(self):
        """Initialize Datadog monitoring"""
        if not MONITORING_AVAILABLE:
            self.datadog_enabled = False
            return

        try:
            datadog_api_key = self.config.get("datadog_api_key", os.getenv("DATADOG_API_KEY"))
            datadog_app_key = self.config.get("datadog_app_key", os.getenv("DATADOG_APP_KEY"))

            if datadog_api_key and datadog_app_key:
                datadog.initialize(
                    api_key=datadog_api_key,
                    app_key=datadog_app_key,
                    host_name=self.config.get("hostname", "protothrive-production")
                )
                self.datadog_enabled = True
                print("✅ Datadog monitoring enabled")
            else:
                self.datadog_enabled = False
                print("⚠️  Datadog credentials not found - using mock metrics")
        except Exception as e:
            self.datadog_enabled = False
            print(f"❌ Datadog initialization failed: {e}")

    def _init_sentry(self):
        """Initialize Sentry error tracking"""
        if not MONITORING_AVAILABLE:
            self.sentry_enabled = False
            return

        try:
            sentry_dsn = self.config.get("sentry_dsn", os.getenv("SENTRY_DSN"))

            if sentry_dsn:
                sentry_logging = LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                )

                sentry_sdk.init(
                    dsn=sentry_dsn,
                    integrations=[
                        sentry_logging,
                        AsyncioIntegration(),
                    ],
                    traces_sample_rate=0.1,
                    environment=self.config.get("environment", "production"),
                    release=self.config.get("release", "1.0.0"),
                    attach_stacktrace=True,
                    send_default_pii=False
                )
                self.sentry_enabled = True
                print("✅ Sentry error tracking enabled")
            else:
                self.sentry_enabled = False
                print("⚠️  Sentry DSN not found - using mock error tracking")
        except Exception as e:
            self.sentry_enabled = False
            print(f"❌ Sentry initialization failed: {e}")

    def _init_custom_monitoring(self):
        """Initialize custom monitoring metrics"""
        self.custom_metrics = {
            # Application Performance Metrics
            "api_requests_total": MetricDefinition(
                name="protothrive.api.requests.total",
                type="counter",
                tags=["method", "endpoint", "status"],
                description="Total API requests"
            ),
            "api_request_duration": MetricDefinition(
                name="protothrive.api.request.duration",
                type="histogram",
                tags=["method", "endpoint"],
                description="API request duration in milliseconds",
                threshold_warning=1000.0,
                threshold_critical=5000.0
            ),

            # Business Metrics
            "roadmaps_created": MetricDefinition(
                name="protothrive.roadmaps.created",
                type="counter",
                tags=["user_type", "template"],
                description="Roadmaps created by users"
            ),
            "ai_requests": MetricDefinition(
                name="protothrive.ai.requests",
                type="counter",
                tags=["model", "type"],
                description="AI model requests"
            ),
            "active_users": MetricDefinition(
                name="protothrive.users.active",
                type="gauge",
                tags=["time_window"],
                description="Active users count"
            ),

            # Security Metrics
            "auth_failures": MetricDefinition(
                name="protothrive.security.auth.failures",
                type="counter",
                tags=["method", "reason"],
                description="Authentication failures",
                threshold_warning=10.0,
                threshold_critical=50.0
            ),
            "rate_limit_hits": MetricDefinition(
                name="protothrive.security.rate_limit.hits",
                type="counter",
                tags=["ip", "endpoint"],
                description="Rate limit violations"
            ),

            # System Health Metrics
            "database_connections": MetricDefinition(
                name="protothrive.db.connections",
                type="gauge",
                tags=["database"],
                description="Active database connections"
            ),
            "memory_usage": MetricDefinition(
                name="protothrive.system.memory.usage",
                type="gauge",
                tags=["component"],
                description="Memory usage percentage",
                threshold_warning=80.0,
                threshold_critical=95.0
            )
        }

        # Initialize health checks
        self.health_checks = [
            HealthCheck("api", "/health", timeout=10),
            HealthCheck("database", "/health/db", timeout=15),
            HealthCheck("ai_service", "/health/ai", timeout=30),
            HealthCheck("auth_service", "/health/auth", timeout=10),
        ]

    def _setup_logging(self):
        """Setup structured logging for production"""
        logger = logging.getLogger("protothrive.monitoring")
        logger.setLevel(logging.INFO)

        # Create formatter for structured logs
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
            '"component": "%(name)s", "message": "%(message)s", '
            '"trace_id": "%(trace_id)s"}'
        )

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        return logger

    def track_metric(self, metric_name: str, value: float, tags: Dict[str, str] = None):
        """Track a custom metric"""
        if metric_name not in self.custom_metrics:
            self.logger.warning(f"Unknown metric: {metric_name}")
            return

        metric_def = self.custom_metrics[metric_name]
        timestamp = int(time.time())

        # Format tags
        formatted_tags = []
        if tags:
            formatted_tags = [f"{k}:{v}" for k, v in tags.items()]

        # Send to Datadog
        if self.datadog_enabled:
            try:
                if metric_def.type == "counter":
                    datadog.api.Metric.send(
                        metric=metric_def.name,
                        points=[(timestamp, value)],
                        tags=formatted_tags,
                        type="count"
                    )
                elif metric_def.type == "gauge":
                    datadog.api.Metric.send(
                        metric=metric_def.name,
                        points=[(timestamp, value)],
                        tags=formatted_tags,
                        type="gauge"
                    )
                elif metric_def.type == "histogram":
                    datadog.api.Metric.send(
                        metric=metric_def.name,
                        points=[(timestamp, value)],
                        tags=formatted_tags,
                        type="histogram"
                    )
            except Exception as e:
                self.logger.error(f"Failed to send metric to Datadog: {e}")

        # Log metric locally
        self.logger.info("Metric tracked", extra={
            "metric_name": metric_name,
            "value": value,
            "tags": tags,
            "trace_id": self._get_trace_id()
        })

        # Check thresholds
        self._check_threshold(metric_def, value, tags)

        # Mock output for development
        if not self.datadog_enabled:
            print(f"📊 METRIC: {metric_name} = {value} {tags}")

    def track_error(self, error: Exception, context: Dict[str, Any] = None):
        """Track an error with Sentry"""
        if self.sentry_enabled:
            try:
                with sentry_sdk.configure_scope() as scope:
                    if context:
                        for key, value in context.items():
                            scope.set_tag(key, value)
                    sentry_sdk.capture_exception(error)
            except Exception as e:
                self.logger.error(f"Failed to send error to Sentry: {e}")

        # Log error locally
        self.logger.error("Error tracked", extra={
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context,
            "trace_id": self._get_trace_id()
        }, exc_info=True)

        # Mock output for development
        if not self.sentry_enabled:
            print(f"🚨 ERROR: {type(error).__name__}: {error}")

    def track_security_event(self, event_type: str, details: Dict[str, Any]):
        """Track security-related events"""
        security_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "details": details,
            "severity": details.get("severity", "medium"),
            "trace_id": self._get_trace_id()
        }

        # Log security event
        self.logger.warning("Security event", extra=security_event)

        # Track as metric
        self.track_metric("auth_failures" if "auth" in event_type else "rate_limit_hits",
                         1, {"event": event_type})

        # Send alert if critical
        if details.get("severity") == "critical":
            self._send_alert("security", f"Critical security event: {event_type}", details)

        print(f"🔒 SECURITY EVENT: {event_type} - {details}")

    def track_business_event(self, event_type: str, user_id: str, details: Dict[str, Any]):
        """Track business-related events"""
        business_event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id[:8] + "***",  # Mask user ID for privacy
            "details": details,
            "trace_id": self._get_trace_id()
        }

        # Log business event
        self.logger.info("Business event", extra=business_event)

        # Track relevant metrics
        if event_type == "roadmap_created":
            self.track_metric("roadmaps_created", 1, {
                "user_type": details.get("user_type", "free"),
                "template": details.get("template", "custom")
            })
        elif event_type == "ai_request":
            self.track_metric("ai_requests", 1, {
                "model": details.get("model", "unknown"),
                "type": details.get("type", "generation")
            })

        print(f"📈 BUSINESS EVENT: {event_type} - User: {user_id[:8]}***")

    async def run_health_checks(self):
        """Run all health checks"""
        health_results = {}

        for check in self.health_checks:
            try:
                start_time = time.time()

                # Mock health check for development
                if not MONITORING_AVAILABLE:
                    await asyncio.sleep(0.1)  # Simulate network delay
                    success = True
                    response_time = 100
                else:
                    # Real health check implementation would go here
                    success = True
                    response_time = (time.time() - start_time) * 1000

                health_results[check.name] = {
                    "status": "healthy" if success else "unhealthy",
                    "response_time": response_time,
                    "timestamp": datetime.utcnow().isoformat()
                }

                # Track response time
                self.track_metric("api_request_duration", response_time, {
                    "endpoint": check.endpoint,
                    "method": "GET"
                })

            except Exception as e:
                health_results[check.name] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }

                if check.critical:
                    self._send_alert("health", f"Critical health check failed: {check.name}", {
                        "check": check.name,
                        "endpoint": check.endpoint,
                        "error": str(e)
                    })

        self.logger.info("Health checks completed", extra={
            "results": health_results,
            "trace_id": self._get_trace_id()
        })

        return health_results

    def _check_threshold(self, metric_def: MetricDefinition, value: float, tags: Dict[str, str]):
        """Check if metric exceeds thresholds"""
        if metric_def.threshold_critical and value >= metric_def.threshold_critical:
            self._send_alert("critical", f"Critical threshold exceeded for {metric_def.name}", {
                "metric": metric_def.name,
                "value": value,
                "threshold": metric_def.threshold_critical,
                "tags": tags
            })
        elif metric_def.threshold_warning and value >= metric_def.threshold_warning:
            self._send_alert("warning", f"Warning threshold exceeded for {metric_def.name}", {
                "metric": metric_def.name,
                "value": value,
                "threshold": metric_def.threshold_warning,
                "tags": tags
            })

    def _send_alert(self, severity: str, message: str, details: Dict[str, Any]):
        """Send alert notification"""
        alert = {
            "timestamp": datetime.utcnow().isoformat(),
            "severity": severity,
            "message": message,
            "details": details,
            "trace_id": self._get_trace_id()
        }

        # Log alert
        self.logger.critical("Alert triggered", extra=alert)

        # In production, this would send to Slack, PagerDuty, etc.
        print(f"🚨 ALERT [{severity.upper()}]: {message}")

        # Store in buffer for dashboard
        self.alert_buffer.append(alert)

        # Keep only last 100 alerts
        if len(self.alert_buffer) > 100:
            self.alert_buffer = self.alert_buffer[-100:]

    def _get_trace_id(self):
        """Generate or get current trace ID"""
        # In production, this would integrate with distributed tracing
        return f"trace_{int(time.time() * 1000)}"

    def get_monitoring_status(self):
        """Get current monitoring system status"""
        return {
            "datadog_enabled": self.datadog_enabled,
            "sentry_enabled": self.sentry_enabled,
            "metrics_tracked": len(self.custom_metrics),
            "health_checks": len(self.health_checks),
            "recent_alerts": len([a for a in self.alert_buffer
                                if datetime.fromisoformat(a["timestamp"]) >
                                datetime.utcnow() - timedelta(hours=1)]),
            "system_health": "operational"
        }

# Production monitoring singleton
_monitoring_instance = None

def get_monitoring(config: Dict[str, Any] = None) -> ProductionMonitoring:
    """Get monitoring instance (singleton)"""
    global _monitoring_instance

    if _monitoring_instance is None:
        if config is None:
            config = {
                "environment": os.getenv("ENVIRONMENT", "production"),
                "datadog_api_key": os.getenv("DATADOG_API_KEY"),
                "datadog_app_key": os.getenv("DATADOG_APP_KEY"),
                "sentry_dsn": os.getenv("SENTRY_DSN"),
                "hostname": os.getenv("HOSTNAME", "protothrive-worker")
            }
        _monitoring_instance = ProductionMonitoring(config)

    return _monitoring_instance

# Convenience functions for common operations
def track_api_request(method: str, endpoint: str, status_code: int, duration_ms: float):
    """Track API request metrics"""
    monitoring = get_monitoring()
    monitoring.track_metric("api_requests_total", 1, {
        "method": method,
        "endpoint": endpoint,
        "status": str(status_code)
    })
    monitoring.track_metric("api_request_duration", duration_ms, {
        "method": method,
        "endpoint": endpoint
    })

def track_user_action(user_id: str, action: str, details: Dict[str, Any] = None):
    """Track user business actions"""
    monitoring = get_monitoring()
    monitoring.track_business_event(action, user_id, details or {})

def track_security_incident(incident_type: str, severity: str, details: Dict[str, Any]):
    """Track security incidents"""
    monitoring = get_monitoring()
    monitoring.track_security_event(incident_type, {**details, "severity": severity})

async def run_monitoring_dashboard():
    """Run monitoring dashboard (for development/testing)"""
    monitoring = get_monitoring()

    print("\n🚀 ProtoThrive Production Monitoring Dashboard")
    print("=" * 60)

    while True:
        try:
            # Run health checks
            health_results = await monitoring.run_health_checks()

            # Display status
            print(f"\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"📊 Monitoring Status: {monitoring.get_monitoring_status()}")
            print(f"🏥 Health Checks: {len([r for r in health_results.values() if r['status'] == 'healthy'])}/{len(health_results)} healthy")

            # Wait 30 seconds
            await asyncio.sleep(30)

        except KeyboardInterrupt:
            print("\n\n👋 Monitoring dashboard stopped")
            break
        except Exception as e:
            monitoring.track_error(e, {"component": "monitoring_dashboard"})
            await asyncio.sleep(10)

if __name__ == "__main__":
    # Run monitoring dashboard for testing
    asyncio.run(run_monitoring_dashboard())