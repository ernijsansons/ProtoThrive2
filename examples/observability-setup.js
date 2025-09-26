/**
 * ProtoThrive Observability Setup Example
 * Demonstrates how to integrate enterprise observability into your application
 *
 * Ref: CLAUDE.md Section 5 - Observability & Monitoring Foundation
 */

const { Observability } = require('../observability/dist/index');

// Example 1: Basic Setup with Default Configuration
const observability = Observability.initialize({
  serviceName: 'protothrive-example',
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development',
  instanceId: process.env.HOSTNAME || 'local-dev'
});

console.log('✅ Observability initialized with default settings');

// Example 2: Custom Configuration for Production
const productionObservability = Observability.initialize({
  serviceName: 'protothrive-production',
  version: '2.0.0',
  environment: 'production',
  instanceId: process.env.HOSTNAME,
  enableMetrics: true,
  enableHealthChecks: true
});

console.log('✅ Production observability configured');

// Example 3: Basic Logging Usage
const logger = observability.logger;

// Structured logging with metadata
logger.info('Application started', {
  port: 3000,
  nodeVersion: process.version,
  environment: process.env.NODE_ENV
});

// Error logging with context
try {
  throw new Error('Example error for demonstration');
} catch (error) {
  logger.error('Application error occurred', error, {
    component: 'example-setup',
    action: 'demonstration',
    userId: 'demo-user'
  });
}

// Metric logging
logger.metric('startup_time', 1250, 'ms', {
  environment: 'development',
  version: '2.0.0'
});

// Audit logging for compliance
logger.audit('example_action', 'demo-user', {
  action: 'observability_demo',
  resource: 'setup-example',
  ip: '127.0.0.1'
});

console.log('✅ Logging examples completed');

// Example 4: Express.js Integration
const express = require('express');
const app = express();

// Add observability middleware
app.use(observability.requestLogger());

// Health check endpoint
app.get('/health', observability.healthHandler.bind(observability));

// Metrics endpoint
app.get('/metrics', observability.metricsHandler.bind(observability));

// Example business endpoint with logging
app.get('/api/example', (req, res) => {
  logger.info('Example API called', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });

  res.json({
    message: 'Hello from ProtoThrive!',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Error handling middleware
app.use(observability.errorHandler());

// Start server (commented out for example)
/*
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info('Server started', { port, environment: process.env.NODE_ENV });
});
*/

console.log('✅ Express.js integration configured');

// Example 5: Hono Integration for Cloudflare Workers
/*
const { Hono } = require('hono');
const honoApp = new Hono();

// Add Hono middleware
honoApp.use('*', observability.honoRequestLogger());

// Health and metrics endpoints
honoApp.get('/health', async (c) => {
  const mockReq = c.req;
  const mockRes = {
    status: (code) => ({ json: (data) => c.json(data, code) }),
    json: (data) => c.json(data)
  };
  return observability.healthHandler(mockReq, mockRes);
});

honoApp.get('/metrics', async (c) => {
  const mockReq = c.req;
  const mockRes = {
    set: (key, value) => c.header(key, value),
    send: (data) => c.text(data),
    status: (code) => ({ send: (data) => c.text(data, code) })
  };
  return observability.metricsHandler(mockReq, mockRes);
});

export default honoApp;
*/

console.log('✅ Hono integration example provided');

// Example 6: Health Check Customization
if (observability.health) {
  // Add custom health check
  observability.health.addCheck('database', async () => {
    // Mock database check
    const isHealthy = Math.random() > 0.1; // 90% success rate

    return {
      name: 'database',
      status: isHealthy ? 'pass' : 'fail',
      message: isHealthy ? 'Database connection healthy' : 'Database connection failed',
      details: {
        connectionPool: isHealthy ? 'active' : 'inactive',
        lastCheck: new Date().toISOString()
      }
    };
  });

  console.log('✅ Custom health check added');
}

// Example 7: Custom Metrics
if (observability.metrics) {
  // Record HTTP request metrics
  observability.metrics.recordHttpRequest('GET', '/api/roadmaps', 200, 150);

  // Record error metrics
  observability.metrics.recordError('ValidationError', 'VAL_001', 'medium');

  // Create custom metric
  const customCounter = observability.metrics.createCounter(
    'custom_operations_total',
    'Total number of custom operations',
    ['operation_type', 'status']
  );

  customCounter.inc({ operation_type: 'example', status: 'success' });

  console.log('✅ Custom metrics recorded');
}

// Example 8: Child Logger for Components
const componentLogger = logger.child({
  component: 'user-service',
  version: '1.2.0'
});

componentLogger.info('Component initialized', {
  features: ['authentication', 'authorization', 'user-management']
});

console.log('✅ Component logger created');

// Example 9: Environment-specific Configuration
function getObservabilityConfig(environment) {
  const baseConfig = {
    serviceName: 'protothrive',
    version: '2.0.0',
    instanceId: process.env.HOSTNAME || 'unknown'
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        environment: 'production',
        enableMetrics: true,
        enableHealthChecks: true
      };

    case 'staging':
      return {
        ...baseConfig,
        environment: 'staging',
        enableMetrics: true,
        enableHealthChecks: true
      };

    case 'development':
      return {
        ...baseConfig,
        environment: 'development',
        enableMetrics: false,
        enableHealthChecks: false
      };

    default:
      return {
        ...baseConfig,
        environment: 'development'
      };
  }
}

console.log('✅ Environment-specific configuration helper created');

// Example 10: Error Scenarios and Fallbacks
try {
  // Simulate various error conditions
  const testLogger = observability.logger;

  // Test with circular reference
  const circularObj = { name: 'test' };
  circularObj.self = circularObj;
  testLogger.info('Testing circular reference handling', { data: circularObj });

  // Test with sensitive data
  testLogger.info('Testing data sanitization', {
    username: 'testuser',
    password: 'secret123',
    api_key: 'sk-test123',
    safe_data: 'this is safe'
  });

  // Test with large data
  const largeData = {
    items: Array.from({ length: 100 }, (_, i) => ({ id: i, data: `item_${i}` }))
  };
  testLogger.info('Testing large data handling', largeData);

  console.log('✅ Error scenario testing completed');

} catch (error) {
  console.error('❌ Error during testing:', error.message);
}

console.log('\n🎉 ProtoThrive Observability Setup Example Completed');
console.log('📚 Check the documentation at /docs/OBSERVABILITY.md for more details');
console.log('🔧 Customize the configuration based on your specific requirements');