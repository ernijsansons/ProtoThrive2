/**
 * Enhanced KV Cache Manager for ProtoThrive
 * Provides intelligent caching with TTL, invalidation, and warming strategies
 */

interface CacheOptions {
  ttl?: number;           // Time to live in seconds
  tags?: string[];        // Cache tags for bulk invalidation
  compressed?: boolean;   // Enable compression for large values
  prefix?: string;        // Cache key prefix
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  averageLatency: number;
}

export class CacheManager {
  private kv: KVNamespace;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    averageLatency: 0
  };

  constructor(kvStore: KVNamespace) {
    this.kv = kvStore;
  }

  /**
   * Get value from cache with automatic JSON parsing
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    const start = Date.now();

    try {
      const cached = await this.kv.get(key, 'json');

      const latency = Date.now() - start;
      this.updateMetrics('get', latency, cached !== null);

      if (cached !== null) {
        this.metrics.hits++;
        return cached as T;
      }

      this.metrics.misses++;
      return defaultValue ?? null;
    } catch (error) {
      this.metrics.errors++;
      console.error('Cache get error:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * Set value in cache with options
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const start = Date.now();

    try {
      const cacheKey = options.prefix ? `${options.prefix}:${key}` : key;
      const kvOptions: any = {};

      if (options.ttl) {
        kvOptions.expirationTtl = options.ttl;
      }

      // Add metadata for cache management
      const cacheValue = {
        data: value,
        timestamp: Date.now(),
        tags: options.tags || [],
        compressed: options.compressed || false
      };

      await this.kv.put(cacheKey, JSON.stringify(cacheValue), kvOptions);

      const latency = Date.now() - start;
      this.updateMetrics('set', latency, true);
      this.metrics.sets++;

      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    const start = Date.now();

    try {
      const cacheKey = prefix ? `${prefix}:${key}` : key;
      await this.kv.delete(cacheKey);

      const latency = Date.now() - start;
      this.updateMetrics('delete', latency, true);
      this.metrics.deletes++;

      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const computed = await computeFn();
    await this.set(key, computed, options);

    return computed;
  }

  /**
   * Bulk delete by pattern (simulated - KV doesn't support pattern deletion)
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    // Note: This is a simplified implementation
    // In production, you'd maintain an index of keys by prefix
    let deletedCount = 0;

    try {
      // For common prefixes, maintain a list of known keys
      const commonPrefixes = [
        `roadmaps:${prefix}`,
        `users:${prefix}`,
        `snippets:${prefix}`,
        `auth:${prefix}`
      ];

      for (const keyPattern of commonPrefixes) {
        await this.delete(keyPattern);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Bulk delete error:', error);
      return 0;
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(warmingStrategies: Array<{ key: string; computeFn: () => Promise<any>; ttl?: number }>): Promise<void> {
    const warmPromises = warmingStrategies.map(async ({ key, computeFn, ttl }) => {
      try {
        const data = await computeFn();
        await this.set(key, data, { ttl: ttl || 3600 }); // Default 1 hour
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.allSettled(warmPromises);
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      averageLatency: 0
    };
  }

  /**
   * Update latency metrics
   */
  private updateMetrics(operation: string, latency: number, success: boolean): void {
    const totalOps = this.metrics.hits + this.metrics.misses + this.metrics.sets + this.metrics.deletes;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * totalOps + latency) / (totalOps + 1);
  }
}

// Specialized cache managers for different data types
export class RoadmapCacheManager extends CacheManager {
  constructor(kvStore: KVNamespace) {
    super(kvStore);
  }

  async getRoadmap(roadmapId: string, userId: string): Promise<any> {
    return this.get(`roadmap:${userId}:${roadmapId}`);
  }

  async setRoadmap(roadmapId: string, userId: string, roadmapData: any): Promise<boolean> {
    return this.set(`roadmap:${userId}:${roadmapId}`, roadmapData, {
      ttl: 1800, // 30 minutes
      tags: ['roadmap', `user:${userId}`]
    });
  }

  async getRoadmapsList(userId: string, limit: number, offset: number): Promise<any> {
    return this.get(`roadmaps:${userId}:${limit}:${offset}`);
  }

  async setRoadmapsList(userId: string, limit: number, offset: number, roadmaps: any): Promise<boolean> {
    return this.set(`roadmaps:${userId}:${limit}:${offset}`, roadmaps, {
      ttl: 600, // 10 minutes
      tags: ['roadmaps', `user:${userId}`]
    });
  }

  async invalidateUserRoadmaps(userId: string): Promise<void> {
    await this.deleteByPrefix(`roadmap:${userId}`);
    await this.deleteByPrefix(`roadmaps:${userId}`);
  }
}

export class UserCacheManager extends CacheManager {
  constructor(kvStore: KVNamespace) {
    super(kvStore);
  }

  async getUser(userId: string): Promise<any> {
    return this.get(`user:${userId}`);
  }

  async setUser(userId: string, userData: any): Promise<boolean> {
    return this.set(`user:${userId}`, userData, {
      ttl: 3600, // 1 hour
      tags: ['user']
    });
  }

  async getUserByEmail(email: string): Promise<any> {
    return this.get(`user:email:${email.toLowerCase()}`);
  }

  async setUserByEmail(email: string, userData: any): Promise<boolean> {
    return this.set(`user:email:${email.toLowerCase()}`, userData, {
      ttl: 3600, // 1 hour
      tags: ['user']
    });
  }

  async invalidateUser(userId: string, email?: string): Promise<void> {
    await this.delete(`user:${userId}`);
    if (email) {
      await this.delete(`user:email:${email.toLowerCase()}`);
    }
  }
}

// Global cache managers
let roadmapCacheManager: RoadmapCacheManager | null = null;
let userCacheManager: UserCacheManager | null = null;
let generalCacheManager: CacheManager | null = null;

export function getRoadmapCacheManager(kv: KVNamespace): RoadmapCacheManager {
  if (!roadmapCacheManager) {
    roadmapCacheManager = new RoadmapCacheManager(kv);
  }
  return roadmapCacheManager;
}

export function getUserCacheManager(kv: KVNamespace): UserCacheManager {
  if (!userCacheManager) {
    userCacheManager = new UserCacheManager(kv);
  }
  return userCacheManager;
}

export function getCacheManager(kv: KVNamespace): CacheManager {
  if (!generalCacheManager) {
    generalCacheManager = new CacheManager(kv);
  }
  return generalCacheManager;
}