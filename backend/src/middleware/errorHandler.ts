// Global Error Handler Middleware
// Centralized error processing with consistent response format

import type { Context } from 'hono';
import { AppError, isAppError, ErrorCode } from '../errors/AppError';
import logger from '../utils/logger';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any[];
    timestamp: string;
    request_id?: string;
    trace_id?: string;
  };
  debug?: {
    stack?: string;
    raw_error?: string;
  };
}

export class ErrorHandler {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Main error handling function
  handle(error: Error | AppError, c: Context): Response {
    const requestId = this.getRequestId(c);
    const traceId = this.generateTraceId();

    // Log the error with full context
    this.logError(error, c, requestId, traceId);

    // Convert to AppError if needed
    const appError = this.normalizeError(error);

    // Build response
    const response = this.buildErrorResponse(appError, requestId, traceId);

    // Return JSON response with appropriate status code
    return c.json(response, appError.statusCode);
  }

  // Convert any error to AppError
  private normalizeError(error: Error | AppError): AppError {
    if (isAppError(error)) {
      return error;
    }

    // Handle specific error types
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return AppError.validation(error.message);
    }

    if (error.message.includes('timeout')) {
      return new AppError(
        ErrorCode.EXT_SERVICE_TIMEOUT,
        'Operation timed out',
        408
      );
    }

    if (error.message.includes('connection') || error.message.includes('network')) {
      return new AppError(
        ErrorCode.DB_CONNECTION_FAILED,
        'Connection error',
        503
      );
    }

    // Default to internal server error
    return new AppError(
      ErrorCode.SYS_INTERNAL_ERROR,
      this.isDevelopment ? error.message : 'Internal server error',
      500,
      [],
      false // Mark as non-operational since it's unexpected
    );
  }

  // Build consistent error response
  private buildErrorResponse(error: AppError, requestId?: string, traceId?: string): ErrorResponse {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        ...(error.details.length > 0 && { details: error.details }),
        ...(requestId && { request_id: requestId }),
        ...(traceId && { trace_id: traceId })
      }
    };

    // Add debug info in development
    if (this.isDevelopment) {
      response.debug = {
        stack: error.stack,
        raw_error: error.toString()
      };
    }

    return response;
  }

  // Log error with appropriate level and context
  private logError(error: Error | AppError, c: Context, requestId?: string, traceId?: string): void {
    const context = {
      requestId,
      traceId,
      method: c.req.method,
      url: c.req.url,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user: this.getUserContext(c)
    };

    if (isAppError(error)) {
      if (error.statusCode >= 500) {
        logger.error(`Server Error: ${error.message}`, context, error);
      } else if (error.statusCode >= 400) {
        logger.warn(`Client Error: ${error.message}`, context);
      } else {
        logger.info(`App Error: ${error.message}`, context);
      }
    } else {
      logger.error(`Unexpected Error: ${error.message}`, context, error);
    }
  }

  // Extract user context for logging
  private getUserContext(c: Context): any {
    try {
      const user = c.get('user');
      if (user) {
        return {
          id: user.id,
          role: user.role,
          email: user.email
        };
      }
    } catch {
      // Ignore if user context not available
    }
    return null;
  }

  // Get request ID from context or headers
  private getRequestId(c: Context): string {
    try {
      // Try to get from context first
      const requestId = c.get('requestId');
      if (requestId) return requestId;

      // Try from headers
      const headerRequestId = c.req.header('X-Request-ID') || c.req.header('Request-ID');
      if (headerRequestId) return headerRequestId;
    } catch {
      // Ignore errors
    }

    return crypto.randomUUID();
  }

  // Generate trace ID for error tracking
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Security event handler for specific error types
  handleSecurityEvent(error: AppError, c: Context): void {
    const isSecurityRelated = [
      ErrorCode.AUTH_INVALID_TOKEN,
      ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      ErrorCode.API_KEY_INVALID,
      ErrorCode.VALIDATION_INVALID_FORMAT
    ].includes(error.code);

    if (isSecurityRelated) {
      logger.security('Security violation detected', {
        error_code: error.code,
        message: error.message,
        ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
        user_agent: c.req.header('User-Agent'),
        url: c.req.url,
        method: c.req.method
      });
    }
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Hono error handler middleware
export function createErrorHandlerMiddleware() {
  return async (error: Error, c: Context) => {
    // Handle security events
    if (isAppError(error)) {
      errorHandler.handleSecurityEvent(error, c);
    }

    // Process and return error response
    return errorHandler.handle(error, c);
  };
}

// Async error wrapper for route handlers
export function asyncHandler(fn: Function) {
  return async (c: Context, next?: Function) => {
    try {
      return await fn(c, next);
    } catch (error) {
      return errorHandler.handle(error as Error, c);
    }
  };
}

// Request context middleware (adds request ID)
export function requestContextMiddleware() {
  return async (c: Context, next: Function) => {
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
    c.set('requestId', requestId);

    // Add request ID to response headers
    c.header('X-Request-ID', requestId);

    await next();
  };
}

export default errorHandler;