/**
 * Advanced Performance Testing
 * Deep performance analysis with Chrome DevTools
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://876017e2.protothrive-frontend.pages.dev';

test.describe('Advanced Performance Tests', () => {
  test('Measure detailed Network Performance', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const networkMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return {
        totalRequests: resources.length,
        totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        cssFiles: resources.filter(r => r.name.endsWith('.css')).length,
        jsFiles: resources.filter(r => r.name.endsWith('.js')).length,
        imageFiles: resources.filter(r => r.initiatorType === 'img').length,
        avgDuration: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length,
      };
    });

    console.log('Network Performance:');
    console.log('  Total Requests:', networkMetrics.totalRequests);
    console.log('  Total Size:', (networkMetrics.totalSize / 1024).toFixed(2), 'KB');
    console.log('  CSS Files:', networkMetrics.cssFiles);
    console.log('  JS Files:', networkMetrics.jsFiles);
    console.log('  Images:', networkMetrics.imageFiles);
    console.log('  Avg Duration:', networkMetrics.avgDuration.toFixed(2), 'ms');

    expect(networkMetrics.totalRequests).toBeLessThan(50);
  });

  test('Analyze JavaScript Execution Time', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const jsMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const scripts = performance.getEntriesByType('resource').filter(
        r => r.initiatorType === 'script' || (r as any).name.endsWith('.js')
      ) as PerformanceResourceTiming[];

      return {
        scriptCount: scripts.length,
        totalScriptDuration: scripts.reduce((sum, s) => sum + s.duration, 0),
        measures: entries.length,
      };
    });

    console.log('JavaScript Metrics:');
    console.log('  Script Files:', jsMetrics.scriptCount);
    console.log('  Total Script Time:', jsMetrics.totalScriptDuration.toFixed(2), 'ms');

    expect(jsMetrics.totalScriptDuration).toBeLessThan(3000);
  });

  test('Check Page Weight', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const pageWeight = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return {
        html: resources.filter(r => r.initiatorType === 'navigation')
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        css: resources.filter(r => r.name.endsWith('.css'))
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        js: resources.filter(r => r.name.endsWith('.js'))
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        images: resources.filter(r => r.initiatorType === 'img')
          .reduce((sum, r) => sum + (r.transferSize || 0), 0),
        total: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      };
    });

    console.log('Page Weight:');
    console.log('  HTML:', (pageWeight.html / 1024).toFixed(2), 'KB');
    console.log('  CSS:', (pageWeight.css / 1024).toFixed(2), 'KB');
    console.log('  JavaScript:', (pageWeight.js / 1024).toFixed(2), 'KB');
    console.log('  Images:', (pageWeight.images / 1024).toFixed(2), 'KB');
    console.log('  Total:', (pageWeight.total / 1024).toFixed(2), 'KB');

    // Page should be under 2MB
    expect(pageWeight.total).toBeLessThan(2 * 1024 * 1024);
  });

  test('Verify Compression is Enabled', async ({ page }) => {
    let hasCompression = false;
    let compressionType = 'none';

    page.on('response', response => {
      const encoding = response.headers()['content-encoding'];
      if (encoding === 'gzip' || encoding === 'br') {
        hasCompression = true;
        compressionType = encoding;
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    console.log('Compression:', hasCompression ? compressionType : 'none');

    expect(hasCompression).toBe(true);
  });

  test('Check Cache Headers', async ({ page }) => {
    const cacheableResources: Array<{ url: string; cacheControl: string | null }> = [];

    page.on('response', response => {
      const cacheControl = response.headers()['cache-control'];
      if (cacheControl) {
        cacheableResources.push({
          url: response.url(),
          cacheControl,
        });
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    console.log(`Resources with Cache Headers: ${cacheableResources.length}`);

    const publicCached = cacheableResources.filter(r => r.cacheControl?.includes('public')).length;
    console.log(`Public Cached: ${publicCached}`);

    expect(cacheableResources.length).toBeGreaterThan(0);
  });

  test('Measure Time to Interactive', async ({ page }) => {
    const start = Date.now();
    await page.goto(FRONTEND_URL);

    // Wait for page to be interactive
    await page.waitForFunction(() => document.readyState === 'complete');

    const tti = Date.now() - start;

    console.log('Time to Interactive:', tti, 'ms');

    expect(tti).toBeLessThan(5000);
  });

  test('Check for Render-Blocking Resources', async ({ page }) => {
    const renderBlockingResources: string[] = [];

    page.on('request', request => {
      const url = request.url();
      const resourceType = request.resourceType();

      // CSS and sync scripts in head are render-blocking
      if (resourceType === 'stylesheet' || (resourceType === 'script' && !request.isNavigationRequest())) {
        renderBlockingResources.push(url);
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    console.log(`Render-blocking resources: ${renderBlockingResources.length}`);

    renderBlockingResources.forEach(url => {
      console.log('  -', url);
    });

    expect(renderBlockingResources.length).toBeLessThan(10);
  });

  test('Verify CDN Usage', async ({ page }) => {
    const cdnResources: string[] = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('cdn') || url.includes('.pages.dev') || url.includes('cloudflare')) {
        cdnResources.push(url);
      }
    });

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    console.log(`CDN Resources: ${cdnResources.length}`);

    expect(cdnResources.length).toBeGreaterThan(0);
  });

  test('Analyze DOM Complexity', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const domStats = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const depth = (el: Element, level = 0): number => {
        let maxDepth = level;
        Array.from(el.children).forEach(child => {
          const childDepth = depth(child, level + 1);
          maxDepth = Math.max(maxDepth, childDepth);
        });
        return maxDepth;
      };

      return {
        totalElements: allElements.length,
        maxDepth: depth(document.body),
        scriptsInline: document.querySelectorAll('script:not([src])').length,
        scriptsExternal: document.querySelectorAll('script[src]').length,
      };
    });

    console.log('DOM Statistics:');
    console.log('  Total Elements:', domStats.totalElements);
    console.log('  Max Depth:', domStats.maxDepth);
    console.log('  Inline Scripts:', domStats.scriptsInline);
    console.log('  External Scripts:', domStats.scriptsExternal);

    expect(domStats.totalElements).toBeLessThan(1500);
    expect(domStats.maxDepth).toBeLessThan(30);
  });

  test('Check Memory Usage', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    const memoryInfo = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (memoryInfo) {
      const usedMB = (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2);

      console.log('Memory Usage:');
      console.log('  Used:', usedMB, 'MB');
      console.log('  Total:', totalMB, 'MB');

      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });
});
