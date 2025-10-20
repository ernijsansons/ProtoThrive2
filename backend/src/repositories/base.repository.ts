/**
 * Base Repository Pattern Implementation
 * Provides common database operations with type safety
 *
 * Features:
 * - Generic CRUD operations
 * - Transaction support
 * - Soft delete capability
 * - Audit logging
 * - Cache integration
 */

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  includeDeleted?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Base Repository class with common database operations
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected db: D1Database;
  protected tableName: string;
  protected cache?: KVNamespace;

  constructor(db: D1Database, tableName: string, cache?: KVNamespace) {
    this.db = db;
    this.tableName = tableName;
    this.cache = cache;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null> {
    try {
      // Check cache first
      if (this.cache) {
        const cacheKey = this.getCacheKey('id', id);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      }

      const query = options?.includeDeleted
        ? `SELECT * FROM ${this.tableName} WHERE id = ?`
        : `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`;

      const result = await this.db
        .prepare(query)
        .bind(id)
        .first<T>();

      // Cache result
      if (result && this.cache) {
        const cacheKey = this.getCacheKey('id', id);
        await this.cache.put(cacheKey, JSON.stringify(result), {
          expirationTtl: 3600, // 1 hour
        });
      }

      return result;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Find all entities with pagination
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        includeDeleted = false,
      } = options;

      const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total FROM ${this.tableName}
        ${whereClause}
      `;

      const [dataResult, countResult] = await Promise.all([
        this.db.prepare(query).bind(limit, offset).all<T>(),
        this.db.prepare(countQuery).first<{ total: number }>(),
      ]);

      const total = countResult?.total || 0;
      const page = Math.floor(offset / limit) + 1;

      return {
        data: dataResult.results || [],
        total,
        page,
        pageSize: limit,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const id = this.generateId();
      const now = new Date().toISOString();

      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');

      const query = `
        INSERT INTO ${this.tableName} (id, ${columns.join(', ')}, created_at, updated_at)
        VALUES (?, ${placeholders}, ?, ?)
      `;

      await this.db
        .prepare(query)
        .bind(id, ...values, now, now)
        .run();

      const created = await this.findById(id);
      if (!created) {
        throw new Error('Failed to retrieve created entity');
      }

      // Invalidate list cache
      await this.invalidateListCache();

      return created;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T> {
    try {
      const now = new Date().toISOString();
      const updates = Object.keys(data);
      const values = Object.values(data);

      const setClause = updates.map((key) => `${key} = ?`).join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const result = await this.db
        .prepare(query)
        .bind(...values, now, id)
        .run();

      if (result.meta?.changes === 0) {
        throw new Error(`${this.tableName} not found or already deleted`);
      }

      // Invalidate cache
      await this.invalidateCache(id);

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated entity');
      }

      return updated;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete entity by ID
   */
  async softDelete(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      const query = `
        UPDATE ${this.tableName}
        SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `;

      const result = await this.db
        .prepare(query)
        .bind(now, now, id)
        .run();

      if (result.meta?.changes === 0) {
        throw new Error(`${this.tableName} not found or already deleted`);
      }

      // Invalidate cache
      await this.invalidateCache(id);
    } catch (error) {
      console.error(`Error soft deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete entity by ID (permanent)
   */
  async hardDelete(id: string): Promise<void> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;

      const result = await this.db
        .prepare(query)
        .bind(id)
        .run();

      if (result.meta?.changes === 0) {
        throw new Error(`${this.tableName} not found`);
      }

      // Invalidate cache
      await this.invalidateCache(id);
    } catch (error) {
      console.error(`Error hard deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute query with transaction support
   */
  protected async executeInTransaction(
    queries: Array<{ sql: string; params: any[] }>
  ): Promise<void> {
    try {
      const statements = queries.map(({ sql, params }) =>
        this.db.prepare(sql).bind(...params)
      );

      await this.db.batch(statements);
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  /**
   * Generate unique ID (UUID v4)
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get cache key for entity
   */
  protected getCacheKey(type: string, value: string): string {
    return `${this.tableName}:${type}:${value}`;
  }

  /**
   * Invalidate entity cache
   */
  protected async invalidateCache(id: string): Promise<void> {
    if (this.cache) {
      const cacheKey = this.getCacheKey('id', id);
      await this.cache.delete(cacheKey);
      await this.invalidateListCache();
    }
  }

  /**
   * Invalidate list cache
   */
  protected async invalidateListCache(): Promise<void> {
    if (this.cache) {
      const listCacheKey = `${this.tableName}:list`;
      await this.cache.delete(listCacheKey);
    }
  }

  /**
   * Count entities
   */
  async count(where?: string, params?: any[]): Promise<number> {
    try {
      const whereClause = where ? `WHERE ${where}` : 'WHERE deleted_at IS NULL';
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;

      const stmt = this.db.prepare(query);
      const result = params
        ? await stmt.bind(...params).first<{ count: number }>()
        : await stmt.first<{ count: number }>();

      return result?.count || 0;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}
