// Main entry point for DevCommand API Worker
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import type { Env } from './types/env';

// Import routers
import { createGraphQLRouter } from './services/graphql';
import { createRoadmapsRouter } from './services/roadmaps';
import { createWebhooksRouter } from './services/webhooks';
import { createAgentsRouter } from './services/agents';
import { createBillingRouter } from './services/billing';
import { createWebSocketRouter } from './services/websocket';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', compress());
app.use('*', secureHeaders());

// CORS configuration
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://devcommand.com',
        'https://app.devcommand.com',
      ];
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// Apply authentication middleware to protected routes
app.use('/api/*', authMiddleware);
app.use('/graphql', authMiddleware);

// Apply rate limiting
app.use('*', rateLimitMiddleware);

// Mount routers
app.route('/graphql', createGraphQLRouter());
app.route('/api/roadmaps', createRoadmapsRouter());
app.route('/api/webhooks', createWebhooksRouter());
app.route('/api/agents', createAgentsRouter());
app.route('/api/billing', createBillingRouter());
app.route('/api/ws', createWebSocketRouter());

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    },
    404,
  );
});

// Global error handler
app.onError(errorHandler);

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};

// Export Durable Objects
export { RoadmapRoom } from './durable-objects/RoadmapRoom';
export { WebSocketManager } from './workers/WebSocketManager';
export { RateLimiter } from './workers/RateLimiter';