#!/usr/bin/env python3
"""
Test suite for authentication utilities
"""

import pytest
import os
import sys
from datetime import datetime, timedelta

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.utils.auth import SecureAuth, RateLimiter, User

class TestSecureAuth:
    """Test cases for SecureAuth class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.auth = SecureAuth()
        self.test_password = "TestPassword123!"
        self.test_user_data = {
            "user_id": "test123",
            "email": "test@example.com",
            "role": "user"
        }
    
    def test_hash_password(self):
        """Test password hashing"""
        hashed = self.auth.hash_password(self.test_password)
        assert hashed != self.test_password
        assert len(hashed) > 0
        assert hashed.startswith('$2b$')
    
    def test_verify_password(self):
        """Test password verification"""
        hashed = self.auth.hash_password(self.test_password)
        assert self.auth.verify_password(self.test_password, hashed) is True
        assert self.auth.verify_password("wrongpassword", hashed) is False
    
    def test_create_access_token(self):
        """Test access token creation"""
        token = self.auth.create_access_token(self.test_user_data)
        assert token is not None
        assert len(token) > 0
        assert isinstance(token, str)
    
    def test_create_refresh_token(self):
        """Test refresh token creation"""
        token = self.auth.create_refresh_token(self.test_user_data)
        assert token is not None
        assert len(token) > 0
        assert isinstance(token, str)
    
    def test_verify_token(self):
        """Test token verification"""
        token = self.auth.create_access_token(self.test_user_data)
        payload = self.auth.verify_token(token)
        assert payload is not None
        assert payload["user_id"] == self.test_user_data["user_id"]
        assert payload["email"] == self.test_user_data["email"]
    
    def test_verify_invalid_token(self):
        """Test invalid token verification"""
        payload = self.auth.verify_token("invalid_token")
        assert payload is None
    
    def test_generate_secure_password(self):
        """Test secure password generation"""
        password = self.auth.generate_secure_password()
        assert len(password) == 16
        assert any(c.isupper() for c in password)
        assert any(c.islower() for c in password)
        assert any(c.isdigit() for c in password)
        assert any(c in '!@#$%^&*' for c in password)
    
    def test_validate_password_strength(self):
        """Test password strength validation"""
        # Test strong password
        result = self.auth.validate_password_strength(self.test_password)
        assert result["is_valid"] is True
        assert result["strength"] == "strong"
        assert len(result["errors"]) == 0
        
        # Test weak password
        weak_password = "weak"
        result = self.auth.validate_password_strength(weak_password)
        assert result["is_valid"] is False
        assert result["strength"] == "weak"
        assert len(result["errors"]) > 0

class TestRateLimiter:
    """Test cases for RateLimiter class"""
    
    def setup_method(self):
        """Set up test environment"""
        self.rate_limiter = RateLimiter(max_requests=3, window_seconds=60)
    
    def test_initial_requests_allowed(self):
        """Test that initial requests are allowed"""
        identifier = "test_user"
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
    
    def test_rate_limit_exceeded(self):
        """Test that rate limit is enforced"""
        identifier = "test_user"
        # Allow 3 requests
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
        assert self.rate_limiter.is_allowed(identifier) is True
        # 4th request should be blocked
        assert self.rate_limiter.is_allowed(identifier) is False
    
    def test_different_identifiers(self):
        """Test that different identifiers have separate limits"""
        user1 = "user1"
        user2 = "user2"
        
        # Both users should be able to make requests
        assert self.rate_limiter.is_allowed(user1) is True
        assert self.rate_limiter.is_allowed(user2) is True
        assert self.rate_limiter.is_allowed(user1) is True
        assert self.rate_limiter.is_allowed(user2) is True

class TestUser:
    """Test cases for User dataclass"""
    
    def test_user_creation(self):
        """Test user object creation"""
        user = User(
            id="test123",
            email="test@example.com",
            hashed_password="hashed_password",
            role="user"
        )
        
        assert user.id == "test123"
        assert user.email == "test@example.com"
        assert user.hashed_password == "hashed_password"
        assert user.role == "user"
        assert user.is_active is True
    
    def test_user_with_dates(self):
        """Test user creation with dates"""
        now = datetime.utcnow()
        user = User(
            id="test123",
            email="test@example.com",
            hashed_password="hashed_password",
            role="user",
            created_at=now,
            last_login=now
        )
        
        assert user.created_at == now
        assert user.last_login == now

if __name__ == "__main__":
    pytest.main([__file__])
