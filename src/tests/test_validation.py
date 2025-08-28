#!/usr/bin/env python3
"""
Test suite for validation utilities
"""

import pytest
import os
import sys

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.utils.validation import InputValidator, ValidationError

class TestInputValidator:
    """Test cases for InputValidator class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.validator = InputValidator()
    
    def test_validate_email_valid(self):
        """Test valid email validation"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "user+tag@example.org",
            "123@numbers.com"
        ]
        
        for email in valid_emails:
            assert self.validator.validate_email(email) is True
            assert len(self.validator.errors) == 0
    
    def test_validate_email_invalid(self):
        """Test invalid email validation"""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user@.com",
            "user..name@example.com"
        ]
        
        for email in invalid_emails:
            self.validator.clear_errors()
            assert self.validator.validate_email(email) is False
            assert len(self.validator.errors) > 0
    
    def test_validate_password_strong(self):
        """Test strong password validation"""
        strong_passwords = [
            "StrongPass123!",
            "MySecureP@ssw0rd",
            "Complex#Password1"
        ]
        
        for password in strong_passwords:
            self.validator.clear_errors()
            assert self.validator.validate_password(password) is True
            assert len(self.validator.errors) == 0
    
    def test_validate_password_weak(self):
        """Test weak password validation"""
        weak_passwords = [
            "weak",  # Too short
            "weakpassword",  # No uppercase, digit, or special char
            "WEAKPASSWORD",  # No lowercase, digit, or special char
            "WeakPassword",  # No digit or special char
            "WeakPass1"  # No special char
        ]
        
        for password in weak_passwords:
            self.validator.clear_errors()
            assert self.validator.validate_password(password) is False
            assert len(self.validator.errors) > 0
    
    def test_validate_string_length_valid(self):
        """Test valid string length validation"""
        assert self.validator.validate_string_length("test", 1, 10, "test_field") is True
        assert self.validator.validate_string_length("exact", 5, 5, "test_field") is True
        assert len(self.validator.errors) == 0
    
    def test_validate_string_length_invalid(self):
        """Test invalid string length validation"""
        # Too short
        self.validator.clear_errors()
        assert self.validator.validate_string_length("a", 2, 10, "test_field") is False
        assert len(self.validator.errors) > 0
        
        # Too long
        self.validator.clear_errors()
        assert self.validator.validate_string_length("toolongstring", 1, 5, "test_field") is False
        assert len(self.validator.errors) > 0
    
    def test_sanitize_html(self):
        """Test HTML sanitization"""
        dangerous_html = """
        <script>alert('xss')</script>
        <iframe src="malicious.com"></iframe>
        <div onclick="alert('click')">Click me</div>
        <img onload="alert('load')" src="image.jpg">
        """
        
        sanitized = self.validator.sanitize_html(dangerous_html)
        
        # Check that dangerous elements are removed
        assert "<script>" not in sanitized
        assert "<iframe>" not in sanitized
        assert "onclick=" not in sanitized
        assert "onload=" not in sanitized
        
        # Check that safe elements remain
        assert "<div>" in sanitized
        assert "<img" in sanitized
    
    def test_validate_json_schema_valid(self):
        """Test valid JSON schema validation"""
        schema = {
            "name": {"type": str, "required": True},
            "age": {"type": int, "required": False},
            "email": {"type": str, "required": True, "min_length": 5}
        }
        
        data = {
            "name": "John Doe",
            "age": 30,
            "email": "john@example.com"
        }
        
        assert self.validator.validate_json_schema(data, schema) is True
        assert len(self.validator.errors) == 0
    
    def test_validate_json_schema_invalid(self):
        """Test invalid JSON schema validation"""
        schema = {
            "name": {"type": str, "required": True},
            "age": {"type": int, "required": True},
            "email": {"type": str, "required": True, "min_length": 10}
        }
        
        # Missing required field
        data1 = {"name": "John Doe"}
        self.validator.clear_errors()
        assert self.validator.validate_json_schema(data1, schema) is False
        assert len(self.validator.errors) > 0
        
        # Wrong type
        data2 = {"name": "John Doe", "age": "thirty", "email": "john@example.com"}
        self.validator.clear_errors()
        assert self.validator.validate_json_schema(data2, schema) is False
        assert len(self.validator.errors) > 0
        
        # String too short
        data3 = {"name": "John Doe", "age": 30, "email": "short"}
        self.validator.clear_errors()
        assert self.validator.validate_json_schema(data3, schema) is False
        assert len(self.validator.errors) > 0
    
    def test_get_errors(self):
        """Test error retrieval"""
        self.validator.validate_email("invalid-email")
        errors = self.validator.get_errors()
        
        assert len(errors) > 0
        assert all(isinstance(error, ValidationError) for error in errors)
        assert any(error.field == "email" for error in errors)
    
    def test_has_errors(self):
        """Test error checking"""
        assert self.validator.has_errors() is False
        
        self.validator.validate_email("invalid-email")
        assert self.validator.has_errors() is True
    
    def test_clear_errors(self):
        """Test error clearing"""
        self.validator.validate_email("invalid-email")
        assert self.validator.has_errors() is True
        
        self.validator.clear_errors()
        assert self.validator.has_errors() is False
        assert len(self.validator.get_errors()) == 0

class TestValidationError:
    """Test cases for ValidationError dataclass"""
    
    def test_validation_error_creation(self):
        """Test ValidationError object creation"""
        error = ValidationError(
            field="email",
            message="Invalid email format",
            code="INVALID_EMAIL"
        )
        
        assert error.field == "email"
        assert error.message == "Invalid email format"
        assert error.code == "INVALID_EMAIL"

if __name__ == "__main__":
    pytest.main([__file__])
