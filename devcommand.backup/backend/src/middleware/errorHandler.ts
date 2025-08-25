// Global error handler middleware
import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import { formatError, ERROR_CODES } from '@devcommand/shared';
import type { Env } from '../types/env';

export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  console.error('Error:', err);

  // Log to monitoring service
  if (c.env.SENTRY_DSN) {
    // TODO: Implement Sentry logging
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      formatError(ERROR_CODES.INVALID_INPUT, 'Validation error', {
        errors: err.errors,
      }),
      400
    );
  }

  // Handle database errors
  if (err.message.includes('D1_ERROR') || err.message.includes('SQL')) {
    return c.json(
      formatError(ERROR_CODES.DATABASE_ERROR, 'Database operation failed', 
        c.env.ENVIRONMENT === 'development' ? { originalError: err.message } : undefined
      ),
      500
    );
  }

  // Handle external service errors
  if (err.message.includes('fetch') || err.message.includes('API')) {
    return c.json(
      formatError(ERROR_CODES.EXTERNAL_SERVICE_ERROR, 'External service error',
        c.env.ENVIRONMENT === 'development' ? { originalError: err.message } : undefined
      ),
      502
    );
  }

  // Default internal server error
  return c.json(
    formatError(ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred',
      c.env.ENVIRONMENT === 'development' ? { originalError: err.message, stack: err.stack } : undefined
    ),
    500
  );
};