/**
 * Enhanced Cloudflare Worker with Service Architecture
 * Ref: CLAUDE.md - Production worker with dependency injection
 */

import {
  ServiceContainer,
  configureProductionServices,
  configureTestServices,
  ServiceLocator,
  SERVICE_TOKENS,
} from './services/container';

import {
  IBudgetService,
  IKillSwitchService,
  IAIExecutor,
  IMonitoringService,
} from './services/interfaces';

import { RoadmapRoutes } from './routes/roadmaps';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Initialize service container
    const container = new ServiceContainer();

    // Configure services based on environment
    if (env.ENVIRONMENT === 'test' || !env.CLAUDE_API_KEY) {
      configureTestServices(container, env);
    } else {
      configureProductionServices(container, env);
    }

    // Initialize service locator
    ServiceLocator.initialize(container);

    // Get core services
    const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);
    const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

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

    const trace = monitoringService.startTrace(`${method.toLowerCase()}_${path.replace(/\//g, '_')}`);

    try {
      // Global kill switch check
      const killStatus = await killSwitchService.checkStatus();
      if (killStatus.active && !path.startsWith('/health')) {
        trace.recordEvent('kill_switch_active', { reason: killStatus.reason });

        await monitoringService.recordMetric({
          name: 'requests.blocked_by_killswitch',
          value: 1,
          type: 'counter',
          tags: { path, method }
        });

        return new Response(JSON.stringify({
          error: 'System temporarily unavailable',
          reason: killStatus.reason,
          retryAfter: killStatus.expiresAt ? Math.ceil((killStatus.expiresAt.getTime() - Date.now()) / 1000) : null,
          code: 'SYSTEM_PAUSED'
        }), {
          status: 503,
          headers: {
            ...corsHeaders,
            'Retry-After': killStatus.expiresAt
              ? Math.ceil((killStatus.expiresAt.getTime() - Date.now()) / 1000).toString()
              : '300'
          }
        });
      }

      // Record request metric
      await monitoringService.recordMetric({
        name: 'requests.count',
        value: 1,
        type: 'counter',
        tags: { path, method, environment: env.ENVIRONMENT || 'production' }
      });

      trace.addMetadata({ path, method, userAgent: request.headers.get('User-Agent') });

      // Health check endpoint (bypass auth)
      if (path === '/health' || path === '/') {
        return await this.handleHealthCheck(container, env, corsHeaders);
      }

      // Authenticate request
      const user = await this.authenticateRequest(request, env);
      if (!user && !path.startsWith('/auth')) {
        return new Response(JSON.stringify({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), {
          status: 401,
          headers: corsHeaders
        });
      }

      trace.addMetadata({ userId: user?.id || 'anonymous' });

      // Route to appropriate handlers
      if (path.startsWith('/api/roadmaps') || path.startsWith('/roadmaps')) {
        const roadmapRoutes = new RoadmapRoutes(container, env);
        return await this.handleRoadmapRoutes(roadmapRoutes, request, path, method, user!, corsHeaders);
      }

      if (path.startsWith('/api/ai') || path.startsWith('/ai')) {
        return await this.handleAIRoutes(container, request, path, method, user!, corsHeaders);
      }

      if (path.startsWith('/api/admin') && user?.role === 'exec') {
        return await this.handleAdminRoutes(container, request, path, method, user, corsHeaders);
      }

      // Default API info
      return new Response(JSON.stringify({
        message: 'ProtoThrive API v2.0 - Service Architecture',
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          budget: 'active',
          killSwitch: killStatus.active ? 'active' : 'inactive',
          aiExecutor: 'active',
          monitoring: 'active'
        },
        endpoints: [
          'GET /health',
          'GET|POST|PUT|DELETE /api/roadmaps',
          'POST /api/ai/execute',
          'GET /api/admin/status'
        ]
      }), {
        headers: corsHeaders,
        status: 200
      });

    } catch (error: any) {
      // Record error
      await monitoringService.recordError(error, {
        endpoint: path,
        metadata: { severity: 'high', method }
      });

      trace.recordEvent('unhandled_error', { message: error.message });

      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });

    } finally {
      trace.end();

      // Record response time
      await monitoringService.recordMetric({
        name: 'response.time',
        value: Date.now() - parseInt(request.headers.get('x-request-start') || '0'),
        type: 'timing',
        tags: { path, method }
      });
    }
  },

  // Health check handler
  async handleHealthCheck(container: ServiceContainer, env: any, corsHeaders: any): Promise<Response> {
    const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);
    const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);

    try {
      const [healthStatus, killStatus] = await Promise.all([
        monitoringService.getHealthStatus(),
        killSwitchService.checkStatus()
      ]);

      const response = {
        status: healthStatus.overall,
        timestamp: Date.now(),
        version: '2.0.0',
        environment: env.ENVIRONMENT || 'production',
        services: healthStatus.services,
        metrics: healthStatus.metrics,
        killSwitch: {
          active: killStatus.active,
          reason: killStatus.reason
        },
        database: {
          connected: !!env.DB,
          d1_configured: !!env.DB,
          kv_configured: !!env.KV
        }
      };

      return new Response(JSON.stringify(response), {
        headers: corsHeaders,
        status: healthStatus.overall === 'healthy' ? 200 : 503
      });

    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        timestamp: Date.now(),
        error: error.toString()
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
  },

  // Authentication handler
  async authenticateRequest(request: Request, env: any): Promise<any> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // In production, validate JWT token
    // For now, return mock user
    return {
      id: 'user-123',
      email: 'user@protothrive.com',
      role: 'vibe_coder'
    };
  },

  // Roadmap routes handler
  async handleRoadmapRoutes(
    roadmapRoutes: RoadmapRoutes,
    request: Request,
    path: string,
    method: string,
    user: any,
    corsHeaders: any
  ): Promise<Response> {
    try {
      const pathParts = path.replace('/api/', '').split('/');
      const roadmapId = pathParts[1];

      let response: Response;

      switch (method) {
        case 'GET':
          if (roadmapId) {
            response = await roadmapRoutes.getRoadmap(roadmapId, user.id);
          } else {
            // List roadmaps - implement if needed
            response = new Response(JSON.stringify({ roadmaps: [] }), {
              headers: corsHeaders,
              status: 200
            });
          }
          break;

        case 'POST':
          response = await roadmapRoutes.createRoadmap(request, user.id);
          break;

        case 'PUT':
          if (!roadmapId) {
            response = new Response(JSON.stringify({
              error: 'Roadmap ID required',
              code: 'MISSING_ID'
            }), {
              status: 400,
              headers: corsHeaders
            });
          } else {
            const updates = await request.json();
            response = await roadmapRoutes.updateRoadmap(roadmapId, user.id, updates);
          }
          break;

        default:
          response = new Response(JSON.stringify({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
          }), {
            status: 405,
            headers: corsHeaders
          });
      }

      // Ensure CORS headers are present
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value as string);
      });

      return new Response(response.body, {
        status: response.status,
        headers
      });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: 'Route handler error',
        message: error.message,
        code: 'ROUTE_ERROR'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // AI routes handler
  async handleAIRoutes(
    container: ServiceContainer,
    request: Request,
    path: string,
    method: string,
    user: any,
    corsHeaders: any
  ): Promise<Response> {
    if (method !== 'POST' || !path.endsWith('/execute')) {
      return new Response(JSON.stringify({
        error: 'Invalid AI endpoint',
        code: 'INVALID_ENDPOINT'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    try {
      const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);
      const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

      const body = await request.json();

      // Check budget
      const estimatedCost = 0.005; // Base estimate
      const budgetCheck = await budgetService.checkBudget(estimatedCost, user.id);

      if (!budgetCheck.allowed) {
        return new Response(JSON.stringify({
          error: 'Budget limit exceeded',
          details: budgetCheck,
          code: 'BUDGET_EXCEEDED'
        }), {
          status: 402,
          headers: corsHeaders
        });
      }

      // Execute AI task
      const result = await aiExecutor.execute({
        type: body.type || 'generation',
        prompt: body.prompt,
        context: body.context
      }, {
        timeout: 30000,
        costLimit: budgetCheck.remainingBudget
      });

      // Record actual cost
      await budgetService.recordCost(result.cost, user.id, {
        taskType: body.type || 'generation',
        model: result.model,
        tokenCount: result.tokenCount
      });

      return new Response(JSON.stringify(result), {
        headers: corsHeaders,
        status: 200
      });

    } catch (error: any) {
      return new Response(JSON.stringify({
        error: 'AI execution failed',
        message: error.message,
        code: 'AI_ERROR'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  },

  // Admin routes handler
  async handleAdminRoutes(
    container: ServiceContainer,
    request: Request,
    path: string,
    method: string,
    user: any,
    corsHeaders: any
  ): Promise<Response> {
    const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);
    const monitoringService = container.resolve<IMonitoringService>(SERVICE_TOKENS.MONITORING);

    if (path.endsWith('/kill-switch')) {
      if (method === 'POST') {
        const { reason, duration } = await request.json();
        await killSwitchService.activate(reason, duration);
        return new Response(JSON.stringify({ status: 'activated' }), {
          headers: corsHeaders
        });
      } else if (method === 'DELETE') {
        await killSwitchService.deactivate();
        return new Response(JSON.stringify({ status: 'deactivated' }), {
          headers: corsHeaders
        });
      }
    }

    if (path.endsWith('/status')) {
      const status = await monitoringService.getHealthStatus();
      return new Response(JSON.stringify(status), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      error: 'Admin endpoint not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
};