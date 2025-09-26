// Ref: CLAUDE.md - Centralized Validation Middleware
// Enterprise-grade validation middleware for REST and GraphQL APIs

import { Context, Next } from 'hono';
import { z } from 'zod';
import {
  validateWithRateLimit,
  ValidationError,
  validateInputSize,
  DEFAULT_VALIDATION_CONFIG,
  ValidationConfig,
  globalRateLimiter
} from '../validation/hardened-validation';

// Middleware configuration
export interface ValidationMiddlewareConfig {
  validation: ValidationConfig;
  enableRateLimit: boolean;
  enableSizeCheck: boolean;
  enableSecurityLogging: boolean;
  strictMode: boolean; // Extra security checks in production
}

export const DEFAULT_MIDDLEWARE_CONFIG: ValidationMiddlewareConfig = {
  validation: DEFAULT_VALIDATION_CONFIG,
  enableRateLimit: true,
  enableSizeCheck: true,
  enableSecurityLogging: true,
  strictMode: false
};

// Security event logger for validation middleware
class ValidationSecurityLogger {
  private static instance: ValidationSecurityLogger;
  private suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();
  private blockedIPs = new Set<string>();

  static getInstance(): ValidationSecurityLogger {
    if (!ValidationSecurityLogger.instance) {
      ValidationSecurityLogger.instance = new ValidationSecurityLogger();
    }
    return ValidationSecurityLogger.instance;
  }

  logValidationFailure(
    ip: string,
    userAgent: string,
    endpoint: string,
    error: ValidationError,
    context: any
  ): void {
    const now = Date.now();
    const ipRecord = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: 0 };

    // Reset count if more than 1 hour has passed
    if (now - ipRecord.lastSeen > 3600000) {
      ipRecord.count = 0;
    }

    ipRecord.count++;
    ipRecord.lastSeen = now;
    this.suspiciousIPs.set(ip, ipRecord);

    // Block IP after 50 failed validations in an hour
    if (ipRecord.count > 50) {
      this.blockedIPs.add(ip);
      console.error('IP blocked due to excessive validation failures:', {
        ip,
        count: ipRecord.count,
        endpoint,
        timestamp: new Date().toISOString()
      });
    }

    // Log security event
    console.warn('Validation Security Event:', {
      ip,
      userAgent,
      endpoint,
      errorType: error.code,
      errorCount: error.details.length,
      severity: this.calculateSeverity(error),
      timestamp: new Date().toISOString(),
      requestId: context.req?.header?.('x-request-id') || 'unknown'
    });
  }

  logSuspiciousActivity(ip: string, reason: string, details: any): void {
    console.warn('Suspicious Activity Detected:', {
      ip,
      reason,
      details,
      timestamp: new Date().toISOString()
    });
  }

  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
  }

  private calculateSeverity(error: ValidationError): 'low' | 'medium' | 'high' {
    if (error.statusCode === 429) return 'high'; // Rate limiting
    if (error.details.length > 10) return 'high'; // Multiple errors
    if (error.details.some(d => d.message.includes('dangerous'))) return 'high';
    if (error.details.some(d => d.message.includes('malicious'))) return 'high';
    if (error.details.length > 3) return 'medium';
    return 'low';
  }
}

// Request validation middleware
export function createValidationMiddleware(config: Partial<ValidationMiddlewareConfig> = {}) {
  const middlewareConfig: ValidationMiddlewareConfig = {
    ...DEFAULT_MIDDLEWARE_CONFIG,
    ...config
  };

  return async (c: Context, next: Next) => {
    const securityLogger = ValidationSecurityLogger.getInstance();
    const ip = c.req.header('x-forwarded-for') ||
               c.req.header('x-real-ip') ||
               'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    // Check if IP is blocked
    if (middlewareConfig.enableSecurityLogging && securityLogger.isBlocked(ip)) {
      console.warn('Blocked IP attempted access:', { ip, endpoint: c.req.path });
      return c.json({
        error: 'Access denied',
        code: 'IP_BLOCKED',
        message: 'Your IP has been temporarily blocked due to suspicious activity'
      }, 403);
    }

    // Add validation context to request
    c.set('validationConfig', middlewareConfig);
    c.set('securityLogger', securityLogger);

    await next();
  };
}

// Body validation decorator for Hono handlers
export function validateBody<T>(schema: z.ZodSchema<T>, config?: Partial<ValidationMiddlewareConfig>) {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (c: Context) {
      const middlewareConfig = c.get('validationConfig') || { ...DEFAULT_MIDDLEWARE_CONFIG, ...config };
      const securityLogger = c.get('securityLogger') || ValidationSecurityLogger.getInstance();

      const ip = c.req.header('x-forwarded-for') || 'unknown';
      const userAgent = c.req.header('user-agent') || 'unknown';
      const userIdentifier = c.get('user')?.id || ip;

      try {
        // Parse request body
        const body = await c.req.json();

        // Size validation
        if (middlewareConfig.enableSizeCheck) {
          validateInputSize(body, middlewareConfig.validation);
        }

        // Validation with rate limiting
        let result;
        if (middlewareConfig.enableRateLimit) {
          result = validateWithRateLimit(schema, body, userIdentifier, middlewareConfig.validation);
        } else {
          result = { success: true, data: schema.parse(body) };
        }

        if (!result.success) {
          // Log security event
          if (middlewareConfig.enableSecurityLogging) {
            securityLogger.logValidationFailure(
              ip,
              userAgent,
              c.req.path,
              result.error,
              c
            );
          }

          return c.json({
            error: 'Validation failed',
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
            timestamp: Date.now()
          }, result.error.statusCode);
        }

        // Add validated data to context
        c.set('validatedBody', result.data);

        // Call original method
        return await method.call(this, c);

      } catch (error: any) {
        console.error('Validation middleware error:', error);

        if (error instanceof ValidationError) {
          if (middlewareConfig.enableSecurityLogging) {
            securityLogger.logValidationFailure(ip, userAgent, c.req.path, error, c);
          }

          return c.json({
            error: 'Validation failed',
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp: Date.now()
          }, error.statusCode);
        }

        return c.json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during validation'
        }, 500);
      }
    };
  };
}

// Query parameters validation middleware
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const middlewareConfig = c.get('validationConfig') || DEFAULT_MIDDLEWARE_CONFIG;
    const securityLogger = c.get('securityLogger') || ValidationSecurityLogger.getInstance();

    try {
      // Parse query parameters
      const query = Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] || ''));

      // Validate query parameters
      const result = schema.safeParse(query);

      if (!result.success) {
        const validationError = new ValidationError(result.error.errors);

        if (middlewareConfig.enableSecurityLogging) {
          const ip = c.req.header('x-forwarded-for') || 'unknown';
          const userAgent = c.req.header('user-agent') || 'unknown';

          securityLogger.logValidationFailure(
            ip,
            userAgent,
            c.req.path,
            validationError,
            c
          );
        }

        return c.json({
          error: 'Invalid query parameters',
          code: 'QUERY_VALIDATION_ERROR',
          details: validationError.details,
          timestamp: Date.now()
        }, 400);
      }

      // Add validated query to context
      c.set('validatedQuery', result.data);
      await next();

    } catch (error: any) {
      console.error('Query validation error:', error);
      return c.json({
        error: 'Query validation failed',
        code: 'QUERY_ERROR'
      }, 500);
    }
  };
}

// Path parameter validation middleware
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      // Get path parameters
      const params = c.req.param();

      // Validate parameters
      const result = schema.safeParse(params);

      if (!result.success) {
        const validationError = new ValidationError(result.error.errors);

        return c.json({
          error: 'Invalid path parameters',
          code: 'PARAMS_VALIDATION_ERROR',
          details: validationError.details,
          timestamp: Date.now()
        }, 400);
      }

      // Add validated params to context
      c.set('validatedParams', result.data);
      await next();

    } catch (error: any) {
      console.error('Parameter validation error:', error);
      return c.json({
        error: 'Parameter validation failed',
        code: 'PARAMS_ERROR'
      }, 500);
    }
  };
}

// Comprehensive request validation middleware
export function validateRequest<TBody = any, TQuery = any, TParams = any>(options: {
  body?: z.ZodSchema<TBody>;
  query?: z.ZodSchema<TQuery>;
  params?: z.ZodSchema<TParams>;
  config?: Partial<ValidationMiddlewareConfig>;
}) {
  return async (c: Context, next: Next) => {
    const middlewareConfig = { ...DEFAULT_MIDDLEWARE_CONFIG, ...options.config };
    const securityLogger = ValidationSecurityLogger.getInstance();

    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const userIdentifier = c.get('user')?.id || ip;

    try {
      const validatedData: any = {};

      // Validate body if schema provided
      if (options.body && (c.req.method === 'POST' || c.req.method === 'PUT' || c.req.method === 'PATCH')) {
        const body = await c.req.json();

        if (middlewareConfig.enableSizeCheck) {
          validateInputSize(body, middlewareConfig.validation);
        }

        const result = middlewareConfig.enableRateLimit
          ? validateWithRateLimit(options.body, body, userIdentifier, middlewareConfig.validation)
          : { success: true, data: options.body.parse(body) };

        if (!result.success) {
          if (middlewareConfig.enableSecurityLogging) {
            securityLogger.logValidationFailure(ip, userAgent, c.req.path, result.error, c);
          }

          return c.json({
            error: 'Body validation failed',
            code: result.error.code,
            details: result.error.details
          }, result.error.statusCode);
        }

        validatedData.body = result.data;
      }

      // Validate query parameters if schema provided
      if (options.query) {
        const query = Object.fromEntries(new URLSearchParams(c.req.url.split('?')[1] || ''));
        const result = options.query.safeParse(query);

        if (!result.success) {
          const validationError = new ValidationError(result.error.errors);

          if (middlewareConfig.enableSecurityLogging) {
            securityLogger.logValidationFailure(ip, userAgent, c.req.path, validationError, c);
          }

          return c.json({
            error: 'Query validation failed',
            code: 'QUERY_VALIDATION_ERROR',
            details: validationError.details
          }, 400);
        }

        validatedData.query = result.data;
      }

      // Validate path parameters if schema provided
      if (options.params) {
        const params = c.req.param();
        const result = options.params.safeParse(params);

        if (!result.success) {
          const validationError = new ValidationError(result.error.errors);

          return c.json({
            error: 'Parameter validation failed',
            code: 'PARAMS_VALIDATION_ERROR',
            details: validationError.details
          }, 400);
        }

        validatedData.params = result.data;
      }

      // Add all validated data to context
      c.set('validated', validatedData);
      await next();

    } catch (error: any) {
      console.error('Request validation error:', error);

      if (error instanceof ValidationError) {
        if (middlewareConfig.enableSecurityLogging) {
          securityLogger.logValidationFailure(ip, userAgent, c.req.path, error, c);
        }

        return c.json({
          error: 'Validation failed',
          code: error.code,
          details: error.details
        }, error.statusCode);
      }

      return c.json({
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      }, 500);
    }
  };
}

// Export security logger instance
export { ValidationSecurityLogger };

// Utility functions for accessing validated data
export function getValidatedBody<T>(c: Context): T {
  return c.get('validatedBody') || c.get('validated')?.body;
}

export function getValidatedQuery<T>(c: Context): T {
  return c.get('validatedQuery') || c.get('validated')?.query;
}

export function getValidatedParams<T>(c: Context): T {
  return c.get('validatedParams') || c.get('validated')?.params;
}