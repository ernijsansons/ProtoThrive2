// Ref: CLAUDE.md Terminal 1 Phase 1 - Database Utilities
// Thermonuclear Database Functions for ProtoThrive

import { D1Database } from '@cloudflare/workers-types';

export interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
  created_at: string;
  deleted_at: string | null;
}

export interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  vibe_mode: boolean;
  thrive_score: number;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  category: string;
  code: string;
  ui_preview_url: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  roadmap_id: string;
  task_type: string;
  output: string;
  status: 'success' | 'fail' | 'timeout' | 'escalated';
  model_used: string;
  token_count: number;
  timestamp: string;
}

export interface Insight {
  id: string;
  roadmap_id: string;
  type: 'performance' | 'usage' | 'quality' | 'cost';
  data: string;
  score: number;
  created_at: string;
}

/**
 * Query a roadmap by ID with user validation
 * Ref: CLAUDE.md Terminal 1 - Multi-tenant support
 */
export async function queryRoadmap(id: string, userId: string, env: { DB: D1Database }): Promise<Roadmap> {
  try {
    const stmt = env.DB.prepare('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?').bind(id, userId);
    const result = await stmt.first<Roadmap>();
    
    if (!result) {
      throw { code: 'GRAPH-404', message: 'Roadmap not found' };
    }
    
    return {
      ...result,
      vibe_mode: Boolean(result.vibe_mode) // Convert integer to boolean
    };
  } catch (e: any) {
    if (e.code === 'GRAPH-404') throw e;
    throw { code: 'DB-500', message: e.message || 'Database error' };
  }
}

/**
 * Query all roadmaps for a user
 */
export async function queryUserRoadmaps(userId: string, status: string | undefined, env: { DB: D1Database }): Promise<Roadmap[]> {
  try {
    let query = 'SELECT * FROM roadmaps WHERE user_id = ?';
    const binds = [userId];
    
    if (status) {
      query += ' AND status = ?';
      binds.push(status);
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const stmt = env.DB.prepare(query).bind(...binds);
    const { results } = await stmt.all<Roadmap>();
    
    return results.map(row => ({
      ...row,
      vibe_mode: Boolean(row.vibe_mode)
    }));
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to query roadmaps' };
  }
}

/**
 * Insert a new roadmap
 * Ref: CLAUDE.md Terminal 1 - Dummy inserts
 */
export async function insertRoadmap(
  userId: string, 
  body: { json_graph: string; vibe_mode: boolean },
  env: { DB: D1Database }
): Promise<{ id: string }> {
  try {
    const id = crypto.randomUUID();
    
    const stmt = env.DB.prepare(
      'INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) VALUES (?, ?, ?, "draft", ?, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    ).bind(id, userId, body.json_graph, body.vibe_mode ? 1 : 0);
    
    await stmt.run();
    console.log(`Thermonuclear Insert: Roadmap ${id} created`);
    
    return { id };
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to insert roadmap' };
  }
}

/**
 * Update roadmap status
 */
export async function updateRoadmapStatus(
  id: string, 
  userId: string, 
  status: Roadmap['status'],
  env: { DB: D1Database }
): Promise<void> {
  try {
    const stmt = env.DB.prepare(
      'UPDATE roadmaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).bind(status, id, userId);
    
    const result = await stmt.run();
    
    if (result.meta.changes === 0) {
      throw { code: 'GRAPH-404', message: 'Roadmap not found or unauthorized' };
    }
  } catch (e: any) {
    if (e.code === 'GRAPH-404') throw e;
    throw { code: 'DB-500', message: e.message || 'Failed to update status' };
  }
}

/**
 * Update roadmap thrive score
 */
export async function updateRoadmapScore(
  id: string, 
  score: number,
  env: { DB: D1Database }
): Promise<void> {
  try {
    const stmt = env.DB.prepare(
      'UPDATE roadmaps SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(score, id);
    
    await stmt.run();
    console.log(`Thermonuclear Score Update: Roadmap ${id} score ${score}`);
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to update thrive score' };
  }
}

/**
 * Query snippets by category
 */
export async function querySnippets(category: string | undefined, env: { DB: D1Database }): Promise<Snippet[]> {
  try {
    let query = 'SELECT * FROM snippets';
    const binds: any[] = [];
    
    if (category) {
      query += ' WHERE category = ?';
      binds.push(category);
    }
    
    query += ' ORDER BY updated_at DESC';
    
    const stmt = binds.length > 0 ? env.DB.prepare(query).bind(...binds) : env.DB.prepare(query);
    const { results } = await stmt.all<Snippet>();
    
    return results;
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to query snippets' };
  }
}

/**
 * Insert a new snippet
 */
export async function insertSnippet(
  snippet: { category: string; code: string; ui_preview_url?: string },
  env: { DB: D1Database }
): Promise<{ id: string }> {
  try {
    const id = crypto.randomUUID();
    
    const stmt = env.DB.prepare(
      'INSERT INTO snippets (id, category, code, ui_preview_url, version, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
    ).bind(id, snippet.category, snippet.code, snippet.ui_preview_url || null);
    
    await stmt.run();
    console.log(`Thermonuclear Insert: Snippet ${id} created`);
    
    return { id };
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to insert snippet' };
  }
}

/**
 * Insert agent log
 */
export async function insertAgentLog(log: Omit<AgentLog, 'id' | 'timestamp'>, env: { DB: D1Database }): Promise<{ id: string }> {
  try {
    const id = crypto.randomUUID();
    
    const stmt = env.DB.prepare(
      'INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(id, log.roadmap_id, log.task_type, log.output, log.status, log.model_used, log.token_count);
    
    await stmt.run();
    console.log(`Thermonuclear Insert: Agent log ${id} for roadmap ${log.roadmap_id}`);
    
    return { id };
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to insert agent log' };
  }
}

/**
 * Query agent logs for a roadmap
 */
export async function queryAgentLogs(roadmapId: string, env: { DB: D1Database }): Promise<AgentLog[]> {
  try {
    const stmt = env.DB.prepare(
      'SELECT * FROM agent_logs WHERE roadmap_id = ? ORDER BY timestamp DESC'
    ).bind(roadmapId);
    
    const { results } = await stmt.all<AgentLog>();
    
    return results;
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to query agent logs' };
  }
}

/**
 * Insert insight
 */
export async function insertInsight(
  insight: Omit<Insight, 'id' | 'created_at'>,
  env: { DB: D1Database }
): Promise<{ id: string }> {
  try {
    const id = crypto.randomUUID();
    
    const stmt = env.DB.prepare(
      'INSERT INTO insights (id, roadmap_id, type, data, score, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(id, insight.roadmap_id, insight.type, insight.data, insight.score);
    
    await stmt.run();
    console.log(`Thermonuclear Insert: Insight ${id} for roadmap ${insight.roadmap_id}`);
    
    return { id };
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to insert insight' };
  }
}

/**
 * Soft delete user (GDPR compliance)
 * Ref: CLAUDE.md Global Governance & Compliance
 */
export async function softDeleteUser(userId: string, env: { DB: D1Database }): Promise<void> {
  try {
    const stmt = env.DB.prepare(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(userId);
    
    await stmt.run();
    console.log(`Thermonuclear Soft Delete: User ${userId} marked for deletion`);
  } catch (e: any) {
    throw { code: 'DB-500', message: e.message || 'Failed to soft delete user' };
  }
}