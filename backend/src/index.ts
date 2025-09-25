// Ref: CLAUDE.md Phase 1 - Full Backend with Database Integration
// TypeScript implementation for Cloudflare Workers with comprehensive APIs

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDatabase, Database, calculateThriveScore } from '../utils/db';
import { 
  validateRoadmapBody, 
  validateSnippetBody, 
  validateUUID,
  SecurityValidationError 
} from '../utils/validation';

// Define context variables interface
type Bindings = {
  DB: any;
  KV: any;
  ENVIRONMENT?: string;
}

type Variables = {
  user: { id: string; role: string };
  db: Database;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5000', 'https://protothrive.com'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
}));

// Mock auth middleware (in production, use proper JWT validation)
app.use('/api/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development, use mock auth
    c.set('user', { id: 'uuid-thermo-1', role: 'vibe_coder' });
  } else {
    // In production, validate JWT here
    const token = authHeader.replace('Bearer ', '');
    c.set('user', { id: token, role: 'vibe_coder' }); // Mock validation
  }
  
  console.log('Thermonuclear Auth: User authenticated');
  await next();
});

// Initialize database
let db: Database;

app.use('*', async (c, next) => {
  if (!db) {
    db = createDatabase(c.env);
    await db.initialize();
  }
  c.set('db', db);
  await next();
});

// Health Check Endpoint
app.get('/health', async (c) => {
  const database = c.get('db') as Database;
  const healthCheck = await database.healthCheck();
  
  return c.json({
    status: healthCheck.status === 'healthy' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'protothrive-backend-thermo',
    version: '2.0.0',
    database: healthCheck,
    environment: c.env?.ENVIRONMENT || 'development'
  });
});

// API Routes

// GET /api/roadmaps/:id - Get specific roadmap
app.get('/api/roadmaps/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const database = c.get('db') as Database;

    if (!validateUUID(id)) {
      return c.json({
        error: 'Invalid roadmap ID format',
        code: 'VAL-400'
      }, 400);
    }

    const roadmap = await database.queryRoadmap(id, user.id);

    if (!roadmap) {
      return c.json({
        error: 'Roadmap not found',
        code: 'GRAPH-404'
      }, 404);
    }

    // Parse JSON graph
    let jsonGraph;
    try {
      jsonGraph = JSON.parse(roadmap.json_graph);
    } catch {
      jsonGraph = { nodes: [], edges: [] };
    }

    return c.json({
      id: roadmap.id,
      user_id: roadmap.user_id,
      json_graph: jsonGraph,
      status: roadmap.status,
      vibe_mode: roadmap.vibe_mode,
      thrive_score: roadmap.thrive_score,
      created_at: roadmap.created_at,
      updated_at: roadmap.updated_at
    });

  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/roadmaps - List user roadmaps with pagination
app.get('/api/roadmaps', async (c) => {
  try {
    const user = c.get('user');
    const database = c.get('db') as Database;
    
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = Math.max(parseInt(c.req.query('offset') || '0'), 0);

    const roadmaps = await database.queryUserRoadmaps(user.id, limit, offset);

    // Parse JSON graphs and calculate thrive scores
    const processedRoadmaps = roadmaps.map(roadmap => {
      let jsonGraph;
      try {
        jsonGraph = JSON.parse(roadmap.json_graph);
      } catch {
        jsonGraph = { nodes: [], edges: [] };
      }

      return {
        id: roadmap.id,
        user_id: roadmap.user_id,
        json_graph: jsonGraph,
        status: roadmap.status,
        vibe_mode: roadmap.vibe_mode,
        thrive_score: roadmap.thrive_score,
        created_at: roadmap.created_at,
        updated_at: roadmap.updated_at
      };
    });

    return c.json({
      roadmaps: processedRoadmaps,
      total: processedRoadmaps.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error listing roadmaps:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/roadmaps - Create new roadmap
app.post('/api/roadmaps', async (c) => {
  try {
    const user = c.get('user');
    const database = c.get('db') as Database;
    const body = await c.req.json();

    // Validate request body
    const validatedData = validateRoadmapBody(body);

    const roadmapData = {
      json_graph: validatedData.json_graph,
      vibe_mode: validatedData.vibe_mode,
      status: validatedData.status,
      thrive_score: 0.0
    };

    const result = await database.insertRoadmap(user.id, roadmapData);

    console.log(`Thermonuclear Success: Roadmap ${result.id} created`);

    return c.json({
      id: result.id,
      message: 'Roadmap created successfully',
      ...roadmapData
    }, 201);

  } catch (error) {
    console.error('Error creating roadmap:', error);

    if (error instanceof SecurityValidationError) {
      return c.json({
        error: error.message,
        code: 'VAL-400'
      }, 400);
    }

    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// PUT /api/roadmaps/:id - Update roadmap
app.put('/api/roadmaps/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const database = c.get('db') as Database;
    const body = await c.req.json();

    if (!validateUUID(id)) {
      return c.json({
        error: 'Invalid roadmap ID format',
        code: 'VAL-400'
      }, 400);
    }

    // Validate request body (allow partial updates)
    const updates: any = {};
    
    if (body.status !== undefined) {
      updates.status = body.status;
    }
    
    if (body.json_graph !== undefined) {
      updates.json_graph = body.json_graph;
    }
    
    if (body.thrive_score !== undefined) {
      updates.thrive_score = body.thrive_score;
    }
    
    if (body.vibe_mode !== undefined) {
      updates.vibe_mode = body.vibe_mode;
    }

    const success = await database.updateRoadmapStatus(id, user.id, updates);

    if (!success) {
      return c.json({
        error: 'Roadmap not found or no changes made',
        code: 'GRAPH-404'
      }, 404);
    }

    console.log(`Thermonuclear Success: Roadmap ${id} updated`);

    return c.json({
      message: 'Roadmap updated successfully',
      id
    });

  } catch (error) {
    console.error('Error updating roadmap:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/roadmaps/:id - Soft delete roadmap
app.delete('/api/roadmaps/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const database = c.get('db') as Database;

    if (!validateUUID(id)) {
      return c.json({
        error: 'Invalid roadmap ID format',
        code: 'VAL-400'
      }, 400);
    }

    const success = await database.softDeleteRoadmap(id, user.id);

    if (!success) {
      return c.json({
        error: 'Roadmap not found',
        code: 'GRAPH-404'
      }, 404);
    }

    console.log(`Thermonuclear Success: Roadmap ${id} deleted`);

    return c.json({
      message: 'Roadmap deleted successfully',
      id
    });

  } catch (error) {
    console.error('Error deleting roadmap:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/snippets - Get code snippets
app.get('/api/snippets', async (c) => {
  try {
    const database = c.get('db') as Database;
    const category = c.req.query('category');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    const snippets = await database.querySnippets(category, limit);

    return c.json({
      snippets,
      total: snippets.length,
      category: category || 'all',
      limit
    });

  } catch (error) {
    console.error('Error fetching snippets:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/snippets - Create new snippet
app.post('/api/snippets', async (c) => {
  try {
    const database = c.get('db') as Database;
    const body = await c.req.json();

    // Validate request body
    const validatedData = validateSnippetBody(body);

    const result = await database.insertSnippet(validatedData);

    console.log(`Thermonuclear Success: Snippet ${result.id} created`);

    return c.json({
      id: result.id,
      message: 'Snippet created successfully',
      ...validatedData
    }, 201);

  } catch (error) {
    console.error('Error creating snippet:', error);

    if (error instanceof SecurityValidationError) {
      return c.json({
        error: error.message,
        code: 'VAL-400'
      }, 400);
    }

    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/agent-logs/:roadmapId - Get agent logs for roadmap
app.get('/api/agent-logs/:roadmapId', async (c) => {
  try {
    const roadmapId = c.req.param('roadmapId');
    const database = c.get('db') as Database;
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    if (!validateUUID(roadmapId)) {
      return c.json({
        error: 'Invalid roadmap ID format',
        code: 'VAL-400'
      }, 400);
    }

    const logs = await database.queryAgentLogs(roadmapId, limit);
    const thriveScore = calculateThriveScore(logs);

    return c.json({
      logs,
      roadmap_id: roadmapId,
      thrive_score: thriveScore,
      total: logs.length,
      limit
    });

  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return c.json({
      error: 'Database error',
      code: 'ERR-DB',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Legacy compatibility routes (for existing frontend)
app.get('/roadmaps/:id', async (c) => {
  const id = c.req.param('id');
  return c.json({
    id,
    json_graph: '{"nodes":[],"edges":[]}',
    status: 'draft',
    thrive_score: 0.5
  });
});

app.post('/roadmaps', async (c) => {
  const body = await c.req.json();
  return c.json({
    id: `rm-${Date.now()}`,
    ...body
  }, 201);
});

// Global error handler
app.onError((err, c) => {
  console.error('Thermonuclear Error:', err);
  
  const code = err.message?.includes('VAL-') ? err.message.split(':')[0] : 'ERR-500';
  const status = code?.startsWith('VAL-') ? 400 : 500;
  
  return c.json({
    error: err.message || 'Internal Server Error',
    code: code || 'ERR-500',
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID()
  }, status);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    code: 'HTTP-404',
    path: c.req.path,
    timestamp: new Date().toISOString()
  }, 404);
});

// Export for Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
};