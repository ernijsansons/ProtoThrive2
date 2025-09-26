export { Logger } from './logger';
export { Metrics } from './metrics';
export { HealthChecker } from './health';
export * from './types';

import { Logger } from './logger';
import { Metrics } from './metrics';
import { HealthChecker } from './health';
import { Config } from './types';

export interface ObservabilityConfig extends Config {
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
}

export class Observability {
  public logger: Logger;
  public metrics?: Metrics;
  public health?: HealthChecker;

  constructor(config: ObservabilityConfig) {
    this.logger = new Logger(config);

    if (config.enableMetrics !== false) {
      this.metrics = new Metrics(config.serviceName);
    }

    if (config.enableHealthChecks !== false) {
      this.health = new HealthChecker();
      this.setupDefaultHealthChecks();
    }
  }

  private setupDefaultHealthChecks(): void {
    if (!this.health) return;

    // Add memory check
    this.health.addCheck('memory', HealthChecker.createMemoryCheck(0.9));

    // Add disk check
    this.health.addCheck('disk', HealthChecker.createDiskSpaceCheck(0.9));
  }

  // Express middleware for request logging
  requestLogger() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();

      // Log request start
      this.logger.info(`Request started: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query
      });

      // Capture response
      const originalSend = res.send;
      const self = this;
      res.send = function(data: any) {
        const duration = Date.now() - startTime;

        // Log request completion
        self.logger.request(req, res, duration);

        // Record metrics
        if (self.metrics) {
          self.metrics.recordHttpRequest(
            req.method,
            req.route?.path || req.path,
            res.statusCode,
            duration
          );
        }

        return originalSend.call(res, data);
      };

      next();
    };
  }

  // Hono middleware for request logging
  honoRequestLogger() {
    return async (c: any, next: any) => {
      const startTime = Date.now();

      // Log request start
      this.logger.info(`Request started: ${c.req.method} ${c.req.path}`, {
        method: c.req.method,
        path: c.req.path,
        query: c.req.query
      });

      await next();

      const duration = Date.now() - startTime;

      // Log request completion
      this.logger.request(c.req, c.res, duration);

      // Record metrics
      if (this.metrics) {
        this.metrics.recordHttpRequest(
          c.req.method,
          c.req.path,
          c.res.status,
          duration
        );
      }
    };
  }

  // Error handler middleware
  errorHandler() {
    return (err: any, req: any, res: any, next: any) => {
      const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.logger.error('Request error occurred', err, {
        errorId,
        method: req.method,
        path: req.path,
        statusCode: err.statusCode || 500
      });

      if (this.metrics) {
        this.metrics.recordError(
          err.name || 'UnknownError',
          err.code || 'UNKNOWN',
          err.severity || 'high'
        );
      }

      res.status(err.statusCode || 500).json({
        error: {
          id: errorId,
          message: process.env.NODE_ENV === 'production'
            ? 'An error occurred processing your request'
            : err.message,
          code: err.code
        }
      });
    };
  }

  // Health check endpoint handler
  async healthHandler(req: any, res: any) {
    if (!this.health) {
      res.status(503).json({ error: 'Health checks not enabled' });
      return;
    }

    const health = await this.health.getHealth();
    const statusCode = health.status === 'healthy' ? 200
                      : health.status === 'degraded' ? 200
                      : 503;

    res.status(statusCode).json(health);
  }

  // Metrics endpoint handler
  async metricsHandler(req: any, res: any) {
    if (!this.metrics) {
      res.status(503).send('Metrics not enabled');
      return;
    }

    const metrics = await this.metrics.getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  }

  // Create singleton instance
  private static instance: Observability;

  static initialize(config: ObservabilityConfig): Observability {
    if (!Observability.instance) {
      Observability.instance = new Observability(config);
    }
    return Observability.instance;
  }

  static getInstance(): Observability {
    if (!Observability.instance) {
      throw new Error('Observability not initialized. Call initialize() first.');
    }
    return Observability.instance;
  }
}