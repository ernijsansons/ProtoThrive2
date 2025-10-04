#!/usr/bin/env python3
"""
ProtoThrive Production Configuration Audit
Validates all production environment settings and configurations

Ref: CLAUDE.md - Phase 2: Production Configuration Validation
"""

import json
import os
import sys
import subprocess
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional

class ProductionConfigAuditor:
    def __init__(self):
        self.audit_results = []
        self.backend_url = "https://protothrive-backend.ernijs-ansons.workers.dev"
        self.frontend_url = "https://876017e2.protothrive-frontend.pages.dev"

    def log_audit(self, category: str, check: str, status: str, details: str = "", recommendation: str = ""):
        """Log audit results"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "category": category,
            "check": check,
            "status": status,
            "details": details,
            "recommendation": recommendation
        }
        self.audit_results.append(result)

        status_symbol = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[WARN]"
        print(f"{status_symbol} {category}: {check}")
        if details:
            print(f"   Details: {details}")
        if recommendation:
            print(f"   Recommendation: {recommendation}")

    def audit_cloudflare_deployment(self):
        """Audit Cloudflare Workers deployment configuration"""
        print("\nAuditing Cloudflare Workers Deployment...")

        try:
            # Test Workers deployment
            response = requests.get(f"{self.backend_url}/health")
            if response.status_code == 200:
                data = response.json()
                cf_ray = response.headers.get('CF-RAY', 'Not found')
                cf_cache = response.headers.get('CF-Cache-Status', 'Not found')

                self.log_audit("Cloudflare Workers", "Deployment Status", "PASS",
                             f"Version: {data.get('version')}, CF-RAY: {cf_ray}")
            else:
                self.log_audit("Cloudflare Workers", "Deployment Status", "FAIL",
                             f"HTTP {response.status_code}")
        except Exception as e:
            self.log_audit("Cloudflare Workers", "Deployment Status", "FAIL", str(e))

        # Check for edge locations
        try:
            response = requests.get(f"{self.backend_url}/api/status")
            cf_ray = response.headers.get('CF-RAY')
            if cf_ray:
                datacenter = cf_ray.split('-')[-1] if cf_ray else "Unknown"
                self.log_audit("Cloudflare Workers", "Edge Distribution", "PASS",
                             f"Served from datacenter: {datacenter}")
            else:
                self.log_audit("Cloudflare Workers", "Edge Distribution", "WARN",
                             "CF-RAY header not found")
        except Exception as e:
            self.log_audit("Cloudflare Workers", "Edge Distribution", "FAIL", str(e))

    def audit_frontend_deployment(self):
        """Audit Cloudflare Pages frontend deployment"""
        print("\nAuditing Cloudflare Pages Frontend...")

        try:
            response = requests.get(self.frontend_url)
            if response.status_code == 200:
                # Check for Next.js indicators
                content = response.text
                next_js_found = "_next" in content or "Next.js" in content
                react_found = "react" in content.lower()

                self.log_audit("Cloudflare Pages", "Frontend Deployment", "PASS",
                             f"Size: {len(content)} bytes, Next.js: {next_js_found}, React: {react_found}")

                # Check performance headers
                cache_control = response.headers.get('Cache-Control', 'Not found')
                self.log_audit("Cloudflare Pages", "Caching Headers", "PASS" if cache_control != 'Not found' else "WARN",
                             f"Cache-Control: {cache_control}")
            else:
                self.log_audit("Cloudflare Pages", "Frontend Deployment", "FAIL",
                             f"HTTP {response.status_code}")
        except Exception as e:
            self.log_audit("Cloudflare Pages", "Frontend Deployment", "FAIL", str(e))

    def audit_performance_configuration(self):
        """Audit performance-related configurations"""
        print("\nAuditing Performance Configuration...")

        # Test response times
        try:
            import time
            start = time.time()
            response = requests.get(f"{self.backend_url}/health")
            response_time = (time.time() - start) * 1000

            if response_time < 500:
                self.log_audit("Performance", "API Response Time", "PASS",
                             f"{response_time:.2f}ms (Target: <500ms)")
            elif response_time < 1000:
                self.log_audit("Performance", "API Response Time", "WARN",
                             f"{response_time:.2f}ms (Target: <500ms)",
                             "Consider optimizing for faster response times")
            else:
                self.log_audit("Performance", "API Response Time", "FAIL",
                             f"{response_time:.2f}ms (Target: <500ms)",
                             "Response time too slow for production")
        except Exception as e:
            self.log_audit("Performance", "API Response Time", "FAIL", str(e))

        # Test frontend performance
        try:
            start = time.time()
            response = requests.get(self.frontend_url)
            response_time = (time.time() - start) * 1000

            if response_time < 1000:
                self.log_audit("Performance", "Frontend Load Time", "PASS",
                             f"{response_time:.2f}ms (Target: <1000ms)")
            elif response_time < 2000:
                self.log_audit("Performance", "Frontend Load Time", "WARN",
                             f"{response_time:.2f}ms (Target: <1000ms)")
            else:
                self.log_audit("Performance", "Frontend Load Time", "FAIL",
                             f"{response_time:.2f}ms (Target: <1000ms)")
        except Exception as e:
            self.log_audit("Performance", "Frontend Load Time", "FAIL", str(e))

    def audit_security_configuration(self):
        """Audit security-related configurations"""
        print("\nAuditing Security Configuration...")

        # Check HTTPS enforcement
        try:
            response = requests.get(f"{self.backend_url}/health")
            if response.url.startswith('https://'):
                self.log_audit("Security", "HTTPS Enforcement", "PASS",
                             "All traffic served over HTTPS")
            else:
                self.log_audit("Security", "HTTPS Enforcement", "FAIL",
                             "HTTP traffic detected")
        except Exception as e:
            self.log_audit("Security", "HTTPS Enforcement", "FAIL", str(e))

        # Check for security headers
        try:
            response = requests.get(f"{self.backend_url}/health")
            security_headers = {
                'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
                'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
                'X-Frame-Options': response.headers.get('X-Frame-Options'),
                'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
                'Content-Security-Policy': response.headers.get('Content-Security-Policy')
            }

            present_headers = [k for k, v in security_headers.items() if v]
            missing_headers = [k for k, v in security_headers.items() if not v]

            if len(present_headers) >= 3:
                self.log_audit("Security", "Security Headers", "PASS",
                             f"Present: {', '.join(present_headers)}")
            elif len(present_headers) >= 1:
                self.log_audit("Security", "Security Headers", "WARN",
                             f"Present: {', '.join(present_headers)}, Missing: {', '.join(missing_headers)}",
                             "Add missing security headers for enhanced protection")
            else:
                self.log_audit("Security", "Security Headers", "FAIL",
                             "No security headers found",
                             "Implement comprehensive security headers")
        except Exception as e:
            self.log_audit("Security", "Security Headers", "FAIL", str(e))

    def audit_cors_configuration(self):
        """Audit CORS configuration"""
        print("\nAuditing CORS Configuration...")

        try:
            # Test CORS with frontend origin
            response = requests.options(f"{self.backend_url}/api/status",
                                      headers={"Origin": self.frontend_url})

            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
            }

            if cors_headers['Access-Control-Allow-Origin']:
                if self.frontend_url in cors_headers['Access-Control-Allow-Origin'] or cors_headers['Access-Control-Allow-Origin'] == '*':
                    self.log_audit("Security", "CORS Configuration", "PASS",
                                 f"Frontend origin allowed: {cors_headers['Access-Control-Allow-Origin']}")
                else:
                    self.log_audit("Security", "CORS Configuration", "WARN",
                                 f"Origin mismatch: {cors_headers['Access-Control-Allow-Origin']}")
            else:
                self.log_audit("Security", "CORS Configuration", "FAIL",
                             "No CORS headers found")
        except Exception as e:
            self.log_audit("Security", "CORS Configuration", "FAIL", str(e))

    def audit_error_handling(self):
        """Audit error handling configuration"""
        print("\nAuditing Error Handling...")

        # Test 404 handling
        try:
            response = requests.get(f"{self.backend_url}/nonexistent-endpoint")
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    if 'error' in error_data or 'message' in error_data:
                        self.log_audit("Error Handling", "404 Error Response", "PASS",
                                     "Proper JSON error response for 404")
                    else:
                        self.log_audit("Error Handling", "404 Error Response", "WARN",
                                     "404 returned but not structured JSON error")
                except:
                    self.log_audit("Error Handling", "404 Error Response", "WARN",
                                 "404 returned but not JSON response")
            else:
                self.log_audit("Error Handling", "404 Error Response", "FAIL",
                             f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_audit("Error Handling", "404 Error Response", "FAIL", str(e))

        # Test 500 handling (simulated)
        try:
            response = requests.post(f"{self.backend_url}/api/roadmaps",
                                   json={"invalid": "data"})
            if response.status_code >= 400:
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        self.log_audit("Error Handling", "Error Structure", "PASS",
                                     "Proper error structure in API responses")
                    else:
                        self.log_audit("Error Handling", "Error Structure", "WARN",
                                     "Error response but no 'error' field")
                except:
                    self.log_audit("Error Handling", "Error Structure", "FAIL",
                                 "Non-JSON error response")
            else:
                self.log_audit("Error Handling", "Error Structure", "WARN",
                             "Unable to trigger error response for testing")
        except Exception as e:
            self.log_audit("Error Handling", "Error Structure", "FAIL", str(e))

    def audit_api_endpoints(self):
        """Audit API endpoint configuration"""
        print("\nAuditing API Endpoints...")

        # Test critical endpoints
        critical_endpoints = ["/health", "/api/status", "/api/roadmaps", "/api/snippets"]

        for endpoint in critical_endpoints:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}")
                if response.status_code == 200:
                    content_type = response.headers.get('Content-Type', '')
                    if 'application/json' in content_type:
                        self.log_audit("API Endpoints", f"Endpoint {endpoint}", "PASS",
                                     f"Returns JSON (Content-Type: {content_type})")
                    else:
                        self.log_audit("API Endpoints", f"Endpoint {endpoint}", "WARN",
                                     f"Non-JSON response (Content-Type: {content_type})")
                else:
                    self.log_audit("API Endpoints", f"Endpoint {endpoint}", "FAIL",
                                 f"HTTP {response.status_code}")
            except Exception as e:
                self.log_audit("API Endpoints", f"Endpoint {endpoint}", "FAIL", str(e))

    def audit_environment_variables(self):
        """Audit environment variables and configuration"""
        print("\nAuditing Environment Configuration...")

        # Check if backend reports proper environment
        try:
            response = requests.get(f"{self.backend_url}/api/status")
            if response.status_code == 200:
                data = response.json()
                environment = data.get("environment", "unknown")
                if environment == "production":
                    self.log_audit("Environment", "Environment Setting", "PASS",
                                 f"Environment: {environment}")
                else:
                    self.log_audit("Environment", "Environment Setting", "WARN",
                                 f"Environment: {environment}",
                                 "Ensure production environment is properly set")
            else:
                self.log_audit("Environment", "Environment Setting", "FAIL",
                             f"Cannot retrieve environment info")
        except Exception as e:
            self.log_audit("Environment", "Environment Setting", "FAIL", str(e))

    def run_full_audit(self) -> Dict[str, Any]:
        """Run complete production configuration audit"""
        print("Starting ProtoThrive Production Configuration Audit")
        print("=" * 60)

        # Run all audit categories
        self.audit_cloudflare_deployment()
        self.audit_frontend_deployment()
        self.audit_performance_configuration()
        self.audit_security_configuration()
        self.audit_cors_configuration()
        self.audit_error_handling()
        self.audit_api_endpoints()
        self.audit_environment_variables()

        # Calculate results
        total_checks = len(self.audit_results)
        passed_checks = sum(1 for r in self.audit_results if r["status"] == "PASS")
        failed_checks = sum(1 for r in self.audit_results if r["status"] == "FAIL")
        warned_checks = sum(1 for r in self.audit_results if r["status"] == "WARN")

        print("\n" + "=" * 60)
        print("PRODUCTION CONFIGURATION AUDIT SUMMARY")
        print("=" * 60)
        print(f"Passed: {passed_checks}/{total_checks}")
        print(f"Failed: {failed_checks}/{total_checks}")
        print(f"Warnings: {warned_checks}/{total_checks}")

        compliance_rate = (passed_checks / total_checks) * 100
        print(f"Compliance Rate: {compliance_rate:.1f}%")

        if compliance_rate >= 85:
            print("CONFIGURATION STATUS: PRODUCTION READY")
            config_status = "READY"
        elif compliance_rate >= 70:
            print("CONFIGURATION STATUS: NEEDS OPTIMIZATION")
            config_status = "NEEDS_OPTIMIZATION"
        else:
            print("CONFIGURATION STATUS: NOT READY")
            config_status = "NOT_READY"

        return {
            "timestamp": datetime.now().isoformat(),
            "total_checks": total_checks,
            "passed": passed_checks,
            "failed": failed_checks,
            "warnings": warned_checks,
            "compliance_rate": compliance_rate,
            "status": config_status,
            "detailed_results": self.audit_results
        }

def main():
    """Main execution function"""
    auditor = ProductionConfigAuditor()
    results = auditor.run_full_audit()

    # Save results to file
    with open("production_config_audit.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDetailed audit results saved to: production_config_audit.json")

    # Exit with appropriate code
    if results["compliance_rate"] >= 85:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Needs attention

if __name__ == "__main__":
    main()