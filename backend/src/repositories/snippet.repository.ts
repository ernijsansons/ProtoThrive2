/**
 * Snippet Repository
 * Data access layer for code snippet entities
 */

import { BaseRepository, BaseEntity } from './base.repository';

export interface Snippet extends BaseEntity {
  user_id: string;
  tenant_id?: string | null;
  title: string;
  description?: string | null;
  language: string;
  code: string;
  category?: string | null;
  tags?: string | null; // JSON string of string[]
  visibility: 'private' | 'shared' | 'public';
  usage_count: number;
  last_used_at?: Date | null;
  metadata?: string | null;
}

export class SnippetRepository extends BaseRepository<Snippet> {
  constructor(db: D1Database, cache?: KVNamespace) {
    super(db, 'snippets', cache);
  }

  /**
   * Find snippets by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      language?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Snippet[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      const params: any[] = [userId];

      if (options?.language) {
        query += ' AND language = ?';
        params.push(options.language);
      }

      if (options?.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      query += ' ORDER BY last_used_at DESC, updated_at DESC';

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
        .all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding snippets by user:', error);
      throw error;
    }
  }

  /**
   * Find snippets by language
   */
  async findByLanguage(
    language: string,
    options?: { limit?: number }
  ): Promise<Snippet[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE language = ? AND visibility IN ('shared', 'public') AND deleted_at IS NULL
        ORDER BY usage_count DESC, updated_at DESC
      `;

      if (options?.limit) {
        query += ' LIMIT ?';
      }

      const stmt = this.db.prepare(query);

      const result = options?.limit
        ? await stmt.bind(language, options.limit).all<Snippet>()
        : await stmt.bind(language).all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding snippets by language:', error);
      throw error;
    }
  }

  /**
   * Find snippets by category
   */
  async findByCategory(
    category: string,
    options?: { limit?: number }
  ): Promise<Snippet[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE category = ? AND visibility IN ('shared', 'public') AND deleted_at IS NULL
        ORDER BY usage_count DESC, updated_at DESC
      `;

      if (options?.limit) {
        query += ' LIMIT ?';
      }

      const stmt = this.db.prepare(query);

      const result = options?.limit
        ? await stmt.bind(category, options.limit).all<Snippet>()
        : await stmt.bind(category).all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding snippets by category:', error);
      throw error;
    }
  }

  /**
   * Find snippets by tenant
   */
  async findByTenant(
    tenantId: string,
    options?: { limit?: number }
  ): Promise<Snippet[]> {
    try {
      let query = `
        SELECT * FROM ${this.tableName}
        WHERE tenant_id = ? AND deleted_at IS NULL
        ORDER BY usage_count DESC, updated_at DESC
      `;

      if (options?.limit) {
        query += ' LIMIT ?';
      }

      const stmt = this.db.prepare(query);

      const result = options?.limit
        ? await stmt.bind(tenantId, options.limit).all<Snippet>()
        : await stmt.bind(tenantId).all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding snippets by tenant:', error);
      throw error;
    }
  }

  /**
   * Search snippets by title, description, or code
   */
  async search(
    query: string,
    userId?: string,
    limit: number = 20
  ): Promise<Snippet[]> {
    try {
      const searchQuery = `
        SELECT * FROM ${this.tableName}
        WHERE (title LIKE ? OR description LIKE ? OR code LIKE ?)
        AND deleted_at IS NULL
        ${userId ? 'AND user_id = ?' : 'AND visibility IN (\'shared\', \'public\')'}
        ORDER BY usage_count DESC, updated_at DESC
        LIMIT ?
      `;

      const searchTerm = `%${query}%`;
      const params = userId
        ? [searchTerm, searchTerm, searchTerm, userId, limit]
        : [searchTerm, searchTerm, searchTerm, limit];

      const result = await this.db
        .prepare(searchQuery)
        .bind(...params)
        .all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error searching snippets:', error);
      throw error;
    }
  }

  /**
   * Get popular snippets (most used)
   */
  async getPopular(limit: number = 20): Promise<Snippet[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE visibility IN ('shared', 'public') AND deleted_at IS NULL
        ORDER BY usage_count DESC, updated_at DESC
        LIMIT ?
      `;

      const result = await this.db
        .prepare(query)
        .bind(limit)
        .all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error getting popular snippets:', error);
      throw error;
    }
  }

  /**
   * Get recent snippets
   */
  async getRecent(limit: number = 20): Promise<Snippet[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE visibility IN ('shared', 'public') AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const result = await this.db
        .prepare(query)
        .bind(limit)
        .all<Snippet>();

      return result.results || [];
    } catch (error) {
      console.error('Error getting recent snippets:', error);
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsageCount(snippetId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      const query = `
        UPDATE ${this.tableName}
        SET usage_count = usage_count + 1, last_used_at = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(now, snippetId)
        .run();

      await this.invalidateCache(snippetId);
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw error;
    }
  }

  /**
   * Get snippet statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
    totalUsage: number;
    mostUsed?: Snippet;
  }> {
    try {
      // Get total count
      const totalQuery = `
        SELECT COUNT(*) as total, SUM(usage_count) as totalUsage
        FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
      `;

      const totalResult = await this.db
        .prepare(totalQuery)
        .bind(userId)
        .first<{ total: number; totalUsage: number }>();

      // Get language breakdown
      const languageQuery = `
        SELECT language, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
        GROUP BY language
      `;

      const languageResult = await this.db
        .prepare(languageQuery)
        .bind(userId)
        .all<{ language: string; count: number }>();

      const byLanguage: Record<string, number> = {};
      for (const row of languageResult.results || []) {
        byLanguage[row.language] = row.count;
      }

      // Get category breakdown
      const categoryQuery = `
        SELECT category, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL AND category IS NOT NULL
        GROUP BY category
      `;

      const categoryResult = await this.db
        .prepare(categoryQuery)
        .bind(userId)
        .all<{ category: string; count: number }>();

      const byCategory: Record<string, number> = {};
      for (const row of categoryResult.results || []) {
        byCategory[row.category] = row.count;
      }

      // Get most used snippet
      const mostUsedQuery = `
        SELECT * FROM ${this.tableName}
        WHERE user_id = ? AND deleted_at IS NULL
        ORDER BY usage_count DESC
        LIMIT 1
      `;

      const mostUsed = await this.db
        .prepare(mostUsedQuery)
        .bind(userId)
        .first<Snippet>();

      return {
        total: totalResult?.total || 0,
        totalUsage: totalResult?.totalUsage || 0,
        byLanguage,
        byCategory,
        mostUsed: mostUsed || undefined,
      };
    } catch (error) {
      console.error('Error getting snippet stats:', error);
      throw error;
    }
  }

  /**
   * Get snippets by tags
   */
  async findByTags(
    tags: string[],
    options?: { limit?: number }
  ): Promise<Snippet[]> {
    try {
      // Note: This is a simplified implementation
      // For production, consider using a proper full-text search or tags table
      const snippets = await this.findAll({
        limit: options?.limit || 100,
      });

      return snippets.data.filter((snippet) => {
        if (!snippet.tags) return false;

        const snippetTags: string[] = JSON.parse(snippet.tags);
        return tags.some((tag) =>
          snippetTags.some((st) => st.toLowerCase().includes(tag.toLowerCase()))
        );
      });
    } catch (error) {
      console.error('Error finding snippets by tags:', error);
      throw error;
    }
  }

  /**
   * Get all unique languages
   */
  async getLanguages(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT language
        FROM ${this.tableName}
        WHERE deleted_at IS NULL
        ORDER BY language ASC
      `;

      const result = await this.db
        .prepare(query)
        .all<{ language: string }>();

      return (result.results || []).map((r) => r.language);
    } catch (error) {
      console.error('Error getting languages:', error);
      throw error;
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category
        FROM ${this.tableName}
        WHERE deleted_at IS NULL AND category IS NOT NULL
        ORDER BY category ASC
      `;

      const result = await this.db
        .prepare(query)
        .all<{ category: string }>();

      return (result.results || []).map((r) => r.category);
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }
}
