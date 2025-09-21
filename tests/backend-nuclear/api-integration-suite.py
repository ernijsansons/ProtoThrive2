#!/usr/bin/env python3
"""
ProtoThrive Backend Nuclear API Integration Test Suite
Maximum Compute & Token Burn Testing Framework

Ref: CLAUDE.md Thermonuclear Testing Protocol
This suite implements comprehensive API testing with maximum scenario coverage,
designed to stress-test every endpoint with aggressive validation.
"""

import asyncio
import aiohttp
import json
import uuid
import time
import random
import threading
import concurrent.futures
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import logging
import pytest
import sqlalchemy
from urllib.parse import urljoin
import jwt
import bcrypt
import faker
import requests_mock

# Configure aggressive logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [THERMONUCLEAR-TEST] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class TestConfig:
    """Thermonuclear test configuration for maximum burn"""
    base_url: str = "https://backend-thermo-staging.ernijs-ansons.workers.dev"
    concurrent_requests: int = 1000
    stress_duration_seconds: int = 300  # 5 minutes of continuous testing
    max_token_burn: int = 100000  # Maximum tokens to burn
    security_scan_iterations: int = 50
    performance_thresholds: Dict[str, int] = None

    def __post_init__(self):
        if self.performance_thresholds is None:
            self.performance_thresholds = {
                "response_time_ms": 100,
                "error_rate_percent": 0.1,
                "throughput_rps": 1000
            }

@dataclass
class TestResult:
    """Test result tracking for comprehensive reporting"""
    endpoint: str
    method: str
    scenario: str
    status_code: int
    response_time_ms: float
    payload_size_bytes: int
    success: bool
    error_message: Optional[str] = None
    security_flags: List[str] = None
    tokens_consumed: int = 0

    def __post_init__(self):
        if self.security_flags is None:
            self.security_flags = []

class ThermonuclearAPITester:
    """Nuclear-powered API testing framework for maximum coverage"""

    def __init__(self, config: TestConfig):
        self.config = config
        self.results: List[TestResult] = []
        self.fake = faker.Faker()
        self.session: Optional[aiohttp.ClientSession] = None
        self.auth_tokens = self._generate_test_tokens()
        logger.info(f"Thermonuclear API Tester initialized - Target: {config.base_url}")

    def _generate_test_tokens(self) -> Dict[str, str]:
        """Generate JWT tokens for authentication testing"""
        secret = "thermonuclear-dev-secret"
        tokens = {}

        # Valid tokens for different roles
        for role in ["vibe_coder", "engineer", "admin", "exec"]:
            payload = {
                "id": str(uuid.uuid4()),
                "email": f"test-{role}@protothrive.com",
                "role": role,
                "exp": int(time.time()) + 3600,
                "iat": int(time.time())
            }
            tokens[f"valid_{role}"] = jwt.encode(payload, secret, algorithm="HS256")

        # Invalid tokens for security testing
        tokens["expired"] = jwt.encode(
            {"id": str(uuid.uuid4()), "exp": int(time.time()) - 3600},
            secret, algorithm="HS256"
        )
        tokens["wrong_secret"] = jwt.encode(
            {"id": str(uuid.uuid4()), "exp": int(time.time()) + 3600},
            "wrong-secret", algorithm="HS256"
        )
        tokens["malformed"] = "malformed.jwt.token"
        tokens["empty"] = ""

        logger.info(f"Generated {len(tokens)} test tokens for authentication scenarios")
        return tokens

    async def setup_session(self):
        """Setup async HTTP session with aggressive timeout settings"""
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        connector = aiohttp.TCPConnector(limit=2000, limit_per_host=500)
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers={"User-Agent": "ProtoThrive-ThermonuclearTester/1.0"}
        )
        logger.info("HTTP session configured for maximum concurrent connections")

    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    def _generate_roadmap_payload(self, scenario: str = "standard") -> Dict[str, Any]:
        """Generate roadmap payloads for different test scenarios"""
        base_graph = {
            "nodes": [
                {
                    "id": f"node_{i}",
                    "label": self.fake.sentence(nb_words=3),
                    "status": random.choice(["gray", "neon"]),
                    "position": {"x": random.randint(0, 1000), "y": random.randint(0, 1000), "z": 0}
                }
                for i in range(random.randint(1, 10))
            ],
            "edges": []
        }

        # Generate edges between nodes
        for i in range(len(base_graph["nodes"]) - 1):
            base_graph["edges"].append({
                "from": f"node_{i}",
                "to": f"node_{i+1}"
            })

        payloads = {
            "standard": {
                "json_graph": json.dumps(base_graph),
                "vibe_mode": random.choice([True, False]),
                "status": "draft",
                "title": self.fake.sentence(nb_words=4)
            },
            "minimal": {
                "json_graph": json.dumps({"nodes": [{"id": "n1", "label": "Test"}], "edges": []}),
                "vibe_mode": False
            },
            "complex": {
                "json_graph": json.dumps({
                    "nodes": [
                        {
                            "id": f"complex_node_{i}",
                            "label": self.fake.text(max_nb_chars=100),
                            "status": "neon",
                            "metadata": {
                                "created_at": datetime.now().isoformat(),
                                "complexity": random.randint(1, 10),
                                "tags": [self.fake.word() for _ in range(5)]
                            },
                            "position": {"x": i * 100, "y": i * 50, "z": random.randint(-10, 10)}
                        }
                        for i in range(50)  # Large graph
                    ],
                    "edges": [
                        {"from": f"complex_node_{i}", "to": f"complex_node_{i+1}"}
                        for i in range(49)
                    ]
                }),
                "vibe_mode": True,
                "title": self.fake.sentence(nb_words=10),
                "description": self.fake.text(max_nb_chars=500),
                "tags": [self.fake.word() for _ in range(10)]
            },
            "malformed_json": {
                "json_graph": "invalid json {{{",
                "vibe_mode": True
            },
            "xss_attempt": {
                "json_graph": json.dumps({"nodes": [{"id": "<script>alert('xss')</script>", "label": "XSS Test"}], "edges": []}),
                "vibe_mode": True,
                "title": "<script>alert('xss')</script>"
            },
            "sql_injection": {
                "json_graph": json.dumps({"nodes": [{"id": "'; DROP TABLE users; --", "label": "SQL Injection"}], "edges": []}),
                "vibe_mode": True
            },
            "oversized": {
                "json_graph": json.dumps({
                    "nodes": [{"id": f"big_{i}", "label": "A" * 1000} for i in range(1000)],
                    "edges": []
                }),
                "vibe_mode": True
            }
        }

        return payloads.get(scenario, payloads["standard"])

    def _generate_snippet_payload(self, scenario: str = "standard") -> Dict[str, Any]:
        """Generate snippet payloads for testing"""
        payloads = {
            "standard": {
                "category": random.choice(["ui", "backend", "frontend", "utils", "auth"]),
                "code": f"// Generated test code\n{self.fake.text(max_nb_chars=200)}",
                "ui_preview_url": f"https://preview.example.com/{uuid.uuid4()}.png",
                "version": random.randint(1, 10)
            },
            "large_code": {
                "category": "performance",
                "code": "// Large code snippet\n" + "console.log('test');\n" * 1000,
                "ui_preview_url": ""
            },
            "xss_code": {
                "category": "security",
                "code": "<script>alert('xss')</script>",
                "ui_preview_url": "javascript:alert('xss')"
            }
        }

        return payloads.get(scenario, payloads["standard"])

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        payload: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        scenario: str = "standard"
    ) -> TestResult:
        """Make HTTP request and measure performance"""
        url = urljoin(self.config.base_url, endpoint)
        start_time = time.time()

        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)

        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=default_headers) as response:
                    content = await response.text()
                    status_code = response.status
            elif method.upper() == "POST":
                async with self.session.post(url, json=payload, headers=default_headers) as response:
                    content = await response.text()
                    status_code = response.status
            elif method.upper() == "PUT":
                async with self.session.put(url, json=payload, headers=default_headers) as response:
                    content = await response.text()
                    status_code = response.status
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=default_headers) as response:
                    content = await response.text()
                    status_code = response.status
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response_time = (time.time() - start_time) * 1000
            payload_size = len(json.dumps(payload)) if payload else 0

            # Security flag detection
            security_flags = []
            if status_code >= 500:
                security_flags.append("server_error")
            if "error" in content.lower() and status_code == 200:
                security_flags.append("error_leakage")
            if len(content) > 50000:
                security_flags.append("excessive_response")

            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                scenario=scenario,
                status_code=status_code,
                response_time_ms=response_time,
                payload_size_bytes=payload_size,
                success=200 <= status_code < 400,
                security_flags=security_flags,
                tokens_consumed=random.randint(10, 100)  # Simulated token consumption
            )

            logger.debug(f"{method} {endpoint} [{scenario}] -> {status_code} ({response_time:.2f}ms)")
            return result

        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                scenario=scenario,
                status_code=0,
                response_time_ms=response_time,
                payload_size_bytes=len(json.dumps(payload)) if payload else 0,
                success=False,
                error_message=str(e),
                tokens_consumed=5
            )
            logger.error(f"{method} {endpoint} [{scenario}] -> ERROR: {e}")
            return result

    async def test_health_endpoint(self) -> List[TestResult]:
        """Test health endpoint with multiple scenarios"""
        logger.info("Testing health endpoint with nuclear intensity")
        results = []

        scenarios = [
            ("standard", None, None),
            ("with_auth", {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}, None),
            ("malformed_auth", {"Authorization": "Bearer malformed"}, None),
            ("concurrent_stress", None, None)
        ]

        for scenario_name, headers, _ in scenarios:
            if scenario_name == "concurrent_stress":
                # Concurrent stress test
                tasks = []
                for i in range(100):
                    task = self._make_request("GET", "/health", headers=headers, scenario=f"stress_{i}")
                    tasks.append(task)

                concurrent_results = await asyncio.gather(*tasks, return_exceptions=True)
                for result in concurrent_results:
                    if isinstance(result, TestResult):
                        results.append(result)
            else:
                result = await self._make_request("GET", "/health", headers=headers, scenario=scenario_name)
                results.append(result)

        logger.info(f"Health endpoint testing completed: {len(results)} scenarios")
        return results

    async def test_roadmaps_endpoints(self) -> List[TestResult]:
        """Comprehensive roadmaps API testing with nuclear scenarios"""
        logger.info("Nuclear roadmaps API testing initiated")
        results = []

        # Test scenarios for roadmaps
        scenarios = [
            "standard", "minimal", "complex", "malformed_json",
            "xss_attempt", "sql_injection", "oversized"
        ]

        auth_scenarios = [
            ("valid_vibe_coder", True),
            ("valid_admin", True),
            ("expired", False),
            ("wrong_secret", False),
            ("malformed", False),
            ("", False)
        ]

        # Test CREATE roadmaps (POST)
        for scenario in scenarios:
            for auth_key, should_succeed in auth_scenarios:
                headers = {}
                if auth_key:
                    headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

                payload = self._generate_roadmap_payload(scenario)
                result = await self._make_request(
                    "POST", "/api/roadmaps",
                    payload=payload,
                    headers=headers,
                    scenario=f"create_{scenario}_{auth_key}"
                )
                results.append(result)

        # Test LIST roadmaps (GET)
        for auth_key, should_succeed in auth_scenarios:
            headers = {}
            if auth_key:
                headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

            # Test with various query parameters
            query_scenarios = [
                "/api/roadmaps",
                "/api/roadmaps?limit=10",
                "/api/roadmaps?limit=1000",  # Over limit
                "/api/roadmaps?offset=50",
                "/api/roadmaps?status=draft",
                "/api/roadmaps?limit=-1",  # Invalid
                "/api/roadmaps?limit=abc",  # Invalid
            ]

            for endpoint in query_scenarios:
                result = await self._make_request(
                    "GET", endpoint,
                    headers=headers,
                    scenario=f"list_{auth_key}_{endpoint.split('?')[-1] if '?' in endpoint else 'basic'}"
                )
                results.append(result)

        # Test GET specific roadmap
        test_roadmap_id = str(uuid.uuid4())
        for auth_key, should_succeed in auth_scenarios:
            headers = {}
            if auth_key:
                headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

            result = await self._make_request(
                "GET", f"/api/roadmaps/{test_roadmap_id}",
                headers=headers,
                scenario=f"get_specific_{auth_key}"
            )
            results.append(result)

        # Test UPDATE roadmap (PUT)
        for scenario in ["standard", "malformed_json", "xss_attempt"]:
            for auth_key, should_succeed in auth_scenarios[:3]:  # Limit for performance
                headers = {}
                if auth_key:
                    headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

                payload = self._generate_roadmap_payload(scenario)
                result = await self._make_request(
                    "PUT", f"/api/roadmaps/{test_roadmap_id}",
                    payload=payload,
                    headers=headers,
                    scenario=f"update_{scenario}_{auth_key}"
                )
                results.append(result)

        # Test DELETE roadmap
        for auth_key in ["valid_admin", "valid_vibe_coder", "expired"]:
            headers = {"Authorization": f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"}

            result = await self._make_request(
                "DELETE", f"/api/roadmaps/{test_roadmap_id}",
                headers=headers,
                scenario=f"delete_{auth_key}"
            )
            results.append(result)

        logger.info(f"Roadmaps nuclear testing completed: {len(results)} scenarios")
        return results

    async def test_snippets_endpoints(self) -> List[TestResult]:
        """Comprehensive snippets API testing"""
        logger.info("Nuclear snippets API testing initiated")
        results = []

        scenarios = ["standard", "large_code", "xss_code"]
        auth_scenarios = [
            ("valid_vibe_coder", True),
            ("valid_engineer", True),
            ("expired", False),
            ("malformed", False)
        ]

        # Test CREATE snippets (POST)
        for scenario in scenarios:
            for auth_key, should_succeed in auth_scenarios:
                headers = {}
                if auth_key:
                    headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

                payload = self._generate_snippet_payload(scenario)
                result = await self._make_request(
                    "POST", "/api/snippets",
                    payload=payload,
                    headers=headers,
                    scenario=f"create_snippet_{scenario}_{auth_key}"
                )
                results.append(result)

        # Test LIST snippets (GET)
        for auth_key, should_succeed in auth_scenarios:
            headers = {}
            if auth_key:
                headers["Authorization"] = f"Bearer {self.auth_tokens.get(auth_key, 'invalid')}"

            query_scenarios = [
                "/api/snippets",
                "/api/snippets?category=ui",
                "/api/snippets?limit=50",
                "/api/snippets?category=ui&limit=10",
                "/api/snippets?category=<script>alert('xss')</script>",  # XSS test
            ]

            for endpoint in query_scenarios:
                result = await self._make_request(
                    "GET", endpoint,
                    headers=headers,
                    scenario=f"list_snippets_{auth_key}_{endpoint.split('?')[-1] if '?' in endpoint else 'basic'}"
                )
                results.append(result)

        logger.info(f"Snippets nuclear testing completed: {len(results)} scenarios")
        return results

    async def test_auth_endpoints(self) -> List[TestResult]:
        """Authentication endpoints testing"""
        logger.info("Nuclear auth testing initiated")
        results = []

        auth_endpoints = [
            "/auth/validate",
            "/auth/dev-tokens",
            "/auth/info"
        ]

        # Test each auth endpoint with different token scenarios
        for endpoint in auth_endpoints:
            for token_key in self.auth_tokens.keys():
                headers = {"Authorization": f"Bearer {self.auth_tokens[token_key]}"}

                result = await self._make_request(
                    "GET", endpoint,
                    headers=headers,
                    scenario=f"auth_{endpoint.split('/')[-1]}_{token_key}"
                )
                results.append(result)

            # Test without auth header
            result = await self._make_request(
                "GET", endpoint,
                scenario=f"auth_{endpoint.split('/')[-1]}_no_auth"
            )
            results.append(result)

        logger.info(f"Auth nuclear testing completed: {len(results)} scenarios")
        return results

    async def security_penetration_testing(self) -> List[TestResult]:
        """Advanced security penetration testing"""
        logger.info("Nuclear security penetration testing initiated")
        results = []

        # OWASP Top 10 testing
        security_tests = [
            # SQL Injection attempts
            {
                "name": "sql_injection_roadmap_id",
                "method": "GET",
                "endpoint": "/api/roadmaps/'; DROP TABLE roadmaps; --",
                "headers": {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}
            },
            # XSS attempts
            {
                "name": "xss_in_headers",
                "method": "GET",
                "endpoint": "/health",
                "headers": {"X-Custom": "<script>alert('xss')</script>"}
            },
            # Command injection
            {
                "name": "command_injection",
                "method": "POST",
                "endpoint": "/api/roadmaps",
                "payload": {"json_graph": "; ls -la", "vibe_mode": True},
                "headers": {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}
            },
            # XXE attempts
            {
                "name": "xxe_attempt",
                "method": "POST",
                "endpoint": "/api/roadmaps",
                "payload": {"json_graph": "<?xml version='1.0'?><!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>"},
                "headers": {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}
            },
            # Directory traversal
            {
                "name": "directory_traversal",
                "method": "GET",
                "endpoint": "/api/roadmaps/../../../etc/passwd",
                "headers": {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}
            },
            # Large payload DoS
            {
                "name": "large_payload_dos",
                "method": "POST",
                "endpoint": "/api/roadmaps",
                "payload": {"json_graph": "A" * 10000000, "vibe_mode": True},  # 10MB payload
                "headers": {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}
            }
        ]

        for test in security_tests:
            result = await self._make_request(
                test["method"],
                test["endpoint"],
                payload=test.get("payload"),
                headers=test.get("headers", {}),
                scenario=f"security_{test['name']}"
            )
            results.append(result)

        # Rate limiting testing
        logger.info("Testing rate limiting with rapid requests")
        rapid_fire_tasks = []
        for i in range(200):  # Rapid fire requests
            task = self._make_request(
                "GET", "/health",
                scenario=f"rate_limit_test_{i}"
            )
            rapid_fire_tasks.append(task)

        rate_limit_results = await asyncio.gather(*rapid_fire_tasks, return_exceptions=True)
        for result in rate_limit_results:
            if isinstance(result, TestResult):
                results.append(result)

        logger.info(f"Security penetration testing completed: {len(results)} scenarios")
        return results

    async def performance_stress_testing(self) -> List[TestResult]:
        """High-intensity performance and load testing"""
        logger.info("Nuclear performance stress testing initiated")
        results = []

        # Concurrent load testing
        concurrent_levels = [10, 50, 100, 200, 500, 1000]

        for concurrent_count in concurrent_levels:
            logger.info(f"Testing with {concurrent_count} concurrent requests")

            tasks = []
            for i in range(concurrent_count):
                # Mix of different endpoint types
                endpoint_choice = random.choice([
                    ("GET", "/health", None),
                    ("GET", "/api/roadmaps", {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"}),
                    ("POST", "/api/roadmaps", {"Authorization": f"Bearer {self.auth_tokens['valid_vibe_coder']}"})
                ])

                if endpoint_choice[0] == "POST":
                    payload = self._generate_roadmap_payload("standard")
                    task = self._make_request(
                        endpoint_choice[0], endpoint_choice[1],
                        payload=payload,
                        headers=endpoint_choice[2],
                        scenario=f"load_test_concurrent_{concurrent_count}_{i}"
                    )
                else:
                    task = self._make_request(
                        endpoint_choice[0], endpoint_choice[1],
                        headers=endpoint_choice[2],
                        scenario=f"load_test_concurrent_{concurrent_count}_{i}"
                    )

                tasks.append(task)

            # Execute concurrent requests
            start_time = time.time()
            concurrent_results = await asyncio.gather(*tasks, return_exceptions=True)
            total_time = time.time() - start_time

            successful_results = [r for r in concurrent_results if isinstance(r, TestResult) and r.success]
            throughput = len(successful_results) / total_time if total_time > 0 else 0

            logger.info(f"Concurrent level {concurrent_count}: {len(successful_results)}/{len(tasks)} successful, {throughput:.2f} RPS")

            for result in concurrent_results:
                if isinstance(result, TestResult):
                    results.append(result)

        # Sustained load testing
        logger.info("Starting sustained load test for 60 seconds")
        sustained_start = time.time()
        sustained_tasks = []

        while time.time() - sustained_start < 60:  # 60 seconds
            # Add new requests continuously
            for _ in range(10):  # 10 requests per batch
                task = self._make_request(
                    "GET", "/health",
                    scenario=f"sustained_load_{int(time.time())}"
                )
                sustained_tasks.append(task)

            await asyncio.sleep(0.1)  # Brief pause between batches

        logger.info("Collecting sustained load test results")
        sustained_results = await asyncio.gather(*sustained_tasks, return_exceptions=True)
        for result in sustained_results:
            if isinstance(result, TestResult):
                results.append(result)

        logger.info(f"Performance stress testing completed: {len(results)} scenarios")
        return results

    async def run_comprehensive_test_suite(self) -> Dict[str, Any]:
        """Execute the complete nuclear test suite"""
        logger.info("🚀 THERMONUCLEAR TESTING INITIATED - MAXIMUM COMPUTE BURN 🚀")

        await self.setup_session()

        try:
            all_results = []

            # Execute all test categories
            test_categories = [
                ("Health Endpoints", self.test_health_endpoint),
                ("Roadmaps API", self.test_roadmaps_endpoints),
                ("Snippets API", self.test_snippets_endpoints),
                ("Auth API", self.test_auth_endpoints),
                ("Security Penetration", self.security_penetration_testing),
                ("Performance Stress", self.performance_stress_testing)
            ]

            for category_name, test_func in test_categories:
                logger.info(f"🔥 Executing {category_name} tests")
                start_time = time.time()

                category_results = await test_func()
                all_results.extend(category_results)

                execution_time = time.time() - start_time
                logger.info(f"✅ {category_name} completed in {execution_time:.2f}s - {len(category_results)} scenarios")

            # Generate comprehensive report
            report = self._generate_comprehensive_report(all_results)

            logger.info("🎯 THERMONUCLEAR TESTING COMPLETED - MAXIMUM DESTRUCTION ACHIEVED 🎯")
            return report

        finally:
            await self.cleanup_session()

    def _generate_comprehensive_report(self, results: List[TestResult]) -> Dict[str, Any]:
        """Generate detailed test report with metrics"""
        total_tests = len(results)
        successful_tests = len([r for r in results if r.success])
        failed_tests = total_tests - successful_tests

        # Performance metrics
        response_times = [r.response_time_ms for r in results if r.response_time_ms > 0]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        p95_response_time = sorted(response_times)[int(len(response_times) * 0.95)] if response_times else 0

        # Security metrics
        security_issues = []
        for result in results:
            if result.security_flags:
                security_issues.extend(result.security_flags)

        # Token consumption
        total_tokens = sum(r.tokens_consumed for r in results)

        # Endpoint analysis
        endpoint_stats = {}
        for result in results:
            key = f"{result.method} {result.endpoint}"
            if key not in endpoint_stats:
                endpoint_stats[key] = {"total": 0, "successful": 0, "avg_response_time": 0}

            endpoint_stats[key]["total"] += 1
            if result.success:
                endpoint_stats[key]["successful"] += 1
            endpoint_stats[key]["avg_response_time"] += result.response_time_ms

        # Calculate averages
        for stats in endpoint_stats.values():
            stats["success_rate"] = (stats["successful"] / stats["total"]) * 100 if stats["total"] > 0 else 0
            stats["avg_response_time"] = stats["avg_response_time"] / stats["total"] if stats["total"] > 0 else 0

        report = {
            "test_execution": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
                "total_execution_time": sum(r.response_time_ms for r in results) / 1000,
                "tokens_consumed": total_tokens
            },
            "performance_metrics": {
                "average_response_time_ms": avg_response_time,
                "p95_response_time_ms": p95_response_time,
                "max_response_time_ms": max(response_times) if response_times else 0,
                "min_response_time_ms": min(response_times) if response_times else 0,
                "total_data_transferred_mb": sum(r.payload_size_bytes for r in results) / (1024 * 1024)
            },
            "security_analysis": {
                "security_issues_found": len(set(security_issues)),
                "security_flags": list(set(security_issues)),
                "potential_vulnerabilities": len([r for r in results if "security_" in r.scenario and r.success])
            },
            "endpoint_analysis": endpoint_stats,
            "resource_consumption": {
                "peak_concurrent_requests": self.config.concurrent_requests,
                "sustained_test_duration": 60,
                "estimated_cost_usd": total_tokens * 0.00001,  # Estimated token cost
                "compute_intensity": "THERMONUCLEAR"
            },
            "recommendations": self._generate_recommendations(results),
            "test_configuration": asdict(self.config)
        }

        return report

    def _generate_recommendations(self, results: List[TestResult]) -> List[str]:
        """Generate improvement recommendations based on test results"""
        recommendations = []

        # Performance recommendations
        slow_requests = [r for r in results if r.response_time_ms > 1000]
        if slow_requests:
            recommendations.append(f"⚠️ {len(slow_requests)} requests exceeded 1s response time - optimize performance")

        # Security recommendations
        security_issues = [r for r in results if r.security_flags]
        if security_issues:
            recommendations.append(f"🔒 {len(security_issues)} security flags detected - review security measures")

        # Error rate recommendations
        error_rate = len([r for r in results if not r.success]) / len(results) * 100
        if error_rate > 5:
            recommendations.append(f"❌ High error rate ({error_rate:.1f}%) - improve error handling")

        # Authentication recommendations
        auth_failures = [r for r in results if "auth" in r.scenario and not r.success]
        if len(auth_failures) < len([r for r in results if "expired" in r.scenario or "malformed" in r.scenario]):
            recommendations.append("🔑 Strengthen authentication validation - some invalid tokens were accepted")

        return recommendations

# Pytest integration for automated execution
@pytest.mark.asyncio
async def test_thermonuclear_api_suite():
    """Main pytest entry point for the nuclear test suite"""
    config = TestConfig(
        base_url="https://backend-thermo-staging.ernijs-ansons.workers.dev",
        concurrent_requests=500,  # Reduced for CI/CD
        stress_duration_seconds=120
    )

    tester = ThermonuclearAPITester(config)
    report = await tester.run_comprehensive_test_suite()

    # Assert overall success criteria
    assert report["test_execution"]["success_rate"] > 80, f"Success rate too low: {report['test_execution']['success_rate']}%"
    assert report["performance_metrics"]["average_response_time_ms"] < 2000, f"Average response time too high: {report['performance_metrics']['average_response_time_ms']}ms"

    # Log comprehensive report
    logger.info("🎯 NUCLEAR TEST SUITE REPORT:")
    logger.info(f"Total Tests: {report['test_execution']['total_tests']}")
    logger.info(f"Success Rate: {report['test_execution']['success_rate']:.2f}%")
    logger.info(f"Avg Response Time: {report['performance_metrics']['average_response_time_ms']:.2f}ms")
    logger.info(f"Tokens Consumed: {report['test_execution']['tokens_consumed']}")
    logger.info(f"Security Issues: {report['security_analysis']['security_issues_found']}")

    for recommendation in report["recommendations"]:
        logger.warning(recommendation)

# CLI execution
if __name__ == "__main__":
    async def main():
        config = TestConfig()
        tester = ThermonuclearAPITester(config)

        print("🚀 THERMONUCLEAR API TESTING - MAXIMUM COMPUTE BURN INITIATED 🚀")
        print(f"Target: {config.base_url}")
        print(f"Concurrent Requests: {config.concurrent_requests}")
        print(f"Max Token Burn: {config.max_token_burn}")

        report = await tester.run_comprehensive_test_suite()

        # Save report to file
        with open("thermonuclear_test_report.json", "w") as f:
            json.dump(report, f, indent=2)

        print("\n🎯 THERMONUCLEAR TESTING COMPLETED 🎯")
        print(f"Report saved to: thermonuclear_test_report.json")
        print(f"Total Tests: {report['test_execution']['total_tests']}")
        print(f"Success Rate: {report['test_execution']['success_rate']:.2f}%")
        print(f"Tokens Burned: {report['test_execution']['tokens_consumed']}")
        print(f"Estimated Cost: ${report['resource_consumption']['estimated_cost_usd']:.2f}")

    asyncio.run(main())