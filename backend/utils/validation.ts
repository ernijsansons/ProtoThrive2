// Ref: CLAUDE.md Terminal 1 Phase 1 - Validation Utilities
// Thermonuclear Validation Schemas for ProtoThrive

import { z } from 'zod';

/**
 * Check if a string is valid JSON
 */
const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if a string is a valid UUID format
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  // Also accept our mock formats: uuid-[random] and uuid-thermo-[number]
  const mockUuidRegex = /^uuid-[a-z0-9-]+$/;
  return uuidRegex.test(str) || mockUuidRegex.test(str);
};

/**
 * User role enum
 */
export const UserRoleEnum = z.enum(['vibe_coder', 'engineer', 'exec']);

/**
 * Roadmap status enum
 */
export const RoadmapStatusEnum = z.enum(['draft', 'active', 'completed', 'archived']);

/**
 * Agent log status enum
 */
export const AgentLogStatusEnum = z.enum(['success', 'fail', 'timeout', 'escalated']);

/**
 * Insight type enum
 */
export const InsightTypeEnum = z.enum(['performance', 'usage', 'quality', 'cost']);

/**
 * Roadmap body validation schema
 * Ref: CLAUDE.md Terminal 1 - Zod schemas
 */
export const roadmapBodySchema = z.object({
  json_graph: z.string()
    .min(10, 'JSON graph must be at least 10 characters')
    .refine(isValidJSON, 'Invalid JSON format'),
  vibe_mode: z.boolean()
});

/**
 * Roadmap update schema
 */
export const roadmapUpdateSchema = z.object({
  json_graph: z.string()
    .min(10, 'JSON graph must be at least 10 characters')
    .refine(isValidJSON, 'Invalid JSON format')
    .optional(),
  vibe_mode: z.boolean().optional(),
  status: RoadmapStatusEnum.optional()
});

/**
 * Snippet body validation schema
 */
export const snippetBodySchema = z.object({
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  code: z.string()
    .min(1, 'Code is required'),
  ui_preview_url: z.string()
    .url('Invalid URL format')
    .optional()
    .nullable()
});

/**
 * Agent log body validation schema
 */
export const agentLogBodySchema = z.object({
  roadmap_id: z.string().refine(isValidUUID, 'Invalid roadmap ID format'),
  task_type: z.string().min(1, 'Task type is required'),
  output: z.string().min(1, 'Output is required'),
  status: AgentLogStatusEnum,
  model_used: z.string().min(1, 'Model used is required'),
  token_count: z.number().int().positive('Token count must be positive')
});

/**
 * Insight body validation schema
 */
export const insightBodySchema = z.object({
  roadmap_id: z.string().refine(isValidUUID, 'Invalid roadmap ID format'),
  type: InsightTypeEnum,
  data: z.string()
    .min(1, 'Data is required')
    .refine(isValidJSON, 'Data must be valid JSON'),
  score: z.number()
    .min(0, 'Score must be between 0 and 1')
    .max(1, 'Score must be between 0 and 1')
});

/**
 * Query parameters validation
 */
export const queryParamsSchema = z.object({
  limit: z.coerce.number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
  offset: z.coerce.number()
    .int()
    .min(0)
    .optional()
    .default(0),
  status: RoadmapStatusEnum.optional(),
  category: z.string().optional()
});

/**
 * Validate roadmap body for creation
 */
export function validateRoadmapBody(body: unknown) {
  const result = roadmapBodySchema.safeParse(body);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate roadmap body for updates
 */
export function validateRoadmapUpdate(body: unknown) {
  const result = roadmapUpdateSchema.safeParse(body);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate snippet body
 */
export function validateSnippetBody(body: unknown) {
  const result = snippetBodySchema.safeParse(body);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate agent log body
 */
export function validateAgentLogBody(body: unknown) {
  const result = agentLogBodySchema.safeParse(body);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate insight body
 */
export function validateInsightBody(body: unknown) {
  const result = insightBodySchema.safeParse(body);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: unknown) {
  const result = queryParamsSchema.safeParse(params);
  
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`VAL-400: Invalid query parameters - ${issues}`);
  }
  
  return result.data;
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  return isValidUUID(id);
}