import * as prometheus from 'prom-client';
import { MetricOptions } from './types';

export class Metrics {
  private register: prometheus.Registry;
  private counters: Map<string, prometheus.Counter>;
  private gauges: Map<string, prometheus.Gauge>;
  private histograms: Map<string, prometheus.Histogram>;
  private summaries: Map<string, prometheus.Summary>;

  constructor(serviceName: string) {
    this.register = new prometheus.Registry();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.summaries = new Map();

    // Add default labels
    this.register.setDefaultLabels({
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
      instance: process.env.HOSTNAME || 'unknown'
    });

    // Collect default metrics (CPU, memory, etc.)
    prometheus.collectDefaultMetrics({ register: this.register });

    // Initialize common metrics
    this.initializeCommonMetrics();
  }

  private initializeCommonMetrics(): void {
    // HTTP metrics
    this.createHistogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    this.createCounter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    // Business metrics
    this.createCounter({
      name: 'business_operations_total',
      help: 'Total number of business operations',
      labelNames: ['operation', 'status']
    });

    this.createGauge({
      name: 'active_users',
      help: 'Number of active users',
      labelNames: []
    });

    // AI metrics
    this.createHistogram({
      name: 'ai_inference_duration_seconds',
      help: 'Duration of AI inference in seconds',
      labelNames: ['model', 'task_type'],
      buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60]
    });

    this.createCounter({
      name: 'ai_tokens_used_total',
      help: 'Total number of AI tokens consumed',
      labelNames: ['model', 'task_type']
    });

    this.createGauge({
      name: 'ai_cost_usd',
      help: 'AI usage cost in USD',
      labelNames: ['model']
    });

    // System health
    this.createGauge({
      name: 'health_status',
      help: 'Health status of the service (1=healthy, 0=unhealthy)',
      labelNames: ['check']
    });

    // Error tracking
    this.createCounter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'code', 'severity']
    });
  }

  createCounter(options: MetricOptions): prometheus.Counter {
    if (this.counters.has(options.name)) {
      return this.counters.get(options.name)!;
    }

    const counter = new prometheus.Counter({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [this.register]
    });

    this.counters.set(options.name, counter);
    return counter;
  }

  createGauge(options: MetricOptions): prometheus.Gauge {
    if (this.gauges.has(options.name)) {
      return this.gauges.get(options.name)!;
    }

    const gauge = new prometheus.Gauge({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [this.register]
    });

    this.gauges.set(options.name, gauge);
    return gauge;
  }

  createHistogram(options: MetricOptions): prometheus.Histogram {
    if (this.histograms.has(options.name)) {
      return this.histograms.get(options.name)!;
    }

    const histogram = new prometheus.Histogram({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      buckets: options.buckets || prometheus.exponentialBuckets(0.001, 2, 10),
      registers: [this.register]
    });

    this.histograms.set(options.name, histogram);
    return histogram;
  }

  createSummary(options: MetricOptions): prometheus.Summary {
    if (this.summaries.has(options.name)) {
      return this.summaries.get(options.name)!;
    }

    const summary = new prometheus.Summary({
      name: options.name,
      help: options.help,
      labelNames: options.labelNames || [],
      registers: [this.register]
    });

    this.summaries.set(options.name, summary);
    return summary;
  }

  // Helper methods for common operations
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = { method, route, status_code: statusCode.toString() };

    this.counters.get('http_requests_total')?.inc(labels);
    this.histograms.get('http_request_duration_seconds')?.observe(labels, duration / 1000);
  }

  recordBusinessOperation(operation: string, success: boolean): void {
    const status = success ? 'success' : 'failure';
    this.counters.get('business_operations_total')?.inc({ operation, status });
  }

  recordAiUsage(model: string, taskType: string, tokens: number, duration: number, cost: number): void {
    this.counters.get('ai_tokens_used_total')?.inc({ model, task_type: taskType }, tokens);
    this.histograms.get('ai_inference_duration_seconds')?.observe({ model, task_type: taskType }, duration / 1000);
    this.gauges.get('ai_cost_usd')?.inc({ model }, cost);
  }

  recordError(type: string, code: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.counters.get('errors_total')?.inc({ type, code, severity });
  }

  setHealthStatus(check: string, healthy: boolean): void {
    this.gauges.get('health_status')?.set({ check }, healthy ? 1 : 0);
  }

  setActiveUsers(count: number): void {
    this.gauges.get('active_users')?.set(count);
  }

  // Get metrics for export
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Get metrics as JSON
  async getMetricsJson(): Promise<object> {
    return this.register.getMetricsAsJSON();
  }

  // Reset all metrics
  reset(): void {
    this.register.resetMetrics();
  }
}