/**
 * Specific Endpoint Testing for ProtoThrive Backend
 * Targeted testing to isolate and resolve individual API issues
 */

const BASE_URL = 'https://backend-thermo-staging.ernijs-ansons.workers.dev';

async function testRoadmapCreation() {
  console.log('\n🔍 Testing Roadmap Creation...');
  
  // First get a token
  const loginResult = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@protothrive.com' })
  });
  
  const loginData = await loginResult.json();
  console.log('Login response:', loginData);
  
  if (!loginData.token) {
    console.log('❌ No token received from login');
    return;
  }
  
  // Test roadmap creation
  const roadmapData = {
    json_graph: {
      nodes: [
        { id: 'n1', label: 'Start Node', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', label: 'End Node', position: { x: 100, y: 100, z: 0 } }
      ],
      edges: [{ from: 'n1', to: 'n2' }]
    },
    vibe_mode: true
  };
  
  const createResult = await fetch(`${BASE_URL}/api/roadmaps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify(roadmapData)
  });
  
  const createResponse = await createResult.json();
  console.log('Create roadmap status:', createResult.status);
  console.log('Create roadmap response:', createResponse);
  
  return { token: loginData.token, roadmapId: createResponse.id };
}

async function testSnippetsEndpoint() {
  console.log('\n🔍 Testing Snippets Endpoint...');
  
  const result = await fetch(`${BASE_URL}/api/snippets`);
  console.log('Snippets status:', result.status);
  
  try {
    const data = await result.json();
    console.log('Snippets response:', data);
  } catch (e) {
    const text = await result.text();
    console.log('Snippets raw response:', text);
  }
}

async function testCORSPreflight() {
  console.log('\n🔍 Testing CORS Preflight...');
  
  try {
    const result = await fetch(`${BASE_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://frontend-test.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    
    console.log('CORS Preflight status:', result.status);
    console.log('CORS Headers:');
    result.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    });
  } catch (e) {
    console.error('CORS test error:', e.message);
  }
}

async function testInvalidEndpoint() {
  console.log('\n🔍 Testing Invalid Endpoint Handling...');
  
  const result = await fetch(`${BASE_URL}/nonexistent-endpoint`);
  console.log('Invalid endpoint status:', result.status);
  
  try {
    const data = await result.json();
    console.log('Invalid endpoint response:', data);
  } catch (e) {
    const text = await result.text();
    console.log('Invalid endpoint raw response:', text);
  }
}

async function runSpecificTests() {
  console.log('🚀 RUNNING SPECIFIC ENDPOINT TESTS');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Test individual endpoints
    const roadmapResults = await testRoadmapCreation();
    await testSnippetsEndpoint();
    await testCORSPreflight();
    await testInvalidEndpoint();
    
    console.log('\n✅ Specific tests completed');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runSpecificTests();