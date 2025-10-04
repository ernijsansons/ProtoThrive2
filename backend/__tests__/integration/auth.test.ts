import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

describe('Authentication Integration Tests', () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        JWT_SECRET: 'test-secret-key-for-testing-only-minimum-64-characters-required-here',
        ENVIRONMENT: 'test',
      },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@protothrive.com`,
          password: 'SecurePassword123!',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user.email).toMatch(/@protothrive.com$/);
    });

    it('should reject registration with invalid email', async () => {
      const response = await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'SecurePassword123!',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const response = await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@protothrive.com',
          password: '12345',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('password');
    });

    it('should reject duplicate email registration', async () => {
      const email = `duplicate-${Date.now()}@protothrive.com`;

      // First registration
      const response1 = await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'SecurePassword123!',
          name: 'Test User',
        }),
      });

      expect(response1.status).toBe(201);

      // Duplicate registration
      const response2 = await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'SecurePassword123!',
          name: 'Test User 2',
        }),
      });

      expect(response2.status).toBe(409);

      const data = await response2.json();
      expect(data.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const testEmail = `login-test-${Date.now()}@protothrive.com`;
    const testPassword = 'SecurePassword123!';

    beforeAll(async () => {
      // Register a user for login tests
      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Login Test User',
        }),
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('refreshToken');
      expect(data.user.email).toBe(testEmail);
    });

    it('should fail login with incorrect password', async () => {
      const response = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });

    it('should fail login with non-existent user', async () => {
      const response = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@protothrive.com',
          password: 'AnyPassword123!',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get tokens
      const email = `refresh-test-${Date.now()}@protothrive.com`;
      const password = 'SecurePassword123!';

      // Register user
      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: 'Refresh Test User',
        }),
      });

      // Login
      const loginResponse = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();
      const refreshToken = loginData.refreshToken;

      // Refresh token
      const refreshResponse = await worker.fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      expect(refreshResponse.status).toBe(200);

      const refreshData = await refreshResponse.json();
      expect(refreshData).toHaveProperty('token');
      expect(refreshData).toHaveProperty('refreshToken');
      expect(refreshData.token).not.toBe(loginData.token);
    });

    it('should reject invalid refresh token', async () => {
      const response = await worker.fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: 'invalid-refresh-token',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Invalid refresh token');
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token
      const email = `protected-test-${Date.now()}@protothrive.com`;

      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'SecurePassword123!',
          name: 'Protected Test User',
        }),
      });

      const loginResponse = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'SecurePassword123!',
        }),
      });

      const loginData = await loginResponse.json();
      authToken = loginData.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await worker.fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
    });

    it('should reject protected route without token', async () => {
      const response = await worker.fetch('/api/user/profile', {
        method: 'GET',
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Authorization required');
    });

    it('should reject protected route with invalid token', async () => {
      const response = await worker.fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Invalid token');
    });
  });
});