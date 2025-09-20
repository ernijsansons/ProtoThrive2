#!/usr/bin/env python3
"""
Production Monitoring Verification Script

Verifies that ProtoThrive production monitoring is operational
by testing all endpoints and simulating real-world traffic patterns.
"""

import requests
import json
import time
from datetime import datetime

class ProductionVerifier:
    def __init__(self):
        self.base_url = "https://backend-thermo-prod.ernijs-ansons.workers.dev"
        self.results = []

    def verify_endpoint(self, endpoint, expected_status=200, description=""):
        """Verify a specific endpoint is operational"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()

        try:
            response = requests.get(url, timeout=10)
            response_time = (time.time() - start_time) * 1000

            result = {
                'endpoint': endpoint,
                'description': description,
                'status_code': response.status_code,
                'response_time_ms': round(response_time, 2),
                'success': response.status_code == expected_status,
                'response_size': len(response.text),
                'timestamp': datetime.now().isoformat()
            }

            if response.headers.get('content-type', '').startswith('application/json'):
                try:
                    result['response_data'] = response.json()
                except:
                    result['response_data'] = None

            self.results.append(result)

            status_icon = "✅" if result['success'] else "❌"
            print(f"{status_icon} {endpoint}: {response.status_code} ({response_time:.1f}ms)")

            return result

        except Exception as e:
            result = {
                'endpoint': endpoint,
                'description': description,
                'error': str(e),
                'success': False,
                'timestamp': datetime.now().isoformat()
            }
            self.results.append(result)
            print(f"❌ {endpoint}: ERROR - {e}")
            return result

    def run_production_verification(self):
        """Run comprehensive production verification"""
        print("🚀 THERMONUCLEAR MONITORING: Production Verification")
        print("=" * 60)
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 Target: {self.base_url}")
        print()

        # Test all monitoring endpoints
        endpoints = [
            ("/", "Main API endpoint"),
            ("/health", "Health check with monitoring metrics"),
            ("/test-monitoring", "Monitoring integration test"),
            ("/test-error", "Error tracking test"),
        ]

        print("📋 Testing Production Endpoints:")
        print("-" * 40)

        for endpoint, description in endpoints:
            self.verify_endpoint(endpoint, description=description)
            time.sleep(0.5)  # Small delay between requests

        # Simulate load testing
        print("\n⚡ Load Testing (5 requests):")
        print("-" * 40)

        load_test_results = []
        for i in range(5):
            result = self.verify_endpoint("/health", description=f"Load test {i+1}")
            if result.get('response_time_ms'):
                load_test_results.append(result['response_time_ms'])
            time.sleep(0.2)

        # Calculate performance metrics
        if load_test_results:
            avg_response_time = sum(load_test_results) / len(load_test_results)
            max_response_time = max(load_test_results)
            min_response_time = min(load_test_results)

            print(f"\n📊 Performance Summary:")
            print(f"   Average Response Time: {avg_response_time:.1f}ms")
            print(f"   Min Response Time: {min_response_time:.1f}ms")
            print(f"   Max Response Time: {max_response_time:.1f}ms")
            print(f"   Target: <25ms (P50), <100ms (P99)")

            performance_score = "🟢 EXCELLENT" if avg_response_time < 25 else "🟡 GOOD" if avg_response_time < 100 else "🔴 NEEDS OPTIMIZATION"
            print(f"   Performance: {performance_score}")

        # Summary
        successful_tests = sum(1 for r in self.results if r.get('success', False))
        total_tests = len(self.results)
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0

        print(f"\n📋 Verification Summary:")
        print(f"   Tests Passed: {successful_tests}/{total_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        print(f"   Monitoring Status: {'🟢 OPERATIONAL' if success_rate >= 80 else '🔴 ISSUES DETECTED'}")

        # Generate detailed report
        report = {
            'timestamp': datetime.now().isoformat(),
            'base_url': self.base_url,
            'summary': {
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'success_rate': success_rate,
                'avg_response_time_ms': avg_response_time if load_test_results else None
            },
            'test_results': self.results
        }

        # Save report
        with open('production_verification_report.json', 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n📄 Detailed report saved: production_verification_report.json")

        if success_rate >= 80:
            print("\n🎊 PRODUCTION VERIFICATION COMPLETE")
            print("✅ ProtoThrive monitoring is operational and ready for production traffic!")
        else:
            print("\n⚠️ PRODUCTION VERIFICATION FAILED")
            print("❌ Some monitoring components need attention before production launch.")

        return report

if __name__ == "__main__":
    verifier = ProductionVerifier()
    report = verifier.run_production_verification()