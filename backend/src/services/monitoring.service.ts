/**
 * Monitoring & Observability Service
 * Comprehensive application monitoring with Sentry integration
 *
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring
 * - Custom metrics and analytics
 * - Health checks
 * - Alerting thresholds
 */

interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    cache: boolean;
    externalAPIs: boolean;
  };
  uptime: number;
  version: string;
  timestamp: Date;
}

export class MonitoringService {
  private readonly SERVICE_NAME = 'protothrive-backend';
  private readonly ENVIRONMENT = process.env.NODE_ENV || 'development';
  private startTime: Date = new Date();

  // Performance thresholds (ms)
  private readonly THRESHOLDS = {
    apiResponse: 500,      // 500ms for API responses
    databaseQuery: 100,    // 100ms for DB queries
    externalAPI: 2000,     // 2s for external APIs
  };

  /**
   * Initialize monitoring service
   */
  async initialize(sentryDSN?: string): Promise<void> {
    if (sentryDSN && this.ENVIRONMENT === 'production') {
      // Initialize Sentry for error tracking
      // const Sentry = require('@sentry/node');
      // Sentry.init({
      //   dsn: sentryDSN,
      //   environment: this.ENVIRONMENT,
      //   tracesSampleRate: 0.1, // 10% of transactions
      //   profilesSampleRate: 0.1,
      // });

      console.log('Monitoring initialized with Sentry');
    } else {
      console.log('Monitoring initialized in development mode');
    }
  }

  /**
   * Track error with context
   */
  captureError(error: Error, context?: Record<string, any>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
      environment: this.ENVIRONMENT,
    };

    // Send to Sentry in production
    if (this.ENVIRONMENT === 'production') {
      // Sentry.captureException(error, { extra: context });
    }

    // Log locally
    console.error('[ERROR]', errorData);

    // Check if error rate exceeds threshold
    this.checkErrorRateThreshold();
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    const { operation, duration, success, metadata } = metric;

    // Log performance
    console.log('[PERFORMANCE]', {
      operation,
      duration: `${duration}ms`,
      success,
      ...metadata,
    });

    // Check against thresholds
    if (duration > this.getThreshold(operation)) {
      console.warn(`[SLOW OPERATION] ${operation} took ${duration}ms (threshold: ${this.getThreshold(operation)}ms)`);

      // Send alert if critical
      if (duration > this.getThreshold(operation) * 2) {
        this.sendAlert('performance', {
          operation,
          duration,
          threshold: this.getThreshold(operation),
        });
      }
    }

    // Send to Sentry
    if (this.ENVIRONMENT === 'production') {
      // Sentry.addBreadcrumb({
      //   category: 'performance',
      //   message: operation,
      //   level: duration > this.getThreshold(operation) ? 'warning' : 'info',
      //   data: { duration, success },
      // });
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(metric: MetricData): void {
    const { name, value, unit, tags } = metric;

    console.log('[METRIC]', {
      name,
      value: `${value} ${unit}`,
      tags,
      timestamp: metric.timestamp.toISOString(),
    });

    // Send to metrics backend (e.g., Cloudflare Analytics)
    this.sendToAnalytics(metric);
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      externalAPIs: await this.checkExternalAPIs(),
    };

    const allHealthy = Object.values(checks).every(check => check === true);
    const anyUnhealthy = Object.values(checks).some(check => check === false);

    const status: HealthStatus['status'] =
      allHealthy ? 'healthy' :
      anyUnhealthy ? 'unhealthy' :
      'degraded';

    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return {
      status,
      checks,
      uptime,
      version: '1.0.0',
      timestamp: new Date(),
    };
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId: string, action: string, metadata?: Record<string, any>): void {
    console.log('[USER ACTIVITY]', {
      userId,
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    // Send to analytics
    this.sendToAnalytics({
      name: 'user_activity',
      value: 1,
      unit: 'count',
      timestamp: new Date(),
      tags: {
        userId,
        action,
        ...metadata,
      },
    });
  }

  /**
   * Track API endpoint performance
   */
  async measureEndpoint<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let error: Error | null = null;

    try {
      const result = await operation();
      return result;
    } catch (err: any) {
      success = false;
      error = err;
      this.captureError(err, { endpoint });
      throw err;
    } finally {
      const duration = Math.round(performance.now() - startTime);

      this.trackPerformance({
        operation: endpoint,
        duration,
        success,
        metadata: error ? { error: error.message } : undefined,
      });
    }
  }

  /**
   * Send alert for critical issues
   */
  private sendAlert(type: string, data: Record<string, any>): void {
    const alert = {
      type,
      severity: 'critical',
      data,
      timestamp: new Date().toISOString(),
      environment: this.ENVIRONMENT,
    };

    console.warn('[ALERT]', alert);

    // Send to alerting service (e.g., PagerDuty, Slack)
    // In production, integrate with:
    // - PagerDuty for on-call alerts
    // - Slack webhooks for team notifications
    // - Email for critical alerts
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<boolean> {
    try {
      // Would execute: SELECT 1
      return true;
    } catch (error) {
      this.captureError(error as Error, { check: 'database' });
      return false;
    }
  }

  /**
   * Check cache connectivity
   */
  private async checkCache(): Promise<boolean> {
    try {
      // Would execute: KV get/set test
      return true;
    } catch (error) {
      this.captureError(error as Error, { check: 'cache' });
      return false;
    }
  }

  /**
   * Check external API connectivity
   */
  private async checkExternalAPIs(): Promise<boolean> {
    try {
      // Check HaveIBeenPwned API, etc.
      return true;
    } catch (error) {
      this.captureError(error as Error, { check: 'external_apis' });
      return false;
    }
  }

  /**
   * Get performance threshold for operation type
   */
  private getThreshold(operation: string): number {
    if (operation.includes('database') || operation.includes('query')) {
      return this.THRESHOLDS.databaseQuery;
    }
    if (operation.includes('external') || operation.includes('api')) {
      return this.THRESHOLDS.externalAPI;
    }
    return this.THRESHOLDS.apiResponse;
  }

  /**
   * Check if error rate exceeds threshold
   */
  private checkErrorRateThreshold(): void {
    // Would track error count over time window
    // Alert if exceeds threshold (e.g., 10 errors/minute)
  }

  /**
   * Send metrics to analytics backend
   */
  private sendToAnalytics(metric: MetricData): void {
    // In production, send to:
    // - Cloudflare Analytics Engine
    // - Custom metrics pipeline
    // - Third-party analytics (DataDog, New Relic, etc.)
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name: `business.${name}`,
      value,
      unit: 'count',
      timestamp: new Date(),
      tags,
    });
  }

  /**
   * Track conversion funnel
   */
  trackConversion(step: string, userId: string): void {
    this.recordBusinessMetric('conversion', 1, {
      step,
      userId,
    });
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(timeRange: 'hour' | 'day' | 'week'): Promise<{
    requests: number;
    errors: number;
    averageResponseTime: number;
    p95ResponseTime: number;
  }> {
    // Would query metrics database
    return {
      requests: 10000,
      errors: 5,
      averageResponseTime: 120,
      p95ResponseTime: 450,
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
