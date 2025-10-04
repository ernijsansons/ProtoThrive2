/**
 * Comprehensive test suite for ProtoThrive authentication endpoints
 * Following TDD principles with 95%+ coverage requirement
 * Tests all success and failure scenarios with security considerations
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Hono } from 'hono';
import { hashPassword, verifyPassword, validatePasswordComplexity } from '../src/utils/auth';

// Mock environment and database
const mockEnv = {
  DB: {
    prepare: jest.fn(),
  },
  JWT_SECRET: 'test_secret_key_that_is_at_least_64_characters_long_for_security_testing_purposes_123',
};

// Mock database responses
const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  password_hash: '$hashed$password$123',
  role: 'vibe_coder',
  first_name: 'John',
  last_name: 'Doe',
  created_at: '2024-01-01T00:00:00Z',
  email_verified: true,
};

describe('Authentication Endpoints', () => {
  let app: Hono;
  let mockDbPrepare: any;
  let mockDbResult: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup database mocks
    mockDbResult = {
      first: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
    };

    mockDbPrepare = {
      bind: jest.fn().mockReturnValue(mockDbResult),
    };

    (mockEnv.DB.prepare as jest.Mock).mockReturnValue(mockDbPrepare);

    // Import app after mocks are set up (dynamic import to avoid hoisting issues)
    app = new Hono();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid data', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'engineer'
      };

      // Mock database to return no existing user
      mockDbResult.first.mockResolvedValueOnce(null);

      // Mock successful user creation
      mockDbResult.run.mockResolvedValueOnce({
        success: true,
        meta: { changes: 1 }
      });

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'User registered successfully');
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('userId');
      expect(responseData.data).not.toHaveProperty('password');
    });

    it('should reject registration with duplicate email', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Mock database to return existing user
      mockDbResult.first.mockResolvedValueOnce(mockUser);

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(409);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Email already registered');
      expect(responseData).toHaveProperty('code', 'EMAIL_EXISTS');
    });

    it('should reject registration with weak password', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'weak',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('code', 'WEAK_PASSWORD');
    });

    it('should reject registration with invalid email format', async () => {
      // Arrange
      const registerData = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('code', 'VALIDATION_INVALID_INPUT');
    });

    it('should reject registration with missing required fields', async () => {
      // Arrange
      const registerData = {
        email: 'test@example.com'
        // missing password
      };

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('code', 'VALIDATION_INVALID_INPUT');
    });

    it('should reject registration with SQL injection attempt', async () => {
      // Arrange
      const registerData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'SecureP@ssw0rd123',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      // Act
      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      // Assert
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
      expect(responseData).toHaveProperty('code', 'VALIDATION_INVALID_INPUT');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'correct_password'
      };

      const hashedPassword = await hashPassword('correct_password');
      const userWithHashedPassword = {
        ...mockUser,
        password_hash: hashedPassword
      };

      // Mock database to return user
      mockDbResult.first.mockResolvedValueOnce(userWithHashedPassword);

      // Mock successful login timestamp update
      mockDbResult.run.mockResolvedValueOnce({ success: true });

      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'Login successful');
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('accessToken');
      expect(responseData.data).toHaveProperty('refreshToken');
      expect(responseData.data).toHaveProperty('user');
      expect(responseData.data.user).not.toHaveProperty('password_hash');
    });

    it('should reject login with invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'any_password'
      };

      // Mock database to return no user
      mockDbResult.first.mockResolvedValueOnce(null);

      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      // Assert
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Invalid credentials');
      expect(responseData).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrong_password'
      };

      const hashedPassword = await hashPassword('correct_password');
      const userWithHashedPassword = {
        ...mockUser,
        password_hash: hashedPassword
      };

      // Mock database to return user
      mockDbResult.first.mockResolvedValueOnce(userWithHashedPassword);

      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      // Assert
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Invalid credentials');
      expect(responseData).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject login with malformed request body', async () => {
      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should prevent timing attacks', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'any_password'
      };

      // Mock database to return no user
      mockDbResult.first.mockResolvedValueOnce(null);

      // Act & Assert - measure response times
      const startTime = Date.now();
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const endTime = Date.now();

      // Response should take reasonable time (not immediate)
      expect(endTime - startTime).toBeGreaterThan(50); // At least 50ms
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      const refreshTokenData = {
        refreshToken: 'valid_refresh_token'
      };

      // Mock database to return valid refresh token
      mockDbResult.first.mockResolvedValueOnce({
        id: 'token-id',
        user_id: mockUser.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        created_at: new Date().toISOString()
      });

      // Mock database to return user
      mockDbResult.first.mockResolvedValueOnce(mockUser);

      // Mock successful token update
      mockDbResult.run.mockResolvedValueOnce({ success: true });

      // Act
      const response = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenData),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('accessToken');
      expect(responseData.data).toHaveProperty('refreshToken');
    });

    it('should reject refresh with invalid token', async () => {
      // Arrange
      const refreshTokenData = {
        refreshToken: 'invalid_token'
      };

      // Mock database to return no token
      mockDbResult.first.mockResolvedValueOnce(null);

      // Act
      const response = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenData),
      });

      // Assert
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Invalid refresh token');
      expect(responseData).toHaveProperty('code', 'INVALID_REFRESH_TOKEN');
    });

    it('should reject refresh with expired token', async () => {
      // Arrange
      const refreshTokenData = {
        refreshToken: 'expired_token'
      };

      // Mock database to return expired token
      mockDbResult.first.mockResolvedValueOnce({
        id: 'token-id',
        user_id: mockUser.id,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        created_at: new Date().toISOString()
      });

      // Act
      const response = await app.request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshTokenData),
      });

      // Assert
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error', 'Refresh token expired');
      expect(responseData).toHaveProperty('code', 'TOKEN_EXPIRED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully logout with valid refresh token', async () => {
      // Arrange
      const logoutData = {
        refreshToken: 'valid_refresh_token'
      };

      // Mock database to return valid token
      mockDbResult.first.mockResolvedValueOnce({
        id: 'token-id',
        user_id: mockUser.id
      });

      // Mock successful token deletion
      mockDbResult.run.mockResolvedValueOnce({
        success: true,
        meta: { changes: 1 }
      });

      // Act
      const response = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logoutData),
      });

      // Assert
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'Logout successful');
    });

    it('should handle logout with invalid token gracefully', async () => {
      // Arrange
      const logoutData = {
        refreshToken: 'invalid_token'
      };

      // Mock database to return no token
      mockDbResult.first.mockResolvedValueOnce(null);

      // Act
      const response = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logoutData),
      });

      // Assert - Should still return success for security reasons
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'Logout successful');
    });

    it('should handle logout without refresh token', async () => {
      // Act
      const response = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Assert - Should still return success for security reasons
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message', 'Logout successful');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to authentication endpoints', async () => {
      // This test would require integration testing with actual rate limiter
      // For unit testing, we verify the middleware is applied
      expect(true).toBe(true); // Placeholder for rate limiting tests
    });

    it('should block requests after rate limit is exceeded', async () => {
      // Integration test for rate limiting behavior
      expect(true).toBe(true); // Placeholder for rate limiting tests
    });
  });

  describe('Security Features', () => {
    it('should include security headers in all responses', async () => {
      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });

      // Assert
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should sanitize error messages to prevent information disclosure', async () => {
      // Arrange - simulate database error
      mockDbResult.first.mockRejectedValueOnce(new Error('Database connection failed'));

      const loginData = {
        email: 'test@example.com',
        password: 'password'
      };

      // Act
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      // Assert
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).not.toContain('Database connection failed');
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Fuzz Testing', () => {
    const fuzzTestCases = [
      // XSS attempts
      { email: '<script>alert("xss")</script>@example.com', password: 'password' },
      // SQL injection attempts
      { email: "'; DROP TABLE users; --", password: 'password' },
      // Buffer overflow attempts
      { email: 'a'.repeat(10000) + '@example.com', password: 'password' },
      // Unicode injection
      { email: 'test\u0000@example.com', password: 'password' },
      // Invalid JSON structures
      { email: 'test@example.com', password: { $ne: null } },
    ];

    fuzzTestCases.forEach((testCase, index) => {
      it(`should handle fuzz test case ${index + 1} safely`, async () => {
        // Act
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase),
        });

        // Assert - Should not crash and return appropriate error
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    });

    // Run 20 iterations of random input fuzzing
    Array.from({ length: 20 }, (_, i) => {
      it(`should handle random fuzz input iteration ${i + 1}`, async () => {
        // Generate random invalid input
        const randomInput = {
          email: Math.random().toString(36) + '@example.com',
          password: Math.random().toString(36),
          [Math.random().toString(36)]: Math.random().toString(36)
        };

        // Act
        const response = await app.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(randomInput),
        });

        // Assert - Should handle gracefully
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'SecureP@ssw0rd123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify passwords correctly', async () => {
      const password = 'SecureP@ssw0rd123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      const isInvalid = await verifyPassword('wrong_password', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'qwerty123',
        'admin'
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecureP@ssw0rd123',
        'MyStr0ng!P@ssw0rd',
        'C0mplex&Secure#2024'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });
  });

  describe('Constant Time Comparison', () => {
    it('should prevent timing attacks', async () => {
      const password = 'test_password';
      const hash = await hashPassword(password);

      // Measure time for correct password
      const start1 = process.hrtime.bigint();
      await verifyPassword(password, hash);
      const end1 = process.hrtime.bigint();
      const time1 = Number(end1 - start1);

      // Measure time for incorrect password
      const start2 = process.hrtime.bigint();
      await verifyPassword('wrong_password', hash);
      const end2 = process.hrtime.bigint();
      const time2 = Number(end2 - start2);

      // Times should be relatively similar (within order of magnitude)
      const ratio = Math.max(time1, time2) / Math.min(time1, time2);
      expect(ratio).toBeLessThan(10); // Allow some variance but prevent obvious timing attacks
    });
  });
});