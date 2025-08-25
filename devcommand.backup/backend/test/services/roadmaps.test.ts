import { describe, it, expect, beforeEach } from 'vitest';
import { createTestRequest, mockAuth } from '../setup';
import type { Env } from '../../src/types/env';

describe('Roadmaps Service', () => {
  const baseUrl = 'http://localhost:8787/api/roadmaps';

  describe('GET /api/roadmaps', () => {
    it('should return empty array for new user', async () => {
      const request = createTestRequest(baseUrl);
      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should require authentication', async () => {
      const request = new Request(baseUrl);
      const response = await fetch(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/roadmaps', () => {
    it('should create a new roadmap', async () => {
      const request = createTestRequest(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          vision: 'Build an AI-powered SaaS platform',
          vibeMode: true,
        }),
      });

      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: expect.any(String),
        userId: 'test-user-id',
        status: 'planning',
        vibeMode: true,
        thriveScore: 0,
      });
      expect(data.data.jsonGraph).toHaveProperty('nodes');
      expect(data.data.jsonGraph).toHaveProperty('edges');
    });

    it('should validate request body', async () => {
      const request = createTestRequest(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          // Missing required 'vision' field
          vibeMode: true,
        }),
      });

      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('PATCH /api/roadmaps/:id', () => {
    let roadmapId: string;

    beforeEach(async () => {
      // Create a roadmap to update
      const createRequest = createTestRequest(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          vision: 'Test roadmap for updates',
        }),
      });
      const createResponse = await fetch(createRequest);
      const createData = await createResponse.json();
      roadmapId = createData.data.id;
    });

    it('should update roadmap graph', async () => {
      const newGraph = {
        nodes: [
          {
            id: 'node-1',
            type: 'custom',
            position: { x: 100, y: 100 },
            data: { label: 'Updated Node', status: 'in_progress' },
          },
        ],
        edges: [],
      };

      const request = createTestRequest(`${baseUrl}/${roadmapId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          jsonGraph: newGraph,
        }),
      });

      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.jsonGraph).toEqual(newGraph);
    });

    it('should not allow updating other users roadmaps', async () => {
      const otherUserAuth = mockAuth('other-user-id');
      const request = createTestRequest(
        `${baseUrl}/${roadmapId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        },
        otherUserAuth
      );

      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/roadmaps/:id', () => {
    let roadmapId: string;

    beforeEach(async () => {
      // Create a roadmap to delete
      const createRequest = createTestRequest(baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          vision: 'Test roadmap for deletion',
        }),
      });
      const createResponse = await fetch(createRequest);
      const createData = await createResponse.json();
      roadmapId = createData.data.id;
    });

    it('should soft delete roadmap', async () => {
      const request = createTestRequest(`${baseUrl}/${roadmapId}`, {
        method: 'DELETE',
      });

      const response = await fetch(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);

      // Verify roadmap is no longer accessible
      const getRequest = createTestRequest(`${baseUrl}/${roadmapId}`);
      const getResponse = await fetch(getRequest);
      expect(getResponse.status).toBe(404);
    });
  });
});