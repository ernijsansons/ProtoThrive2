# ProtoThrive Production Operations Guide

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Status**: LIVE IN PRODUCTION

---

## 🌐 Production Environment

### Live URLs
- **Backend API**: https://backend-thermo-prod.ernijs-ansons.workers.dev
- **Frontend**: https://45a72d84.protothrive-live.pages.dev
- **Health Check**: https://backend-thermo-prod.ernijs-ansons.workers.dev/health

### Infrastructure
- **Backend**: Cloudflare Workers (Global edge network, 275+ locations)
- **Frontend**: Cloudflare Pages (Static site generation)
- **Database**: Cloudflare D1 (SQLite-based, serverless)
- **Cache**: Cloudflare KV (Key-Value store)
- **CDN**: Cloudflare global CDN

---

## 📊 Monitoring & Health Checks

### Automated Monitoring

#### Run Continuous Monitoring
```bash
# Start monitoring (checks every 60 seconds)
bash production-monitoring.sh

# View logs
tail -f production-monitoring.log
```

#### Manual Health Check
```bash
# Backend health
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health

# Expected response:
{
  "status": "healthy",
  "version": "3.0.0",
  "checks": {
    "database": true,
    "cache": true,
    "services": true
  }
}
```

### Metrics to Monitor

| Metric | Target | Alert Threshold | Command |
|--------|--------|-----------------|---------|
| Backend Uptime | 99.99% | < 99.9% | `curl -w "%{http_code}" backend/health` |
| Response Time | < 500ms | > 2s | `curl -w "%{time_total}" backend/health` |
| Error Rate | < 0.1% | > 1% | Check Cloudflare Dashboard |
| Database Status | Connected | Disconnected | Check `/health` response |
| Cache Status | Connected | Disconnected | Check `/health` response |

### Alert Thresholds
- **Critical**: 3+ consecutive health check failures
- **Warning**: Response time > 2 seconds
- **Notice**: Any database/cache connectivity issues

---

## 🔧 Common Operations

### 1. Viewing Logs

#### Backend Logs (Cloudflare Workers)
```bash
# Real-time logs
npx wrangler tail backend-thermo-prod --env production

# Filter by status
npx wrangler tail backend-thermo-prod --env production --status error

# Filter by method
npx wrangler tail backend-thermo-prod --env production --method POST
```

#### Frontend Logs (Cloudflare Pages)
```bash
# View deployment logs
npx wrangler pages deployments list --project-name=protothrive-live

# View specific deployment
npx wrangler pages deployment tail <deployment-id>
```

### 2. Deployments

#### Deploy Backend Update
```bash
cd backend

# Build
npm run build

# Deploy to production
CLOUDFLARE_ACCOUNT_ID=d2897bdebfa128919bd89b265e6a712e \
CLOUDFLARE_API_TOKEN=<your-token> \
npx wrangler deploy --env production

# Verify deployment
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health
```

#### Deploy Frontend Update
```bash
cd frontend

# Build
npm run build

# Deploy to production
CLOUDFLARE_API_TOKEN=<your-token> \
npx wrangler pages deploy out --project-name=protothrive-live --commit-dirty=true

# Verify deployment
curl -I https://45a72d84.protothrive-live.pages.dev/
```

### 3. Managing Secrets

#### Update JWT Secret
```bash
cd backend

# Set new JWT secret
echo "your-new-64-character-secret-here" | \
CLOUDFLARE_ACCOUNT_ID=d2897bdebfa128919bd89b265e6a712e \
CLOUDFLARE_API_TOKEN=<your-token> \
npx wrangler secret put JWT_SECRET --env production

# Verify (check logs for any auth errors)
npx wrangler tail backend-thermo-prod --env production
```

#### List All Secrets
```bash
npx wrangler secret list --env production
```

### 4. Database Operations

#### Run Database Migration
```bash
cd backend

# Execute migration against production D1
npx wrangler d1 execute protothrive-db \
  --file=migrations/001_init.sql \
  --remote

# Verify migration
npx wrangler d1 execute protothrive-db \
  --command="SELECT name FROM sqlite_master WHERE type='table';" \
  --remote
```

#### Query Production Database
```bash
# List all users
npx wrangler d1 execute protothrive-db \
  --command="SELECT id, email, role, created_at FROM users LIMIT 10;" \
  --remote

# Count roadmaps
npx wrangler d1 execute protothrive-db \
  --command="SELECT COUNT(*) as total FROM roadmaps;" \
  --remote

# Check database size
npx wrangler d1 execute protothrive-db \
  --command="SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();" \
  --remote
```

#### Backup Database
```bash
# Export database to SQL
npx wrangler d1 backup create protothrive-db --remote

# List backups
npx wrangler d1 backup list protothrive-db

# Download backup
npx wrangler d1 backup download protothrive-db <backup-id> --output backup.sql
```

### 5. Cache Management

#### Clear KV Cache
```bash
# List KV keys
npx wrangler kv:key list --namespace-id=ec3183e7b4e94442b3f99b4d2f4b083e

# Delete specific key
npx wrangler kv:key delete "session:user_123" \
  --namespace-id=ec3183e7b4e94442b3f99b4d2f4b083e

# Bulk delete keys
npx wrangler kv:key bulk delete --namespace-id=ec3183e7b4e94442b3f99b4d2f4b083e
```

---

## 🚨 Incident Response

### Incident Severity Levels

#### P0 - Critical (Complete Outage)
- **Definition**: Service completely unavailable
- **Response Time**: Immediate
- **Actions**:
  1. Check Cloudflare status: https://www.cloudflarestatus.com/
  2. Verify health endpoint returns 200
  3. Check recent deployments
  4. Rollback if necessary
  5. Escalate to on-call engineer

#### P1 - High (Partial Outage)
- **Definition**: Core features unavailable, affecting multiple users
- **Response Time**: < 15 minutes
- **Actions**:
  1. Identify affected functionality
  2. Check error logs
  3. Review recent changes
  4. Deploy hotfix or rollback

#### P2 - Medium (Degraded Performance)
- **Definition**: Slow response times, intermittent errors
- **Response Time**: < 1 hour
- **Actions**:
  1. Monitor performance metrics
  2. Check database query performance
  3. Review cache hit rates
  4. Scale if necessary

#### P3 - Low (Minor Issues)
- **Definition**: Non-critical bugs, cosmetic issues
- **Response Time**: Next business day
- **Actions**:
  1. Document issue
  2. Create bug ticket
  3. Prioritize for next sprint

### Common Issues & Solutions

#### Issue: Backend Returns 500 Errors

**Symptoms**:
- Health endpoint returns 500
- API requests failing

**Diagnosis**:
```bash
# Check recent logs
npx wrangler tail backend-thermo-prod --env production --status error

# Check database connectivity
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health | jq '.checks'
```

**Solutions**:
1. Check if JWT_SECRET is set correctly
2. Verify database migrations are applied
3. Check for TypeScript compilation errors in recent deploy
4. Rollback to previous deployment if needed

#### Issue: Frontend Shows 404

**Symptoms**:
- Frontend URL returns 404
- Pages not loading

**Diagnosis**:
```bash
# Check deployment status
npx wrangler pages deployments list --project-name=protothrive-live

# Check if build succeeded
npx wrangler pages deployment tail <latest-deployment-id>
```

**Solutions**:
1. Verify build completed successfully
2. Check if all pages were generated
3. Redeploy if necessary

#### Issue: Slow Response Times

**Symptoms**:
- API responses > 2 seconds
- Timeout errors

**Diagnosis**:
```bash
# Measure response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s \
  https://backend-thermo-prod.ernijs-ansons.workers.dev/health

# Check database query performance
npx wrangler d1 execute protothrive-db \
  --command="EXPLAIN QUERY PLAN SELECT * FROM roadmaps WHERE user_id='user_123';" \
  --remote
```

**Solutions**:
1. Add database indexes for slow queries
2. Implement caching for frequently accessed data
3. Review and optimize N+1 queries

#### Issue: Authentication Failures

**Symptoms**:
- Users cannot log in
- JWT validation errors

**Diagnosis**:
```bash
# Test login endpoint
curl -X POST https://backend-thermo-prod.ernijs-ansons.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -v

# Check if JWT_SECRET is set
npx wrangler secret list --env production | grep JWT_SECRET
```

**Solutions**:
1. Verify JWT_SECRET is configured
2. Check token expiry settings
3. Verify bcrypt rounds configuration
4. Test with known good credentials

---

## 🔄 Rollback Procedures

### Backend Rollback

```bash
# List recent deployments
npx wrangler deployments list

# Output shows:
# Deployment ID                            Created On           Author
# 1b2f4240-c8b4-476a-8030-9b98891cd60f     2025-10-19 13:00:00  you@example.com
# abc123...                                2025-10-18 10:00:00  you@example.com

# Rollback to previous version
npx wrangler rollback abc123...

# Verify rollback
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health
```

### Frontend Rollback

```bash
# List deployments
npx wrangler pages deployments list --project-name=protothrive-live

# Promote previous deployment to production
npx wrangler pages deployments rollback <previous-deployment-id> \
  --project-name=protothrive-live

# Verify
curl -I https://45a72d84.protothrive-live.pages.dev/
```

---

## 📈 Performance Optimization

### Database Optimization

#### Add Indexes
```sql
-- Index for user lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for roadmap queries
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);

-- Composite index for common queries
CREATE INDEX idx_roadmaps_user_status ON roadmaps(user_id, status);
```

#### Query Optimization
```bash
# Analyze query performance
npx wrangler d1 execute protothrive-db \
  --command="EXPLAIN QUERY PLAN SELECT * FROM roadmaps WHERE user_id=? AND status=?;" \
  --remote

# Optimize database
npx wrangler d1 execute protothrive-db \
  --command="VACUUM; ANALYZE;" \
  --remote
```

### Caching Strategy

#### KV Cache Best Practices
```typescript
// Cache user sessions (TTL: 7 days)
await env.KV_STORE.put(`session:${userId}`, sessionData, {
  expirationTtl: 604800
});

// Cache roadmap data (TTL: 1 hour)
await env.KV_STORE.put(`roadmap:${roadmapId}`, roadmapData, {
  expirationTtl: 3600
});

// Cache expensive queries (TTL: 5 minutes)
await env.KV_STORE.put(`query:${hash}`, result, {
  expirationTtl: 300
});
```

---

## 🔐 Security Operations

### Security Checklist

#### Daily
- [ ] Review error logs for suspicious activity
- [ ] Check failed login attempts
- [ ] Monitor rate limiting triggers

#### Weekly
- [ ] Review new user registrations
- [ ] Audit database access patterns
- [ ] Check for unusual API usage

#### Monthly
- [ ] Rotate JWT secrets
- [ ] Review and update security headers
- [ ] Audit user permissions and roles
- [ ] Review third-party dependencies for vulnerabilities

### Security Incident Response

1. **Identify**: Determine scope and severity
2. **Contain**: Block malicious IPs, disable compromised accounts
3. **Investigate**: Review logs, identify attack vector
4. **Remediate**: Patch vulnerabilities, update secrets
5. **Document**: Write incident report, update procedures

### Rate Limiting

Current configuration:
- **Global**: 100 requests/minute per IP
- **Authenticated**: 1000 requests/minute per user
- **Login attempts**: 5 failures triggers 15-minute lockout

---

## 📞 Support & Escalation

### On-Call Contacts
- **Primary**: [Your email/phone]
- **Secondary**: [Backup contact]
- **Cloudflare Support**: https://dash.cloudflare.com/support

### External Resources
- **Cloudflare Status**: https://www.cloudflarestatus.com/
- **Workers Docs**: https://developers.cloudflare.com/workers/
- **D1 Docs**: https://developers.cloudflare.com/d1/
- **KV Docs**: https://developers.cloudflare.com/kv/

---

## 📝 Maintenance Windows

### Recommended Schedule
- **Database maintenance**: Sundays, 2:00 AM - 4:00 AM UTC
- **Deployment window**: Monday-Thursday, 10:00 AM - 4:00 PM UTC
- **Emergency patches**: Anytime, with notification

### Pre-Maintenance Checklist
1. [ ] Announce maintenance window (24 hours notice)
2. [ ] Create database backup
3. [ ] Test changes in staging environment
4. [ ] Prepare rollback plan
5. [ ] Have on-call engineer available

### Post-Maintenance Checklist
1. [ ] Run comprehensive health checks
2. [ ] Verify critical user flows
3. [ ] Monitor error rates for 1 hour
4. [ ] Send all-clear notification
5. [ ] Document any issues encountered

---

## 🎯 KPIs & SLAs

### Service Level Objectives (SLOs)

| Metric | Target | Current |
|--------|--------|---------|
| Uptime | 99.99% | 100% (since launch) |
| API Response Time | < 100ms (p50) | ~200ms |
| API Response Time | < 500ms (p95) | ~400ms |
| Error Rate | < 0.1% | < 0.01% |
| Database Query Time | < 50ms (p95) | ~30ms |

### Success Metrics

**Daily**:
- Active users
- API requests processed
- Authentication success rate
- Error rate

**Weekly**:
- New user registrations
- Roadmaps created
- Average session duration
- Cache hit rate

**Monthly**:
- Monthly active users (MAU)
- Feature adoption rate
- Performance trends
- Cost per user

---

## 🛠️ Tools & Automation

### Production Scripts

1. **test-production.sh**: Comprehensive E2E test suite
2. **production-monitoring.sh**: Continuous health monitoring
3. **deploy-backend.sh**: Automated backend deployment
4. **deploy-frontend.sh**: Automated frontend deployment

### Recommended Tools

- **Monitoring**: Datadog, New Relic, or Cloudflare Analytics
- **Logging**: Cloudflare Logpush, Papertrail
- **Error Tracking**: Sentry, Rollbar
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Lighthouse CI, WebPageTest

---

**Built with ❤️ by the ProtoThrive Engineering Team**
**Powered by Cloudflare Workers & Pages**
**For support: [Your support email]**
