# ProtoThrive2 Service Architecture

This directory contains the new service-based architecture that replaces hard-coded mock implementations with real integrations and proper dependency injection.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Worker                          │
├─────────────────────────────────────────────────────────────┤
│                Service Container (DI)                       │
├─────────────────────────────────────────────────────────────┤
│  Budget │ Kill-Switch │ AI Executor │ Monitoring │ Routes   │
│ Service │   Service   │   Service   │  Service   │          │
├─────────────────────────────────────────────────────────────┤
│           Database (D1) │ Cache (KV) │ External APIs        │
└─────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. BudgetService
- **Purpose**: Cost tracking and budget enforcement
- **Features**:
  - Per-user budget limits
  - Real-time cost tracking
  - Automatic alerts
  - Database persistence
  - KV caching for performance

### 2. KillSwitchService
- **Purpose**: Emergency system control
- **Features**:
  - Global operation pause/resume
  - Timed activations
  - Real-time status broadcasting
  - Audit logging
  - Admin controls

### 3. AIExecutorService
- **Purpose**: AI model orchestration
- **Features**:
  - Multi-model support (Claude, Kimi, UXPilot)
  - Automatic model selection
  - Retry logic with fallbacks
  - Batch processing
  - Cost estimation and tracking
  - Real-time progress updates

### 4. MonitoringService
- **Purpose**: System observability
- **Features**:
  - Metrics collection and aggregation
  - Error tracking and alerting
  - Performance tracing
  - Health checks
  - Real-time dashboards

## File Structure

```
src/services/
├── interfaces.ts              # Service interfaces and types
├── container.ts              # Dependency injection container
├── budget.service.ts         # Budget management implementation
├── killswitch.service.ts     # Kill-switch control implementation
├── ai-executor.service.ts    # AI orchestration implementation
├── monitoring.service.ts     # Monitoring and metrics implementation
├── mocks/                    # Mock implementations for testing
│   ├── mock-budget.service.ts
│   ├── mock-killswitch.service.ts
│   └── mock-ai-executor.service.ts
└── README.md                # This file
```

## Key Benefits

### 1. Testability
- Easy switching between real and mock implementations
- Comprehensive test coverage with isolated unit tests
- Integration tests with real service behavior

### 2. Maintainability
- Clear separation of concerns
- Interface-based design for easy refactoring
- Standardized error handling patterns

### 3. Reliability
- Proper timeout and retry logic
- Circuit breaker patterns for external services
- Graceful degradation on failures

### 4. Observability
- Comprehensive metrics and logging
- Distributed tracing for complex operations
- Real-time health monitoring

### 5. Cost Control
- Built-in budget management
- Real-time cost tracking
- Automatic alerts and limits

## Usage Examples

### Basic Service Resolution

```typescript
// Get services from container
const container = new ServiceContainer();
configureProductionServices(container, env);

const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
const killSwitchService = container.resolve<IKillSwitchService>(SERVICE_TOKENS.KILL_SWITCH);
```

### Route Handler with Services

```typescript
class MyRoutes {
  constructor(private container: IServiceContainer) {}

  async handleRequest(request: Request, userId: string): Promise<Response> {
    const trace = this.monitoringService.startTrace('handle_request');

    try {
      // Check kill switch
      const killStatus = await this.killSwitchService.checkStatus();
      if (killStatus.active) {
        return new Response('System paused', { status: 503 });
      }

      // Check budget
      const budgetCheck = await this.budgetService.checkBudget(0.01, userId);
      if (!budgetCheck.allowed) {
        return new Response('Budget exceeded', { status: 402 });
      }

      // Process request
      const result = await this.processRequest(request);

      // Record actual cost
      await this.budgetService.recordCost(result.cost, userId);

      return new Response(JSON.stringify(result));
    } finally {
      trace.end();
    }
  }
}
```

### AI Task Execution

```typescript
const aiExecutor = container.resolve<IAIExecutor>(SERVICE_TOKENS.AI_EXECUTOR);

const result = await aiExecutor.execute({
  type: 'code',
  prompt: 'Generate a React component for user authentication',
  context: { framework: 'react', typescript: true }
}, {
  timeout: 30000,
  costLimit: 0.05,
  callback: (progress) => console.log('Progress:', progress.status, progress.progress + '%')
});

console.log('Generated code:', result.output);
console.log('Cost:', result.cost, 'Model:', result.model);
```

## Configuration

### Environment Variables

```bash
# Production API Keys
CLAUDE_API_KEY=sk-ant-your-key
KIMI_API_KEY=your-kimi-key
UXPILOT_API_KEY=your-uxpilot-key

# Service Configuration
ENVIRONMENT=production
DEFAULT_BUDGET_LIMIT=0.10
KILL_SWITCH_POLL_INTERVAL=5000

# Monitoring
ENABLE_METRICS=true
METRICS_FLUSH_INTERVAL=10000
```

### Wrangler Configuration

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "protothrive"
database_id = "your-d1-id"

[[ kv_namespaces ]]
binding = "KV"
id = "your-kv-id"
```

## Testing

### Unit Tests

```typescript
describe('BudgetService', () => {
  it('should enforce budget limits', async () => {
    const container = new ServiceContainer();
    configureTestServices(container); // Uses mocks

    const budgetService = container.resolve<IBudgetService>(SERVICE_TOKENS.BUDGET);
    const result = await budgetService.checkBudget(1.0, 'test-user');

    expect(result.allowed).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Full Integration', () => {
  it('should handle complete request flow', async () => {
    const container = new ServiceContainer();
    configureProductionServices(container, testEnv); // Real services

    const routes = new RoadmapRoutes(container, testEnv);
    const response = await routes.createRoadmap(request, 'test-user');

    expect(response.status).toBe(201);
  });
});
```

## Monitoring and Alerts

### Key Metrics

- `requests.count` - Total requests processed
- `requests.blocked_by_killswitch` - Requests blocked by kill switch
- `budget.exceeded` - Budget limit violations
- `ai.tasks.completed` - Successful AI task completions
- `errors.count` - Error occurrences by type

### Health Checks

```typescript
const healthStatus = await monitoringService.getHealthStatus();
// Returns:
// {
//   overall: 'healthy' | 'degraded' | 'unhealthy',
//   services: { database: {...}, cache: {...}, ai: {...} },
//   metrics: { requestRate: 10.5, errorRate: 0.01, ... }
// }
```

## Migration Path

1. **Phase 1**: Deploy alongside existing mock system
2. **Phase 2**: Route percentage of traffic to new services
3. **Phase 3**: Full migration with monitoring
4. **Phase 4**: Remove old mock implementations

See [SERVICE_MIGRATION_GUIDE.md](../SERVICE_MIGRATION_GUIDE.md) for detailed migration instructions.

## Contributing

### Adding New Services

1. Define interface in `interfaces.ts`
2. Create implementation file
3. Add to service container configuration
4. Create mock implementation for testing
5. Add comprehensive tests
6. Update documentation

### Best Practices

- Always use interfaces for service contracts
- Implement comprehensive error handling
- Add monitoring and metrics
- Write both unit and integration tests
- Document configuration requirements
- Follow dependency injection patterns

## Support

For questions or issues:
1. Check the migration guide
2. Review test examples
3. Examine existing service implementations
4. Contact the development team