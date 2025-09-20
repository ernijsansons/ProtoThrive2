/**
 * Test deployment endpoints for ProtoThrive
 */

const endpoints = {
  backend: 'https://backend-thermo-staging.ernijs-ansons.workers.dev',
  frontend: 'https://adc16d05.protothrive-frontend.pages.dev'
};

async function testEndpoint(name, url, path = '') {
  try {
    const response = await fetch(url + path);
    const status = response.status;
    const statusText = response.statusText;

    console.log(`✓ ${name}: ${status} ${statusText}`);

    if (status === 200) {
      const text = await response.text();
      console.log(`  Response preview: ${text.substring(0, 100)}...`);
    }

    return status;
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    return -1;
  }
}

async function runTests() {
  console.log('🚀 ProtoThrive Deployment Test Suite\n');
  console.log('='.repeat(40));

  // Test Frontend
  console.log('\n📱 Frontend Tests:');
  await testEndpoint('Frontend Home', endpoints.frontend);

  // Test Backend
  console.log('\n⚙️ Backend Tests:');
  await testEndpoint('Backend Health', endpoints.backend, '/health');
  await testEndpoint('Backend Root', endpoints.backend, '/');

  console.log('\n' + '='.repeat(40));
  console.log('\n📊 Test Summary:');
  console.log(`Frontend URL: ${endpoints.frontend}`);
  console.log(`Backend URL: ${endpoints.backend}`);
}

runTests().catch(console.error);