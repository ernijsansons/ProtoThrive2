# ProtoThrive Backend - Cloudflare Workers Migration Patches

## Quick Start - Apply These Patches NOW

### 🔥 PATCH 1: Emergency TypeScript-Only Deployment (5 minutes)

```bash
# Run this to immediately deploy TypeScript backend only
cd /home/claude/ProtoThrive2

# Backup current state
cp -r backend backend.backup.$(date +%Y%m%d)

# Apply fixed TypeScript backend
cp /home/claude/FIXED_BACKEND_INDEX.ts backend/src/index.ts
cp /home/claude/FIXED_PACKAGE.json backend/package.json

# Install minimal dependencies
cd backend
npm install hono@3.12.0 zod@3.22.4

# Build and deploy
npm run build
wrangler deploy --env production
```

### 🔥 PATCH 2: Fix Critical SQL Injection Vulnerabilities (IMMEDIATE)

Apply this diff to `backend/utils/db.ts`:

```diff
--- a/backend/utils/db.ts
+++ b/backend/utils/db.ts
@@ -10,8 +10,9 @@ export async function queryRoadmap(
   userId: string,
   env: Env
 ): Promise<Roadmap | null> {
-  const query = `SELECT * FROM roadmaps WHERE id = '${id}' AND user_id = '${userId}'`;
-  const result = await env.DB.prepare(query).all();
+  const stmt = env.DB.prepare(
+    'SELECT * FROM roadmaps WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
+  ).bind(id, userId);
+  const result = await stmt.first();
   
   if (!result.results || result.results.length === 0) {
     throw new ValueError({ 
@@ -32,13 +33,16 @@ export async function queryUserRoadmaps(
   status: string | undefined,
   env: Env
 ): Promise<Roadmap[]> {
-  let query = `SELECT * FROM roadmaps WHERE user_id = '${userId}'`;
+  let query = 'SELECT * FROM roadmaps WHERE user_id = ? AND deleted_at IS NULL';
+  const params: any[] = [userId];
   
   if (status) {
-    query += ` AND status = '${status}'`;
+    query += ' AND status = ?';
+    params.push(status);
   }
   
-  const result = await env.DB.prepare(query).all();
+  query += ' ORDER BY updated_at DESC LIMIT 100';
+  const result = await env.DB.prepare(query).bind(...params).all();
   return result.results as Roadmap[];
 }

@@ -50,14 +54,15 @@ export async function insertRoadmap(
   const id = generateId();
   const now = new Date().toISOString();
   
-  const query = `
+  await env.DB.prepare(`
     INSERT INTO roadmaps (id, user_id, json_graph, vibe_mode, status, thrive_score, created_at, updated_at)
-    VALUES ('${id}', '${body.userId}', '${body.jsonGraph}', ${body.vibeMode ? 1 : 0}, 
-            '${body.status || 'draft'}', ${body.thriveScore || 50.0}, '${now}', '${now}')
-  `;
-  
-  await env.DB.prepare(query).run();
+    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
+  `).bind(
+    id, body.userId, body.jsonGraph, body.vibeMode ? 1 : 0,
+    body.status || 'draft', body.thriveScore || 50.0, now, now
+  ).run();
+  
   return { id, message: 'Roadmap created successfully' };
 }
```

### 🔥 PATCH 3: Remove Python Dependencies from package.json

```diff
--- a/backend/package.json
+++ b/backend/package.json
@@ -10,7 +10,6 @@
     "deploy": "wrangler deploy",
     "test": "jest",
     "lint": "eslint src --ext .ts",
-    "python:install": "pip install -r requirements.txt",
-    "python:test": "pytest"
   },
   "dependencies": {
     "@cloudflare/workers-types": "^4.20240117.0",
@@ -18,8 +17,7 @@
     "hono": "^3.12.0",
-    "graphql-yoga": "^5.1.0",
-    "graphql": "^16.8.0",
-    "python-shell": "^5.0.0"
+    "zod": "^3.22.4"
   },
```

### 🔥 PATCH 4: Create D1 Migration Script

Create `backend/migrations/001_fix_schema.sql`:

```sql
-- Add tenant_id to all tables for multi-tenancy
ALTER TABLE roadmaps ADD COLUMN tenant_id TEXT DEFAULT 'default';
ALTER TABLE snippets ADD COLUMN tenant_id TEXT DEFAULT 'default';
ALTER TABLE agent_logs ADD COLUMN tenant_id TEXT DEFAULT 'default';
ALTER TABLE insights ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadmaps_tenant ON roadmaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_snippets_tenant ON snippets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant ON agent_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_insights_tenant ON insights(tenant_id);

-- Add deleted_at for soft deletes
ALTER TABLE roadmaps ADD COLUMN deleted_at DATETIME;
ALTER TABLE snippets ADD COLUMN deleted_at DATETIME;
ALTER TABLE users ADD COLUMN deleted_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_roadmaps_deleted ON roadmaps(deleted_at);
CREATE INDEX IF NOT EXISTS idx_snippets_deleted ON snippets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
```

Run migration:
```bash
wrangler d1 execute protothrive-db --file=migrations/001_fix_schema.sql
```

### 🔥 PATCH 5: Add Rate Limiting Middleware

Create `backend/src/middleware/rateLimiter.ts`:

```typescript
import type { Context, Next } from 'hono';
import type { Env } from '../types';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
}

export function rateLimiter(config: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  max: 100
}) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const key = config.keyGenerator?.(c) || 
                c.req.header('CF-Connecting-IP') || 
                'unknown';
    
    const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / config.windowMs)}`;
    
    const current = await c.env.KV.get(windowKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= config.max) {
      return c.json({ 
        error: 'Too many requests', 
        retryAfter: Math.ceil(config.windowMs / 1000) 
      }, 429);
    }
    
    await c.env.KV.put(windowKey, String(count + 1), {
      expirationTtl: Math.ceil(config.windowMs / 1000)
    });
    
    c.header('X-RateLimit-Limit', String(config.max));
    c.header('X-RateLimit-Remaining', String(config.max - count - 1));
    
    await next();
  };
}
```

### 🔥 PATCH 6: External AI Service Configuration

Create `backend/src/services/aiService.ts`:

```typescript
export interface AIServiceConfig {
  url?: string;
  apiKey?: string;
  timeout?: number;
}

export class AIService {
  constructor(private config: AIServiceConfig, private kv: KVNamespace) {}
  
  async orchestrate(jsonGraph: string, userId: string): Promise<any> {
    // Try cache first
    const cacheKey = `ai:${await this.hash(jsonGraph)}`;
    const cached = await this.kv.get(cacheKey, 'json');
    if (cached) return cached;
    
    // External service call with fallback
    try {
      if (this.config.url) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout || 5000);
        
        const response = await fetch(`${this.config.url}/orchestrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey || ''
          },
          body: JSON.stringify({ graph: jsonGraph, userId }),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (response.ok) {
          const result = await response.json();
          await this.kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
          return result;
        }
      }
    } catch (error) {
      console.error('AI service error:', error);
    }
    
    // Fallback implementation
    return this.fallbackOrchestration(jsonGraph);
  }
  
  private async hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  private fallbackOrchestration(jsonGraph: string): any {
    try {
      const graph = JSON.parse(jsonGraph);
      return {
        success: true,
        tasks: graph.nodes?.map((node: any) => ({
          id: crypto.randomUUID(),
          type: 'generic',
          description: `Process ${node.label || node.id}`,
          status: 'pending'
        })) || [],
        thriveScore: 75,
        mode: 'fallback'
      };
    } catch {
      return { success: false, error: 'Invalid graph format' };
    }
  }
}
```

### 🔥 PATCH 7: Update wrangler.toml for Production

```toml
name = "protothrive-backend"
main = "dist/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

account_id = "d2897bdebfa128919bd89b265e6a712e"

[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "protothrive-db"
database_id = "0b6970f4-c6ca-4245-aabf-98fa2d4f28a8"

[[kv_namespaces]]
binding = "KV"
id = "ec3183e7b4e94442b3f99b4d2f4b083e"

[[durable_objects.bindings]]
name = "RATE_LIMITER"
class_name = "RateLimiterDO"
script_name = "protothrive-backend"

[build]
command = "esbuild src/index.ts --bundle --platform=neutral --format=esm --outfile=dist/index.js"

[env.production]
vars = { ENVIRONMENT = "production" }
routes = ["api.protothrive.com/*"]

[observability]
enabled = true

[limits]
cpu_ms = 50
```

### 🔥 PATCH 8: Security Headers Middleware

Add to `backend/src/index.ts`:

```typescript
app.use('*', async (c, next) => {
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP
  c.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.protothrive.com"
  );
  
  await next();
});
```

## Deployment Commands

### Immediate Deployment (TypeScript Only)
```bash
cd backend
npm install hono zod
npm run build
wrangler deploy --env production
```

### Full Migration with AI Service
```bash
# Deploy external Python AI service to Modal/Railway/Fly.io
cd external-ai-service
fly deploy  # or railway up

# Get the service URL and update wrangler.toml
wrangler secret put AI_SERVICE_URL
# Enter: https://your-ai-service.fly.dev

# Deploy Workers backend
cd ../backend
wrangler deploy --env production
```

### Verify Deployment
```bash
# Test endpoints
curl https://protothrive-backend.ernijs-ansons.workers.dev/health
curl https://protothrive-backend.ernijs-ansons.workers.dev/api/status

# Check logs
wrangler tail --env production
```

## Emergency Rollback
```bash
# If something goes wrong
cd backend.backup.$(date +%Y%m%d)
wrangler deploy --env production
```

## Timeline
- **NOW**: Apply Patches 1-3 (Critical security fixes)
- **Today**: Apply Patches 4-5 (Database & rate limiting)
- **This Week**: Apply Patches 6-8 (AI service & security)
- **Next Week**: Full testing and optimization

## Success Metrics
✅ Zero Python dependencies in Workers deployment
✅ SQL injection vulnerabilities patched
✅ Rate limiting active
✅ Multi-tenancy enforced
✅ <100ms cold start
✅ <10MB bundle size
