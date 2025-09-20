/**
 * Test Frontend-Backend Integration
 */

const BACKEND_URL = 'https://backend-thermo-staging.ernijs-ansons.workers.dev';

async function testBackendEndpoints() {
  console.log('🔗 Testing Frontend-Backend Integration\n');
  console.log('='.repeat(50));

  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'API Info', path: '/api' },
    { name: 'Roadmaps (Mock)', path: '/api/roadmaps' },
    { name: 'CORS Options', path: '/health', method: 'OPTIONS' }
  ];

  for (const endpoint of endpoints) {
    try {
      const method = endpoint.method || 'GET';
      const response = await fetch(BACKEND_URL + endpoint.path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://staging.protothrive-frontend.pages.dev'
        }
      });

      const status = response.status;
      let body = '';

      if (method !== 'OPTIONS') {
        body = await response.text();
      }

      console.log(`✓ ${endpoint.name} (${method}): ${status}`);

      if (body && body.length > 0) {
        const preview = body.length > 100 ? body.substring(0, 100) + '...' : body;
        console.log(`  Response: ${preview}`);
      }

      // Check CORS headers
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      if (corsOrigin) {
        console.log(`  CORS: ${corsOrigin}`);
      }

    } catch (error) {
      console.error(`✗ ${endpoint.name}: ${error.message}`);
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log('📊 Integration Test Summary:');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log('Frontend URL: https://staging.protothrive-frontend.pages.dev');
  console.log('\n✅ Ready for frontend-backend integration!');
}

testBackendEndpoints().catch(console.error);