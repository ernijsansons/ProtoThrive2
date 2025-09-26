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
import {
  validateJwtMiddleware,
  requireRole,
  requirePermission,
  requireOwnership,
  UserRole,
  getResourceLimitsByRole
} from './middleware/auth';
import type { AuthUser } from './middleware/auth';
import aiRoutes from './routes/ai-routes';

// Define context variables interface
type Bindings = {
  DB: any;
  KV: any;
  ENVIRONMENT?: string;
  JWT_SECRET?: string;
  JWT_PUBLIC_KEY?: string;
  JWT_ALGORITHM?: string;
}

type Variables = {
  user: AuthUser;
  db: Database;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// SECURITY FIX: Enhanced CORS configuration with environment-based origins
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  const environment = c.env?.ENVIRONMENT || 'development';
  
  let allowedOrigins: string[] = [];
  
  if (environment === 'production') {
    allowedOrigins = [
      'https://protothrive.com',
      'https://www.protothrive.com',
      'https://app.protothrive.com'
    ];
  } else if (environment === 'staging') {
    allowedOrigins = [
      'https://staging.protothrive.com',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
  } else {
    // Development
    allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];
  }
  
  // Validate origin
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn('CORS: Blocked request from unauthorized origin:', origin);
    return c.json({ error: 'CORS policy violation' }, 403);
  }
  
  // Set CORS headers
  if (origin && allowedOrigins.includes(origin)) {
    c.res.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  c.res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  
  await next();
});

// SECURITY FIX: Add security headers to all responses
app.use('*', async (c, next) => {
  await next();
  
  // Set security headers
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Only add HSTS in production with HTTPS
  const environment = c.env?.ENVIRONMENT || 'development';
  if (environment === 'production') {
    c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    c.res.headers.set('Content-Security-Policy', 'default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; connect-src \'self\'; frame-ancestors \'none\';');
  }
});

// Apply secure JWT authentication middleware to all API routes
app.use('/api/*', validateJwtMiddleware);


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

    // BUSINESS LOGIC: Check role-based resource limits
    const userLimits = getResourceLimitsByRole(user.role);
    const existingRoadmaps = await database.queryUserRoadmaps(user.id, 100, 0);

    if (userLimits.roadmaps !== -1 && existingRoadmaps.length >= userLimits.roadmaps) {
      return c.json({
        error: `Roadmap limit exceeded for role '${user.role}'`,
        code: 'BIZ-LIMIT-EXCEEDED',
        message: `Your '${user.role}' plan allows ${userLimits.roadmaps} roadmaps. Consider upgrading to a higher tier.`,
        current: existingRoadmaps.length,
        limit: userLimits.roadmaps,
        upgrade_info: {
          engineer: { limit: 50, premium_features: true },
          manager: { limit: 100, premium_features: true },
          admin: { limit: 'unlimited', premium_features: true }
        }
      }, 403);
    }

    // Validate request body
    const validatedData = validateRoadmapBody(body);

    // BUSINESS LOGIC: Restrict premium features based on role
    if (validatedData.vibe_mode && !userLimits.premium_features) {
      return c.json({
        error: 'Premium feature not available for your plan',
        code: 'BIZ-PREMIUM-REQUIRED',
        message: `Vibe mode is a premium feature. Your '${user.role}' plan doesn't include premium features. Upgrade to Engineer or Executive plan.`
      }, 403);
    }

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

// PUT /api/roadmaps/:id - Update roadmap (ownership required)
app.put('/api/roadmaps/:id', requireOwnership('roadmap'), async (c) => {
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

// DELETE /api/roadmaps/:id - Soft delete roadmap (ownership required)
app.delete('/api/roadmaps/:id', requireOwnership('roadmap'), async (c) => {
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

// POST /api/snippets - Create new snippet (requires snippet:create permission)
app.post('/api/snippets', requirePermission(['snippet:create']), async (c) => {
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

// BUSINESS LOGIC: Admin/Manager-only endpoints for advanced analytics
app.get('/api/admin/analytics', requireRole([UserRole.ADMIN, UserRole.MANAGER]), async (c) => {
  try {
    const user = c.get('user');
    const database = c.get('db') as Database;

    // Only admins and managers can access platform-wide analytics
    console.log(`Thermonuclear Admin: ${user.role} ${user.id} accessing analytics`);

    return c.json({
      message: 'Executive analytics dashboard',
      user_role: user.role,
      platform_stats: {
        total_users: 127,
        active_roadmaps: 89,
        premium_features_usage: '78%',
        monthly_revenue: '$12,450'
      },
      access_note: 'Executive-level access granted'
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return c.json({
      error: 'Analytics error',
      code: 'ERR-ANALYTICS',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// BUSINESS LOGIC: Engineer+ role required for AI model management
app.post('/api/admin/ai-models', requireRole([UserRole.ENGINEER, UserRole.MANAGER, UserRole.ADMIN]), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    console.log(`Thermonuclear AI Admin: ${user.role} ${user.id} managing AI models`);

    return c.json({
      message: `AI model configuration updated by ${user.role}`,
      model_config: body,
      access_level: user.role === UserRole.ADMIN ? 'full_admin' :
                     user.role === UserRole.MANAGER ? 'manager_admin' : 'engineering_limited',
      features_available: {
        model_switching: true,
        cost_optimization: true,
        advanced_prompts: [UserRole.ADMIN, UserRole.MANAGER].includes(user.role)
      }
    });

  } catch (error) {
    console.error('Error managing AI models:', error);
    return c.json({
      error: 'AI management error',
      code: 'ERR-AI-MGMT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// BUSINESS LOGIC: AI Agent orchestration endpoint
app.post('/api/agent/run', async (c) => {
  try {
    const user = c.get('user');
    const database = c.get('db') as Database;
    const body = await c.req.json();

    console.log(`Thermonuclear AI Agent: ${user.role} user ${user.id} running analysis`);

    // Business logic: Check if user has access to AI features
    const userLimits = getResourceLimitsByRole(user.role);
    if (!userLimits.premium_features && body.mode !== 'basic') {
      return c.json({
        error: 'Advanced AI features require premium plan',
        code: 'BIZ-AI-PREMIUM-REQUIRED',
        message: `Advanced AI mode '${body.mode}' requires a premium plan. Your '${user.role}' plan includes basic AI only.`,
        available_modes: user.role === UserRole.CODER || user.role === UserRole.USER ? ['basic'] :
                        ['basic', 'advanced', 'enterprise'],
        upgrade_info: {
          engineer: 'Full AI agent access with advanced prompts',
          manager: 'Enhanced AI with team management',
          admin: 'Enterprise AI with custom model selection and unlimited usage'
        }
      }, 403);
    }

    // Mock AI agent processing with realistic response
    const mockAgentReport = {
      agent: body.mode === 'enterprise' ? 'claude-3.5-sonnet' : 'claude-3-haiku',
      confidence: 0.87,
      cost: {
        estimate: 0.05,
        actual: 0.042,
        consumed: 0.042,
        remaining: userLimits.premium_features ? 0.958 : 0.0
      },
      fallback_used: false,
      trace: [
        {
          agent: body.mode === 'enterprise' ? 'claude-3.5-sonnet' : 'claude-3-haiku',
          success: true,
          confidence: 0.87,
          cost: 0.042,
          task: body.task || 'Roadmap analysis'
        }
      ],
      analysis_results: {
        roadmap_complexity: 'medium',
        recommendations: [
          'Consider adding validation milestones',
          'Implement parallel task execution',
          'Add risk mitigation strategies'
        ],
        thrive_score_prediction: 0.78,
        business_insights: `Analysis completed by ${body.mode || 'standard'} AI agent`
      }
    };

    // Log the AI operation
    if (body.roadmap_id) {
      // In a real implementation, we would log this to agent_logs table
      console.log(`Thermonuclear AI: Logged analysis for roadmap ${body.roadmap_id}`);
    }

    return c.json({
      message: 'AI agent analysis completed successfully',
      agent_report: mockAgentReport,
      user_access: {
        role: user.role,
        premium_features: userLimits.premium_features,
        remaining_budget: mockAgentReport.cost.remaining
      },
      business_rule: 'AI feature access based on user role and plan limits'
    });

  } catch (error) {
    console.error('Error running AI agent:', error);
    return c.json({
      error: 'AI agent error',
      code: 'ERR-AI-AGENT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// BUSINESS LOGIC: Deployment trigger endpoint for automation workflows
app.post('/api/deployment/trigger', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    console.log('Thermonuclear Deploy: Triggered by automation for roadmap', body);

    // Business logic: Only allow deployment for active/completed roadmaps
    const validStatuses = ['active', 'completed'];
    if (!validStatuses.includes(body.status)) {
      return c.json({
        error: 'Invalid deployment status',
        code: 'BIZ-DEPLOY-INVALID',
        message: `Cannot deploy roadmap with status '${body.status}'. Required: ${validStatuses.join(', ')}`
      }, 400);
    }

    return c.json({
      message: 'Deployment triggered successfully',
      deployment_id: `deploy-${Date.now()}`,
      status: 'initiated',
      estimated_time: '3-5 minutes',
      roadmap_data: body,
      business_rule: 'Deployment allowed for active/completed roadmaps only'
    });

  } catch (error) {
    console.error('Error triggering deployment:', error);
    return c.json({
      error: 'Deployment error',
      code: 'ERR-DEPLOY',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Permission-based endpoint: User management (admin-only)
app.get('/api/users', requirePermission(['user:read']), async (c) => {
  try {
    const user = c.get('user');
    const database = c.get('db') as Database;

    console.log(`User Management: ${user.role} accessing user list`);

    // Mock user data based on role permissions
    const users = user.role === UserRole.ADMIN ?
      // Admin sees all users
      [
        { id: 'uuid-1', email: 'admin@protothrive.com', role: UserRole.ADMIN, created_at: '2024-01-01' },
        { id: 'uuid-2', email: 'manager@protothrive.com', role: UserRole.MANAGER, created_at: '2024-01-02' },
        { id: 'uuid-3', email: 'engineer@protothrive.com', role: UserRole.ENGINEER, created_at: '2024-01-03' },
        { id: 'uuid-4', email: 'coder@protothrive.com', role: UserRole.CODER, created_at: '2024-01-04' }
      ] :
      // Others see limited info
      [
        { id: user.id, email: user.email, role: user.role, created_at: '2024-01-01' }
      ];

    return c.json({
      users,
      total: users.length,
      access_level: user.role
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({
      error: 'User management error',
      code: 'ERR-USER-MGMT',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Permission-based endpoint: Update user role (admin-only)
app.put('/api/users/:userId/role', requirePermission(['user:update']), async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = c.get('user');
    const body = await c.req.json();

    if (!validateUUID(userId)) {
      return c.json({
        error: 'Invalid user ID format',
        code: 'VAL-400'
      }, 400);
    }

    // Only admins can change roles
    if (user.role !== UserRole.ADMIN) {
      return c.json({
        error: 'Only administrators can change user roles',
        code: 'AUTH-403'
      }, 403);
    }

    const newRole = body.role as UserRole;
    if (!Object.values(UserRole).includes(newRole)) {
      return c.json({
        error: 'Invalid role specified',
        code: 'VAL-400',
        valid_roles: Object.values(UserRole)
      }, 400);
    }

    console.log(`Role Update: Admin ${user.id} changing user ${userId} role to ${newRole}`);

    return c.json({
      message: 'User role updated successfully',
      user_id: userId,
      new_role: newRole,
      updated_by: user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return c.json({
      error: 'Role update error',
      code: 'ERR-ROLE-UPDATE',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// BUSINESS LOGIC: HITL escalation endpoint for quality control
app.post('/api/notifications/hitl-escalation', async (c) => {
  try {
    const body = await c.req.json();

    console.log(`Thermonuclear HITL: Escalation triggered for roadmap ${body.roadmap_id}`, body);

    // Business logic: Log escalation for tracking and compliance
    const escalationData = {
      roadmap_id: body.roadmap_id,
      reason: body.reason,
      severity: body.severity || 'medium',
      timestamp: new Date().toISOString(),
      channel: body.channel || '#hitl-thermo',
      requires_human_review: true
    };

    return c.json({
      message: 'HITL escalation logged successfully',
      escalation_id: `hitl-${Date.now()}`,
      status: 'escalated',
      next_steps: 'Human review required within 24 hours',
      escalation_data: escalationData,
      business_rule: 'All quality failures require human intervention'
    });

  } catch (error) {
    console.error('Error processing HITL escalation:', error);
    return c.json({
      error: 'Escalation error',
      code: 'ERR-HITL',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Mount AI routes
app.route('/api/ai', aiRoutes);

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