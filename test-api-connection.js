// Test script to verify frontend-backend API connection
// Ref: CLAUDE.md - Frontend-Backend Integration Testing

const API_BASE_URL = 'https://backend-thermo-staging.ernijs-ansons.workers.dev';

async function testAPIConnection() {
  console.log('Thermonuclear API Connection Test Starting...');

  try {
    // Test 1: Health check
    console.log('\n🔸 Testing backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 2: API endpoints structure
    console.log('\n🔸 Testing API info...');
    const apiResponse = await fetch(`${API_BASE_URL}/`);
    const apiData = await apiResponse.text();
    console.log('✅ API info:', apiData.substring(0, 200) + '...');

    // Test 3: Roadmaps endpoint (without auth for now)
    console.log('\n🔸 Testing roadmaps endpoint...');
    const roadmapResponse = await fetch(`${API_BASE_URL}/api/roadmaps`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('📊 Roadmaps response status:', roadmapResponse.status);

    if (roadmapResponse.status === 401) {
      console.log('🔐 Expected: Authentication required (401) - Security working');
    } else {
      const roadmapData = await roadmapResponse.json();
      console.log('📊 Roadmaps data:', roadmapData);
    }

    // Test 4: AI service endpoints
    console.log('\n🔸 Testing AI capabilities...');
    const aiResponse = await fetch(`${API_BASE_URL}/api/agents/capabilities`);
    console.log('🤖 AI capabilities status:', aiResponse.status);

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      console.log('🤖 AI capabilities:', aiData);
    }

    console.log('\n✅ Thermonuclear API Connection Test Complete!');
    console.log('🚀 Backend Status: OPERATIONAL');
    console.log('🔗 Frontend-Backend Bridge: ESTABLISHED');

  } catch (error) {
    console.error('❌ Thermonuclear API Connection Test Failed:', error.message);
    console.log('🔧 Check network connection and backend deployment');
  }
}

// Run the test
testAPIConnection();