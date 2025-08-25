// Shared constants for DevCommand platform

// API endpoints
export const API_ENDPOINTS = {
  GRAPHQL: '/graphql',
  REST: {
    ROADMAPS: '/api/roadmaps',
    USERS: '/api/users',
    AGENTS: '/api/agents',
    WEBHOOKS: '/api/webhooks',
    BILLING: '/api/billing',
  },
} as const;

// Rate limiting
export const RATE_LIMITS = {
  DEFAULT: 100, // requests per minute
  AUTHENTICATED: 100,
  ANONYMOUS: 20,
  AGENT_TASKS: 50,
} as const;

// Token limits
export const TOKEN_LIMITS = {
  FREE_TIER: {
    DAILY: 1000,
    MONTHLY: 10000,
  },
  PRO_TIER: {
    DAILY: 10000,
    MONTHLY: 100000,
  },
  ENTERPRISE_TIER: {
    DAILY: -1, // unlimited
    MONTHLY: -1, // unlimited
  },
} as const;

// AI Model routing thresholds
export const MODEL_ROUTING = {
  KIMI_THRESHOLD: 0.8, // Use Kimi for 80% of tasks
  COMPLEXITY_THRESHOLD: {
    LOW: 0.3,
    MEDIUM: 0.7,
    HIGH: 1.0,
  },
  COST_THRESHOLD: 0.1, // $0.10 per task max
} as const;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  ROADMAP: 3600, // 1 hour
  SNIPPET: 3600, // 1 hour
  USER: 1800, // 30 minutes
  SESSION: 7200, // 2 hours
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  VISION_PROMPT_MAX_LENGTH: 1000,
  GRAPH_MAX_NODES: 100,
  GRAPH_MAX_EDGES: 200,
  TASK_MAX_RETRIES: 3,
  FILE_MAX_SIZE: 1048576, // 1MB
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors (400-409)
  INVALID_CREDENTIALS: 'AUTH-401',
  UNAUTHORIZED: 'AUTH-403',
  TOKEN_EXPIRED: 'AUTH-404',
  
  // Validation errors (400-409)
  INVALID_INPUT: 'VAL-400',
  MISSING_REQUIRED_FIELD: 'VAL-401',
  INVALID_FORMAT: 'VAL-402',
  
  // Resource errors (404)
  NOT_FOUND: 'RES-404',
  
  // Rate limiting (429)
  RATE_LIMITED: 'RATE-429',
  
  // Server errors (500+)
  INTERNAL_ERROR: 'SRV-500',
  DATABASE_ERROR: 'DB-500',
  EXTERNAL_SERVICE_ERROR: 'EXT-502',
  
  // AI/Agent errors
  AGENT_FAILURE: 'AGT-500',
  MODEL_ERROR: 'MDL-500',
  HALLUCINATION_DETECTED: 'HAL-400',
  
  // Business logic errors
  QUOTA_EXCEEDED: 'BIZ-402',
  SUBSCRIPTION_REQUIRED: 'BIZ-403',
  FEATURE_LOCKED: 'BIZ-404',
} as const;

// Subscription features
export const SUBSCRIPTION_FEATURES = {
  FREE: {
    maxRoadmaps: 1,
    maxAgentTasks: 5,
    maxTemplates: 10,
    hitlSupport: false,
    advancedInsights: false,
  },
  PRO: {
    maxRoadmaps: 10,
    maxAgentTasks: -1, // unlimited
    maxTemplates: 50,
    hitlSupport: true,
    advancedInsights: true,
  },
  ENTERPRISE: {
    maxRoadmaps: -1, // unlimited
    maxAgentTasks: -1, // unlimited
    maxTemplates: -1, // unlimited
    hitlSupport: true,
    advancedInsights: true,
  },
} as const;

// WebSocket events
export const WS_EVENTS = {
  CONNECTION: {
    OPEN: 'connection.open',
    CLOSE: 'connection.close',
    ERROR: 'connection.error',
  },
  ROADMAP: {
    UPDATED: 'roadmap.updated',
    DELETED: 'roadmap.deleted',
  },
  AGENT: {
    STARTED: 'agent.started',
    PROGRESS: 'agent.progress',
    COMPLETED: 'agent.completed',
    FAILED: 'agent.failed',
  },
  INSIGHT: {
    GENERATED: 'insight.generated',
  },
} as const;

// Default values
export const DEFAULTS = {
  THRIVE_SCORE: 0.0,
  VIBE_MODE: false,
  ROADMAP_STATUS: 'draft',
  AGENT_STATUS: 'pending',
  USER_ROLE: 'vibe_coder',
  SUBSCRIPTION_TIER: 'free',
} as const;