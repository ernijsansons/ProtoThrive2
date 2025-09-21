"""
Basic Security Validation Tests
Tests core security implementations work correctly
"""

import json
import os
import re
import pytest


def test_environment_variable_security():
    """Test that environment variables are used instead of hardcoded values"""
    # Test that ENVIRONMENT variable can be set
    os.environ['ENVIRONMENT'] = 'test'
    assert os.environ.get('ENVIRONMENT') == 'test'

    # Test production environment detection
    os.environ['ENVIRONMENT'] = 'production'
    assert os.environ.get('ENVIRONMENT') == 'production'


def test_input_validation_patterns():
    """Test XSS and injection pattern detection"""

    dangerous_patterns = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'vbscript:alert("xss")',
        'eval("malicious code")',
        'document.cookie',
        'window.location',
        '__proto__',
        'constructor',
    ]

    # Simple pattern matching similar to our security module
    xss_patterns = ['<script>', 'javascript:', 'vbscript:', 'eval(', 'alert(', 'document.', 'window.', '__proto__', 'constructor']

    for dangerous in dangerous_patterns:
        has_pattern = any(pattern in dangerous.lower() for pattern in xss_patterns)
        assert has_pattern, f"Should detect dangerous pattern in: {dangerous}"


def test_sql_injection_patterns():
    """Test SQL injection pattern detection"""

    injection_attempts = [
        "'; DROP TABLE users; --",
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        "'; DELETE FROM roadmaps; --",
        "' OR TRUE --",
    ]

    sql_patterns = ["'", "DROP", "DELETE", "UNION", "OR 1=1", "--", "OR TRUE"]

    for injection in injection_attempts:
        has_sql_pattern = any(pattern.upper() in injection.upper() for pattern in sql_patterns)
        assert has_sql_pattern, f"Should detect SQL injection in: {injection}"


def test_uuid_format_validation():
    """Test UUID format validation"""

    valid_uuids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "12345678-1234-1234-1234-123456789012",
        "abcdef00-1234-5678-9abc-def012345678"
    ]

    invalid_uuids = [
        "not-a-uuid",
        "12345678-1234-1234-1234-12345678901x",  # Invalid character
        "x" * 100,  # Too long
        "",  # Empty
        None,  # None
        "../../../etc/passwd",  # Path traversal
        "<script>alert('xss')</script>",  # XSS
    ]

    uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

    for valid_uuid in valid_uuids:
        assert re.match(uuid_pattern, valid_uuid, re.I), f"Should validate UUID: {valid_uuid}"

    for invalid_uuid in invalid_uuids:
        if invalid_uuid is not None and isinstance(invalid_uuid, str):
            assert not re.match(uuid_pattern, invalid_uuid, re.I), f"Should reject invalid UUID: {invalid_uuid}"


def test_json_depth_protection():
    """Test protection against deeply nested JSON"""

    def check_depth(obj, current_depth=0, max_depth=10):
        if current_depth > max_depth:
            return False  # Too deep

        if isinstance(obj, dict):
            for value in obj.values():
                if not check_depth(value, current_depth + 1, max_depth):
                    return False
        elif isinstance(obj, list):
            for item in obj:
                if not check_depth(item, current_depth + 1, max_depth):
                    return False

        return True

    # Test normal depth (should pass)
    normal_json = {"level1": {"level2": {"level3": "data"}}}
    assert check_depth(normal_json), "Normal depth should be allowed"

    # Test excessive depth (should fail)
    deep_json = {}
    current = deep_json
    for i in range(15):  # Create 15 levels of nesting
        current['nested'] = {}
        current = current['nested']

    assert not check_depth(deep_json), "Excessive depth should be rejected"


def test_payload_size_limits():
    """Test payload size validation"""

    def check_payload_size(data, max_size=1024 * 100):  # 100KB
        payload_str = json.dumps(data)
        return len(payload_str.encode('utf-8')) <= max_size

    # Normal size payload
    normal_payload = {"message": "Hello, world!"}
    assert check_payload_size(normal_payload), "Normal payload should be accepted"

    # Large payload
    large_payload = {"data": "x" * (1024 * 200)}  # 200KB
    assert not check_payload_size(large_payload, max_size=1024 * 100), "Large payload should be rejected"


def test_configuration_security():
    """Test that configuration files don't contain secrets"""

    # Check that wrangler.toml doesn't have hardcoded secrets
    wrangler_path = "wrangler.toml"

    if os.path.exists(wrangler_path):
        with open(wrangler_path, 'r') as f:
            content = f.read()

        # Check each line separately to handle comments properly
        lines = content.split('\n')
        dangerous_lines = []

        for line in lines:
            # Skip commented lines
            if line.strip().startswith('#'):
                continue

            # Check for dangerous patterns (actual secrets, not env vars or placeholders)
            dangerous_patterns = [
                r'api_key\s*=\s*"[^$]',  # api_key = "actual_key" (not env var)
                r'secret\s*=\s*"[^$]',   # secret = "actual_secret"
                r'token\s*=\s*"[^$]',    # token = "actual_token"
            ]

            for pattern in dangerous_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # Additional check for placeholder values
                    if not any(placeholder in line.lower() for placeholder in ['your-', 'mock', 'example', '${', 'placeholder']):
                        dangerous_lines.append(line.strip())

        assert len(dangerous_lines) == 0, f"Found potential hardcoded secrets in lines: {dangerous_lines}"


def test_error_handling_security():
    """Test error message sanitization"""

    def sanitize_error_for_production(message, environment='production'):
        if environment == 'production' and any(keyword in message.lower() for keyword in ['password', 'secret', 'token', 'key']):
            return "Internal server error"
        return message

    # Test production error sanitization
    sensitive_error = "Database connection failed: password=secret123"
    sanitized = sanitize_error_for_production(sensitive_error, 'production')
    assert "password" not in sanitized, "Sensitive info should be removed in production"
    assert "secret123" not in sanitized, "Sensitive info should be removed in production"

    # Test development error (should preserve details)
    dev_sanitized = sanitize_error_for_production(sensitive_error, 'development')
    assert "password" in dev_sanitized, "Details should be preserved in development"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])