/**
 * Monitoring Service Implementation
 * Ref: CLAUDE.md - System monitoring and metrics collection
 */

import {
  IMonitoringService,
  Metric,
  ErrorContext,
  HealthStatus,
  TraceHandle,
} from './interfaces';

interface MetricBuffer {
  metrics: Metric[];
  lastFlush: number;
}

class TraceHandleImpl implements TraceHandle {
  private startTime: number;
  private metadata: Record<string, any> = {};
  private events: Array<{ name: string; timestamp: number; data?: any }> = [];

  constructor(
    private name: string,
    private service: MonitoringService
  ) {
    this.startTime = Date.now();
  }

  end(): void {
    const duration = Date.now() - this.startTime;
    this.service.recordMetric({
      name: `trace.${this.name}.duration`,
      value: duration,
      type: 'timing',
      tags: {
        trace: this.name,
        ...this.metadata
      }
    });

    // Log trace details
    console.log(`Trace ${this.name} completed in ${duration}ms`, {
      metadata: this.metadata,
      events: this.events
    });
  }

  addMetadata(metadata: Record<string, any>): void {
    Object.assign(this.metadata, metadata);
  }

  recordEvent(name: string, data?: any): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      data
    });
  }
}

export class MonitoringService implements IMonitoringService {
  private db: any;
  private kv: any;
  private metricBuffer: MetricBuffer = {
    metrics: [],
    lastFlush: Date.now()
  };
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds
  private readonly BATCH_SIZE = 100;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  constructor(env: any) {
    this.db = env.DB;
    this.kv = env.KV;
    this.startAutoFlush();
    this.registerDefaultHealthChecks();
  }

  async recordMetric(metric: Metric): Promise<void> {
    // Add timestamp if not present
    if (!metric.timestamp) {
      metric.timestamp = new Date();
    }

    // Add to buffer
    this.metricBuffer.metrics.push(metric);

    // Flush if buffer is full
    if (this.metricBuffer.metrics.length >= this.BATCH_SIZE) {
      await this.flushMetrics();
    }

    // Log high-priority metrics immediately
    if (metric.type === 'counter' && metric.name.includes('error')) {
      console.error(`Metric: ${metric.name}`, metric);
    }
  }

  async recordError(error: Error, context?: ErrorContext): Promise<void> {
    const errorId = crypto.randomUUID();

    // Log to console
    console.error(`Error ${errorId}:`, error, context);

    // Record error metric
    await this.recordMetric({
      name: 'errors.count',
      value: 1,
      type: 'counter',
      tags: {
        error_type: error.name,
        endpoint: context?.endpoint || 'unknown',
        ...(context?.metadata || {})
      }
    });

    // Store error details
    if (this.db) {
      try {
        await this.db.prepare(`
          INSERT INTO error_logs (
            id, error_type, message, stack, context, timestamp
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          errorId,
          error.name,
          error.message,
          error.stack || '',
          JSON.stringify(context || {})
        ).run();
      } catch (dbError) {
        console.error('Failed to store error in database:', dbError);
      }
    }

    // Store in KV for immediate access
    if (this.kv) {
      try {
        await this.kv.put(
          `error:${errorId}`,
          JSON.stringify({
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            context,
            timestamp: Date.now()
          }),
          { expirationTtl: 86400 } // 24 hours
        );
      } catch (kvError) {
        console.error('Failed to store error in KV:', kvError);
      }
    }

    // Send alert for critical errors
    if (context?.metadata?.severity === 'critical') {
      await this.sendAlert(error, context);
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const services: HealthStatus['services'] = {};

    // Check all registered services
    for (const [name, check] of Array.from(this.healthChecks.entries())) {
      const startTime = Date.now();
      let healthy = false;

      try {
        healthy = await Promise.race([
          check(),
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
        ]);
      } catch {
        healthy = false;
      }

      const latency = Date.now() - startTime;

      services[name] = {
        status: healthy ? 'healthy' : 'unhealthy',
        latency,
        errorRate: await this.getServiceErrorRate(name),
        lastCheck: new Date()
      };
    }

    // Calculate overall metrics
    const metrics = await this.getSystemMetrics();

    // Determine overall health
    const unhealthyCount = Object.values(services).filter(s => s.status === 'unhealthy').length;
    const degradedCount = Object.values(services).filter(s => s.status === 'degraded').length;

    let overall: HealthStatus['overall'];
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      services,
      metrics
    };
  }

  startTrace(name: string): TraceHandle {
    return new TraceHandleImpl(name, this);
  }

  // Private helper methods

  private registerDefaultHealthChecks(): void {
    // Database health check
    this.healthChecks.set('database', async () => {
      if (!this.db) return false;
      try {
        const result = await this.db.prepare('SELECT 1').first();
        return result !== null;
      } catch {
        return false;
      }
    });

    // Cache health check
    this.healthChecks.set('cache', async () => {
      if (!this.kv) return false;
      try {
        const testKey = `health:${Date.now()}`;
        await this.kv.put(testKey, 'test', { expirationTtl: 60 });
        const value = await this.kv.get(testKey);
        await this.kv.delete(testKey);
        return value === 'test';
      } catch {
        return false;
      }
    });
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricBuffer.metrics.length === 0) return;

    const metricsToFlush = [...this.metricBuffer.metrics];
    this.metricBuffer.metrics = [];
    this.metricBuffer.lastFlush = Date.now();

    // Group metrics by type for efficient storage
    const grouped = metricsToFlush.reduce((acc, metric) => {
      const key = `${metric.type}:${metric.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, Metric[]>);

    // Store in KV for real-time access
    if (this.kv) {
      try {
        await Promise.all(
          Object.entries(grouped).map(([key, metrics]) =>
            this.kv.put(
              `metrics:${key}:${Date.now()}`,
              JSON.stringify(metrics),
              { expirationTtl: 3600 } // 1 hour
            )
          )
        );
      } catch (error) {
        console.error('Failed to flush metrics to KV:', error);
      }
    }

    // Store aggregated metrics in database
    if (this.db) {
      try {
        const aggregated = this.aggregateMetrics(metricsToFlush);
        await Promise.all(
          aggregated.map(agg =>
            this.db.prepare(`
              INSERT INTO metrics (
                id, name, type, value, count, tags, timestamp
              ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              crypto.randomUUID(),
              agg.name,
              agg.type,
              agg.value,
              agg.count,
              JSON.stringify(agg.tags || {})
            ).run()
          )
        );
      } catch (error) {
        console.error('Failed to store metrics in database:', error);
      }
    }
  }

  private aggregateMetrics(metrics: Metric[]): Array<{
    name: string;
    type: string;
    value: number;
    count: number;
    tags: Record<string, string>;
  }> {
    const aggregated = new Map<string, any>();

    for (const metric of metrics) {
      const key = `${metric.type}:${metric.name}`;

      if (!aggregated.has(key)) {
        aggregated.set(key, {
          name: metric.name,
          type: metric.type,
          values: [],
          tags: metric.tags || {},
          count: 0
        });
      }

      const agg = aggregated.get(key);
      agg.values.push(metric.value);
      agg.count++;
    }

    return Array.from(aggregated.values()).map(agg => ({
      name: agg.name,
      type: agg.type,
      value: agg.type === 'gauge'
        ? agg.values[agg.values.length - 1] // Last value for gauges
        : agg.values.reduce((a: number, b: number) => a + b, 0) / agg.count, // Average for others
      count: agg.count,
      tags: agg.tags
    }));
  }

  private async getServiceErrorRate(serviceName: string): Promise<number> {
    if (!this.kv) return 0;

    try {
      const keys = await this.kv.list({
        prefix: `metrics:counter:errors.${serviceName}`
      });

      if (keys.keys.length === 0) return 0;

      // Calculate error rate from recent metrics
      let totalErrors = 0;
      let totalRequests = 1; // Avoid division by zero

      for (const key of keys.keys) {
        const metrics = JSON.parse(await this.kv.get(key.name));
        totalErrors += metrics.reduce((sum: number, m: Metric) => sum + m.value, 0);
      }

      const requestKeys = await this.kv.list({
        prefix: `metrics:counter:requests.${serviceName}`
      });

      for (const key of requestKeys.keys) {
        const metrics = JSON.parse(await this.kv.get(key.name));
        totalRequests += metrics.reduce((sum: number, m: Metric) => sum + m.value, 0);
      }

      return totalErrors / totalRequests;
    } catch {
      return 0;
    }
  }

  private async getSystemMetrics(): Promise<HealthStatus['metrics']> {
    // Default metrics
    const defaultMetrics = {
      requestRate: 0,
      errorRate: 0,
      avgResponseTime: 0,
      activeConnections: 0
    };

    if (!this.kv) return defaultMetrics;

    try {
      // Get recent metrics from KV
      const [requestMetrics, errorMetrics, responseMetrics] = await Promise.all([
        this.getRecentMetrics('requests.count'),
        this.getRecentMetrics('errors.count'),
        this.getRecentMetrics('response.time')
      ]);

      const timeWindow = 60000; // 1 minute
      const requestRate = requestMetrics.length > 0
        ? requestMetrics.reduce((sum, m) => sum + m.value, 0) / (timeWindow / 1000)
        : 0;

      const errorRate = requestMetrics.length > 0
        ? errorMetrics.reduce((sum, m) => sum + m.value, 0) / requestMetrics.reduce((sum, m) => sum + m.value, 1)
        : 0;

      const avgResponseTime = responseMetrics.length > 0
        ? responseMetrics.reduce((sum, m) => sum + m.value, 0) / responseMetrics.length
        : 0;

      return {
        requestRate,
        errorRate,
        avgResponseTime,
        activeConnections: 0 // Would need WebSocket tracking for this
      };
    } catch {
      return defaultMetrics;
    }
  }

  private async getRecentMetrics(metricName: string): Promise<Metric[]> {
    if (!this.kv) return [];

    try {
      const keys = await this.kv.list({
        prefix: `metrics:*:${metricName}:`
      });

      const metrics: Metric[] = [];
      const cutoff = Date.now() - 60000; // Last minute

      for (const key of keys.keys) {
        const timestamp = parseInt(key.name.split(':').pop() || '0');
        if (timestamp > cutoff) {
          const data = await this.kv.get(key.name);
          if (data) {
            metrics.push(...JSON.parse(data));
          }
        }
      }

      return metrics;
    } catch {
      return [];
    }
  }

  private async sendAlert(error: Error, context: ErrorContext): Promise<void> {
    const alert = {
      severity: context.metadata?.severity || 'high',
      error: error.message,
      context,
      timestamp: Date.now()
    };

    if (this.kv) {
      await this.kv.put(
        `alert:error:${Date.now()}`,
        JSON.stringify(alert),
        { expirationTtl: 86400 } // 24 hours
      );
    }

    console.error('🚨 CRITICAL ERROR ALERT:', alert);
  }

  private startAutoFlush(): void {
    setInterval(async () => {
      if (Date.now() - this.metricBuffer.lastFlush >= this.FLUSH_INTERVAL) {
        await this.flushMetrics();
      }
    }, this.FLUSH_INTERVAL);
  }

  // Cleanup
  dispose(): void {
    this.flushMetrics().catch(console.error);
    this.healthChecks.clear();
  }
}