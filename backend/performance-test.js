/**
 * Performance validation test for ProtoThrive backend
 * Tests critical operations to ensure <100ms response times
 */

// Test JWT operations performance
async function testJWTPerformance() {
  console.log('Testing JWT performance...');

  const secret = new TextEncoder().encode('test-secret-key-that-is-at-least-64-characters-long-for-security');
  const iterations = 100;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Create JWT
    const payload = {
      sub: `user${i}`,
      email: `user${i}@example.com`,
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60)
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');

    const message = `${encodedHeader}.${encodedPayload}`;
    const messageBuffer = new TextEncoder().encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      secret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageBuffer);
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
    const jwt = `${message}.${encodedSignature}`;

    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`✅ JWT Performance Test Results:`);
  console.log(`   Average: ${avgTime.toFixed(2)}ms`);
  console.log(`   Max: ${maxTime.toFixed(2)}ms`);
  console.log(`   Min: ${minTime.toFixed(2)}ms`);
  console.log(`   Target: <100ms - ${avgTime < 100 ? '✅ PASS' : '❌ FAIL'}`);

  return { avg: avgTime, max: maxTime, min: minTime };
}

// Test password hashing performance
async function testPasswordHashingPerformance() {
  console.log('\nTesting password hashing performance...');

  const iterations = 10; // Fewer iterations since PBKDF2 is intentionally slow
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const password = `test-password-${i}`;

    // Convert password to array buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import the password as a key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iterations for security
        hash: 'SHA-256'
      },
      key,
      256
    );

    const combined = new Uint8Array(salt.length + hashBuffer.byteLength);
    combined.set(salt);
    combined.set(new Uint8Array(hashBuffer), salt.length);
    const hashedPassword = btoa(String.fromCharCode(...combined));

    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`✅ Password Hashing Performance Test Results:`);
  console.log(`   Average: ${avgTime.toFixed(2)}ms`);
  console.log(`   Max: ${maxTime.toFixed(2)}ms`);
  console.log(`   Min: ${minTime.toFixed(2)}ms`);
  console.log(`   Note: PBKDF2 is intentionally slow for security (100k iterations)`);

  return { avg: avgTime, max: maxTime, min: minTime };
}

// Test rate limiting performance
function testRateLimitingPerformance() {
  console.log('\nTesting rate limiting performance...');

  const iterations = 1000;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Simulate rate limiting logic
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 100;
    const burstLimit = 150;

    const state = {
      count: Math.floor(Math.random() * 50),
      resetTime: now + windowMs,
      burst: Math.floor(Math.random() * burstLimit),
      lastRequest: now - Math.floor(Math.random() * 10000)
    };

    const timeSinceLastRequest = now - state.lastRequest;
    const tokensToAdd = Math.floor(timeSinceLastRequest * maxRequests / windowMs);

    const newState = {
      count: state.count + 1,
      resetTime: state.resetTime,
      burst: Math.min(burstLimit, state.burst + tokensToAdd),
      lastRequest: now
    };

    const allowed = newState.count <= maxRequests && newState.burst > 0;
    const remaining = Math.max(0, maxRequests - newState.count);

    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`✅ Rate Limiting Performance Test Results:`);
  console.log(`   Average: ${avgTime.toFixed(4)}ms`);
  console.log(`   Max: ${maxTime.toFixed(4)}ms`);
  console.log(`   Min: ${minTime.toFixed(4)}ms`);
  console.log(`   Target: <1ms - ${avgTime < 1 ? '✅ PASS' : '❌ FAIL'}`);

  return { avg: avgTime, max: maxTime, min: minTime };
}

// Test JSON operations performance
function testJSONPerformance() {
  console.log('\nTesting JSON operations performance...');

  const iterations = 1000;
  const times = [];

  // Create sample data
  const sampleData = {
    id: 'roadmap-123',
    name: 'Test Roadmap',
    description: 'A sample roadmap for performance testing',
    nodes: Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      type: 'feature',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        label: `Feature ${i}`,
        description: 'Sample feature description',
        status: 'pending',
        priority: 'medium'
      }
    })),
    edges: Array.from({ length: 15 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      animated: true
    })),
    thriveScore: Math.random(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Serialize to JSON
    const jsonString = JSON.stringify(sampleData);

    // Parse from JSON
    const parsedData = JSON.parse(jsonString);

    // Validate structure
    const isValid = parsedData.id && parsedData.name && Array.isArray(parsedData.nodes);

    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);

  console.log(`✅ JSON Operations Performance Test Results:`);
  console.log(`   Average: ${avgTime.toFixed(4)}ms`);
  console.log(`   Max: ${maxTime.toFixed(4)}ms`);
  console.log(`   Min: ${minTime.toFixed(4)}ms`);
  console.log(`   Target: <10ms - ${avgTime < 10 ? '✅ PASS' : '❌ FAIL'}`);

  return { avg: avgTime, max: maxTime, min: minTime };
}

// Run all performance tests
async function runPerformanceTests() {
  console.log('🚀 ProtoThrive Backend Performance Tests\n');
  console.log('Target: All operations <100ms for optimal user experience\n');

  try {
    const results = {};

    // Test 1: JWT Performance
    results.jwt = await testJWTPerformance();

    // Test 2: Password Hashing Performance
    results.password = await testPasswordHashingPerformance();

    // Test 3: Rate Limiting Performance
    results.rateLimit = testRateLimitingPerformance();

    // Test 4: JSON Operations Performance
    results.json = testJSONPerformance();

    // Summary
    console.log('\n📊 Performance Summary:');
    console.log('=' .repeat(50));

    const criticalOperations = [
      { name: 'JWT Creation', time: results.jwt.avg, target: 100 },
      { name: 'Rate Limiting', time: results.rateLimit.avg, target: 1 },
      { name: 'JSON Operations', time: results.json.avg, target: 10 }
    ];

    let allPassed = true;
    criticalOperations.forEach(op => {
      const status = op.time < op.target ? '✅ PASS' : '❌ FAIL';
      if (op.time >= op.target) allPassed = false;
      console.log(`${op.name}: ${op.time.toFixed(2)}ms (target: <${op.target}ms) ${status}`);
    });

    console.log('=' .repeat(50));
    console.log(`Overall Performance: ${allPassed ? '✅ EXCELLENT' : '⚠️  NEEDS OPTIMIZATION'}`);

    if (allPassed) {
      console.log('🎯 All critical operations meet <100ms target!');
      console.log('🚀 Ready for production deployment');
    } else {
      console.log('🔧 Some operations need optimization before production');
    }

    return results;

  } catch (error) {
    console.error('\n❌ Performance test failed:', error);
    return null;
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  runPerformanceTests();
}