// Enterprise Structured Logging System
// Production-ready logging with different transports and formats

import winston from 'winston';
import type { AppError } from '../errors/AppError';

// Log levels with numeric priorities
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colors for console output
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Tell winston about our custom levels
winston.addColors(LOG_COLORS);

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  cost?: number;
  service?: string;
  [key: string]: any;
}

class Logger {
  private winston: winston.Logger;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.winston = this.createWinstonLogger();
  }

  private createWinstonLogger(): winston.Logger {
    const isDevelopment = this.environment === 'development';
    const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    );

    // JSON format for production
    const jsonFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: isDevelopment ? consoleFormat : jsonFormat,
        level: logLevel
      })
    ];

    // Add file transports in production
    if (!isDevelopment) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: jsonFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: jsonFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      );
    }

    return winston.createLogger({
      levels: LOG_LEVELS,
      level: logLevel,
      format: jsonFormat,
      transports,
      // Don't exit on handled exceptions
      exitOnError: false
    });
  }

  // Core logging methods
  error(message: string, context: LogContext = {}, error?: Error | AppError): void {
    const logData = {
      message,
      level: 'error',
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof Error && 'code' in error && { code: (error as any).code }),
          ...(error instanceof Error && 'statusCode' in error && { statusCode: (error as any).statusCode })
        }
      })
    };

    this.winston.error(logData);

    // Report critical errors to external monitoring in production
    if (this.environment === 'production' && this.shouldReportError(error)) {
      this.reportToExternalMonitoring(logData);
    }
  }

  warn(message: string, context: LogContext = {}): void {
    this.winston.warn({ message, ...context });
  }

  info(message: string, context: LogContext = {}): void {
    this.winston.info({ message, ...context });
  }

  http(message: string, context: LogContext = {}): void {
    this.winston.http({ message, ...context });
  }

  debug(message: string, context: LogContext = {}): void {
    this.winston.debug({ message, ...context });
  }

  // Specialized logging methods
  request(method: string, url: string, context: LogContext = {}): void {
    this.http('HTTP Request', {
      method,
      url,
      ...context
    });
  }

  response(method: string, url: string, statusCode: number, duration: number, context: LogContext = {}): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    this.winston.log(level, 'HTTP Response', {
      method,
      url,
      statusCode,
      duration,
      ...context
    });
  }

  security(event: string, context: LogContext = {}): void {
    this.warn(`SECURITY: ${event}`, {
      security_event: true,
      event,
      ...context
    });
  }

  business(event: string, context: LogContext = {}): void {
    this.info(`BUSINESS: ${event}`, {
      business_event: true,
      event,
      ...context
    });
  }

  cost(operation: string, amount: number, context: LogContext = {}): void {
    this.info('Cost Tracking', {
      cost_event: true,
      operation,
      amount,
      currency: 'USD',
      ...context
    });
  }

  performance(operation: string, duration: number, context: LogContext = {}): void {
    const level = duration > 5000 ? 'warn' : 'info'; // Warn for operations > 5s

    this.winston.log(level, 'Performance Metric', {
      performance_event: true,
      operation,
      duration,
      ...context
    });
  }

  audit(action: string, context: LogContext = {}): void {
    this.info(`AUDIT: ${action}`, {
      audit_event: true,
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // AI/ML specific logging
  aiOperation(operation: string, model: string, context: LogContext = {}): void {
    this.info('AI Operation', {
      ai_event: true,
      operation,
      model,
      ...context
    });
  }

  orchestration(roadmapId: string, status: 'started' | 'completed' | 'failed', context: LogContext = {}): void {
    const level = status === 'failed' ? 'error' : 'info';

    this.winston.log(level, 'AI Orchestration', {
      orchestration_event: true,
      roadmapId,
      status,
      ...context
    });
  }

  // Helper methods
  private shouldReportError(error?: Error | AppError): boolean {
    if (!error) return false;

    // Report system errors and unexpected errors
    if ('shouldReport' in error && typeof error.shouldReport === 'function') {
      return error.shouldReport();
    }

    return true; // Report unknown errors by default
  }

  private async reportToExternalMonitoring(logData: any): Promise<void> {
    try {
      // In production, this would integrate with services like:
      // - Sentry for error tracking
      // - DataDog for metrics
      // - CloudWatch for AWS environments
      // - Custom webhook endpoints

      console.log('📊 External Monitoring Report:', JSON.stringify(logData, null, 2));

      // Example: Send to webhook (mock implementation)
      // await fetch(process.env.ERROR_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData)
      // });

    } catch (reportError) {
      // Don't throw errors from error reporting
      console.error('Failed to report to external monitoring:', reportError);
    }
  }

  // Middleware helpers
  createRequestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const requestId = crypto.randomUUID();

      // Add request ID to request for downstream use
      req.requestId = requestId;

      this.request(req.method, req.url, {
        requestId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.response(req.method, req.url, res.statusCode, duration, {
          requestId,
          ip: req.ip || req.connection.remoteAddress
        });
      });

      next();
    };
  }

  // Query logger for debugging
  query(query: string, params: any[] = [], duration?: number, context: LogContext = {}): void {
    this.debug('Database Query', {
      query_event: true,
      query: query.replace(/\s+/g, ' ').trim(), // Normalize whitespace
      params: params.length > 0 ? params : undefined,
      duration,
      ...context
    });
  }

  // Graceful shutdown
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.close(() => {
        resolve();
      });
    });
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
export { Logger, LogContext };