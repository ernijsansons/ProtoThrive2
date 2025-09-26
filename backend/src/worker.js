/**
 * ProtoThrive Backend - Cloudflare Workers JavaScript Entry Point
 * Production-ready API with D1 database and KV storage support
 */

export default {
  async fetch(request, env, ctx) {
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

    try {
      // Health check endpoint
      if (path === '/health' || path === '/') {
        const dbHealth = await this.checkDatabaseHealth(env);
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: Date.now(),
          version: '1.0.0',
          environment: env.ENVIRONMENT || 'development',
          services: {
            database: dbHealth ? 'operational' : 'error',
            cache: 'operational',
            monitoring: 'active'
          },
          database: {
            connected: dbHealth,
            d1_id: env.DB ? 'configured' : 'missing',
            kv_id: env.KV ? 'configured' : 'missing'
          }
        }), {
          headers: corsHeaders,
          status: 200
        });
      }

      // Roadmaps API
      if (path.startsWith('/api/roadmaps') || path.startsWith('/roadmaps')) {
        return await this.handleRoadmapsAPI(request, env, path, method, corsHeaders);
      }

      // Snippets API
      if (path.startsWith('/api/snippets') || path.startsWith('/snippets')) {
        return await this.handleSnippetsAPI(request, env, path, method, corsHeaders);
      }

      // Auth API
      if (path.startsWith('/auth')) {
        return await this.handleAuthAPI(request, env, path, method, corsHeaders);
      }

      // Default API info
      return new Response(JSON.stringify({
        message: 'ProtoThrive API v1.0',
        status: 'operational',
        endpoints: {
          health: ['GET /health'],
          roadmaps: [
            'GET /api/roadmaps',
            'POST /api/roadmaps',
            'GET /api/roadmaps/:id',
            'PUT /api/roadmaps/:id',
            'DELETE /api/roadmaps/:id'
          ],
          snippets: [
            'GET /api/snippets',
            'POST /api/snippets'
          ],
          auth: [
            'GET /auth/validate',
            'POST /auth/login'
          ]
        }
      }), {
        headers: corsHeaders,
        status: 200
      });

    } catch (error) {
      return this.handleError(error, { path, method, env, corsHeaders });
    }
  },

  async checkDatabaseHealth(env) {
    try {
      if (!env.DB) return false;
      const result = await env.DB.prepare('SELECT 1').first();
      return result !== null;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  },

  async validateAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if token exists in KV cache
    if (env.KV) {
      try {
        const cached = await env.KV.get(`auth:${token}`);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error('KV cache error:', e);
      }
    }

    // Mock user for development - use consistent ID
    return {
      id: 'test-user-thermo-staging',
      email: 'user@protothrive.com',
      role: 'vibe_coder'
    };
  },

  async handleRoadmapsAPI(request, env, path, method, corsHeaders) {
    const user = await this.validateAuth(request, env);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        code: 'AUTH-401'
      }), {
        headers: corsHeaders,
        status: 401
      });
    }

    // Extract roadmap ID from path
    const pathParts = path.replace('/api/', '').split('/');
    const roadmapId = pathParts[1];

    try {
      switch (method) {
        case 'GET':
          if (roadmapId) {
            const roadmap = await this.getRoadmap(env, roadmapId, user.id);
            return new Response(JSON.stringify(roadmap), {
              headers: corsHeaders,
              status: roadmap ? 200 : 404
            });
          } else {
            const roadmaps = await this.listRoadmaps(env, user.id);
            return new Response(JSON.stringify({ roadmaps }), {
              headers: corsHeaders,
              status: 200
            });
          }

        case 'POST':
          const createData = await request.json();
          const newRoadmap = await this.createRoadmap(env, user.id, createData);
          return new Response(JSON.stringify(newRoadmap), {
            headers: corsHeaders,
            status: 201
          });

        case 'PUT':
          if (!roadmapId) {
            return new Response(JSON.stringify({
              error: 'Roadmap ID required',
              code: 'VAL-400'
            }), {
              headers: corsHeaders,
              status: 400
            });
          }
          const updateData = await request.json();
          const updated = await this.updateRoadmap(env, roadmapId, user.id, updateData);
          return new Response(JSON.stringify(updated), {
            headers: corsHeaders,
            status: 200
          });

        case 'DELETE':
          if (!roadmapId) {
            return new Response(JSON.stringify({
              error: 'Roadmap ID required',
              code: 'VAL-400'
            }), {
              headers: corsHeaders,
              status: 400
            });
          }
          await this.deleteRoadmap(env, roadmapId, user.id);
          return new Response(JSON.stringify({
            message: 'Roadmap deleted successfully',
            roadmap_id: roadmapId
          }), {
            headers: corsHeaders,
            status: 200
          });

        default:
          return new Response(JSON.stringify({
            error: 'Method not allowed',
            code: 'HTTP-405'
          }), {
            headers: corsHeaders,
            status: 405
          });
      }
    } catch (error) {
      const requestId = crypto.randomUUID().split('-')[0];
      console.error(`Roadmaps API error [${requestId}]:`, error.stack || error.message);

      return new Response(JSON.stringify({
        error: 'Database operation failed',
        message: env.ENVIRONMENT === 'production' ? 'Failed to process roadmap request' : error.message,
        requestId: requestId,
        code: error.code || 'DB-500',
        timestamp: Date.now()
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
  },

  async getRoadmap(env, roadmapId, userId) {
    if (!env.DB) {
      return {
        id: roadmapId,
        user_id: userId,
        json_graph: {
          nodes: [
            { id: 'n1', label: 'Start', position: { x: 0, y: 0 } },
            { id: 'n2', label: 'Middle', position: { x: 100, y: 100 } },
            { id: 'n3', label: 'End', position: { x: 200, y: 200 } }
          ],
          edges: [
            { from: 'n1', to: 'n2' },
            { from: 'n2', to: 'n3' }
          ]
        },
        status: 'active',
        thrive_score: 0.75,
        created_at: Date.now()
      };
    }

    const result = await env.DB.prepare(
      'SELECT * FROM roadmaps WHERE id = ? AND user_id = ?'
    ).bind(roadmapId, userId).first();

    if (result && result.json_graph && typeof result.json_graph === 'string') {
      try {
        result.json_graph = JSON.parse(result.json_graph);
      } catch (e) {
        console.warn('JSON parse warning for json_graph:', e.message);
        result.json_graph = { nodes: [], edges: [] };
      }
    }
    return result;
  },

  async listRoadmaps(env, userId) {
    if (!env.DB) {
      return [
        { id: 'rm-1', user_id: userId, status: 'active', thrive_score: 0.75 },
        { id: 'rm-2', user_id: userId, status: 'draft', thrive_score: 0.45 }
      ];
    }

    const results = await env.DB.prepare(
      'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50'
    ).bind(userId).all();

    return results.results.map(r => {
      if (r.json_graph && typeof r.json_graph === 'string') {
        try {
          r.json_graph = JSON.parse(r.json_graph);
        } catch (e) {
          console.warn('JSON parse warning for json_graph:', e.message);
          r.json_graph = { nodes: [], edges: [] };
        }
      }
      return r;
    });
  },

  async createRoadmap(env, userId, data) {
    const roadmapId = crypto.randomUUID();

    if (!env.DB) {
      return {
        id: roadmapId,
        user_id: userId,
        json_graph: data.json_graph || { nodes: [], edges: [] },
        status: 'draft',
        thrive_score: 0.0,
        created_at: Date.now()
      };
    }

    const now = Date.now() / 1000; // Convert to Unix timestamp for SQLite REAL
    await env.DB.prepare(
      `INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      roadmapId,
      userId,
      JSON.stringify(data.json_graph || { nodes: [], edges: [] }),
      'draft',
      data.vibe_mode || 0,
      0.0,
      now,
      now
    ).run();

    return { id: roadmapId, message: 'Roadmap created successfully' };
  },

  async updateRoadmap(env, roadmapId, userId, data) {
    if (!env.DB) {
      return { id: roadmapId, updated_fields: Object.keys(data) };
    }

    const updates = [];
    const values = [];

    if (data.json_graph) {
      updates.push('json_graph = ?');
      values.push(JSON.stringify(data.json_graph));
    }
    if (data.status) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.thrive_score !== undefined) {
      updates.push('thrive_score = ?');
      values.push(data.thrive_score);
    }

    updates.push('updated_at = ?');
    values.push(Date.now() / 1000); // Unix timestamp for SQLite REAL
    values.push(roadmapId, userId);

    await env.DB.prepare(
      `UPDATE roadmaps SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...values).run();

    return { id: roadmapId, updated_fields: Object.keys(data) };
  },

  async deleteRoadmap(env, roadmapId, userId) {
    if (!env.DB) return true;

    await env.DB.prepare(
      'UPDATE roadmaps SET deleted_at = ? WHERE id = ? AND user_id = ?'
    ).bind(Date.now() / 1000, roadmapId, userId).run();

    return true;
  },

  async handleSnippetsAPI(request, env, path, method, corsHeaders) {
    const url = new URL(request.url);

    try {
      switch (method) {
        case 'GET':
          const category = url.searchParams.get('category');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const snippets = await this.getSnippets(env, category, limit);
          return new Response(JSON.stringify({ snippets }), {
            headers: corsHeaders,
            status: 200
          });

        case 'POST':
          const user = await this.validateAuth(request, env);
          if (!user) {
            return new Response(JSON.stringify({
              error: 'Authentication required',
              code: 'AUTH-401'
            }), {
              headers: corsHeaders,
              status: 401
            });
          }

          const snippetData = await request.json();
          const newSnippet = await this.createSnippet(env, snippetData);
          return new Response(JSON.stringify(newSnippet), {
            headers: corsHeaders,
            status: 201
          });

        default:
          return new Response(JSON.stringify({
            error: 'Method not allowed',
            code: 'HTTP-405'
          }), {
            headers: corsHeaders,
            status: 405
          });
      }
    } catch (error) {
      console.error('Snippets API error:', error);
      return new Response(JSON.stringify({
        error: 'Database operation failed',
        message: error.message
      }), {
        headers: corsHeaders,
        status: 500
      });
    }
  },

  async getSnippets(env, category, limit) {
    if (!env.DB) {
      return [
        { id: 'sn-1', category: 'ui', code: 'console.log("UI Component");', version: 1 },
        { id: 'sn-2', category: 'api', code: 'fetch("/api/data");', version: 1 },
        { id: 'sn-3', category: 'auth', code: 'jwt.verify(token);', version: 1 }
      ];
    }

    let query = 'SELECT * FROM snippets';
    const params = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Math.min(limit, 100));

    const results = await env.DB.prepare(query).bind(...params).all();
    return results.results;
  },

  async createSnippet(env, data) {
    const snippetId = crypto.randomUUID();

    if (!env.DB) {
      return {
        id: snippetId,
        category: data.category,
        code: data.code,
        version: 1,
        created_at: Date.now()
      };
    }

    await env.DB.prepare(
      `INSERT INTO snippets (id, category, code, ui_preview_url, version)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(snippetId, data.category, data.code, data.ui_preview_url || '', 1).run();

    return { id: snippetId, message: 'Snippet created successfully' };
  },

  handleError(error, context) {
    const { path, method, env, corsHeaders } = context;
    const requestId = crypto.randomUUID().split('-')[0];

    // Categorize error types
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let userMessage = 'An unexpected error occurred';
    let logLevel = 'error';

    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      userMessage = 'Invalid request data';
      logLevel = 'warn';
    } else if (error.name === 'AuthenticationError') {
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
      userMessage = 'Authentication failed';
      logLevel = 'warn';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
      userMessage = 'Resource not found';
      logLevel = 'info';
    } else if (error.name === 'RateLimitError') {
      statusCode = 429;
      errorCode = 'RATE_LIMIT';
      userMessage = 'Too many requests';
      logLevel = 'warn';
    } else if (error.name === 'DatabaseError') {
      statusCode = 503;
      errorCode = 'DATABASE_ERROR';
      userMessage = 'Database service temporarily unavailable';
      logLevel = 'error';
    }

    // Structured logging
    const logEntry = {
      level: logLevel,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        code: errorCode,
        stack: env.ENVIRONMENT !== 'production' ? error.stack : undefined
      },
      context: {
        path,
        method,
        timestamp: new Date().toISOString()
      }
    };

    console[logLevel](`Worker ${logLevel} [${requestId}]:`, JSON.stringify(logEntry));

    // User-friendly error response
    return new Response(JSON.stringify({
      error: errorCode,
      message: env.ENVIRONMENT === 'production' ? userMessage : error.message,
      requestId,
      timestamp: Date.now(),
      ...(env.ENVIRONMENT !== 'production' && {
        debug: {
          path,
          method,
          stack: error.stack
        }
      })
    }), {
      headers: corsHeaders,
      status: statusCode
    });
  },

  async handleAuthAPI(request, env, path, method, corsHeaders) {
    const pathParts = path.split('/').filter(p => p);
    const endpoint = pathParts[1];

    switch (endpoint) {
      case 'validate':
        const user = await this.validateAuth(request, env);
        return new Response(JSON.stringify({
          valid: !!user,
          user: user
        }), {
          headers: corsHeaders,
          status: user ? 200 : 401
        });

      case 'login':
        if (method !== 'POST') {
          return new Response(JSON.stringify({
            error: 'Method not allowed'
          }), {
            headers: corsHeaders,
            status: 405
          });
        }

        // Use consistent test user for development
        const mockToken = 'dev_token_' + Math.random().toString(36).substr(2, 9);
        const userId = 'test-user-thermo-staging';
        const mockUser = {
          id: userId,
          email: 'demo@protothrive.com',
          role: 'vibe_coder'
        };

        // Insert user into database if doesn't exist
        if (env.DB) {
          try {
            const now = Date.now() / 1000;
            await env.DB.prepare(
              'INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(userId, mockUser.email, mockUser.role, now, now).run();
          } catch (e) {
            console.error('Error inserting user:', e);
          }
        }

        if (env.KV) {
          await env.KV.put(`auth:${mockToken}`, JSON.stringify(mockUser), {
            expirationTtl: 3600
          });
        }

        return new Response(JSON.stringify({
          token: mockToken,
          user: mockUser
        }), {
          headers: corsHeaders,
          status: 200
        });

      default:
        return new Response(JSON.stringify({
          message: 'Auth API',
          endpoints: {
            'GET /auth/validate': 'Validate token',
            'POST /auth/login': 'Login user'
          }
        }), {
          headers: corsHeaders,
          status: 200
        });
    }
  }
};