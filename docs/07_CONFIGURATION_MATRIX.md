# Configuration Matrix - ProtoThrive2

## Environment Variables

### Frontend Environment (.env.local / .env.production)

| Variable | Required | Default | Description | Scope |
|----------|----------|---------|-------------|-------|
| NEXT_PUBLIC_APP_URL | Yes | http://localhost:3000 | Frontend application URL | All |
| NEXT_PUBLIC_API_URL | Yes | http://localhost:8787 | Backend API endpoint | All |
| NEXT_PUBLIC_WS_URL | Yes | ws://localhost:8787 | WebSocket endpoint | All |
| NEXT_PUBLIC_SPLINE_SCENE | No | Mock scene URL | Spline 3D scene URL | All |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | No | - | Clerk auth public key | Production |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | No | - | Stripe public key | Production |
| NEXT_PUBLIC_GA_TRACKING_ID | No | - | Google Analytics ID | Production |
| NEXT_PUBLIC_SENTRY_DSN | No | - | Sentry error tracking | Production |

### Backend Environment (wrangler.toml)

| Variable | Required | Default | Description | Scope |
|----------|----------|---------|-------------|-------|
| JWT_SECRET | Yes | thermonuclear-dev-secret | JWT signing secret | All |
| AGENT_MODE | Yes | fallback | Agent routing mode (single/fallback/ensemble) | All |
| AGENT_BUDGET_DEFAULT | Yes | 0.40 | Default task budget in USD | All |
| AGENT_BUDGET_MAX | Yes | 1.00 | Maximum task budget in USD | All |
| AGENT_BUDGET_FALLBACK_MIN | Yes | 0.05 | Minimum budget for fallback | All |
| AGENT_CONFIDENCE_THRESHOLD | Yes | 0.8 | Minimum confidence score | All |
| ENTERPRISE_AGENT_URL | No | - | Enterprise agent endpoint | Production |
| ENTERPRISE_AGENT_TOKEN | No | - | Enterprise agent auth token | Production |
| ENVIRONMENT | Yes | development | Environment name | All |
| LOG_LEVEL | No | info | Logging level (debug/info/warn/error) | All |
| RATE_LIMIT_PER_MINUTE | No | 100 | API rate limit | All |

### AI Core Environment (.env)

| Variable | Required | Default | Description | Scope |
|----------|----------|---------|-------------|-------|
| CLAUDE_API_KEY | Yes | mock_claude_thermo | Claude API key | All |
| KIMI_API_KEY | Yes | mock_kimi_nuclear | Kimi API key | All |
| UX_PILOT_KEY | No | mock_ux_thermo | UX Pilot API key | Production |
| PINECONE_KEY | No | mock_pine_thermo | Pinecone vector DB key | Production |
| OPENAI_API_KEY | No | - | OpenAI GPT-5 key | Production |
| GEMINI_API_KEY | No | - | Google Gemini key | Production |
| N8N_SECRET | No | mock_n8n_thermo | n8n webhook secret | All |
| BUDGET_PER_TASK | Yes | 0.10 | Budget cap per task | All |
| HITL_SLACK_CHANNEL | No | #hitl-thermo | Slack channel for escalation | Production |

### Cloudflare Bindings (wrangler.toml)

```toml
[[d1_databases]]
binding = "DB"
database_name = "protothrive-db"
database_id = "${D1_ID}"

[[kv_namespaces]]
binding = "KV"
id = "${KV_ID}"
preview_id = "${KV_PREVIEW_ID}"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "protothrive-assets"

[[queues.producers]]
binding = "QUEUE"
queue = "protothrive-tasks"
```

## Feature Flags

### Runtime Feature Toggles

| Flag | Default | Description | Impact |
|------|---------|-------------|--------|
| ENABLE_3D_VISUALIZATION | true | Enable Spline 3D mode | UI rendering |
| ENABLE_AI_GENERATION | true | Enable AI code generation | Agent features |
| ENABLE_REAL_TIME_COLLAB | true | Enable WebSocket collaboration | Real-time sync |
| ENABLE_MARKETPLACE | false | Enable component marketplace | New feature |
| ENABLE_ENTERPRISE_SSO | false | Enable SSO authentication | Enterprise only |
| ENABLE_2FA | true | Enable two-factor auth | Security |
| ENABLE_ANALYTICS | true | Enable analytics tracking | Metrics |
| ENABLE_EXPORT_FEATURES | true | Enable export to PDF/CSV | Data portability |

### Build-time Configuration

| Config | Value | Description |
|--------|-------|-------------|
| NODE_ENV | production/development | Build environment |
| NEXT_TELEMETRY_DISABLED | 1 | Disable Next.js telemetry |
| ANALYZE | true/false | Enable bundle analysis |
| STANDALONE | true | Build standalone output |

## Security Configuration

### CORS Settings

```javascript
{
  "Access-Control-Allow-Origin": process.env.NODE_ENV === 'production'
    ? "https://protothrive.pages.dev"
    : "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
}
```

### Rate Limiting

| Endpoint | Authenticated | Unauthenticated |
|----------|---------------|-----------------|
| /api/roadmaps | 100/min | 20/min |
| /api/agent/run | 10/hour | Not allowed |
| /api/snippets | 50/min | 10/min |
| /auth/* | 10/min | 10/min |
| WebSocket | 100 concurrent | Not allowed |

### Security Headers

```javascript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

## Performance Configuration

### Caching Strategy

| Resource | TTL | Strategy |
|----------|-----|----------|
| Static assets | 1 year | Immutable |
| API responses | 60s | Cache-Control |
| KV cache | 300s | Application cache |
| Database queries | 60s | Query cache |

### Optimization Settings

```javascript
// next.config.js
{
  swcMinify: true,
  compress: true,
  optimizeFonts: true,
  images: {
    domains: ['protothrive.pages.dev'],
    formats: ['image/webp'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns'],
  }
}
```

## Database Configuration

### Connection Pool

```javascript
{
  maxConnections: 10,
  minConnections: 2,
  connectionTimeout: 5000,
  idleTimeout: 60000,
  maxLifetime: 1800000
}
```

### Query Timeouts

| Query Type | Timeout (ms) |
|------------|-------------|
| Simple SELECT | 1000 |
| Complex JOIN | 5000 |
| Write operations | 3000 |
| Batch operations | 10000 |

## Logging Configuration

### Log Levels

```javascript
{
  development: "debug",
  staging: "info",
  production: "warn",
  test: "error"
}
```

### Log Retention

| Environment | Retention Period |
|-------------|-----------------|
| Development | 1 day |
| Staging | 7 days |
| Production | 30 days |
| Audit logs | 7 years |

## Deployment Configuration

### GitHub Actions Secrets

| Secret | Description |
|--------|-------------|
| CLOUDFLARE_API_TOKEN | CF deployment token |
| CLOUDFLARE_ACCOUNT_ID | CF account ID |
| D1_DATABASE_ID | Production D1 ID |
| KV_NAMESPACE_ID | Production KV ID |
| SENTRY_AUTH_TOKEN | Sentry deployment |
| SLACK_WEBHOOK_URL | Deployment notifications |

### Environment-Specific Settings

#### Development
```javascript
{
  apiUrl: "http://localhost:8787",
  wsUrl: "ws://localhost:8787",
  mockData: true,
  debugMode: true,
  hotReload: true
}
```

#### Staging
```javascript
{
  apiUrl: "https://backend-thermo-staging.ernijs-ansons.workers.dev",
  wsUrl: "wss://backend-thermo-staging.ernijs-ansons.workers.dev",
  mockData: false,
  debugMode: true,
  hotReload: false
}
```

#### Production
```javascript
{
  apiUrl: "https://backend-thermo.ernijs-ansons.workers.dev",
  wsUrl: "wss://backend-thermo.ernijs-ansons.workers.dev",
  mockData: false,
  debugMode: false,
  hotReload: false
}
```

## Mock Configuration

### Development Mocks

```javascript
// Enable in development
{
  ENABLE_MOCK_AUTH: true,
  ENABLE_MOCK_DATABASE: true,
  ENABLE_MOCK_AI_AGENTS: true,
  MOCK_USER_ID: "uuid-thermo-1",
  MOCK_USER_ROLE: "vibe_coder"
}
```

## Monitoring Configuration

### Metrics Collection

```javascript
{
  metricsEndpoint: "/metrics",
  metricsInterval: 60000, // 1 minute
  customMetrics: [
    "roadmap_created",
    "agent_task_executed",
    "thrive_score_calculated"
  ]
}
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| API latency p95 | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Agent budget usage | > 80% | > 100% |
| Database connections | > 80% | > 95% |