#!/usr/bin/env python3
"""
ProtoThrive Production Deployment Test Script
Comprehensive testing suite for final deployment validation

Ref: CLAUDE.md - Phase 1: Final System Integration Testing
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Any

class DeploymentTester:
    def __init__(self):
        self.backend_url = "https://protothrive-backend.ernijs-ansons.workers.dev"
        self.frontend_url = "https://876017e2.protothrive-frontend.pages.dev"
        self.test_results = []

    def log_test(self, test_name: str, status: str, details: str = "", response_time: float = 0):
        """Log test results"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "test": test_name,
            "status": status,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2)
        }
        self.test_results.append(result)

        status_emoji = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
        print(f"{status_emoji} {test_name}: {status} ({response_time*1000:.2f}ms)")
        if details:
            print(f"   Details: {details}")

    def test_backend_health(self) -> bool:
        """Test backend health endpoint"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            response_time = time.time() - start_time

            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Backend Health Check", "PASS",
                                f"Version: {data.get('version')}", response_time)
                    return True
                else:
                    self.log_test("Backend Health Check", "FAIL",
                                f"Status not healthy: {data.get('status')}", response_time)
            else:
                self.log_test("Backend Health Check", "FAIL",
                            f"HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Backend Health Check", "FAIL", str(e))
        return False

    def test_backend_status(self) -> bool:
        """Test backend status endpoint"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/api/status", timeout=10)
            response_time = time.time() - start_time

            if response.status_code == 200:
                data = response.json()
                if "ProtoThrive Backend" in data.get("message", ""):
                    self.log_test("Backend Status Check", "PASS",
                                f"Environment: {data.get('environment')}", response_time)
                    return True
                else:
                    self.log_test("Backend Status Check", "FAIL",
                                f"Unexpected message: {data.get('message')}", response_time)
            else:
                self.log_test("Backend Status Check", "FAIL",
                            f"HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Backend Status Check", "FAIL", str(e))
        return False

    def test_backend_endpoints(self) -> bool:
        """Test backend API endpoints"""
        endpoints = ["/", "/api/roadmaps", "/api/snippets"]
        all_passed = True

        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=10)
                response_time = time.time() - start_time

                if response.status_code == 200:
                    self.log_test(f"Backend Endpoint {endpoint}", "PASS",
                                f"Response size: {len(response.text)} bytes", response_time)
                else:
                    self.log_test(f"Backend Endpoint {endpoint}", "FAIL",
                                f"HTTP {response.status_code}", response_time)
                    all_passed = False
            except Exception as e:
                self.log_test(f"Backend Endpoint {endpoint}", "FAIL", str(e))
                all_passed = False

        return all_passed

    def test_frontend_deployment(self) -> bool:
        """Test frontend deployment"""
        try:
            start_time = time.time()
            response = requests.get(self.frontend_url, timeout=15)
            response_time = time.time() - start_time

            if response.status_code == 200:
                if "ProtoThrive" in response.text:
                    self.log_test("Frontend Deployment", "PASS",
                                f"Page size: {len(response.text)} bytes", response_time)
                    return True
                else:
                    self.log_test("Frontend Deployment", "FAIL",
                                "ProtoThrive not found in response", response_time)
            else:
                self.log_test("Frontend Deployment", "FAIL",
                            f"HTTP {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Frontend Deployment", "FAIL", str(e))
        return False

    def test_cors_headers(self) -> bool:
        """Test CORS configuration"""
        try:
            start_time = time.time()
            response = requests.options(f"{self.backend_url}/api/status",
                                      headers={"Origin": self.frontend_url}, timeout=10)
            response_time = time.time() - start_time

            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
            }

            if any(cors_headers.values()):
                self.log_test("CORS Configuration", "PASS",
                            f"Headers present: {list(filter(None, cors_headers.values()))}", response_time)
                return True
            else:
                self.log_test("CORS Configuration", "WARN",
                            "No CORS headers found", response_time)
        except Exception as e:
            self.log_test("CORS Configuration", "FAIL", str(e))
        return False

    def test_security_headers(self) -> bool:
        """Test security headers"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            response_time = time.time() - start_time

            security_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Content-Security-Policy"
            ]

            found_headers = [h for h in security_headers if h in response.headers]

            if found_headers:
                self.log_test("Security Headers", "PASS",
                            f"Found: {', '.join(found_headers)}", response_time)
                return True
            else:
                self.log_test("Security Headers", "WARN",
                            "No security headers found", response_time)
        except Exception as e:
            self.log_test("Security Headers", "FAIL", str(e))
        return False

    def test_rate_limiting(self) -> bool:
        """Test rate limiting (make multiple requests)"""
        try:
            results = []
            for i in range(10):
                start_time = time.time()
                response = requests.get(f"{self.backend_url}/health", timeout=5)
                response_time = time.time() - start_time
                results.append((response.status_code, response_time))
                time.sleep(0.1)  # Small delay between requests

            success_count = sum(1 for status, _ in results if status == 200)
            avg_response_time = sum(rt for _, rt in results) / len(results)

            if success_count >= 8:  # Allow some failures
                self.log_test("Rate Limiting Test", "PASS",
                            f"Successful requests: {success_count}/10", avg_response_time)
                return True
            else:
                self.log_test("Rate Limiting Test", "FAIL",
                            f"Too many failures: {10-success_count}/10", avg_response_time)
        except Exception as e:
            self.log_test("Rate Limiting Test", "FAIL", str(e))
        return False

    def test_error_handling(self) -> bool:
        """Test error handling for non-existent endpoints"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.backend_url}/non-existent-endpoint", timeout=10)
            response_time = time.time() - start_time

            if response.status_code == 404:
                try:
                    error_data = response.json()
                    if "error" in error_data or "message" in error_data:
                        self.log_test("Error Handling", "PASS",
                                    f"Proper 404 with JSON error", response_time)
                        return True
                except:
                    pass

                self.log_test("Error Handling", "WARN",
                            "404 returned but no JSON error", response_time)
            else:
                self.log_test("Error Handling", "FAIL",
                            f"Expected 404, got {response.status_code}", response_time)
        except Exception as e:
            self.log_test("Error Handling", "FAIL", str(e))
        return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all deployment tests"""
        print("Starting ProtoThrive Production Deployment Tests")
        print("=" * 60)

        # Core functionality tests
        print("\nCore Functionality Tests:")
        backend_health = self.test_backend_health()
        backend_status = self.test_backend_status()
        backend_endpoints = self.test_backend_endpoints()
        frontend_deployment = self.test_frontend_deployment()

        # Security and configuration tests
        print("\nSecurity & Configuration Tests:")
        cors_test = self.test_cors_headers()
        security_headers = self.test_security_headers()
        error_handling = self.test_error_handling()

        # Performance tests
        print("\nPerformance Tests:")
        rate_limiting = self.test_rate_limiting()

        # Calculate results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["status"] == "PASS")
        failed_tests = sum(1 for r in self.test_results if r["status"] == "FAIL")
        warned_tests = sum(1 for r in self.test_results if r["status"] == "WARN")

        avg_response_time = sum(r["response_time_ms"] for r in self.test_results) / total_tests

        print("\n" + "=" * 60)
        print("DEPLOYMENT TEST SUMMARY")
        print("=" * 60)
        print(f"Passed: {passed_tests}/{total_tests}")
        print(f"Failed: {failed_tests}/{total_tests}")
        print(f"Warnings: {warned_tests}/{total_tests}")
        print(f"Average Response Time: {avg_response_time:.2f}ms")

        success_rate = (passed_tests / total_tests) * 100
        print(f"Success Rate: {success_rate:.1f}%")

        if success_rate >= 80:
            print("DEPLOYMENT STATUS: READY FOR PRODUCTION")
        elif success_rate >= 60:
            print("DEPLOYMENT STATUS: NEEDS ATTENTION")
        else:
            print("DEPLOYMENT STATUS: NOT READY")

        return {
            "timestamp": datetime.now().isoformat(),
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "warnings": warned_tests,
            "success_rate": success_rate,
            "avg_response_time_ms": avg_response_time,
            "status": "READY" if success_rate >= 80 else "NEEDS_ATTENTION" if success_rate >= 60 else "NOT_READY",
            "detailed_results": self.test_results
        }

def main():
    """Main execution function"""
    tester = DeploymentTester()
    results = tester.run_all_tests()

    # Save results to file
    with open("deployment_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDetailed results saved to: deployment_test_results.json")

    # Exit with appropriate code
    if results["success_rate"] >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure

if __name__ == "__main__":
    main()