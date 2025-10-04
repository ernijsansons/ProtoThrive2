# ProtoThrive2 Production Deployment Checklist

**Version**: 1.0.0
**Last Updated**: 2025-01-04
**Platform**: Cloudflare Workers + Pages

---

## Pre-Deployment Requirements

### 1. Environment Variables Setup

Create production environment variables with actual values:

```bash
# Required Environment Variables
JWT_SECRET               # Minimum 64 characters, use: openssl rand -base64 64
CLOUDFLARE_ACCOUNT_ID    # Your Cloudflare account ID
D1_DATABASE_ID          # Production D1 database ID
KV_NAMESPACE_ID         # Production KV namespace ID
NODE_ENV                # Set to "production"
ENVIRONMENT             # Set to "production"

# Optional but Recommended
CLAUDE_API_KEY          # Anthropic Claude API key (if using AI features)
OPENAI_API_KEY          # OpenAI API key (if using AI features)
STRIPE_SECRET_KEY       # Stripe secret key (if using payments)
RATE_LIMIT_REQUESTS     # Default: 100 per minute
CACHE_TTL_SECONDS       # Default: 3600
LOG_LEVEL              # Options: debug, info, warn, error
```

### 2. Secrets Management

```bash
# Set production secrets in Cloudflare Workers
wrangler secret put JWT_SECRET --env production
# Enter your 64+ character secret when prompted

# For local development (never commit this file)
echo "JWT_SECRET=your_production_secret_here" > backend/.dev.vars
```

---

## Database Setup

### 1. Create Production Database

```bash
# Create D1 database for production
wrangler d1 create protothrive-db-prod

# Note the database_id returned and update wrangler.toml
```

### 2. Run Migrations

```bash
# Execute migrations in order
cd backend

# Initial schema
wrangler d1 execute protothrive-db-prod --file=migrations/001_init.sql --env production

# Users table
wrangler d1 execute protothrive-db-prod --file=migrations/002_users_table.sql --env production

# Schema updates
wrangler d1 execute protothrive-db-prod --file=migrations/003_update_schema.sql --env production
```

### 3. Verify Database

```bash
# Test database connectivity
wrangler d1 execute protothrive-db-prod --command="SELECT name FROM sqlite_master WHERE type='table';" --env production
```

---

## Build Process

### 1. Install Dependencies

```bash
# From root directory
npm install
npm run install-all
```

### 2. Build Backend

```bash
cd backend
npm run build

# Verify build output
ls -la dist/
# Should see index.js and other compiled files
```

### 3. Build Frontend

```bash
cd ../frontend
npm run build

# Verify build output
ls -la .next/
# Should see static files and build artifacts
```

---

## Deployment Commands

### Backend Deployment (Cloudflare Workers)

```bash
cd backend

# Deploy to staging first
wrangler deploy --env staging

# Test staging deployment
curl https://backend-thermo-staging.workers.dev/health

# Deploy to production
wrangler deploy --env production

# Verify production
curl https://api.protothrive.com/health
```

### Frontend Deployment (Cloudflare Pages)

```bash
cd frontend

# Build for production
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name=protothrive-frontend --env=production

# Alternative: Use GitHub integration for automatic deployments
# Connect repository in Cloudflare Pages dashboard
```

---

## Verification Steps

### 1. Health Checks

```bash
# Backend health check
curl https://api.protothrive.com/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2025-01-04T..."
}
```

### 2. API Endpoints

```bash
# Test authentication endpoint
curl -X POST https://api.protothrive.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test public endpoints
curl https://api.protothrive.com/api/status
```

### 3. Frontend Verification

```bash
# Check frontend is accessible
curl -I https://protothrive.com

# Verify static assets
curl -I https://protothrive.com/_next/static/chunks/main.js
```

### 4. Database Connectivity

```bash
# Test database through API
curl https://api.protothrive.com/api/roadmaps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rollback Procedures

### Immediate Rollback

```bash
# List recent deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback [deployment-id] --env production

# Verify rollback
curl https://api.protothrive.com/health
```

### Database Rollback

```bash
# Keep migration rollback scripts ready
# Store in migrations/rollback/ directory

# Example rollback
wrangler d1 execute protothrive-db-prod --file=migrations/rollback/003_rollback.sql --env production
```

### Frontend Rollback

```bash
# Cloudflare Pages maintains deployment history
# Use dashboard to rollback or:

# Deploy previous version
git checkout [previous-commit]
npm run build
npx wrangler pages deploy out --project-name=protothrive-frontend
```

---

## Monitoring Setup

### 1. Enable Cloudflare Analytics

```bash
# In wrangler.toml add:
[analytics_engine]
binding = "ANALYTICS"
```

### 2. Set Up Alerts

Configure in Cloudflare Dashboard:
- Error rate > 1%
- Response time > 500ms
- Worker errors
- Rate limit triggers

### 3. Log Aggregation

```javascript
// Add to worker code
console.log(JSON.stringify({
  level: 'info',
  message: 'Request processed',
  requestId: c.get('requestId'),
  duration: Date.now() - startTime,
  timestamp: new Date().toISOString()
}));
```

---

## Security Checklist

- [ ] All production secrets are set (not using mock values)
- [ ] JWT_SECRET is minimum 64 characters
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled and configured
- [ ] Security headers are enabled
- [ ] HTTPS is enforced
- [ ] Database migrations are complete
- [ ] Admin endpoints are protected
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't contain PII or secrets

---

## Performance Optimization

### 1. Enable Caching

```toml
# In wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-cache-namespace-id"
```

### 2. Configure CDN

```javascript
// In worker response
return new Response(body, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
    'CDN-Cache-Control': 'max-age=86400'
  }
});
```

### 3. Enable Compression

```javascript
// Already handled by Cloudflare, ensure not disabled
```

---

## Post-Deployment Tasks

### Immediate (Within 1 Hour)
- [ ] Verify all health checks pass
- [ ] Test authentication flow end-to-end
- [ ] Check monitoring dashboards
- [ ] Verify error tracking is working
- [ ] Test rate limiting

### Within 24 Hours
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup procedures
- [ ] Test rollback procedure
- [ ] Document any issues found

### Within 1 Week
- [ ] Conduct security scan
- [ ] Review usage patterns
- [ ] Optimize based on metrics
- [ ] Update documentation
- [ ] Plan next deployment

---

## Troubleshooting

### Common Issues and Solutions

#### 1. JWT_SECRET not found
```bash
# Set secret
wrangler secret put JWT_SECRET --env production
```

#### 2. Database connection error
```bash
# Verify database ID in wrangler.toml
# Check migrations were run
wrangler d1 list
```

#### 3. CORS errors
```javascript
// Update allowed origins in backend
const allowedOrigins = [
  'https://protothrive.com',
  'https://www.protothrive.com'
];
```

#### 4. Rate limiting issues
```bash
# Adjust in backend code or environment
RATE_LIMIT_REQUESTS_PER_MINUTE=200
```

---

## Emergency Contacts

- **Infrastructure**: Cloudflare Support
- **Monitoring**: Check Cloudflare Dashboard
- **Logs**: `wrangler tail --env production`
- **Status Page**: https://www.cloudflarestatus.com/

---

## Deployment Sign-Off

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Secrets properly set
- [ ] Database migrations complete
- [ ] Build successful
- [ ] Tests passing

### Deployment
- [ ] Staging deployment successful
- [ ] Staging tests passed
- [ ] Production deployment successful
- [ ] Health checks passing

### Post-Deployment
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback tested

---

**Deployment Approved By**: _________________
**Date**: _________________
**Version Deployed**: _________________

---

## Quick Reference Commands

```bash
# Build everything
npm run build

# Deploy backend
cd backend && wrangler deploy --env production

# Deploy frontend
cd frontend && npm run build && npx wrangler pages deploy out

# Check logs
wrangler tail --env production

# Rollback
wrangler rollback [id] --env production

# Database migration
wrangler d1 execute protothrive-db-prod --file=migrations/[file].sql --env production
```

---

**Note**: This checklist should be reviewed and updated after each deployment to incorporate lessons learned and process improvements.