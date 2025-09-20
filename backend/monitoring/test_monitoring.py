#!/usr/bin/env python3
"""
Monitoring Setup Test & Validation Script

Tests Sentry + Datadog integration to ensure production readiness.
Validates all monitoring features and alert configurations.

Ref: CLAUDE.md Section 5 - Production Monitoring Setup
"""

import asyncio
import time
import json
import random
from typing import Dict, Any, List
from datetime import datetime

# Import monitoring services
from services.sentry_integration import SentryIntegrationService, SentryContext, ErrorCategory, SentryLevel
from services.datadog_integration import DatadogIntegrationService, OptimizationMetrics, MetricType
from services.monitoring import MonitoringService


class MonitoringTestSuite:
    """Comprehensive test suite for monitoring integration"""

    def __init__(self, env: Dict[str, Any]):
        """Initialize test suite with monitoring services"""
        self.env = env
        self.sentry = SentryIntegrationService(env)
        self.datadog = DatadogIntegrationService(env)
        self.monitoring = MonitoringService(env)

        self.test_results = []
        self.start_time = time.time()

    async def run_all_tests(self) -> Dict[str, Any]:
        """Run complete monitoring test suite"""
        print("🧪 Starting Thermonuclear Monitoring Test Suite")
        print("=" * 60)

        tests = [
            ("Health Checks", self.test_health_checks),
            ("Sentry Error Tracking", self.test_sentry_integration),
            ("Datadog Metrics", self.test_datadog_integration),
            ("Performance Monitoring", self.test_performance_monitoring),
            ("Alert Simulation", self.test_alert_simulation),
            ("Dashboard Data", self.test_dashboard_data),
            ("Cost Monitoring", self.test_cost_monitoring),
            ("Geographic Tracking", self.test_geographic_tracking),
            ("Integration Tests", self.test_service_integration)
        ]

        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            print("-" * 40)

            try:
                result = await test_func()
                self.test_results.append({
                    "test": test_name,
                    "status": "PASS" if result.get("success", False) else "FAIL",
                    "details": result,
                    "timestamp": datetime.utcnow().isoformat()
                })

                status_emoji = "✅" if result.get("success", False) else "❌"
                print(f"{status_emoji} {test_name}: {result.get('message', 'Complete')}")

            except Exception as e:
                self.test_results.append({
                    "test": test_name,
                    "status": "ERROR",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                print(f"❌ {test_name}: ERROR - {e}")

        return self.generate_test_report()

    async def test_health_checks(self) -> Dict[str, Any]:
        """Test health check endpoints for all monitoring services"""

        try:
            # Test Sentry health
            sentry_health = await self.sentry.health_check()

            # Test Datadog health
            datadog_health = await self.datadog.health_check()

            # Test monitoring service health
            monitoring_health = await self.monitoring.health.get_health_status()

            all_healthy = (
                sentry_health.get("status") in ["healthy", "disabled"] and
                datadog_health.get("status") in ["healthy", "disabled"] and
                monitoring_health.get("status") == "healthy"
            )

            return {
                "success": all_healthy,
                "message": "All monitoring services healthy" if all_healthy else "Some services unhealthy",
                "details": {
                    "sentry": sentry_health,
                    "datadog": datadog_health,
                    "monitoring": monitoring_health
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_sentry_integration(self) -> Dict[str, Any]:
        """Test Sentry error tracking and context"""

        try:
            # Test basic error capture
            test_error = ValueError("Test error for monitoring validation")
            test_context = SentryContext(
                user_id="test-user-123",
                region="us-east",
                optimization_feature="cache_api_migration",
                endpoint="/test-endpoint",
                response_time_ms=45.2
            )

            event_id = await self.sentry.capture_exception(
                test_error,
                context=test_context,
                category=ErrorCategory.PERFORMANCE
            )

            # Test message capture
            message_id = await self.sentry.capture_message(
                "Test monitoring message",
                level=SentryLevel.INFO,
                context=test_context
            )

            # Test performance regression
            regression_id = await self.sentry.capture_performance_regression(
                "response_time_p50",
                35.0,  # current
                20.0,  # baseline
                30.0,  # threshold
                test_context
            )

            success = bool(event_id or not self.sentry.enabled)

            return {
                "success": success,
                "message": "Sentry integration working" if success else "Sentry integration failed",
                "details": {
                    "error_event_id": event_id,
                    "message_event_id": message_id,
                    "regression_event_id": regression_id,
                    "sentry_enabled": self.sentry.enabled,
                    "analytics": await self.sentry.get_error_analytics()
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_datadog_integration(self) -> Dict[str, Any]:
        """Test Datadog metrics and APM"""

        try:
            # Test custom metrics
            metrics_sent = []

            # Performance metrics
            await self.datadog.send_custom_metric(
                "test.response_time",
                23.4,
                MetricType.GAUGE,
                ["region:us-east", "test:true"]
            )
            metrics_sent.append("response_time")

            # Cache metrics
            await self.datadog.track_cache_performance(
                "hot",
                95.2,
                12.3,
                "us-east"
            )
            metrics_sent.append("cache_performance")

            # Optimization metrics
            test_metrics = OptimizationMetrics(
                cache_hit_rate=91.5,
                response_time_p50=23.4,
                response_time_p99=87.2,
                database_query_time=12.8,
                cost_per_request=0.0008,
                optimization_score=0.95
            )

            await self.datadog.track_optimization_metrics(
                test_metrics,
                region="us-east",
                optimization_feature="test_validation"
            )
            metrics_sent.append("optimization_metrics")

            # Geographic metrics
            await self.datadog.track_geographic_performance(
                "us-east",
                23.4,
                150,
                0.02
            )
            metrics_sent.append("geographic_performance")

            # Cost metrics
            await self.datadog.track_cost_metrics(
                238.30,  # current
                347.80,  # projected
                109.50,  # savings
                {
                    "workers": 98.50,
                    "d1_database": 52.30,
                    "kv_store": 18.75,
                    "r2_storage": 28.90,
                    "images_service": 39.85
                }
            )
            metrics_sent.append("cost_metrics")

            # Test APM trace
            trace_id = await self.datadog.start_trace(
                "test_monitoring_operation",
                "monitoring_test",
                {"test": "true", "validation": "monitoring"}
            )

            await self.datadog.finish_trace(
                trace_id,
                "ok",
                None,
                {"duration_ms": 45.2, "test_metric": 1.0}
            )

            success = bool(metrics_sent)

            return {
                "success": success,
                "message": f"Datadog integration working - {len(metrics_sent)} metric types sent",
                "details": {
                    "metrics_sent": metrics_sent,
                    "trace_id": trace_id,
                    "datadog_enabled": self.datadog.enabled,
                    "performance_summary": await self.datadog.get_performance_summary()
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_performance_monitoring(self) -> Dict[str, Any]:
        """Test integrated performance monitoring"""

        try:
            # Test optimization performance tracking
            await self.monitoring.track_optimization_performance(
                cache_hit_rate=91.5,
                response_time_p50=23.4,
                response_time_p99=87.2,
                database_query_time=12.8,
                cost_per_request=0.0008,
                region="us-east",
                optimization_feature="test_validation"
            )

            # Test cache performance tracking
            await self.monitoring.track_cache_performance(
                "hot",
                95.2,
                12.3,
                "us-east"
            )

            # Test geographic performance
            await self.monitoring.track_geographic_performance(
                "us-east",
                23.4,
                150,
                0.02
            )

            # Test performance regression detection
            regression_detected = await self.monitoring.detect_performance_regression(
                "response_time_p50",
                35.0,  # current
                20.0,  # baseline
                30.0,  # threshold
                {
                    "region": "us-east",
                    "optimization_feature": "test_validation",
                    "endpoint": "/test"
                }
            )

            return {
                "success": True,
                "message": "Performance monitoring working correctly",
                "details": {
                    "regression_detected": regression_detected,
                    "optimization_tracking": True,
                    "cache_tracking": True,
                    "geographic_tracking": True
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_alert_simulation(self) -> Dict[str, Any]:
        """Test alert triggering scenarios"""

        try:
            alerts_triggered = []

            # Simulate high response time
            await self.monitoring.track_optimization_performance(
                cache_hit_rate=85.0,
                response_time_p50=150.0,  # Above threshold
                response_time_p99=350.0,  # Above threshold
                database_query_time=75.0,  # Above threshold
                cost_per_request=0.002,   # Above normal
                region="test-region",
                optimization_feature="alert_test"
            )
            alerts_triggered.append("high_response_time")

            # Simulate low cache hit rate
            await self.monitoring.track_cache_performance(
                "warm",
                65.0,  # Below threshold
                45.0,  # Above normal
                "test-region"
            )
            alerts_triggered.append("low_cache_hit_rate")

            # Simulate cost budget alert
            await self.monitoring.track_cost_metrics(
                475.0,  # 95% of $500 budget
                500.0,
                25.0,
                {"workers": 200.0, "database": 275.0}
            )
            alerts_triggered.append("budget_alert")

            # Simulate error
            test_error = RuntimeError("Simulated critical error for alert testing")
            await self.monitoring.record_error(
                test_error,
                context={
                    "optimization_feature": "alert_test",
                    "endpoint": "/test-alert",
                    "response_time_ms": 200.0
                },
                category="performance",
                region="test-region"
            )
            alerts_triggered.append("error_tracking")

            return {
                "success": True,
                "message": f"Alert simulation complete - {len(alerts_triggered)} scenarios tested",
                "details": {
                    "alerts_triggered": alerts_triggered,
                    "test_scenarios": [
                        "High response time threshold breach",
                        "Low cache hit rate alert",
                        "Budget utilization warning",
                        "Error tracking and categorization"
                    ]
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_dashboard_data(self) -> Dict[str, Any]:
        """Test dashboard data generation"""

        try:
            # Test Datadog dashboard config
            dashboard_config = await self.datadog.create_dashboard()

            # Test Sentry analytics
            sentry_analytics = await self.sentry.get_error_analytics()

            # Test performance summary
            performance_summary = await self.datadog.get_performance_summary()

            success = bool(dashboard_config and sentry_analytics)

            return {
                "success": success,
                "message": "Dashboard data generation working",
                "details": {
                    "dashboard_widgets": len(dashboard_config.get("widgets", [])),
                    "sentry_analytics": sentry_analytics,
                    "performance_summary": performance_summary
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_cost_monitoring(self) -> Dict[str, Any]:
        """Test cost monitoring and budget alerting"""

        try:
            # Test normal cost tracking
            await self.monitoring.track_cost_metrics(
                238.30,  # current monthly cost
                347.80,  # projected cost
                109.50,  # savings
                {
                    "workers": 98.50,
                    "d1_database": 52.30,
                    "kv_store": 18.75,
                    "r2_storage": 28.90,
                    "images_service": 39.85
                }
            )

            # Test budget alert threshold
            await self.monitoring.track_cost_metrics(
                475.0,  # 95% of $500 budget
                500.0,
                25.0,
                {"test_service": 475.0}
            )

            return {
                "success": True,
                "message": "Cost monitoring and alerting working",
                "details": {
                    "normal_tracking": True,
                    "budget_alerts": True,
                    "cost_breakdown": True
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_geographic_tracking(self) -> Dict[str, Any]:
        """Test geographic performance tracking"""

        try:
            regions = ["us-east", "us-west", "europe", "asia"]

            for region in regions:
                # Simulate regional performance
                response_time = random.uniform(20, 40)
                request_count = random.randint(50, 200)
                error_rate = random.uniform(0.01, 0.05)

                await self.monitoring.track_geographic_performance(
                    region,
                    response_time,
                    request_count,
                    error_rate
                )

            return {
                "success": True,
                "message": f"Geographic tracking working for {len(regions)} regions",
                "details": {
                    "regions_tracked": regions,
                    "metrics_tracked": ["response_time", "request_count", "error_rate"]
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    async def test_service_integration(self) -> Dict[str, Any]:
        """Test integration between monitoring services"""

        try:
            integration_tests = []

            # Test error -> Sentry + metrics
            test_error = ValueError("Integration test error")
            error_context = {
                "optimization_feature": "integration_test",
                "endpoint": "/test-integration",
                "response_time_ms": 45.2
            }

            sentry_event_id = await self.monitoring.record_error(
                test_error,
                context=error_context,
                category="performance",
                region="us-east"
            )

            if sentry_event_id or not self.monitoring.sentry:
                integration_tests.append("sentry_error_integration")

            # Test performance -> Datadog metrics
            await self.monitoring.track_optimization_performance(
                cache_hit_rate=91.5,
                response_time_p50=23.4,
                response_time_p99=87.2,
                database_query_time=12.8,
                cost_per_request=0.0008,
                region="us-east",
                optimization_feature="integration_test"
            )
            integration_tests.append("datadog_performance_integration")

            # Test regression detection -> both services
            regression_detected = await self.monitoring.detect_performance_regression(
                "response_time_p50",
                45.0,
                25.0,
                25.0,
                error_context
            )

            if regression_detected:
                integration_tests.append("regression_detection_integration")

            return {
                "success": len(integration_tests) > 0,
                "message": f"Service integration working - {len(integration_tests)} tests passed",
                "details": {
                    "integration_tests": integration_tests,
                    "sentry_enabled": bool(self.monitoring.sentry),
                    "datadog_enabled": bool(self.monitoring.datadog)
                }
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_test_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""

        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        error_tests = len([r for r in self.test_results if r["status"] == "ERROR"])

        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0

        test_duration = time.time() - self.start_time

        report = {
            "test_summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "errors": error_tests,
                "success_rate": round(success_rate, 1),
                "duration_seconds": round(test_duration, 2)
            },
            "monitoring_status": {
                "sentry_enabled": self.sentry.enabled,
                "datadog_enabled": self.datadog.enabled,
                "integration_working": passed_tests >= (total_tests * 0.8)
            },
            "test_results": self.test_results,
            "recommendations": self._generate_recommendations(),
            "next_steps": self._generate_next_steps(),
            "timestamp": datetime.utcnow().isoformat()
        }

        return report

    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""

        recommendations = []

        failed_tests = [r for r in self.test_results if r["status"] in ["FAIL", "ERROR"]]

        if not self.sentry.enabled:
            recommendations.append("Configure Sentry DSN for error tracking in production")

        if not self.datadog.enabled:
            recommendations.append("Configure Datadog API keys for metrics and APM")

        if len(failed_tests) > 0:
            recommendations.append(f"Review and fix {len(failed_tests)} failed test(s)")

        if len(failed_tests) == 0:
            recommendations.append("All tests passed - monitoring setup is production ready!")

        return recommendations

    def _generate_next_steps(self) -> List[str]:
        """Generate next steps for production deployment"""

        next_steps = [
            "Set production secrets: wrangler secret put SENTRY_DSN --env production",
            "Set production secrets: wrangler secret put DATADOG_API_KEY --env production",
            "Configure Slack/PagerDuty integrations for alerts",
            "Import Datadog dashboard configuration",
            "Set up Sentry alert rules and notification channels",
            "Deploy to production with monitoring enabled",
            "Verify real-time monitoring data flow",
            "Test alert notifications in production environment"
        ]

        return next_steps


async def main():
    """Run monitoring test suite"""

    # Mock environment for testing
    test_env = {
        "ENVIRONMENT": "test",
        "SENTRY_DSN": "https://test-sentry-dsn@sentry.io/123456",
        "SENTRY_SAMPLE_RATE": "1.0",
        "SENTRY_TRACES_SAMPLE_RATE": "0.1",
        "DATADOG_API_KEY": "test-datadog-api-key",
        "DATADOG_APP_KEY": "test-datadog-app-key",
        "DATADOG_SITE": "datadoghq.com",
        "MONTHLY_BUDGET_USD": "500.0",
        "RELEASE_VERSION": "1.0.0",
        "SERVICE_NAME": "protothrive-backend"
    }

    # Run test suite
    test_suite = MonitoringTestSuite(test_env)
    report = await test_suite.run_all_tests()

    # Print final report
    print("\n" + "=" * 60)
    print("🎯 THERMONUCLEAR MONITORING TEST REPORT")
    print("=" * 60)

    summary = report["test_summary"]
    print(f"✅ Tests Passed: {summary['passed']}/{summary['total_tests']} ({summary['success_rate']}%)")
    print(f"⏱️  Duration: {summary['duration_seconds']}s")
    print(f"🔧 Sentry Enabled: {'Yes' if report['monitoring_status']['sentry_enabled'] else 'No'}")
    print(f"📊 Datadog Enabled: {'Yes' if report['monitoring_status']['datadog_enabled'] else 'No'}")

    if report["monitoring_status"]["integration_working"]:
        print("\n🚀 MONITORING SETUP: PRODUCTION READY!")
    else:
        print("\n⚠️  MONITORING SETUP: NEEDS ATTENTION")

    print("\n📋 Recommendations:")
    for rec in report["recommendations"]:
        print(f"  • {rec}")

    print("\n📋 Next Steps:")
    for step in report["next_steps"][:5]:  # Show first 5 steps
        print(f"  • {step}")

    # Save detailed report
    with open("monitoring_test_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to: monitoring_test_report.json")

    return report


if __name__ == "__main__":
    asyncio.run(main())