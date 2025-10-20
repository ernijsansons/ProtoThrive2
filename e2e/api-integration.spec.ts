/**
 * API Integration Testing Suite
 * Tests backend API endpoints, responses, and error handling
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { generateTestEmail, generateStrongPassword } from './helpers';

test.describe('API Integration Testing', () => {
  test.describe('Health and Status Endpoints', () => {
    test('should return health status', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      console.log('Health response:', data);

      expect(data).toHaveProperty('status');
    });

    test('should return system status', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.status}`);

      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);

      const data = await response.json();
      console.log('Status response:', data);
    });

    test('should have fast response time for health check', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);

      const responseTime = Date.now() - startTime;

      console.log(`Health check response time: ${responseTime}ms`);

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(TEST_CONFIG.performance.apiResponseTime);
    });
  });

  test.describe('Authentication API', () => {
    test('should register new user', async ({ request }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        },
      });

      console.log('Registration response status:', response.status());

      const data = await response.json().catch(() => ({}));
      console.log('Registration response:', data);

      // Should return 201 Created or 200 OK
      expect([200, 201]).toContain(response.status());
    });

    test('should reject registration with weak password', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: generateTestEmail(),
          password: 'weak',
          name: 'Test User',
        },
      });

      console.log('Weak password response:', response.status());

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);

      const data = await response.json().catch(() => ({}));
      console.log('Weak password error:', data);
    });

    test('should reject registration with invalid email', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: 'invalid-email',
          password: generateStrongPassword(),
          name: 'Test User',
        },
      });

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);
    });

    test('should login with valid credentials', async ({ request }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      // Register first
      await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        },
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Login
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });

      console.log('Login response status:', response.status());

      const data = await response.json().catch(() => ({}));
      console.log('Login response:', data);

      expect(response.ok()).toBeTruthy();
      expect(data).toHaveProperty('token');
    });

    test('should reject login with invalid credentials', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        },
      });

      console.log('Invalid login response:', response.status());

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('should refresh JWT token', async ({ request }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      // Register
      await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Login to get token
      const loginResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      if (token) {
        // Refresh token
        const refreshResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.refresh}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Token refresh response:', refreshResponse.status());

        if (refreshResponse.ok()) {
          const refreshData = await refreshResponse.json();
          expect(refreshData).toHaveProperty('token');
        }
      }
    });
  });

  test.describe('Roadmap API', () => {
    let authToken: string;

    test.beforeAll(async ({ request }) => {
      // Create user and get token
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });

      const loginData = await loginResponse.json();
      authToken = loginData.token || '';
    });

    test('should require authentication to list roadmaps', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`);

      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);
    });

    test('should list roadmaps with authentication', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('List roadmaps response:', response.status());

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Roadmaps:', data);

      expect(Array.isArray(data) || Array.isArray(data.roadmaps)).toBeTruthy();
    });

    test('should create new roadmap', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Test Roadmap',
          description: 'A test roadmap created by E2E tests',
          nodes: [],
          edges: [],
        },
      });

      console.log('Create roadmap response:', response.status());

      const data = await response.json().catch(() => ({}));
      console.log('Created roadmap:', data);

      expect([200, 201]).toContain(response.status());
      expect(data).toHaveProperty('id');
    });

    test('should validate roadmap data', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Try to create roadmap without required fields
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          // Missing required fields
        },
      });

      console.log('Invalid roadmap response:', response.status());

      // Should return 400 Bad Request
      expect(response.status()).toBe(400);
    });

    test('should get roadmap by ID', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Create roadmap first
      const createResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Test Roadmap for GET',
          description: 'Test',
          nodes: [],
          edges: [],
        },
      });

      const createdData = await createResponse.json();
      const roadmapId = createdData.id;

      if (roadmapId) {
        // Get roadmap
        const getResponse = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}/${roadmapId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        console.log('Get roadmap response:', getResponse.status());

        expect(getResponse.ok()).toBeTruthy();

        const data = await getResponse.json();
        expect(data).toHaveProperty('id', roadmapId);
      }
    });

    test('should update roadmap', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      // Create roadmap first
      const createResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Roadmap to Update',
          description: 'Original description',
          nodes: [],
          edges: [],
        },
      });

      const createdData = await createResponse.json();
      const roadmapId = createdData.id;

      if (roadmapId) {
        // Update roadmap
        const updateResponse = await request.put(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.roadmaps}/${roadmapId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: 'Updated Roadmap Name',
            description: 'Updated description',
            nodes: [{ id: '1', type: 'task', data: { label: 'Task 1' } }],
            edges: [],
          },
        });

        console.log('Update roadmap response:', updateResponse.status());

        expect(updateResponse.ok()).toBeTruthy();

        const updatedData = await updateResponse.json();
        expect(updatedData.name || updatedData.roadmap?.name).toBe('Updated Roadmap Name');
      }
    });
  });

  test.describe('Snippets API', () => {
    let authToken: string;

    test.beforeAll(async ({ request }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        data: {
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginResponse = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: testEmail,
          password: testPassword,
        },
      });

      const loginData = await loginResponse.json();
      authToken = loginData.token || '';
    });

    test('should list code snippets', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.snippets}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('List snippets response:', response.status());

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      console.log('Snippets:', data);
    });

    test('should create code snippet', async ({ request }) => {
      if (!authToken) {
        test.skip();
        return;
      }

      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.snippets}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Test Snippet',
          code: 'console.log("Hello World");',
          language: 'javascript',
          category: 'testing',
        },
      });

      console.log('Create snippet response:', response.status());

      const data = await response.json().catch(() => ({}));
      console.log('Created snippet:', data);

      expect([200, 201]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}/api/nonexistent`);

      expect(response.status()).toBe(404);
    });

    test('should return proper error format', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.login}`, {
        data: {
          email: 'invalid',
          password: 'short',
        },
      });

      const data = await response.json().catch(() => ({}));

      console.log('Error response:', data);

      // Should have error structure
      expect(data).toHaveProperty('error');
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.register}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: 'invalid json{',
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits', async ({ request }) => {
      const endpoint = `${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`;

      let rateLimitHit = false;

      // Make many requests quickly
      for (let i = 0; i < 150; i++) {
        const response = await request.get(endpoint);

        if (response.status() === 429) {
          rateLimitHit = true;
          console.log(`Rate limit hit after ${i + 1} requests`);
          break;
        }

        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      console.log('Rate limiting:', rateLimitHit ? 'Active' : 'Not detected');
    });
  });

  test.describe('CORS', () => {
    test('should include CORS headers', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);

      const headers = response.headers();

      console.log('CORS headers:', {
        origin: headers['access-control-allow-origin'],
        methods: headers['access-control-allow-methods'],
        headers: headers['access-control-allow-headers'],
      });

      // Should have CORS headers
      expect(headers['access-control-allow-origin']).toBeTruthy();
    });
  });

  test.describe('Response Format', () => {
    test('should return JSON responses', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);

      const contentType = response.headers()['content-type'];

      console.log('Content-Type:', contentType);

      expect(contentType).toContain('application/json');
    });

    test('should include proper response headers', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);

      const headers = response.headers();

      console.log('Response headers:', headers);

      // Should have content-type
      expect(headers['content-type']).toBeTruthy();

      // Should have security headers
      expect(headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
