/**
 * Quick Test - Fast validation of deployed application
 */

import { chromium } from 'playwright';

async function runQuickTest() {
  console.log('🚀 ProtoThrive Quick Test Suite\n');
  console.log('Testing against:');
  console.log('  Frontend: https://876017e2.protothrive-frontend.pages.dev');
  console.log('  Backend: https://protothrive-backend.ernijs-ansons.workers.dev');
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = {
    passed: 0,
    failed: 0,
    tests: [] as Array<{ name: string; status: string; duration: number; details?: string }>,
  };

  async function test(name: string, fn: () => Promise<void>) {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      results.passed++;
      results.tests.push({ name, status: 'PASSED', duration });
      console.log(`✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      results.failed++;
      const details = (error as Error).message;
      results.tests.push({ name, status: 'FAILED', duration, details });
      console.log(`❌ ${name} (${duration}ms): ${details}`);
    }
  }

  // Test 1: Frontend loads
  await test('Frontend landing page loads', async () => {
    const response = await page.goto('https://876017e2.protothrive-frontend.pages.dev', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    if (response?.status() !== 200) throw new Error(`Got status ${response?.status()}`);
  });

  // Test 2: Page has title
  await test('Frontend has valid title', async () => {
    const title = await page.title();
    if (!title || title.length === 0) throw new Error('Page title is empty');
  });

  // Test 3: Backend health check
  await test('Backend health endpoint responds', async () => {
    const response = await page.goto('https://protothrive-backend.ernijs-ansons.workers.dev/health', {
      timeout: 10000,
    });
    if (response?.status() !== 200) throw new Error(`Health check returned ${response?.status()}`);
  });

  // Test 4: Login page loads
  await test('Login page accessible', async () => {
    const response = await page.goto('https://876017e2.protothrive-frontend.pages.dev/login');
    if (response?.status() !== 200) throw new Error(`Login page returned ${response?.status()}`);
  });

  // Test 5: Register page loads
  await test('Register page accessible', async () => {
    const response = await page.goto('https://876017e2.protothrive-frontend.pages.dev/register');
    if (response?.status() !== 200) throw new Error(`Register page returned ${response?.status()}`);
  });

  // Test 6: Security headers present
  await test('Security headers configured', async () => {
    const response = await page.goto('https://876017e2.protothrive-frontend.pages.dev');
    const headers = response?.headers() || {};

    const requiredHeaders = ['x-content-type-options', 'x-frame-options'];
    const missing = requiredHeaders.filter((h) => !headers[h]);

    if (missing.length > 0) {
      throw new Error(`Missing headers: ${missing.join(', ')}`);
    }
  });

  // Test 7: No console errors on landing
  await test('No console errors on landing page', async () => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('https://876017e2.protothrive-frontend.pages.dev');
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      throw new Error(`Found ${errors.length} console errors`);
    }
  });

  // Test 8: Page loads in reasonable time
  await test('Page load time < 3 seconds', async () => {
    const start = Date.now();
    await page.goto('https://876017e2.protothrive-frontend.pages.dev', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;

    if (loadTime > 3000) {
      throw new Error(`Load time ${loadTime}ms exceeds 3000ms`);
    }
  });

  // Test 9: Mobile viewport works
  await test('Mobile viewport renders correctly', async () => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://876017e2.protothrive-frontend.pages.dev');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalScroll) {
      throw new Error('Mobile viewport has horizontal scroll');
    }
  });

  // Test 10: API responds quickly
  await test('API response time < 500ms', async () => {
    const start = Date.now();
    await page.goto('https://protothrive-backend.ernijs-ansons.workers.dev/health');
    const responseTime = Date.now() - start;

    if (responseTime > 500) {
      throw new Error(`API response time ${responseTime}ms exceeds 500ms`);
    }
  });

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 QUICK TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${results.tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Pass Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`);
  console.log('='.repeat(60) + '\n');

  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter((t) => t.status === 'FAILED')
      .forEach((t) => {
        console.log(`  ❌ ${t.name}`);
        console.log(`     ${t.details}`);
      });
    console.log('');
  }

  return results.failed === 0;
}

runQuickTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
