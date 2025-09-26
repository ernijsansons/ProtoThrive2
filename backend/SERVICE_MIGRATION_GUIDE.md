# Service Migration Guide: From Mocks to Real Integrations

This guide helps developers migrate ProtoThrive2 from mock service implementations to real integrations using the new service architecture.

## Overview

The new service architecture replaces hard-coded mock implementations with:
- **Real service integrations** with proper error handling
- **Dependency injection** for testability and flexibility
- **Comprehensive monitoring** and observability
- **Budget management** with cost tracking
- **Kill-switch control** for emergency operations

## Architecture Changes

### Before: Direct Mock Usage
```javascript
// Old approach - direct mock calls
const mockFetch = (url, opts) => ({ ok: true, json: async () => ({ success: true }) });
const checkKillSwitch = async () => false;
const checkBudget = (cost) => cost < 0.10;
```

### After: Service-Based Architecture
```typescript
// New approach - dependency injection
class RoadmapRoutes {
  constructor(
    private budgetService: IBudgetService,
    private killSwitchService: IKillSwitchService,
    private aiExecutor: IAIExecutor
  ) {}

  async createRoadmap(request: Request, userId: string) {
    const budgetCheck = await this.budgetService.checkBudget(cost, userId);
    // Real implementation with proper error handling
  }
}
```

## Migration Steps

### 1. Replace Worker Entry Point

**Replace** `backend/src/worker.js` with the new enhanced worker:

```typescript
// backend/src/enhanced-worker.ts
import { ServiceContainer, configureProductionServices } from './services/container';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const container = new ServiceContainer();
    configureProductionServices(container, env);
    // Service-based request handling
  }
};
```

### 2. Update Package Dependencies

Add required dependencies to `package.json`:

```bash
npm install --save zod
npm install --save-dev @types/node typescript ts-node
```

### 3. Environment Configuration

Update your environment variables:

```bash
# Required for production services
CLAUDE_API_KEY=sk-ant-your-key
KIMI_API_KEY=your-kimi-key
UXPILOT_API_KEY=your-uxpilot-key
ENVIRONMENT=production

# Database bindings (configured in wrangler.toml)
# DB - D1 database binding
# KV - KV namespace binding
```

### 4. Database Schema Updates

Add new tables for service functionality:

```sql
-- Add to your existing schema
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  task_type TEXT,
  model_used TEXT,
  token_count INTEGER,
  cost REAL,
  status TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
  id TEXT PRIMARY KEY,
  service TEXT,
  method TEXT,
  error TEXT,
  context TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  count INTEGER DEFAULT 1,
  tags TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_agent_logs_user_time ON agent_logs(user_id, timestamp);
CREATE INDEX idx_audit_logs_action_time ON audit_logs(action, timestamp);
CREATE INDEX idx_error_logs_service_time ON error_logs(service, timestamp);
CREATE INDEX idx_metrics_name_time ON metrics(name, timestamp);
```

## Service Configuration

### Production Configuration

```typescript
// Configure real services for production
export function configureProductionServices(container: IServiceContainer, env: any) {
  container.registerSingleton(SERVICE_TOKENS.BUDGET, (c) => new BudgetService(env));
  container.registerSingleton(SERVICE_TOKENS.KILL_SWITCH, (c) => new KillSwitchService(env));
  container.registerSingleton(SERVICE_TOKENS.AI_EXECUTOR, (c) => new AIExecutorService(env));
  container.registerSingleton(SERVICE_TOKENS.MONITORING, (c) => new MonitoringService(env));
}
```

### Test Configuration

```typescript
// Configure mock services for testing
export function configureTestServices(container: IServiceContainer, env?: any) {
  container.registerSingleton(SERVICE_TOKENS.BUDGET, (c) => new MockBudgetService());
  container.registerSingleton(SERVICE_TOKENS.KILL_SWITCH, (c) => new MockKillSwitchService());
  container.registerSingleton(SERVICE_TOKENS.AI_EXECUTOR, (c) => new MockAIExecutorService());
}
```

## Usage Examples

### Budget Service Usage

```typescript
// Check if task can proceed within budget
const budgetCheck = await budgetService.checkBudget(estimatedCost, userId);
if (!budgetCheck.allowed) {
  return errorResponse('Budget exceeded', 402);
}

// Record actual cost after task completion
await budgetService.recordCost(actualCost, userId, {
  taskType: 'roadmap_analysis',
  model: 'claude',
  tokenCount: 150
});
```

### Kill-Switch Service Usage

```typescript
// Check if operations should be paused
const killStatus = await killSwitchService.checkStatus();
if (killStatus.active) {
  return errorResponse('System paused: ' + killStatus.reason, 503);
}

// Admin: Activate kill switch
await killSwitchService.activate('Maintenance window', 3600); // 1 hour

// Subscribe to status changes
const unsubscribe = killSwitchService.subscribe((status) => {
  console.log('Kill switch status changed:', status);
});
```

### AI Executor Service Usage

```typescript
// Execute AI task with automatic model selection
const result = await aiExecutor.execute({
  type: 'code',
  prompt: 'Generate a React component',
  context: { framework: 'react', style: 'modern' }
}, {
  timeout: 30000,
  costLimit: budgetRemaining,
  callback: (progress) => console.log('Progress:', progress)
});

// Execute multiple tasks in parallel
const results = await aiExecutor.executeBatch(tasks, { timeout: 60000 });
```

### Monitoring Service Usage

```typescript
// Record custom metrics
await monitoringService.recordMetric({
  name: 'roadmap.created',
  value: 1,
  type: 'counter',
  tags: { userId, vibeMode: 'true' }
});

// Record errors with context
await monitoringService.recordError(error, {
  userId,
  endpoint: 'create_roadmap',
  metadata: { severity: 'high' }
});

// Performance tracing
const trace = monitoringService.startTrace('create_roadmap');
try {
  // ... operation code ...
  trace.recordEvent('validation_complete');
} finally {
  trace.end(); // Automatically records timing
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('RoadmapRoutes', () => {
  let container: ServiceContainer;
  let roadmapRoutes: RoadmapRoutes;

  beforeEach(() => {
    container = new ServiceContainer();
    configureTestServices(container); // Use mocks
    roadmapRoutes = new RoadmapRoutes(container, {});
  });

  it('should create roadmap within budget', async () => {
    const request = new Request('/', {
      method: 'POST',
      body: JSON.stringify({ json_graph: {}, vibe_mode: true })
    });

    const response = await roadmapRoutes.createRoadmap(request, 'user-123');
    expect(response.status).toBe(201);
  });
});
```

### Integration Tests

```typescript
describe('Service Integration', () => {
  it('should enforce budget limits', async () => {
    const container = new ServiceContainer();
    configureProductionServices(container, testEnv);

    const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);

    // Test real budget enforcement
    const result = await budgetService.checkBudget(0.20, 'test-user');
    expect(result.allowed).toBe(false);
  });
});
```

## Deployment Considerations

### Gradual Rollout

1. **Development**: Deploy with `ENVIRONMENT=test` to use mocks
2. **Staging**: Deploy with real API keys but limited budget
3. **Production**: Full deployment with monitoring alerts

### Monitoring Setup

```typescript
// Set up health check monitoring
const healthStatus = await monitoringService.getHealthStatus();
if (healthStatus.overall !== 'healthy') {
  // Alert operations team
}

// Monitor key metrics
await monitoringService.recordMetric({
  name: 'service.uptime',
  value: Date.now() - serviceStartTime,
  type: 'gauge'
});
```

### Error Handling

```typescript
try {
  const result = await aiExecutor.execute(task);
} catch (error) {
  // Automatic error recording
  await monitoringService.recordError(error, { taskId: task.id });

  // Graceful degradation
  return fallbackResponse();
}
```

## Troubleshooting

### Common Issues

1. **Service Not Found Error**
   - Ensure services are registered in container
   - Check SERVICE_TOKENS match between registration and resolution

2. **Budget Service Failing**
   - Verify D1 database connection
   - Check agent_logs table exists
   - Validate KV namespace binding

3. **Kill Switch Not Working**
   - Verify KV namespace is configured
   - Check `proto_paused` key in KV store
   - Ensure polling is enabled

4. **AI Executor Timeouts**
   - Verify API keys are valid
   - Check network connectivity to AI services
   - Monitor service quotas and rate limits

### Debug Commands

```bash
# Check service health
curl https://your-worker.dev/health

# Activate kill switch (admin only)
curl -X POST https://your-worker.dev/api/admin/kill-switch \
  -H "Authorization: Bearer admin-token" \
  -d '{"reason": "Testing", "duration": 300}'

# Check budget status
curl https://your-worker.dev/api/budget/status \
  -H "Authorization: Bearer user-token"
```

## Benefits of New Architecture

1. **Testability**: Easy to swap real services with mocks
2. **Maintainability**: Clear separation of concerns
3. **Observability**: Comprehensive monitoring and tracing
4. **Reliability**: Proper error handling and circuit breakers
5. **Scalability**: Service-based architecture supports growth
6. **Cost Control**: Built-in budget management and alerts

## Next Steps

1. **Deploy** the new architecture to development environment
2. **Run tests** to ensure functionality works correctly
3. **Configure monitoring** alerts for production deployment
4. **Gradually migrate** from development to staging to production
5. **Monitor metrics** and optimize service performance

For questions or issues, refer to the service interfaces documentation or contact the development team.