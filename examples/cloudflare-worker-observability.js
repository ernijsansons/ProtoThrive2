/**
 * ProtoThrive Cloudflare Worker Observability Example
 * Demonstrates enterprise observability integration in Cloudflare Workers
 *
 * Ref: CLAUDE.md Section 1 - Backend Architecture & Data Foundation
 */

import { Hono } from 'hono';
import { Observability } from '../observability/dist/index.js';

// Initialize observability for Cloudflare Worker
const observability = Observability.initialize({
  serviceName: 'protothrive-worker',
  version: '2.0.0',
  environment: 'production', // or process.env.ENVIRONMENT
  instanceId: 'cloudflare-worker'
});

const app = new Hono();

// Apply observability middleware
app.use('*', observability.honoRequestLogger());

// Health check endpoint with comprehensive checks
app.get('/health', async (c) => {
  const startTime = Date.now();

  try {
    // Mock health checks for Cloudflare Worker environment
    const healthChecks = {
      database: await checkDatabaseHealth(c.env),
      kv: await checkKVHealth(c.env),
      ai: await checkAIServiceHealth(),
      memory: checkMemoryUsage(),
      uptime: Date.now() - startTime
    };

    const allHealthy = Object.values(healthChecks).every(check =>
      check.status === 'healthy' || check.status === 'pass'
    );

    const responseData = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: 'production',
      checks: healthChecks,
      uptime: Date.now() - startTime
    };

    observability.logger.info('Health check completed', {
      status: responseData.status,
      checksCount: Object.keys(healthChecks).length,
      duration: Date.now() - startTime
    });

    return c.json(responseData, allHealthy ? 200 : 503);

  } catch (error) {
    observability.logger.error('Health check failed', error, {
      duration: Date.now() - startTime
    });

    return c.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// Metrics endpoint for Prometheus scraping
app.get('/metrics', async (c) => {
  try {
    if (!observability.metrics) {
      return c.text('Metrics not enabled', 503);
    }

    const metrics = await observability.metrics.getMetrics();
    c.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');

    observability.logger.info('Metrics exported', {
      metricsSize: metrics.length,
      contentType: 'prometheus'
    });

    return c.text(metrics);

  } catch (error) {
    observability.logger.error('Metrics export failed', error);
    return c.text('Metrics export failed', 500);
  }
});

// Roadmap API endpoints with observability
app.get('/api/roadmaps/:id', async (c) => {
  const roadmapId = c.req.param('id');
  const startTime = Date.now();

  try {
    observability.logger.info('Roadmap fetch started', {
      roadmapId,
      userAgent: c.req.header('User-Agent'),
      clientIP: c.req.header('CF-Connecting-IP')
    });

    // Mock database query
    const roadmap = await queryRoadmap(c.env.DB, roadmapId);

    if (!roadmap) {
      observability.logger.warning('Roadmap not found', {
        roadmapId,
        duration: Date.now() - startTime
      });

      return c.json({ error: 'Roadmap not found' }, 404);
    }

    // Record business metrics
    if (observability.metrics) {
      observability.metrics.recordBusinessMetric('roadmaps_fetched', 1, {
        user_type: 'authenticated',
        cache_hit: 'false'
      });
    }

    observability.logger.info('Roadmap fetch completed', {
      roadmapId,
      duration: Date.now() - startTime,
      nodesCount: JSON.parse(roadmap.json_graph || '{}').nodes?.length || 0
    });

    return c.json(roadmap);

  } catch (error) {
    observability.logger.error('Roadmap fetch failed', error, {
      roadmapId,
      duration: Date.now() - startTime
    });

    if (observability.metrics) {
      observability.metrics.recordError('DatabaseError', 'DB_QUERY_FAILED', 'high');
    }

    return c.json({ error: 'Internal server error' }, 500);
  }
});

// AI processing endpoint with comprehensive logging
app.post('/api/roadmaps/:id/ai-process', async (c) => {
  const roadmapId = c.req.param('id');
  const startTime = Date.now();

  try {
    const requestBody = await c.req.json();

    observability.logger.info('AI processing started', {
      roadmapId,
      requestType: requestBody.type || 'unknown',
      priority: requestBody.priority || 'normal'
    });

    // Mock AI processing
    const aiResult = await processWithAI(requestBody, {
      roadmapId,
      logger: observability.logger,
      metrics: observability.metrics
    });

    // Record AI usage metrics
    if (observability.metrics) {
      observability.metrics.recordAIUsage(
        aiResult.model,
        aiResult.taskType,
        aiResult.promptTokens,
        aiResult.completionTokens,
        aiResult.duration,
        aiResult.cost,
        aiResult.success
      );
    }

    // Audit log for AI usage
    observability.logger.audit('ai_processing', requestBody.userId || 'anonymous', {
      roadmapId,
      model: aiResult.model,
      taskType: aiResult.taskType,
      tokensUsed: aiResult.promptTokens + aiResult.completionTokens,
      cost: aiResult.cost,
      success: aiResult.success
    });

    observability.logger.info('AI processing completed', {
      roadmapId,
      model: aiResult.model,
      duration: Date.now() - startTime,
      success: aiResult.success
    });

    return c.json({
      success: aiResult.success,
      result: aiResult.output,
      metadata: {
        model: aiResult.model,
        tokensUsed: aiResult.promptTokens + aiResult.completionTokens,
        duration: Date.now() - startTime
      }
    });

  } catch (error) {
    observability.logger.error('AI processing failed', error, {
      roadmapId,
      duration: Date.now() - startTime
    });

    if (observability.metrics) {
      observability.metrics.recordError('AIProcessingError', 'AI_TIMEOUT', 'high');
    }

    return c.json({ error: 'AI processing failed' }, 500);
  }
});

// User operations with audit logging
app.post('/api/users/:id/actions', async (c) => {
  const userId = c.req.param('id');
  const action = await c.req.json();

  try {
    observability.logger.info('User action initiated', {
      userId,
      actionType: action.type,
      clientIP: c.req.header('CF-Connecting-IP')
    });

    // Process user action
    const result = await processUserAction(userId, action, c.env);

    // Audit log for compliance
    observability.logger.audit('user_action', userId, {
      actionType: action.type,
      resourceId: action.resourceId,
      success: result.success,
      clientIP: c.req.header('CF-Connecting-IP'),
      userAgent: c.req.header('User-Agent')
    });

    // Record business metrics
    if (observability.metrics) {
      observability.metrics.recordBusinessMetric('user_actions', 1, {
        action_type: action.type,
        success: result.success.toString()
      });
    }

    return c.json(result);

  } catch (error) {
    observability.logger.error('User action failed', error, {
      userId,
      actionType: action.type
    });

    return c.json({ error: 'Action failed' }, 500);
  }
});

// Error handling middleware
app.onError((err, c) => {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  observability.logger.error('Unhandled application error', err, {
    errorId,
    method: c.req.method,
    path: c.req.url,
    userAgent: c.req.header('User-Agent'),
    clientIP: c.req.header('CF-Connecting-IP')
  });

  if (observability.metrics) {
    observability.metrics.recordError(
      err.name || 'UnknownError',
      err.code || 'UNHANDLED',
      'critical'
    );
  }

  return c.json({
    error: {
      id: errorId,
      message: 'An error occurred processing your request',
      code: err.code || 'INTERNAL_ERROR'
    }
  }, err.status || 500);
});

// Helper functions for Cloudflare Worker environment

async function checkDatabaseHealth(db) {
  try {
    const result = await db.prepare('SELECT 1 as health').first();
    return {
      status: result ? 'pass' : 'fail',
      message: result ? 'Database connection healthy' : 'Database connection failed',
      responseTime: 25 // Mock response time
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database error: ${error.message}`,
      responseTime: null
    };
  }
}

async function checkKVHealth(kv) {
  try {
    await kv.put('health_check', 'ok', { expirationTtl: 60 });
    const result = await kv.get('health_check');
    return {
      status: result === 'ok' ? 'pass' : 'fail',
      message: result === 'ok' ? 'KV store healthy' : 'KV store failed',
      responseTime: 15 // Mock response time
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `KV error: ${error.message}`,
      responseTime: null
    };
  }
}

async function checkAIServiceHealth() {
  // Mock AI service health check
  const isHealthy = Math.random() > 0.05; // 95% uptime
  return {
    status: isHealthy ? 'pass' : 'warn',
    message: isHealthy ? 'AI services operational' : 'AI services degraded',
    responseTime: isHealthy ? 45 : 120
  };
}

function checkMemoryUsage() {
  // Mock memory usage for Cloudflare Worker
  const usage = Math.random() * 100;
  return {
    status: usage < 80 ? 'pass' : 'warn',
    message: `Memory usage: ${usage.toFixed(1)}%`,
    details: {
      used: `${(usage * 128 / 100).toFixed(1)}MB`,
      limit: '128MB',
      percentage: usage
    }
  };
}

async function queryRoadmap(db, id) {
  try {
    const query = `
      SELECT id, user_id, json_graph, status, vibe_mode, thrive_score,
             created_at, updated_at
      FROM roadmaps
      WHERE id = ?
    `;
    return await db.prepare(query).bind(id).first();
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
}

async function processWithAI(requestBody, context) {
  const { roadmapId, logger, metrics } = context;
  const startTime = Date.now();

  try {
    // Mock AI processing
    const model = 'gpt-4';
    const taskType = requestBody.type || 'analysis';
    const promptTokens = Math.floor(Math.random() * 200) + 100;
    const completionTokens = Math.floor(Math.random() * 400) + 200;
    const duration = Date.now() - startTime;
    const cost = (promptTokens + completionTokens) * 0.00003; // Mock cost calculation

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    logger.info('AI inference completed', {
      roadmapId,
      model,
      taskType,
      promptTokens,
      completionTokens,
      duration,
      cost
    });

    return {
      model,
      taskType,
      promptTokens,
      completionTokens,
      duration,
      cost,
      success: true,
      output: {
        analysis: `AI analysis for roadmap ${roadmapId}`,
        suggestions: ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'],
        confidence: 0.92
      }
    };

  } catch (error) {
    logger.error('AI processing error', error, { roadmapId });
    throw error;
  }
}

async function processUserAction(userId, action, env) {
  // Mock user action processing
  const success = Math.random() > 0.1; // 90% success rate

  if (success) {
    return {
      success: true,
      message: `Action ${action.type} completed successfully`,
      actionId: `action-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  } else {
    throw new Error(`Action ${action.type} failed`);
  }
}

// Export the configured Hono app
export default app;

// Example of how to use this in your Cloudflare Worker
/*
export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  }
};
*/