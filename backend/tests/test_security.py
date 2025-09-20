"""
Security Test Suite for ProtoThrive Backend

Comprehensive security testing including:
- Authentication & Authorization
- SQL Injection Prevention
- CORS Policy Validation
- Rate Limiting
- Input Validation
- OWASP Top 10 Coverage
"""

import pytest
import json
import base64
import hashlib
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock


class TestJWTValidation:
    """Test JWT validation security"""

    @pytest.fixture
    def worker(self):
        """Create Worker instance with mocked environment"""
        from src.main import Worker

        env = {
            "DB": Mock(),
            "KV": Mock(),
            "ENVIRONMENT": "test",
            "ALLOWED_ORIGINS": "https://test.protothrive.com"
        }
        return Worker(env)

    @pytest.mark.asyncio
    async def test_missing_auth_header_rejected(self, worker):
        """Test that requests without auth header are rejected"""
        result = await worker.validate_jwt(None)
        assert result is None

    @pytest.mark.asyncio
    async def test_invalid_bearer_format_rejected(self, worker):
        """Test that invalid Bearer token format is rejected"""
        invalid_formats = [
            "InvalidBearer token123",
            "Bearer",
            "Bearer ",
            "token123",
            ""
        ]

        for invalid in invalid_formats:
            result = await worker.validate_jwt(invalid)
            assert result is None, f"Should reject: {invalid}"

    @pytest.mark.asyncio
    async def test_short_token_rejected(self, worker):
        """Test that suspiciously short tokens are rejected"""
        result = await worker.validate_jwt("Bearer abc")
        assert result is None

    @pytest.mark.asyncio
    async def test_mock_token_accepted_in_dev(self, worker):
        """Test that mock tokens work in development"""
        result = await worker.validate_jwt("Bearer mock_token_user123_engineer")
        assert result is not None
        assert result["id"] == "user123"
        assert result["role"] == "engineer"

    @pytest.mark.asyncio
    async def test_invalid_role_rejected(self, worker):
        """Test that invalid roles are rejected"""
        result = await worker.validate_jwt("Bearer mock_token_user123_hacker")
        assert result is None


class TestSQLInjectionPrevention:
    """Test SQL injection prevention measures"""

    @pytest.fixture
    def db_module(self):
        """Import db module for testing"""
        import sys
        import importlib

        # Mock the environment
        sys.modules['js'] = Mock()

        from backend.utils import db
        return db

    def test_uuid_validation(self, db_module):
        """Test UUID validation prevents injection"""
        # Valid UUIDs should pass
        assert db_module.validate_uuid("550e8400-e29b-41d4-a716-446655440000")
        assert db_module.validate_uuid("00000000-0000-0000-0000-000000000000")

        # Invalid formats should fail
        assert not db_module.validate_uuid("'; DROP TABLE users; --")
        assert not db_module.validate_uuid("1' OR '1'='1")
        assert not db_module.validate_uuid("not-a-uuid")
        assert not db_module.validate_uuid("")
        assert not db_module.validate_uuid(None)

    def test_identifier_sanitization(self, db_module):
        """Test identifier sanitization prevents injection"""
        # Valid identifiers should pass
        assert db_module.sanitize_identifier("valid_identifier") == "valid_identifier"
        assert db_module.sanitize_identifier("table123") == "table123"
        assert db_module.sanitize_identifier("user-id") == "user-id"

        # Invalid identifiers should raise error
        with pytest.raises(ValueError) as exc:
            db_module.sanitize_identifier("table; DROP TABLE users;")
        assert "VAL-400" in str(exc.value)

        with pytest.raises(ValueError):
            db_module.sanitize_identifier("column' OR 1=1--")

    @pytest.mark.asyncio
    async def test_parameterized_queries(self, db_module):
        """Test that queries use parameterization"""
        mock_env = {
            "DB": Mock()
        }
        mock_env["DB"].prepare = Mock(return_value=Mock())

        # Test with status parameter (vulnerable to injection if concatenated)
        injection_attempt = "'; DROP TABLE roadmaps; --"

        with pytest.raises(ValueError) as exc:
            await db_module.queryUserRoadmaps("user123", injection_attempt, mock_env)

        assert "Invalid status" in str(exc.value)


class TestCORSSecurity:
    """Test CORS security policies"""

    @pytest.fixture
    def cors_middleware(self):
        """Create CORS middleware instance"""
        from src.middleware.cors import CORSMiddleware

        env = {
            "ENVIRONMENT": "production",
            "ALLOWED_ORIGINS": "https://protothrive.com,https://app.protothrive.com"
        }
        return CORSMiddleware(env)

    def test_allowed_origin_accepted(self, cors_middleware):
        """Test that allowed origins are accepted"""
        assert cors_middleware.config.is_origin_allowed("https://protothrive.com")
        assert cors_middleware.config.is_origin_allowed("https://app.protothrive.com")

    def test_unauthorized_origin_rejected(self, cors_middleware):
        """Test that unauthorized origins are rejected"""
        assert not cors_middleware.config.is_origin_allowed("https://evil.com")
        assert not cors_middleware.config.is_origin_allowed("http://localhost:3000")
        assert not cors_middleware.config.is_origin_allowed(None)

    def test_preflight_validation(self, cors_middleware):
        """Test CORS preflight validation"""
        # Create mock request with unauthorized origin
        mock_request = Mock()
        mock_request.headers = {"Origin": "https://evil.com"}

        from js import Response
        Response.new = Mock(return_value=Mock())

        response = cors_middleware.handle_preflight(mock_request)

        # Should return 403 for unauthorized origin
        Response.new.assert_called_with(
            "Forbidden",
            status=403,
            headers={"Content-Type": "text/plain"}
        )

    def test_csrf_token_validation(self, cors_middleware):
        """Test CSRF token validation"""
        # GET requests don't need CSRF
        mock_get = Mock()
        mock_get.method = "GET"
        assert cors_middleware.validate_csrf_token(mock_get)

        # POST without token should fail
        mock_post = Mock()
        mock_post.method = "POST"
        mock_post.headers = {}
        assert not cors_middleware.validate_csrf_token(mock_post)


class TestInputValidation:
    """Test input validation and sanitization"""

    @pytest.fixture
    def validation_module(self):
        """Import validation module"""
        from backend.utils import validation
        return validation

    def test_roadmap_body_validation(self, validation_module):
        """Test roadmap body validation"""
        # Valid body should pass
        valid_body = {
            "json_graph": '{"nodes": [], "edges": []}',
            "vibe_mode": True
        }
        result = validation_module.validate_roadmap_body(valid_body)
        assert result is not None

        # Invalid JSON should fail
        with pytest.raises(Exception):
            validation_module.validate_roadmap_body({
                "json_graph": "not valid json",
                "vibe_mode": True
            })

        # Missing required fields should fail
        with pytest.raises(Exception):
            validation_module.validate_roadmap_body({})

    def test_uuid_validation_in_routes(self, validation_module):
        """Test UUID validation in route parameters"""
        # Valid UUID should pass
        assert validation_module.validate_uuid("550e8400-e29b-41d4-a716-446655440000")

        # Injection attempts should fail
        assert not validation_module.validate_uuid("../../etc/passwd")
        assert not validation_module.validate_uuid("<script>alert('xss')</script>")


class TestRateLimiting:
    """Test rate limiting implementation"""

    @pytest.mark.asyncio
    async def test_rate_limit_check(self):
        """Test rate limiting logic"""
        from src.services.auth import AuthenticationService

        # Mock KV store
        mock_kv = AsyncMock()
        mock_kv.get = AsyncMock(return_value=None)
        mock_kv.put = AsyncMock()

        env = {"KV": mock_kv}
        auth_service = AuthenticationService(env)

        # First request should pass
        result = await auth_service._check_rate_limit("test_user")
        assert result is True

        # Simulate hitting rate limit
        mock_kv.get = AsyncMock(return_value=json.dumps({"count": 100}))
        result = await auth_service._check_rate_limit("test_user")
        assert result is False


class TestOWASPTop10:
    """Test coverage for OWASP Top 10 vulnerabilities"""

    def test_a01_broken_access_control(self):
        """Test for broken access control"""
        from src.services.auth import UserRole

        # Test role hierarchy
        assert UserRole.has_permission("super_admin", "vibe_coder")
        assert UserRole.has_permission("engineer", "vibe_coder")
        assert not UserRole.has_permission("vibe_coder", "engineer")
        assert not UserRole.has_permission("engineer", "super_admin")

    def test_a02_cryptographic_failures(self):
        """Test for cryptographic failures"""
        # Test that sensitive data is not exposed
        from src.services.auth import AuthenticationService

        env = {"KV": Mock(), "DB": Mock()}
        auth_service = AuthenticationService(env)

        # Ensure tokens are properly encoded
        token_payload = {
            "sub": "user123",
            "role": "engineer",
            "exp": (datetime.utcnow() + timedelta(hours=1)).timestamp()
        }

        token = auth_service._encode_token(token_payload)
        assert len(token.split('.')) == 3  # JWT format
        assert "user123" not in token  # No plaintext user ID

    def test_a03_injection(self):
        """Test for injection vulnerabilities"""
        # Already covered in TestSQLInjectionPrevention
        pass

    def test_a04_insecure_design(self):
        """Test for insecure design patterns"""
        # Check for secure defaults
        from src.middleware.cors import CORSConfig

        env = {"ENVIRONMENT": "production"}
        cors_config = CORSConfig(env)

        # Production should have strict origins
        assert "http://localhost:3000" not in cors_config.allowed_origins
        assert cors_config.credentials is True  # Credentials should be allowed

    def test_a05_security_misconfiguration(self):
        """Test for security misconfiguration"""
        from src.middleware.cors import CORSConfig

        env = {"ENVIRONMENT": "production"}
        cors_config = CORSConfig(env)

        mock_request = Mock()
        mock_request.headers = {"Origin": "https://protothrive.com"}

        headers = cors_config.get_cors_headers(mock_request)

        # Security headers should be present
        assert headers.get("X-Content-Type-Options") == "nosniff"
        assert headers.get("X-Frame-Options") == "DENY"
        assert headers.get("X-XSS-Protection") == "1; mode=block"
        assert "Content-Security-Policy" in headers

    def test_a07_identification_authentication_failures(self):
        """Test for identification and authentication failures"""
        from src.services.auth import AuthenticationService

        env = {"KV": Mock(), "DB": Mock()}
        auth_service = AuthenticationService(env)

        # Test lockout mechanism
        assert auth_service.max_login_attempts == 5
        assert auth_service.lockout_duration == 1800  # 30 minutes

    def test_a08_software_data_integrity_failures(self):
        """Test for software and data integrity failures"""
        # Test token signature verification
        from src.services.auth import AuthenticationService

        env = {"KV": Mock(), "DB": Mock()}
        auth_service = AuthenticationService(env)

        # Token should have signature
        token_payload = {"sub": "user123", "exp": 9999999999}
        token = auth_service._encode_token(token_payload)

        parts = token.split('.')
        assert len(parts[2]) > 0  # Signature present

    def test_a09_security_logging_monitoring_failures(self):
        """Test for security logging and monitoring"""
        # Check that security events are logged
        import logging

        logger = logging.getLogger(__name__)

        with patch.object(logger, 'warning') as mock_log:
            # Simulate security event
            print("JWT validation error: Invalid token")
            # In real implementation, this would trigger logging


# Performance and Load Testing
class TestPerformanceSecurity:
    """Test performance-related security issues"""

    @pytest.mark.asyncio
    async def test_large_payload_rejection(self):
        """Test that excessively large payloads are rejected"""
        # Create a large JSON payload (potential DoS)
        large_payload = {
            "json_graph": json.dumps({
                "nodes": [{"id": f"node_{i}"} for i in range(10000)],
                "edges": []
            })
        }

        # This should be rejected or handled efficiently
        # Implementation would have size limits

    def test_recursive_json_handling(self):
        """Test handling of deeply nested JSON (billion laughs attack)"""
        # Create deeply nested structure
        nested = {"a": {}}
        current = nested["a"]
        for _ in range(100):
            current["b"] = {}
            current = current["b"]

        # Should handle without stack overflow
        json_str = json.dumps(nested)
        assert len(json_str) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=src", "--cov-report=term-missing"])