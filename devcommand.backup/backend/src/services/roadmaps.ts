// Roadmaps service for CRUD operations
import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types/env';
import {
  CreateRoadmapRequestSchema,
  UpdateRoadmapRequestSchema,
  RoadmapSchema,
  formatSuccess,
  formatError,
  ERROR_CODES,
  generateId,
  DEFAULTS,
} from '@devcommand/shared';

export function createRoadmapsRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // GET /api/roadmaps - List user's roadmaps
  app.get('/', async (c) => {
    const userId = c.get('userId');
    
    try {
      const { results } = await c.env.DB.prepare(
        `SELECT id, user_id as userId, json_graph as jsonGraph, status, vibe_mode as vibeMode, 
         thrive_score as thriveScore, created_at as createdAt, updated_at as updatedAt
         FROM roadmaps 
         WHERE user_id = ? AND deleted_at IS NULL 
         ORDER BY updated_at DESC`
      )
        .bind(userId)
        .all();

      // Parse JSON graphs
      const roadmaps = results.map((r: any) => ({
        ...r,
        jsonGraph: JSON.parse(r.jsonGraph),
        vibeMode: Boolean(r.vibeMode),
      }));

      return c.json(formatSuccess(roadmaps));
    } catch (error) {
      throw new Error('Failed to fetch roadmaps');
    }
  });

  // GET /api/roadmaps/:id - Get specific roadmap
  app.get('/:id', async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');

    try {
      const roadmap = await c.env.DB.prepare(
        `SELECT id, user_id as userId, json_graph as jsonGraph, status, vibe_mode as vibeMode,
         thrive_score as thriveScore, created_at as createdAt, updated_at as updatedAt
         FROM roadmaps 
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
        .bind(roadmapId, userId)
        .first();

      if (!roadmap) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found'),
          404
        );
      }

      // Parse JSON graph
      const parsed = {
        ...roadmap,
        jsonGraph: JSON.parse(roadmap.jsonGraph as string),
        vibeMode: Boolean(roadmap.vibeMode),
      };

      return c.json(formatSuccess(parsed));
    } catch (error) {
      throw new Error('Failed to fetch roadmap');
    }
  });

  // POST /api/roadmaps - Create new roadmap
  app.post('/', async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Validate request
    const validationResult = CreateRoadmapRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Invalid request data', {
          errors: validationResult.error.errors,
        }),
        400
      );
    }

    const { vision, vibeMode = false } = validationResult.data;

    try {
      // Generate initial graph from vision using AI
      // For now, create a simple skeleton
      const initialGraph = {
        nodes: [
          {
            id: 'start',
            type: 'custom',
            position: { x: 250, y: 50 },
            data: {
              label: 'Project Start',
              status: 'gray',
            },
          },
          {
            id: 'planning',
            type: 'custom',
            position: { x: 250, y: 150 },
            data: {
              label: 'Planning',
              status: 'gray',
            },
          },
        ],
        edges: [
          {
            id: 'e-start-planning',
            source: 'start',
            target: 'planning',
            animated: true,
          },
        ],
      };

      const roadmapId = generateId();

      await c.env.DB.prepare(
        `INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(
          roadmapId,
          userId,
          JSON.stringify(initialGraph),
          DEFAULTS.ROADMAP_STATUS,
          vibeMode ? 1 : 0,
          DEFAULTS.THRIVE_SCORE
        )
        .run();

      const newRoadmap = {
        id: roadmapId,
        userId,
        jsonGraph: initialGraph,
        status: DEFAULTS.ROADMAP_STATUS,
        vibeMode,
        thriveScore: DEFAULTS.THRIVE_SCORE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // TODO: Trigger AI agent to enhance the graph based on vision

      return c.json(formatSuccess(newRoadmap), 201);
    } catch (error) {
      throw new Error('Failed to create roadmap');
    }
  });

  // PATCH /api/roadmaps/:id - Update roadmap
  app.patch('/:id', async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');
    const body = await c.req.json();

    // Validate request
    const validationResult = UpdateRoadmapRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Invalid request data', {
          errors: validationResult.error.errors,
        }),
        400
      );
    }

    const { jsonGraph, status, vibeMode } = validationResult.data;

    try {
      // Check if roadmap exists and belongs to user
      const existing = await c.env.DB.prepare(
        'SELECT id FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(roadmapId, userId)
        .first();

      if (!existing) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found'),
          404
        );
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (jsonGraph !== undefined) {
        updates.push('json_graph = ?');
        values.push(JSON.stringify(jsonGraph));
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (vibeMode !== undefined) {
        updates.push('vibe_mode = ?');
        values.push(vibeMode ? 1 : 0);
      }

      if (updates.length === 0) {
        return c.json(
          formatError(ERROR_CODES.INVALID_INPUT, 'No valid updates provided'),
          400
        );
      }

      // Add ID and user ID to values for WHERE clause
      values.push(roadmapId, userId);

      await c.env.DB.prepare(
        `UPDATE roadmaps SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
        .bind(...values)
        .run();

      // Fetch updated roadmap
      const updated = await c.env.DB.prepare(
        `SELECT id, user_id as userId, json_graph as jsonGraph, status, vibe_mode as vibeMode,
         thrive_score as thriveScore, created_at as createdAt, updated_at as updatedAt
         FROM roadmaps 
         WHERE id = ? AND user_id = ?`
      )
        .bind(roadmapId, userId)
        .first();

      const parsed = {
        ...updated,
        jsonGraph: JSON.parse(updated!.jsonGraph as string),
        vibeMode: Boolean(updated!.vibeMode),
      };

      // Notify connected clients via WebSocket
      // TODO: Implement WebSocket notification

      return c.json(formatSuccess(parsed));
    } catch (error) {
      throw new Error('Failed to update roadmap');
    }
  });

  // DELETE /api/roadmaps/:id - Soft delete roadmap
  app.delete('/:id', async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');

    try {
      const result = await c.env.DB.prepare(
        `UPDATE roadmaps SET deleted_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
      )
        .bind(roadmapId, userId)
        .run();

      if (!result.meta.changes) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found'),
          404
        );
      }

      return c.json(formatSuccess({ deleted: true }));
    } catch (error) {
      throw new Error('Failed to delete roadmap');
    }
  });

  return app;
}