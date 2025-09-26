# ProtoThrive Observability Package

Enterprise-grade observability toolkit for Node.js applications with structured logging, Prometheus metrics, and comprehensive health checks.

## Installation

```bash
npm install @protothrive/observability
```

## Quick Start

```typescript
import { Observability } from '@protothrive/observability';

// Initialize observability
const obs = Observability.initialize({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'production'
});

// Log structured data
obs.logger.info('Service started', { port: 3000, env: 'production' });

// Record metrics
obs.metrics?.recordHttpRequest('GET', '/api/users', 200, 150);

// Add health checks
obs.health?.addCheck('database', async () => {
  // Your health check logic
  return { name: 'database', status: 'pass', message: 'Connected' };
});
```

## Features

### 🏗️ Structured Logging
- JSON output for production, human-readable for development
- Automatic data sanitization (removes passwords, tokens, secrets)
- Request correlation and tracing
- Multi-environment log level configuration

### 📊 Prometheus Metrics
- HTTP request/response metrics
- Business operation tracking
- AI/ML inference metrics
- Custom counter, gauge, histogram, and summary metrics

### 🏥 Health Monitoring
- Comprehensive health check framework
- Dependency monitoring (database, Redis, external APIs)
- Kubernetes-compatible endpoints (/health/live, /health/ready)
- Automatic service health scoring

### 🚨 Error Tracking
- Structured error logging with context
- Automatic error classification and HTTP status mapping
- Error metrics and alerting
- Request correlation for debugging

## API Reference

### Logger

```typescript
// Basic logging
obs.logger.debug('Debug message', { userId: '123' });
obs.logger.info('Info message', { action: 'user_created' });
obs.logger.warn('Warning message', { threshold: 'exceeded' });
obs.logger.error('Error message', error, { context: 'payment_processing' });

// Specialized logging
obs.logger.request(req, res, duration); // HTTP request logging
obs.logger.metric('response_time', 150, 'ms', { endpoint: '/api/users' });
obs.logger.audit('user_login', userId, { ip: '192.168.1.1' });

// Child logger with context
const userLogger = obs.logger.child({ userId: '123', sessionId: 'abc' });
userLogger.info('User action performed');
```

### Metrics

```typescript
// HTTP metrics (automatic with middleware)
obs.metrics?.recordHttpRequest('POST', '/api/users', 201, 250);

// Business metrics
obs.metrics?.recordBusinessOperation('user_registration', true);
obs.metrics?.recordAiUsage('gpt-4', 'code_generation', 150, 2000, 0.003);

// Custom metrics
const counter = obs.metrics?.createCounter({
  name: 'custom_operations_total',
  help: 'Total custom operations',
  labelNames: ['operation', 'status']
});

const gauge = obs.metrics?.createGauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Export metrics
const metricsText = await obs.metrics?.getMetrics(); // Prometheus format
const metricsJson = await obs.metrics?.getMetricsJson(); // JSON format
```

### Health Checks

```typescript
// Add custom health check
obs.health?.addCheck('database', async () => {
  try {
    await database.ping();
    return {
      name: 'database',
      status: 'pass',
      message: 'Database is responsive',
      responseTime: 45
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      message: error.message
    };
  }
});

// Pre-built health checks
obs.health?.addCheck('redis', HealthChecker.createRedisCheck(redisClient));
obs.health?.addCheck('api', HealthChecker.createExternalServiceCheck('external-api', 'https://api.external.com/health'));

// Get health status
const health = await obs.health?.getHealth();
```

### Middleware Integration

#### Express

```typescript
import express from 'express';

const app = express();

// Request logging middleware
app.use(obs.requestLogger());

// Health endpoints
app.get('/health', obs.healthHandler.bind(obs));
app.get('/metrics', obs.metricsHandler.bind(obs));

// Error handling middleware
app.use(obs.errorHandler());
```

#### Hono (Cloudflare Workers)

```typescript
import { Hono } from 'hono';

const app = new Hono();

// Request logging middleware
app.use('*', obs.honoRequestLogger());

// Health endpoints
app.get('/health', async (c) => {
  const health = await obs.health?.getHealth();
  return c.json(health, health.status === 'healthy' ? 200 : 503);
});

app.get('/metrics', async (c) => {
  const metrics = await obs.metrics?.getMetrics();
  return c.text(metrics, 200, { 'Content-Type': 'text/plain' });
});
```

## Configuration

### Environment Variables

```bash
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Environment (development, staging, production, test)
NODE_ENV=production
ENVIRONMENT=production

# Service identification
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
INSTANCE_ID=worker-1
```

### Initialization Options

```typescript
interface ObservabilityConfig {
  serviceName: string;          // Required: Service name for logging/metrics
  version?: string;             // Service version
  environment?: string;         // Environment (auto-detected from NODE_ENV)
  instanceId?: string;          // Instance identifier
  enableMetrics?: boolean;      // Enable Prometheus metrics (default: true)
  enableHealthChecks?: boolean; // Enable health checks (default: true)
}

const obs = Observability.initialize({
  serviceName: 'my-service',
  version: '2.1.0',
  environment: 'production',
  instanceId: process.env.HOSTNAME,
  enableMetrics: true,
  enableHealthChecks: true
});
```

## Log Formats

### Development Format
```
[2024-01-15 10:30:45.123] [my-service] INFO: Request completed {"method":"GET","path":"/api/users","statusCode":200,"duration":150}
```

### Production Format (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Request completed",
  "service": "my-service",
  "environment": "production",
  "version": "2.1.0",
  "instance": "worker-1",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 150
}
```

## Metrics

### Built-in Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|---------|
| `http_requests_total` | Counter | HTTP requests | method, route, status_code |
| `http_request_duration_seconds` | Histogram | Request duration | method, route, status_code |
| `business_operations_total` | Counter | Business operations | operation, status |
| `ai_inference_duration_seconds` | Histogram | AI inference time | model, task_type |
| `ai_tokens_used_total` | Counter | AI tokens consumed | model, task_type |
| `errors_total` | Counter | Error counts | type, code, severity |
| `health_status` | Gauge | Service health | check |

### Custom Metrics Example

```typescript
// Track user registrations
const registrationCounter = obs.metrics?.createCounter({
  name: 'user_registrations_total',
  help: 'Total user registrations',
  labelNames: ['source', 'plan']
});

registrationCounter.inc({ source: 'web', plan: 'premium' });

// Monitor queue size
const queueGauge = obs.metrics?.createGauge({
  name: 'job_queue_size',
  help: 'Current job queue size',
  labelNames: ['queue_name']
});

setInterval(() => {
  queueGauge.set({ queue_name: 'email' }, emailQueue.size);
}, 5000);
```

## Health Endpoints

| Endpoint | Purpose | Response | Use Case |
|----------|---------|----------|----------|
| `/health` | Detailed health | Full health report | Monitoring dashboards |
| `/health/live` | Liveness probe | `{"status":"alive"}` | Kubernetes liveness |
| `/health/ready` | Readiness probe | `{"ready":true}` | Kubernetes readiness |

## Error Handling

Errors are automatically classified and logged with appropriate context:

```typescript
// Automatic error classification
throw new ValidationError('Invalid email format');    // → 400 status
throw new AuthenticationError('Token expired');       // → 401 status
throw new NotFoundError('User not found');           // → 404 status
throw new DatabaseError('Connection failed');        // → 503 status

// Manual error logging with context
try {
  await processPayment(userId, amount);
} catch (error) {
  obs.logger.error('Payment processing failed', error, {
    userId,
    amount,
    paymentMethod: 'stripe',
    correlationId: req.correlationId
  });

  obs.metrics?.recordError('PaymentError', 'PAYMENT_FAILED', 'high');
  throw error;
}
```

## Performance Monitoring

### Request Correlation

```typescript
// Automatic correlation ID generation
app.use((req, res, next) => {
  req.correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
});

// Use in logging
obs.logger.info('Database query started', {
  correlationId: req.correlationId,
  query: 'SELECT * FROM users',
  userId
});
```

### Performance Tracking

```typescript
// Track operation performance
const timer = obs.metrics?.histograms.get('operation_duration_seconds')?.startTimer({
  operation: 'data_processing'
});

try {
  const result = await processData(data);
  timer?.({ status: 'success' });
  return result;
} catch (error) {
  timer?.({ status: 'error' });
  throw error;
}
```

## Security and Compliance

### Data Sanitization

Sensitive data is automatically redacted from logs:

```typescript
const userInput = {
  email: 'user@example.com',
  password: 'secret123',
  api_key: 'sk-abc123',
  creditCard: '4111-1111-1111-1111'
};

obs.logger.info('User registration', userInput);

// Logs as:
{
  "message": "User registration",
  "email": "user@example.com",
  "password": "[REDACTED]",
  "api_key": "[REDACTED]",
  "creditCard": "[REDACTED]"
}
```

### Audit Logging

```typescript
// Compliance audit logging
obs.logger.audit('data_access', userId, {
  resource: 'customer_data',
  action: 'export',
  recordCount: 1500,
  reason: 'GDPR_request',
  ip: req.ip
});

// Logged with special audit structure
{
  "message": "AUDIT",
  "audit": {
    "action": "data_access",
    "userId": "user-123",
    "details": { ... },
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create log directory
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1

EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: ENVIRONMENT
          value: "production"

        # Health checks
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: my-service
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/path: "/metrics"
    prometheus.io/port: "3000"
spec:
  selector:
    app: my-service
  ports:
  - port: 80
    targetPort: 3000
```

## Best Practices

### Logging

✅ **Do:**
- Use structured logging with consistent field names
- Include correlation IDs for request tracing
- Log at appropriate levels (debug → info → warn → error)
- Provide meaningful context in log messages
- Use child loggers for scoped contexts

❌ **Don't:**
- Log sensitive data (passwords, tokens, PII)
- Use string concatenation in log messages
- Ignore errors or exceptions
- Log at inappropriate levels
- Mix console.log with structured logging

### Metrics

✅ **Do:**
- Use descriptive metric names with units
- Include relevant labels for filtering
- Monitor both technical and business metrics
- Set up alerting for critical metrics
- Use appropriate metric types (counter, gauge, histogram)

❌ **Don't:**
- Create metrics with high cardinality labels
- Use metrics for debugging (use logs instead)
- Forget to clean up unused metrics
- Hardcode label values
- Mix metric types inappropriately

### Health Checks

✅ **Do:**
- Check critical dependencies
- Implement proper timeouts
- Return meaningful error messages
- Use appropriate HTTP status codes
- Test health checks regularly

❌ **Don't:**
- Make health checks too complex
- Check non-critical services in readiness
- Return sensitive information
- Skip dependency health checks
- Ignore health check failures

## Troubleshooting

### Common Issues

**Logs not in JSON format:**
```bash
# Check environment
echo $NODE_ENV $LOG_LEVEL

# Force production format
NODE_ENV=production npm start
```

**Metrics endpoint 503:**
```typescript
// Ensure metrics enabled
const obs = Observability.initialize({
  serviceName: 'my-service',
  enableMetrics: true  // Required
});
```

**Health checks failing:**
```typescript
// Verify health check implementation
obs.health?.addCheck('test', async () => {
  return { name: 'test', status: 'pass', message: 'OK' };
});
```

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# View structured logs with jq
npm start | jq '.'

# Filter error logs
npm start | jq 'select(.level == "error")'
```

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: https://github.com/protothrive/observability/issues
- Documentation: /docs/OBSERVABILITY.md
- Contact: devops@protothrive.com