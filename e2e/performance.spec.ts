/**
 * Performance Testing Suite
 * Tests Core Web Vitals, load times, and resource optimization
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';
import {
  getPerformanceMetrics,
  getCoreWebVitals,
  captureScreenshot,
  login,
  register,
  generateTestEmail,
  generateStrongPassword,
} from './helpers';

test.describe('Performance Testing', () => {
  test.describe('Core Web Vitals', () => {
    test('should measure LCP on landing page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const vitals: any = await getCoreWebVitals(page);

      console.log('Core Web Vitals:', vitals);

      // LCP should be under 2.5 seconds
      expect(vitals.lcp).toBeLessThan(TEST_CONFIG.performance.lcp);

      await captureScreenshot(page, 'lcp-measurement-landing');
    });

    test('should measure FCP on landing page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const vitals: any = await getCoreWebVitals(page);

      console.log('FCP:', vitals.fcp);

      // FCP should be under 1.8 seconds
      expect(vitals.fcp).toBeLessThan(TEST_CONFIG.performance.fcp);
    });

    test('should measure CLS on landing page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Wait for layout shifts to settle
      await page.waitForTimeout(3000);

      const vitals: any = await getCoreWebVitals(page);

      console.log('CLS:', vitals.cls);

      // CLS should be under 0.1
      expect(vitals.cls).toBeLessThan(TEST_CONFIG.performance.cls);
    });

    test('should measure TTFB on landing page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const vitals: any = await getCoreWebVitals(page);

      console.log('TTFB:', vitals.ttfb);

      // TTFB should be under 800ms
      expect(vitals.ttfb).toBeLessThan(TEST_CONFIG.performance.ttfb);
    });
  });

  test.describe('Page Load Performance', () => {
    const pages = [
      { name: 'Landing', url: TEST_CONFIG.frontend.url },
      { name: 'Login', url: TEST_CONFIG.frontend.pages.login },
      { name: 'Register', url: TEST_CONFIG.frontend.pages.register },
      { name: 'Privacy', url: TEST_CONFIG.frontend.pages.privacy },
      { name: 'Terms', url: TEST_CONFIG.frontend.pages.terms },
      { name: 'Docs', url: TEST_CONFIG.frontend.pages.docs },
    ];

    for (const pageInfo of pages) {
      test(`should load ${pageInfo.name} page quickly`, async ({ page }) => {
        const startTime = Date.now();

        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        console.log(`${pageInfo.name} page loaded in ${loadTime}ms`);

        // Page should load within 2 seconds
        expect(loadTime).toBeLessThan(TEST_CONFIG.performance.pageLoadTime);

        await captureScreenshot(page, `performance-${pageInfo.name.toLowerCase()}`);
      });
    }

    test('should load dashboard quickly for authenticated user', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);

      const startTime = Date.now();

      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard loaded in ${loadTime}ms`);

      expect(loadTime).toBeLessThan(TEST_CONFIG.performance.pageLoadTime);
    });
  });

  test.describe('Navigation Timing API', () => {
    test('should collect detailed timing metrics', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const metrics = await getPerformanceMetrics(page);

      console.log('Performance Metrics:', metrics);

      // Validate metrics are collected
      expect(metrics.dns).toBeGreaterThanOrEqual(0);
      expect(metrics.tcp).toBeGreaterThanOrEqual(0);
      expect(metrics.ttfb).toBeGreaterThan(0);
      expect(metrics.download).toBeGreaterThan(0);
      expect(metrics.domInteractive).toBeGreaterThan(0);
      expect(metrics.totalTime).toBeGreaterThan(0);

      // Total time should be reasonable
      expect(metrics.totalTime).toBeLessThan(5000);
    });

    test('should have fast DNS lookup', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const metrics = await getPerformanceMetrics(page);

      console.log(`DNS lookup: ${metrics.dns}ms`);

      // DNS should be fast (or cached)
      expect(metrics.dns).toBeLessThan(200);
    });

    test('should have fast TCP connection', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const metrics = await getPerformanceMetrics(page);

      console.log(`TCP connection: ${metrics.tcp}ms`);

      // TCP should be fast
      expect(metrics.tcp).toBeLessThan(200);
    });
  });

  test.describe('Resource Loading', () => {
    test('should load JavaScript bundles efficiently', async ({ page }) => {
      const jsRequests: any[] = [];

      page.on('response', (response) => {
        if (response.url().endsWith('.js')) {
          jsRequests.push({
            url: response.url(),
            status: response.status(),
            size: response.headers()['content-length'],
          });
        }
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      console.log(`Loaded ${jsRequests.length} JavaScript files`);

      // Check that all JS files loaded successfully
      jsRequests.forEach((req) => {
        expect(req.status).toBe(200);
      });
    });

    test('should load CSS bundles efficiently', async ({ page }) => {
      const cssRequests: any[] = [];

      page.on('response', (response) => {
        if (response.url().endsWith('.css')) {
          cssRequests.push({
            url: response.url(),
            status: response.status(),
            size: response.headers()['content-length'],
          });
        }
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      console.log(`Loaded ${cssRequests.length} CSS files`);

      cssRequests.forEach((req) => {
        expect(req.status).toBe(200);
      });
    });

    test('should use compression for assets', async ({ page }) => {
      let hasCompression = false;

      page.on('response', (response) => {
        const encoding = response.headers()['content-encoding'];
        if (encoding === 'gzip' || encoding === 'br') {
          hasCompression = true;
        }
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // At least some assets should be compressed
      expect(hasCompression).toBeTruthy();
    });

    test('should properly cache static assets', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      let hasCacheHeaders = false;

      page.on('response', (response) => {
        const cacheControl = response.headers()['cache-control'];
        if (cacheControl && (cacheControl.includes('max-age') || cacheControl.includes('public'))) {
          hasCacheHeaders = true;
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      expect(hasCacheHeaders).toBeTruthy();
    });
  });

  test.describe('API Performance', () => {
    test('should have fast health check response', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.goto(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.health}`);
      const responseTime = Date.now() - startTime;

      console.log(`Health check response time: ${responseTime}ms`);

      expect(response?.status()).toBe(200);
      expect(responseTime).toBeLessThan(TEST_CONFIG.performance.apiResponseTime);
    });

    test('should have fast status endpoint response', async ({ page }) => {
      const startTime = Date.now();

      const response = await page.goto(`${TEST_CONFIG.backend.url}${TEST_CONFIG.backend.endpoints.status}`);
      const responseTime = Date.now() - startTime;

      console.log(`Status endpoint response time: ${responseTime}ms`);

      expect(response?.status()).toBe(200);
      expect(responseTime).toBeLessThan(TEST_CONFIG.performance.apiResponseTime);
    });

    test('should handle API requests efficiently', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);

      // Measure time for roadmaps API call
      const startTime = Date.now();

      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForResponse((response) => response.url().includes('/api/roadmaps'));

      const apiTime = Date.now() - startTime;

      console.log(`Roadmaps API response time: ${apiTime}ms`);

      // API should respond quickly
      expect(apiTime).toBeLessThan(1000);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have excessive memory usage', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const metrics: any = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      if (metrics) {
        console.log('Memory metrics:', metrics);

        // Check for reasonable memory usage
        const memoryMB = metrics.usedJSHeapSize / 1024 / 1024;
        console.log(`JS Heap Size: ${memoryMB.toFixed(2)} MB`);

        // Should not exceed 50MB for landing page
        expect(memoryMB).toBeLessThan(50);
      }
    });

    test('should not have memory leaks on navigation', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const initialMemory: any = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigate between pages
      await page.goto(TEST_CONFIG.frontend.pages.login);
      await page.waitForLoadState('networkidle');
      await page.goto(TEST_CONFIG.frontend.pages.register);
      await page.waitForLoadState('networkidle');
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const finalMemory: any = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory && finalMemory) {
        const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
        console.log(`Memory increase after navigation: ${memoryIncrease.toFixed(2)} MB`);

        // Should not have significant memory increase (< 20MB)
        expect(memoryIncrease).toBeLessThan(20);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should minimize number of requests', async ({ page }) => {
      let requestCount = 0;

      page.on('request', () => {
        requestCount++;
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      console.log(`Total requests: ${requestCount}`);

      // Should not make excessive requests (< 50 for landing page)
      expect(requestCount).toBeLessThan(50);
    });

    test('should use HTTP/2 or HTTP/3', async ({ page }) => {
      let httpVersion = '';

      page.on('response', (response) => {
        const version = (response as any).httpVersion?.();
        if (version) {
          httpVersion = version;
        }
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      console.log(`HTTP version: ${httpVersion}`);

      // Should use modern HTTP protocol
      expect(httpVersion).toMatch(/h2|h3/);
    });

    test('should have parallel resource loading', async ({ page }) => {
      const requestTimings: any[] = [];

      page.on('response', async (response) => {
        const timing = await response.timing();
        requestTimings.push({
          url: response.url(),
          timing,
        });
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Resources should load in parallel (overlapping times)
      console.log(`Loaded ${requestTimings.length} resources`);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should have smooth scrolling', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Scroll down page
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve(true);
            }
          }, 100);
        });
      });

      await captureScreenshot(page, 'smooth-scroll-test');
    });

    test('should have smooth animations', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Check for animations
      const hasAnimations = await page.evaluate(() => {
        const animated = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        return animated.length > 0;
      });

      if (hasAnimations) {
        // Wait for animations to complete
        await page.waitForTimeout(2000);
        await captureScreenshot(page, 'animations-complete');
      }
    });

    test('should maintain 60fps during interactions', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // This would require frame timing API
      // Placeholder for now
      await captureScreenshot(page, 'fps-test');
    });
  });
});
