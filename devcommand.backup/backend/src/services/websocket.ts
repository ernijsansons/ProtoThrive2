// WebSocket service for real-time collaboration
import { Hono } from 'hono';
import type { Env } from '../types/env';
import { formatError, ERROR_CODES } from '@devcommand/shared';
import { verifyToken } from '@clerk/backend';

export function createWebSocketRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // WebSocket upgrade endpoint
  app.get('/:roadmapId', async (c) => {
    const roadmapId = c.req.param('roadmapId');
    const upgradeHeader = c.req.header('Upgrade');
    
    // Check if this is a WebSocket upgrade request
    if (upgradeHeader !== 'websocket') {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Expected WebSocket upgrade request'),
        400
      );
    }

    // Extract auth token from query params or headers
    const token = c.req.query('token') || c.req.header('Authorization')?.substring(7);
    
    if (!token) {
      return c.json(
        formatError(ERROR_CODES.UNAUTHORIZED, 'Missing authentication token'),
        401
      );
    }

    try {
      // Verify token with Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: c.env.CLERK_SECRET_KEY,
      });

      if (!verifiedToken) {
        throw new Error('Invalid token');
      }

      const userId = verifiedToken.sub;
      const userEmail = verifiedToken.email || '';

      // Verify user has access to this roadmap
      const roadmap = await c.env.DB.prepare(
        'SELECT id FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(roadmapId, userId)
        .first();

      if (!roadmap) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found or access denied'),
          404
        );
      }

      // Get or create Durable Object for this roadmap
      const roomId = c.env.ROADMAP_ROOMS.idFromName(roadmapId);
      const roomStub = c.env.ROADMAP_ROOMS.get(roomId);

      // Forward the WebSocket upgrade request to the Durable Object
      const url = new URL(c.req.url);
      url.pathname = '/websocket';
      url.searchParams.set('userId', userId);
      url.searchParams.set('userEmail', userEmail);
      url.searchParams.set('roadmapId', roadmapId);

      // Pass the request to the Durable Object
      return roomStub.fetch(new Request(url, c.req.raw));
    } catch (error) {
      console.error('WebSocket auth error:', error);
      return c.json(
        formatError(ERROR_CODES.UNAUTHORIZED, 'Authentication failed'),
        401
      );
    }
  });

  // Get room stats (for debugging/monitoring)
  app.get('/:roadmapId/stats', async (c) => {
    const roadmapId = c.req.param('roadmapId');
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    // Only allow roadmap owner or admin to view stats
    if (userRole !== 'admin') {
      const roadmap = await c.env.DB.prepare(
        'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?'
      )
        .bind(roadmapId, userId)
        .first();

      if (!roadmap) {
        return c.json(
          formatError(ERROR_CODES.FORBIDDEN, 'Access denied'),
          403
        );
      }
    }

    try {
      // Get Durable Object stats
      const roomId = c.env.ROADMAP_ROOMS.idFromName(roadmapId);
      const roomStub = c.env.ROADMAP_ROOMS.get(roomId);
      
      const response = await roomStub.fetch(new Request('http://internal/stats'));
      const stats = await response.json();

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Failed to get room stats:', error);
      return c.json(
        formatError(ERROR_CODES.INTERNAL_ERROR, 'Failed to get room stats'),
        500
      );
    }
  });

  return app;
}