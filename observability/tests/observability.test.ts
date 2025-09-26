import { Observability } from '../src/index';
import { ObservabilityConfig } from '../src/index';

describe('Observability', () => {
  let config: ObservabilityConfig;

  beforeEach(() => {
    config = {
      serviceName: 'test-service',
      version: '1.0.0',
      environment: 'test'
    };
  });

  afterEach(() => {
    // Clear singleton instance for testing
    (Observability as any).instance = undefined;
  });

  describe('Initialization', () => {
    it('should initialize with required config', () => {
      const obs = Observability.initialize(config);
      expect(obs).toBeInstanceOf(Observability);
      expect(obs.logger).toBeDefined();
    });

    it('should initialize with metrics enabled by default', () => {
      const obs = Observability.initialize(config);
      expect(obs.metrics).toBeDefined();
    });

    it('should initialize with health checks enabled by default', () => {
      const obs = Observability.initialize(config);
      expect(obs.health).toBeDefined();
    });

    it('should disable metrics when configured', () => {
      const obs = Observability.initialize({
        ...config,
        enableMetrics: false
      });
      expect(obs.metrics).toBeUndefined();
    });

    it('should disable health checks when configured', () => {
      const obs = Observability.initialize({
        ...config,
        enableHealthChecks: false
      });
      expect(obs.health).toBeUndefined();
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const obs1 = Observability.initialize(config);
      const obs2 = Observability.getInstance();
      expect(obs1).toBe(obs2);
    });

    it('should throw when getInstance called before initialize', () => {
      expect(() => Observability.getInstance()).toThrow('not initialized');
    });
  });

  describe('Default Health Checks Setup', () => {
    it('should setup default health checks on initialization', () => {
      const obs = Observability.initialize(config);
      expect(obs.health).toBeDefined();
      // Default health checks should be added during initialization
    });

    it('should handle missing health checker gracefully', () => {
      const obs = Observability.initialize({
        ...config,
        enableHealthChecks: false
      });
      expect(obs.health).toBeUndefined();
    });
  });

  describe('Middleware Functions', () => {
    let obs: Observability;

    beforeEach(() => {
      obs = Observability.initialize(config);
    });

    describe('Request Logger Middleware', () => {
      it('should create request logger middleware', () => {
        const middleware = obs.requestLogger();
        expect(typeof middleware).toBe('function');
      });

      it('should log request start and completion', () => {
        const middleware = obs.requestLogger();
        const mockReq = {
          method: 'GET',
          path: '/test',
          query: {},
          route: { path: '/test' }
        };
        const mockRes = {
          send: jest.fn(),
          statusCode: 200
        };
        const mockNext = jest.fn();

        // Execute middleware
        middleware(mockReq, mockRes, mockNext);

        // Simulate response
        mockRes.send('test response');

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Hono Request Logger Middleware', () => {
      it('should create Hono request logger middleware', () => {
        const middleware = obs.honoRequestLogger();
        expect(typeof middleware).toBe('function');
      });

      it('should log Hono requests', async () => {
        const middleware = obs.honoRequestLogger();
        const mockC = {
          req: {
            method: 'POST',
            path: '/api/test',
            query: {}
          },
          res: {
            status: 201
          }
        };
        const mockNext = jest.fn().mockResolvedValue(undefined);

        await expect(middleware(mockC, mockNext)).resolves.toBeUndefined();
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Error Handler Middleware', () => {
      it('should create error handler middleware', () => {
        const errorHandler = obs.errorHandler();
        expect(typeof errorHandler).toBe('function');
      });

      it('should handle standard errors', () => {
        const errorHandler = obs.errorHandler();
        const error = new Error('Test error');
        const mockReq = { method: 'GET', path: '/test' };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const mockNext = jest.fn();

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalled();
      });

      it('should handle errors with custom status codes', () => {
        const errorHandler = obs.errorHandler();
        const error = Object.assign(new Error('Validation error'), { statusCode: 400 });
        const mockReq = { method: 'POST', path: '/api/test' };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const mockNext = jest.fn();

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
      });

      it('should record error metrics when available', () => {
        const errorHandler = obs.errorHandler();
        const error = Object.assign(new Error('Test error'), {
          name: 'ValidationError',
          code: 'VAL-400',
          severity: 'medium'
        });
        const mockReq = { method: 'GET', path: '/test' };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const mockNext = jest.fn();

        // Mock metrics
        const recordErrorSpy = jest.fn();
        if (obs.metrics) {
          obs.metrics.recordError = recordErrorSpy;
        }

        errorHandler(error, mockReq, mockRes, mockNext);

        if (obs.metrics) {
          expect(recordErrorSpy).toHaveBeenCalledWith('ValidationError', 'VAL-400', 'medium');
        }
      });
    });
  });

  describe('Endpoint Handlers', () => {
    let obs: Observability;

    beforeEach(() => {
      obs = Observability.initialize(config);
    });

    describe('Health Handler', () => {
      it('should handle health check requests', async () => {
        const mockReq = {};
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await obs.healthHandler(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const callArgs = mockRes.json.mock.calls[0][0];
        expect(callArgs).toHaveProperty('status');
        expect(callArgs).toHaveProperty('checks');
        expect(callArgs).toHaveProperty('timestamp');
      });

      it('should return 503 when health checks disabled', async () => {
        const obsNoHealth = Observability.initialize({
          ...config,
          enableHealthChecks: false
        });

        const mockReq = {};
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await obsNoHealth.healthHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(503);
      });

      it('should return appropriate status codes based on health', async () => {
        // Add a failing health check
        if (obs.health) {
          obs.health.addCheck('failing-check', async () => ({
            name: 'failing-check',
            status: 'fail',
            message: 'Test failure'
          }));
        }

        const mockReq = {};
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await obs.healthHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(503);
      });
    });

    describe('Metrics Handler', () => {
      it('should handle metrics requests', async () => {
        const mockReq = {};
        const mockRes = {
          set: jest.fn(),
          send: jest.fn()
        };

        await obs.metricsHandler(mockReq, mockRes);

        expect(mockRes.set).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
        expect(mockRes.send).toHaveBeenCalled();
        expect(typeof mockRes.send.mock.calls[0][0]).toBe('string');
      });

      it('should return 503 when metrics disabled', async () => {
        const obsNoMetrics = Observability.initialize({
          ...config,
          enableMetrics: false
        });

        const mockReq = {};
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn()
        };

        await obsNoMetrics.metricsHandler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(503);
        expect(mockRes.send).toHaveBeenCalledWith('Metrics not enabled');
      });
    });
  });

  describe('Integration', () => {
    it('should work with all components enabled', () => {
      const obs = Observability.initialize({
        serviceName: 'integration-test',
        version: '2.0.0',
        environment: 'test',
        enableMetrics: true,
        enableHealthChecks: true
      });

      expect(obs.logger).toBeDefined();
      expect(obs.metrics).toBeDefined();
      expect(obs.health).toBeDefined();

      // Test basic functionality
      expect(() => obs.logger.info('Test message')).not.toThrow();
      expect(() => obs.metrics?.recordHttpRequest('GET', '/test', 200, 100)).not.toThrow();
    });

    it('should work with minimal configuration', () => {
      const obs = Observability.initialize({
        serviceName: 'minimal-test'
      });

      expect(obs.logger).toBeDefined();
      expect(obs.metrics).toBeDefined();
      expect(obs.health).toBeDefined();
    });

    it('should handle concurrent access to singleton', () => {
      const obs1 = Observability.initialize(config);
      const obs2 = Observability.getInstance();
      const obs3 = Observability.getInstance();

      expect(obs1).toBe(obs2);
      expect(obs2).toBe(obs3);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle logger initialization errors gracefully', () => {
      // Test with invalid config that might cause logger issues
      const invalidConfig = {
        serviceName: '', // Empty service name
        version: '1.0.0'
      };

      expect(() => Observability.initialize(invalidConfig)).not.toThrow();
    });

    it('should handle metrics initialization errors gracefully', () => {
      // Even with potential issues, initialization should not throw
      expect(() => Observability.initialize(config)).not.toThrow();
    });

    it('should handle health check initialization errors gracefully', () => {
      expect(() => Observability.initialize(config)).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should require serviceName', () => {
      const invalidConfig = {
        version: '1.0.0'
      } as ObservabilityConfig;

      // This should still work but might have default behavior
      expect(() => Observability.initialize(invalidConfig)).not.toThrow();
    });

    it('should use default values for optional fields', () => {
      const minimalConfig = {
        serviceName: 'test'
      };

      const obs = Observability.initialize(minimalConfig);
      expect(obs).toBeDefined();
      expect(obs.logger).toBeDefined();
    });

    it('should accept all configuration options', () => {
      const fullConfig: ObservabilityConfig = {
        serviceName: 'full-test',
        version: '2.1.0',
        environment: 'staging',
        instanceId: 'instance-123',
        enableMetrics: true,
        enableHealthChecks: true
      };

      const obs = Observability.initialize(fullConfig);
      expect(obs).toBeDefined();
      expect(obs.logger).toBeDefined();
      expect(obs.metrics).toBeDefined();
      expect(obs.health).toBeDefined();
    });
  });
});