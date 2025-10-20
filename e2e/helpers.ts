/**
 * Test Helper Functions
 * Reusable utilities for E2E testing
 */

import { Page, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';

/**
 * Login helper - authenticates user and stores token
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto(TEST_CONFIG.frontend.pages.login);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: TEST_CONFIG.timeouts.navigation });

  // Verify we're logged in
  await expect(page).toHaveURL(/.*dashboard/);
}

/**
 * Register new user helper
 */
export async function register(page: Page, name: string, email: string, password: string) {
  await page.goto(TEST_CONFIG.frontend.pages.register);
  await page.fill('input[name="name"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for success or dashboard redirect
  await page.waitForTimeout(2000);
}

/**
 * Get performance metrics using Navigation Timing API
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    return {
      // Navigation Timing API
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      download: timing.responseEnd - timing.responseStart,
      domInteractive: timing.domInteractive - timing.navigationStart,
      domComplete: timing.domComplete - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,

      // Navigation Timing Level 2
      redirectTime: navigation.redirectEnd - navigation.redirectStart,
      cacheTime: navigation.domainLookupStart - navigation.fetchStart,
      dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpTime: navigation.connectEnd - navigation.connectStart,
      requestTime: navigation.responseStart - navigation.requestStart,
      responseTime: navigation.responseEnd - navigation.responseStart,
      processingTime: navigation.domComplete - navigation.domLoading,
      onLoadTime: navigation.loadEventEnd - navigation.loadEventStart,

      // Total time
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    };
  });
}

/**
 * Measure Core Web Vitals
 */
export async function getCoreWebVitals(page: Page) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0,
      };

      // LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        vitals.fcp = firstEntry.startTime;
      }).observe({ entryTypes: ['paint'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // TTFB (Time to First Byte)
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      vitals.ttfb = navigation.responseStart - navigation.requestStart;

      // Wait 3 seconds to collect metrics
      setTimeout(() => resolve(vitals), 3000);
    });
  });
}

/**
 * Check accessibility issues using axe-core
 */
export async function checkAccessibility(page: Page) {
  // Inject axe-core
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/axe-core@4.7.2/axe.min.js',
  });

  // Run axe
  const results = await page.evaluate(() => {
    return new Promise((resolve) => {
      (window as any).axe.run().then((results: any) => {
        resolve({
          violations: results.violations.length,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
          details: results.violations,
        });
      });
    });
  });

  return results;
}

/**
 * Capture full page screenshot
 */
export async function captureScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp, timeout = 10000) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Check for console errors
 */
export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Test security headers
 */
export async function checkSecurityHeaders(page: Page, url: string) {
  const response = await page.goto(url);
  const headers = response?.headers() || {};

  return {
    csp: headers['content-security-policy'] || null,
    xFrameOptions: headers['x-frame-options'] || null,
    xContentTypeOptions: headers['x-content-type-options'] || null,
    strictTransportSecurity: headers['strict-transport-security'] || null,
    xXSSProtection: headers['x-xss-protection'] || null,
    referrerPolicy: headers['referrer-policy'] || null,
  };
}

/**
 * Measure API response time
 */
export async function measureAPIResponseTime(url: string, options?: RequestInit): Promise<number> {
  const start = Date.now();
  await fetch(url, options);
  return Date.now() - start;
}

/**
 * Test responsive design at different viewport sizes
 */
export async function testResponsive(page: Page, url: string, viewports: Array<{ width: number; height: number }>) {
  const results: any[] = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    results.push({
      viewport,
      screenshot: await page.screenshot(),
      metrics: await getPerformanceMetrics(page),
    });
  }

  return results;
}

/**
 * Check for broken links on page
 */
export async function checkBrokenLinks(page: Page) {
  const links = await page.$$eval('a[href]', (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href)
  );

  const results = [];
  for (const link of links) {
    try {
      const response = await fetch(link, { method: 'HEAD' });
      results.push({
        url: link,
        status: response.status,
        ok: response.ok,
      });
    } catch (error) {
      results.push({
        url: link,
        status: 0,
        ok: false,
        error: (error as Error).message,
      });
    }
  }

  return results;
}

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@protothrive-qa.com`;
}

/**
 * Generate strong password
 */
export function generateStrongPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
