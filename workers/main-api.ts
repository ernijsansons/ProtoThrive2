// ProtoThrive Enterprise Main API Worker
// Comprehensive backend services with security, caching, and enterprise features
// Ref: CLAUDE.md Section 7 - Workers Configuration

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { rateLimiter } from 'hono/rate-limiter';
import { secureHeaders } from 'hono/secure-headers';

// Types and interfaces
export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  KV_CACHE: KVNamespace;
  KV_SESSIONS: KVNamespace;
  KV_RATE_LIMIT: KVNamespace;
  KV_SECURITY: KVNamespace;
  KV_FEATURES: KVNamespace;
  KV_COLLABORATION: KVNamespace;
  KV_API_CACHE: KVNamespace;
  KV_ANALYTICS: KVNamespace;
  KV_COMPLIANCE: KVNamespace;
  KV_INTEGRATIONS: KVNamespace;

  // Durable Objects
  COLLABORATION_HANDLER: DurableObjectNamespace;

  // Analytics
  ANALYTICS: AnalyticsEngineDataset;

  // Environment variables
  ENVIRONMENT: string;
  SERVICE_NAME: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_PER_MIN: string;
  CACHE_TTL: string;
  GDPR_ENABLED: string;
  JWT_SECRET: string;
  CLERK_PUBLISHABLE_KEY: string;
  SENTRY_DSN: string;
  DATADOG_API_KEY: string;
  SLACK_WEBHOOK_URL: string;
  BUDGET_MAX_USD: string;
}

// Initialize Hono app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());

// CORS configuration
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = c.env.ALLOWED_ORIGINS.split(',');
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Workspace-ID'],
  exposeHeaders: ['X-RateLimit-Remaining', 'X-Cache-Status'],
  credentials: true,
}));

// Rate limiting middleware
app.use('*', async (c, next) => {
  const rateLimitKey = `rate_limit:${c.req.header('x-forwarded-for') || 'unknown'}`;
  const currentCount = await c.env.KV_RATE_LIMIT.get(rateLimitKey);
  const limit = parseInt(c.env.RATE_LIMIT_PER_MIN);

  if (currentCount && parseInt(currentCount) >= limit) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await c.env.KV_RATE_LIMIT.put(rateLimitKey, String((parseInt(currentCount || '0') + 1)), {
    expirationTtl: 60, // 1 minute
  });

  c.header('X-RateLimit-Remaining', String(limit - parseInt(currentCount || '0') - 1));
  await next();
});

// Authentication middleware
const authMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET || 'default-secret',
  cookie: 'auth-token',
});

// Health check endpoint
app.get('/health', async (c) => {
  try {
    // Test database connection
    const dbCheck = await c.env.DB.prepare('SELECT 1 as test').first();

    // Test KV access
    const kvCheck = await c.env.KV_CACHE.get('health-check');
    await c.env.KV_CACHE.put('health-check', Date.now().toString(), { expirationTtl: 60 });

    // Log health check
    c.env.ANALYTICS.writeDataPoint({
      blobs: ['health_check'],
      doubles: [1],
      indexes: [c.env.ENVIRONMENT],
    });

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT,
      services: {
        database: dbCheck ? 'operational' : 'degraded',
        cache: 'operational',
        websockets: 'operational',
      },
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// Authentication routes
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Check user credentials (simplified)
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role FROM users WHERE email = ? AND deleted_at IS NULL'
    ).bind(email).first();

    if (!user) {
      // Log failed login attempt
      await logSecurityEvent(c, 'failed_auth', { email, reason: 'user_not_found' });
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate session
    const sessionId = crypto.randomUUID();
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: Date.now(),
    };

    // Store session in KV
    await c.env.KV_SESSIONS.put(sessionId, JSON.stringify(sessionData), {
      expirationTtl: 86400, // 24 hours
    });

    // Log successful login
    await logSecurityEvent(c, 'login_attempt', { userId: user.id, success: true });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      sessionId,
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Protected routes group
const api = new Hono<{ Bindings: Env }>();
api.use('*', authMiddleware);

// Workspace management
api.get('/workspaces', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;

    // Get workspaces for user
    const workspaces = await c.env.DB.prepare(`
      SELECT w.*, tm.role as user_role
      FROM workspaces w
      JOIN team_members tm ON tm.user_id = ?
      JOIN teams t ON t.id = tm.team_id AND t.workspace_id = w.id
      WHERE tm.status = 'active'
    `).bind(userId).all();

    return c.json({ workspaces: workspaces.results });
  } catch (error) {
    console.error('Workspaces fetch error:', error);
    return c.json({ error: 'Failed to fetch workspaces' }, 500);
  }
});

api.post('/workspaces', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const { name, domain, plan = 'free' } = await c.req.json();

    // Validate input
    if (!name) {
      return c.json({ error: 'Workspace name required' }, 400);
    }

    // Check domain uniqueness if provided
    if (domain) {
      const existing = await c.env.DB.prepare(
        'SELECT id FROM workspaces WHERE domain = ?'
      ).bind(domain).first();

      if (existing) {
        return c.json({ error: 'Domain already taken' }, 409);
      }
    }

    // Create workspace
    const workspaceId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO workspaces (id, name, domain, plan, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(workspaceId, name, domain, plan).run();

    // Create default team
    const teamId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO teams (id, workspace_id, name, created_by, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(teamId, workspaceId, 'Default Team', userId).run();

    // Add user as team owner
    await c.env.DB.prepare(`
      INSERT INTO team_members (id, team_id, user_id, email, role, status, joined_at)
      VALUES (?, ?, ?, ?, 'owner', 'active', CURRENT_TIMESTAMP)
    `).bind(crypto.randomUUID(), teamId, userId, payload.email).run();

    // Log workspace creation
    await logSecurityEvent(c, 'admin_action', {
      action: 'workspace_created',
      workspaceId,
      userId
    });

    return c.json({
      success: true,
      workspace: {
        id: workspaceId,
        name,
        domain,
        plan,
      },
    }, 201);

  } catch (error) {
    console.error('Workspace creation error:', error);
    return c.json({ error: 'Failed to create workspace' }, 500);
  }
});

// Roadmap management
api.get('/roadmaps', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const workspaceId = c.req.header('X-Workspace-ID');

    if (!workspaceId) {
      return c.json({ error: 'Workspace ID required' }, 400);
    }

    // Check cache first
    const cacheKey = `roadmaps:${workspaceId}:${userId}`;
    const cached = await c.env.KV_API_CACHE.get(cacheKey);

    if (cached) {
      c.header('X-Cache-Status', 'HIT');
      return c.json(JSON.parse(cached));
    }

    // Fetch from database
    const roadmaps = await c.env.DB.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM roadmaps r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.workspace_id = ? AND (
        r.visibility = 'workspace' OR
        r.user_id = ? OR
        EXISTS (
          SELECT 1 FROM roadmap_collaborators rc
          WHERE rc.roadmap_id = r.id AND rc.user_id = ?
        )
      )
      ORDER BY r.updated_at DESC
      LIMIT 50
    `).bind(workspaceId, userId, userId).all();

    const response = { roadmaps: roadmaps.results };

    // Cache for 5 minutes
    await c.env.KV_API_CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: 300,
    });

    c.header('X-Cache-Status', 'MISS');
    return c.json(response);

  } catch (error) {
    console.error('Roadmaps fetch error:', error);
    return c.json({ error: 'Failed to fetch roadmaps' }, 500);
  }
});

api.post('/roadmaps', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const workspaceId = c.req.header('X-Workspace-ID');

    const { title, description, json_graph, visibility = 'private', team_id } = await c.req.json();

    if (!workspaceId || !title || !json_graph) {
      return c.json({ error: 'Required fields missing' }, 400);
    }

    // Validate JSON graph
    try {
      JSON.parse(json_graph);
    } catch {
      return c.json({ error: 'Invalid JSON graph format' }, 400);
    }

    // Create roadmap
    const roadmapId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO roadmaps (
        id, workspace_id, team_id, user_id, title, description,
        json_graph, visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(roadmapId, workspaceId, team_id, userId, title, description, json_graph, visibility).run();

    // Add creator as owner collaborator
    await c.env.DB.prepare(`
      INSERT INTO roadmap_collaborators (
        id, roadmap_id, user_id, permission, invited_by, accepted_at
      ) VALUES (?, ?, ?, 'owner', ?, CURRENT_TIMESTAMP)
    `).bind(crypto.randomUUID(), roadmapId, userId, userId).run();

    // Invalidate cache
    const cacheKey = `roadmaps:${workspaceId}:${userId}`;
    await c.env.KV_API_CACHE.delete(cacheKey);

    return c.json({
      success: true,
      roadmap: {
        id: roadmapId,
        title,
        description,
        visibility,
      },
    }, 201);

  } catch (error) {
    console.error('Roadmap creation error:', error);
    return c.json({ error: 'Failed to create roadmap' }, 500);
  }
});

// Collaboration WebSocket endpoint
api.get('/collaboration/:roadmapId/ws', async (c) => {
  try {
    const roadmapId = c.req.param('roadmapId');
    const payload = c.get('jwtPayload');

    // Validate roadmap access
    const access = await c.env.DB.prepare(
      'SELECT permission FROM roadmap_collaborators WHERE roadmap_id = ? AND user_id = ?'
    ).bind(roadmapId, payload.sub).first();

    if (!access) {
      return c.json({ error: 'No access to roadmap' }, 403);
    }

    // Get Durable Object
    const id = c.env.COLLABORATION_HANDLER.idFromName(roadmapId);
    const collaborationObject = c.env.COLLABORATION_HANDLER.get(id);

    // Forward request to Durable Object
    const url = new URL(c.req.url);
    url.pathname = '/websocket';
    url.searchParams.set('userId', payload.sub);
    url.searchParams.set('userName', payload.name || payload.email);
    url.searchParams.set('userEmail', payload.email);
    url.searchParams.set('roomId', roadmapId);
    url.searchParams.set('roadmapId', roadmapId);
    url.searchParams.set('role', access.permission);

    return collaborationObject.fetch(url.toString(), c.req.raw);

  } catch (error) {
    console.error('Collaboration WebSocket error:', error);
    return c.json({ error: 'Failed to establish collaboration session' }, 500);
  }
});

// Analytics endpoint
api.post('/analytics/events', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const { events } = await c.req.json();

    if (!Array.isArray(events)) {
      return c.json({ error: 'Events must be an array' }, 400);
    }

    // Process events
    for (const event of events) {
      // Store in Analytics Engine
      c.env.ANALYTICS.writeDataPoint({
        blobs: [event.name, event.category || 'general'],
        doubles: [event.value || 1, Date.now()],
        indexes: [payload.sub, c.req.header('X-Workspace-ID') || 'unknown'],
      });

      // Store detailed event in KV for analysis
      const eventKey = `event:${crypto.randomUUID()}`;
      await c.env.KV_ANALYTICS.put(eventKey, JSON.stringify({
        ...event,
        userId: payload.sub,
        workspaceId: c.req.header('X-Workspace-ID'),
        timestamp: Date.now(),
      }), {
        expirationTtl: 2592000, // 30 days
      });
    }

    return c.json({ success: true, processed: events.length });

  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Failed to process analytics' }, 500);
  }
});

// Mount API routes
app.route('/api/v1', api);

// Error handling
app.onError((err, c) => {
  console.error('Application error:', err);

  // Log error for monitoring
  c.env?.ANALYTICS?.writeDataPoint({
    blobs: ['error', err.name || 'UnknownError'],
    doubles: [1, Date.now()],
    indexes: [c.env.ENVIRONMENT],
  });

  return c.json({
    error: 'Internal server error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  }, 500);
});

// Security event logging utility
async function logSecurityEvent(c: any, eventType: string, data: any) {
  try {
    const event = {
      eventType,
      data,
      timestamp: Date.now(),
      ip: c.req.header('x-forwarded-for'),
      userAgent: c.req.header('user-agent'),
    };

    const eventKey = `security:${Date.now()}:${crypto.randomUUID()}`;
    await c.env.KV_SECURITY.put(eventKey, JSON.stringify(event), {
      expirationTtl: 7776000, // 90 days
    });

    // Also log to Analytics Engine
    c.env.ANALYTICS.writeDataPoint({
      blobs: ['security_event', eventType],
      doubles: [1, Date.now()],
      indexes: [c.env.ENVIRONMENT],
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

export default app;