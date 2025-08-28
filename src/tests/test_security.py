#!/usr/bin/env python3
"""
Test suite for security utilities
"""

import pytest
import os
import sys
from datetime import datetime, timedelta

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.utils.security import SecurityValidator, CSRFProtection, RateLimiter, InputSanitizer, SecurityThreat
from src.utils.validation import InputValidator

class TestSecurityValidator:
    """Test cases for SecurityValidator class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.validator = SecurityValidator()
    
    def test_detect_sql_injection(self):
        """Test SQL injection detection"""
        # Test various SQL injection patterns
        sql_attacks = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "1; SELECT * FROM users",
            "1 UNION SELECT * FROM passwords",
            "1' AND 1=1--",
            "1' WAITFOR DELAY '00:00:05'--"
        ]
        
        for attack in sql_attacks:
            assert self.validator.detect_sql_injection(attack) is True
        
        # Test legitimate input
        legitimate = [
            "John Doe",
            "user@example.com",
            "normal search term",
            "product name"
        ]
        
        for input_str in legitimate:
            self.validator.clear_threats()
            assert self.validator.detect_sql_injection(input_str) is False
    
    def test_detect_xss(self):
        """Test XSS detection"""
        # Test various XSS patterns
        xss_attacks = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<iframe src=javascript:alert('xss')>",
            "<div onclick=alert('xss')>Click me</div>",
            "<svg onload=alert('xss')>",
            "vbscript:alert('xss')"
        ]
        
        for attack in xss_attacks:
            assert self.validator.detect_xss(attack) is True
        
        # Test legitimate input
        legitimate = [
            "<p>Hello world</p>",
            "<strong>Bold text</strong>",
            "<a href='https://example.com'>Link</a>",
            "Normal text content"
        ]
        
        for input_str in legitimate:
            self.validator.clear_threats()
            assert self.validator.detect_xss(input_str) is False
    
    def test_detect_path_traversal(self):
        """Test path traversal detection"""
        # Test various path traversal patterns
        traversal_attacks = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
            "/etc/shadow",
            "c:\\windows\\system32\\drivers\\etc\\hosts"
        ]
        
        for attack in traversal_attacks:
            assert self.validator.detect_path_traversal(attack) is True
        
        # Test legitimate paths
        legitimate = [
            "images/logo.png",
            "documents/report.pdf",
            "uploads/user_photo.jpg",
            "static/css/style.css"
        ]
        
        for path in legitimate:
            self.validator.clear_threats()
            assert self.validator.detect_path_traversal(path) is False
    
    def test_detect_command_injection(self):
        """Test command injection detection"""
        # Test various command injection patterns
        command_attacks = [
            "| ls -la",
            "; rm -rf /",
            "& whoami",
            "`id`",
            "$(cat /etc/passwd)",
            "cmd /c dir",
            "powershell -Command Get-Process",
            "bash -c 'whoami'"
        ]
        
        for attack in command_attacks:
            assert self.validator.detect_command_injection(attack) is True
        
        # Test legitimate input
        legitimate = [
            "normal text",
            "user input",
            "search query",
            "file name"
        ]
        
        for input_str in legitimate:
            self.validator.clear_threats()
            assert self.validator.detect_command_injection(input_str) is False
    
    def test_validate_url(self):
        """Test URL validation"""
        # Test dangerous protocols
        dangerous_urls = [
            "javascript:alert('xss')",
            "vbscript:msgbox('test')",
            "data:text/html,<script>alert('xss')</script>",
            "file:///etc/passwd"
        ]
        
        for url in dangerous_urls:
            is_valid, message = self.validator.validate_url(url)
            assert is_valid is False
            assert "Dangerous protocol" in message
        
        # Test private IP access
        private_urls = [
            "http://127.0.0.1/admin",
            "https://localhost/api",
            "http://192.168.1.1/config",
            "https://10.0.0.1/data"
        ]
        
        for url in private_urls:
            is_valid, message = self.validator.validate_url(url)
            assert is_valid is False
            assert "Private IP access" in message
        
        # Test valid URLs
        valid_urls = [
            "https://example.com",
            "http://www.google.com/search",
            "https://api.github.com/users",
            "https://stackoverflow.com/questions"
        ]
        
        for url in valid_urls:
            is_valid, message = self.validator.validate_url(url)
            assert is_valid is True
            assert "URL is valid" in message
    
    def test_validate_file_upload(self):
        """Test file upload validation"""
        # Test valid file uploads
        valid_uploads = [
            ("image.jpg", "image/jpeg", 1024),
            ("document.pdf", "application/pdf", 2048),
            ("data.json", "application/json", 512),
            ("report.txt", "text/plain", 100)
        ]
        
        for filename, content_type, size in valid_uploads:
            is_valid, message = self.validator.validate_file_upload(filename, content_type, size)
            assert is_valid is True
            assert "File upload is valid" in message
        
        # Test invalid file uploads
        invalid_uploads = [
            ("script.php", "text/plain", 1024),  # Wrong extension
            ("image.jpg", "image/jpeg", 20 * 1024 * 1024),  # Too large
            ("../../../etc/passwd", "text/plain", 100),  # Path traversal
            ("file.exe", "application/octet-stream", 1024),  # Executable
        ]
        
        for filename, content_type, size in invalid_uploads:
            is_valid, message = self.validator.validate_file_upload(filename, content_type, size)
            assert is_valid is False
    
    def test_sanitize_filename(self):
        """Test filename sanitization"""
        dangerous_filenames = [
            "../../../etc/passwd",
            "file<script>alert('xss')</script>.txt",
            "file:with:colons.txt",
            "file|with|pipes.txt",
            "file?with?question?marks.txt"
        ]
        
        for filename in dangerous_filenames:
            sanitized = self.validator.sanitize_filename(filename)
            assert sanitized != filename
            assert ".." not in sanitized
            assert "<" not in sanitized
            assert ">" not in sanitized
            assert ":" not in sanitized
            assert "|" not in sanitized
            assert "?" not in sanitized

class TestCSRFProtection:
    """Test cases for CSRFProtection class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.csrf = CSRFProtection()
    
    def test_generate_token(self):
        """Test CSRF token generation"""
        session_id = "test_session_123"
        token = self.csrf.generate_token(session_id)
        
        assert token is not None
        assert len(token) > 0
        assert session_id in self.csrf.tokens
    
    def test_validate_token(self):
        """Test CSRF token validation"""
        session_id = "test_session_123"
        token = self.csrf.generate_token(session_id)
        
        # Valid token
        assert self.csrf.validate_token(session_id, token) is True
        
        # Invalid session
        assert self.csrf.validate_token("invalid_session", token) is False
        
        # Invalid token
        assert self.csrf.validate_token(session_id, "invalid_token") is False
    
    def test_invalidate_token(self):
        """Test CSRF token invalidation"""
        session_id = "test_session_123"
        token = self.csrf.generate_token(session_id)
        
        assert session_id in self.csrf.tokens
        self.csrf.invalidate_token(session_id)
        assert session_id not in self.csrf.tokens

class TestRateLimiter:
    """Test cases for RateLimiter class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.rate_limiter = RateLimiter(max_requests=3, window_seconds=60)
    
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        identifier = "test_user"
        
        # First 3 requests should be allowed
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
        
        # 4th request should be blocked
        assert self.rate_limiter.is_allowed(identifier) is False
    
    def test_remaining_requests(self):
        """Test remaining requests calculation"""
        identifier = "test_user"
        
        # Initially should have max requests available
        assert self.rate_limiter.get_remaining_requests(identifier) == 3
        
        # After one request
        self.rate_limiter.is_allowed(identifier)
        assert self.rate_limiter.get_remaining_requests(identifier) == 2
        
        # After two more requests
        self.rate_limiter.is_allowed(identifier)
        self.rate_limiter.is_allowed(identifier)
        assert self.rate_limiter.get_remaining_requests(identifier) == 0

class TestInputSanitizer:
    """Test cases for InputSanitizer class"""
    
    def test_sanitize_html(self):
        """Test HTML sanitization"""
        dangerous_html = """
        <script>alert('xss')</script>
        <iframe src="malicious.com"></iframe>
        <div onclick="alert('click')">Click me</div>
        <img onload="alert('load')" src="image.jpg">
        <object data="malicious.swf"></object>
        <embed src="malicious.swf">
        <form action="malicious.com">
        <input type="text" onfocus="alert('focus')">
        """
        
        sanitized = InputSanitizer.sanitize_html(dangerous_html)
        
        # Check that dangerous elements are removed
        assert "<script>" not in sanitized
        assert "<iframe>" not in sanitized
        assert "<object>" not in sanitized
        assert "<embed>" not in sanitized
        assert "<form>" not in sanitized
        assert "<input" not in sanitized
        assert "onclick=" not in sanitized
        assert "onload=" not in sanitized
        assert "onfocus=" not in sanitized
        assert "javascript:" not in sanitized
        
        # Check that safe elements remain
        assert "<div>" in sanitized
        assert "<img" in sanitized
    
    def test_sanitize_sql_input(self):
        """Test SQL input sanitization"""
        dangerous_sql = """
        SELECT * FROM users WHERE id = 1; DROP TABLE users; --
        SELECT * FROM users WHERE id = 1/* comment */AND admin = 1
        """
        
        sanitized = InputSanitizer.sanitize_sql_input(dangerous_sql)
        
        # Check that SQL comments are removed
        assert "--" not in sanitized
        assert "/*" not in sanitized
        assert "*/" not in sanitized
        
        # Check that single quotes are escaped
        assert "''" in sanitized
    
    def test_sanitize_filename(self):
        """Test filename sanitization"""
        dangerous_filenames = [
            "../../../etc/passwd",
            "file<script>alert('xss')</script>.txt",
            "file:with:colons.txt",
            "file|with|pipes.txt",
            "file?with?question?marks.txt"
        ]
        
        for filename in dangerous_filenames:
            sanitized = InputSanitizer.sanitize_filename(filename)
            assert sanitized != filename
            assert ".." not in sanitized
            assert "<" not in sanitized
            assert ">" not in sanitized
            assert ":" not in sanitized
            assert "|" not in sanitized
            assert "?" not in sanitized

class TestEnhancedValidation:
    """Test cases for enhanced validation features"""
    
    def setup_method(self):
        """Set up test environment"""
        self.validator = InputValidator()
    
    def test_enhanced_password_validation(self):
        """Test enhanced password validation"""
        # Test strong passwords
        strong_passwords = [
            "StrongPass123!@#",
            "MySecureP@ssw0rd2024!",
            "Complex#Password1$%^"
        ]
        
        for password in strong_passwords:
            self.validator.clear_errors()
            assert self.validator.validate_password(password) is True
            assert len(self.validator.errors) == 0
        
        # Test weak passwords
        weak_passwords = [
            "weak",  # Too short
            "weakpassword",  # No uppercase, digit, or special char
            "WEAKPASSWORD",  # No lowercase, digit, or special char
            "WeakPassword",  # No digit or special char
            "WeakPass1",  # No special char
            "123456789",  # No letters or special char
            "password123",  # Common pattern
            "qwerty123!",  # Common pattern
            "aaa123!@#",  # Repeated characters
        ]
        
        for password in weak_passwords:
            self.validator.clear_errors()
            assert self.validator.validate_password(password) is False
            assert len(self.validator.errors) > 0
    
    def test_ip_address_validation(self):
        """Test IP address validation"""
        # Test valid public IPs
        valid_ips = [
            "8.8.8.8",
            "1.1.1.1",
            "208.67.222.222"
        ]
        
        for ip in valid_ips:
            self.validator.clear_errors()
            assert self.validator.validate_ip_address(ip) is True
            assert len(self.validator.errors) == 0
        
        # Test private/loopback IPs
        private_ips = [
            "127.0.0.1",
            "192.168.1.1",
            "10.0.0.1",
            "172.16.0.1"
        ]
        
        for ip in private_ips:
            self.validator.clear_errors()
            assert self.validator.validate_ip_address(ip) is False
            assert len(self.validator.errors) > 0
    
    def test_phone_number_validation(self):
        """Test phone number validation"""
        # Test valid phone numbers
        valid_phones = [
            "1234567890",
            "123-456-7890",
            "(123) 456-7890",
            "+1 123 456 7890"
        ]
        
        for phone in valid_phones:
            self.validator.clear_errors()
            assert self.validator.validate_phone_number(phone) is True
            assert len(self.validator.errors) == 0
        
        # Test invalid phone numbers
        invalid_phones = [
            "123",  # Too short
            "12345678901234567890",  # Too long
            "abc-def-ghij",  # Non-numeric
        ]
        
        for phone in invalid_phones:
            self.validator.clear_errors()
            assert self.validator.validate_phone_number(phone) is False
            assert len(self.validator.errors) > 0
    
    def test_credit_card_validation(self):
        """Test credit card validation"""
        # Test valid credit card numbers (Luhn algorithm)
        valid_cards = [
            "4532015112830366",  # Visa
            "5425233430109903",  # Mastercard
            "378282246310005",   # American Express
        ]
        
        for card in valid_cards:
            self.validator.clear_errors()
            assert self.validator.validate_credit_card(card) is True
            assert len(self.validator.errors) == 0
        
        # Test invalid credit card numbers
        invalid_cards = [
            "1234567890",  # Too short
            "12345678901234567890",  # Too long
            "4532015112830367",  # Invalid checksum
        ]
        
        for card in invalid_cards:
            self.validator.clear_errors()
            assert self.validator.validate_credit_card(card) is False
            assert len(self.validator.errors) > 0
    
    def test_ssn_validation(self):
        """Test SSN validation"""
        # Test valid SSNs
        valid_ssns = [
            "123456789",
            "123-45-6789",
            "123 45 6789"
        ]
        
        for ssn in valid_ssns:
            self.validator.clear_errors()
            assert self.validator.validate_social_security(ssn) is True
            assert len(self.validator.errors) == 0
        
        # Test invalid SSNs
        invalid_ssns = [
            "12345678",  # Too short
            "1234567890",  # Too long
            "000123456",  # Invalid first 3 digits
            "666123456",  # Invalid first 3 digits
            "999123456",  # Invalid first 3 digits
            "111111111",  # All same digits
            "123456789",  # Sequential
        ]
        
        for ssn in invalid_ssns:
            self.validator.clear_errors()
            assert self.validator.validate_social_security(ssn) is False
            assert len(self.validator.errors) > 0

if __name__ == "__main__":
    pytest.main([__file__])
