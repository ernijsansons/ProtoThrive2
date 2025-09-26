/**
 * ProtoThrive Backend - Enhanced with Enterprise Observability
 * Production-ready API with structured logging, metrics, and health checks
 */

import { Observability } from '../../observability/dist/index.js';

// Initialize observability
const obs = Observability.initialize({
  serviceName: 'protothrive-backend',
  version: '2.0.0',
  enableMetrics: true,
  enableHealthChecks: true
});

export default {
  async fetch(request, env, ctx) {
    // Set environment for observability
    obs.environment = env.ENVIRONMENT || 'development';

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const startTime = Date.now();

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Add database health check
      if (obs.health) {
        obs.health.addCheck('database', async () => {
          try {
            if (!env.DB) {
              return { name: 'database', status: 'fail', message: 'Database not configured' };
            }
            const result = await env.DB.prepare('SELECT 1').first();
            return {
              name: 'database',
              status: result ? 'pass' : 'fail',
              message: result ? 'D1 database is responsive' : 'D1 database is not responding'
            };
          } catch (error) {
            return {
              name: 'database',
              status: 'fail',
              message: error.message
            };
          }
        });

        obs.health.addCheck('kv_store', async () => {
          try {
            if (!env.KV) {
              return { name: 'kv_store', status: 'warn', message: 'KV store not configured' };
            }
            await env.KV.get('health_check');
            return {
              name: 'kv_store',
              status: 'pass',
              message: 'KV store is responsive'
            };
          } catch (error) {
            return {
              name: 'kv_store',
              status: 'fail',
              message: error.message
            };
          }
        });
      }

      // Log request start
      obs.logger.info('Request started', {
        method,
        path,
        query: Object.fromEntries(url.searchParams),
        headers: {
          'user-agent': request.headers.get('user-agent'),
          'x-real-ip': request.headers.get('x-real-ip')
        }
      });

      // Health check endpoints
      if (path === '/health') {
        const health = await obs.health.getHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;

        obs.metrics?.setHealthStatus('overall', health.status === 'healthy');

        return new Response(JSON.stringify(health), {
          headers: corsHeaders,
          status: statusCode
        });
      }

      if (path === '/health/live') {
        return new Response(JSON.stringify({
          status: 'alive',
          timestamp: new Date().toISOString()
        }), {
          headers: corsHeaders,
          status: 200
        });
      }

      if (path === '/health/ready') {
        const health = await obs.health.getHealth();
        const ready = health.status === 'healthy';

        return new Response(JSON.stringify({
          ready,
          timestamp: new Date().toISOString()
        }), {
          headers: corsHeaders,
          status: ready ? 200 : 503
        });
      }

      // Metrics endpoint
      if (path === '/metrics') {
        if (!obs.metrics) {
          return new Response('Metrics not enabled', {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
            status: 503
          });
        }

        const metrics = await obs.metrics.getMetrics();
        return new Response(metrics, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; version=0.0.4'
          },
          status: 200
        });
      }

      // Import and use the original worker logic
      const originalWorker = await import('./worker.js');
      const response = await originalWorker.default.fetch(request, env, ctx);

      // Log request completion
      const duration = Date.now() - startTime;
      obs.logger.info('Request completed', {
        method,
        path,
        statusCode: response.status,
        duration
      });

      // Record metrics
      if (obs.metrics) {
        obs.metrics.recordHttpRequest(method, path, response.status, duration);

        // Record business metrics
        if (path.startsWith('/api/roadmaps') || path.startsWith('/roadmaps')) {
          if (method === 'POST') {
            obs.metrics.recordBusinessOperation('create_roadmap', response.status < 400);
            if (response.status === 201) {
              obs.logger.audit('roadmap_created', 'system', { path, method });
            }
          } else if (method === 'PUT') {
            obs.metrics.recordBusinessOperation('update_roadmap', response.status < 400);
          } else if (method === 'DELETE') {
            obs.metrics.recordBusinessOperation('delete_roadmap', response.status < 400);
            if (response.status === 200) {
              obs.logger.audit('roadmap_deleted', 'system', { path, method });
            }
          }
        }

        if (path.startsWith('/api/snippets') || path.startsWith('/snippets')) {
          if (method === 'POST') {
            obs.metrics.recordBusinessOperation('create_snippet', response.status < 400);
          }
        }

        if (path.startsWith('/auth')) {
          if (path.includes('login')) {
            obs.metrics.recordBusinessOperation('user_login', response.status < 400);
            if (response.status === 200) {
              obs.logger.audit('user_login', 'system', { path });
            }
          }
        }
      }

      return response;

    } catch (error) {
      const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Log error with full context
      obs.logger.error('Request failed', error, {
        errorId,
        method,
        path,
        url: request.url,
        headers: {
          'user-agent': request.headers.get('user-agent')
        }
      });

      // Record error metrics
      if (obs.metrics) {
        const errorType = error.name || 'UnknownError';
        const errorCode = error.code || 'UNKNOWN';
        const severity = error.statusCode >= 500 ? 'critical' :
                        error.statusCode >= 400 ? 'high' : 'medium';

        obs.metrics.recordError(errorType, errorCode, severity);
        obs.metrics.recordHttpRequest(method, path, error.statusCode || 500, Date.now() - startTime);
      }

      // Return error response
      const statusCode = error.statusCode || 500;
      const userMessage = env.ENVIRONMENT === 'production'
        ? 'An error occurred processing your request'
        : error.message;

      return new Response(JSON.stringify({
        error: {
          id: errorId,
          message: userMessage,
          code: error.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        },
        ...(env.ENVIRONMENT !== 'production' && {
          debug: {
            stack: error.stack,
            path,
            method
          }
        })
      }), {
        headers: corsHeaders,
        status: statusCode
      });
    }
  }
};