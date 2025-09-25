# Integrations Inventory - ProtoThrive2

## External Service Integrations

### AI/ML Services

#### Enterprise Agent v3.4
- **Purpose**: Primary code generation and analysis
- **Provider**: Multi-model ensemble
- **Models Used**:
  - OpenAI GPT-5 Codex (primary)
  - Claude Opus 4 (backup)
  - Google Gemini 2.5 (multimodal)
  - xAI Grok (library awareness)
- **Rate Limits**: Based on provider
- **Retry Strategy**: 3 attempts with exponential backoff
- **Budget**: $0.40 default, $1.00 max per task
- **Configuration**: enterprise-agent/configs/agent_config_v3.4.yaml

#### Pinecone Vector Database
- **Purpose**: RAG for template matching
- **Endpoints**: api.pinecone.io
- **Rate Limits**: 100 requests/second
- **Timeout**: 30 seconds
- **Retry**: 3 attempts with backoff
- **Fallback**: Local cache if unavailable

#### Language Models (Direct)
- **Claude API** (Anthropic)
  - Endpoint: api.anthropic.com
  - Models: Claude-3-opus, Claude-3-sonnet
  - Rate limit: 1000 requests/min
- **OpenAI API**
  - Endpoint: api.openai.com
  - Models: GPT-4, GPT-5 (when available)
  - Rate limit: 3000 requests/min
- **Kimi API**
  - Purpose: Low-cost tasks
  - Budget: < $0.05 per task

### Authentication & Identity

#### Clerk
- **Purpose**: User authentication and management
- **Features**: JWT, OAuth, MFA
- **Endpoints**: api.clerk.dev
- **Rate Limits**: 10000 requests/month (free tier)
- **Webhooks**: User events
- **Status**: Configured but not fully integrated

#### OAuth Providers (Planned)
- GitHub OAuth
- Google OAuth
- Microsoft Azure AD

### Payment Processing

#### Stripe
- **Purpose**: Subscription billing
- **Endpoints**: api.stripe.com
- **Webhooks**: Payment events
- **Rate Limits**: No hard limit
- **Retry**: Automatic with idempotency keys
- **Status**: Configuration present, not active

### Infrastructure Services

#### Cloudflare Services
- **Workers**: Edge compute runtime
- **Pages**: Frontend hosting
- **D1**: SQLite database
- **KV**: Key-value storage
- **R2**: Object storage (planned)
- **Queues**: Task queue (planned)
- **Analytics**: Usage metrics

#### Vercel (Alternative)
- **Purpose**: Frontend deployment alternative
- **Status**: Configuration present
- **Endpoints**: api.vercel.com

### Monitoring & Analytics

#### Sentry
- **Purpose**: Error tracking and monitoring
- **DSN**: Configured in environment
- **Features**: Error capture, performance monitoring
- **Integration Points**: Frontend and backend
- **Rate Limits**: Based on plan

#### Datadog (Planned)
- **Purpose**: APM and infrastructure monitoring
- **Metrics**: Custom metrics via StatsD
- **Traces**: Distributed tracing
- **Logs**: Centralized logging

#### Google Analytics
- **Purpose**: User behavior tracking
- **Tracking ID**: GA_TRACKING_ID
- **Events**: Custom events for features
- **Status**: Configuration present

### Communication Services

#### Slack
- **Purpose**: HITL escalation and notifications
- **Webhook URL**: Configured
- **Channel**: #hitl-thermo
- **Events**: Agent failures, budget exceeded
- **Rate Limits**: 1 message per second

#### Email (Planned)
- SendGrid or AWS SES
- Transactional emails
- Weekly digests

### Development Tools

#### GitHub
- **Purpose**: Version control and CI/CD
- **Features**:
  - Actions for CI/CD
  - Issue tracking
  - Pull request integration
- **Webhooks**: Push events, PR events

#### n8n
- **Purpose**: Workflow automation
- **Endpoints**: Webhook triggers
- **Workflows**: automation/workflows/automation.json
- **Secret**: N8N_SECRET

### Content & Assets

#### Spline
- **Purpose**: 3D scene rendering
- **Scene URL**: prod.spline.design/neon-cube-thermo
- **Features**: Interactive 3D visualization
- **Fallback**: 2D React Flow

#### Cloudinary (Planned)
- **Purpose**: Image optimization and CDN
- **Features**: Auto-format, responsive images

## Integration Patterns

### Webhook Handling
```javascript
// Webhook verification pattern
const verifyWebhook = (signature, payload, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return signature === `sha256=${digest}`;
};
```

### Rate Limit Handling
```javascript
// Rate limit with exponential backoff
const rateLimitRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
};
```

### Circuit Breaker Pattern
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

## Service Dependencies

### Critical Services (Must be operational)
1. Cloudflare Workers
2. Cloudflare D1
3. JWT Authentication

### Important Services (Degraded functionality)
1. Enterprise Agent
2. Cloudflare KV
3. WebSocket connections

### Optional Services (Enhanced features)
1. Spline 3D
2. Analytics
3. Marketplace
4. Payment processing

## Integration Health Checks

### Health Check Endpoints
```javascript
const healthChecks = {
  database: async () => {
    const result = await db.prepare('SELECT 1').first();
    return !!result;
  },
  cache: async () => {
    await kv.put('health', 'ok', { expirationTtl: 60 });
    const value = await kv.get('health');
    return value === 'ok';
  },
  agent: async () => {
    const response = await fetch(ENTERPRISE_AGENT_URL + '/health');
    return response.ok;
  }
};
```

## Failure Modes & Fallbacks

| Service | Failure Mode | Fallback Strategy |
|---------|-------------|-------------------|
| Enterprise Agent | Timeout/Error | Use lightweight Python agent |
| Pinecone | Unavailable | Use local snippet cache |
| Spline 3D | Load failure | Fall back to 2D React Flow |
| WebSocket | Connection lost | Poll for updates |
| KV Cache | Unavailable | Direct database queries |
| Clerk Auth | Service down | Read-only mode with cached JWT |
| Stripe | Payment failure | Queue for retry |
| Sentry | Cannot log | Local error logging |

## API Keys & Secrets Management

### Secret Storage
- **Development**: .env files (gitignored)
- **Staging/Production**: Cloudflare environment variables
- **CI/CD**: GitHub encrypted secrets

### Key Rotation Schedule
- **JWT Secrets**: Every 90 days
- **API Keys**: Every 180 days
- **Database Credentials**: Every 365 days
- **Webhook Secrets**: On demand

## SLAs & Support

| Service | SLA | Support Tier |
|---------|-----|--------------|
| Cloudflare | 99.99% | Enterprise |
| OpenAI | 99.9% | Standard |
| Clerk | 99.95% | Pro |
| Stripe | 99.99% | Standard |
| Pinecone | 99.9% | Standard |

## Cost Optimization

### Service Costs (Monthly Estimates)
- **Cloudflare Workers**: $5 (included in plan)
- **Cloudflare D1**: $5 (storage + reads)
- **AI/ML APIs**: $100-500 (usage-based)
- **Clerk**: $25 (pro plan)
- **Monitoring**: $50 (combined services)

### Cost Controls
- Budget caps on AI tasks ($0.10 default)
- Caching to reduce API calls
- Batch operations where possible
- Use fallback agents for simple tasks