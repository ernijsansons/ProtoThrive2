// Ref: CLAUDE.md - Validation utilities using Zod with comprehensive rules
// Fortune-50 grade validation for all API inputs
import { z } from 'zod';

// Custom error class for security validation issues
export class SecurityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityValidationError';
  }
}

// Node schema for roadmap graph
const NodeSchema = z.object({
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(500).transform(sanitizeLabel),
  status: z.enum(['gray', 'neon', 'completed', 'failed']).optional().default('gray'),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0)
  }).optional().default({ x: 0, y: 0, z: 0 }),
  type: z.enum(['default', 'ui', 'code', 'deploy']).optional().default('default')
});

// Edge schema for roadmap graph
const EdgeSchema = z.object({
  from: z.string().min(1).max(100),
  to: z.string().min(1).max(100),
  label: z.string().max(200).optional().default('')
});

// Graph schema for roadmap
const GraphSchema = z.object({
  nodes: z.array(NodeSchema).min(1).max(100),
  edges: z.array(EdgeSchema).max(200).default([])
}).refine((data) => {
  // Validate that edges reference existing nodes
  const nodeIds = new Set(data.nodes.map(node => node.id));
  for (const edge of data.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      return false;
    }
  }
  return true;
}, {
  message: 'Edges must reference existing nodes'
});

// Roadmap body validation schema
export const RoadmapBodySchema = z.object({
  json_graph: z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      return GraphSchema.parse(parsed);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON graph structure'
      });
      return z.NEVER;
    }
  }),
  vibe_mode: z.boolean().optional().default(false),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional().default('draft'),
  title: z.string().max(200).transform(sanitizeText).optional().default(''),
  description: z.string().max(1000).transform(sanitizeText).optional().default('')
});

// Snippet body validation schema
export const SnippetBodySchema = z.object({
  category: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Category must contain only lowercase letters, numbers, hyphens and underscores'),
  code: z.string().min(1).max(10000).refine(validateCode, {
    message: 'Code contains potentially malicious patterns'
  }),
  ui_preview_url: z.string().max(500).optional().default('').refine(validateUrl, {
    message: 'Invalid URL format'
  }),
  version: z.number().int().min(1).max(999).optional().default(1),
  tags: z.array(z.string().regex(/^[a-z0-9_-]{1,30}$/, 'Invalid tag format')).max(10).optional().default([])
});

// Agent log body validation schema
export const AgentLogBodySchema = z.object({
  roadmap_id: z.string().uuid('Invalid roadmap ID format'),
  task_type: z.string().min(1).max(50),
  output: z.string().max(50000),
  status: z.enum(['pending', 'running', 'success', 'error']),
  model_used: z.enum(['kimi', 'claude', 'uxpilot', 'gpt-4']).optional().default('kimi'),
  token_count: z.number().int().min(0).max(1000000).optional().default(0),
  cost: z.number().min(0).max(100).optional().default(0)
});

// Insight body validation schema
export const InsightBodySchema = z.object({
  roadmap_id: z.string().uuid('Invalid roadmap ID format'),
  type: z.enum(['prediction', 'recommendation', 'warning', 'completion']),
  data: z.string().max(10000),
  score: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional().default({})
});

// User consent validation schema (GDPR compliance)
export const UserConsentSchema = z.object({
  user_id: z.string().min(1).max(100),
  consent_types: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
    functional: z.boolean()
  }),
  ip_address: z.string().max(45).optional(),
  user_agent: z.string().max(500).optional()
});

// Query parameters validation schema
export const QueryParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(10),
  offset: z.number().int().min(0).optional().default(0),
  sort: z.string().max(50).optional(),
  filter: z.string().max(200).optional()
});

// Validation functions
export function validateRoadmapBody(data: any) {
  try {
    return RoadmapBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new SecurityValidationError(`Validation failed: ${messages.join('; ')}`);
    }
    throw error;
  }
}

export function validateSnippetBody(data: any) {
  try {
    return SnippetBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new SecurityValidationError(`Validation failed: ${messages.join('; ')}`);
    }
    throw error;
  }
}

export function validateAgentLogBody(data: any) {
  try {
    return AgentLogBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new SecurityValidationError(`Validation failed: ${messages.join('; ')}`);
    }
    throw error;
  }
}

export function validateInsightBody(data: any) {
  try {
    return InsightBodySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new SecurityValidationError(`Validation failed: ${messages.join('; ')}`);
    }
    throw error;
  }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateQueryParams(data: any) {
  try {
    return QueryParamsSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new SecurityValidationError(`Validation failed: ${messages.join('; ')}`);
    }
    throw error;
  }
}

// Helper functions for sanitization
function sanitizeLabel(label: string): string {
  // Remove potential XSS
  let sanitized = label.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  return sanitized.trim();
}

function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove JavaScript
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized.trim();
}

function validateCode(code: string): boolean {
  // Check for malicious patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /exec\s*\(/,
    /__import__/,
    /subprocess/,
    /os\.system/,
    /<script[^>]*>/,
    /document\.cookie/,
    /localStorage\./,
    /sessionStorage\./
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return false;
    }
  }

  return true;
}

function validateUrl(url: string): boolean {
  if (!url) return true; // Optional field
  
  const urlPattern = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
  return urlPattern.test(url);
}

// Additional utility functions
export function sanitizeInput(text: string, maxLength: number = 1000): string {
  if (!text) return '';

  // Truncate to max length
  text = text.substring(0, maxLength);

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Remove JavaScript
  text = text.replace(/javascript:/gi, '');
  text = text.replace(/on\w+\s*=/gi, '');

  // Remove SQL injection attempts
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'UNION', 'EXEC'];
  for (const keyword of sqlKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    text = text.replace(regex, '');
  }

  // Remove control characters
  text = text.replace(/[\x00-\x1F\x7F]/g, '');

  return text.trim();
}

export function validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
  // Clamp limit
  const validLimit = Math.max(1, Math.min(limit || 10, 100));
  
  // Clamp offset
  const validOffset = Math.max(0, offset || 0);
  
  return { limit: validLimit, offset: validOffset };
}

export function validateJsonString(jsonStr: string): Record<string, any> {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data !== 'object' || Array.isArray(data) || data === null) {
      throw new Error('JSON must be an object');
    }
    return data;
  } catch (error) {
    throw new SecurityValidationError(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateFileUpload(filename: string, contentType: string, size: number): boolean {
  // Allowed extensions
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.txt'];
  
  // Check extension
  const ext = filename.toLowerCase().includes('.') ? 
    '.' + filename.toLowerCase().split('.').pop() : '';
  
  if (!allowedExtensions.includes(ext)) {
    throw new SecurityValidationError(`File type not allowed: ${ext}`);
  }
  
  // Check content type
  const allowedContentTypes = [
    'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml',
    'application/json', 'text/plain'
  ];
  
  if (!allowedContentTypes.includes(contentType)) {
    throw new SecurityValidationError(`Content type not allowed: ${contentType}`);
  }
  
  // Check size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (size > maxSize) {
    throw new SecurityValidationError(`File too large: ${size} bytes (max ${maxSize})`);
  }
  
  return true;
}

// Export types for use in other modules
export type RoadmapBody = z.infer<typeof RoadmapBodySchema>;
export type SnippetBody = z.infer<typeof SnippetBodySchema>;
export type AgentLogBody = z.infer<typeof AgentLogBodySchema>;
export type InsightBody = z.infer<typeof InsightBodySchema>;
export type UserConsent = z.infer<typeof UserConsentSchema>;
export type QueryParams = z.infer<typeof QueryParamsSchema>;