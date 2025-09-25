// Ref: CLAUDE.md Phase 1 - Database utilities with D1 integration
// TypeScript implementation for Cloudflare Workers with Hono

export interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  vibe_mode: boolean;
  thrive_score: number;
  created_at?: string;
  updated_at?: string;
}

export interface Snippet {
  id: string;
  category: string;
  code: string;
  ui_preview_url?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface AgentLog {
  id: string;
  roadmap_id: string;
  task_type: string;
  output: string;
  status: 'success' | 'fail' | 'timeout' | 'escalated';
  model_used: string;
  token_count: number;
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
  created_at?: string;
  deleted_at?: string;
}

// Database class with D1 integration
export class Database {
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  public async initialize(): Promise<void> {
    console.log('Thermonuclear DB: Database initialized');
  }

  public async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      const result = await this.env.DB.prepare('SELECT 1 as health').first();
      const latency = Date.now() - start;
      
      if (result && result.health === 1) {
        return { status: 'healthy', latency };
      }
      
      return { status: 'unhealthy', latency };
    } catch (error) {
      const latency = Date.now() - start;
      console.error('DB Health Check Failed:', error);
      return { status: 'error', latency };
    }
  }

  // Roadmap operations
  public async queryRoadmap(id: string, userId: string): Promise<Roadmap | null> {
    try {
      const stmt = this.env.DB.prepare(`
        SELECT id, user_id, json_graph, status, vibe_mode, thrive_score,
               created_at, updated_at
        FROM roadmaps 
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `);
      
      const result = await stmt.bind(id, userId).first();
      
      if (!result) {
        console.log(`Thermonuclear DB: Roadmap ${id} not found for user ${userId}`);
        return null;
      }

      return {
        ...result,
        vibe_mode: Boolean(result.vibe_mode)
      } as Roadmap;
    } catch (error) {
      console.error('DB Error - queryRoadmap:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async queryUserRoadmaps(userId: string, limit: number = 50, offset: number = 0): Promise<Roadmap[]> {
    try {
      const stmt = this.env.DB.prepare(`
        SELECT id, user_id, json_graph, status, vibe_mode, thrive_score,
               created_at, updated_at
        FROM roadmaps
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const result = await stmt.bind(userId, limit, offset).all();
      
      return result.results.map((r: any) => ({
        ...r,
        vibe_mode: Boolean(r.vibe_mode)
      })) as Roadmap[];
    } catch (error) {
      console.error('DB Error - queryUserRoadmaps:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async insertRoadmap(userId: string, data: any): Promise<{ id: string }> {
    try {
      const id = crypto.randomUUID();
      
      const stmt = this.env.DB.prepare(`
        INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        id,
        userId,
        JSON.stringify(data.json_graph || {}),
        data.status || 'draft',
        data.vibe_mode ? 1 : 0,
        data.thrive_score || 0.0
      ).run();

      console.log(`Thermonuclear DB: Roadmap ${id} created for user ${userId}`);
      return { id };
    } catch (error) {
      console.error('DB Error - insertRoadmap:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async updateRoadmapStatus(id: string, userId: string, updates: any): Promise<boolean> {
    try {
      // SECURITY FIX: Validate inputs before building query
      if (!id || !userId) {
        throw new Error('Invalid ID parameters');
      }
      
      // Validate allowed status values
      const allowedStatuses = ['draft', 'active', 'completed', 'archived'];
      if (updates.status !== undefined && !allowedStatuses.includes(updates.status)) {
        throw new Error('Invalid status value');
      }
      
      // Validate thrive_score range
      if (updates.thrive_score !== undefined && (updates.thrive_score < 0 || updates.thrive_score > 1)) {
        throw new Error('Invalid thrive_score value');
      }
      
      // Build update query with individual statements for security
      if (updates.status !== undefined) {
        const stmt = this.env.DB.prepare(`
          UPDATE roadmaps 
          SET status = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `);
        await stmt.bind(updates.status, id, userId).run();
      }
      
      if (updates.json_graph !== undefined) {
        const stmt = this.env.DB.prepare(`
          UPDATE roadmaps 
          SET json_graph = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `);
        await stmt.bind(JSON.stringify(updates.json_graph), id, userId).run();
      }
      
      if (updates.thrive_score !== undefined) {
        const stmt = this.env.DB.prepare(`
          UPDATE roadmaps 
          SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `);
        await stmt.bind(updates.thrive_score, id, userId).run();
      }
      
      if (updates.vibe_mode !== undefined) {
        const stmt = this.env.DB.prepare(`
          UPDATE roadmaps 
          SET vibe_mode = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ? AND deleted_at IS NULL
        `);
        await stmt.bind(updates.vibe_mode ? 1 : 0, id, userId).run();
      }
      
      console.log(`Thermonuclear DB: Roadmap ${id} updated`);
      return true;
    } catch (error) {
      console.error('DB Error - updateRoadmapStatus:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async softDeleteRoadmap(id: string, userId: string): Promise<boolean> {
    try {
      const stmt = this.env.DB.prepare(`
        UPDATE roadmaps
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      `);
      
      const result = await stmt.bind(id, userId).run();
      
      console.log(`Thermonuclear DB: Roadmap ${id} soft deleted`);
      return result.changes > 0;
    } catch (error) {
      console.error('DB Error - softDeleteRoadmap:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  // User operations
  public async queryUser(userId: string): Promise<User | null> {
    try {
      const stmt = this.env.DB.prepare(`
        SELECT id, email, role, created_at, deleted_at
        FROM users
        WHERE id = ? AND deleted_at IS NULL
      `);
      
      const result = await stmt.bind(userId).first();
      return result as User | null;
    } catch (error) {
      console.error('DB Error - queryUser:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  // Snippet operations
  public async querySnippets(category?: string, limit: number = 50): Promise<Snippet[]> {
    try {
      // SECURITY FIX: Use parameterized query with validation
      if (limit < 1 || limit > 1000) {
        throw new Error('Invalid limit parameter');
      }
      
      if (category && !/^[a-zA-Z0-9_-]{1,50}$/.test(category)) {
        throw new Error('Invalid category parameter');
      }

      let stmt;
      if (category) {
        stmt = this.env.DB.prepare(`
          SELECT id, category, code, ui_preview_url, version, created_at, updated_at
          FROM snippets 
          WHERE category = ? 
          ORDER BY created_at DESC 
          LIMIT ?
        `);
        const result = await stmt.bind(category, limit).all();
        return result.results as Snippet[];
      } else {
        stmt = this.env.DB.prepare(`
          SELECT id, category, code, ui_preview_url, version, created_at, updated_at
          FROM snippets 
          ORDER BY created_at DESC 
          LIMIT ?
        `);
        const result = await stmt.bind(limit).all();
        return result.results as Snippet[];
      }
    } catch (error) {
      console.error('DB Error - querySnippets:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async insertSnippet(data: any): Promise<{ id: string }> {
    try {
      const id = crypto.randomUUID();
      
      const stmt = this.env.DB.prepare(`
        INSERT INTO snippets (id, category, code, ui_preview_url, version)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        id,
        data.category,
        data.code,
        data.ui_preview_url || '',
        data.version || 1
      ).run();

      console.log(`Thermonuclear DB: Snippet ${id} created`);
      return { id };
    } catch (error) {
      console.error('DB Error - insertSnippet:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  // Agent log operations
  public async insertAgentLog(data: AgentLog): Promise<{ id: string }> {
    try {
      const id = crypto.randomUUID();
      
      const stmt = this.env.DB.prepare(`
        INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      await stmt.bind(
        id,
        data.roadmap_id,
        data.task_type,
        data.output,
        data.status,
        data.model_used,
        data.token_count
      ).run();

      console.log(`Thermonuclear DB: Agent log ${id} created`);
      return { id };
    } catch (error) {
      console.error('DB Error - insertAgentLog:', error);
      throw new Error(`Database error: ${error}`);
    }
  }

  public async queryAgentLogs(roadmapId: string, limit: number = 50): Promise<AgentLog[]> {
    try {
      const stmt = this.env.DB.prepare(`
        SELECT * FROM agent_logs
        WHERE roadmap_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      
      const result = await stmt.bind(roadmapId, limit).all();
      
      return result.results as AgentLog[];
    } catch (error) {
      console.error('DB Error - queryAgentLogs:', error);
      throw new Error(`Database error: ${error}`);
    }
  }
}

export const createDatabase = (env: any) => new Database(env);

// Mock functions for development (following CLAUDE.md dummy data)
export const mockDbQuery = (query: string, binds?: any[]): any => {
  console.log(`THERMONUCLEAR MOCK DB: ${query} - Binds: ${JSON.stringify(binds)}`);
  return {
    results: [{
      id: 'uuid-thermo-1',
      user_id: 'uuid-thermo-1',
      json_graph: '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
      vibe_mode: true,
      thrive_score: 0.45
    }]
  };
};

// Helper function to calculate thrive score (following CLAUDE.md formula)
export function calculateThriveScore(logs: AgentLog[]): number {
  if (!logs || logs.length === 0) return 0.0;

  const successLogs = logs.filter(l => l.status === 'success');
  const uiLogs = logs.filter(l => l.task_type === 'ui');
  const failLogs = logs.filter(l => l.status === 'fail');

  const completion = (successLogs.length / logs.length) * 0.6;
  const uiPolish = (uiLogs.length / logs.length) * 0.3;
  const risk = (1 - (failLogs.length / logs.length)) * 0.1;

  const score = completion + uiPolish + risk;
  
  console.log(`Thermonuclear Thrive Score: ${score.toFixed(2)} - Status: ${score > 0.5 ? 'neon' : 'gray'}`);
  
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}