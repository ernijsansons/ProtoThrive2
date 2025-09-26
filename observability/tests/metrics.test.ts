import { Metrics } from '../src/metrics';
import * as prometheus from 'prom-client';

describe('Metrics', () => {
  let metrics: Metrics;

  beforeEach(() => {
    // Clear the default registry to avoid conflicts
    prometheus.register.clear();
    metrics = new Metrics('test-service');
  });

  afterEach(() => {
    prometheus.register.clear();
  });

  describe('Construction and Initialization', () => {
    it('should create metrics instance with service name', () => {
      expect(metrics).toBeInstanceOf(Metrics);
    });

    it('should initialize common metrics', () => {
      // Test that common metrics are created
      expect(() => metrics.recordHttpRequest('GET', '/test', 200, 100)).not.toThrow();
      expect(() => metrics.recordBusinessOperation('test_operation', true)).not.toThrow();
    });

    it('should set default labels', async () => {
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('test-service');
    });
  });

  describe('HTTP Metrics', () => {
    it('should record HTTP request metrics', () => {
      expect(() => {
        metrics.recordHttpRequest('GET', '/api/users', 200, 150);
      }).not.toThrow();
    });

    it('should record different HTTP methods', () => {
      expect(() => {
        metrics.recordHttpRequest('POST', '/api/users', 201, 250);
        metrics.recordHttpRequest('PUT', '/api/users/123', 200, 180);
        metrics.recordHttpRequest('DELETE', '/api/users/123', 204, 75);
      }).not.toThrow();
    });

    it('should record error status codes', () => {
      expect(() => {
        metrics.recordHttpRequest('GET', '/api/users', 404, 50);
        metrics.recordHttpRequest('POST', '/api/users', 500, 300);
      }).not.toThrow();
    });

    it('should handle various response times', () => {
      expect(() => {
        metrics.recordHttpRequest('GET', '/fast', 200, 10);
        metrics.recordHttpRequest('GET', '/slow', 200, 5000);
      }).not.toThrow();
    });
  });

  describe('Business Metrics', () => {
    it('should record successful business operations', () => {
      expect(() => {
        metrics.recordBusinessOperation('user_registration', true);
      }).not.toThrow();
    });

    it('should record failed business operations', () => {
      expect(() => {
        metrics.recordBusinessOperation('payment_processing', false);
      }).not.toThrow();
    });

    it('should record various operation types', () => {
      expect(() => {
        metrics.recordBusinessOperation('user_login', true);
        metrics.recordBusinessOperation('data_export', true);
        metrics.recordBusinessOperation('email_send', false);
      }).not.toThrow();
    });
  });

  describe('AI Metrics', () => {
    it('should record AI usage metrics', () => {
      expect(() => {
        metrics.recordAiUsage('gpt-4', 'code_generation', 150, 2000, 0.003);
      }).not.toThrow();
    });

    it('should record different AI models', () => {
      expect(() => {
        metrics.recordAiUsage('gpt-3.5-turbo', 'text_completion', 100, 1500, 0.001);
        metrics.recordAiUsage('claude-3', 'analysis', 200, 3000, 0.005);
      }).not.toThrow();
    });

    it('should record different task types', () => {
      expect(() => {
        metrics.recordAiUsage('gpt-4', 'code_review', 75, 1200, 0.002);
        metrics.recordAiUsage('gpt-4', 'documentation', 125, 1800, 0.004);
      }).not.toThrow();
    });
  });

  describe('Error Metrics', () => {
    it('should record error metrics', () => {
      expect(() => {
        metrics.recordError('ValidationError', 'VAL-400', 'medium');
      }).not.toThrow();
    });

    it('should record different error severities', () => {
      expect(() => {
        metrics.recordError('DatabaseError', 'DB-500', 'critical');
        metrics.recordError('AuthError', 'AUTH-401', 'high');
        metrics.recordError('RateLimitError', 'RATE-429', 'low');
      }).not.toThrow();
    });
  });

  describe('Health Metrics', () => {
    it('should set health status', () => {
      expect(() => {
        metrics.setHealthStatus('database', true);
        metrics.setHealthStatus('redis', false);
      }).not.toThrow();
    });

    it('should set active users', () => {
      expect(() => {
        metrics.setActiveUsers(150);
        metrics.setActiveUsers(0);
      }).not.toThrow();
    });
  });

  describe('Custom Metrics', () => {
    it('should create custom counter', () => {
      const counter = metrics.createCounter({
        name: 'custom_counter_total',
        help: 'A custom counter',
        labelNames: ['type']
      });

      expect(counter).toBeDefined();
      expect(() => counter.inc({ type: 'test' })).not.toThrow();
    });

    it('should create custom gauge', () => {
      const gauge = metrics.createGauge({
        name: 'custom_gauge',
        help: 'A custom gauge',
        labelNames: ['status']
      });

      expect(gauge).toBeDefined();
      expect(() => gauge.set({ status: 'active' }, 42)).not.toThrow();
    });

    it('should create custom histogram', () => {
      const histogram = metrics.createHistogram({
        name: 'custom_histogram_seconds',
        help: 'A custom histogram',
        labelNames: ['operation'],
        buckets: [0.1, 0.5, 1, 2, 5]
      });

      expect(histogram).toBeDefined();
      expect(() => histogram.observe({ operation: 'test' }, 1.5)).not.toThrow();
    });

    it('should create custom summary', () => {
      const summary = metrics.createSummary({
        name: 'custom_summary_seconds',
        help: 'A custom summary',
        labelNames: ['type']
      });

      expect(summary).toBeDefined();
      expect(() => summary.observe({ type: 'request' }, 0.5)).not.toThrow();
    });

    it('should return existing metric when creating with same name', () => {
      const counter1 = metrics.createCounter({
        name: 'duplicate_counter',
        help: 'First counter'
      });

      const counter2 = metrics.createCounter({
        name: 'duplicate_counter',
        help: 'Second counter'
      });

      expect(counter1).toBe(counter2);
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics in Prometheus format', async () => {
      // Record some metrics first
      metrics.recordHttpRequest('GET', '/test', 200, 100);
      metrics.recordBusinessOperation('test_op', true);

      const metricsText = await metrics.getMetrics();
      expect(typeof metricsText).toBe('string');
      expect(metricsText.length).toBeGreaterThan(0);
    });

    it('should export metrics in JSON format', async () => {
      // Record some metrics first
      metrics.recordHttpRequest('POST', '/test', 201, 150);

      const metricsJson = await metrics.getMetricsJson();
      expect(typeof metricsJson).toBe('object');
      expect(Array.isArray(metricsJson)).toBe(true);
    });

    it('should include default system metrics', async () => {
      const metricsText = await metrics.getMetrics();

      // Should include some default Node.js metrics
      expect(metricsText).toMatch(/process_/);
      expect(metricsText).toMatch(/nodejs_/);
    });

    it('should include custom service labels', async () => {
      const metricsText = await metrics.getMetrics();
      expect(metricsText).toContain('service=\"test-service\"');
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', () => {
      // Record some metrics
      metrics.recordHttpRequest('GET', '/test', 200, 100);
      metrics.recordBusinessOperation('test_op', true);

      // Reset should not throw
      expect(() => metrics.reset()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid metric names gracefully', () => {
      // Prometheus has strict naming rules, but our wrapper should handle it
      expect(() => {
        metrics.createCounter({
          name: 'invalid-name-with-dashes',
          help: 'Invalid metric name'
        });
      }).not.toThrow();
    });

    it('should handle empty label values', () => {
      expect(() => {
        metrics.recordHttpRequest('', '', 200, 100);
      }).not.toThrow();
    });

    it('should handle negative values appropriately', () => {
      expect(() => {
        metrics.recordHttpRequest('GET', '/test', 200, -100);
      }).not.toThrow();
    });

    it('should handle very large values', () => {
      expect(() => {
        metrics.recordHttpRequest('GET', '/test', 200, 999999);
        metrics.setActiveUsers(1000000);
      }).not.toThrow();
    });
  });

  describe('Histogram Buckets', () => {
    it('should use default buckets for HTTP requests', () => {
      // Test that histogram with default buckets works
      expect(() => {
        metrics.recordHttpRequest('GET', '/fast', 200, 0.001);
        metrics.recordHttpRequest('GET', '/medium', 200, 0.1);
        metrics.recordHttpRequest('GET', '/slow', 200, 5);
      }).not.toThrow();
    });

    it('should allow custom buckets for histograms', () => {
      const customHistogram = metrics.createHistogram({
        name: 'custom_duration_seconds',
        help: 'Custom duration with specific buckets',
        buckets: [0.01, 0.1, 1, 10, 100]
      });

      expect(() => {
        customHistogram.observe(0.05);
        customHistogram.observe(5);
        customHistogram.observe(50);
      }).not.toThrow();
    });
  });
});