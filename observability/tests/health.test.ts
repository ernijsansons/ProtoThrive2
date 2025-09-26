import { HealthChecker } from '../src/health';
import { HealthStatus, HealthCheck } from '../src/types';

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker();
  });

  describe('Construction and Basic Functionality', () => {
    it('should create health checker instance', () => {
      expect(healthChecker).toBeInstanceOf(HealthChecker);
    });

    it('should return healthy status when no checks are added', async () => {
      const health = await healthChecker.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.checks).toHaveLength(0);
    });

    it('should include uptime in health response', async () => {
      const health = await healthChecker.getHealth();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof health.uptime).toBe('number');
    });

    it('should include timestamp in health response', async () => {
      const health = await healthChecker.getHealth();
      expect(health.timestamp).toBeDefined();
      expect(new Date(health.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Adding and Removing Health Checks', () => {
    it('should add health check successfully', () => {
      const checkFn = async (): Promise<HealthCheck> => ({
        name: 'test-check',
        status: 'pass',
        message: 'Test check passed'
      });

      expect(() => healthChecker.addCheck('test-check', checkFn)).not.toThrow();
    });

    it('should remove health check successfully', () => {
      const checkFn = async (): Promise<HealthCheck> => ({
        name: 'test-check',
        status: 'pass',
        message: 'Test check passed'
      });

      healthChecker.addCheck('test-check', checkFn);
      expect(() => healthChecker.removeCheck('test-check')).not.toThrow();
    });

    it('should not throw when removing non-existent check', () => {
      expect(() => healthChecker.removeCheck('non-existent')).not.toThrow();
    });
  });

  describe('Health Check Execution', () => {
    it('should execute passing health check', async () => {
      const passingCheck = async (): Promise<HealthCheck> => ({
        name: 'passing-check',
        status: 'pass',
        message: 'Everything is fine'
      });

      healthChecker.addCheck('passing-check', passingCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('healthy');
      expect(health.checks).toHaveLength(1);
      expect(health.checks[0].status).toBe('pass');
      expect(health.checks[0].name).toBe('passing-check');
    });

    it('should execute failing health check', async () => {
      const failingCheck = async (): Promise<HealthCheck> => ({
        name: 'failing-check',
        status: 'fail',
        message: 'Something went wrong'
      });

      healthChecker.addCheck('failing-check', failingCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.checks).toHaveLength(1);
      expect(health.checks[0].status).toBe('fail');
    });

    it('should execute warning health check', async () => {
      const warningCheck = async (): Promise<HealthCheck> => ({
        name: 'warning-check',
        status: 'warn',
        message: 'Performance degraded'
      });

      healthChecker.addCheck('warning-check', warningCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('degraded');
      expect(health.checks).toHaveLength(1);
      expect(health.checks[0].status).toBe('warn');
    });

    it('should include response time in health check results', async () => {
      const slowCheck = async (): Promise<HealthCheck> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          name: 'slow-check',
          status: 'pass',
          message: 'Slow but passing'
        };
      };

      healthChecker.addCheck('slow-check', slowCheck);
      const health = await healthChecker.getHealth();

      expect(health.checks[0].responseTime).toBeGreaterThan(0);
      expect(typeof health.checks[0].responseTime).toBe('number');
    });
  });

  describe('Health Check Error Handling', () => {
    it('should handle thrown exceptions in health checks', async () => {
      const throwingCheck = async (): Promise<HealthCheck> => {
        throw new Error('Health check failed');
      };

      healthChecker.addCheck('throwing-check', throwingCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.checks).toHaveLength(1);
      expect(health.checks[0].status).toBe('fail');
      expect(health.checks[0].message).toContain('Health check failed');
    });

    it('should handle non-Error thrown objects', async () => {
      const throwingCheck = async (): Promise<HealthCheck> => {
        throw 'String error';
      };

      healthChecker.addCheck('string-throwing-check', throwingCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.checks[0].status).toBe('fail');
      expect(health.checks[0].message).toContain('Check failed');
    });

    it('should handle async rejection', async () => {
      const rejectingCheck = async (): Promise<HealthCheck> => {
        return Promise.reject(new Error('Async rejection'));
      };

      healthChecker.addCheck('rejecting-check', rejectingCheck);
      const health = await healthChecker.getHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.checks[0].status).toBe('fail');
    });
  });

  describe('Multiple Health Checks', () => {
    it('should execute multiple passing checks', async () => {
      const check1 = async (): Promise<HealthCheck> => ({
        name: 'check1',
        status: 'pass',
        message: 'Check 1 passed'
      });

      const check2 = async (): Promise<HealthCheck> => ({
        name: 'check2',
        status: 'pass',
        message: 'Check 2 passed'
      });

      healthChecker.addCheck('check1', check1);
      healthChecker.addCheck('check2', check2);

      const health = await healthChecker.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.checks).toHaveLength(2);
    });

    it('should prioritize fail status over warn status', async () => {
      const warnCheck = async (): Promise<HealthCheck> => ({
        name: 'warn-check',
        status: 'warn',
        message: 'Warning state'
      });

      const failCheck = async (): Promise<HealthCheck> => ({
        name: 'fail-check',
        status: 'fail',
        message: 'Failed state'
      });

      healthChecker.addCheck('warn-check', warnCheck);
      healthChecker.addCheck('fail-check', failCheck);

      const health = await healthChecker.getHealth();
      expect(health.status).toBe('unhealthy');
    });

    it('should show degraded when only warnings present', async () => {
      const warnCheck1 = async (): Promise<HealthCheck> => ({
        name: 'warn-check1',
        status: 'warn',
        message: 'Warning 1'
      });

      const warnCheck2 = async (): Promise<HealthCheck> => ({
        name: 'warn-check2',
        status: 'warn',
        message: 'Warning 2'
      });

      healthChecker.addCheck('warn-check1', warnCheck1);
      healthChecker.addCheck('warn-check2', warnCheck2);

      const health = await healthChecker.getHealth();
      expect(health.status).toBe('degraded');
    });
  });

  describe('Pre-built Health Checks', () => {
    describe('Database Health Check', () => {
      it('should create database health check with working database', async () => {
        const mockDb = {
          ping: jest.fn().mockResolvedValue(true)
        };

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb);
        const result = await dbCheck();

        expect(result.name).toBe('database');
        expect(result.status).toBe('pass');
        expect(result.message).toContain('healthy');
        expect(mockDb.ping).toHaveBeenCalled();
      });

      it('should create database health check with slow database', async () => {
        const mockDb = {
          ping: jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(true), 1500))
          )
        };

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb);
        const result = await dbCheck();

        expect(result.status).toBe('warn');
        expect(result.responseTime).toBeGreaterThan(1000);
      });

      it('should create database health check with failing database', async () => {
        const mockDb = {
          ping: jest.fn().mockRejectedValue(new Error('Connection failed'))
        };

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb);
        const result = await dbCheck();

        expect(result.name).toBe('database');
        expect(result.status).toBe('fail');
        expect(result.message).toContain('Connection failed');
      });

      it('should handle database without ping method', async () => {
        const mockDb = {};

        const dbCheck = HealthChecker.createDatabaseCheck(mockDb);
        const result = await dbCheck();

        expect(result.status).toBe('pass');
      });
    });

    describe('Redis Health Check', () => {
      it('should create redis health check with working redis', async () => {
        const mockRedis = {
          ping: jest.fn().mockResolvedValue('PONG')
        };

        const redisCheck = HealthChecker.createRedisCheck(mockRedis);
        const result = await redisCheck();

        expect(result.name).toBe('redis');
        expect(result.status).toBe('pass');
        expect(mockRedis.ping).toHaveBeenCalled();
      });

      it('should create redis health check with slow redis', async () => {
        const mockRedis = {
          ping: jest.fn().mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve('PONG'), 150))
          )
        };

        const redisCheck = HealthChecker.createRedisCheck(mockRedis);
        const result = await redisCheck();

        expect(result.status).toBe('warn');
        expect(result.responseTime).toBeGreaterThan(100);
      });

      it('should create redis health check with failing redis', async () => {
        const mockRedis = {
          ping: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
        };

        const redisCheck = HealthChecker.createRedisCheck(mockRedis);
        const result = await redisCheck();

        expect(result.status).toBe('fail');
        expect(result.message).toContain('Redis connection failed');
      });
    });

    describe('External Service Health Check', () => {
      // Mock fetch for Node.js environment
      const mockFetch = jest.fn();
      (global as any).fetch = mockFetch;

      beforeEach(() => {
        mockFetch.mockClear();
      });

      it('should create external service health check with healthy service', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200
        });

        const serviceCheck = HealthChecker.createExternalServiceCheck('test-api', 'https://api.test.com/health');
        const result = await serviceCheck();

        expect(result.name).toBe('test-api');
        expect(result.status).toBe('pass');
        expect(result.details?.statusCode).toBe(200);
      });

      it('should create external service health check with unhealthy service', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500
        });

        const serviceCheck = HealthChecker.createExternalServiceCheck('test-api', 'https://api.test.com/health');
        const result = await serviceCheck();

        expect(result.status).toBe('warn');
        expect(result.details?.statusCode).toBe(500);
      });

      it('should handle network errors in external service check', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const serviceCheck = HealthChecker.createExternalServiceCheck('test-api', 'https://api.test.com/health');
        const result = await serviceCheck();

        expect(result.status).toBe('fail');
        expect(result.message).toContain('Network error');
      });
    });

    describe('System Health Checks', () => {
      it('should create disk space health check', async () => {
        const diskCheck = HealthChecker.createDiskSpaceCheck(0.9);
        const result = await diskCheck();

        expect(result.name).toBe('disk_space');
        expect(result.status).toMatch(/pass|warn/);
        expect(result.details?.usedPercent).toBeDefined();
      });

      it('should create memory health check', async () => {
        const memoryCheck = HealthChecker.createMemoryCheck(0.9);
        const result = await memoryCheck();

        expect(result.name).toBe('memory');
        expect(result.status).toMatch(/pass|warn/);
        expect(result.details?.heapUsed).toBeGreaterThan(0);
        expect(result.details?.heapTotal).toBeGreaterThan(0);
      });

      it('should warn when memory usage exceeds threshold', async () => {
        const memoryCheck = HealthChecker.createMemoryCheck(0.01); // Very low threshold
        const result = await memoryCheck();

        expect(result.status).toBe('warn');
        expect(result.message).toContain('Heap usage');
      });
    });
  });

  describe('Concurrent Health Checks', () => {
    it('should execute health checks concurrently', async () => {
      const startTime = Date.now();
      const delayedCheck = async (delay: number, name: string): Promise<HealthCheck> => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return {
          name,
          status: 'pass',
          message: `Check ${name} completed`
        };
      };

      healthChecker.addCheck('check1', () => delayedCheck(50, 'check1'));
      healthChecker.addCheck('check2', () => delayedCheck(50, 'check2'));
      healthChecker.addCheck('check3', () => delayedCheck(50, 'check3'));

      const health = await healthChecker.getHealth();
      const endTime = Date.now();

      // If executed concurrently, total time should be closer to 50ms than 150ms
      expect(endTime - startTime).toBeLessThan(100);
      expect(health.checks).toHaveLength(3);
      expect(health.status).toBe('healthy');
    });
  });
});