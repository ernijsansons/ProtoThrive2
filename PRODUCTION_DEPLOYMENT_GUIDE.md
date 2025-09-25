# 🚀 ProtoThrive Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Verification](#verification)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
```bash
# Install Node.js 20+
node --version  # Should be 20.x or higher

# Install Cloudflare Wrangler
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Install other dependencies
npm install
```

### Required Accounts
- ✅ Cloudflare account with Workers & Pages enabled
- ✅ D1 database access
- ✅ KV namespace access
- ✅ API tokens with appropriate permissions

## Environment Setup

### 1. Create Environment Files
```bash
# Copy production environment template
cp .env.production .env

# Update with actual values:
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_API_TOKEN
# - D1_DATABASE_ID
# - KV_NAMESPACE_ID
# - JWT_SECRET (generate secure 32+ char string)
```

### 2. Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate API keys
uuidgen  # For various API tokens
```

## Database Setup

### 1. Create D1 Database
```bash
# Create production database
wrangler d1 create protothrive-db

# Note the database_id returned and update wrangler.toml
```

### 2. Run Migrations
```bash
# Make migration script executable
chmod +x scripts/run-migrations.sh

# Run all migrations
./scripts/run-migrations.sh production

# Verify tables created
wrangler d1 execute protothrive-db \
  --command="SELECT name FROM sqlite_master WHERE type='table'" \
  --env=production
```

### 3. Expected Tables
- `users` - User accounts and authentication
- `roadmaps` - Project roadmaps with JSON graphs
- `snippets` - Code snippets and templates
- `agent_logs` - AI agent execution history
- `insights` - Analytics and metrics

## Backend Deployment

### 1. Configure Wrangler
```toml
# Update wrangler.toml with production values
name = "protothrive-backend"
main = "backend/src/index.js"
compatibility_date = "2024-08-26"

account_id = "YOUR_ACTUAL_ACCOUNT_ID"
workers_dev = false

[[d1_databases]]
binding = "DB"
database_name = "protothrive-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"
```

### 2. Deploy Backend
```bash
# Deploy to production
cd backend
wrangler deploy --env production

# Or use npm script
npm run deploy:production
```

### 3. Verify Deployment
```bash
# Check health endpoint
curl https://backend-thermo.ernijs-ansons.workers.dev/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-09-22T...",
  "service": "protothrive-backend",
  "version": "1.0.0"
}

# Check readiness
curl https://backend-thermo.ernijs-ansons.workers.dev/ready

# Expected response:
{
  "ready": true,
  "checks": {
    "database": true,
    "cache": true
  }
}
```

## Frontend Deployment

### 1. Update Frontend Configuration
```bash
# Update frontend/.env.production
NEXT_PUBLIC_API_URL=https://backend-thermo.ernijs-ansons.workers.dev
NEXT_PUBLIC_APP_URL=https://protothrive-frontend.pages.dev
```

### 2. Build Frontend
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build:production

# Test locally
npm run start:production
```

### 3. Deploy to Cloudflare Pages
```bash
# Using wrangler
wrangler pages deploy out \
  --project-name=protothrive-frontend \
  --branch=main

# Or using the deploy script
./deploy-cloudflare.sh
```

## Verification

### 1. API Health Checks
```bash
# Test all critical endpoints
./scripts/verify-deployment.sh

# Manual tests
curl -X GET https://backend-thermo.ernijs-ansons.workers.dev/health
curl -X GET https://backend-thermo.ernijs-ansons.workers.dev/ready
curl -X GET https://backend-thermo.ernijs-ansons.workers.dev/metrics
```

### 2. Frontend Checks
- Visit https://protothrive-frontend.pages.dev
- Check console for errors
- Test login flow
- Create test roadmap
- Verify 2D/3D canvas

### 3. Integration Tests
```bash
# Run E2E tests
npm run test:e2e

# Run load tests
npm run test:load
```

## Monitoring

### 1. Setup Monitoring Dashboards
```bash
# Cloudflare Analytics
# Visit: https://dash.cloudflare.com/analytics

# Custom metrics endpoint
curl https://backend-thermo.ernijs-ansons.workers.dev/metrics
```

### 2. Configure Alerts
- Set up Cloudflare email alerts
- Configure Sentry for error tracking
- Set up uptime monitoring (e.g., Pingdom, UptimeRobot)

### 3. Log Aggregation
```javascript
// View Worker logs
wrangler tail --env production

// Stream logs to external service
wrangler tail --env production --format json | \
  jq '.' | \
  tee production-logs.json
```

## Troubleshooting

### Common Issues

#### 1. 500 Errors on Backend
```bash
# Check Worker logs
wrangler tail --env production

# Common causes:
# - Missing environment variables
# - Database not initialized
# - KV namespace not bound
```

#### 2. Database Connection Issues
```bash
# Verify D1 binding
wrangler d1 list

# Test direct query
wrangler d1 execute protothrive-db \
  --command="SELECT 1" \
  --env=production
```

#### 3. Frontend Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for JSX syntax errors
npm run lint:fix
```

#### 4. CORS Issues
```javascript
// Update backend/src/index.js
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://protothrive-frontend.pages.dev',
  // Add your domain
};
```

## Performance Optimization

### 1. Enable Caching
```javascript
// Add cache headers to responses
headers: {
  'Cache-Control': 'public, max-age=3600',
  'CDN-Cache-Control': 'max-age=7200'
}
```

### 2. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);
```

### 3. Bundle Optimization
```bash
# Analyze bundle size
npm run build:analyze

# Implement code splitting
# Use dynamic imports for heavy components
```

## Security Checklist

- [ ] JWT secret is secure (32+ chars)
- [ ] Environment variables are set
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] SQL injection prevention in place
- [ ] XSS protection headers set
- [ ] HTTPS enforced everywhere
- [ ] Sensitive data encrypted
- [ ] Audit logging enabled
- [ ] Regular security scans scheduled

## Rollback Procedure

If deployment fails:

```bash
# 1. Revert to previous Worker version
wrangler rollback --env production

# 2. Restore database if needed
wrangler d1 execute protothrive-db \
  --file=backup/restore.sql \
  --env=production

# 3. Clear cache
wrangler kv:key delete --namespace-id=KV_NAMESPACE_ID "*"

# 4. Notify team
echo "Rollback completed" | mail -s "ProtoThrive Rollback" team@protothrive.com
```

## Success Metrics

Monitor these KPIs post-deployment:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| Response Time (p95) | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| API Success Rate | > 99% | < 95% |
| Database Query Time | < 50ms | > 200ms |

## Support

For deployment issues:
- 📧 Email: devops@protothrive.com
- 💬 Slack: #deployment-support
- 📚 Docs: https://docs.protothrive.com

---

**Last Updated**: September 22, 2024
**Version**: 1.0.0
**Status**: READY FOR DEPLOYMENT 🚀