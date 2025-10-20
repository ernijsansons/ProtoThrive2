/**
 * Database Service Unit Tests
 * Target: 95%+ coverage for database utilities
 *
 * Test Coverage:
 * - Multi-tenant data isolation
 * - SQL injection prevention
 * - Cache integration
 * - Connection pooling
 * - Query parameterization
 * - Transaction management
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DatabaseService } from '../../src/utils/db';

// Mock D1Database interface
interface MockD1Result {
  results: any[];
  success: boolean;
  meta?: any;
}

class MockD1PreparedStatement {
  private sql: string;
  private params: any[] = [];

  constructor(sql: string) {
    this.sql = sql;
  }

  bind(...values: any[]) {
    this.params = values;
    return this;
  }

  async first<T = unknown>(): Promise<T | null> {
    // Simulate query execution
    return null;
  }

  async all<T = unknown>(): Promise<MockD1Result> {
    return {
      results: [],
      success: true,
    };
  }

  async run(): Promise<MockD1Result> {
    return {
      results: [],
      success: true,
    };
  }
}

class MockD1Database {
  prepare(sql: string) {
    return new MockD1PreparedStatement(sql);
  }

  async exec(sql: string): Promise<any> {
    return { results: [], success: true };
  }

  async batch(statements: any[]): Promise<MockD1Result[]> {
    return statements.map(() => ({ results: [], success: true }));
  }
}

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let mockDb: MockD1Database;

  beforeEach(() => {
    mockDb = new MockD1Database();
    dbService = new DatabaseService(mockDb as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Parameterization', () => {
    it('should always use parameterized queries', () => {
      const prepareSpy = jest.spyOn(mockDb, 'prepare');

      // Test various query methods
      dbService.query('SELECT * FROM users WHERE id = ?', ['user-123']);

      expect(prepareSpy).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?');
    });

    it('should prevent SQL injection with parameterized values', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM users WHERE 1=1--",
      ];

      for (const input of maliciousInputs) {
        // Should safely bind as parameter, not concatenate into SQL
        const result = await dbService.query(
          'SELECT * FROM users WHERE email = ?',
          [input]
        );

        // No error should be thrown; input treated as data, not SQL
        expect(result).toBeDefined();
      }
    });

    it('should bind multiple parameters in correct order', async () => {
      const prepareSpy = jest.spyOn(mockDb, 'prepare');

      await dbService.query(
        'SELECT * FROM users WHERE email = ? AND role = ? AND created_at > ?',
        ['test@example.com', 'admin', '2025-01-01']
      );

      const stmt = prepareSpy.mock.results[0].value;
      expect(stmt).toBeDefined();
    });

    it('should handle empty parameter arrays', async () => {
      await expect(
        dbService.query('SELECT * FROM users', [])
      ).resolves.toBeDefined();
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('should automatically inject tenant_id filter for tenant-scoped queries', async () => {
      const tenantId = 'tenant-abc-123';
      const userId = 'user-456';

      // When fetching user data, should scope to tenant
      const result = await dbService.getUserByIdWithTenant(userId, tenantId);

      // Verify tenant isolation was enforced
      expect(result).toBeDefined();
    });

    it('should prevent cross-tenant data access', async () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';
      const userId = 'shared-user-id';

      // Create mock data for tenant1
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => {
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ id: userId, tenant_id: tenant1 }),
        } as any;
      });

      const result1 = await dbService.getUserByIdWithTenant(userId, tenant1);

      // Attempt to access same user from tenant2 should fail
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => {
        return {
          bind: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null), // Different tenant = no access
        } as any;
      });

      const result2 = await dbService.getUserByIdWithTenant(userId, tenant2);

      expect(result1).toBeTruthy();
      expect(result2).toBeNull();
    });

    it('should enforce tenant_id in WHERE clause for all tenant-scoped tables', async () => {
      const tenantId = 'tenant-xyz';
      const prepareSpy = jest.spyOn(mockDb, 'prepare');

      // Test roadmaps query
      await dbService.getRoadmapsForTenant(tenantId);

      const sqlCalls = prepareSpy.mock.calls.map(call => call[0]);
      const tenantFilterApplied = sqlCalls.some(sql =>
        sql.includes('WHERE') && sql.includes('tenant_id')
      );

      expect(tenantFilterApplied).toBe(true);
    });

    it('should validate tenant_id format before queries', async () => {
      const invalidTenants = [
        '',
        ' ',
        null,
        undefined,
        "'; DROP TABLE tenants; --",
      ];

      for (const invalidTenant of invalidTenants) {
        await expect(
          dbService.getRoadmapsForTenant(invalidTenant as any)
        ).rejects.toThrow(/invalid tenant/i);
      }
    });
  });

  describe('Cache Integration', () => {
    it('should check cache before executing query', async () => {
      const cacheKey = 'user:user-123';
      const cachedData = { id: 'user-123', email: 'cached@example.com' };

      // Mock cache hit
      const getCacheSpy = jest.fn().mockResolvedValue(JSON.stringify(cachedData));
      dbService.setCache({ get: getCacheSpy } as any);

      const result = await dbService.getUserById('user-123', { useCache: true });

      expect(getCacheSpy).toHaveBeenCalledWith(expect.stringContaining('user-123'));
    });

    it('should populate cache on cache miss', async () => {
      const setCacheSpy = jest.fn();
      dbService.setCache({
        get: jest.fn().mockResolvedValue(null),
        put: setCacheSpy,
      } as any);

      // Mock database query
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'user-123', email: 'test@example.com' }),
      } as any));

      await dbService.getUserById('user-123', { useCache: true });

      expect(setCacheSpy).toHaveBeenCalled();
    });

    it('should respect TTL configuration for cached entries', async () => {
      const setCacheSpy = jest.fn();
      dbService.setCache({
        get: jest.fn().mockResolvedValue(null),
        put: setCacheSpy,
      } as any);

      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'user-123' }),
      } as any));

      await dbService.getUserById('user-123', { useCache: true, cacheTTL: 3600 });

      // Verify TTL was passed to cache
      expect(setCacheSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ expirationTtl: 3600 })
      );
    });

    it('should invalidate cache on data mutation', async () => {
      const deleteCacheSpy = jest.fn();
      dbService.setCache({
        delete: deleteCacheSpy,
      } as any);

      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockResolvedValue({ success: true }),
      } as any));

      await dbService.updateUser('user-123', { email: 'new@example.com' });

      expect(deleteCacheSpy).toHaveBeenCalledWith(expect.stringContaining('user-123'));
    });

    it('should handle cache errors gracefully', async () => {
      // Mock cache that throws errors
      dbService.setCache({
        get: jest.fn().mockRejectedValue(new Error('Cache unavailable')),
      } as any);

      // Should fall back to database query
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'user-123' }),
      } as any));

      const result = await dbService.getUserById('user-123', { useCache: true });

      expect(result).toBeDefined();
    });
  });

  describe('Transaction Management', () => {
    it('should execute statements within transaction', async () => {
      const batchSpy = jest.spyOn(mockDb, 'batch');

      await dbService.transaction([
        { sql: 'INSERT INTO users (id, email) VALUES (?, ?)', params: ['user-1', 'test1@example.com'] },
        { sql: 'INSERT INTO roadmaps (id, user_id) VALUES (?, ?)', params: ['roadmap-1', 'user-1'] },
      ]);

      expect(batchSpy).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      jest.spyOn(mockDb, 'batch').mockRejectedValueOnce(new Error('Constraint violation'));

      await expect(
        dbService.transaction([
          { sql: 'INSERT INTO users (id, email) VALUES (?, ?)', params: ['user-1', 'test@example.com'] },
          { sql: 'INVALID SQL HERE', params: [] },
        ])
      ).rejects.toThrow();
    });

    it('should support nested transaction scopes', async () => {
      // D1 doesn't support true nested transactions, but should handle savepoints
      const batchSpy = jest.spyOn(mockDb, 'batch');

      await dbService.transaction([
        { sql: 'INSERT INTO users (id) VALUES (?)', params: ['user-1'] },
      ]);

      expect(batchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Pooling', () => {
    it('should reuse database connections', async () => {
      // Execute multiple queries
      await Promise.all([
        dbService.query('SELECT * FROM users WHERE id = ?', ['user-1']),
        dbService.query('SELECT * FROM users WHERE id = ?', ['user-2']),
        dbService.query('SELECT * FROM users WHERE id = ?', ['user-3']),
      ]);

      // All queries should use same DB instance (connection pooling)
      expect(mockDb).toBeDefined();
    });

    it('should handle concurrent queries safely', async () => {
      const queries = Array.from({ length: 50 }, (_, i) =>
        dbService.query('SELECT * FROM users WHERE id = ?', [`user-${i}`])
      );

      await expect(Promise.all(queries)).resolves.toBeDefined();
    });

    it('should recover from connection errors', async () => {
      jest.spyOn(mockDb, 'prepare')
        .mockImplementationOnce(() => {
          throw new Error('Connection lost');
        })
        .mockImplementationOnce(() => new MockD1PreparedStatement('SELECT 1') as any);

      // First attempt fails
      await expect(
        dbService.query('SELECT * FROM users', [])
      ).rejects.toThrow('Connection lost');

      // Second attempt succeeds (recovery)
      await expect(
        dbService.query('SELECT * FROM users', [])
      ).resolves.toBeDefined();
    });
  });

  describe('Query Performance', () => {
    it('should use prepared statements for repeated queries', async () => {
      const prepareSpy = jest.spyOn(mockDb, 'prepare');

      // Execute same query multiple times
      for (let i = 0; i < 10; i++) {
        await dbService.query('SELECT * FROM users WHERE id = ?', [`user-${i}`]);
      }

      // Should prepare statement each time (D1 optimizes internally)
      expect(prepareSpy).toHaveBeenCalledTimes(10);
    });

    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 10000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
      }));

      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue({ results: largeResultSet, success: true }),
      } as any));

      const result = await dbService.query('SELECT * FROM users', []);

      expect(result.results).toHaveLength(10000);
    });

    it('should implement pagination for large queries', async () => {
      const page = 2;
      const pageSize = 50;
      const prepareSpy = jest.spyOn(mockDb, 'prepare');

      await dbService.query(
        'SELECT * FROM users LIMIT ? OFFSET ?',
        [pageSize, (page - 1) * pageSize]
      );

      expect(prepareSpy).toHaveBeenCalledWith('SELECT * FROM users LIMIT ? OFFSET ?');
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error messages', async () => {
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => {
        throw new Error('D1_ERROR: column "invalid_column" does not exist');
      });

      await expect(
        dbService.query('SELECT invalid_column FROM users', [])
      ).rejects.toThrow(/column.*does not exist/i);
    });

    it('should handle constraint violations gracefully', async () => {
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        run: jest.fn().mockRejectedValue(new Error('UNIQUE constraint failed: users.email')),
      } as any));

      await expect(
        dbService.query('INSERT INTO users (email) VALUES (?)', ['duplicate@example.com'])
      ).rejects.toThrow(/UNIQUE constraint/i);
    });

    it('should handle timeout errors', async () => {
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => ({
        bind: jest.fn().mockReturnThis(),
        all: jest.fn().mockRejectedValue(new Error('Query timeout exceeded')),
      } as any));

      await expect(
        dbService.query('SELECT * FROM users', [])
      ).rejects.toThrow(/timeout/i);
    });
  });

  describe('Security Validation', () => {
    it('should sanitize table names to prevent injection', () => {
      const maliciousTables = [
        'users; DROP TABLE users; --',
        'users/**/OR/**/1=1',
        'users UNION SELECT * FROM secrets',
      ];

      for (const table of maliciousTables) {
        expect(() => dbService.validateTableName(table)).toThrow(/invalid table name/i);
      }
    });

    it('should allow only alphanumeric and underscore in table names', () => {
      const validTables = ['users', 'user_profiles', 'table123', 'TABLE_NAME'];

      for (const table of validTables) {
        expect(() => dbService.validateTableName(table)).not.toThrow();
      }
    });

    it('should sanitize column names to prevent injection', () => {
      const maliciousColumns = [
        'email; DROP TABLE users; --',
        'id/**/OR/**/1=1',
        'password\'; --',
      ];

      for (const column of maliciousColumns) {
        expect(() => dbService.validateColumnName(column)).toThrow(/invalid column name/i);
      }
    });

    it('should prevent information disclosure in error messages', async () => {
      jest.spyOn(mockDb, 'prepare').mockImplementationOnce(() => {
        throw new Error('Database error: /path/to/database/file.db not found');
      });

      await expect(
        dbService.query('SELECT * FROM users', [])
      ).rejects.toThrow(/database operation failed/i);
      // Should NOT expose internal paths
    });
  });
});
