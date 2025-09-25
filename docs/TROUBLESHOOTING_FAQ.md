# ProtoThrive Troubleshooting & FAQ

## Quick Reference

### Emergency Contacts
- **Production Issues**: ops@protothrive.com
- **Security Issues**: security@protothrive.com
- **Development Support**: dev@protothrive.com
- **Documentation**: docs@protothrive.com

### Status Pages
- **Main Service**: https://status.protothrive.com
- **Cloudflare Status**: https://www.cloudflarestatus.com
- **GitHub Status**: https://www.githubstatus.com

## Common Issues & Solutions

### 🔥 Critical Issues (Production Down)

#### Issue: 503 Service Unavailable
**Symptoms:** API returns 503 errors, frontend shows connection errors

**Immediate Actions:**
```bash
# Check Cloudflare Workers status
wrangler tail --env production

# Verify database connectivity
wrangler d1 execute protothrive-db --command "SELECT 1" --env production

# Check KV namespace
wrangler kv:key list --namespace-id YOUR_KV_ID
```

**Common Causes:**
1. **Cloudflare Workers deployment issues**
   ```bash
   # Rollback to previous deployment
   wrangler deployments list
   wrangler rollback [deployment-id]
   ```

2. **Database connection failures**
   ```bash
   # Check D1 database health
   wrangler d1 info protothrive-db --env production
   
   # Run health check migration
   wrangler d1 execute protothrive-db --command "CREATE TABLE IF NOT EXISTS health_check (id INTEGER PRIMARY KEY)" --env production
   ```

3. **Environment variable issues**
   ```bash
   # Verify secrets are set
   wrangler secret list --env production
   
   # Re-set critical secrets
   wrangler secret put JWT_SECRET --env production
   wrangler secret put OPENAI_API_KEY --env production
   ```

#### Issue: Database Corruption/Data Loss
**Symptoms:** Data inconsistencies, foreign key violations, missing records

**Immediate Actions:**
```bash
# Create emergency backup
wrangler d1 backup create protothrive-db --env production

# Check database integrity
wrangler d1 execute protothrive-db --command "PRAGMA integrity_check" --env production

# Restore from latest backup if needed
wrangler d1 backup list protothrive-db --env production
wrangler d1 backup restore protothrive-db [backup-id] --env production
```

### ⚠️ High Priority Issues

#### Issue: Authentication Failures (401/403 errors)
**Symptoms:** Users can't log in, API returns authentication errors

**Diagnosis:**
```bash
# Test JWT verification
curl -H "Authorization: Bearer YOUR_TEST_TOKEN" \
     https://your-api.workers.dev/health

# Check authentication endpoint
curl -X POST https://your-api.workers.dev/api/auth/validate \
     -H "Content-Type: application/json" \
     -d '{"token": "YOUR_TEST_TOKEN"}'
```

**Solutions:**
1. **JWT Secret mismatch**
   ```bash
   # Verify JWT_SECRET is set correctly
   wrangler secret list --env production
   wrangler secret put JWT_SECRET --env production
   ```

2. **Token expiration issues**
   ```typescript
   // Debug token in browser console
   const token = localStorage.getItem('authToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token expires:', new Date(payload.exp * 1000));
   console.log('Current time:', new Date());
   ```

3. **CORS configuration problems**
   ```bash
   # Check browser network tab for CORS errors
   # Verify allowed origins in deployment
   ```

#### Issue: Enterprise Agent Not Responding
**Symptoms:** Agent requests timeout, cost tracking not working

**Diagnosis:**
```bash
# Test agent connectivity
curl -X POST https://your-api.workers.dev/api/agent/health \
     -H "Authorization: Bearer YOUR_TOKEN"

# Check agent logs
docker-compose logs enterprise-agent

# Test direct agent endpoint
python -c "
from enterprise_agent import AgentOrchestrator
agent = AgentOrchestrator()
result = agent.run_mode('coding', 'test task')
print(result)
"
```

**Solutions:**
1. **Agent configuration issues**
   ```bash
   # Check agent config
   cat enterprise-agent/configs/agent_config_v3.4.yaml
   
   # Verify API keys
   echo $OPENAI_API_KEY | wc -c  # Should be >40 chars
   echo $ANTHROPIC_API_KEY | wc -c  # Should be >40 chars
   ```

2. **Model availability issues**
   ```python
   # Test model connectivity
   import openai
   client = openai.OpenAI(api_key="your-key")
   response = client.chat.completions.create(
       model="gpt-4-turbo",
       messages=[{"role": "user", "content": "test"}],
       max_tokens=5
   )
   print(response.choices[0].message.content)
   ```

### 🔧 Medium Priority Issues

#### Issue: Slow Response Times
**Symptoms:** API responses >2 seconds, UI feels sluggish

**Diagnosis:**
```bash
# Check response times
time curl https://your-api.workers.dev/health

# Monitor with detailed timing
curl -w "@curl-format.txt" https://your-api.workers.dev/api/roadmaps

# Create curl-format.txt:
echo '
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
' > curl-format.txt
```

**Solutions:**
1. **Database query optimization**
   ```sql
   -- Check query execution plans
   EXPLAIN QUERY PLAN SELECT * FROM roadmaps WHERE user_id = ? AND status = ?;
   
   -- Add missing indexes
   CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON roadmaps(user_id, status);
   ```

2. **KV cache implementation**
   ```typescript
   // Add caching to expensive operations
   const cacheKey = `roadmap:${userId}:${roadmapId}`;
   let roadmap = await KV.get(cacheKey);
   
   if (!roadmap) {
     roadmap = await database.queryRoadmap(roadmapId, userId);
     await KV.put(cacheKey, JSON.stringify(roadmap), { expirationTtl: 3600 });
   }
   ```

#### Issue: Frontend Build Failures
**Symptoms:** npm run build fails, deployment errors

**Common Solutions:**
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install

# Fix TypeScript errors
npm run type-check

# Check for dependency conflicts
npm ls --depth=0

# Build with verbose output
npm run build -- --debug

# Check memory usage during build
node --max-old-space-size=4096 node_modules/.bin/next build
```

#### Issue: Docker Container Issues
**Symptoms:** Containers won't start, port conflicts, volume mount errors

**Diagnosis:**
```bash
# Check container status
docker-compose ps
docker-compose logs [service-name]

# Check resource usage
docker stats
docker system df

# Test individual containers
docker run -it --rm [image-name] /bin/sh
```

**Solutions:**
```bash
# Restart all services
docker-compose down
docker-compose up -d

# Rebuild containers
docker-compose build --no-cache
docker-compose up -d

# Clean up Docker resources
docker system prune -a
docker volume prune
```

## Development Issues

### Issue: Hot Reload Not Working
**Solutions:**
```bash
# Next.js hot reload issues
rm -rf .next
npm run dev

# Check file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Docker hot reload
# Add to docker-compose.yml:
volumes:
  - ./src:/app/src
  - /app/node_modules
```

### Issue: Environment Variables Not Loading
**Solutions:**
```bash
# Check .env file location and format
ls -la .env*
cat .env.local

# Verify Next.js env loading
# Variables must start with NEXT_PUBLIC_ for client-side
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" >> .env.local

# Check backend environment
wrangler dev --local --var ENVIRONMENT=development
```

### Issue: TypeScript Compilation Errors
**Solutions:**
```bash
# Update TypeScript and types
npm update typescript @types/node @types/react @types/react-dom

# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --build --clean

# Check for conflicting versions
npm ls typescript
```

## Database Issues

### Issue: Migration Failures
**Symptoms:** Migration scripts fail, database schema out of sync

**Solutions:**
```bash
# Check current schema
wrangler d1 execute protothrive-db --command ".schema" --env production

# Manual migration rollback
wrangler d1 execute protothrive-db --file=migrations/rollback.sql --env production

# Force migration (caution!)
wrangler d1 execute protothrive-db --command "DROP TABLE IF EXISTS migration_lock" --env production

# Recreate from scratch (development only)
wrangler d1 delete protothrive-db --env development
wrangler d1 create protothrive-db
```

### Issue: Data Consistency Problems
**Symptoms:** Orphaned records, foreign key violations

**Diagnosis:**
```sql
-- Check for orphaned roadmaps
SELECT r.id, r.user_id FROM roadmaps r 
LEFT JOIN users u ON r.user_id = u.id 
WHERE u.id IS NULL;

-- Check foreign key violations
PRAGMA foreign_key_check;

-- Check database integrity
PRAGMA integrity_check;
```

**Solutions:**
```sql
-- Clean up orphaned records (careful!)
DELETE FROM roadmaps WHERE user_id NOT IN (SELECT id FROM users);

-- Re-enable foreign keys if disabled
PRAGMA foreign_keys = ON;

-- Rebuild indexes
REINDEX;
```

## Performance Issues

### Issue: High Memory Usage
**Symptoms:** Out of memory errors, slow garbage collection

**Diagnosis:**
```bash
# Node.js memory usage
node --expose-gc --inspect app.js

# Monitor in browser DevTools or:
node -e "
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(\`Memory: \${Math.round(mem.rss/1024/1024)}MB\`);
}, 1000);
"

# Docker memory limits
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

**Solutions:**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 server.js

# Add to package.json scripts:
"dev": "node --max-old-space-size=4096 node_modules/.bin/next dev"

# Docker memory limits
version: '3.8'
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Issue: High Database Load
**Symptoms:** Slow queries, connection timeouts

**Solutions:**
```sql
-- Add missing indexes based on query patterns
CREATE INDEX idx_roadmaps_user_updated ON roadmaps(user_id, updated_at DESC);
CREATE INDEX idx_agent_logs_roadmap_timestamp ON agent_logs(roadmap_id, timestamp DESC);

-- Optimize slow queries
-- Instead of:
SELECT * FROM roadmaps WHERE json_graph LIKE '%search_term%';

-- Use:
CREATE VIRTUAL TABLE roadmaps_fts USING fts5(id, content);
INSERT INTO roadmaps_fts SELECT id, json_graph FROM roadmaps;
SELECT * FROM roadmaps_fts WHERE content MATCH 'search_term';
```

## Security Issues

### Issue: CORS Errors
**Symptoms:** Browser blocks requests, preflight failures

**Solutions:**
```typescript
// Backend CORS configuration
app.use('*', cors({
  origin: (origin) => {
    const allowed = process.env.NODE_ENV === 'production' 
      ? ['https://protothrive.com', 'https://app.protothrive.com']
      : ['http://localhost:3000', 'http://localhost:5000'];
    return allowed.includes(origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
```

### Issue: JWT Token Issues
**Symptoms:** Token validation fails, expired tokens

**Debug:**
```javascript
// Browser console debugging
const token = localStorage.getItem('authToken');
if (token) {
  const parts = token.split('.');
  const header = JSON.parse(atob(parts[0]));
  const payload = JSON.parse(atob(parts[1]));
  console.log('Header:', header);
  console.log('Payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
  console.log('Issued:', new Date(payload.iat * 1000));
}
```

**Solutions:**
```typescript
// Implement token refresh
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (response.ok) {
    const { accessToken } = await response.json();
    localStorage.setItem('authToken', accessToken);
  }
}
```

## Monitoring & Alerts

### Setting Up Monitoring
```bash
# Health check script
#!/bin/bash
ENDPOINTS=(
  "https://your-api.workers.dev/health"
  "https://your-frontend.pages.dev"
)

for endpoint in "${ENDPOINTS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [ "$status" -ne 200 ]; then
    echo "Alert: $endpoint returned $status"
    # Send notification
  fi
done
```

### Log Analysis
```bash
# Parse Cloudflare logs
wrangler tail --env production | grep ERROR

# Analyze common errors
wrangler tail --env production | jq -r '.logs[] | select(.level == "error") | .message' | sort | uniq -c

# Monitor specific endpoints
wrangler tail --env production | grep '/api/roadmaps' | tail -20
```

## Frequently Asked Questions

### Q: How do I reset my development environment?
```bash
# Complete reset
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install
npm run dev

# Database reset
wrangler d1 delete protothrive-db --env development
wrangler d1 create protothrive-db
wrangler d1 execute protothrive-db --file=migrations/001_init.sql --env development
```

### Q: How do I debug production issues without downtime?
```bash
# Enable debug logs temporarily
wrangler secret put DEBUG_MODE true --env production

# Use staging environment for testing
wrangler deploy --env staging
# Test fixes in staging first

# Rollback if needed
wrangler deployments list --env production
wrangler rollback [deployment-id] --env production
```

### Q: How do I handle database migrations in production?
```bash
# 1. Test migration in staging
wrangler d1 execute protothrive-db --file=migrations/new_migration.sql --env staging

# 2. Create backup
wrangler d1 backup create protothrive-db --env production

# 3. Apply migration during low traffic
wrangler d1 execute protothrive-db --file=migrations/new_migration.sql --env production

# 4. Verify migration success
wrangler d1 execute protothrive-db --command "SELECT COUNT(*) FROM new_table" --env production
```

### Q: What should I do if costs are exceeding budget?
```bash
# Check current usage
wrangler analytics dashboard

# Implement cost controls
# Add to worker:
if (totalCost > BUDGET_LIMIT) {
  throw new Error('BUDGET-429: Daily budget exceeded');
}

# Optimize expensive operations
# Cache frequently accessed data
# Reduce API calls to external services
# Optimize database queries
```

### Q: How do I scale for high traffic?
```bash
# Cloudflare Workers auto-scale, but optimize:

# 1. Implement caching
const cached = await KV.get(`cache:${key}`);
if (cached) return JSON.parse(cached);

# 2. Use database read replicas
const readOnlyDb = c.env.READ_DB || c.env.DB;

# 3. Implement request queuing for expensive operations
const queue = await KV.get('processing_queue') || [];
if (queue.length > MAX_QUEUE_SIZE) {
  return c.json({ error: 'System busy, try again later' }, 503);
}
```

### Q: How do I troubleshoot Enterprise Agent issues?
```python
# Test agent locally
cd enterprise-agent
python -c "
from src.agent_orchestrator import AgentOrchestrator
agent = AgentOrchestrator()
result = agent.run_mode('coding', 'Hello world function')
print('Status:', result.get('confidence', 0))
print('Output:', result.get('code', 'None'))
"

# Check configuration
python -c "
import yaml
with open('configs/agent_config_v3.4.yaml') as f:
    config = yaml.safe_load(f)
print('Models configured:', config.get('models', {}))
"

# Test API connections
python -c "
import os
import openai
client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
response = client.chat.completions.create(
    model='gpt-4-turbo',
    messages=[{'role': 'user', 'content': 'test'}],
    max_tokens=5
)
print('OpenAI API working:', response.choices[0].message.content)
"
```

## Emergency Procedures

### Production Outage Response
1. **Acknowledge the incident** (< 5 minutes)
2. **Assess impact and scope** (< 10 minutes)
3. **Implement immediate fix or rollback** (< 30 minutes)
4. **Communicate status updates** (every 15 minutes)
5. **Conduct post-incident review** (within 24 hours)

### Data Loss Recovery
1. **Stop all write operations immediately**
2. **Identify backup source and timestamp**
3. **Create new environment for restoration**
4. **Test restoration before switching traffic**
5. **Document data loss scope and impact**

### Security Incident Response
1. **Isolate affected systems**
2. **Preserve evidence and logs**
3. **Notify security team immediately**
4. **Reset compromised credentials**
5. **Monitor for ongoing threats**

Remember: When in doubt, escalate to the appropriate team. It's better to over-communicate than to let issues go unresolved.