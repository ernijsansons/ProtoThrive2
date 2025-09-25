/**
 * Performance E2E Tests for ProtoThrive
 * Tests application performance, load times, and user experience metrics
 *
 * Ref: CLAUDE.md Phase 3 - Performance Testing Framework
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, RoadmapHelper, PerformanceHelper, setupMockAPIs } from './utils/test-helpers';
import { testProjects } from './fixtures/test-data';

test.describe('Performance Testing', () => {
  let authHelper: AuthHelper;
  let roadmapHelper: RoadmapHelper;
  let performanceHelper: PerformanceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    roadmapHelper = new RoadmapHelper(page);
    performanceHelper = new PerformanceHelper(page);
    await setupMockAPIs(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load landing page within performance budget', async ({ page }) => {
      const metrics = await performanceHelper.measurePageLoad('/');

      // Page should load within 3 seconds
      expect(metrics.loadTime).toBeLessThan(3000);

      // Time to interactive should be reasonable
      expect(metrics.timeToInteractive).toBeLessThan(5000);

      console.log('Landing page metrics:', metrics);
    });

    test('should load dashboard efficiently for authenticated users', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      const metrics = await performanceHelper.measurePageLoad('/dashboard');

      // Dashboard should load within 4 seconds (more complex page)
      expect(metrics.loadTime).toBeLessThan(4000);

      // Should have reasonable DOM content loaded time
      expect(metrics.domContentLoaded).toBeLessThan(2000);

      console.log('Dashboard metrics:', metrics);
    });

    test('should handle cold starts efficiently', async ({ page }) => {
      // Clear all storage to simulate cold start
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      const metrics = await performanceHelper.measurePageLoad('/');

      // Cold start should still be reasonable
      expect(metrics.loadTime).toBeLessThan(5000);

      console.log('Cold start metrics:', metrics);
    });

    test('should benefit from caching on subsequent loads', async ({ page }) => {
      // First load
      const firstLoadMetrics = await performanceHelper.measurePageLoad('/');

      // Second load (should be faster due to caching)
      const secondLoadMetrics = await performanceHelper.measurePageLoad('/');

      // Second load should be faster or similar
      expect(secondLoadMetrics.loadTime).toBeLessThanOrEqual(firstLoadMetrics.loadTime + 500);

      console.log('Caching comparison:', {
        firstLoad: firstLoadMetrics.loadTime,
        secondLoad: secondLoadMetrics.loadTime
      });
    });
  });

  test.describe('Interaction Performance', () => {
    test('should respond quickly to user interactions', async ({ page }) => {
      await authHelper.loginWithDeveloper();
      await page.goto('/dashboard');

      // Measure canvas mode toggle
      const toggleTime = await performanceHelper.measureInteraction(async () => {
        await page.click('[data-testid="mode-toggle"]');
        await page.waitForSelector('[data-testid="3d-canvas"]');
      });

      expect(toggleTime).toBeLessThan(1000);

      // Measure insights panel toggle
      const panelToggleTime = await performanceHelper.measureInteraction(async () => {
        await page.click('[data-testid="insights-panel-toggle"]');
        await page.waitForSelector('[data-testid="insights-panel"][data-expanded="true"]');
      });

      expect(panelToggleTime).toBeLessThan(500);

      console.log('Interaction timings:', { toggleTime, panelToggleTime });
    });

    test('should handle roadmap generation efficiently', async ({ page }) => {
      await authHelper.loginWithDeveloper();
      await page.goto('/dashboard');

      const generationTime = await performanceHelper.measureInteraction(async () => {
        await page.click('[data-testid="create-roadmap-button"]');
        await page.fill('[data-testid="vision-input"]', testProjects.simpleWebApp.vision);
        await page.selectOption('[data-testid="project-type-select"]', 'web_platform');
        await page.click('[data-testid="generate-button"]');
        await page.waitForSelector('[data-testid="roadmap-node"]');
      });

      // Roadmap generation should complete within 8 seconds
      expect(generationTime).toBeLessThan(8000);

      console.log('Roadmap generation time:', generationTime);
    });

    test('should maintain smooth scrolling and animations', async ({ page }) => {
      await authHelper.loginWithDeveloper();
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      // Test canvas panning performance
      const panTime = await performanceHelper.measureInteraction(async () => {
        const canvas = page.locator('[data-testid="magic-canvas"]');
        await canvas.hover();

        // Simulate smooth panning
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(i * 10, i * 5);
          await page.waitForTimeout(16); // ~60fps
        }
      });

      // Panning should be smooth
      expect(panTime).toBeLessThan(1000);

      console.log('Canvas panning performance:', panTime);
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should maintain reasonable memory usage', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      const initialMemory = await performanceHelper.checkMemoryUsage();

      // Create multiple roadmaps to test memory usage
      for (let i = 0; i < 3; i++) {
        await roadmapHelper.createRoadmapFromVision(`Test project ${i}`, 'web_platform');
        await page.goto('/dashboard'); // Navigate away and back
      }

      const finalMemory = await performanceHelper.checkMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

        console.log('Memory usage:', {
          initial: initialMemory.usedJSHeapSize,
          final: finalMemory.usedJSHeapSize,
          increase: memoryIncrease
        });
      }
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Create a roadmap with many nodes
      const complexVision = 'Build a comprehensive platform with ' +
        Array(20).fill('feature').map((f, i) => `${f}${i}`).join(', ');

      const startMemory = await performanceHelper.checkMemoryUsage();

      await roadmapHelper.createRoadmapFromVision(complexVision, 'web_platform');

      const endMemory = await performanceHelper.checkMemoryUsage();

      // Should handle complex roadmaps without excessive memory usage
      if (startMemory && endMemory) {
        const memoryIncrease = endMemory.usedJSHeapSize - startMemory.usedJSHeapSize;
        expect(memoryIncrease).toBeLessThan(30 * 1024 * 1024); // Less than 30MB increase
      }

      // Canvas should remain responsive
      const canvas = page.locator('[data-testid="magic-canvas"]');
      await canvas.hover();
      await page.mouse.wheel(0, -100);

      // Nodes should still be visible after zoom
      await expect(page.locator('[data-testid="roadmap-node"]').first()).toBeVisible();
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      await authHelper.loginWithDeveloper();

      const metrics = await performanceHelper.measurePageLoad('/dashboard');

      // Should still load within reasonable time on slow network
      expect(metrics.loadTime).toBeLessThan(8000);

      console.log('Slow network metrics:', metrics);
    });

    test('should optimize API call patterns', async ({ page }) => {
      const apiCalls: string[] = [];

      // Track API calls
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiCalls.push(request.url());
        }
      });

      await authHelper.loginWithDeveloper();
      await page.goto('/dashboard');

      // Should not make excessive API calls on page load
      expect(apiCalls.length).toBeLessThan(10);

      // Should not have duplicate calls for the same resource
      const uniqueCalls = new Set(apiCalls);
      expect(uniqueCalls.size).toBe(apiCalls.length);

      console.log('API calls made:', apiCalls);
    });

    test('should handle API failures without blocking UI', async ({ page }) => {
      // Mock some API failures
      await page.route('**/api/analytics/**', async route => {
        await route.fulfill({ status: 500 });
      });

      await authHelper.loginWithDeveloper();

      const loadTime = await performanceHelper.measureInteraction(async () => {
        await page.goto('/dashboard');
        await page.waitForSelector('[data-testid="magic-canvas"]');
      });

      // UI should load despite API failures
      expect(loadTime).toBeLessThan(5000);

      // Core functionality should work
      await expect(page.locator('[data-testid="create-roadmap-button"]')).toBeVisible();
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await authHelper.loginWithDeveloper();

      const metrics = await performanceHelper.measurePageLoad('/dashboard');

      // Mobile should load within 6 seconds
      expect(metrics.loadTime).toBeLessThan(6000);

      // Test mobile interactions
      const touchTime = await performanceHelper.measureInteraction(async () => {
        await page.tap('[data-testid="mode-toggle"]');
        await page.waitForTimeout(500);
      });

      expect(touchTime).toBeLessThan(1000);

      console.log(`Mobile performance (${browserName}):`, metrics);
    });

    test('should handle touch gestures efficiently', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await authHelper.loginWithDeveloper();
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      // Test pinch zoom on canvas
      const canvas = page.locator('[data-testid="magic-canvas"]');

      const gestureTime = await performanceHelper.measureInteraction(async () => {
        await canvas.hover();

        // Simulate pinch zoom
        await page.touchscreen.tap(200, 200);
        await page.mouse.wheel(0, -300);

        await page.waitForTimeout(500);
      });

      expect(gestureTime).toBeLessThan(1000);

      // Canvas should remain functional
      await expect(page.locator('[data-testid="roadmap-node"]').first()).toBeVisible();
    });
  });

  test.describe('Bundle Size and Loading', () => {
    test('should have optimized bundle sizes', async ({ page }) => {
      const resourceSizes: Record<string, number> = {};

      page.on('response', response => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          const size = parseInt(response.headers()['content-length'] || '0');
          if (size > 0) {
            resourceSizes[url] = size;
          }
        }
      });

      await page.goto('/');

      // Main bundle should be reasonably sized
      const mainBundle = Object.entries(resourceSizes)
        .find(([url]) => url.includes('main') || url.includes('index'));

      if (mainBundle) {
        // Main bundle should be less than 1MB
        expect(mainBundle[1]).toBeLessThan(1024 * 1024);
      }

      console.log('Bundle sizes:', resourceSizes);
    });

    test('should implement code splitting effectively', async ({ page }) => {
      const loadedChunks: string[] = [];

      page.on('response', response => {
        if (response.url().includes('.js') && response.status() === 200) {
          loadedChunks.push(response.url());
        }
      });

      // Initial page load
      await page.goto('/');
      const initialChunks = loadedChunks.length;

      // Navigate to dashboard (should load additional chunks)
      await authHelper.loginWithDeveloper();
      await page.goto('/dashboard');
      const dashboardChunks = loadedChunks.length;

      // Should load additional chunks for dashboard
      expect(dashboardChunks).toBeGreaterThan(initialChunks);

      // But not excessive number of chunks
      expect(dashboardChunks).toBeLessThan(initialChunks + 10);

      console.log('Code splitting - chunks loaded:', {
        initial: initialChunks,
        dashboard: dashboardChunks
      });
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should track core web vitals', async ({ page }) => {
      await page.goto('/');

      // Get core web vitals
      const vitals = await page.evaluate(() => {
        return new Promise(resolve => {
          const vitals: Record<string, number> = {};

          // Largest Contentful Paint
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay would require actual user interaction
          // Cumulative Layout Shift
          new PerformanceObserver(list => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          // Wait a bit for measurements
          setTimeout(() => resolve(vitals), 3000);
        });
      });

      console.log('Core Web Vitals:', vitals);

      // Basic performance expectations
      if ((vitals as any).lcp) {
        expect((vitals as any).lcp).toBeLessThan(4000); // LCP should be under 4s
      }
      if ((vitals as any).cls) {
        expect((vitals as any).cls).toBeLessThan(0.25); // CLS should be under 0.25
      }
    });
  });
});

console.log('Thermonuclear E2E: Performance tests initialized for comprehensive coverage');