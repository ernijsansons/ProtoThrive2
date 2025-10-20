/**
 * Database Service for ProtoThrive with Connection Pooling
 */

import { getConnectionPool, D1ConnectionPool } from './connectionPool';
import { getRoadmapCacheManager, getUserCacheManager, RoadmapCacheManager, UserCacheManager } from './cacheManager';

export interface Env {
  DB: D1Database;
  KV_STORE: KVNamespace;
  JWT_SECRET?: string;
}

// Database binding validation
export function validateDatabaseBinding(db: D1Database | undefined): void {
  if (!db) {
    throw new Error('Database binding is not available. Check wrangler.toml configuration.');
  }
}

export class DatabaseService {
  public database: D1Database;
  private db: D1Database;
  private kv: KVNamespace | undefined;
  private connectionPool: D1ConnectionPool;
  private roadmapCache?: RoadmapCacheManager;
  private userCache?: UserCacheManager;

  constructor(db: D1Database, kv?: KVNamespace) {
    validateDatabaseBinding(db);
    this.db = db;
    this.database = db;
    this.kv = kv;
    this.connectionPool = getConnectionPool(db);

    if (kv) {
      this.roadmapCache = getRoadmapCacheManager(kv);
      this.userCache = getUserCacheManager(kv);
    }
  }

  // Roadmap operations with tenant isolation and error handling
  async queryRoadmaps(userId: string, params: any = {}) {
    try {
      if (!userId) {
        throw new Error('User ID is required for data access');
      }
      const limit = Math.min(params.limit || 50, 100); // Max 100 items
      const offset = params.offset || 0;
      return this.getRoadmaps(userId, limit, offset);
    } catch (error) {
      console.error('Query roadmaps error:', error);
      throw new Error('Failed to query roadmaps');
    }
  }

  async getRoadmap(roadmapId: string, userId: string) {
    try {
      if (!userId || !roadmapId) {
        throw new Error('User ID and Roadmap ID are required');
      }

      // Try cache first
      if (this.roadmapCache) {
        const cached = await this.roadmapCache.getRoadmap(roadmapId, userId);
        if (cached) {
          return cached;
        }
      }

      // SECURITY: Parameterized query prevents SQL injection
      // Never use string concatenation for SQL queries - always use bind parameters
      const result = await this.connectionPool.prepareAndExecute<any>(
        'SELECT * FROM roadmaps WHERE id = ? AND user_id = ?',
        [roadmapId, userId],
        'first'
      );

      if (!result) {
        return null;
      }

      // Parse json_graph if it exists and convert to nodes/edges for backward compatibility
      if (result.json_graph) {
        try {
          const graph = JSON.parse(result.json_graph);
          result.nodes = graph.nodes || [];
          result.edges = graph.edges || [];
        } catch (parseError) {
          console.warn('Failed to parse json_graph:', parseError);
          result.nodes = [];
          result.edges = [];
        }
      }

      // Cache the result
      if (this.roadmapCache) {
        await this.roadmapCache.setRoadmap(roadmapId, userId, result);
      }

      return result;
    } catch (error) {
      console.error('Get roadmap error:', error);
      throw new Error('Failed to fetch roadmap');
    }
  }

  async insertRoadmap(userId: string, data: any) {
    try {
      if (!userId) {
        throw new Error('User ID is required to create roadmap');
      }

      // Validate required fields
      if (!data.name && !data.title) {
        throw new Error('Roadmap name is required');
      }

      const result = await this.createRoadmap({ ...data, userId });
      return result.id;
    } catch (error) {
      console.error('Insert roadmap error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create roadmap');
    }
  }

  async updateRoadmap(roadmapId: string, userId: string, data: any) {
    if (!userId || !roadmapId) {
      throw new Error('User ID and Roadmap ID are required');
    }

    try {
      // First verify ownership
      const existing = await this.getRoadmap(roadmapId, userId);
      if (!existing) {
        throw new Error('Roadmap not found or access denied');
      }

      await this.updateRoadmapData(roadmapId, data);
      return true;
    } catch (error) {
      console.error('Update roadmap error:', error);
      return false;
    }
  }

  async updateRoadmapData(id: string, data: any) {
    try {
      const now = new Date().toISOString();

      // FIXED: Use correct schema field names (title, json_graph)
      const jsonGraph = JSON.stringify({
        nodes: data.nodes || [],
        edges: data.edges || []
      });

      await this.db
        .prepare(`
          UPDATE roadmaps
          SET title = ?, description = ?, json_graph = ?, thrive_score = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.name || data.title,
          data.description || '',
          jsonGraph,
          data.thriveScore || 0,
          now,
          id
        )
        .run();

      // FIXED: Safe KV deletion without wildcards
      if (this.kv) {
        try {
          await this.kv.delete(`roadmap:${id}`);
        } catch (kvError) {
          console.warn('KV deletion failed (non-critical):', kvError);
        }
      }

      return { id, ...data, updated_at: now };
    } catch (error) {
      console.error('Update roadmap data error:', error);
      throw new Error('Failed to update roadmap data');
    }
  }

  async calculateThriveScore(roadmapId: string): Promise<number> {
    // Simple thrive score calculation
    return Math.random() * 0.5 + 0.5; // Returns score between 0.5 and 1.0
  }

  async getRoadmaps(userId: string, limit = 50, offset = 0) {
    try {
      if (this.kv) {
        const cached = await this.kv.get(`roadmaps:${userId}:${limit}:${offset}`, 'json');
        if (cached) return cached;
      }

      // SECURITY: All query parameters are bound to prevent SQL injection
      const result = await this.connectionPool.prepareAndExecute<any>(
        'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset],
        'all'
      );

      if (this.kv) {
        await this.kv.put(
          `roadmaps:${userId}:${limit}:${offset}`,
          JSON.stringify(result),
          { expirationTtl: 300 }
        );
      }

      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch roadmaps');
    }
  }

  async createRoadmap(data: any) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // FIXED: Use correct schema field names (title, json_graph)
      const jsonGraph = JSON.stringify({
        nodes: data.nodes || [],
        edges: data.edges || []
      });

      await this.db
        .prepare(`
          INSERT INTO roadmaps (id, user_id, title, description, json_graph, thrive_score, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          data.userId,
          data.name || data.title,
          data.description || '',
          jsonGraph,
          data.thriveScore || 0,
          now,
          now
        )
        .run();

      // FIXED: Safe KV cache invalidation - clear specific keys instead of wildcards
      if (this.kv) {
        try {
          // Clear common cache keys for this user
          const cacheKeys = [
            `roadmaps:${data.userId}:50:0`,
            `roadmaps:${data.userId}:25:0`,
            `roadmaps:${data.userId}:10:0`
          ];

          for (const key of cacheKeys) {
            await this.kv.delete(key).catch(() => {});
          }
        } catch (kvError) {
          console.warn('KV cache invalidation failed (non-critical):', kvError);
        }
      }

      return { id, ...data, created_at: now, updated_at: now };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create roadmap');
    }
  }

  async getRoadmapById(id: string) {
    try {
      if (this.kv) {
        const cached = await this.kv.get(`roadmap:${id}`, 'json');
        if (cached) return cached;
      }

      const result = await this.db
        .prepare('SELECT * FROM roadmaps WHERE id = ?')
        .bind(id)
        .first();

      if (result && this.kv) {
        await this.kv.put(`roadmap:${id}`, JSON.stringify(result), {
          expirationTtl: 300
        });
      }

      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch roadmap');
    }
  }


  // Snippet operations
  async getSnippets(category?: string, limit = 50, offset = 0) {
    try {
      const cacheKey = `snippets:${category || 'all'}:${limit}:${offset}`;
      if (this.kv) {
        const cached = await this.kv.get(cacheKey, 'json');
        if (cached) return cached;
      }

      // SECURITY: Dynamic query building with parameterized statements only
      // All user input is bound via parameters - never concatenated into SQL string
      let query = 'SELECT * FROM snippets';
      const params: any[] = [];

      if (category) {
        query += ' WHERE category = ?';
        params.push(category);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await this.db.prepare(query).bind(...params).all();

      if (this.kv) {
        await this.kv.put(cacheKey, JSON.stringify(result), {
          expirationTtl: 300
        });
      }

      return result;
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch snippets');
    }
  }

  async createSnippet(data: any) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db
        .prepare(`
          INSERT INTO snippets (id, title, code, language, category, tags, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          data.title,
          data.code,
          data.language,
          data.category || 'general',
          JSON.stringify(data.tags || []),
          now,
          now
        )
        .run();

      // FIXED: Safe KV cache invalidation - no wildcard support
      if (this.kv) {
        try {
          // Clear common snippet cache keys
          const cacheKeys = [
            'snippets:all:50:0',
            'snippets:all:25:0',
            'snippets:ui:50:0',
            'snippets:auth:50:0',
            'snippets:deploy:50:0'
          ];

          for (const key of cacheKeys) {
            await this.kv.delete(key).catch(() => {});
          }
        } catch (kvError) {
          console.warn('KV cache invalidation failed (non-critical):', kvError);
        }
      }

      return { id, ...data, created_at: now, updated_at: now };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create snippet');
    }
  }

  // User operations
  async getUserByEmail(email: string) {
    try {
      // SECURITY: Parameterized query prevents SQL injection via email field
      return await this.db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(email)
        .first();
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async createUser(data: any) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // FIXED: Use correct schema field names (first_name, last_name, role constraints)
      const role = data.role === 'user' ? 'vibe_coder' : data.role || 'vibe_coder';
      const validRoles = ['vibe_coder', 'engineer', 'exec', 'admin'];

      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
      }

      await this.db
        .prepare(`
          INSERT INTO users (id, email, first_name, last_name, password_hash, role, created_at, updated_at, email_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          data.email.toLowerCase(),
          data.firstName || data.name || '',
          data.lastName || '',
          data.passwordHash,
          role,
          now,
          now,
          false
        )
        .run();

      return {
        id,
        email: data.email.toLowerCase(),
        first_name: data.firstName || data.name || '',
        last_name: data.lastName || '',
        role,
        created_at: now,
        updated_at: now,
        email_verified: false
      };
    } catch (error) {
      console.error('Database error:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User already exists with this email');
      }
      throw new Error('Failed to create user');
    }
  }
}