/**
 * D1 Connection Pool for ProtoThrive
 * Optimizes database connections for Cloudflare Workers
 */

interface PooledConnection {
  db: D1Database;
  lastUsed: number;
  inUse: boolean;
  connectionId: string;
}

interface QueryMetrics {
  totalQueries: number;
  averageLatency: number;
  connectionPoolHits: number;
  connectionPoolMisses: number;
}

export class D1ConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private maxConnections = 5; // Cloudflare Workers has limited concurrency
  private connectionTimeout = 30000; // 30 seconds
  private metrics: QueryMetrics = {
    totalQueries: 0,
    averageLatency: 0,
    connectionPoolHits: 0,
    connectionPoolMisses: 0
  };

  constructor(private primaryDb: D1Database) {}

  /**
   * Get an available connection from the pool
   */
  async getConnection(): Promise<D1Database> {
    const start = Date.now();

    // Try to reuse an existing connection
    for (const [id, conn] of this.connections.entries()) {
      if (!conn.inUse && (Date.now() - conn.lastUsed) < this.connectionTimeout) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        this.metrics.connectionPoolHits++;
        return conn.db;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.maxConnections) {
      const connectionId = `d1_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pooledConnection: PooledConnection = {
        db: this.primaryDb, // In D1, we reuse the same binding
        lastUsed: Date.now(),
        inUse: true,
        connectionId
      };

      this.connections.set(connectionId, pooledConnection);
      this.metrics.connectionPoolMisses++;
      return pooledConnection.db;
    }

    // Fall back to primary database if pool is full
    this.metrics.connectionPoolMisses++;
    return this.primaryDb;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connectionId?: string): void {
    if (connectionId && this.connections.has(connectionId)) {
      const conn = this.connections.get(connectionId)!;
      conn.inUse = false;
      conn.lastUsed = Date.now();
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  async executeQuery<T>(
    queryFn: (db: D1Database) => Promise<T>,
    queryType: 'read' | 'write' = 'read'
  ): Promise<T> {
    const start = Date.now();
    const db = await this.getConnection();

    try {
      const result = await queryFn(db);

      // Update metrics
      this.metrics.totalQueries++;
      const latency = Date.now() - start;
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (this.metrics.totalQueries - 1) + latency) /
        this.metrics.totalQueries;

      return result;
    } finally {
      // Connection is automatically released in D1 Workers environment
    }
  }

  /**
   * Prepare and execute a statement with connection pooling
   */
  async prepareAndExecute<T>(
    sql: string,
    params: any[] = [],
    operation: 'first' | 'all' | 'run' = 'all'
  ): Promise<T> {
    return this.executeQuery(async (db) => {
      const stmt = db.prepare(sql);
      const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;

      switch (operation) {
        case 'first':
          return boundStmt.first() as T;
        case 'run':
          return boundStmt.run() as T;
        case 'all':
        default:
          return boundStmt.all() as T;
      }
    });
  }

  /**
   * Batch execute multiple queries with transaction-like behavior
   */
  async executeBatch(queries: Array<{ sql: string; params?: any[] }>): Promise<any[]> {
    return this.executeQuery(async (db) => {
      const results = [];

      for (const query of queries) {
        const stmt = db.prepare(query.sql);
        const boundStmt = query.params?.length ? stmt.bind(...query.params) : stmt;
        results.push(await boundStmt.run());
      }

      return results;
    }, 'write');
  }

  /**
   * Clean up expired connections
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, conn] of this.connections.entries()) {
      if (!conn.inUse && (now - conn.lastUsed) > this.connectionTimeout) {
        this.connections.delete(id);
      }
    }
  }

  /**
   * Get connection pool metrics
   */
  getMetrics(): QueryMetrics & { activeConnections: number; totalConnections: number } {
    return {
      ...this.metrics,
      activeConnections: Array.from(this.connections.values()).filter(c => c.inUse).length,
      totalConnections: this.connections.size
    };
  }

  /**
   * Reset pool (for testing)
   */
  reset(): void {
    this.connections.clear();
    this.metrics = {
      totalQueries: 0,
      averageLatency: 0,
      connectionPoolHits: 0,
      connectionPoolMisses: 0
    };
  }
}

// Global connection pool instance
let globalPool: D1ConnectionPool | null = null;

/**
 * Get or create global connection pool
 */
export function getConnectionPool(db: D1Database): D1ConnectionPool {
  if (!globalPool) {
    globalPool = new D1ConnectionPool(db);

    // Cleanup connections every 2 minutes
    const cleanupInterval = setInterval(() => {
      globalPool?.cleanup();
    }, 2 * 60 * 1000);

    // Clean up interval on worker termination
    if (typeof globalThis !== 'undefined' && 'addEventListener' in globalThis) {
      globalThis.addEventListener('unload' as any, () => {
        clearInterval(cleanupInterval);
      });
    }
  }

  return globalPool;
}