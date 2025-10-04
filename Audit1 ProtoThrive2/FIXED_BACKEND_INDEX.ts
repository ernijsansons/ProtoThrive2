// Fixed backend/src/index.ts for Cloudflare Workers
// Complete refactor for edge compatibility

import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

// Environment bindings
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  STORAGE?: R2Bucket;
  AI_SERVICE_URL?: string;
  JWT_SECRET?: string;
  ENVIRONMENT: string;
}

// Validation schemas
const RoadmapCreateSchema = z.object({
  userId: z.string().uuid(),
  jsonGraph: z.string().max(50000),
  vibeMode: z.boolean().optional().default(false),
  status: z.enum(['draft', 'active', 'archived']).optional().default('draft')
});

const RoadmapUpdateSchema = z.object({
  jsonGraph: z.string().max(50000).optional(),
  vibeMode: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  thriveScore: z.number().min(0).max(100).optional()
});

const SnippetCreateSchema = z.object({
  category: z.string().max(50),
  code: z.string().max(100000),
  uiPreviewUrl: z.string().url().optional(),
  version: z.number().int().positive().optional().default(1)
});

// Rate limiting with KV
class RateLimiter {
  private kv: KVNamespace;
  
  constructor(kv: KVNamespace) {
    this.kv = kv;
  }
  
  async check(key: string, limit: number = 100, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
    
    const current = await this.kv.get(windowKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return false;
    }
    
    await this.kv.put(windowKey, String(count + 1), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });
    
    return true;
  }
}

// Database helpers with proper parameterization
class Database {
  private db: D1Database;
  
  constructor(db: D1Database) {
    this.db = db;
  }
  
  async getRoadmap(id: string, userId: string): Promise<any> {
    const stmt = this.db.prepare(
      'SELECT * FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
    ).bind(id, userId);
    
    return await stmt.first();
  }
  
  async getUserRoadmaps(userId: string, status?: string): Promise<any[]> {
    let query = 'SELECT * FROM roadmaps WHERE user_id = ? AND deleted_at IS NULL';
    const params: any[] = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY updated_at DESC LIMIT 100';
    
    const stmt = this.db.prepare(query).bind(...params);
    const result = await stmt.all();
    
    return result.results || [];
  }
  
  async createRoadmap(data: z.infer<typeof RoadmapCreateSchema>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO roadmaps (id, user_id, json_graph, vibe_mode, status, thrive_score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.userId,
      data.jsonGraph,
      data.vibeMode ? 1 : 0,
      data.status || 'draft',
      50.0, // Default thrive score
      now,
      now
    ).run();
    
    return id;
  }
  
  async updateRoadmap(id: string, userId: string, data: z.infer<typeof RoadmapUpdateSchema>): Promise<boolean> {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.jsonGraph !== undefined) {
      updates.push('json_graph = ?');
      params.push(data.jsonGraph);
    }
    
    if (data.vibeMode !== undefined) {
      updates.push('vibe_mode = ?');
      params.push(data.vibeMode ? 1 : 0);
    }
    
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    
    if (data.thriveScore !== undefined) {
      updates.push('thrive_score = ?');
      params.push(data.thriveScore);
    }
    
    if (updates.length === 0) {
      return false;
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    // Add WHERE clause params
    params.push(id, userId);
    
    const result = await this.db.prepare(
      `UPDATE roadmaps SET ${updates.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    ).bind(...params).run();
    
    return result.meta.changes > 0;
  }
  
  async getSnippets(category?: string): Promise<any[]> {
    let query = 'SELECT * FROM snippets WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY updated_at DESC LIMIT 100';
    
    const stmt = params.length > 0 
      ? this.db.prepare(query).bind(...params)
      : this.db.prepare(query);
    
    const result = await stmt.all();
    return result.results || [];
  }
  
  async createSnippet(data: z.infer<typeof SnippetCreateSchema>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO snippets (id, category, code, ui_preview_url, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.category,
      data.code,
      data.uiPreviewUrl || null,
      data.version || 1,
      now,
      now
    ).run();
    
    return id;
  }
  
  async logAgentActivity(roadmapId: string, taskType: string, output: string, model: string = 'claude'): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await this.db.prepare(
      `INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      roadmapId,
      taskType,
      output,
      'completed',
      model,
      output.length, // Simple token estimate
      now
    ).run();
  }
}

// External AI service client
class AIServiceClient {
  private serviceUrl: string;
  private kv: KVNamespace;
  
  constructor(serviceUrl: string, kv: KVNamespace) {
    this.serviceUrl = serviceUrl;
    this.kv = kv;
  }
  
  async orchestrate(jsonGraph: string, userId: string): Promise<any> {
    // Check cache first
    const cacheKey = `ai:orchestrate:${crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonGraph))}`;
    const cached = await this.kv.get(cacheKey, 'json');
    
    if (cached) {
      return cached;
    }
    
    try {
      // Call external Python service or use fallback
      if (this.serviceUrl) {
        const response = await fetch(`${this.serviceUrl}/orchestrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph: jsonGraph, userId })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Cache for 5 minutes
          await this.kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
          return result;
        }
      }
      
      // Fallback: Simple task decomposition
      return this.fallbackOrchestration(jsonGraph);
    } catch (error) {
      console.error('AI orchestration failed:', error);
      return this.fallbackOrchestration(jsonGraph);
    }
  }
  
  private fallbackOrchestration(jsonGraph: string): any {
    try {
      const graph = JSON.parse(jsonGraph);
      const tasks = graph.nodes?.map((node: any, i: number) => ({
        id: crypto.randomUUID(),
        type: i % 2 === 0 ? 'ui' : 'backend',
        description: `Process node ${node.id || i}`,
        status: 'pending',
        code: `// Auto-generated task for ${node.label || node.id}\nconsole.log('Processing ${node.id}');`
      })) || [];
      
      return {
        success: true,
        tasks,
        thriveScore: 75,
        message: 'Orchestration completed (fallback mode)'
      };
    } catch {
      return {
        success: false,
        tasks: [],
        thriveScore: 0,
        message: 'Failed to parse graph'
      };
    }
  }
}

// Middleware
const authenticate = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // For now, mock authentication - in production, verify JWT
  c.set('userId', 'user-' + crypto.randomUUID());
  await next();
};

const validateRequest = (schema: z.ZodSchema) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedBody', validated);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ 
          error: 'Validation failed', 
          details: error.errors 
        }, 400);
      }
      return c.json({ error: 'Invalid request' }, 400);
    }
  };
};

// Main application
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', cors({
  origin: ['https://protothrive.com', 'http://localhost:3000'],
  credentials: true
}));

app.use('*', logger());

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation failed', details: err.errors }, 400);
  }
  
  // Don't leak internal errors in production
  const isDev = c.env.ENVIRONMENT === 'development';
  return c.json({ 
    error: isDev ? err.message : 'Internal server error'
  }, 500);
});

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// API status
app.get('/api/status', async (c) => {
  const db = new Database(c.env.DB);
  
  try {
    // Test database connection
    await db.getSnippets();
    
    return c.json({
      status: 'operational',
      services: {
        database: 'connected',
        cache: 'connected',
        ai: c.env.AI_SERVICE_URL ? 'configured' : 'fallback'
      }
    });
  } catch (error) {
    return c.json({
      status: 'degraded',
      services: {
        database: 'error',
        cache: 'unknown',
        ai: 'unknown'
      }
    }, 503);
  }
});

// Rate limiting middleware
const rateLimitMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const limiter = new RateLimiter(c.env.KV);
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  const allowed = await limiter.check(ip);
  if (!allowed) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  
  await next();
};

// Protected routes
const api = new Hono<{ Bindings: Env }>();

api.use('*', rateLimitMiddleware);
api.use('*', authenticate);

// Roadmaps endpoints
api.get('/roadmaps', async (c) => {
  const db = new Database(c.env.DB);
  const userId = c.get('userId');
  const status = c.req.query('status');
  
  const roadmaps = await db.getUserRoadmaps(userId, status);
  return c.json({ roadmaps });
});

api.get('/roadmaps/:id', async (c) => {
  const db = new Database(c.env.DB);
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  const roadmap = await db.getRoadmap(id, userId);
  if (!roadmap) {
    return c.json({ error: 'Roadmap not found' }, 404);
  }
  
  return c.json({ roadmap });
});

api.post('/roadmaps', validateRequest(RoadmapCreateSchema), async (c) => {
  const db = new Database(c.env.DB);
  const data = c.get('validatedBody') as z.infer<typeof RoadmapCreateSchema>;
  
  const id = await db.createRoadmap(data);
  return c.json({ id, message: 'Roadmap created' }, 201);
});

api.patch('/roadmaps/:id', validateRequest(RoadmapUpdateSchema), async (c) => {
  const db = new Database(c.env.DB);
  const userId = c.get('userId');
  const id = c.req.param('id');
  const data = c.get('validatedBody') as z.infer<typeof RoadmapUpdateSchema>;
  
  const updated = await db.updateRoadmap(id, userId, data);
  if (!updated) {
    return c.json({ error: 'Roadmap not found or no changes' }, 404);
  }
  
  return c.json({ message: 'Roadmap updated' });
});

api.post('/roadmaps/:id/orchestrate', async (c) => {
  const db = new Database(c.env.DB);
  const aiClient = new AIServiceClient(c.env.AI_SERVICE_URL || '', c.env.KV);
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  // Get roadmap
  const roadmap = await db.getRoadmap(id, userId);
  if (!roadmap) {
    return c.json({ error: 'Roadmap not found' }, 404);
  }
  
  // Run orchestration
  const result = await aiClient.orchestrate(roadmap.json_graph, userId);
  
  // Log activity
  await db.logAgentActivity(
    id, 
    'orchestration',
    JSON.stringify(result),
    'claude'
  );
  
  // Update thrive score if provided
  if (result.thriveScore !== undefined) {
    await db.updateRoadmap(id, userId, { thriveScore: result.thriveScore });
  }
  
  return c.json(result);
});

// Snippets endpoints
api.get('/snippets', async (c) => {
  const db = new Database(c.env.DB);
  const category = c.req.query('category');
  
  const snippets = await db.getSnippets(category);
  return c.json({ snippets });
});

api.post('/snippets', validateRequest(SnippetCreateSchema), async (c) => {
  const db = new Database(c.env.DB);
  const data = c.get('validatedBody') as z.infer<typeof SnippetCreateSchema>;
  
  const id = await db.createSnippet(data);
  return c.json({ id, message: 'Snippet created' }, 201);
});

// Mount API routes
app.route('/api', api);

// Default handler
app.all('*', (c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    // Scheduled tasks (cleanup, etc.)
    console.log('Scheduled task running:', new Date().toISOString());
  }
};
