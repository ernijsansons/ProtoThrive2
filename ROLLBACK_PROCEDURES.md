# ProtoThrive Emergency Rollback Procedures

**Ref: CLAUDE.md Thermonuclear Master Control - Section 12**  
**Date: September 23, 2025**  
**Classification: CRITICAL OPERATIONS**

## Emergency Response Protocol

### Immediate Response Checklist
- [ ] Identify severity level (P0/P1/P2)
- [ ] Activate kill-switch if P0 incident
- [ ] Document incident details
- [ ] Execute appropriate rollback procedure
- [ ] Verify system recovery
- [ ] Update stakeholders

## Kill-Switch Activation (P0 Incidents)

### When to Activate
- Complete system failure
- Security breach detected  
- Data corruption confirmed
- Service unavailable > 5 minutes

### Kill-Switch Procedure
1. **Immediate Action**:
   ```bash
   # Via Cloudflare KV Dashboard
   KEY: proto_paused
   VALUE: true
   REASON: [Critical incident description]
   ```

2. **Verification**:
   - All agents halt operations immediately
   - Maintenance page displays to users
   - Backend stops processing requests
   - Database writes are paused

3. **Notification**:
   - Slack: `#hitl-thermo` channel
   - Email: ops@protothrive.com
   - Message: "KILL SWITCH ACTIVATED - [Reason]"

## Frontend Rollback Procedures

### Cloudflare Pages Rollback (2-5 minutes)

**Scenario**: Frontend deployment causes critical issues

1. **Access Dashboard**:
   - Navigate to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to Workers & Pages → Pages
   - Select `protothrive-frontend-production`

2. **Execute Rollback**:
   - Click **"Deployments"** tab
   - Find last known good deployment
   - Click **"Rollback"** next to working version
   - Confirm rollback (takes ~30 seconds)

3. **Verification**:
   - Test homepage: `https://protothrive-frontend-production.pages.dev`
   - Verify API connectivity
   - Check core functionality

### Manual Asset Restoration (5-10 minutes)

**Scenario**: Pages rollback unavailable

1. **Backup Assets**:
   ```bash
   cd C:\Users\ernij\OneDrive\Documents\ProtoThrive2\frontend
   # Use last known good build from .next-backup/
   ```

2. **Upload Previous Version**:
   - Delete current Pages deployment
   - Re-upload backed-up assets
   - Configure environment variables

## Backend Rollback Procedures

### Worker Script Rollback (1-3 minutes)

**Scenario**: Backend deployment causes API failures

1. **Via Cloudflare Dashboard**:
   - Workers & Pages → Workers
   - Select `backend-thermo-staging`
   - Click **"Deployments"** tab
   - Rollback to previous working version

2. **Via Wrangler CLI**:
   ```bash
   cd C:\Users\ernij\OneDrive\Documents\ProtoThrive2\backend
   git checkout [previous-commit-hash]
   wrangler deploy --env staging
   ```

3. **Verification**:
   ```bash
   curl https://backend-thermo-staging.ernijs-ansons.workers.dev/health
   # Expected: {"status": "operational"}
   ```

### Environment Variables Restoration

**Scenario**: Configuration changes cause failures

1. **Access Variables**:
   - Cloudflare Dashboard → Workers → Settings
   - Environment Variables tab

2. **Restore Previous Config**:
   ```bash
   # Revert to known good values:
   ENVIRONMENT=staging
   AGENT_MODE=fallback
   AGENT_BUDGET_DEFAULT=0.40
   ```

## Database Rollback Procedures

### ⚠️ CRITICAL: Database rollbacks are destructive

### D1 Data Restoration (10-20 minutes)

**Scenario**: Data corruption or bad migration

1. **Create Emergency Backup**:
   ```bash
   cd C:\Users\ernij\OneDrive\Documents\ProtoThrive2\backend
   wrangler d1 backup create protothrive-db --name=emergency-backup-$(date +%s)
   ```

2. **Export Current Data** (if possible):
   ```bash
   wrangler d1 execute protothrive-db --remote --command="SELECT * FROM users;" > users_backup.json
   wrangler d1 execute protothrive-db --remote --command="SELECT * FROM roadmaps;" > roadmaps_backup.json
   ```

3. **Drop Problematic Schema**:
   ```bash
   wrangler d1 execute protothrive-db --remote --command="DROP TABLE IF EXISTS insights;"
   wrangler d1 execute protothrive-db --remote --command="DROP TABLE IF EXISTS agent_logs;"
   wrangler d1 execute protothrive-db --remote --command="DROP TABLE IF EXISTS roadmaps;"
   wrangler d1 execute protothrive-db --remote --command="DROP TABLE IF EXISTS users;"
   ```

4. **Restore Previous Schema**:
   ```bash
   # Use last known good migration
   wrangler d1 execute protothrive-db --remote --file=migrations/001_production_safe.sql
   ```

### Point-in-Time Recovery

**If Cloudflare provides PITR**:
1. Contact Cloudflare support
2. Request restoration to specific timestamp
3. Provide incident details and timeline

## Monitoring & Alerting Rollback

### Disable False Alarms

**Scenario**: Rollback triggers monitoring alerts

1. **Temporary Alert Suppression**:
   - Datadog: Mute alerts for 30 minutes
   - Sentry: Disable error tracking temporarily
   - Custom monitors: Comment out checks

2. **Update Monitoring**:
   ```bash
   # Update expected endpoints
   HEALTH_ENDPOINT=https://backend-thermo-staging.ernijs-ansons.workers.dev/health
   FRONTEND_ENDPOINT=https://protothrive-frontend-production.pages.dev
   ```

## Communication Templates

### Internal Notification (Slack #hitl-thermo)
```
🚨 ROLLBACK EXECUTED - [Timestamp]
Issue: [Brief description]
Action: Rolled back to [version/timestamp]
Status: [In Progress/Completed/Verified]
ETA: [Expected resolution time]
Next: [Required actions]
```

### User-Facing Communication
```
📢 ProtoThrive Status Update
We've identified and resolved a technical issue that briefly affected service.
System Status: Operational
Impact: [Minimal/Partial/Full service restored]
Duration: [X minutes of downtime]
Next Steps: Service monitoring continues
```

## Post-Rollback Verification

### System Health Checklist
- [ ] Frontend homepage loads (< 3 seconds)
- [ ] Backend API responds (`/health` returns 200)
- [ ] Database queries execute successfully
- [ ] Authentication flows work
- [ ] Core features functional
- [ ] Error rates within normal ranges
- [ ] Performance metrics restored

### Recovery Validation Commands
```bash
# Frontend
curl -I https://protothrive-frontend-production.pages.dev/
# Should return: HTTP/2 200

# Backend Health
curl https://backend-thermo-staging.ernijs-ansons.workers.dev/health
# Expected: {"status": "operational", "version": "1.0.0"}

# Database Test
curl -X POST https://backend-thermo-staging.ernijs-ansons.workers.dev/api/roadmaps \
  -H "Content-Type: application/json" \
  -d '{"test": "rollback_verification"}'
# Should return successful response
```

## Lessons Learned Protocol

### Post-Incident Analysis (Within 24 hours)
1. **Root Cause Analysis**:
   - Timeline of events
   - Technical failure points
   - Process breakdowns

2. **Impact Assessment**:
   - Downtime duration
   - Users affected
   - Data loss (if any)

3. **Prevention Measures**:
   - Additional monitoring
   - Process improvements
   - Technical safeguards

### Documentation Updates
- Update CLAUDE.md with lessons learned
- Revise deployment procedures
- Enhance monitoring coverage
- Improve rollback automation

## Emergency Contacts

### Technical Escalation
- **Primary**: ernijs-ansons (immediate response)
- **Cloudflare Support**: Enterprise plan required for P0 support
- **Database Issues**: D1 engineering via support ticket

### Business Escalation
- **Operations**: ops@protothrive.com
- **Management**: cto@protothrive.com
- **Legal**: legal@protothrive.com (for security incidents)

## Rollback Success Criteria

Rollback is considered successful when:
- ✅ All systems operational
- ✅ User traffic restored
- ✅ Error rates normal
- ✅ Performance within SLA
- ✅ No data corruption
- ✅ Monitoring alerts cleared

## Recovery Time Objectives (RTO)

- **P0 (Critical)**: < 5 minutes (kill-switch)
- **P1 (High)**: < 15 minutes (automated rollback)
- **P2 (Medium)**: < 60 minutes (manual procedures)
- **P3 (Low)**: < 4 hours (next business day)

**Thermonuclear Protocol**: In P0 scenarios, all systems immediately halt via kill-switch. Recovery procedures prioritize data integrity over service availability.

**Reference**: CLAUDE.md Section 12 (Autonomy/Safety) and Global Governance