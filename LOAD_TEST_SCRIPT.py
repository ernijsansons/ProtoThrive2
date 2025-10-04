#!/usr/bin/env python3
"""
ProtoThrive Load Testing and Scalability Assessment
Comprehensive load testing for production deployment validation

Ref: CLAUDE.md - Phase 3: Load Testing and Scalability
"""

import asyncio
import aiohttp
import time
import json
import sys
import statistics
from datetime import datetime
from typing import Dict, List, Any, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

class LoadTester:
    def __init__(self):
        self.backend_url = "https://protothrive-backend.ernijs-ansons.workers.dev"
        self.frontend_url = "https://876017e2.protothrive-frontend.pages.dev"
        self.test_results = []
        self.concurrent_users = [1, 5, 10, 25, 50, 100]
        self.test_duration = 30  # seconds per test

    def log_test_result(self, test_name: str, users: int, status: str, details: Dict[str, Any]):
        """Log load test results"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "test": test_name,
            "concurrent_users": users,
            "status": status,
            "details": details
        }
        self.test_results.append(result)

        status_symbol = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
        print(f"{status_symbol} {test_name} ({users} users): {status}")
        print(f"   Avg Response Time: {details.get('avg_response_time', 0):.2f}ms")
        print(f"   Success Rate: {details.get('success_rate', 0):.1f}%")
        if details.get('requests_per_second'):
            print(f"   Requests/sec: {details.get('requests_per_second', 0):.1f}")

    def single_request(self, url: str, timeout: int = 10) -> Tuple[bool, float, int]:
        """Make a single HTTP request and return success, response time, status code"""
        import requests
        try:
            start_time = time.time()
            response = requests.get(url, timeout=timeout)
            response_time = (time.time() - start_time) * 1000
            return True, response_time, response.status_code
        except Exception as e:
            return False, 0, 0

    def load_test_endpoint(self, endpoint: str, concurrent_users: int, duration: int) -> Dict[str, Any]:
        """Perform load test on a specific endpoint"""
        url = f"{self.backend_url}{endpoint}"
        print(f"Testing {url} with {concurrent_users} concurrent users for {duration} seconds...")

        results = []
        start_time = time.time()
        end_time = start_time + duration

        def worker():
            while time.time() < end_time:
                success, response_time, status_code = self.single_request(url)
                results.append({
                    'success': success,
                    'response_time': response_time,
                    'status_code': status_code,
                    'timestamp': time.time()
                })
                time.sleep(0.1)  # Small delay between requests

        # Start concurrent workers
        threads = []
        for _ in range(concurrent_users):
            thread = threading.Thread(target=worker)
            thread.start()
            threads.append(thread)

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # Calculate statistics
        if not results:
            return {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'success_rate': 0,
                'avg_response_time': 0,
                'min_response_time': 0,
                'max_response_time': 0,
                'requests_per_second': 0
            }

        total_requests = len(results)
        successful_requests = sum(1 for r in results if r['success'])
        failed_requests = total_requests - successful_requests
        success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0

        successful_times = [r['response_time'] for r in results if r['success']]
        avg_response_time = statistics.mean(successful_times) if successful_times else 0
        min_response_time = min(successful_times) if successful_times else 0
        max_response_time = max(successful_times) if successful_times else 0

        actual_duration = time.time() - start_time
        requests_per_second = total_requests / actual_duration if actual_duration > 0 else 0

        return {
            'total_requests': total_requests,
            'successful_requests': successful_requests,
            'failed_requests': failed_requests,
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'min_response_time': min_response_time,
            'max_response_time': max_response_time,
            'requests_per_second': requests_per_second,
            'test_duration': actual_duration
        }

    def stress_test_health_endpoint(self):
        """Stress test the health endpoint with increasing load"""
        print("\nStress Testing Health Endpoint...")

        for users in self.concurrent_users:
            details = self.load_test_endpoint("/health", users, 15)  # 15 seconds per test

            # Determine status based on performance
            if details['success_rate'] >= 95 and details['avg_response_time'] < 1000:
                status = "PASS"
            elif details['success_rate'] >= 80 and details['avg_response_time'] < 2000:
                status = "WARN"
            else:
                status = "FAIL"

            self.log_test_result("Health Endpoint Stress Test", users, status, details)

            # Stop if system is failing
            if details['success_rate'] < 50:
                print(f"   System unable to handle {users} concurrent users. Stopping stress test.")
                break

            time.sleep(2)  # Recovery time between tests

    def test_api_endpoints_load(self):
        """Test API endpoints under load"""
        print("\nLoad Testing API Endpoints...")

        endpoints = ["/api/status", "/api/roadmaps", "/api/snippets"]
        test_users = 25  # Moderate load for API testing

        for endpoint in endpoints:
            details = self.load_test_endpoint(endpoint, test_users, 20)

            if details['success_rate'] >= 95 and details['avg_response_time'] < 1500:
                status = "PASS"
            elif details['success_rate'] >= 85 and details['avg_response_time'] < 3000:
                status = "WARN"
            else:
                status = "FAIL"

            self.log_test_result(f"API Load Test {endpoint}", test_users, status, details)
            time.sleep(3)  # Recovery time

    def test_burst_traffic(self):
        """Test system response to burst traffic"""
        print("\nTesting Burst Traffic Handling...")

        # Simulate burst: 50 concurrent users for 10 seconds
        burst_users = 50
        burst_duration = 10

        details = self.load_test_endpoint("/health", burst_users, burst_duration)

        if details['success_rate'] >= 90 and details['avg_response_time'] < 2000:
            status = "PASS"
        elif details['success_rate'] >= 75:
            status = "WARN"
        else:
            status = "FAIL"

        self.log_test_result("Burst Traffic Test", burst_users, status, details)

    def test_sustained_load(self):
        """Test sustained load over longer period"""
        print("\nTesting Sustained Load...")

        # 20 concurrent users for 60 seconds
        sustained_users = 20
        sustained_duration = 60

        details = self.load_test_endpoint("/health", sustained_users, sustained_duration)

        if details['success_rate'] >= 95 and details['avg_response_time'] < 1000:
            status = "PASS"
        elif details['success_rate'] >= 85:
            status = "WARN"
        else:
            status = "FAIL"

        self.log_test_result("Sustained Load Test", sustained_users, status, details)

    def test_frontend_load(self):
        """Test frontend under load"""
        print("\nTesting Frontend Load Handling...")

        def frontend_request():
            try:
                import requests
                start = time.time()
                response = requests.get(self.frontend_url, timeout=15)
                response_time = (time.time() - start) * 1000
                return response.status_code == 200, response_time
            except:
                return False, 0

        concurrent_users = 10
        test_duration = 20
        results = []

        def worker():
            end_time = time.time() + test_duration
            while time.time() < end_time:
                success, response_time = frontend_request()
                results.append({'success': success, 'response_time': response_time})
                time.sleep(1)  # 1 second between requests per user

        threads = []
        for _ in range(concurrent_users):
            thread = threading.Thread(target=worker)
            thread.start()
            threads.append(thread)

        for thread in threads:
            thread.join()

        if results:
            total_requests = len(results)
            successful_requests = sum(1 for r in results if r['success'])
            success_rate = (successful_requests / total_requests) * 100
            avg_response_time = statistics.mean([r['response_time'] for r in results if r['success']])

            details = {
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'success_rate': success_rate,
                'avg_response_time': avg_response_time
            }

            if success_rate >= 95 and avg_response_time < 2000:
                status = "PASS"
            elif success_rate >= 85:
                status = "WARN"
            else:
                status = "FAIL"

            self.log_test_result("Frontend Load Test", concurrent_users, status, details)

    def analyze_performance_trends(self):
        """Analyze performance trends across different loads"""
        print("\nAnalyzing Performance Trends...")

        health_tests = [r for r in self.test_results if "Health Endpoint" in r['test']]
        if len(health_tests) >= 3:
            response_times = [r['details']['avg_response_time'] for r in health_tests]
            success_rates = [r['details']['success_rate'] for r in health_tests]

            # Check if performance degrades gracefully
            degradation_threshold = 50  # 50% increase in response time
            if len(response_times) >= 2:
                initial_time = response_times[0]
                final_time = response_times[-1]
                degradation = ((final_time - initial_time) / initial_time) * 100

                if degradation < degradation_threshold and min(success_rates) >= 90:
                    trend_status = "PASS"
                    trend_details = "Performance degrades gracefully under load"
                elif min(success_rates) >= 75:
                    trend_status = "WARN"
                    trend_details = f"Performance degradation: {degradation:.1f}%"
                else:
                    trend_status = "FAIL"
                    trend_details = f"Severe performance degradation: {degradation:.1f}%"

                self.log_test_result("Performance Trend Analysis", 0, trend_status, {
                    'degradation_percent': degradation,
                    'min_success_rate': min(success_rates),
                    'details': trend_details
                })

    def run_all_load_tests(self) -> Dict[str, Any]:
        """Run comprehensive load testing suite"""
        print("Starting ProtoThrive Load Testing and Scalability Assessment")
        print("=" * 70)

        # Run all load tests
        self.stress_test_health_endpoint()
        self.test_api_endpoints_load()
        self.test_burst_traffic()
        self.test_sustained_load()
        self.test_frontend_load()
        self.analyze_performance_trends()

        # Calculate overall results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["status"] == "PASS")
        failed_tests = sum(1 for r in self.test_results if r["status"] == "FAIL")
        warned_tests = sum(1 for r in self.test_results if r["status"] == "WARN")

        print("\n" + "=" * 70)
        print("LOAD TESTING SUMMARY")
        print("=" * 70)
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Failed: {failed_tests}/{total_tests}")
        print(f"Warnings: {warned_tests}/{total_tests}")

        scalability_score = (passed_tests / total_tests) * 100
        print(f"Scalability Score: {scalability_score:.1f}%")

        if scalability_score >= 80:
            print("SCALABILITY STATUS: READY FOR PRODUCTION LOAD")
            scalability_status = "READY"
        elif scalability_score >= 60:
            print("SCALABILITY STATUS: NEEDS OPTIMIZATION")
            scalability_status = "NEEDS_OPTIMIZATION"
        else:
            print("SCALABILITY STATUS: NOT READY FOR PRODUCTION")
            scalability_status = "NOT_READY"

        return {
            "timestamp": datetime.now().isoformat(),
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "warnings": warned_tests,
            "scalability_score": scalability_score,
            "status": scalability_status,
            "detailed_results": self.test_results
        }

def main():
    """Main execution function"""
    print("WARNING: This load test will generate significant traffic to your endpoints.")
    print("Ensure you have appropriate monitoring in place and are not violating any terms of service.")
    print("Starting load tests in 5 seconds...")
    time.sleep(5)

    tester = LoadTester()
    results = tester.run_all_load_tests()

    # Save results to file
    with open("load_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDetailed load test results saved to: load_test_results.json")

    # Exit with appropriate code
    if results["scalability_score"] >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Needs attention

if __name__ == "__main__":
    main()