// Ref: CLAUDE.md - Comprehensive Cache Service Tests
// Converted to Jest';
import { CacheService, cacheService } from '../../services/cacheService';
import { testUtils, mockData } from '../../test-utils/testSetup';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService({
      ttl: 1000,
      maxSize: 100,
      namespace: 'test',
      compression: false,
      encryption: false,
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const testData = { message: 'Hello, Thermonuclear Cache!' };

      const setResult = await cache.set('test-key', testData);
      expect(setResult).toBe(true);

      const getValue = await cache.get('test-key');
      expect(getValue).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('non-existent-key');
      expect(value).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const testData = { message: 'Expiring data' };

      await cache.set('expiring-key', testData, { ttl: 0.1 }); // 100ms

      const immediateValue = await cache.get('expiring-key');
      expect(immediateValue).toEqual(testData);

      // Wait for expiration
      await testUtils.simulateDelay(200);

      const expiredValue = await cache.get('expiring-key', { skipStale: true });
      expect(expiredValue).toBeNull();
    });

    it('should delete values', async () => {
      const testData = { message: 'To be deleted' };

      await cache.set('delete-key', testData);

      const beforeDelete = await cache.get('delete-key');
      expect(beforeDelete).toEqual(testData);

      const deleteResult = await cache.delete('delete-key');
      expect(deleteResult).toBe(true);

      const afterDelete = await cache.get('delete-key');
      expect(afterDelete).toBeNull();
    });

    it('should clear all entries', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      const clearResult = await cache.clear();
      expect(clearResult).toBe(true);

      const value1 = await cache.get('key1');
      const value2 = await cache.get('key2');
      const value3 = await cache.get('key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBeNull();
    });
  });

  describe('Advanced Operations', () => {
    it('should handle multiple get operations (mget)', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      const results = await cache.mget(['key1', 'key2', 'key3', 'non-existent']);

      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.get('key3')).toBe('value3');
      expect(results.get('non-existent')).toBeNull();
    });

    it('should handle multiple set operations (mset)', async () => {
      const entries = new Map([
        ['bulk1', 'value1'],
        ['bulk2', 'value2'],
        ['bulk3', 'value3'],
      ]);

      const setResult = await cache.mset(entries);
      expect(setResult).toBe(true);

      const value1 = await cache.get('bulk1');
      const value2 = await cache.get('bulk2');
      const value3 = await cache.get('bulk3');

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');
    });

    it('should handle tag-based operations', async () => {
      await cache.set('user:1', { name: 'User 1' }, { tags: ['user', 'profile'] });
      await cache.set('user:2', { name: 'User 2' }, { tags: ['user', 'profile'] });
      await cache.set('post:1', { title: 'Post 1' }, { tags: ['post', 'content'] });

      const userEntries = await cache.getByTags(['user']);
      expect(userEntries.size).toBe(2);

      const profileEntries = await cache.getByTags(['profile']);
      expect(profileEntries.size).toBe(2);

      const contentEntries = await cache.getByTags(['content']);
      expect(contentEntries.size).toBe(1);
    });

    it('should invalidate entries by tags', async () => {
      await cache.set('user:1', { name: 'User 1' }, { tags: ['user', 'profile'] });
      await cache.set('user:2', { name: 'User 2' }, { tags: ['user', 'profile'] });
      await cache.set('post:1', { title: 'Post 1' }, { tags: ['post', 'content'] });

      const invalidatedCount = await cache.invalidateByTags(['user']);
      expect(invalidatedCount).toBe(2);

      const user1 = await cache.get('user:1');
      const user2 = await cache.get('user:2');
      const post1 = await cache.get('post:1');

      expect(user1).toBeNull();
      expect(user2).toBeNull();
      expect(post1).toEqual({ title: 'Post 1' });
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track cache statistics', async () => {
      // Generate some cache activity
      await cache.set('stats-key1', 'value1');
      await cache.set('stats-key2', 'value2');

      await cache.get('stats-key1'); // Hit
      await cache.get('stats-key2'); // Hit
      await cache.get('non-existent'); // Miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 2);
      expect(stats.totalKeys).toBe(2);
      expect(stats.operations).toBeGreaterThan(0);
    });

    it('should provide cache health information', async () => {
      await cache.set('health-key', 'value');

      const health = cache.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.layers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Memory',
            available: true,
            health: 'healthy',
          }),
        ])
      );
      expect(health.performance).toEqual(
        expect.objectContaining({
          hitRate: expect.any(Number),
          averageResponseTime: expect.any(Number),
          memoryUsage: expect.any(Number),
        })
      );
    });

    it('should handle cache layers correctly', async () => {
      const layers = cache.getLayers();

      expect(layers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Memory',
            type: 'memory',
            priority: 1,
            available: true,
          }),
        ])
      );
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = performance.now();

      // Set 100 entries
      const setPromises = [];
      for (let i = 0; i < 100; i++) {
        setPromises.push(cache.set(`perf-key-${i}`, { data: `value-${i}`, index: i }));
      }
      await Promise.all(setPromises);

      // Get all entries
      const getPromises = [];
      for (let i = 0; i < 100; i++) {
        getPromises.push(cache.get(`perf-key-${i}`));
      }
      const results = await Promise.all(getPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(results.every(result => result !== null)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      console.log(`🔥 Performance Test: 200 operations completed in ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = async () => {
        const operations = [];

        // Mix of set, get, and delete operations
        for (let i = 0; i < 50; i++) {
          operations.push(cache.set(`concurrent-${i}`, { value: i }));
        }

        for (let i = 0; i < 50; i++) {
          operations.push(cache.get(`concurrent-${i}`));
        }

        for (let i = 0; i < 25; i++) {
          operations.push(cache.delete(`concurrent-${i}`));
        }

        return Promise.all(operations);
      };

      await expect(concurrentOperations()).resolves.toBeDefined();

      const stats = cache.getStats();
      expect(stats.operations).toBeGreaterThan(100);
    });

    it('should handle memory limits and eviction', async () => {
      const smallCache = new CacheService({
        maxSize: 5, // Very small cache
        ttl: 3600,
        namespace: 'small-test',
      });

      // Fill beyond capacity
      for (let i = 0; i < 10; i++) {
        await smallCache.set(`evict-key-${i}`, { data: `value-${i}` });
      }

      // Check that some entries were evicted
      const stats = smallCache.getStats();
      expect(stats.totalKeys).toBeLessThanOrEqual(5);
      expect(stats.evictions).toBeGreaterThan(0);

      await smallCache.clear();
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      // Create a circular reference that cannot be serialized
      const circularData: any = { name: 'circular' };
      circularData.self = circularData;

      const setResult = await cache.set('circular-key', circularData);
      expect(setResult).toBe(false);
    });

    it('should handle invalid TTL values', async () => {
      const setResult = await cache.set('invalid-ttl', 'data', { ttl: -1 });
      expect(setResult).toBe(true); // Should use default TTL

      const value = await cache.get('invalid-ttl');
      expect(value).toBe('data');
    });

    it('should handle empty or null values', async () => {
      await cache.set('null-key', null);
      await cache.set('undefined-key', undefined);
      await cache.set('empty-string-key', '');
      await cache.set('empty-object-key', {});

      const nullValue = await cache.get('null-key');
      const undefinedValue = await cache.get('undefined-key');
      const emptyStringValue = await cache.get('empty-string-key');
      const emptyObjectValue = await cache.get('empty-object-key');

      expect(nullValue).toBeNull();
      expect(undefinedValue).toBeUndefined();
      expect(emptyStringValue).toBe('');
      expect(emptyObjectValue).toEqual({});
    });
  });

  describe('Backup and Restore', () => {
    it('should export cache data', async () => {
      await cache.set('export1', 'value1', { tags: ['export'] });
      await cache.set('export2', 'value2', { tags: ['export'] });

      const exportData = await cache.export();

      expect(exportData.entries).toHaveLength(2);
      expect(exportData.metadata).toEqual(
        expect.objectContaining({
          timestamp: expect.any(Number),
          version: '1.0.0',
          namespace: 'test',
          stats: expect.any(Object),
        })
      );
    });

    it('should import cache data', async () => {
      const importData = {
        entries: [
          mockData.cacheEntry({
            key: 'test:import1',
            value: 'imported1',
            timestamp: Date.now(),
          }),
          mockData.cacheEntry({
            key: 'test:import2',
            value: 'imported2',
            timestamp: Date.now(),
          }),
        ],
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          namespace: 'test',
          stats: {},
        },
      };

      await cache.import(importData);

      const value1 = await cache.get('import1');
      const value2 = await cache.get('import2');

      expect(value1).toBe('imported1');
      expect(value2).toBe('imported2');
    });

    it('should not import expired entries', async () => {
      const expiredTime = Date.now() - 10000; // 10 seconds ago
      const importData = {
        entries: [
          mockData.cacheEntry({
            key: 'test:expired',
            value: 'expired-value',
            timestamp: expiredTime,
            ttl: 1, // 1 second TTL
          }),
        ],
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          namespace: 'test',
          stats: {},
        },
      };

      await cache.import(importData);

      const expiredValue = await cache.get('expired');
      expect(expiredValue).toBeNull();
    });
  });

  describe('Warmup Functionality', () => {
    it('should warmup cache with initial data', async () => {
      const warmupData = [
        { key: 'warmup1', value: { data: 'warm1' } },
        { key: 'warmup2', value: { data: 'warm2' }, ttl: 5000 },
        { key: 'warmup3', value: { data: 'warm3' } },
      ];

      await cache.warmup(warmupData);

      const value1 = await cache.get('warmup1');
      const value2 = await cache.get('warmup2');
      const value3 = await cache.get('warmup3');

      expect(value1).toEqual({ data: 'warm1' });
      expect(value2).toEqual({ data: 'warm2' });
      expect(value3).toEqual({ data: 'warm3' });

      const stats = cache.getStats();
      expect(stats.totalKeys).toBe(3);
    });
  });
});

describe('Global Cache Instance', () => {
  it('should use the global cache service', async () => {
    await cacheService.set('global-test', 'global-value');

    const value = await cacheService.get('global-test');
    expect(value).toBe('global-value');

    await cacheService.delete('global-test');
  });

  it('should provide convenient cache methods', async () => {
    const { cache } = await import('../../services/cacheService');

    await cache.set('convenience-test', 'convenience-value');

    const value = await cache.get('convenience-test');
    expect(value).toBe('convenience-value');

    const stats = cache.stats();
    expect(stats).toEqual(
      expect.objectContaining({
        hits: expect.any(Number),
        misses: expect.any(Number),
        totalKeys: expect.any(Number),
      })
    );

    const health = cache.health();
    expect(health).toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/healthy|degraded|unhealthy/),
        layers: expect.any(Array),
        performance: expect.any(Object),
      })
    );

    await cache.clear();
  });
});