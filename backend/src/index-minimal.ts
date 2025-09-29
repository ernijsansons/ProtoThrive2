import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  DB: D1Database;
  KV_STORE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Simple rate limiting (in-memory for demonstration)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
app.use('*', async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  const current = rateLimit.get(clientIP);

  if (!current || now > current.resetTime) {
    rateLimit.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    current.count++;
    if (current.count > maxRequests) {
      return c.json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Limit: ${maxRequests} requests per minute.`,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      }, 429);
    }
  }

  await next();
});

// Security headers middleware
app.use('*', async (c, next) => {
  await next();

  // Add comprehensive security headers
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// Enable CORS
app.use('/*', cors({
  origin: ['http://localhost:3000', 'https://protothrive-frontend.pages.dev', 'https://876017e2.protothrive-frontend.pages.dev'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API endpoint
app.get('/api/status', (c) => {
  return c.json({
    message: 'ProtoThrive Backend is running on Cloudflare Workers',
    environment: 'production',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'ProtoThrive Backend API',
    version: '1.0.0',
    endpoints: ['/health', '/api/status', '/api/roadmaps', '/api/snippets']
  });
});

// Get roadmaps endpoint
app.get('/api/roadmaps', async (c) => {
  try {
    const db = c.env.DB;
    const result = await db
      .prepare('SELECT * FROM roadmaps ORDER BY created_at DESC LIMIT 10')
      .all();

    return c.json({
      data: result.results || [],
      meta: {
        total: result.results?.length || 0
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      data: [],
      meta: { total: 0 },
      message: 'Database not yet configured'
    });
  }
});

// Create roadmap endpoint
app.post('/api/roadmaps', async (c) => {
  try {
    const body = await c.req.json();
    const db = c.env.DB;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db
      .prepare(`
        INSERT INTO roadmaps (id, user_id, name, description, nodes, edges, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        'demo-user',
        body.name || 'Untitled',
        body.description || '',
        JSON.stringify(body.nodes || []),
        JSON.stringify(body.edges || []),
        now,
        now
      )
      .run();

    return c.json({
      id,
      ...body,
      created_at: now,
      updated_at: now
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to create roadmap' }, 500);
  }
});

// Get snippets endpoint
app.get('/api/snippets', async (c) => {
  try {
    const db = c.env.DB;
    const result = await db
      .prepare('SELECT * FROM snippets ORDER BY created_at DESC LIMIT 10')
      .all();

    return c.json({
      data: result.results || [],
      meta: {
        total: result.results?.length || 0
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({
      data: [],
      meta: { total: 0 },
      message: 'Database not yet configured'
    });
  }
});

// Handle 404 errors
app.notFound((c) => {
  return c.json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND_404',
    message: `The endpoint ${c.req.method} ${c.req.path} was not found`,
    available_endpoints: [
      'GET /health',
      'GET /api/status',
      'GET /',
      'GET /api/roadmaps',
      'POST /api/roadmaps',
      'GET /api/snippets'
    ]
  }, 404);
});

// Handle errors
app.onError((err, c) => {
  console.error('Application error:', err);

  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR_500',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  }, 500);
});

export default app;