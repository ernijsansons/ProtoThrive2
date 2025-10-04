import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

describe('Snippet Integration Tests', () => {
  let worker: UnstableDevWorker;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        JWT_SECRET: 'test-secret-key-for-testing-only-minimum-64-characters-required-here',
        ENVIRONMENT: 'test',
      },
    });

    // Register and login a test user
    const email = `snippet-test-${Date.now()}@protothrive.com`;

    await worker.fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'SecurePassword123!',
        name: 'Snippet Test User',
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
    userId = loginData.user.id;
  });

  afterAll(async () => {
    await worker.stop();
  });

  describe('POST /api/snippets', () => {
    it('should create a new snippet', async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Snippet',
          description: 'A test code snippet',
          language: 'javascript',
          code: 'console.log("Hello, World!");',
          tags: ['test', 'javascript', 'console'],
          category: 'utility',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('snippet');
      expect(data.snippet).toHaveProperty('id');
      expect(data.snippet.title).toBe('Test Snippet');
      expect(data.snippet.language).toBe('javascript');
      expect(data.snippet.userId).toBe(userId);
    });

    it('should validate snippet data', async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          // Missing required fields
          description: 'Invalid snippet',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('title');
    });

    it('should sanitize code input', async () => {
      const maliciousCode = '<script>alert("XSS")</script>';

      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'XSS Test',
          description: 'Testing XSS prevention',
          language: 'html',
          code: maliciousCode,
          category: 'test',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      // Code should be stored as-is but escaped when rendered
      expect(data.snippet.code).toBe(maliciousCode);
    });
  });

  describe('GET /api/snippets', () => {
    beforeAll(async () => {
      // Create multiple snippets for testing
      const snippets = [
        {
          title: 'JavaScript Function',
          language: 'javascript',
          code: 'function hello() { return "Hello"; }',
          category: 'function',
        },
        {
          title: 'Python Script',
          language: 'python',
          code: 'print("Hello, Python")',
          category: 'script',
        },
        {
          title: 'SQL Query',
          language: 'sql',
          code: 'SELECT * FROM users;',
          category: 'query',
        },
      ];

      for (const snippet of snippets) {
        await worker.fetch('/api/snippets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(snippet),
        });
      }
    });

    it('should list user snippets', async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('snippets');
      expect(Array.isArray(data.snippets)).toBe(true);
      expect(data.snippets.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter snippets by language', async () => {
      const response = await worker.fetch('/api/snippets?language=javascript', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.snippets.length).toBeGreaterThanOrEqual(1);
      data.snippets.forEach((snippet: any) => {
        expect(snippet.language).toBe('javascript');
      });
    });

    it('should filter snippets by category', async () => {
      const response = await worker.fetch('/api/snippets?category=function', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.snippets.length).toBeGreaterThanOrEqual(1);
      data.snippets.forEach((snippet: any) => {
        expect(snippet.category).toBe('function');
      });
    });

    it('should search snippets by query', async () => {
      const response = await worker.fetch('/api/snippets?search=Python', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.snippets.length).toBeGreaterThanOrEqual(1);
      expect(data.snippets[0].title).toContain('Python');
    });
  });

  describe('GET /api/snippets/:id', () => {
    let snippetId: string;

    beforeAll(async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Get Test Snippet',
          description: 'For GET testing',
          language: 'javascript',
          code: 'const test = true;',
          category: 'test',
        }),
      });

      const data = await response.json();
      snippetId = data.snippet.id;
    });

    it('should get a specific snippet', async () => {
      const response = await worker.fetch(`/api/snippets/${snippetId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('snippet');
      expect(data.snippet.id).toBe(snippetId);
      expect(data.snippet.title).toBe('Get Test Snippet');
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await worker.fetch('/api/snippets/non-existent-id', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('PUT /api/snippets/:id', () => {
    let snippetId: string;

    beforeAll(async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Update Test Snippet',
          description: 'Original description',
          language: 'javascript',
          code: 'let x = 1;',
          category: 'variable',
        }),
      });

      const data = await response.json();
      snippetId = data.snippet.id;
    });

    it('should update a snippet', async () => {
      const response = await worker.fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Snippet Title',
          description: 'Updated description',
          code: 'const x = 1; // Updated to const',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.snippet.title).toBe('Updated Snippet Title');
      expect(data.snippet.description).toBe('Updated description');
      expect(data.snippet.code).toContain('const');
    });

    it('should not allow updating other users snippets', async () => {
      // Create another user
      const otherEmail = `other-snippet-${Date.now()}@protothrive.com`;

      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: 'SecurePassword123!',
          name: 'Other Snippet User',
        }),
      });

      const otherLoginResponse = await worker.fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: 'SecurePassword123!',
        }),
      });

      const otherLoginData = await otherLoginResponse.json();
      const otherToken = otherLoginData.token;

      // Try to update first user's snippet with second user's token
      const response = await worker.fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${otherToken}`,
        },
        body: JSON.stringify({
          title: 'Hacked!',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/snippets/:id', () => {
    let snippetId: string;

    beforeAll(async () => {
      const response = await worker.fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Delete Test Snippet',
          description: 'To be deleted',
          language: 'javascript',
          code: 'delete me;',
          category: 'test',
        }),
      });

      const data = await response.json();
      snippetId = data.snippet.id;
    });

    it('should delete a snippet', async () => {
      const response = await worker.fetch(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(204);

      // Verify snippet is deleted
      const getResponse = await worker.fetch(`/api/snippets/${snippetId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];

      // Send many requests quickly
      for (let i = 0; i < 150; i++) {
        requests.push(
          worker.fetch('/api/snippets', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          })
        );
      }

      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status);

      // Some requests should be rate limited (429)
      expect(statusCodes).toContain(429);

      // Find a rate limited response
      const rateLimitedResponse = responses.find(r => r.status === 429);
      const data = await rateLimitedResponse?.json();

      expect(data?.error).toContain('rate limit');
    });
  });
});