import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  DB: D1Database;
  KV_STORE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

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

export default app;