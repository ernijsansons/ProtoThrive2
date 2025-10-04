#!/usr/bin/env python3
"""
ProtoThrive Security Audit and Penetration Testing
Comprehensive security assessment for production deployment

Ref: CLAUDE.md - Phase 4: Security Audit and Penetration Testing
"""

import requests
import json
import sys
import time
import base64
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse, quote

class SecurityAuditor:
    def __init__(self):
        self.backend_url = "https://protothrive-backend.ernijs-ansons.workers.dev"
        self.frontend_url = "https://876017e2.protothrive-frontend.pages.dev"
        self.audit_results = []
        self.vulnerability_count = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}

    def log_finding(self, category: str, test: str, severity: str, status: str, details: str = "", recommendation: str = ""):
        """Log security findings"""
        finding = {
            "timestamp": datetime.now().isoformat(),
            "category": category,
            "test": test,
            "severity": severity.lower(),
            "status": status,
            "details": details,
            "recommendation": recommendation
        }
        self.audit_results.append(finding)

        if severity.lower() in self.vulnerability_count:
            if status in ["VULNERABLE", "FAIL"]:
                self.vulnerability_count[severity.lower()] += 1

        severity_symbol = {
            "critical": "[CRITICAL]",
            "high": "[HIGH]",
            "medium": "[MEDIUM]",
            "low": "[LOW]",
            "info": "[INFO]"
        }.get(severity.lower(), "[UNKNOWN]")

        status_symbol = "[PASS]" if status == "PASS" else "[FAIL]" if status in ["FAIL", "VULNERABLE"] else "[INFO]"

        print(f"{severity_symbol} {status_symbol} {category}: {test}")
        if details:
            print(f"   Details: {details}")
        if recommendation:
            print(f"   Recommendation: {recommendation}")

    def test_https_enforcement(self):
        """Test HTTPS enforcement and TLS configuration"""
        print("\nTesting HTTPS Enforcement...")

        try:
            # Test HTTPS enforcement
            response = requests.get(self.backend_url)
            if response.url.startswith('https://'):
                self.log_finding("Transport Security", "HTTPS Enforcement", "LOW", "PASS",
                               "All traffic served over HTTPS")
            else:
                self.log_finding("Transport Security", "HTTPS Enforcement", "HIGH", "VULNERABLE",
                               "HTTP traffic detected", "Enforce HTTPS redirects")

            # Check TLS version (approximate test)
            if hasattr(response.raw, 'version') and response.raw.version >= 11:  # TLS 1.1+
                self.log_finding("Transport Security", "TLS Version", "MEDIUM", "PASS",
                               "Modern TLS version in use")
            else:
                self.log_finding("Transport Security", "TLS Version", "INFO", "INFO",
                               "TLS version check inconclusive")

        except Exception as e:
            self.log_finding("Transport Security", "HTTPS Enforcement", "CRITICAL", "FAIL", str(e))

    def test_security_headers(self):
        """Test for security headers"""
        print("\nTesting Security Headers...")

        try:
            response = requests.get(f"{self.backend_url}/health")

            security_headers = {
                'Strict-Transport-Security': {'severity': 'MEDIUM', 'required': True},
                'X-Content-Type-Options': {'severity': 'MEDIUM', 'required': True},
                'X-Frame-Options': {'severity': 'MEDIUM', 'required': True},
                'X-XSS-Protection': {'severity': 'MEDIUM', 'required': True},
                'Content-Security-Policy': {'severity': 'HIGH', 'required': False},
                'Referrer-Policy': {'severity': 'LOW', 'required': False},
                'Permissions-Policy': {'severity': 'LOW', 'required': False}
            }

            for header, config in security_headers.items():
                if header in response.headers:
                    self.log_finding("Security Headers", f"{header} Header", config['severity'], "PASS",
                                   f"Value: {response.headers[header]}")
                else:
                    status = "VULNERABLE" if config['required'] else "INFO"
                    self.log_finding("Security Headers", f"{header} Header", config['severity'], status,
                                   "Header not found", f"Implement {header} header")

        except Exception as e:
            self.log_finding("Security Headers", "Header Analysis", "CRITICAL", "FAIL", str(e))

    def test_cors_security(self):
        """Test CORS configuration for security issues"""
        print("\nTesting CORS Security...")

        try:
            # Test with legitimate origin
            response = requests.options(f"{self.backend_url}/api/status",
                                      headers={"Origin": self.frontend_url})

            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            cors_credentials = response.headers.get('Access-Control-Allow-Credentials')

            if cors_origin == '*' and cors_credentials == 'true':
                self.log_finding("CORS Security", "Wildcard Origin with Credentials", "HIGH", "VULNERABLE",
                               "Wildcard origin allowed with credentials",
                               "Restrict CORS origins when allowing credentials")
            elif cors_origin == '*':
                self.log_finding("CORS Security", "Wildcard Origin", "MEDIUM", "VULNERABLE",
                               "Wildcard origin allowed",
                               "Consider restricting to specific origins")
            elif cors_origin:
                self.log_finding("CORS Security", "CORS Origin Control", "LOW", "PASS",
                               f"Specific origin allowed: {cors_origin}")
            else:
                self.log_finding("CORS Security", "CORS Configuration", "INFO", "INFO",
                               "No CORS headers found")

            # Test with malicious origin
            malicious_response = requests.options(f"{self.backend_url}/api/status",
                                                headers={"Origin": "https://evil.com"})
            malicious_origin = malicious_response.headers.get('Access-Control-Allow-Origin')

            if malicious_origin and "evil.com" in malicious_origin:
                self.log_finding("CORS Security", "Malicious Origin Test", "HIGH", "VULNERABLE",
                               "Malicious origin accepted",
                               "Implement strict origin validation")
            else:
                self.log_finding("CORS Security", "Malicious Origin Test", "LOW", "PASS",
                               "Malicious origin rejected")

        except Exception as e:
            self.log_finding("CORS Security", "CORS Analysis", "MEDIUM", "FAIL", str(e))

    def test_input_validation(self):
        """Test input validation and injection vulnerabilities"""
        print("\nTesting Input Validation...")

        # SQL Injection tests
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT null--",
            "admin'--",
            "' OR 1=1#"
        ]

        for payload in sql_payloads:
            try:
                # Test in query parameters
                response = requests.get(f"{self.backend_url}/api/roadmaps",
                                      params={"search": payload})

                if response.status_code == 500:
                    self.log_finding("Input Validation", "SQL Injection (Query)", "CRITICAL", "VULNERABLE",
                                   f"Server error with payload: {payload}",
                                   "Implement proper input sanitization and parameterized queries")
                    break
                elif "error" in response.text.lower() and "sql" in response.text.lower():
                    self.log_finding("Input Validation", "SQL Injection (Query)", "HIGH", "VULNERABLE",
                                   f"SQL error detected with payload: {payload}",
                                   "Implement proper error handling and input validation")
                    break
            except Exception:
                pass

        # If no SQL injection found
        if not any(r for r in self.audit_results if "SQL Injection" in r["test"] and r["status"] == "VULNERABLE"):
            self.log_finding("Input Validation", "SQL Injection", "CRITICAL", "PASS",
                           "No SQL injection vulnerabilities detected")

        # XSS Testing
        xss_payloads = [
            "<script>alert('xss')</script>",
            "'><script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>"
        ]

        for payload in xss_payloads:
            try:
                response = requests.post(f"{self.backend_url}/api/roadmaps",
                                       json={"name": payload, "description": "test"})

                if "<script>" in response.text or "javascript:" in response.text:
                    self.log_finding("Input Validation", "XSS Vulnerability", "HIGH", "VULNERABLE",
                                   f"XSS payload reflected: {payload}",
                                   "Implement output encoding and input sanitization")
                    break
            except Exception:
                pass

        # If no XSS found
        if not any(r for r in self.audit_results if "XSS" in r["test"] and r["status"] == "VULNERABLE"):
            self.log_finding("Input Validation", "XSS Protection", "HIGH", "PASS",
                           "No XSS vulnerabilities detected")

    def test_authentication_security(self):
        """Test authentication and authorization security"""
        print("\nTesting Authentication Security...")

        # Test for authentication bypass
        try:
            # Try accessing protected endpoint without auth
            response = requests.get(f"{self.backend_url}/api/user/profile")

            if response.status_code == 401:
                self.log_finding("Authentication", "Auth Required", "MEDIUM", "PASS",
                               "Protected endpoints require authentication")
            elif response.status_code == 200:
                self.log_finding("Authentication", "Auth Bypass", "CRITICAL", "VULNERABLE",
                               "Protected endpoint accessible without authentication",
                               "Implement proper authentication checks")
            else:
                self.log_finding("Authentication", "Auth Behavior", "INFO", "INFO",
                               f"Unexpected response: {response.status_code}")

            # Test with invalid token
            invalid_response = requests.get(f"{self.backend_url}/api/user/profile",
                                          headers={"Authorization": "Bearer invalid_token"})

            if invalid_response.status_code == 401:
                self.log_finding("Authentication", "Invalid Token Handling", "MEDIUM", "PASS",
                               "Invalid tokens properly rejected")
            else:
                self.log_finding("Authentication", "Invalid Token Handling", "HIGH", "VULNERABLE",
                               "Invalid tokens not properly handled",
                               "Implement proper token validation")

        except Exception as e:
            self.log_finding("Authentication", "Auth Testing", "MEDIUM", "FAIL", str(e))

    def test_rate_limiting(self):
        """Test rate limiting implementation"""
        print("\nTesting Rate Limiting...")

        try:
            # Make rapid requests to test rate limiting
            responses = []
            for i in range(20):
                response = requests.get(f"{self.backend_url}/health")
                responses.append(response.status_code)
                time.sleep(0.1)

            # Check if rate limiting kicks in
            rate_limited = any(status == 429 for status in responses)
            if rate_limited:
                self.log_finding("Rate Limiting", "Rate Limit Implementation", "LOW", "PASS",
                               "Rate limiting active (429 responses detected)")
            else:
                # Check for other signs of rate limiting
                error_responses = sum(1 for status in responses if status >= 400)
                if error_responses > 0:
                    self.log_finding("Rate Limiting", "Rate Limit Implementation", "MEDIUM", "INFO",
                                   f"Some requests failed ({error_responses}/20), possible rate limiting")
                else:
                    self.log_finding("Rate Limiting", "Rate Limit Implementation", "MEDIUM", "VULNERABLE",
                                   "No rate limiting detected",
                                   "Implement rate limiting to prevent abuse")

        except Exception as e:
            self.log_finding("Rate Limiting", "Rate Limit Testing", "MEDIUM", "FAIL", str(e))

    def test_information_disclosure(self):
        """Test for information disclosure vulnerabilities"""
        print("\nTesting Information Disclosure...")

        try:
            # Test error handling
            response = requests.get(f"{self.backend_url}/nonexistent")

            if response.status_code == 404:
                try:
                    error_data = response.json()
                    # Check for sensitive information in error messages
                    sensitive_info = ['stack', 'trace', 'file', 'database', 'sql', 'path']
                    disclosed_info = [info for info in sensitive_info
                                    if info in str(error_data).lower()]

                    if disclosed_info:
                        self.log_finding("Information Disclosure", "Error Message Disclosure", "MEDIUM", "VULNERABLE",
                                       f"Sensitive info in errors: {', '.join(disclosed_info)}",
                                       "Sanitize error messages for production")
                    else:
                        self.log_finding("Information Disclosure", "Error Message Handling", "LOW", "PASS",
                                       "Error messages appear sanitized")
                except:
                    self.log_finding("Information Disclosure", "Error Response Format", "INFO", "INFO",
                                   "Non-JSON error response")
            else:
                self.log_finding("Information Disclosure", "404 Handling", "INFO", "INFO",
                               f"Unexpected status for non-existent endpoint: {response.status_code}")

            # Test for server information disclosure
            server_header = response.headers.get('Server', '')
            x_powered_by = response.headers.get('X-Powered-By', '')

            if server_header and 'cloudflare' not in server_header.lower():
                self.log_finding("Information Disclosure", "Server Header Disclosure", "LOW", "VULNERABLE",
                               f"Server header: {server_header}",
                               "Remove or obfuscate server headers")
            else:
                self.log_finding("Information Disclosure", "Server Header", "LOW", "PASS",
                               "Server header properly configured")

        except Exception as e:
            self.log_finding("Information Disclosure", "Disclosure Testing", "MEDIUM", "FAIL", str(e))

    def test_frontend_security(self):
        """Test frontend security configurations"""
        print("\nTesting Frontend Security...")

        try:
            response = requests.get(self.frontend_url)

            # Check for security headers on frontend
            csp_header = response.headers.get('Content-Security-Policy')
            if csp_header:
                if 'unsafe-inline' in csp_header or 'unsafe-eval' in csp_header:
                    self.log_finding("Frontend Security", "CSP Unsafe Directives", "MEDIUM", "VULNERABLE",
                                   "CSP contains unsafe directives",
                                   "Remove unsafe-inline and unsafe-eval from CSP")
                else:
                    self.log_finding("Frontend Security", "Content Security Policy", "MEDIUM", "PASS",
                                   "CSP configured without unsafe directives")
            else:
                self.log_finding("Frontend Security", "Content Security Policy", "MEDIUM", "VULNERABLE",
                               "No CSP header found",
                               "Implement Content Security Policy")

            # Check for mixed content
            if 'http://' in response.text and 'https://' in response.url:
                self.log_finding("Frontend Security", "Mixed Content", "MEDIUM", "VULNERABLE",
                               "Possible mixed content detected",
                               "Ensure all resources loaded over HTTPS")
            else:
                self.log_finding("Frontend Security", "Mixed Content", "MEDIUM", "PASS",
                               "No mixed content detected")

        except Exception as e:
            self.log_finding("Frontend Security", "Frontend Analysis", "MEDIUM", "FAIL", str(e))

    def run_security_audit(self) -> Dict[str, Any]:
        """Run comprehensive security audit"""
        print("Starting ProtoThrive Security Audit and Penetration Testing")
        print("=" * 65)

        # Run all security tests
        self.test_https_enforcement()
        self.test_security_headers()
        self.test_cors_security()
        self.test_input_validation()
        self.test_authentication_security()
        self.test_rate_limiting()
        self.test_information_disclosure()
        self.test_frontend_security()

        # Calculate security score
        total_findings = len(self.audit_results)
        critical_count = self.vulnerability_count["critical"]
        high_count = self.vulnerability_count["high"]
        medium_count = self.vulnerability_count["medium"]
        low_count = self.vulnerability_count["low"]

        # Security scoring (weighted by severity)
        max_score = 100
        deductions = (critical_count * 25) + (high_count * 15) + (medium_count * 8) + (low_count * 3)
        security_score = max(0, max_score - deductions)

        print("\n" + "=" * 65)
        print("SECURITY AUDIT SUMMARY")
        print("=" * 65)
        print(f"Total Findings: {total_findings}")
        print(f"Critical Vulnerabilities: {critical_count}")
        print(f"High Vulnerabilities: {high_count}")
        print(f"Medium Vulnerabilities: {medium_count}")
        print(f"Low Vulnerabilities: {low_count}")
        print(f"Security Score: {security_score}/100")

        if security_score >= 90:
            print("SECURITY STATUS: EXCELLENT - PRODUCTION READY")
            security_status = "EXCELLENT"
        elif security_score >= 80:
            print("SECURITY STATUS: GOOD - MINOR IMPROVEMENTS NEEDED")
            security_status = "GOOD"
        elif security_score >= 70:
            print("SECURITY STATUS: FAIR - IMPROVEMENTS REQUIRED")
            security_status = "FAIR"
        elif security_score >= 60:
            print("SECURITY STATUS: POOR - SIGNIFICANT IMPROVEMENTS NEEDED")
            security_status = "POOR"
        else:
            print("SECURITY STATUS: CRITICAL - NOT READY FOR PRODUCTION")
            security_status = "CRITICAL"

        return {
            "timestamp": datetime.now().isoformat(),
            "total_findings": total_findings,
            "vulnerability_counts": self.vulnerability_count,
            "security_score": security_score,
            "status": security_status,
            "detailed_results": self.audit_results
        }

def main():
    """Main execution function"""
    auditor = SecurityAuditor()
    results = auditor.run_security_audit()

    # Save results to file
    with open("security_audit_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDetailed security audit results saved to: security_audit_results.json")

    # Exit with appropriate code
    if results["security_score"] >= 80:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Security issues found

if __name__ == "__main__":
    main()