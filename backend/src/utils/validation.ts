/**
 * Validation utilities for ProtoThrive
 */

import { z } from 'zod';

// Validation schemas
export const RoadmapBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  thriveScore: z.number().min(0).max(100).optional()
});

export const UpdateRoadmapBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  thriveScore: z.number().min(0).max(100).optional()
});

export const SnippetBodySchema = z.object({
  title: z.string().min(1).max(255),
  code: z.string().min(1),
  language: z.string().min(1).max(50),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const RoadmapQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const SnippetQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Validation error class
export class ValidationError extends Error {
  constructor(public field: string, public code: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation functions
export function validateRoadmapBody(data: unknown) {
  try {
    return RoadmapBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        'INVALID_INPUT',
        firstError.message
      );
    }
    throw error;
  }
}

export function validateUpdateRoadmapBody(data: unknown) {
  try {
    return UpdateRoadmapBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        'INVALID_INPUT',
        firstError.message
      );
    }
    throw error;
  }
}

export function validateSnippetBody(data: unknown) {
  try {
    return SnippetBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        'INVALID_INPUT',
        firstError.message
      );
    }
    throw error;
  }
}

export function validateQueryParams(data: unknown, schema: z.ZodSchema) {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        'INVALID_QUERY',
        firstError.message
      );
    }
    throw error;
  }
}

export function validateLoginBody(data: unknown) {
  try {
    return LoginBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        'INVALID_INPUT',
        firstError.message
      );
    }
    throw error;
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