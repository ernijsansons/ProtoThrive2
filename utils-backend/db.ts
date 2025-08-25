// Ref: CLAUDE.md Terminal 1 Phase 1 - Database Utilities
// Thermonuclear Database Functions for ProtoThrive

import { mockDbQuery, generateMockUUID } from '../utils/mocks';

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
export async function queryRoadmap(id: string, userId: string): Promise<Roadmap> {
  const result = mockDbQuery(
    'SELECT * FROM roadmaps WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  if (!result.success || result.results.length === 0) {
    throw new Error('GRAPH-404: Roadmap not found');
  }

  const row = result.results[0];
  return {
    ...row,
    vibe_mode: row.vibe_mode === 1 // Convert integer to boolean
  };
}

/**
 * Query all roadmaps for a user
 */
export async function queryUserRoadmaps(userId: string, status?: string): Promise<Roadmap[]> {
  let query = 'SELECT * FROM roadmaps WHERE user_id = ?';
  const binds = [userId];
  
  if (status) {
    query += ' AND status = ?';
    binds.push(status);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  const result = mockDbQuery(query, binds);
  
  if (!result.success) {
    throw new Error('DB-500: Failed to query roadmaps');
  }
  
  return result.results.map(row => ({
    ...row,
    vibe_mode: row.vibe_mode === 1
  }));
}

/**
 * Insert a new roadmap
 * Ref: CLAUDE.md Terminal 1 - Dummy inserts
 */
export async function insertRoadmap(
  userId: string, 
  body: { json_graph: string; vibe_mode: boolean }
): Promise<{ id: string }> {
  const id = generateMockUUID();
  
  const result = mockDbQuery(
    'INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score) VALUES (?, ?, ?, "draft", ?, 0.0)',
    [id, userId, body.json_graph, body.vibe_mode ? 1 : 0]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to insert roadmap');
  }
  
  return { id };
}

/**
 * Update roadmap status
 */
export async function updateRoadmapStatus(
  id: string, 
  userId: string, 
  status: Roadmap['status']
): Promise<void> {
  const result = mockDbQuery(
    'UPDATE roadmaps SET status = ? WHERE id = ? AND user_id = ?',
    [status, id, userId]
  );
  
  if (!result.success || result.meta?.rows_affected === 0) {
    throw new Error('GRAPH-404: Roadmap not found or unauthorized');
  }
}

/**
 * Update roadmap thrive score
 */
export async function updateRoadmapScore(
  id: string, 
  score: number
): Promise<void> {
  const result = mockDbQuery(
    'UPDATE roadmaps SET thrive_score = ? WHERE id = ?',
    [score, id]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to update thrive score');
  }
}

/**
 * Query snippets by category
 */
export async function querySnippets(category?: string): Promise<Snippet[]> {
  let query = 'SELECT * FROM snippets';
  const binds: any[] = [];
  
  if (category) {
    query += ' WHERE category = ?';
    binds.push(category);
  }
  
  query += ' ORDER BY updated_at DESC';
  
  const result = mockDbQuery(query, binds);
  
  if (!result.success) {
    throw new Error('DB-500: Failed to query snippets');
  }
  
  return result.results;
}

/**
 * Insert a new snippet
 */
export async function insertSnippet(
  snippet: { category: string; code: string; ui_preview_url?: string }
): Promise<{ id: string }> {
  const id = generateMockUUID();
  
  const result = mockDbQuery(
    'INSERT INTO snippets (id, category, code, ui_preview_url) VALUES (?, ?, ?, ?)',
    [id, snippet.category, snippet.code, snippet.ui_preview_url || null]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to insert snippet');
  }
  
  return { id };
}

/**
 * Insert agent log
 */
export async function insertAgentLog(log: Omit<AgentLog, 'id' | 'timestamp'>): Promise<{ id: string }> {
  const id = generateMockUUID();
  
  const result = mockDbQuery(
    'INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, log.roadmap_id, log.task_type, log.output, log.status, log.model_used, log.token_count]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to insert agent log');
  }
  
  return { id };
}

/**
 * Query agent logs for a roadmap
 */
export async function queryAgentLogs(roadmapId: string): Promise<AgentLog[]> {
  const result = mockDbQuery(
    'SELECT * FROM agent_logs WHERE roadmap_id = ? ORDER BY timestamp DESC',
    [roadmapId]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to query agent logs');
  }
  
  return result.results;
}

/**
 * Insert insight
 */
export async function insertInsight(
  insight: Omit<Insight, 'id' | 'created_at'>
): Promise<{ id: string }> {
  const id = generateMockUUID();
  
  const result = mockDbQuery(
    'INSERT INTO insights (id, roadmap_id, type, data, score) VALUES (?, ?, ?, ?, ?)',
    [id, insight.roadmap_id, insight.type, insight.data, insight.score]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to insert insight');
  }
  
  return { id };
}

/**
 * Soft delete user (GDPR compliance)
 * Ref: CLAUDE.md Global Governance & Compliance
 */
export async function softDeleteUser(userId: string): Promise<void> {
  const result = mockDbQuery(
    'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
    [userId]
  );
  
  if (!result.success) {
    throw new Error('DB-500: Failed to soft delete user');
  }
  
  console.log(`Thermonuclear Soft Delete: User ${userId} marked for deletion`);
}