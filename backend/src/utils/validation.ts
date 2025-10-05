/**
 * Validation utilities for ProtoThrive
 */

import { z } from 'zod';

// Security-hardened validation schemas with DoS protection
export const RoadmapBodySchema = z.object({
  name: z.string().min(1).max(255),
  title: z.string().min(1).max(255).optional(), // Support both name and title
  description: z.string().max(5000).optional(), // Limit description length
  nodes: z.array(z.any()).max(1000).optional(), // SECURITY: Limit nodes to prevent DoS
  edges: z.array(z.any()).max(2000).optional(), // SECURITY: Limit edges to prevent DoS
  thriveScore: z.number().min(0).max(1.0).optional() // FIXED: Correct range 0-1.0
});

export const UpdateRoadmapBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(), // Support both name and title
  description: z.string().max(5000).optional(), // Limit description length
  nodes: z.array(z.any()).max(1000).optional(), // SECURITY: Limit nodes to prevent DoS
  edges: z.array(z.any()).max(2000).optional(), // SECURITY: Limit edges to prevent DoS
  thriveScore: z.number().min(0).max(1.0).optional() // FIXED: Correct range 0-1.0
});

export const SnippetBodySchema = z.object({
  title: z.string().min(1).max(255),
  code: z.string().min(1).max(100000), // SECURITY: Limit code size to 100KB
  language: z.string().min(1).max(50),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional() // SECURITY: Limit tags count and length
});

export const RoadmapQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val <= 100, 'Limit must be 100 or less').optional(), // SECURITY: Limit query results
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const SnippetQuerySchema = z.object({
  category: z.string().max(100).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val <= 100, 'Limit must be 100 or less').optional(), // SECURITY: Limit query results
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const LoginBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128) // SECURITY: Limit password length
});

export const RegisterBodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['vibe_coder', 'engineer', 'exec']).optional()
});

// Validation error class
export class ValidationError extends Error {
  constructor(public field: string, public code: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: ValidationError;
}

// Validation functions
export function validateRoadmapBody(data: unknown): ValidationResult<z.infer<typeof RoadmapBodySchema>> {
  try {
    const result = RoadmapBodySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_INPUT',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function validateUpdateRoadmapBody(data: unknown): ValidationResult<z.infer<typeof UpdateRoadmapBodySchema>> {
  try {
    const result = UpdateRoadmapBodySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_INPUT',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function validateSnippetBody(data: unknown): ValidationResult<z.infer<typeof SnippetBodySchema>> {
  try {
    const result = SnippetBodySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_INPUT',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function validateQueryParams(data: unknown, schema: z.ZodSchema): ValidationResult<any> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_QUERY',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function validateLoginBody(data: unknown): ValidationResult<z.infer<typeof LoginBodySchema>> {
  try {
    const result = LoginBodySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_INPUT',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function validateRegisterBody(data: unknown): ValidationResult<z.infer<typeof RegisterBodySchema>> {
  try {
    const result = RegisterBodySchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: new ValidationError(
          firstError.path.join('.'),
          'INVALID_INPUT',
          firstError.message
        )
      };
    }
    return {
      success: false,
      error: new ValidationError('unknown', 'VALIDATION_ERROR', 'Validation failed')
    };
  }
}

export function formatValidationError(error: ValidationError) {
  return {
    code: `VALIDATION_${error.code}`,
    field: error.field,
    message: error.message,
    timestamp: new Date().toISOString()
  };
}

// SECURITY: Request body size validation to prevent DoS
export function createBodySizeLimitMiddleware(maxSizeBytes = 1024 * 1024) { // Default 1MB
  return async (c: any, next: any) => {
    const contentLength = c.req.header('content-length');

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return c.json({
        error: 'Request payload too large',
        code: 'PAYLOAD_TOO_LARGE',
        maxSize: `${Math.round(maxSizeBytes / 1024)}KB`,
        timestamp: new Date().toISOString()
      }, 413);
    }

    await next();
  };
}

// SECURITY: Input sanitization to prevent injection attacks
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>'"&]/g, '') // Remove potential XSS characters
    .slice(0, 10000) // Limit length
    .trim();
}

// SECURITY: Error code mapping to prevent information disclosure
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  ACCESS_DENIED: 'Access denied',
  INVALID_CREDENTIALS: 'Invalid credentials',

  // Validation
  VALIDATION_ERROR: 'Invalid input provided',
  PAYLOAD_TOO_LARGE: 'Request payload too large',

  // Resources
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',

  // Server
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMITED: 'Too many requests'
} as const;

export function createSecureErrorResponse(
  code: keyof typeof ErrorCodes,
  statusCode: number,
  requestId?: string,
  details?: any
) {
  const response: any = {
    error: ErrorCodes[code],
    code,
    timestamp: new Date().toISOString()
  };

  if (requestId) {
    response.requestId = requestId;
  }

  // SECURITY: Only include details in development mode
  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details;
  }

  return { response, statusCode };
}

// SECURITY: Safe error logging that doesn't expose sensitive data
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: Record<string, any> = {}
) {
  const sanitizedContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      // Don't log sensitive fields
      if (['password', 'token', 'secret', 'key'].some(field =>
        key.toLowerCase().includes(field))) {
        return [key, '[REDACTED]'];
      }
      return [key, value];
    })
  );

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    severity,
    context: sanitizedContext
  }));
}