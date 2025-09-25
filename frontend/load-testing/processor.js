/**
 * Artillery Processor for ProtoThrive Load Testing
 * Custom functions for load test scenarios
 *
 * Ref: CLAUDE.md Phase 3 - Load Testing Framework
 */

function generateRandomString(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

function generateTestVision() {
  const visions = [
    'Build a web application for project management with real-time collaboration',
    'Create a mobile app for fitness tracking with social features',
    'Develop an e-commerce platform with AI-powered recommendations',
    'Build a SaaS tool for team communication and file sharing',
    'Create an API service for data analytics and reporting'
  ];
  return visions[Math.floor(Math.random() * visions.length)];
}

function generateProjectType() {
  const types = ['web_platform', 'mobile_app', 'api_service', 'e_commerce', 'saas_mvp'];
  return types[Math.floor(Math.random() * types.length)];
}

// Custom functions for Artillery
module.exports = {
  // Before request hook
  beforeRequest: function(requestParams, context, ee, next) {
    // Add request ID for tracking
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['X-Request-ID'] = `load-test-${Date.now()}-${generateRandomString()}`;

    // Log request for debugging
    console.log(`Making request: ${requestParams.method || 'GET'} ${requestParams.url}`);

    return next();
  },

  // After response hook
  afterResponse: function(requestParams, response, context, ee, next) {
    // Log response time and status
    console.log(`Response: ${response.statusCode} (${response.timings.response}ms)`);

    // Custom metrics
    if (response.statusCode >= 400) {
      ee.emit('counter', 'errors.http_4xx_5xx', 1);
    }

    if (response.timings.response > 5000) {
      ee.emit('counter', 'responses.slow', 1);
    }

    return next();
  },

  // Generate test data
  generateTestData: function(context, events, done) {
    context.vars.testVision = generateTestVision();
    context.vars.projectType = generateProjectType();
    context.vars.randomId = generateRandomString();
    context.vars.timestamp = Date.now();

    return done();
  },

  // Custom validation
  validateResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 && response.body) {
      try {
        const body = JSON.parse(response.body);

        // Validate roadmap response structure
        if (requestParams.url.includes('/roadmaps')) {
          if (!body.id || !body.json_graph) {
            ee.emit('counter', 'validation.roadmap_missing_fields', 1);
          }
        }

        // Validate agent response structure
        if (requestParams.url.includes('/agent/run')) {
          if (!body.success || !body.agent_report) {
            ee.emit('counter', 'validation.agent_missing_fields', 1);
          }
        }

      } catch (error) {
        ee.emit('counter', 'validation.json_parse_error', 1);
      }
    }

    return next();
  },

  // Simulate user think time
  addThinkTime: function(context, events, done) {
    const thinkTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    setTimeout(done, thinkTime);
  },

  // Custom error handling
  handleError: function(error, context, events, done) {
    console.error('Load test error:', error.message);
    events.emit('counter', 'errors.custom', 1);
    return done();
  },

  // Performance benchmarks
  checkPerformance: function(requestParams, response, context, ee, next) {
    const responseTime = response.timings.response;

    // Set performance thresholds
    const thresholds = {
      '/api/roadmaps': 2000,        // 2 seconds for roadmap operations
      '/api/agent/run': 5000,       // 5 seconds for agent analysis
      '/auth/demo-token': 1000,     // 1 second for auth
      '/api/auth/validate': 500     // 0.5 seconds for validation
    };

    // Check if any threshold is exceeded
    for (const [endpoint, threshold] of Object.entries(thresholds)) {
      if (requestParams.url.includes(endpoint) && responseTime > threshold) {
        ee.emit('counter', `performance.${endpoint.replace(/[^a-z0-9]/gi, '_')}_slow`, 1);
        console.warn(`Performance threshold exceeded: ${endpoint} took ${responseTime}ms (threshold: ${threshold}ms)`);
      }
    }

    return next();
  },

  // Memory and resource monitoring
  monitorResources: function(context, events, done) {
    const memUsage = process.memoryUsage();

    events.emit('histogram', 'memory.heap_used', memUsage.heapUsed);
    events.emit('histogram', 'memory.heap_total', memUsage.heapTotal);
    events.emit('histogram', 'memory.external', memUsage.external);

    // Alert if memory usage is high
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      events.emit('counter', 'memory.high_usage', 1);
    }

    return done();
  },

  // Database connection simulation
  simulateDbLoad: function(context, events, done) {
    // Simulate database query time
    const dbQueryTime = Math.random() * 100 + 10; // 10-110ms
    events.emit('histogram', 'db.query_time', dbQueryTime);

    setTimeout(done, dbQueryTime);
  },

  // Cleanup function
  cleanup: function(context, events, done) {
    // Clean up any test data created during the load test
    if (context.vars.roadmapId) {
      console.log(`Cleaning up roadmap: ${context.vars.roadmapId}`);
      // In a real scenario, you might make DELETE requests here
    }

    return done();
  }
};

// Helper function to generate realistic test data
function generateRoadmapData() {
  const nodeCount = Math.floor(Math.random() * 10) + 3; // 3-12 nodes
  const nodes = [];
  const edges = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `n${i + 1}`,
      label: `Task ${i + 1}`,
      status: Math.random() > 0.7 ? 'completed' : 'pending',
      position: {
        x: i * 150,
        y: Math.floor(i / 3) * 120,
        z: 0
      },
      data: {
        estimatedDays: Math.floor(Math.random() * 14) + 1,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      }
    });

    if (i > 0) {
      edges.push({
        id: `e${i}`,
        source: `n${i}`,
        target: `n${i + 1}`,
        type: 'smoothstep'
      });
    }
  }

  return {
    nodes,
    edges
  };
}

console.log('Thermonuclear Load Testing: Artillery processor initialized with comprehensive test functions');