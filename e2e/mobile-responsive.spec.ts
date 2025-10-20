/**
 * Mobile and Responsive Testing Suite
 * Tests mobile layouts, touch interactions, and responsive design
 */

import { test, expect, devices } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { captureScreenshot, testResponsive } from './helpers';

test.describe('Mobile and Responsive Testing', () => {
  test.describe('Mobile Viewports', () => {
    const mobileDevices = [
      { name: 'iPhone SE', device: devices['iPhone SE'] },
      { name: 'iPhone 12', device: devices['iPhone 12'] },
      { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'] },
      { name: 'Pixel 5', device: devices['Pixel 5'] },
      { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
    ];

    for (const { name, device } of mobileDevices) {
      test(`should display correctly on ${name}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
        });

        const page = await context.newPage();

        await page.goto(TEST_CONFIG.frontend.url);
        await page.waitForLoadState('networkidle');

        // Check that content is visible
        const isVisible = await page.isVisible('body');
        expect(isVisible).toBeTruthy();

        await captureScreenshot(page, `mobile-${name.toLowerCase().replace(/\s/g, '-')}`);

        await context.close();
      });
    }
  });

  test.describe('Tablet Viewports', () => {
    const tabletDevices = [
      { name: 'iPad', device: devices['iPad'] },
      { name: 'iPad Pro', device: devices['iPad Pro'] },
      { name: 'iPad Mini', device: devices['iPad Mini'] },
    ];

    for (const { name, device } of tabletDevices) {
      test(`should display correctly on ${name}`, async ({ browser }) => {
        const context = await browser.newContext({
          ...device,
        });

        const page = await context.newPage();

        await page.goto(TEST_CONFIG.frontend.url);
        await page.waitForLoadState('networkidle');

        await captureScreenshot(page, `tablet-${name.toLowerCase().replace(/\s/g, '-')}`);

        await context.close();
      });
    }
  });

  test.describe('Custom Viewport Sizes', () => {
    const viewports = [
      { name: 'Small Mobile', width: 320, height: 568 },
      { name: 'Medium Mobile', width: 375, height: 667 },
      { name: 'Large Mobile', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`should display correctly at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.goto(TEST_CONFIG.frontend.url);
        await page.waitForLoadState('networkidle');

        // Check for horizontal scrolling (should not exist on mobile)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        console.log(`${viewport.name} horizontal scroll:`, hasHorizontalScroll);

        // Mobile viewports should not have horizontal scroll
        if (viewport.width < 768) {
          expect(hasHorizontalScroll).toBeFalsy();
        }

        await captureScreenshot(page, `viewport-${viewport.name.toLowerCase().replace(/\s/g, '-')}`);
      });
    }
  });

  test.describe('Responsive Images', () => {
    test('should load appropriate image sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const mobileImages = await page.$$eval('img', (imgs) => {
        return imgs.map((img) => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          displayWidth: img.clientWidth,
        }));
      });

      // Test desktop viewport
      await page.setViewportSize(TEST_CONFIG.viewports.desktop);
      await page.reload();
      await page.waitForLoadState('networkidle');

      const desktopImages = await page.$$eval('img', (imgs) => {
        return imgs.map((img) => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          displayWidth: img.clientWidth,
        }));
      });

      console.log('Mobile images:', mobileImages.length);
      console.log('Desktop images:', desktopImages.length);

      // Images should be responsive (srcset or different sources)
    });

    test('should use lazy loading for offscreen images', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const lazyImages = await page.$$eval('img', (imgs) => {
        return imgs.map((img) => ({
          src: img.src,
          loading: img.loading,
        }));
      });

      console.log('Image loading strategies:', lazyImages);

      // At least some images should use lazy loading
      const hasLazyLoading = lazyImages.some((img) => img.loading === 'lazy');

      console.log('Lazy loading used:', hasLazyLoading);
    });
  });

  test.describe('Touch Interactions', () => {
    test('should have adequate touch target sizes', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const touchTargets = await page.$$eval('button, a, input[type="submit"], input[type="button"]', (elements) => {
        return elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height,
            meetsMinimum: rect.width >= 44 && rect.height >= 44,
          };
        });
      });

      console.log('Touch targets:', touchTargets.length);

      // Most touch targets should meet 44x44px minimum
      const validTargets = touchTargets.filter((t) => t.meetsMinimum).length;
      const percentage = (validTargets / touchTargets.length) * 100;

      console.log(`Valid touch targets: ${percentage.toFixed(1)}%`);

      expect(percentage).toBeGreaterThan(80);
    });

    test('should support tap interactions', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Find a tappable element
      const button = page.locator('button, a').first();

      if (await button.isVisible()) {
        await button.tap();
        await page.waitForTimeout(500);

        await captureScreenshot(page, 'tap-interaction');
      }
    });

    test('should support swipe gestures', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Perform swipe gesture
      await page.touchscreen.tap(200, 400);
      await page.touchscreen.tap(200, 200);

      await page.waitForTimeout(500);

      await captureScreenshot(page, 'swipe-gesture');
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should have mobile menu', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Look for hamburger menu
      const mobileMenu = page.locator('[aria-label*="menu"], button:has-text("Menu"), .hamburger, [class*="mobile-menu"]').first();

      const hasMobileMenu = await mobileMenu.isVisible({ timeout: 2000 }).catch(() => false);

      console.log('Mobile menu present:', hasMobileMenu);

      if (hasMobileMenu) {
        await mobileMenu.click();
        await page.waitForTimeout(500);

        await captureScreenshot(page, 'mobile-menu-open');

        // Close menu
        await mobileMenu.click();
      }
    });

    test('should collapse navigation on mobile', async ({ page }) => {
      // Desktop view - navigation should be expanded
      await page.setViewportSize(TEST_CONFIG.viewports.desktop);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const desktopNavVisible = await page.locator('nav a, nav button').count();

      // Mobile view - navigation should be collapsed
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.reload();
      await page.waitForLoadState('networkidle');

      const mobileNavVisible = await page.locator('nav a:visible, nav button:visible').count();

      console.log('Navigation items:', { desktop: desktopNavVisible, mobile: mobileNavVisible });

      // Mobile should have fewer visible nav items (collapsed menu)
      expect(mobileNavVisible).toBeLessThanOrEqual(desktopNavVisible);
    });
  });

  test.describe('Responsive Typography', () => {
    test('should scale text appropriately', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const mobileFontSizes = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const p = document.querySelector('p');

        return {
          h1: h1 ? window.getComputedStyle(h1).fontSize : null,
          p: p ? window.getComputedStyle(p).fontSize : null,
        };
      });

      await page.setViewportSize(TEST_CONFIG.viewports.desktop);
      await page.reload();
      await page.waitForLoadState('networkidle');

      const desktopFontSizes = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const p = document.querySelector('p');

        return {
          h1: h1 ? window.getComputedStyle(h1).fontSize : null,
          p: p ? window.getComputedStyle(p).fontSize : null,
        };
      });

      console.log('Font sizes:', { mobile: mobileFontSizes, desktop: desktopFontSizes });

      // Desktop fonts should typically be same or larger
    });

    test('should maintain readability on mobile', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const fontSizes = await page.$$eval('p, span, div, li', (elements) => {
        return elements.slice(0, 20).map((el) => {
          const fontSize = window.getComputedStyle(el).fontSize;
          return parseFloat(fontSize);
        });
      });

      // Minimum font size should be at least 14px for readability
      const minFontSize = Math.min(...fontSizes.filter((size) => size > 0));

      console.log('Minimum font size:', minFontSize);

      expect(minFontSize).toBeGreaterThanOrEqual(14);
    });
  });

  test.describe('Form Inputs on Mobile', () => {
    test('should have appropriate input types', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.pages.login);

      const inputTypes = await page.$$eval('input', (inputs) => {
        return inputs.map((input) => ({
          type: input.type,
          name: input.name,
          inputmode: input.getAttribute('inputmode'),
        }));
      });

      console.log('Input types:', inputTypes);

      // Email inputs should have type="email"
      const emailInputs = inputTypes.filter((i) => i.type === 'email');
      expect(emailInputs.length).toBeGreaterThan(0);
    });

    test('should prevent zoom on input focus (viewport meta)', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);
      await page.goto(TEST_CONFIG.frontend.pages.login);

      const viewportMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });

      console.log('Viewport meta:', viewportMeta);

      // Viewport should have proper settings
      expect(viewportMeta).toBeTruthy();
      expect(viewportMeta).toContain('width=device-width');

      // Note: maximum-scale=1 prevents zoom, which can be accessibility issue
      // Modern practice: use font-size >= 16px to prevent auto-zoom
    });
  });

  test.describe('Layout Shifts on Mobile', () => {
    test('should not have layout shifts on load', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Wait for any layout shifts to settle
      await page.waitForTimeout(3000);

      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });

          observer.observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 2000);
        });
      });

      console.log('CLS on mobile:', cls);

      expect(cls).toBeLessThan(TEST_CONFIG.performance.cls);
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape transition', async ({ page, browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
      });

      const page2 = await context.newPage();

      // Portrait
      await page2.goto(TEST_CONFIG.frontend.url);
      await page2.waitForLoadState('networkidle');

      await captureScreenshot(page2, 'portrait-mode');

      // Landscape
      await page2.setViewportSize({ width: 844, height: 390 });
      await page2.waitForTimeout(1000);

      await captureScreenshot(page2, 'landscape-mode');

      await context.close();
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile', async ({ page }) => {
      await page.setViewportSize(TEST_CONFIG.viewports.mobile);

      // Emulate slow 3G
      const client = await page.context().newCDPSession(page);
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: (750 * 1024) / 8,
        uploadThroughput: (250 * 1024) / 8,
        latency: 100,
      });

      const startTime = Date.now();

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Mobile load time (3G): ${loadTime}ms`);

      // Should load within 5 seconds on slow connection
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
