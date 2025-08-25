// Environment type definitions for Cloudflare Workers

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  CACHE: KVNamespace;
  SNIPPETS: KVNamespace;

  // Durable Objects
  WEBSOCKET_MANAGER: DurableObjectNamespace;
  RATE_LIMITER: DurableObjectNamespace;
  ROADMAP_ROOMS: DurableObjectNamespace;

  // Service Bindings
  AI_SERVICE: Fetcher;
  AUTOMATION_SERVICE: Fetcher;

  // Environment Variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  APP_URL: string;

  // Clerk Authentication
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;

  // AI Services
  CLAUDE_API_KEY: string;
  OPENAI_API_KEY: string;
  KIMI_API_KEY: string;
  UXPILOT_API_KEY: string;
  HUGGINGFACE_API_KEY: string;

  // Pinecone
  PINECONE_API_KEY: string;
  PINECONE_ENVIRONMENT: string;
  PINECONE_INDEX_NAME: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // External Services
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  VERCEL_API_TOKEN: string;
  SEGMENT_WRITE_KEY: string;
  SENDGRID_API_KEY: string;

  // Monitoring
  DATADOG_API_KEY: string;
  SENTRY_DSN: string;

  // n8n
  N8N_WEBHOOK_URL: string;
  N8N_API_KEY: string;
}

// Request context with environment
export interface RequestContext {
  env: Env;
  executionContext: ExecutionContext;
  request: Request;
  userId?: string;
  userRole?: string;
}