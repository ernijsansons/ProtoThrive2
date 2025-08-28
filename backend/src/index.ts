// Ref: CLAUDE.md Terminal 1 Phase 1 - Main Hono Application
// Thermonuclear Backend API for ProtoThrive

import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createYoga, createSchema } from 'graphql-yoga';
import { 
  queryRoadmap, 
  queryUserRoadmaps, 
  insertRoadmap, 
  updateRoadmapStatus,
  querySnippets,
  insertSnippet,
  insertAgentLog,
  queryAgentLogs,
  insertInsight
} from '../utils/db';
import {
  validateRoadmapBody,
  validateRoadmapUpdate,
  validateSnippetBody,
  validateAgentLogBody,
  validateInsightBody,
  validateQueryParams,
  validateUUID
} from '../utils/validation';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { checkKillSwitch, checkBudget } from '../utils/mocks-helpers';
import { runOrchestrator } from '../utils/pythonExecutor'; // Ensure this import is correct

/**
 * Mermaid ERD for ProtoThrive Database
 * ```mermaid
 * erDiagram
 *     users ||--o{ roadmaps : creates
 *     roadmaps ||--o{ agent_logs : generates
 *     roadmaps ||--o{ insights : analyzes
 *     
 *     users {
 *         string id PK
 *         string email UK
 *         string role
 *         timestamp created_at
 *         timestamp deleted_at
 *     }
 *     
 *     roadmaps {
 *         string id PK
 *         string user_id FK
 *         text json_graph
 *         string status
 *         boolean vibe_mode
 *         float thrive_score
 *         timestamp created_at
 *         timestamp updated_at
 *     }
 *     
 *     snippets {
 *         string id PK
 *         string category
 *         text code
 *         string ui_preview_url
 *         integer version
 *         timestamp created_at
 *         timestamp updated_at
 *     }
 *     
 *     agent_logs {
 *         string id PK
 *         string roadmap_id FK
 *         string task_type
 *         text output
 *         string status
 *         string model_used
 *         integer token_count
 *         timestamp timestamp
 *     }
 *     
 *     insights {
 *         string id PK
 *         string roadmap_id FK
 *         string type
 *         text data
 *         float score
 *         timestamp created_at
 *     }
 * ```
 */

// Type bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface User {
  id: string;
  role: 'vibe_coder' | 'engineer' | 'exec' | 'super_admin';
}

// Create Hono app
const app = new Hono<{ Bindings: Env; Variables: { user: User } }>();

// Middleware
app.use('*', cors());
app.use('*', logger());

/**
 * JWT validation middleware with security integration
 * Ref: CLAUDE.md Terminal 1 - Auth middleware + Phase 5 Security
 */
async function validateJwtMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Missing authorization token', code: 'AUTH-401' }, 401);
  }
  
  // Mock JWT validation - extract user ID from token
  const userId = token.split('.')[1];
  if (!userId || !validateUUID(userId)) {
    return c.json({ error: 'Invalid authorization token', code: 'AUTH-401' }, 401);
  }
  
  // Set user context
  c.set('user', { 
    id: 'uuid-thermo-1', 
    role: 'vibe_coder' 
  });
  
  // Check kill-switch
  const isPaused = await checkKillSwitch(c.env.KV);
  if (isPaused) {
    return c.json({ error: 'System maintenance in progress', code: 'KILL-503' }, 503);
  }
  
  await next();
}

/**
 * Security budget check middleware
 * Ref: CLAUDE.md Phase 5 - Security Across All Phases
 */
async function checkBudgetMiddleware(c: Context, next: Next) {
  try {
    console.log('Thermonuclear Security: Checking budget...');
    
    // Budget check already imported at top
    
    // Mock session cost tracking (in production, would use KV or database)
    const sessionCost = 0; // Would retrieve from session/KV
    const requestCost = 0.05; // Base cost per request
    
    // Check if request would exceed budget
    checkBudget(sessionCost, requestCost);
    
    console.log('Thermonuclear Security: Budget check passed');
    await next();
  } catch (error: any) {
    console.error('Thermonuclear Security: Budget exceeded', error);
    return c.json({ 
      error: 'Request budget exceeded', 
      code: error.code || 'BUDGET-429',
      limit: '$0.10 per session'
    }, 429);
  }
}

// Apply auth and security middleware to all routes except health
app.use('/api/*', validateJwtMiddleware);
app.use('/api/*', checkBudgetMiddleware); // Security across all phases
app.use('/graphql', validateJwtMiddleware);
app.use('/graphql', checkBudgetMiddleware); // Security across all phases

/**
 * Health check endpoint
 */
app.get('/health', (c: Context) => {
  console.log('Thermonuclear Health Check: OK');
  return c.json({ status: 'ok', service: 'protothrive-backend' });
});

/**
 * Root endpoint
 * Ref: CLAUDE.md Terminal 1 - Backend Fix
 */
app.get('/', async (c: Context) => {
  console.log('Thermonuclear Root Endpoint Hit');
  // Test D1 connection
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    return c.json({ 
      status: 'Thermonuclear Backend Up - Ready',
      db: result ? 'Connected' : 'Not Connected',
      service: 'protothrive-backend',
      endpoints: ['/health', '/api/roadmaps', '/api/snippets', '/graphql']
    });
  } catch (e: any) {
    console.error('Thermonuclear DB Test Error:', e);
    return c.json({ 
      status: 'Thermonuclear Backend Up - Ready',
      db: 'Error',
      service: 'protothrive-backend',
      endpoints: ['/health', '/api/roadmaps', '/api/snippets', '/graphql']
    });
  }
});

/**
 * REST Endpoints
 * Ref: CLAUDE.md Terminal 1 - REST APIs
 */

// Get roadmap by ID
app.get('/api/roadmaps/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    
    if (!validateUUID(id)) {
      return c.json({ error: 'Invalid roadmap ID format', code: 'VAL-400' }, 400);
    }
    
    const roadmap = await queryRoadmap(id, user.id, c.env);
    
    console.log(`Thermonuclear GET: Roadmap ${id} retrieved`);
    return c.json(roadmap);
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('404') ? 404 : 500);
  }
});

// Get all roadmaps for user
app.get('/api/roadmaps', async (c: Context) => {
  try {
    const user = c.get('user');
    const params = validateQueryParams(c.req.query());
    
    const roadmaps = await queryUserRoadmaps(user.id, params.status, c.env);
    
    console.log(`Thermonuclear GET: ${roadmaps.length} roadmaps retrieved`);
    return c.json({ roadmaps, total: roadmaps.length });
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, 500);
  }
});

// Create new roadmap
app.post('/api/roadmaps', async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const validatedBody = validateRoadmapBody(body);
    const result = await insertRoadmap(user.id, validatedBody, c.env);
    
    // Trigger AI Orchestration
    try {
      const orchestratorOutput = await runOrchestrator(JSON.stringify(validatedBody.json_graph));
      console.log('AI Orchestrator Output:', orchestratorOutput);
      // Here you might parse the orchestratorOutput and store relevant data
      // e.g., generated code, agent logs, updated roadmap status/score
    } catch (aiError: any) {
      console.error('Error triggering AI Orchestrator:', aiError);
      // Decide how to handle AI orchestration failure (e.g., log, notify, partial success)
    }
    
    console.log(`Thermonuclear POST: Roadmap ${result.id} created`);
    return c.json(result, 201);
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('400') ? 400 : 500);
  }
});

// Update roadmap
app.patch('/api/roadmaps/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    
    if (!validateUUID(id)) {
      return c.json({ error: 'Invalid roadmap ID format', code: 'VAL-400' }, 400);
    }
    
    const validatedBody = validateRoadmapUpdate(body);
    
    if (validatedBody.status) {
      await updateRoadmapStatus(id, user.id, validatedBody.status as Roadmap['status'], c.env);
    }
    
    console.log(`Thermonuclear PATCH: Roadmap ${id} updated`);
    return c.json({ success: true });
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('404') ? 404 : 500);
  }
});

// Get snippets
app.get('/api/snippets', async (c: Context) => {
  try {
    const params = validateQueryParams(c.req.query());
    const snippets = await querySnippets(params.category, c.env);
    
    console.log(`Thermonuclear GET: ${snippets.length} snippets retrieved`);
    return c.json({ snippets, total: snippets.length });
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, 500);
  }
});

// Create snippet
app.post('/api/snippets', async (c: Context) => {
  try {
    const body = await c.req.json();
    
    const validatedBody = validateSnippetBody(body);
    const snippetData: { category: string; code: string; ui_preview_url?: string } = {
      category: validatedBody.category,
      code: validatedBody.code
    };
    if (validatedBody.ui_preview_url) {
      snippetData.ui_preview_url = validatedBody.ui_preview_url;
    }
    const result = await insertSnippet(snippetData, c.env);
    
    console.log(`Thermonuclear POST: Snippet ${result.id} created`);
    return c.json(result, 201);
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('400') ? 400 : 500);
  }
});

// Create agent log
app.post('/api/agent-logs', async (c: Context) => {
  try {
    const body = await c.req.json();
    
    const validatedBody = validateAgentLogBody(body);
    const result = await insertAgentLog(validatedBody, c.env);
    
    console.log(`Thermonuclear POST: Agent log ${result.id} created`);
    return c.json(result, 201);
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('400') ? 400 : 500);
  }
});

// Get agent logs for roadmap
app.get('/api/roadmaps/:id/logs', async (c: Context) => {
  try {
    const id = c.req.param('id');
    
    if (!validateUUID(id)) {
      return c.json({ error: 'Invalid roadmap ID format', code: 'VAL-400' }, 400);
    }
    
    const logs = await queryAgentLogs(id, c.env);
    
    console.log(`Thermonuclear GET: ${logs.length} agent logs retrieved`);
    return c.json({ logs, total: logs.length });
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, 500);
  }
});

// Create insight
app.post('/api/insights', async (c: Context) => {
  try {
    const body = await c.req.json();
    
    const validatedBody = validateInsightBody(body);
    const result = await insertInsight(validatedBody, c.env);
    
    console.log(`Thermonuclear POST: Insight ${result.id} created`);
    return c.json(result, 201);
  } catch (error: any) {
    const code = error.message.split(':')[0] || 'ERR-500';
    return c.json({ error: error.message, code }, code.includes('400') ? 400 : 500);
  }
});

/**
 * Admin API Key Management Endpoints
 * Ref: CLAUDE.md - Super Admin functionality
 */

// Middleware to check super admin role
const checkSuperAdmin = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  if (user.role !== 'super_admin') {
    console.log(`Thermonuclear: Unauthorized admin access attempt by ${user.id}`);
    return c.json({ error: 'Forbidden', code: 'AUTH-403' }, 403);
  }
  await next();
};

// Get all API keys
app.get('/api/admin/keys', checkSuperAdmin, async (c: Context) => {
  try {
    console.log('Thermonuclear: Fetching API keys for admin');
    
    // Get keys from KV store
    const keys: any[] = await c.env.KV.get('api_keys', 'json') || [];
    
    // Mask the actual key values for security
    const maskedKeys = keys.map((key: any) => ({
      ...key,
      key: key.key.substring(0, 4) + '*'.repeat(key.key.length - 8) + key.key.substring(key.key.length - 4)
    }));
    
    return c.json({ keys: maskedKeys });
  } catch (error: any) {
    console.error('Thermonuclear Error: Failed to fetch keys', error);
    return c.json({ error: 'Failed to fetch keys', code: 'ERR-500' }, 500);
  }
});

// Add new API key
app.post('/api/admin/keys', checkSuperAdmin, async (c: Context) => {
  try {
    const body = await c.req.json();
    
    if (!body.name || !body.key || !body.service) {
      return c.json({ error: 'Missing required fields', code: 'VAL-400' }, 400);
    }
    
    console.log(`Thermonuclear: Adding new API key for service ${body.service}`);
    
    // Get existing keys
    const existingKeys: any[] = await c.env.KV.get('api_keys', 'json') || [];
    
    // Create new key entry
    const newKey = {
      id: crypto.randomUUID(),
      name: body.name,
      key: body.key,
      service: body.service,
      lastRotated: new Date().toISOString(),
      status: 'active',
      createdBy: c.get('user').id,
      createdAt: new Date().toISOString()
    };
    
    // Add to vault for secure storage
    await c.env.KV.put(`api_key_${body.service}`, body.key);
    
    // Update keys list
    existingKeys.push(newKey);
    await c.env.KV.put('api_keys', JSON.stringify(existingKeys));
    
    // Return masked version
    const maskedKey = {
      ...newKey,
      key: newKey.key.substring(0, 4) + '*'.repeat(newKey.key.length - 8) + newKey.key.substring(newKey.key.length - 4)
    };
    
    console.log('Thermonuclear: API key added successfully');
    return c.json({ key: maskedKey }, 201);
  } catch (error: any) {
    console.error('Thermonuclear Error: Failed to add key', error);
    return c.json({ error: 'Failed to add key', code: 'ERR-500' }, 500);
  }
});

// Rotate API key
app.post('/api/admin/keys/:id/rotate', checkSuperAdmin, async (c: Context) => {
  try {
    const keyId = c.req.param('id');
    console.log(`Thermonuclear: Rotating API key ${keyId}`);
    
    // Get existing keys
    const existingKeys: any[] = await c.env.KV.get('api_keys', 'json') || [];
    const keyIndex = existingKeys.findIndex((k: any) => k.id === keyId);
    
    if (keyIndex === -1) {
      return c.json({ error: 'Key not found', code: 'NOT-404' }, 404);
    }
    
    // Generate new key (in production, this would call the actual service)
    const newKeyValue = `${existingKeys[keyIndex].service}_${Date.now()}_${crypto.randomUUID()}`;
    
    // Update the key
    existingKeys[keyIndex].key = newKeyValue;
    existingKeys[keyIndex].lastRotated = new Date().toISOString();
    
    // Update in vault
    await c.env.KV.put(`api_key_${existingKeys[keyIndex].service}`, newKeyValue);
    
    // Save updated list
    await c.env.KV.put('api_keys', JSON.stringify(existingKeys));
    
    console.log('Thermonuclear: API key rotated successfully');
    return c.json({ success: true, rotatedAt: existingKeys[keyIndex].lastRotated });
  } catch (error: any) {
    console.error('Thermonuclear Error: Failed to rotate key', error);
    return c.json({ error: 'Failed to rotate key', code: 'ERR-500' }, 500);
  }
});

// Delete API key
app.delete('/api/admin/keys/:id', checkSuperAdmin, async (c: Context) => {
  try {
    const keyId = c.req.param('id');
    console.log(`Thermonuclear: Deleting API key ${keyId}`);
    
    // Get existing keys
    const existingKeys: any[] = await c.env.KV.get('api_keys', 'json') || [];
    const keyToDelete = existingKeys.find((k: any) => k.id === keyId);
    
    if (!keyToDelete) {
      return c.json({ error: 'Key not found', code: 'NOT-404' }, 404);
    }
    
    // Remove from list
    const updatedKeys = existingKeys.filter((k: any) => k.id !== keyId);
    
    // Delete from vault
    await c.env.KV.delete(`api_key_${keyToDelete.service}`);
    
    // Save updated list
    await c.env.KV.put('api_keys', JSON.stringify(updatedKeys));
    
    console.log('Thermonuclear: API key deleted successfully');
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Thermonuclear Error: Failed to delete key', error);
    return c.json({ error: 'Failed to delete key', code: 'ERR-500' }, 500);
  }
});

/**
 * GraphQL Schema and Endpoint
 * Ref: CLAUDE.md Terminal 1 - GraphQL API
 */
const graphqlSchema = createSchema({
  typeDefs: `
    type User {
      id: ID!
      email: String!
      role: String!
      created_at: String!
    }
    
    type Roadmap {
      id: ID!
      user_id: ID!
      json_graph: String!
      status: String!
      vibe_mode: Boolean!
      thrive_score: Float!
      created_at: String!
      updated_at: String!
    }
    
    type Snippet {
      id: ID!
      category: String!
      code: String!
      ui_preview_url: String
      version: Int!
      created_at: String!
      updated_at: String!
    }
    
    type AgentLog {
      id: ID!
      roadmap_id: ID!
      task_type: String!
      output: String!
      status: String!
      model_used: String!
      token_count: Int!
      timestamp: String!
    }
    
    type Query {
      getRoadmap(id: ID!): Roadmap
      getUserRoadmaps(status: String): [Roadmap!]!
      getSnippets(category: String): [Snippet!]!
      getAgentLogs(roadmapId: ID!): [AgentLog!]!
    }
    
    input RoadmapInput {
      json_graph: String!
      vibe_mode: Boolean!
    }
    
    input SnippetInput {
      category: String!
      code: String!
      ui_preview_url: String
    }
    
    type Mutation {
      createRoadmap(input: RoadmapInput!): Roadmap!
      updateRoadmapStatus(id: ID!, status: String!): Roadmap!
      createSnippet(input: SnippetInput!): Snippet!
    }
  `,
  resolvers: {
    Query: {
      getRoadmap: async (_parent: unknown, args: { id: string }, context: { user: User; env: Env }) => {
        const user = context.user;
        return await queryRoadmap(args.id, user.id, context.env);
      },
      getUserRoadmaps: async (_parent: unknown, args: { status?: string }, context: { user: User; env: Env }) => {
        const user = context.user;
        return await queryUserRoadmaps(user.id, args.status, context.env);
      },
      getSnippets: async (_parent: unknown, args: { category?: string }, context: { user: User; env: Env }) => {
        return await querySnippets(args.category, context.env);
      },
      getAgentLogs: async (_parent: unknown, args: { roadmapId: string }, context: { user: User; env: Env }) => {
        return await queryAgentLogs(args.roadmapId, context.env);
      }
    },
    Mutation: {
      createRoadmap: async (_parent: unknown, args: { input: { json_graph: string; vibe_mode: boolean } }, context: { user: User; env: Env }) => {
        const user = context.user;
        const result = await insertRoadmap(user.id, args.input, context.env);
        return await queryRoadmap(result.id, user.id, context.env);
      },
      updateRoadmapStatus: async (_parent: unknown, args: { id: string; status: string }, context: { user: User; env: Env }) => {
        const user = context.user;
        await updateRoadmapStatus(args.id, user.id, args.status as Roadmap['status'], context.env);
        return await queryRoadmap(args.id, user.id, context.env);
      },
      createSnippet: async (_parent: unknown, args: { input: { category: string; code: string; ui_preview_url?: string } }, context: { user: User; env: Env }) => {
        const result = await insertSnippet(args.input, context.env);
        const snippets = await querySnippets(undefined, context.env);
        return snippets.find(s => s.id === result.id)!;
      }
    }
  }
});

// Create GraphQL Yoga instance
const yoga = createYoga({
  schema: graphqlSchema,
  context: ({ request }: { request: Request }) => {
    return {
      user: (request as Request).user as User,
      env: (request as Request).env as Env
    };
  },
  graphqlEndpoint: '/graphql'
});

// Mount GraphQL endpoint
app.all('/graphql', (c: Context) => {
  // Pass user context and env to GraphQL
  (c.req as any).user = c.get('user');
  (c.req as any).env = c.env;
  return yoga({ request: c.req.raw as Request }, c.env);
});

/**
 * Global error handler
 * Ref: CLAUDE.md Terminal 1 - Error handling
 */
app.onError((err: Error, c: Context) => {
  const code = err.message?.split(':')[0] || 'ERR-500';
  console.error(`Thermonuclear Error: ${code} - ${err.message}`);
  
  return c.json({
    error: err.message || 'Internal server error',
    code
  }, 500);
});

// Export for Cloudflare Workers
export default app;
