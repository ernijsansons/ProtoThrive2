import { HealthStatus, HealthCheck } from './types';

export class HealthChecker {
  private startTime: Date;
  private checks: Map<string, () => Promise<HealthCheck>>;

  constructor() {
    this.startTime = new Date();
    this.checks = new Map();
  }

  addCheck(name: string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
  }

  removeCheck(name: string): void {
    this.checks.delete(name);
  }

  async getHealth(): Promise<HealthStatus> {
    const results = await Promise.allSettled(
      Array.from(this.checks.entries()).map(async ([name, checkFn]) => {
        const startTime = Date.now();
        try {
          const result = await checkFn();
          return {
            ...result,
            name,
            responseTime: Date.now() - startTime
          };
        } catch (error) {
          return {
            name,
            status: 'fail' as const,
            message: error instanceof Error ? error.message : 'Check failed',
            responseTime: Date.now() - startTime
          };
        }
      })
    );

    const checks = results.map(result =>
      result.status === 'fulfilled' ? result.value : {
        name: 'unknown',
        status: 'fail' as const,
        message: 'Check execution failed'
      }
    );

    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');

    return {
      status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      checks,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.APP_VERSION
    };
  }

  // Common health checks
  static createDatabaseCheck(db: any): () => Promise<HealthCheck> {
    return async () => {
      try {
        const startTime = Date.now();
        // Replace with actual DB ping
        await db.ping?.() || Promise.resolve();
        const responseTime = Date.now() - startTime;

        return {
          name: 'database',
          status: responseTime < 1000 ? 'pass' : 'warn',
          message: 'Database connection is healthy',
          responseTime
        };
      } catch (error) {
        return {
          name: 'database',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Database check failed'
        };
      }
    };
  }

  static createRedisCheck(redis: any): () => Promise<HealthCheck> {
    return async () => {
      try {
        const startTime = Date.now();
        await redis.ping?.() || Promise.resolve();
        const responseTime = Date.now() - startTime;

        return {
          name: 'redis',
          status: responseTime < 100 ? 'pass' : 'warn',
          message: 'Redis connection is healthy',
          responseTime
        };
      } catch (error) {
        return {
          name: 'redis',
          status: 'fail',
          message: error instanceof Error ? error.message : 'Redis check failed'
        };
      }
    };
  }

  static createExternalServiceCheck(name: string, url: string): () => Promise<HealthCheck> {
    return async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        const responseTime = Date.now() - startTime;

        return {
          name,
          status: response.ok ? 'pass' : 'warn',
          message: `External service responded with status ${response.status}`,
          responseTime,
          details: { statusCode: response.status }
        };
      } catch (error) {
        return {
          name,
          status: 'fail',
          message: error instanceof Error ? error.message : 'External service check failed'
        };
      }
    };
  }

  static createDiskSpaceCheck(threshold = 0.9): () => Promise<HealthCheck> {
    return async () => {
      try {
        // Mock implementation - replace with actual disk check
        const used = 0.7; // 70% used

        return {
          name: 'disk_space',
          status: used > threshold ? 'warn' : 'pass',
          message: `Disk usage at ${(used * 100).toFixed(1)}%`,
          details: { usedPercent: used }
        };
      } catch (error) {
        return {
          name: 'disk_space',
          status: 'fail',
          message: 'Failed to check disk space'
        };
      }
    };
  }

  static createMemoryCheck(threshold = 0.9): () => Promise<HealthCheck> {
    return async () => {
      try {
        const memUsage = process.memoryUsage();
        const heapUsed = memUsage.heapUsed / memUsage.heapTotal;

        return {
          name: 'memory',
          status: heapUsed > threshold ? 'warn' : 'pass',
          message: `Heap usage at ${(heapUsed * 100).toFixed(1)}%`,
          details: {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss,
            external: memUsage.external
          }
        };
      } catch (error) {
        return {
          name: 'memory',
          status: 'fail',
          message: 'Failed to check memory usage'
        };
      }
    };
  }
}