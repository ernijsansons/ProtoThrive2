import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

describe('Roadmap Integration Tests', () => {
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
    const email = `roadmap-test-${Date.now()}@protothrive.com`;

    await worker.fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'SecurePassword123!',
        name: 'Roadmap Test User',
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

  describe('POST /api/roadmaps', () => {
    it('should create a new roadmap', async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Roadmap',
          description: 'A roadmap for integration testing',
          template: 'blank',
          nodes: [],
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('roadmap');
      expect(data.roadmap).toHaveProperty('id');
      expect(data.roadmap.title).toBe('Test Roadmap');
      expect(data.roadmap.userId).toBe(userId);
    });

    it('should reject roadmap creation without auth', async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Roadmap',
          description: 'Should fail',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should validate roadmap data', async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          // Missing required title
          description: 'Invalid roadmap',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('title');
    });
  });

  describe('GET /api/roadmaps', () => {
    beforeEach(async () => {
      // Create some roadmaps for testing
      const roadmaps = [
        { title: 'Roadmap 1', description: 'First roadmap' },
        { title: 'Roadmap 2', description: 'Second roadmap' },
        { title: 'Roadmap 3', description: 'Third roadmap' },
      ];

      for (const roadmap of roadmaps) {
        await worker.fetch('/api/roadmaps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(roadmap),
        });
      }
    });

    it('should list user roadmaps', async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('roadmaps');
      expect(Array.isArray(data.roadmaps)).toBe(true);
      expect(data.roadmaps.length).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const response = await worker.fetch('/api/roadmaps?limit=2&offset=0', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.roadmaps.length).toBeLessThanOrEqual(2);
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('hasMore');
    });

    it('should filter roadmaps by search query', async () => {
      const response = await worker.fetch('/api/roadmaps?search=First', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.roadmaps.length).toBeGreaterThanOrEqual(1);
      expect(data.roadmaps[0].description).toContain('First');
    });
  });

  describe('GET /api/roadmaps/:id', () => {
    let roadmapId: string;

    beforeEach(async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Get Test Roadmap',
          description: 'For GET testing',
        }),
      });

      const data = await response.json();
      roadmapId = data.roadmap.id;
    });

    it('should get a specific roadmap', async () => {
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('roadmap');
      expect(data.roadmap.id).toBe(roadmapId);
      expect(data.roadmap.title).toBe('Get Test Roadmap');
    });

    it('should return 404 for non-existent roadmap', async () => {
      const response = await worker.fetch('/api/roadmaps/non-existent-id', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toContain('not found');
    });

    it('should not allow access to other users roadmaps', async () => {
      // Create another user and roadmap
      const otherEmail = `other-user-${Date.now()}@protothrive.com`;

      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: 'SecurePassword123!',
          name: 'Other User',
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

      // Try to access first user's roadmap with second user's token
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${otherToken}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('PUT /api/roadmaps/:id', () => {
    let roadmapId: string;

    beforeEach(async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Update Test Roadmap',
          description: 'Original description',
        }),
      });

      const data = await response.json();
      roadmapId = data.roadmap.id;
    });

    it('should update a roadmap', async () => {
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          nodes: [
            {
              id: 'node-1',
              type: 'feature',
              data: { label: 'New Feature' },
              position: { x: 100, y: 100 },
            },
          ],
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.roadmap.title).toBe('Updated Title');
      expect(data.roadmap.description).toBe('Updated description');
      expect(data.roadmap.nodes).toHaveLength(1);
    });

    it('should handle concurrent updates', async () => {
      // Simulate concurrent updates
      const update1 = worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Update 1',
        }),
      });

      const update2 = worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Update 2',
        }),
      });

      const [response1, response2] = await Promise.all([update1, update2]);

      // One should succeed, one might fail due to version conflict
      const statuses = [response1.status, response2.status];
      expect(statuses).toContain(200);

      // Get the final state
      const getResponse = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const finalData = await getResponse.json();
      expect(['Update 1', 'Update 2']).toContain(finalData.roadmap.title);
    });
  });

  describe('POST /api/roadmaps/:id/thrive-score', () => {
    let roadmapId: string;

    beforeEach(async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Thrive Score Test',
          description: 'Testing thrive score calculation',
          nodes: [
            {
              id: 'node-1',
              type: 'feature',
              data: { label: 'Feature 1', completed: true },
              position: { x: 0, y: 0 },
            },
            {
              id: 'node-2',
              type: 'feature',
              data: { label: 'Feature 2', completed: false },
              position: { x: 100, y: 0 },
            },
          ],
        }),
      });

      const data = await response.json();
      roadmapId = data.roadmap.id;
    });

    it('should calculate thrive score', async () => {
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}/thrive-score`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('breakdown');
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);

      // Check breakdown components
      expect(data.breakdown).toHaveProperty('completion');
      expect(data.breakdown).toHaveProperty('quality');
      expect(data.breakdown).toHaveProperty('momentum');
      expect(data.breakdown).toHaveProperty('risk');
    });
  });

  describe('DELETE /api/roadmaps/:id', () => {
    let roadmapId: string;

    beforeEach(async () => {
      const response = await worker.fetch('/api/roadmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Delete Test Roadmap',
          description: 'To be deleted',
        }),
      });

      const data = await response.json();
      roadmapId = data.roadmap.id;
    });

    it('should delete a roadmap', async () => {
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(204);

      // Verify roadmap is deleted
      const getResponse = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(getResponse.status).toBe(404);
    });

    it('should not allow deleting other users roadmaps', async () => {
      // Create another user
      const otherEmail = `delete-other-${Date.now()}@protothrive.com`;

      await worker.fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: otherEmail,
          password: 'SecurePassword123!',
          name: 'Delete Other User',
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

      // Try to delete first user's roadmap with second user's token
      const response = await worker.fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${otherToken}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });
});