/**
 * Input validation middleware for ProtoThrive
 */
import { z } from 'zod';
// Validation schemas
export const CreateRoadmapSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name must be less than 255 characters')
        .trim(),
    description: z.string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    nodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(['gray', 'in_progress', 'completed']),
        position: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        })
    })).optional(),
    edges: z.array(z.object({
        from: z.string(),
        to: z.string(),
        type: z.string().optional()
    })).optional(),
    thriveScore: z.number()
        .min(0, 'Thrive score must be between 0 and 1')
        .max(1, 'Thrive score must be between 0 and 1')
        .optional()
});
export const UpdateRoadmapSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(255, 'Name must be less than 255 characters')
        .trim()
        .optional(),
    description: z.string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),
    nodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        status: z.enum(['gray', 'in_progress', 'completed']),
        position: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        })
    })).optional(),
    edges: z.array(z.object({
        from: z.string(),
        to: z.string(),
        type: z.string().optional()
    })).optional(),
    thriveScore: z.number()
        .min(0, 'Thrive score must be between 0 and 1')
        .max(1, 'Thrive score must be between 0 and 1')
        .optional()
});
export const CreateSnippetSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(255, 'Title must be less than 255 characters')
        .trim(),
    code: z.string()
        .min(1, 'Code is required')
        .max(10000, 'Code must be less than 10000 characters'),
    language: z.string()
        .min(1, 'Language is required')
        .max(50, 'Language must be less than 50 characters')
        .regex(/^[a-zA-Z0-9-]+$/, 'Language must contain only letters, numbers, and hyphens'),
    category: z.string()
        .max(100, 'Category must be less than 100 characters')
        .optional(),
    tags: z.array(z.string().max(50, 'Tag must be less than 50 characters'))
        .max(10, 'Maximum 10 tags allowed')
        .optional()
});
export const LoginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(255, 'Password must be less than 255 characters')
});
export const QueryParamsSchema = z.object({
    limit: z.string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .refine(n => n <= 100, 'Limit cannot exceed 100')
        .optional(),
    offset: z.string()
        .regex(/^\d+$/, 'Offset must be a number')
        .transform(Number)
        .optional(),
    category: z.string()
        .max(100, 'Category must be less than 100 characters')
        .optional()
});
// UUID validation schema
export const UUIDSchema = z.string()
    .uuid('Invalid UUID format');
/**
 * Validation middleware factory
 */
export function validateBody(schema) {
    return async (c, next) => {
        try {
            const body = await c.req.json();
            const validated = schema.parse(body);
            c.set('validatedBody', validated);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    })),
                    timestamp: new Date().toISOString()
                }, 400);
            }
            if (error instanceof SyntaxError) {
                return c.json({
                    error: 'Invalid JSON format',
                    timestamp: new Date().toISOString()
                }, 400);
            }
            throw error; // Re-throw unexpected errors
        }
    };
}
/**
 * Query parameter validation middleware
 */
export function validateQuery(schema) {
    return async (c, next) => {
        try {
            const query = c.req.query();
            const validated = schema.parse(query);
            c.set('validatedQuery', validated);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: 'Invalid query parameters',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    })),
                    timestamp: new Date().toISOString()
                }, 400);
            }
            throw error;
        }
    };
}
/**
 * Path parameter validation middleware
 */
export function validateParam(paramName, schema) {
    return async (c, next) => {
        try {
            const paramValue = c.req.param(paramName);
            const validated = schema.parse(paramValue);
            c.set(`validated${paramName.charAt(0).toUpperCase() + paramName.slice(1)}`, validated);
            await next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({
                    error: `Invalid ${paramName} parameter`,
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: err.code
                    })),
                    timestamp: new Date().toISOString()
                }, 400);
            }
            throw error;
        }
    };
}
/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSizeBytes = 1024 * 1024) {
    return async (c, next) => {
        const contentLength = c.req.header('content-length');
        if (contentLength) {
            const size = parseInt(contentLength, 10);
            if (size > maxSizeBytes) {
                return c.json({
                    error: 'Request too large',
                    maxSize: maxSizeBytes,
                    actualSize: size,
                    timestamp: new Date().toISOString()
                }, 413);
            }
        }
        await next();
    };
}
/**
 * Content-Type validation middleware
 */
export function validateContentType(allowedTypes = ['application/json']) {
    return async (c, next) => {
        const contentType = c.req.header('content-type');
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
            return c.json({
                error: 'Unsupported content type',
                allowed: allowedTypes,
                received: contentType,
                timestamp: new Date().toISOString()
            }, 415);
        }
        await next();
    };
}
