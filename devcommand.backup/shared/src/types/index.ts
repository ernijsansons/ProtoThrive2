// Shared types for DevCommand platform
import { z } from 'zod';

// User roles enum
export const UserRole = {
  VIBE_CODER: 'vibe_coder',
  ENGINEER: 'engineer',
  EXEC: 'exec',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Subscription tiers
export const SubscriptionTier = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

// Roadmap status
export const RoadmapStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETE: 'complete',
} as const;

export type RoadmapStatus = (typeof RoadmapStatus)[keyof typeof RoadmapStatus];

// Agent task status
export const AgentTaskStatus = {
  SUCCESS: 'success',
  FAIL: 'fail',
  PENDING: 'pending',
} as const;

export type AgentTaskStatus = (typeof AgentTaskStatus)[keyof typeof AgentTaskStatus];

// HITL priority
export const HITLPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type HITLPriority = (typeof HITLPriority)[keyof typeof HITLPriority];

// Graph node schema
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }),
  data: z.object({
    label: z.string(),
    status: z.enum(['gray', 'neon']),
    templateMatch: z.string().optional(),
    uiPreview: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

// Graph edge schema
export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.unknown()).optional(),
});

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

// Roadmap graph schema
export const RoadmapGraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).optional(),
});

export type RoadmapGraph = z.infer<typeof RoadmapGraphSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Roadmap schema
export const RoadmapSchema = z.object({
  id: z.string(),
  userId: z.string(),
  jsonGraph: RoadmapGraphSchema,
  status: z.nativeEnum(RoadmapStatus),
  vibeMode: z.boolean(),
  thriveScore: z.number().min(0).max(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;

// Snippet schema
export const SnippetSchema = z.object({
  id: z.string(),
  category: z.string(),
  code: z.string(),
  uiPreviewUrl: z.string().url().optional(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Snippet = z.infer<typeof SnippetSchema>;

// Agent log schema
export const AgentLogSchema = z.object({
  id: z.string(),
  roadmapId: z.string(),
  taskType: z.string(),
  output: z.string().optional(),
  status: z.nativeEnum(AgentTaskStatus),
  tokenCount: z.number().int().nonnegative(),
  modelUsed: z.string().optional(),
  errorMessage: z.string().optional(),
  timestamp: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

export type AgentLog = z.infer<typeof AgentLogSchema>;

// API response schemas
export const ApiSuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.unknown()).optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Request validation schemas
export const CreateRoadmapRequestSchema = z.object({
  vision: z.string().min(1).max(1000),
  vibeMode: z.boolean().optional().default(false),
});

export type CreateRoadmapRequest = z.infer<typeof CreateRoadmapRequestSchema>;

export const UpdateRoadmapRequestSchema = z.object({
  jsonGraph: RoadmapGraphSchema.optional(),
  status: z.nativeEnum(RoadmapStatus).optional(),
  vibeMode: z.boolean().optional(),
});

export type UpdateRoadmapRequest = z.infer<typeof UpdateRoadmapRequestSchema>;

// WebSocket event schemas
export const WebSocketEventTypeSchema = z.enum([
  'roadmap.updated',
  'agent.started',
  'agent.progress',
  'agent.completed',
  'agent.failed',
  'insight.generated',
]);

export type WebSocketEventType = z.infer<typeof WebSocketEventTypeSchema>;

export const WebSocketEventSchema = z.object({
  type: WebSocketEventTypeSchema,
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
});

export type WebSocketEvent = z.infer<typeof WebSocketEventSchema>;