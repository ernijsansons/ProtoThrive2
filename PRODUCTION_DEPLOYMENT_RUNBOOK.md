# ProtoThrive Production Deployment Runbook
## Operations Guide for Production Environment

**Version**: 1.0.0  
**Last Updated**: September 23, 2025  
**Maintained By**: DevOps Team

---

## Quick Reference

### Critical Information
- **Backend Production URL**: `https://backend-thermo-prod.ernijs-ansons.workers.dev`
- **Staging URL**: `https://backend-thermo-staging.ernijs-ansons.workers.dev`
- **Health Check**: `GET /health`
- **Emergency Contact**: ops@protothrive.com
- **On-Call Rotation**: See PagerDuty schedule

### Service Dependencies
- **Cloudflare Workers**: Runtime environment
- **D1 Database**: Primary data storage
- **KV Namespace**: Caching and session storage
- **Datadog**: Monitoring and alerting
- **Sentry**: Error tracking and debugging

---

## Pre-Deployment Prerequisites

### 1. Environment Verification
```bash
# Verify Cloudflare account access
wrangler whoami

# Check D1 database access
wrangler d1 list

# Verify KV namespace access
wrangler kv:namespace list
```

### 2. Secret Management
```bash
# Set production secrets (one-time setup)
wrangler secret put SENTRY_DSN --env production
wrangler secret put DATADOG_API_KEY --env production
wrangler secret put DATADOG_APP_KEY --env production

# Verify secrets are set
wrangler secret list --env production
```

### 3. Database Migration
```bash
# Run database migrations
cd backend
wrangler d1 execute protothrive-db --file=migrations/001_init.sql --remote --env production
```

---

## Deployment Procedures

### Standard Deployment Process

#### 1. Pre-Deployment Checks
```bash
# Run all tests
cd backend
npm test

# Security audit
npm audit --audit-level=high

# Build verification
npm run build

# TypeScript validation
npm run typecheck
```

#### 2. Staging Deployment & Validation
```bash
# Deploy to staging
npm run deploy:staging

# Validate staging deployment
curl https://backend-thermo-staging.ernijs-ansons.workers.dev/health

# Run integration tests
npm run test:integration
```

#### 3. Production Deployment
```bash
# Deploy to production
npm run deploy:production

# Immediate post-deployment validation
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health

# Verify API endpoints
curl -H "Authorization: Bearer mock" \
  https://backend-thermo-prod.ernijs-ansons.workers.dev/roadmaps/test-id
```

### Rollback Procedure

#### Emergency Rollback
```bash
# Get current deployment version
wrangler deployments list --env production

# Rollback to previous version (if needed)
wrangler rollback <version-id> --env production

# Verify rollback
curl https://backend-thermo-prod.ernijs-ansons.workers.dev/health
```

---

## Monitoring & Alerting

### Health Check Monitoring

#### Automated Health Checks
- **Endpoint**: `GET /health`
- **Expected Response**: `{"status":"healthy",...}`
- **Frequency**: Every 30 seconds
- **Timeout**: 5 seconds
- **Failure Threshold**: 3 consecutive failures

#### Health Check Script
```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="https://backend-thermo-prod.ernijs-ansons.workers.dev/health"
RESPONSE=$(curl -s -w "%{http_code}" "$HEALTH_URL")
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Service healthy"
    exit 0
else
    echo "❌ Service unhealthy - HTTP $HTTP_CODE"
    exit 1
fi
```

### Performance Monitoring

#### Key Metrics to Monitor
1. **Response Time**
   - Target: <25ms average
   - Alert: >100ms for 5 minutes
   - Critical: >500ms for 1 minute

2. **Error Rate**
   - Target: <1%
   - Alert: >5% for 5 minutes
   - Critical: >10% for 1 minute

3. **Throughput**
   - Monitor: Requests per second
   - Alert: Unusual spike or drop (>3 standard deviations)

4. **Database Performance**
   - D1 query time: <10ms average
   - KV access time: <5ms average

### Alerting Configuration

#### Datadog Monitors
```json
{
  "name": "ProtoThrive Backend Health",
  "type": "service check",
  "query": "\"http.can_connect\".over(\"instance:prod\").last(3).count_by_status()",
  "message": "🚨 ProtoThrive backend is DOWN! @ops-team",
  "options": {
    "thresholds": {
      "critical": 3,
      "warning": 2
    },
    "notify_no_data": true,
    "no_data_timeframe": 5
  }
}
```

#### PagerDuty Integration
- **Service Key**: Set in Datadog integration
- **Escalation Policy**: 
  - Level 1: Primary on-call (immediate)
  - Level 2: Secondary on-call (5 minutes)
  - Level 3: Engineering manager (15 minutes)

---

## Troubleshooting Guide

### Common Issues

#### 1. Service Unavailable (502/503 Errors)
**Symptoms**: Health check failing, 502/503 responses
**Possible Causes**:
- Worker script runtime error
- D1 database connectivity issues
- Cloudflare edge issues

**Troubleshooting Steps**:
```bash
# Check worker logs
wrangler tail --env production

# Verify database connectivity
wrangler d1 execute protothrive-db --command "SELECT 1" --env production

# Check Cloudflare status
curl -s https://www.cloudflarestatus.com/api/v2/status.json
```

#### 2. High Response Times
**Symptoms**: Response times >100ms consistently
**Possible Causes**:
- Database query performance
- Cold start issues
- Network latency

**Troubleshooting Steps**:
```bash
# Check database performance
wrangler d1 execute protothrive-db --command "EXPLAIN QUERY PLAN SELECT * FROM roadmaps LIMIT 1" --env production

# Monitor worker metrics in Cloudflare dashboard
# Check for cold start patterns in logs
```

#### 3. Authentication Errors
**Symptoms**: 401 errors, JWT validation failures
**Possible Causes**:
- JWT secret mismatch
- Clock skew issues
- Malformed tokens

**Troubleshooting Steps**:
```bash
# Verify JWT validation logic
curl -H "Authorization: Bearer invalid-token" \
  https://backend-thermo-prod.ernijs-ansons.workers.dev/roadmaps/test

# Check error logs for specific JWT errors
wrangler tail --env production | grep "AUTH-401"
```

### Emergency Contacts

#### Primary Contacts
- **On-Call Engineer**: See PagerDuty rotation
- **DevOps Lead**: Contact via Slack @devops-lead
- **Engineering Manager**: Contact via phone (emergency only)

#### Escalation Matrix
1. **P0 (Critical)**: Service completely down
   - Response Time: Immediate
   - Escalation: All hands on deck

2. **P1 (High)**: Significant degradation
   - Response Time: 15 minutes
   - Escalation: Primary + secondary on-call

3. **P2 (Medium)**: Minor issues
   - Response Time: 2 hours during business hours
   - Escalation: Primary on-call only

---

## Security Procedures

### Incident Response

#### Security Incident Detection
- **Unusual traffic patterns**: Monitor via Cloudflare Analytics
- **Authentication failures**: Monitor 401 error spikes
- **Data access anomalies**: Monitor D1 query patterns

#### Response Steps
1. **Immediate**: Enable additional logging
2. **Assessment**: Determine scope and impact
3. **Containment**: Rate limiting or IP blocking if needed
4. **Investigation**: Full audit trail analysis
5. **Recovery**: Apply fixes and monitor
6. **Documentation**: Complete incident report

### Access Management

#### Production Access
- **Principle of Least Privilege**: Only essential personnel
- **Two-Factor Authentication**: Required for all access
- **Access Review**: Quarterly review of all permissions
- **Audit Trail**: All access logged and monitored

#### Secret Rotation
```bash
# Quarterly secret rotation procedure
# 1. Generate new secrets
# 2. Update in external services (Sentry, Datadog)
# 3. Update in Cloudflare Workers
wrangler secret put NEW_SECRET_NAME --env production
# 4. Verify functionality
# 5. Remove old secrets
```

---

## Performance Optimization

### Caching Strategy

#### KV Cache Configuration
- **Session Data**: TTL 1 hour
- **User Preferences**: TTL 24 hours
- **Static Data**: TTL 7 days

#### D1 Query Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_roadmaps_user_status ON roadmaps(user_id, status, updated_at);
CREATE INDEX idx_agent_logs_roadmap ON agent_logs(roadmap_id, timestamp);
```

### Cost Optimization

#### Budget Monitoring
- **Monthly Budget**: $500 USD
- **Alert Threshold**: 80% of budget
- **Emergency Cutoff**: 95% of budget

#### Usage Optimization
```bash
# Monitor daily spend
wrangler usage --since=1d

# Review top consuming endpoints
wrangler analytics --metric=requests --since=1d
```

---

## Backup & Recovery

### Data Backup Strategy

#### D1 Database Backup
```bash
# Daily automated backup
wrangler d1 backup create protothrive-db --env production

# Restore from backup (emergency only)
wrangler d1 backup restore protothrive-db <backup-id> --env production
```

#### Configuration Backup
```bash
# Export wrangler configuration
wrangler config export > wrangler-backup-$(date +%Y%m%d).toml

# Version control all configuration changes
git tag "release-$(date +%Y%m%d-%H%M%S)"
```

### Disaster Recovery

#### Recovery Time Objectives
- **RTO**: 15 minutes (Recovery Time Objective)
- **RPO**: 1 hour (Recovery Point Objective)
- **MTTR**: 30 minutes (Mean Time To Recovery)

#### Recovery Procedures
1. **Service Recovery**: Redeploy from known good state
2. **Data Recovery**: Restore from latest backup
3. **Validation**: Complete system health check
4. **Communication**: Update status page and notify stakeholders

---

## Change Management

### Deployment Windows

#### Standard Deployments
- **Schedule**: Tuesday/Thursday 10 AM - 2 PM UTC
- **Approval**: Technical lead approval required
- **Testing**: Full staging validation required

#### Emergency Deployments
- **Authorization**: Engineering manager approval
- **Documentation**: Post-incident review required
- **Communication**: Real-time updates to stakeholders

### Version Control

#### Branching Strategy
- **main**: Production releases only
- **staging**: Staging deployments
- **feature/***: Feature development
- **hotfix/***: Emergency fixes

#### Release Process
1. **Feature complete**: Merge to staging
2. **Staging validation**: Full test suite
3. **Production deployment**: Merge to main
4. **Post-deployment**: Monitoring and validation

---

## Appendix

### Useful Commands

```bash
# Quick deployment
cd backend && npm run deploy:production

# View logs
wrangler tail --env production

# Check secrets
wrangler secret list --env production

# Database query
wrangler d1 execute protothrive-db --command "SELECT COUNT(*) FROM roadmaps" --env production

# Performance test
curl -w "@curl-format.txt" -o /dev/null -s https://backend-thermo-prod.ernijs-ansons.workers.dev/health
```

### Configuration Files

#### curl-format.txt
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

---

**Document Maintained By**: DevOps Team  
**Last Review**: September 23, 2025  
**Next Review**: December 23, 2025

**Thermonuclear Log**: Production runbook complete - Operational readiness 100%