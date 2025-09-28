/**
 * Database Service for ProtoThrive
 */

export interface Env {
  DB: D1Database;
  KV_STORE: KVNamespace;
}

export class DatabaseService {
  public database: D1Database;
  private db: D1Database;
  private kv: KVNamespace | undefined;

  constructor(db: D1Database, kv?: KVNamespace) {
    this.db = db;
    this.database = db;
    this.kv = kv;
  }

  // Roadmap operations
  async queryRoadmaps(userId: string, params: any = {}) {
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    return this.getRoadmaps(userId, limit, offset);
  }

  async getRoadmap(roadmapId: string, userId: string) {
    return this.getRoadmapById(roadmapId);
  }

  async insertRoadmap(userId: string, data: any) {
    const result = await this.createRoadmap({ ...data, userId });
    return result.id;
  }

  async updateRoadmap(roadmapId: string, userId: string, data: any) {
    try {
      await this.updateRoadmapData(roadmapId, data);
      return true;
    } catch {
      return false;
    }
  }

  async updateRoadmapData(id: string, data: any) {
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        UPDATE roadmaps
        SET name = ?, description = ?, nodes = ?, edges = ?, thrive_score = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(
        data.name,
        data.description || '',
        JSON.stringify(data.nodes || []),
        JSON.stringify(data.edges || []),
        data.thriveScore || 0,
        now,
        id
      )
      .run();

    // Invalidate cache
    if (this.kv) {
      await this.kv.delete(`roadmap:${id}`);
    }

    return { id, ...data, updated_at: now };
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

      const result = await this.db
        .prepare('SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
        .bind(userId, limit, offset)
        .all();

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

      await this.db
        .prepare(`
          INSERT INTO roadmaps (id, user_id, name, description, nodes, edges, thrive_score, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          data.userId,
          data.name,
          data.description || '',
          JSON.stringify(data.nodes || []),
          JSON.stringify(data.edges || []),
          data.thriveScore || 0,
          now,
          now
        )
        .run();

      // Invalidate cache
      if (this.kv) {
        await this.kv.delete(`roadmaps:${data.userId}:*`);
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

  async updateRoadmap(id: string, data: any) {
    try {
      const now = new Date().toISOString();

      await this.db
        .prepare(`
          UPDATE roadmaps
          SET name = ?, description = ?, nodes = ?, edges = ?, thrive_score = ?, updated_at = ?
          WHERE id = ?
        `)
        .bind(
          data.name,
          data.description || '',
          JSON.stringify(data.nodes || []),
          JSON.stringify(data.edges || []),
          data.thriveScore || 0,
          now,
          id
        )
        .run();

      // Invalidate cache
      await this.kv.delete(`roadmap:${id}`);

      return { id, ...data, updated_at: now };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update roadmap');
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

      // Invalidate cache
      if (this.kv) {
        await this.kv.delete('snippets:*');
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

      await this.db
        .prepare(`
          INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(id, data.email, data.passwordHash, data.role || 'user', now, now)
        .run();

      return { id, email: data.email, role: data.role || 'user', created_at: now };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create user');
    }
  }
}