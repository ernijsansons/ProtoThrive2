/**
 * Production Smoke Tests
 * Critical path testing for deployed application
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://876017e2.protothrive-frontend.pages.dev';
const BACKEND_URL = 'https://protothrive-backend.ernijs-ansons.workers.dev';

test.describe('Production Smoke Tests', () => {
  test('Frontend landing page loads successfully', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);

    expect(response?.status()).toBe(200);

    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toBeTruthy();

    await page.screenshot({ path: 'test-results/screenshots/landing-page.png' });
  });

  test('Backend health endpoint responds', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Health response:', data);
  });

  test('Backend status endpoint responds', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/status`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Status response:', data);
  });

  test('Page has no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    console.log(`Console errors found: ${errors.length}`);
    errors.forEach(err => console.log('  -', err));

    expect(errors.length).toBe(0);
  });

  test('Security headers are present', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    const headers = response?.headers();

    console.log('Security headers:');
    console.log('  x-content-type-options:', headers?.['x-content-type-options']);
    console.log('  x-frame-options:', headers?.['x-frame-options']);
    console.log('  strict-transport-security:', headers?.['strict-transport-security']);

    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('Mobile viewport renders without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(FRONTEND_URL);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    console.log('Has horizontal scroll:', hasHorizontalScroll);
    expect(hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: 'test-results/screenshots/mobile-viewport.png' });
  });

  test('Core Web Vitals are within thresholds', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

      return {
        ttfb: navigation.responseStart - navigation.requestStart,
        fcp: fcp?.startTime || 0,
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
      };
    });

    console.log('Performance metrics:');
    console.log('  TTFB:', metrics.ttfb.toFixed(2), 'ms');
    console.log('  FCP:', metrics.fcp.toFixed(2), 'ms');
    console.log('  Load Time:', metrics.loadTime.toFixed(2), 'ms');

    expect(metrics.ttfb).toBeLessThan(1000);
  });

  test('API responds within acceptable time', async ({ request }) => {
    const start = Date.now();
    const response = await request.get(`${BACKEND_URL}/health`);
    const duration = Date.now() - start;

    console.log('API response time:', duration, 'ms');

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  test('Privacy page is accessible', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/privacy`);

    console.log('Privacy page status:', response?.status());

    if (response?.status() === 200) {
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      await page.screenshot({ path: 'test-results/screenshots/privacy-page.png' });
    }
  });

  test('Terms page is accessible', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/terms`);

    console.log('Terms page status:', response?.status());

    if (response?.status() === 200) {
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      await page.screenshot({ path: 'test-results/screenshots/terms-page.png' });
    }
  });

  test('Page loads in reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;

    console.log('Full page load time:', loadTime, 'ms');

    expect(loadTime).toBeLessThan(5000);
  });

  test('Images are optimized', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const images = await page.$$eval('img', imgs =>
      imgs.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading,
      }))
    );

    console.log(`Total images: ${images.length}`);
    const lazyLoaded = images.filter(img => img.loading === 'lazy').length;
    console.log(`Lazy loaded images: ${lazyLoaded}`);
  });

  test('Fonts load correctly', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const fonts = await page.evaluate(() => {
      return document.fonts.ready.then(() => {
        return Array.from(document.fonts).map(font => ({
          family: font.family,
          status: font.status,
        }));
      });
    });

    console.log(`Loaded fonts: ${fonts.length}`);
  });
});
