/**
 * Roadmap Repository
 * Data access layer for roadmap entities
 */

import { BaseRepository, BaseEntity } from './base.repository';

export interface RoadmapNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed';
    assignee?: string;
    dueDate?: string;
  };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}

export interface Roadmap extends BaseEntity {
  user_id: string;
  tenant_id?: string | null;
  title: string;
  description?: string | null;
  status: 'draft' | 'active' | 'completed' | 'archived';
  visibility: 'private' | 'shared' | 'public';
  nodes: string; // JSON string of RoadmapNode[]
  edges: string; // JSON string of RoadmapEdge[]
  thrive_score?: number | null;
  completion_percentage?: number | null;
  last_calculated_at?: Date | null;
  tags?: string | null; // JSON string of string[]
  metadata?: string | null; // JSON string for extensibility
}

export class RoadmapRepository extends BaseRepository<Roadmap> {
  constructor(db: D1Database, cache?: KVNamespace) {
    super(db, 'roadmaps', cache);
  }

  /**
   * Find roadmaps by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      status?: Roadmap['status'];
      limit?: number;
      offset?: number;
    }
  ): Promise<Roadmap[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      const params: any[] = [userId];

      if (options?.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      query += ' ORDER BY updated_at DESC';

      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);

        if (options.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all<Roadmap>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding roadmaps by user:', error);
      throw error;
    }
  }

  /**
   * Find roadmaps by tenant
   */
  async findByTenant(
    tenantId: string,
    options?: {
      status?: Roadmap['status'];
      limit?: number;
    }
  ): Promise<Roadmap[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE tenant_id = ? AND deleted_at IS NULL
      `;

      const params: any[] = [tenantId];

      if (options?.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      query += ' ORDER BY updated_at DESC';

      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all<Roadmap>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding roadmaps by tenant:', error);
      throw error;
    }
  }

  /**
   * Find shared roadmaps
   */
  async findShared(options?: { limit?: number }): Promise<Roadmap[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE visibility IN ('shared', 'public') AND deleted_at IS NULL
        ORDER BY thrive_score DESC, updated_at DESC
      `;

      if (options?.limit) {
        query += ' LIMIT ?';
      }

      const stmt = this.db.prepare(query);

      const result = options?.limit
        ? await stmt.bind(options.limit).all<Roadmap>()
        : await stmt.all<Roadmap>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding shared roadmaps:', error);
      throw error;
    }
  }

  /**
   * Update thrive score
   */
  async updateThriveScore(
    roadmapId: string,
    thriveScore: number,
    completionPercentage: number
  ): Promise<void> {
    try {
      const now = new Date().toISOString();

      const query = `
        UPDATE ${this.tableName}
        SET
          thrive_score = ?,
          completion_percentage = ?,
          last_calculated_at = ?,
          updated_at = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(thriveScore, completionPercentage, now, now, roadmapId)
        .run();

      await this.invalidateCache(roadmapId);
    } catch (error) {
      console.error('Error updating thrive score:', error);
      throw error;
    }
  }

  /**
   * Update roadmap status
   */
  async updateStatus(roadmapId: string, status: Roadmap['status']): Promise<void> {
    try {
      const now = new Date().toISOString();

      const query = `
        UPDATE ${this.tableName}
        SET status = ?, updated_at = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(status, now, roadmapId)
        .run();

      await this.invalidateCache(roadmapId);
    } catch (error) {
      console.error('Error updating roadmap status:', error);
      throw error;
    }
  }

  /**
   * Search roadmaps by title or description
   */
  async search(
    query: string,
    userId?: string,
    limit: number = 20
  ): Promise<Roadmap[]> {
    try {
      const searchQuery = `
        SELECT * FROM ${this.tableName}
        WHERE (title LIKE ? OR description LIKE ?)
        AND deleted_at IS NULL
        ${userId ? 'AND user_id = ?' : ''}
        ORDER BY thrive_score DESC, updated_at DESC
        LIMIT ?
      `;

      const searchTerm = `%${query}%`;
      const params = userId
        ? [searchTerm, searchTerm, userId, limit]
        : [searchTerm, searchTerm, limit];

      const result = await this.db
        .prepare(searchQuery)
        .bind(...params)
        .all<Roadmap>();

      return result.results || [];
    } catch (error) {
      console.error('Error searching roadmaps:', error);
      throw error;
    }
  }

  /**
   * Get roadmap statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    draft: number;
    active: number;
    completed: number;
    archived: number;
    avgThriveScore: number;
    avgCompletion: number;
  }> {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
          AVG(COALESCE(thrive_score, 0)) as avgThriveScore,
          AVG(COALESCE(completion_percentage, 0)) as avgCompletion
        FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      const result = await this.db
        .prepare(query)
        .bind(userId)
        .first<any>();

      return {
        total: result?.total || 0,
        draft: result?.draft || 0,
        active: result?.active || 0,
        completed: result?.completed || 0,
        archived: result?.archived || 0,
        avgThriveScore: result?.avgThriveScore || 0,
        avgCompletion: result?.avgCompletion || 0,
      };
    } catch (error) {
      console.error('Error getting user roadmap stats:', error);
      throw error;
    }
  }

  /**
   * Archive old roadmaps
   */
  async archiveOldRoadmaps(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const query = `
        UPDATE ${this.tableName}
        SET status = 'archived', updated_at = ?
        WHERE status = 'completed'
        AND updated_at < ?
        AND deleted_at IS NULL
      `;

      const result = await this.db
        .prepare(query)
        .bind(new Date().toISOString(), cutoffDate.toISOString())
        .run();

      return result.meta?.changes || 0;
    } catch (error) {
      console.error('Error archiving old roadmaps:', error);
      throw error;
    }
  }

  /**
   * Get trending roadmaps (high thrive score, recently updated)
   */
  async getTrending(limit: number = 10): Promise<Roadmap[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE visibility = 'public'
        AND status IN ('active', 'completed')
        AND deleted_at IS NULL
        AND thrive_score IS NOT NULL
        AND updated_at > datetime('now', '-30 days')
        ORDER BY thrive_score DESC, updated_at DESC
        LIMIT ?
      `;

      const result = await this.db
        .prepare(query)
        .bind(limit)
        .all<Roadmap>();

      return result.results || [];
    } catch (error) {
      console.error('Error getting trending roadmaps:', error);
      throw error;
    }
  }
}
