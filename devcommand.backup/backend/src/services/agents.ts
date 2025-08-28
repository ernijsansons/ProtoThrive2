// Agents service for AI automation
import { Hono } from 'hono';
import type { Env } from '../types/env';
import { 
  formatSuccess, 
  formatError, 
  ERROR_CODES, 
  generateId,
  SUBSCRIPTION_FEATURES,
  MODEL_ROUTING,
  retryWithBackoff,
} from '@devcommand/shared';
import { z } from 'zod';

// Request schemas
const TriggerAgentSchema = z.object({
  roadmapId: z.string(),
  taskType: z.enum(['plan', 'code', 'audit', 'deploy', 'enhance']),
  taskData: z.record(z.unknown()).optional(),
});

const AgentStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  output: z.string().optional(),
  error: z.string().optional(),
});

export function createAgentsRouter() {
  const app = new Hono<{ Bindings: Env }>();

  // POST /api/agents/trigger - Trigger an agent task
  app.post('/trigger', async (c) => {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const body = await c.req.json();

    // Validate request
    const validationResult = TriggerAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return c.json(
        formatError(ERROR_CODES.INVALID_INPUT, 'Invalid request data', {
          errors: validationResult.error.errors,
        }),
        400
      );
    }

    const { roadmapId, taskType, taskData } = validationResult.data;

    try {
      // Verify roadmap ownership
      const roadmap = await c.env.DB.prepare(
        'SELECT id, json_graph FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(roadmapId, userId)
        .first();

      if (!roadmap) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found'),
          404
        );
      }

      // Check user subscription limits
      const subscription = await getUserSubscription(c.env.DB, userId);
      const features = SUBSCRIPTION_FEATURES[subscription.tier || 'free'];
      
      if (features.maxAgentTasks !== -1) {
        const taskCount = await getMonthlyTaskCount(c.env.DB, userId);
        if (taskCount >= features.maxAgentTasks) {
          return c.json(
            formatError(ERROR_CODES.QUOTA_EXCEEDED, 'Agent task quota exceeded', {
              limit: features.maxAgentTasks,
              used: taskCount,
            }),
            402
          );
        }
      }

      // Create agent log entry
      const agentLogId = generateId();
      await c.env.DB.prepare(
        `INSERT INTO agent_logs (id, roadmap_id, task_type, status, token_count, timestamp)
         VALUES (?, ?, ?, 'pending', 0, CURRENT_TIMESTAMP)`
      )
        .bind(agentLogId, roadmapId, taskType)
        .run();

      // Trigger n8n workflow asynchronously
      c.executionContext.waitUntil(
        triggerN8NWorkflow(c.env, {
          agentLogId,
          roadmapId,
          taskType,
          taskData: {
            ...taskData,
            roadmapGraph: JSON.parse(roadmap.json_graph as string),
          },
          userId,
        })
      );

      return c.json(
        formatSuccess({
          agentLogId,
          status: 'pending',
          message: 'Agent task triggered successfully',
        }),
        202
      );
    } catch (error) {
      console.error('Agent trigger error:', error);
      throw new Error('Failed to trigger agent');
    }
  });

  // GET /api/agents/status/:logId - Get agent task status
  app.get('/status/:logId', async (c) => {
    const userId = c.get('userId');
    const logId = c.req.param('logId');

    try {
      const log = await c.env.DB.prepare(
        `SELECT al.*, r.user_id 
         FROM agent_logs al
         JOIN roadmaps r ON al.roadmap_id = r.id
         WHERE al.id = ? AND r.user_id = ?`
      )
        .bind(logId, userId)
        .first();

      if (!log) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Agent log not found'),
          404
        );
      }

      return c.json(formatSuccess({
        id: log.id,
        roadmapId: log.roadmap_id,
        taskType: log.task_type,
        status: log.status,
        output: log.output,
        errorMessage: log.error_message,
        tokenCount: log.token_count,
        modelUsed: log.model_used,
        timestamp: log.timestamp,
      }));
    } catch (error) {
      throw new Error('Failed to fetch agent status');
    }
  });

  // GET /api/agents/logs/:roadmapId - Get all agent logs for a roadmap
  app.get('/logs/:roadmapId', async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('roadmapId');

    try {
      // Verify roadmap ownership
      const roadmap = await c.env.DB.prepare(
        'SELECT id FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
      )
        .bind(roadmapId, userId)
        .first();

      if (!roadmap) {
        return c.json(
          formatError(ERROR_CODES.NOT_FOUND, 'Roadmap not found'),
          404
        );
      }

      const { results } = await c.env.DB.prepare(
        `SELECT * FROM agent_logs 
         WHERE roadmap_id = ? AND deleted_at IS NULL 
         ORDER BY timestamp DESC 
         LIMIT 50`
      )
        .bind(roadmapId)
        .all();

      return c.json(formatSuccess(results.map((log: unknown) => ({
        id: log.id,
        roadmapId: log.roadmap_id,
        taskType: log.task_type,
        status: log.status,
        output: log.output,
        errorMessage: log.error_message,
        tokenCount: log.token_count,
        modelUsed: log.model_used,
        timestamp: log.timestamp,
      }))));
    } catch (error) {
      throw new Error('Failed to fetch agent logs');
    }
  });

  // POST /api/agents/hitl/resolve - Resolve HITL task
  app.post('/hitl/resolve', async (c) => {
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const body = await c.req.json();

    // Only hired devs and admins can resolve HITL
    if (userRole !== 'engineer' && userRole !== 'admin') {
      return c.json(
        formatError(ERROR_CODES.UNAUTHORIZED, 'Insufficient permissions'),
        403
      );
    }

    const { taskId, resolution, output } = body;

    try {
      // Update HITL queue
      await c.env.DB.prepare(
        `UPDATE hitl_queue 
         SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, assigned_to = ?
         WHERE id = ? AND status = 'pending'`
      )
        .bind(userId, taskId)
        .run();

      // Update associated agent log
      // TODO: Update agent log with resolution

      return c.json(formatSuccess({ resolved: true }));
    } catch (error) {
      throw new Error('Failed to resolve HITL task');
    }
  });

  return app;
}

// Helper functions
async function getUserSubscription(db: D1Database, userId: string) {
  const subscription = await db.prepare(
    'SELECT tier, status FROM subscriptions WHERE user_id = ? AND status = "active"'
  )
    .bind(userId)
    .first();

  return subscription || { tier: 'free', status: 'active' };
}

async function getMonthlyTaskCount(db: D1Database, userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db.prepare(
    `SELECT COUNT(*) as count 
     FROM agent_logs al
     JOIN roadmaps r ON al.roadmap_id = r.id
     WHERE r.user_id = ? AND al.timestamp >= ?`
  )
    .bind(userId, startOfMonth.toISOString())
    .first();

  return result?.count || 0;
}

async function triggerN8NWorkflow(env: Env, data: unknown) {
  try {
    const response = await retryWithBackoff(async () => {
      return await fetch(env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-Key': env.N8N_API_KEY,
        },
        body: JSON.stringify(data),
      });
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    // Update agent log status to in_progress
    await env.DB.prepare(
      'UPDATE agent_logs SET status = "in_progress" WHERE id = ?'
    )
      .bind(data.agentLogId)
      .run();

  } catch (error) {
    console.error('Failed to trigger n8n workflow:', error);
    
    // Update agent log with error
    await env.DB.prepare(
      `UPDATE agent_logs 
       SET status = 'failed', error_message = ? 
       WHERE id = ?`
    )
      .bind('Failed to trigger workflow', data.agentLogId)
      .run();
  }
}