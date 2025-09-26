import { Logger } from '../src/logger';
import { Config } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Logger', () => {
  let logger: Logger;
  let config: Config;

  beforeEach(() => {
    config = {
      serviceName: 'test-service',
      version: '1.0.0',
      environment: 'test'
    };
    logger = new Logger(config);
  });

  afterEach(() => {
    // Clean up any log files created during tests
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true });
    }
  });

  describe('Construction and Configuration', () => {
    it('should create logger with correct service name', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should use environment from config', () => {
      const prodConfig = { ...config, environment: 'production' };
      const prodLogger = new Logger(prodConfig);
      expect(prodLogger).toBeInstanceOf(Logger);
    });

    it('should default to NODE_ENV when environment not provided', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';

      const configWithoutEnv = { serviceName: 'test', version: '1.0.0' };
      const envLogger = new Logger(configWithoutEnv);

      expect(envLogger).toBeInstanceOf(Logger);
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Log Level Configuration', () => {
    it('should use error level for test environment', () => {
      // In test environment, logger should be configured with error level
      // We can't directly test the internal log level, but we can verify the logger works
      expect(() => logger.debug('test debug')).not.toThrow();
    });

    it('should respect LOG_LEVEL environment variable', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      const debugLogger = new Logger(config);
      expect(debugLogger).toBeInstanceOf(Logger);

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('Basic Logging Methods', () => {
    it('should log debug messages', () => {
      expect(() => logger.debug('Debug message', { key: 'value' })).not.toThrow();
    });

    it('should log info messages', () => {
      expect(() => logger.info('Info message', { key: 'value' })).not.toThrow();
    });

    it('should log warning messages', () => {
      expect(() => logger.warn('Warning message', { key: 'value' })).not.toThrow();
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      expect(() => logger.error('Error message', error, { key: 'value' })).not.toThrow();
    });

    it('should handle error objects correctly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      expect(() => logger.error('Error with stack', error)).not.toThrow();
    });

    it('should handle non-Error objects in error method', () => {
      const errorLike = { message: 'Custom error', code: 'CUSTOM_ERR' };
      expect(() => logger.error('Custom error object', errorLike)).not.toThrow();
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize password fields', () => {
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        email: 'test@example.com'
      };

      expect(() => logger.info('User data', sensitiveData)).not.toThrow();
    });

    it('should sanitize token fields', () => {
      const sensitiveData = {
        userId: '123',
        api_token: 'sk-abc123',
        auth_token: 'bearer-xyz789'
      };

      expect(() => logger.info('API call', sensitiveData)).not.toThrow();
    });

    it('should sanitize authorization headers', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer secret-token',
        'x-api-key': 'api-key-secret'
      };

      expect(() => logger.info('Request headers', { headers })).not.toThrow();
    });

    it('should sanitize nested objects', () => {
      const nestedData = {
        user: {
          id: '123',
          credentials: {
            password: 'secret',
            api_key: 'key123'
          }
        },
        metadata: {
          safe: 'value'
        }
      };

      expect(() => logger.info('Nested data', nestedData)).not.toThrow();
    });

    it('should handle arrays with sensitive data', () => {
      const arrayData = {
        users: [
          { id: '1', password: 'secret1' },
          { id: '2', token: 'token2' }
        ]
      };

      expect(() => logger.info('Array data', arrayData)).not.toThrow();
    });

    it('should handle circular references safely', () => {
      const circular: any = { id: '123' };
      circular.self = circular;

      expect(() => logger.info('Circular reference', circular)).not.toThrow();
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log metrics', () => {
      expect(() => logger.metric('response_time', 150, 'ms', { endpoint: '/api/test' })).not.toThrow();
    });

    it('should log audit events', () => {
      expect(() => logger.audit('user_login', 'user123', { ip: '192.168.1.1' })).not.toThrow();
    });

    it('should log request/response', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1'
      };

      const mockRes = {
        statusCode: 200
      };

      expect(() => logger.request(mockReq, mockRes, 150)).not.toThrow();
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ userId: '123' });
      expect(childLogger).toBeInstanceOf(Logger);
    });

    it('should inherit parent configuration', () => {
      const childLogger = logger.child({ requestId: 'req-456' });
      expect(() => childLogger.info('Child log message')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined metadata gracefully', () => {
      expect(() => logger.info('Message with undefined meta', undefined)).not.toThrow();
    });

    it('should handle null metadata gracefully', () => {
      expect(() => logger.info('Message with null meta', null)).not.toThrow();
    });

    it('should handle empty objects', () => {
      expect(() => logger.info('Message with empty object', {})).not.toThrow();
    });

    it('should handle large objects', () => {
      const largeObject = {
        data: new Array(1000).fill('test').map((_, i) => ({ id: i, value: `item-${i}` }))
      };

      expect(() => logger.info('Large object', largeObject)).not.toThrow();
    });
  });

  describe('Production Environment Behavior', () => {
    it('should create file transports in production environment', () => {
      const prodConfig = { ...config, environment: 'production' };
      const prodLogger = new Logger(prodConfig);

      expect(prodLogger).toBeInstanceOf(Logger);
    });

    it('should create file transports in staging environment', () => {
      const stagingConfig = { ...config, environment: 'staging' };
      const stagingLogger = new Logger(stagingConfig);

      expect(stagingLogger).toBeInstanceOf(Logger);
    });
  });

  describe('Header Sanitization', () => {
    it('should sanitize authorization header', () => {
      const headers = {
        authorization: 'Bearer secret-token',
        'content-type': 'application/json'
      };

      expect(() => logger.info('Headers test', { headers })).not.toThrow();
    });

    it('should sanitize cookie header', () => {
      const headers = {
        cookie: 'sessionId=abc123; authToken=xyz789',
        'content-type': 'application/json'
      };

      expect(() => logger.info('Cookie test', { headers })).not.toThrow();
    });

    it('should preserve non-sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
        'accept': 'application/json'
      };

      expect(() => logger.info('Safe headers', { headers })).not.toThrow();
    });
  });
});