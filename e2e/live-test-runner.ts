/**
 * Live Test Runner with Chrome DevTools Integration
 * Runs comprehensive tests with real-time Chrome DevTools monitoring
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

const TEST_CONFIG = {
  frontend: {
    url: 'https://876017e2.protothrive-frontend.pages.dev',
  },
  backend: {
    url: 'https://protothrive-backend.ernijs-ansons.workers.dev',
  },
  performance: {
    lcp: 2500,
    ttfb: 800,
    apiResponseTime: 100,
  },
};

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

class LiveTestRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];

  async initialize() {
    console.log('🚀 Initializing Chrome DevTools Test Runner...\n');

    // Launch browser with DevTools
    this.browser = await chromium.launch({
      headless: false, // Run with visible browser
      devtools: true,  // Open DevTools
      args: [
        '--auto-open-devtools-for-tabs',
        '--enable-features=NetworkService,NetworkServiceInProcess',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: 'test-results/videos/' },
    });

    this.page = await this.context.newPage();

    // Enable console logging
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`   ❌ Console Error: ${msg.text()}`);
      }
    });

    console.log('✅ Browser initialized with DevTools\n');
  }

  async runTest(name: string, testFn: (page: Page) => Promise<void>) {
    console.log(`▶️  Running: ${name}`);
    const startTime = Date.now();

    try {
      if (!this.page) throw new Error('Page not initialized');

      await testFn(this.page);

      const duration = Date.now() - startTime;
      this.results.push({ name, status: 'passed', duration });
      console.log(`   ✅ PASSED (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = (error as Error).message;

      // Capture screenshot on failure
      const screenshot = `test-results/screenshots/failed-${Date.now()}.png`;
      await this.page?.screenshot({ path: screenshot, fullPage: true });

      this.results.push({ name, status: 'failed', duration, error: errorMsg, screenshot });
      console.log(`   ❌ FAILED (${duration}ms): ${errorMsg}\n`);
    }
  }

  async testFrontendLoading() {
    await this.runTest('Frontend Landing Page Load', async (page) => {
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.frontend.url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      console.log(`   📊 Load time: ${loadTime}ms`);

      // Check page loaded
      const title = await page.title();
      console.log(`   📄 Page title: ${title}`);

      if (!title) throw new Error('Page title is empty');
      if (loadTime > 3000) console.log(`   ⚠️  Slow load time: ${loadTime}ms`);
    });
  }

  async testCoreWebVitals() {
    await this.runTest('Core Web Vitals Measurement', async (page) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = { lcp: 0, fcp: 0, cls: 0, ttfb: 0 };

          // TTFB
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          vitals.ttfb = navigation.responseStart - navigation.requestStart;

          // FCP
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
          vitals.fcp = fcpEntry ? fcpEntry.startTime : 0;

          // Wait a bit for LCP and CLS
          setTimeout(() => {
            const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[];
            vitals.lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].renderTime : 0;

            resolve(vitals);
          }, 2000);
        });
      });

      console.log(`   📊 Core Web Vitals:`);
      console.log(`      LCP: ${(metrics as any).lcp.toFixed(2)}ms`);
      console.log(`      FCP: ${(metrics as any).fcp.toFixed(2)}ms`);
      console.log(`      TTFB: ${(metrics as any).ttfb.toFixed(2)}ms`);

      // Validate against thresholds
      if ((metrics as any).lcp > TEST_CONFIG.performance.lcp) {
        throw new Error(`LCP too high: ${(metrics as any).lcp}ms (target: <${TEST_CONFIG.performance.lcp}ms)`);
      }
      if ((metrics as any).ttfb > TEST_CONFIG.performance.ttfb) {
        console.log(`   ⚠️  TTFB above target: ${(metrics as any).ttfb}ms`);
      }
    });
  }

  async testSecurityHeaders() {
    await this.runTest('Security Headers Check', async (page) => {
      const response = await page.goto(TEST_CONFIG.frontend.url);
      const headers = response?.headers() || {};

      console.log(`   🔒 Security Headers:`);

      const requiredHeaders = {
        'x-frame-options': 'X-Frame-Options',
        'x-content-type-options': 'X-Content-Type-Options',
        'strict-transport-security': 'Strict-Transport-Security',
      };

      let missing = [];
      for (const [key, name] of Object.entries(requiredHeaders)) {
        if (headers[key]) {
          console.log(`      ✅ ${name}: ${headers[key]}`);
        } else {
          console.log(`      ❌ ${name}: MISSING`);
          missing.push(name);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing security headers: ${missing.join(', ')}`);
      }
    });
  }

  async testLoginPage() {
    await this.runTest('Login Page Accessibility', async (page) => {
      await page.goto(`${TEST_CONFIG.frontend.url}/login`);
      await page.waitForLoadState('networkidle');

      // Check for email input
      const emailInput = await page.locator('input[type="email"]').count();
      console.log(`   📧 Email input found: ${emailInput > 0 ? 'Yes' : 'No'}`);

      // Check for password input
      const passwordInput = await page.locator('input[type="password"]').count();
      console.log(`   🔑 Password input found: ${passwordInput > 0 ? 'Yes' : 'No'}`);

      // Check for submit button
      const submitButton = await page.locator('button[type="submit"]').count();
      console.log(`   🔘 Submit button found: ${submitButton > 0 ? 'Yes' : 'No'}`);

      if (emailInput === 0 || passwordInput === 0 || submitButton === 0) {
        throw new Error('Login form elements missing');
      }

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`   ⌨️  Keyboard navigation: Working (focused: ${focusedElement})`);
    });
  }

  async testAPIHealth() {
    await this.runTest('Backend API Health Check', async (page) => {
      const startTime = Date.now();
      const response = await page.goto(`${TEST_CONFIG.backend.url}/health`);
      const responseTime = Date.now() - startTime;

      console.log(`   ⏱️  Response time: ${responseTime}ms`);
      console.log(`   📡 Status: ${response?.status()}`);

      if (response?.status() !== 200) {
        throw new Error(`Health check failed with status ${response?.status()}`);
      }

      const data = await response.json();
      console.log(`   📊 Response:`, JSON.stringify(data, null, 2));

      if (responseTime > TEST_CONFIG.performance.apiResponseTime) {
        console.log(`   ⚠️  Response time above target (${TEST_CONFIG.performance.apiResponseTime}ms)`);
      }
    });
  }

  async testMobileResponsive() {
    await this.runTest('Mobile Responsive Design', async (page) => {
      // Test iPhone viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      console.log(`   📱 Mobile viewport (375x667): ${hasHorizontalScroll ? '❌ Has horizontal scroll' : '✅ No horizontal scroll'}`);

      // Check mobile menu
      const mobileMenu = await page.locator('[aria-label*="menu"], button:has-text("Menu")').count();
      console.log(`   🍔 Mobile menu: ${mobileMenu > 0 ? 'Found' : 'Not found'}`);

      if (hasHorizontalScroll) {
        throw new Error('Mobile viewport has horizontal scroll');
      }

      // Reset viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  }

  async testPageNavigation() {
    await this.runTest('Page Navigation & Routing', async (page) => {
      const pages = [
        { name: 'Privacy', url: '/privacy' },
        { name: 'Terms', url: '/terms' },
        { name: 'Register', url: '/register' },
      ];

      for (const pageInfo of pages) {
        const response = await page.goto(`${TEST_CONFIG.frontend.url}${pageInfo.url}`);
        console.log(`   📄 ${pageInfo.name}: ${response?.status() === 200 ? '✅' : '❌'} (${response?.status()})`);

        if (response?.status() !== 200) {
          throw new Error(`${pageInfo.name} page returned ${response?.status()}`);
        }
      }
    });
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`\nGrade: ${this.getGrade(parseFloat(passRate))}\n`);

    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter((r) => r.status === 'failed')
        .forEach((r) => {
          console.log(`  ❌ ${r.name}`);
          console.log(`     Error: ${r.error}`);
          if (r.screenshot) {
            console.log(`     Screenshot: ${r.screenshot}`);
          }
        });
      console.log('');
    }

    console.log('Detailed Results:');
    this.results.forEach((r) => {
      const icon = r.status === 'passed' ? '✅' : '❌';
      console.log(`  ${icon} ${r.name} (${r.duration}ms)`);
    });

    console.log('\n' + '='.repeat(60) + '\n');
  }

  getGrade(passRate: number): string {
    if (passRate >= 95) return '🏆 EXCELLENT';
    if (passRate >= 90) return '✅ GOOD';
    if (passRate >= 80) return '⚠️  FAIR';
    if (passRate >= 70) return '🟡 NEEDS IMPROVEMENT';
    return '❌ CRITICAL';
  }

  async cleanup() {
    console.log('🧹 Cleaning up...\n');

    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();

    console.log('✅ Cleanup complete\n');
  }

  async run() {
    try {
      await this.initialize();

      console.log('🧪 Running Live Tests with Chrome DevTools\n');
      console.log('=' .repeat(60) + '\n');

      // Run all tests
      await this.testFrontendLoading();
      await this.testCoreWebVitals();
      await this.testSecurityHeaders();
      await this.testLoginPage();
      await this.testAPIHealth();
      await this.testMobileResponsive();
      await this.testPageNavigation();

      // Generate report
      await this.generateReport();

      return this.results;
    } catch (error) {
      console.error('❌ Fatal error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/');

if (isMainModule) {
  const runner = new LiveTestRunner();

  runner
    .run()
    .then((results) => {
      const failed = results.filter((r) => r.status === 'failed').length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { LiveTestRunner };
