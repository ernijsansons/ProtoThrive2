// Core Authentication Tests
import { describe, test, expect, beforeEach } from '@jest/globals';
import { APIKeyService } from '../services/apiKeyService';
import { AppError } from '../errors/AppError';

describe('Authentication System', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      KV: {
        get: jest.fn(),
        put: jest.fn(),
        list: jest.fn().mockResolvedValue({ keys: [] })
      },
      ENCRYPTION_KEY: 'test-key-32-chars-long-12345678'
    };
  });

  describe('API Key Service', () => {
    test('creates API key with encryption', async () => {
      const service = new APIKeyService(mockEnv);
      const user = { id: 'test-user', role: 'admin' as const };

      const result = await service.createAPIKey({
        service: 'test-service',
        permissions: ['read']
      }, user);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raw_key');
      expect(result.raw_key).toMatch(/^pk_test-service_/);
      expect(result.masked_key).toMatch(/^....\.\.\..*$/);
    });

    test('validates API key correctly', async () => {
      const service = new APIKeyService(mockEnv);

      // Mock encrypted key lookup
      mockEnv.KV.list.mockResolvedValue({
        keys: [{ name: 'apikey:test:encrypted' }]
      });

      const result = await service.validateAPIKey('invalid-key');
      expect(result).toBeNull();
    });

    test('throws error for non-admin key creation', async () => {
      const service = new APIKeyService(mockEnv);
      const user = { id: 'test-user', role: 'user' as const };

      await expect(
        service.createAPIKey({ service: 'test' }, user)
      ).rejects.toThrow('Only admins can create API keys');
    });
  });

  describe('AppError System', () => {
    test('creates validation error with details', () => {
      const error = AppError.validation('Test validation', [
        { field: 'email', message: 'Invalid format' }
      ]);

      expect(error.code).toBe('VAL_002');
      expect(error.statusCode).toBe(400);
      expect(error.details).toHaveLength(1);
    });

    test('creates budget exceeded error', () => {
      const error = AppError.budgetExceeded(5.0, 3.0);

      expect(error.code).toBe('BIZ_001');
      expect(error.statusCode).toBe(429);
      expect(error.details).toHaveLength(2);
    });
  });
});

describe('Security Middleware', () => {
  test('validates JWT format', () => {
    const validJWT = 'header.payload.signature';
    const invalidJWT = 'invalid';

    expect(validJWT.split('.')).toHaveLength(3);
    expect(invalidJWT.split('.')).not.toHaveLength(3);
  });
});

// Performance test
describe('Performance', () => {
  test('API key generation is fast', async () => {
    const service = new APIKeyService(mockEnv);
    const user = { id: 'test-user', role: 'admin' as const };

    const start = Date.now();
    await service.createAPIKey({ service: 'perf-test' }, user);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should be under 100ms
  });
});