import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Config, LogLevel } from './types';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

export class Logger {
  private logger: winston.Logger;
  private serviceName: string;
  private environment: string;

  constructor(config: Config) {
    this.serviceName = config.serviceName;
    this.environment = config.environment || process.env.NODE_ENV || 'development';

    const logLevel = this.getLogLevel();
    const transports = this.createTransports();

    this.logger = winston.createLogger({
      level: logLevel,
      format: this.getFormat(),
      defaultMeta: {
        service: this.serviceName,
        environment: this.environment,
        version: config.version,
        instance: config.instanceId || process.env.HOSTNAME || 'unknown'
      },
      transports,
      exitOnError: false
    });
  }

  private getLogLevel(): string {
    const envLogLevel = process.env.LOG_LEVEL;
    if (envLogLevel) return envLogLevel.toLowerCase();

    switch (this.environment) {
      case 'production':
        return 'info';
      case 'staging':
        return 'info';
      case 'development':
        return 'debug';
      case 'test':
        return 'error';
      default:
        return 'debug';
    }
  }

  private getFormat(): winston.Logform.Format {
    if (this.environment === 'development') {
      return combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        colorize(),
        printf(({ level, message, timestamp, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] [${service}] ${level}: ${message} ${metaStr}`;
        })
      );
    }

    return combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSZ' }),
      json()
    );
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport
    transports.push(new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    }));

    // File transports for non-development environments
    if (this.environment !== 'development') {
      // Combined log
      transports.push(new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '100m',
        maxFiles: '14d',
        handleExceptions: true,
        handleRejections: true
      }));

      // Error log
      transports.push(new DailyRotateFile({
        level: 'error',
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '30d',
        handleExceptions: true,
        handleRejections: true
      }));
    }

    return transports;
  }

  // Logging methods with structured data
  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = error instanceof Error
      ? {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          ...this.sanitizeMeta(meta)
        }
      : this.sanitizeMeta({ error, ...meta });

    this.logger.error(message, errorMeta);
  }

  // Performance and metrics logging
  metric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    this.logger.info('metric', {
      metric: {
        name,
        value,
        unit,
        tags: tags || {},
        timestamp: new Date().toISOString()
      }
    });
  }

  // Request logging
  request(req: any, res: any, duration: number): void {
    const logData = {
      request: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        ip: req.ip || req.connection?.remoteAddress
      },
      response: {
        statusCode: res.statusCode,
        duration
      }
    };

    if (res.statusCode >= 400) {
      this.warn(`Request failed: ${req.method} ${req.url}`, logData);
    } else {
      this.info(`Request completed: ${req.method} ${req.url}`, logData);
    }
  }

  // Audit logging for compliance
  audit(action: string, userId: string, details: any): void {
    this.info('AUDIT', {
      audit: {
        action,
        userId,
        details: this.sanitizeMeta(details),
        timestamp: new Date().toISOString()
      }
    });
  }

  // Helper to sanitize sensitive data
  private sanitizeMeta(meta: any): any {
    if (!meta) return {};

    const sensitive = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    const sanitized = { ...meta };

    const sanitizeObject = (obj: any, visited = new WeakSet()): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      // Handle circular references
      if (visited.has(obj)) {
        return '[CIRCULAR_REFERENCE]';
      }
      visited.add(obj);

      const result: any = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        const lowerKey = key.toLowerCase();
        if (sensitive.some(s => lowerKey.includes(s))) {
          result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          result[key] = sanitizeObject(obj[key], visited);
        } else {
          result[key] = obj[key];
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };
    const sensitive = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const key in sanitized) {
      if (sensitive.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  // Create child logger with additional context
  child(meta: any): Logger {
    const childConfig: Config = {
      serviceName: `${this.serviceName}:${meta.component || 'child'}`,
      environment: this.environment,
      version: meta.version,
      instanceId: meta.instanceId
    };

    return new Logger(childConfig);
  }
}