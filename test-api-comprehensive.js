/**
 * Comprehensive Backend API Testing Suite
 * Thermonuclear Test Protocol for ProtoThrive Staging
 * Ref: CLAUDE.md Terminal 1 Phase 1 - Backend Testing
 */

const BASE_URL = 'https://backend-thermo-staging.ernijs-ansons.workers.dev';

// Test configuration
const TESTS_CONFIG = {
  timeout: 30000, // 30 seconds per test
  maxRetries: 3,
  testUser: {
    id: 'test-user-thermo-1',
    email: 'test@protothrive.com',
    role: 'vibe_coder'
  },
  mockData: {
    roadmap: {
      json_graph: JSON.stringify({
        nodes: [
          { id: 'n1', label: 'Thermo Start', status: 'gray', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', label: 'Middle', status: 'gray', position: { x: 100, y: 100, z: 0 } },
          { id: 'n3', label: 'End', status: 'gray', position: { x: 200, y: 200, z: 0 } }
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' }
        ]
      }),
      vibe_mode: true
    },
    snippet: {
      category: 'ui',
      code: 'console.log("Thermonuclear UI Test");',
      ui_preview_url: 'mock_neon.png'
    }
  }
};

// Test results aggregator
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  metrics: {
    responseTime: [],
    statusCodes: {}
  }
};

// Utility functions
function logTest(name, status, details = '') {
  const timestamp = new Date().toISOString();
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  console.log(`[${timestamp}] ${statusIcon} ${name} - ${status} ${details}`);
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: name, details });
  }
}

function measureResponseTime(start) {
  return Date.now() - start;
}

async function makeRequest(url, options = {}, testName = '') {
  const start = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProtoThrive-Test-Suite/1.0',
        ...options.headers
      }
    });
    
    const responseTime = measureResponseTime(start);
    testResults.metrics.responseTime.push(responseTime);
    
    const status = response.status;
    testResults.metrics.statusCodes[status] = (testResults.metrics.statusCodes[status] || 0) + 1;
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status,
      data,
      headers: response.headers,
      responseTime,
      ok: response.ok
    };
  } catch (error) {
    const responseTime = measureResponseTime(start);
    testResults.metrics.responseTime.push(responseTime);
    
    console.error(`Request failed for ${testName}:`, error);
    return {
      status: 0,
      data: { error: error.message },
      responseTime,
      ok: false
    };
  }
}

// Test Suite Functions

async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  
  const result = await makeRequest(`${BASE_URL}/health`, {}, 'Health Check');
  
  if (!result.ok) {
    logTest('Health Endpoint', 'FAIL', `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`);
    return false;
  }
  
  const requiredFields = ['status', 'timestamp', 'version'];
  const missingFields = requiredFields.filter(field => !(field in result.data));
  
  if (missingFields.length > 0) {
    logTest('Health Response Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
  } else {
    logTest('Health Response Structure', 'PASS', `All required fields present`);
  }
  
  if (result.responseTime > 5000) {
    logTest('Health Response Time', 'FAIL', `${result.responseTime}ms > 5s`);
  } else {
    logTest('Health Response Time', 'PASS', `${result.responseTime}ms`);
  }
  
  return result.ok;
}

async function testCORSConfiguration() {
  console.log('\n🔍 Testing CORS Configuration...');
  
  // Test OPTIONS preflight
  const optionsResult = await makeRequest(`${BASE_URL}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://frontend-test.example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization, Content-Type'
    }
  }, 'CORS Preflight');
  
  if (optionsResult.status === 200 || optionsResult.status === 204) {
    logTest('CORS Preflight', 'PASS', `Status: ${optionsResult.status}`);
  } else {
    logTest('CORS Preflight', 'FAIL', `Status: ${optionsResult.status}`);
  }
  
  // Check CORS headers
  const corsHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers'
  ];
  
  const presentHeaders = corsHeaders.filter(header => 
    optionsResult.headers && optionsResult.headers.get(header)
  );
  
  if (presentHeaders.length === corsHeaders.length) {
    logTest('CORS Headers', 'PASS', `All CORS headers present`);
  } else {
    logTest('CORS Headers', 'FAIL', `Missing headers: ${corsHeaders.filter(h => !presentHeaders.includes(h)).join(', ')}`);
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔍 Testing Authentication Flow...');
  
  // Test login endpoint
  const loginResult = await makeRequest(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'test@protothrive.com', password: 'test123' })
  }, 'Auth Login');
  
  if (loginResult.ok && loginResult.data.token) {
    logTest('Auth Login', 'PASS', `Token received`);
    
    // Test token validation
    const validateResult = await makeRequest(`${BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginResult.data.token}`
      }
    }, 'Token Validation');
    
    if (validateResult.ok && validateResult.data.valid) {
      logTest('Token Validation', 'PASS', `Token valid`);
      return loginResult.data.token;
    } else {
      logTest('Token Validation', 'FAIL', `Invalid token response`);
    }
  } else {
    logTest('Auth Login', 'FAIL', `No token received: ${JSON.stringify(loginResult.data)}`);
  }
  
  return null;
}

async function testRoadmapsAPI(authToken) {
  console.log('\n🔍 Testing Roadmaps API...');
  
  const authHeaders = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
  
  // Test GET /api/roadmaps (list)
  const listResult = await makeRequest(`${BASE_URL}/api/roadmaps`, {
    method: 'GET',
    headers: authHeaders
  }, 'List Roadmaps');
  
  if (listResult.ok) {
    logTest('List Roadmaps', 'PASS', `Status: ${listResult.status}`);
  } else {
    logTest('List Roadmaps', 'FAIL', `Status: ${listResult.status}, Error: ${JSON.stringify(listResult.data)}`);
  }
  
  // Test POST /api/roadmaps (create)
  const createResult = await makeRequest(`${BASE_URL}/api/roadmaps`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(TESTS_CONFIG.mockData.roadmap)
  }, 'Create Roadmap');
  
  let roadmapId = null;
  if (createResult.ok && createResult.data.id) {
    logTest('Create Roadmap', 'PASS', `Created: ${createResult.data.id}`);
    roadmapId = createResult.data.id;
  } else {
    logTest('Create Roadmap', 'FAIL', `Error: ${JSON.stringify(createResult.data)}`);
  }
  
  // Test GET /api/roadmaps/:id (get specific)
  if (roadmapId) {
    const getResult = await makeRequest(`${BASE_URL}/api/roadmaps/${roadmapId}`, {
      method: 'GET',
      headers: authHeaders
    }, 'Get Roadmap');
    
    if (getResult.ok) {
      logTest('Get Roadmap', 'PASS', `Retrieved roadmap ${roadmapId}`);
    } else {
      logTest('Get Roadmap', 'FAIL', `Status: ${getResult.status}`);
    }
    
    // Test PUT /api/roadmaps/:id (update)
    const updateData = {
      status: 'active',
      thrive_score: 0.85
    };
    
    const updateResult = await makeRequest(`${BASE_URL}/api/roadmaps/${roadmapId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    }, 'Update Roadmap');
    
    if (updateResult.ok) {
      logTest('Update Roadmap', 'PASS', `Updated roadmap ${roadmapId}`);
    } else {
      logTest('Update Roadmap', 'FAIL', `Status: ${updateResult.status}`);
    }
    
    return roadmapId;
  }
  
  return null;
}

async function testSnippetsAPI() {
  console.log('\n🔍 Testing Snippets API...');
  
  // Test GET /api/snippets
  const listResult = await makeRequest(`${BASE_URL}/api/snippets`, {
    method: 'GET'
  }, 'List Snippets');
  
  if (listResult.ok) {
    logTest('List Snippets', 'PASS', `Status: ${listResult.status}`);
  } else {
    logTest('List Snippets', 'FAIL', `Status: ${listResult.status}`);
  }
  
  // Test GET /api/snippets with category filter
  const categoryResult = await makeRequest(`${BASE_URL}/api/snippets?category=ui&limit=10`, {
    method: 'GET'
  }, 'Filter Snippets');
  
  if (categoryResult.ok) {
    logTest('Filter Snippets', 'PASS', `Category filter works`);
  } else {
    logTest('Filter Snippets', 'FAIL', `Status: ${categoryResult.status}`);
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...');
  
  // Test invalid endpoint
  const invalidResult = await makeRequest(`${BASE_URL}/invalid-endpoint`, {
    method: 'GET'
  }, 'Invalid Endpoint');
  
  if (invalidResult.status === 404 || invalidResult.status >= 400) {
    logTest('Invalid Endpoint', 'PASS', `Proper error status: ${invalidResult.status}`);
  } else {
    logTest('Invalid Endpoint', 'FAIL', `Unexpected status: ${invalidResult.status}`);
  }
  
  // Test unauthorized access
  const unauthorizedResult = await makeRequest(`${BASE_URL}/api/roadmaps`, {
    method: 'POST',
    body: JSON.stringify(TESTS_CONFIG.mockData.roadmap)
  }, 'Unauthorized Access');
  
  if (unauthorizedResult.status === 401) {
    logTest('Unauthorized Access', 'PASS', `Proper 401 response`);
  } else {
    logTest('Unauthorized Access', 'FAIL', `Expected 401, got ${unauthorizedResult.status}`);
  }
  
  // Test malformed JSON
  const malformedResult = await makeRequest(`${BASE_URL}/api/roadmaps`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer fake-token' },
    body: 'invalid json'
  }, 'Malformed JSON');
  
  if (malformedResult.status >= 400) {
    logTest('Malformed JSON', 'PASS', `Proper error handling: ${malformedResult.status}`);
  } else {
    logTest('Malformed JSON', 'FAIL', `Should reject malformed JSON`);
  }
}

async function testPerformanceMetrics() {
  console.log('\n🔍 Testing Performance Metrics...');
  
  // Test multiple concurrent requests
  const concurrentRequests = Array(5).fill().map((_, i) => 
    makeRequest(`${BASE_URL}/health`, {}, `Concurrent Request ${i + 1}`)
  );
  
  const start = Date.now();
  const results = await Promise.all(concurrentRequests);
  const totalTime = Date.now() - start;
  
  const allSuccessful = results.every(r => r.ok);
  if (allSuccessful) {
    logTest('Concurrent Requests', 'PASS', `5 requests in ${totalTime}ms`);
  } else {
    logTest('Concurrent Requests', 'FAIL', `Some requests failed`);
  }
  
  // Calculate average response time
  if (testResults.metrics.responseTime.length > 0) {
    const avgResponseTime = testResults.metrics.responseTime.reduce((a, b) => a + b, 0) / testResults.metrics.responseTime.length;
    
    if (avgResponseTime < 1000) {
      logTest('Average Response Time', 'PASS', `${avgResponseTime.toFixed(2)}ms`);
    } else {
      logTest('Average Response Time', 'FAIL', `${avgResponseTime.toFixed(2)}ms > 1s`);
    }
  }
}

async function generateTestReport() {
  console.log('\n📊 THERMONUCLEAR TEST REPORT');
  console.log('='.repeat(50));
  
  const successRate = (testResults.passed / testResults.total * 100).toFixed(2);
  const avgResponseTime = testResults.metrics.responseTime.length > 0 
    ? (testResults.metrics.responseTime.reduce((a, b) => a + b, 0) / testResults.metrics.responseTime.length).toFixed(2)
    : 'N/A';
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Average Response Time: ${avgResponseTime}ms`);
  console.log(`Status Codes:`, testResults.metrics.statusCodes);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`  - ${error.test}: ${error.details}`);
    });
  }
  
  // Production readiness assessment
  const productionReady = successRate >= 90 && parseFloat(avgResponseTime) < 2000;
  
  console.log(`\n🚀 PRODUCTION READINESS: ${productionReady ? 'GO ✅' : 'NO-GO ❌'}`);
  
  if (!productionReady) {
    console.log('BLOCKING ISSUES:');
    if (successRate < 90) console.log('  - Success rate below 90%');
    if (parseFloat(avgResponseTime) >= 2000) console.log('  - Average response time >= 2s');
  }
  
  return {
    productionReady,
    successRate: parseFloat(successRate),
    avgResponseTime: parseFloat(avgResponseTime),
    totalTests: testResults.total,
    errors: testResults.errors
  };
}

// Main test execution
async function runAllTests() {
  console.log('🚀 STARTING THERMONUCLEAR BACKEND API TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Core functionality tests
    await testHealthEndpoint();
    await testCORSConfiguration();
    
    // Authentication flow
    const authToken = await testAuthenticationFlow();
    
    // API endpoint tests
    await testRoadmapsAPI(authToken);
    await testSnippetsAPI();
    
    // Error handling and edge cases
    await testErrorHandling();
    
    // Performance and load tests
    await testPerformanceMetrics();
    
    // Generate final report
    const report = await generateTestReport();
    
    console.log('\n💾 Saving test results...');
    // In a real environment, we would save this to a file or database
    
    return report;
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    return {
      productionReady: false,
      error: error.message
    };
  }
}

// Execute if running directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests()
    .then(report => {
      console.log('\n✅ Test execution completed');
      process.exit(report.productionReady ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Critical test failure:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults, TESTS_CONFIG };