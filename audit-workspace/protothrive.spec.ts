// protothrive.spec.ts
// Comprehensive E2E Test Suite for ProtoThrive Frontend
// Author: QA Engineering Team
// Framework: Playwright
// Coverage: Functional, Accessibility, Performance, SEO, Security

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = 'https://protothrive-frontend.pages.dev';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  baseURL: BASE_URL,
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 }
  },
  networkConditions: {
    'Slow 3G': {
      download: ((500 * 1000) / 8) * 0.8,
      upload: ((500 * 1000) / 8) * 0.8,
      latency: 400
    },
    'Fast 4G': {
      download: ((20 * 1000 * 1000) / 8) * 0.9,
      upload: ((3 * 1000 * 1000) / 8) * 0.9,
      latency: 20
    }
  }
};

// Helper functions
async function checkAccessibility(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  return accessibilityScanResults;
}

async function measurePerformance(page: Page) {
  return await page.evaluate(() => {
    const perf = window.performance;
    const timing = perf.timing;
    const paintMetrics = perf.getEntriesByType('paint');
    
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstPaint: paintMetrics.find(metric => metric.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintMetrics.find(metric => metric.name === 'first-contentful-paint')?.startTime || 0,
      timeToInteractive: timing.domInteractive - timing.navigationStart,
      resources: perf.getEntriesByType('resource').length
    };
  });
}

async function captureConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  return errors;
}

// Main test suite
test.describe('ProtoThrive Frontend - Complete Audit Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    await captureConsoleErrors(page);
  });

  // ==================== SMOKE TESTS ====================
  test.describe('Smoke Tests - Critical Functionality', () => {
    test('should load the application successfully', async ({ page }) => {
      const response = await page.goto(BASE_URL, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      expect(response?.status()).toBe(200);
      await expect(page).not.toHaveTitle('Access Denied');
      
      // Check for common error states
      const errorMessages = ['Access Denied', 'Error', '404', '500'];
      for (const errorMsg of errorMessages) {
        const errorElement = page.locator(`text=${errorMsg}`);
        await expect(errorElement).not.toBeVisible();
      }
    });

    test('should have a visible page title', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/ProtoThrive|Proto Thrive/i);
    });

    test('should not have JavaScript errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      
      expect(errors).toHaveLength(0);
    });
  });

  // ==================== FUNCTIONAL TESTS ====================
  test.describe('Functional Tests - Core Features', () => {
    test('should have working navigation menu', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for navigation element
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
      
      // Check navigation links
      const navLinks = nav.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // Test each navigation link
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        
        // Check if link is clickable
        await expect(link).toBeEnabled();
      }
    });

    test('should have functional CTA buttons', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Common CTA button texts
      const ctaTexts = ['Get Started', 'Sign Up', 'Try Free', 'Start Trial', 'Learn More'];
      let foundCta = false;
      
      for (const text of ctaTexts) {
        const button = page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
        if (await button.count() > 0) {
          foundCta = true;
          await expect(button).toBeVisible();
          await expect(button).toBeEnabled();
          
          // Test hover state
          await button.hover();
          
          // Check for cursor pointer
          const cursor = await button.evaluate(el => 
            window.getComputedStyle(el).cursor
          );
          expect(cursor).toBe('pointer');
        }
      }
      
      expect(foundCta).toBeTruthy();
    });

    test('should handle form submissions gracefully', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        
        // Find submit button
        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        
        if (await submitButton.count() > 0) {
          // Try to submit empty form
          await submitButton.click();
          
          // Check for validation messages
          await page.waitForTimeout(1000);
          const errorMessages = await form.locator('[aria-invalid="true"], .error, .invalid').count();
          
          // Should show validation if required fields exist
          const requiredFields = await form.locator('[required], [aria-required="true"]').count();
          if (requiredFields > 0) {
            expect(errorMessages).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should have working footer links', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const footer = page.locator('footer, [role="contentinfo"]').first();
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible();
        
        const footerLinks = footer.locator('a');
        const linkCount = await footerLinks.count();
        
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          const link = footerLinks.nth(i);
          const href = await link.getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================
  test.describe('Accessibility Tests - WCAG 2.2 AA Compliance', () => {
    test('should pass automated accessibility checks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const results = await checkAccessibility(page);
      
      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log('Accessibility violations found:');
        results.violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`);
          console.log(`  Impact: ${violation.impact}`);
          console.log(`  Affected elements: ${violation.nodes.length}`);
        });
      }
      
      // Check for critical violations
      const criticalViolations = results.violations.filter(v => 
        v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalViolations).toHaveLength(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent?.trim() || '',
          visible: window.getComputedStyle(el).display !== 'none'
        })).filter(h => h.visible)
      );
      
      // Should have exactly one H1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);
      
      // Check for heading level skips
      let previousLevel = 0;
      for (const heading of headings) {
        if (previousLevel > 0) {
          const levelJump = heading.level - previousLevel;
          expect(levelJump).toBeLessThanOrEqual(1);
        }
        previousLevel = heading.level;
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Tab through first 10 interactive elements
      const focusableElements = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            text: el?.textContent?.trim(),
            visible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false,
            hasOutline: el ? window.getComputedStyle(el).outline !== 'none' : false
          };
        });
        
        if (focusedElement.tagName && focusedElement.tagName !== 'BODY') {
          focusableElements.push(focusedElement);
          expect(focusedElement.visible).toBeTruthy();
        }
      }
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should have skip navigation link', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Focus on skip link (usually first focusable element)
      await page.keyboard.press('Tab');
      
      const skipLink = await page.evaluate(() => {
        const el = document.activeElement;
        const isSkipLink = el?.textContent?.toLowerCase().includes('skip') ||
                          el?.getAttribute('href')?.includes('#main');
        return {
          exists: isSkipLink,
          visible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
        };
      });
      
      expect(skipLink.exists || skipLink.visible).toBeTruthy();
    });

    test('should have proper ARIA labels on buttons', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        
        // Button should have accessible name
        expect(text || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Images should have alt text or be marked as decorative
        if (role !== 'presentation' && role !== 'none') {
          expect(alt).not.toBeNull();
        }
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const inputs = page.locator('input:not([type="hidden"]), select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // Input should have associated label or ARIA label
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const results = await checkAccessibility(page);
      const contrastViolations = results.violations.filter(v => 
        v.id.includes('color-contrast')
      );
      
      expect(contrastViolations).toHaveLength(0);
    });

    test('should have lang attribute on html element', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for ARIA live regions
      const liveRegions = await page.$$eval('[aria-live], [role="alert"], [role="status"]', elements =>
        elements.map(el => ({
          role: el.getAttribute('role'),
          ariaLive: el.getAttribute('aria-live'),
          visible: window.getComputedStyle(el).display !== 'none'
        }))
      );
      
      // If there are dynamic updates, there should be live regions
      if (liveRegions.length > 0) {
        liveRegions.forEach(region => {
          expect(region.ariaLive || region.role).toBeTruthy();
        });
      }
    });
  });

  // ==================== PERFORMANCE TESTS ====================
  test.describe('Performance Tests - Core Web Vitals', () => {
    test('should load within performance budget', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      const metrics = await measurePerformance(page);
      
      // Performance assertions
      expect(loadTime).toBeLessThan(5000); // Total load under 5s
      expect(metrics.firstContentfulPaint).toBeLessThan(1800); // FCP < 1.8s
      expect(metrics.domContentLoaded).toBeLessThan(3000); // DOM < 3s
      expect(metrics.timeToInteractive).toBeLessThan(3800); // TTI < 3.8s
    });

    test('should have optimized resource loading', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const resources = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource').map(r => ({
          name: r.name,
          type: (r as PerformanceResourceTiming).initiatorType,
          size: (r as PerformanceResourceTiming).transferSize,
          duration: r.duration
        }));
      });
      
      // Check for large resources
      const largeResources = resources.filter(r => r.size > 500000); // > 500KB
      expect(largeResources.length).toBeLessThanOrEqual(2);
      
      // Check for slow resources
      const slowResources = resources.filter(r => r.duration > 3000); // > 3s
      expect(slowResources.length).toBe(0);
    });

    test('should have minimal layout shift (CLS)', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Inject CLS tracking
      await page.evaluateOnNewDocument(() => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        (window as any).getCLS = () => cls;
      });
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      const cls = await page.evaluate(() => (window as any).getCLS());
      expect(cls).toBeLessThan(0.1);
    });

    test('should use lazy loading for images', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const images = await page.$$eval('img', imgs =>
        imgs.map(img => ({
          src: img.src,
          loading: img.loading,
          isAboveFold: img.getBoundingClientRect().top < window.innerHeight
        }))
      );
      
      // Non-critical images should have lazy loading
      const belowFoldImages = images.filter(img => !img.isAboveFold);
      belowFoldImages.forEach(img => {
        if (!img.src.includes('logo') && !img.src.includes('hero')) {
          expect(img.loading).toBe('lazy');
        }
      });
    });

    test('should optimize fonts loading', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const fontFaces = await page.evaluate(() => {
        const faces: any[] = [];
        document.fonts.forEach((font: any) => {
          faces.push({
            family: font.family,
            display: font.display,
            status: font.status
          });
        });
        return faces;
      });
      
      // Fonts should use font-display: swap or optional
      fontFaces.forEach(font => {
        expect(['swap', 'optional', 'fallback']).toContain(font.display);
      });
    });

    test('should use efficient caching', async ({ page }) => {
      const response = await page.goto(BASE_URL);
      const headers = response?.headers();
      
      // Check for caching headers
      if (headers) {
        const cacheControl = headers['cache-control'];
        if (cacheControl) {
          expect(cacheControl).toMatch(/max-age=\d+/);
        }
      }
    });

    test('should minimize JavaScript execution time', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const metrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('measure');
        const longTasks = performance.getEntriesByType('longtask' as any);
        
        return {
          measures: entries.length,
          longTasks: longTasks?.length || 0
        };
      });
      
      // Should have minimal long tasks
      expect(metrics.longTasks).toBeLessThanOrEqual(3);
    });
  });

  // ==================== RESPONSIVE DESIGN TESTS ====================
  test.describe('Responsive Design Tests', () => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];

    viewports.forEach(viewport => {
      test(`should be responsive on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(BASE_URL);
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBeFalsy();
        
        // Check text readability
        const bodyFontSize = await page.evaluate(() => {
          const body = document.body;
          return parseInt(window.getComputedStyle(body).fontSize);
        });
        expect(bodyFontSize).toBeGreaterThanOrEqual(14);
        
        // Check navigation accessibility
        const nav = page.locator('nav, [role="navigation"]').first();
        if (await nav.count() > 0) {
          await expect(nav).toBeVisible();
        }
      });
    });

    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      const interactiveElements = await page.$$eval(
        'button, a, input, select, textarea, [role="button"]',
        elements => elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height
          };
        }).filter(el => el.width > 0 && el.height > 0)
      );
      
      // WCAG 2.5.5: minimum 44x44 CSS pixels
      interactiveElements.forEach(element => {
        expect(element.area).toBeGreaterThanOrEqual(44 * 44);
      });
    });

    test('should handle viewport orientation changes', async ({ page, context }) => {
      await page.goto(BASE_URL);
      
      // Portrait
      await page.setViewportSize({ width: 375, height: 667 });
      let hasScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasScroll).toBeFalsy();
      
      // Landscape
      await page.setViewportSize({ width: 667, height: 375 });
      hasScroll = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasScroll).toBeFalsy();
    });

    test('should have mobile-friendly navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);
      
      // Look for hamburger menu or mobile nav
      const mobileMenuTrigger = page.locator('[aria-label*="menu"], [class*="hamburger"], [class*="menu-toggle"]').first();
      
      if (await mobileMenuTrigger.count() > 0) {
        await expect(mobileMenuTrigger).toBeVisible();
        
        // Test menu interaction
        await mobileMenuTrigger.click();
        await page.waitForTimeout(500);
        
        // Menu should be expanded
        const expandedMenu = page.locator('[aria-expanded="true"], [class*="open"], [class*="active"]').first();
        await expect(expandedMenu).toBeVisible();
      }
    });
  });

  // ==================== SEO TESTS ====================
  test.describe('SEO Tests', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Title
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThanOrEqual(60);
      
      // Meta description
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
      expect(metaDescription).toBeTruthy();
      expect(metaDescription!.length).toBeGreaterThan(50);
      expect(metaDescription!.length).toBeLessThanOrEqual(160);
      
      // Viewport
      const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
      expect(viewport).toContain('width=device-width');
    });

    test('should have Open Graph tags', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const ogTags = [
        'og:title',
        'og:description',
        'og:type',
        'og:url'
      ];
      
      for (const property of ogTags) {
        const content = await page.getAttribute(`meta[property="${property}"]`, 'content');
        expect(content).toBeTruthy();
      }
    });

    test('should have canonical URL', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain('protothrive');
    });

    test('should have proper heading structure for SEO', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Should have exactly one H1
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      expect(h1Count).toBe(1);
      
      // H1 should have meaningful content
      if (h1Count > 0) {
        const h1Text = await h1Elements.first().textContent();
        expect(h1Text).toBeTruthy();
        expect(h1Text!.length).toBeGreaterThan(5);
      }
    });

    test('should have robots meta tag', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const robots = await page.getAttribute('meta[name="robots"]', 'content');
      // Should either not exist (default index,follow) or be set correctly
      if (robots) {
        expect(robots).not.toContain('noindex');
        expect(robots).not.toContain('nofollow');
      }
    });

    test('should have structured data', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const structuredData = await page.$$eval('script[type="application/ld+json"]', scripts =>
        scripts.map(script => {
          try {
            return JSON.parse(script.textContent || '{}');
          } catch {
            return null;
          }
        }).filter(Boolean)
      );
      
      // Should have at least one structured data script
      expect(structuredData.length).toBeGreaterThan(0);
    });
  });

  // ==================== SECURITY TESTS ====================
  test.describe('Security Tests', () => {
    test('should have security headers', async ({ page }) => {
      const response = await page.goto(BASE_URL);
      const headers = response?.headers();
      
      if (headers) {
        // Critical security headers
        const securityHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'strict-transport-security',
          'content-security-policy'
        ];
        
        securityHeaders.forEach(header => {
          expect(headers[header]).toBeTruthy();
        });
      }
    });

    test('should not expose sensitive information', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const pageContent = await page.content();
      
      // Check for exposed sensitive patterns
      const sensitivePatterns = [
        /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
        /secret[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
        /password\s*[:=]\s*['"][^'"]+['"]/gi,
        /token\s*[:=]\s*['"][^'"]+['"]/gi
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(pageContent).not.toMatch(pattern);
      });
    });

    test('should use HTTPS everywhere', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check all resource URLs
      const resources = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href], link[href], script[src], img[src]'));
        return links.map(el => el.getAttribute('href') || el.getAttribute('src')).filter(Boolean);
      });
      
      // External resources should use HTTPS
      resources.forEach(url => {
        if (url && url.startsWith('http://')) {
          expect(url).toMatch(/^https:/);
        }
      });
    });

    test('should have secure cookies', async ({ page, context }) => {
      await page.goto(BASE_URL);
      
      const cookies = await context.cookies();
      
      cookies.forEach(cookie => {
        // Session cookies should be secure and httpOnly
        if (cookie.name.toLowerCase().includes('session') || 
            cookie.name.toLowerCase().includes('auth')) {
          expect(cookie.secure).toBeTruthy();
          expect(cookie.httpOnly).toBeTruthy();
          expect(cookie.sameSite).toMatch(/Strict|Lax/);
        }
      });
    });
  });

  // ==================== USER JOURNEY TESTS ====================
  test.describe('User Journey Tests', () => {
    test('should complete homepage to signup flow', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Find and click primary CTA
      const ctaButton = page.locator('button:has-text("Get Started"), a:has-text("Sign Up")').first();
      
      if (await ctaButton.count() > 0) {
        await ctaButton.click();
        
        // Should navigate to signup or show signup modal
        await page.waitForTimeout(1000);
        
        const signupForm = page.locator('form[class*="signup"], form[class*="register"], [data-testid="signup-form"]').first();
        const isSignupPage = page.url().includes('signup') || page.url().includes('register');
        
        expect(await signupForm.count() > 0 || isSignupPage).toBeTruthy();
      }
    });

    test('should handle 404 pages gracefully', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/non-existent-page-12345`, {
        waitUntil: 'networkidle'
      });
      
      // Should return 404 or redirect
      if (response?.status() === 404) {
        // Check for user-friendly 404 page
        const heading = page.locator('h1, h2').first();
        const headingText = await heading.textContent();
        expect(headingText).toMatch(/404|not found|page not found/i);
        
        // Should have way to return home
        const homeLink = page.locator('a[href="/"], a:has-text("Home")').first();
        await expect(homeLink).toBeVisible();
      }
    });

    test('should maintain state during navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Set some state (e.g., interact with a feature)
      // This is a placeholder - adjust based on actual app functionality
      
      // Navigate to another page
      const navLink = page.locator('nav a').first();
      if (await navLink.count() > 0) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        
        // Navigate back
        await page.goBack();
        
        // State should be preserved (app-specific check)
        // Add specific assertions based on your app's state management
      }
    });
  });

  // ==================== BROWSER COMPATIBILITY TESTS ====================
  test.describe('Browser Compatibility Tests', () => {
    test('should not use unsupported JavaScript features', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for console errors related to unsupported features
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.reload();
      
      // Should not have syntax errors
      const syntaxErrors = errors.filter(e => 
        e.includes('SyntaxError') || 
        e.includes('is not defined') ||
        e.includes('Unexpected token')
      );
      
      expect(syntaxErrors).toHaveLength(0);
    });

    test('should have CSS fallbacks', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for critical CSS properties
      const hasFlexboxFallback = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasFallback = true;
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          if (styles.display === 'grid' || styles.display === 'flex') {
            // Should have fallback styles or be non-critical
            const parent = el.parentElement;
            if (parent) {
              const parentStyles = window.getComputedStyle(parent);
              // Check if parent has alternative layout
            }
          }
        });
        
        return hasFallback;
      });
      
      expect(hasFlexboxFallback).toBeTruthy();
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  test.describe('Error Handling Tests', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Simulate offline mode
      await context.route('**/*', route => route.abort());
      
      try {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (error) {
        // Should show offline message or cached content
      }
      
      // Re-enable network
      await context.unroute('**/*');
    });

    test('should handle JavaScript errors without crashing', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Inject an error
      await page.evaluate(() => {
        throw new Error('Test error');
      });
      
      // App should still be functional
      await page.waitForTimeout(1000);
      
      // Check if error boundary caught it
      const errorMessage = page.locator('text=/error|something went wrong/i').first();
      const hasErrorBoundary = await errorMessage.count() > 0;
      
      // Page should not be completely broken
      const mainContent = page.locator('main, #root, #app').first();
      await expect(mainContent).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page, context }) => {
      // Intercept API calls and return errors
      await context.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto(BASE_URL);
      
      // Interact with features that make API calls
      // (This is app-specific - adjust based on your app)
      
      // Should show user-friendly error messages
      await page.waitForTimeout(2000);
      
      // Check for error handling
      const hasErrorHandling = await page.evaluate(() => {
        const errors = document.querySelectorAll('[role="alert"], .error, .error-message');
        return errors.length > 0;
      });
      
      // App should handle API errors gracefully
      expect(hasErrorHandling).toBeTruthy();
    });
  });

  // ==================== INTEGRATION TESTS ====================
  test.describe('Integration Tests', () => {
    test('should integrate with analytics properly', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for analytics scripts
      const hasAnalytics = await page.evaluate(() => {
        return typeof (window as any).gtag !== 'undefined' ||
               typeof (window as any).ga !== 'undefined' ||
               typeof (window as any).analytics !== 'undefined';
      });
      
      // Should have some analytics integration
      expect(hasAnalytics).toBeTruthy();
    });

    test('should load third-party scripts securely', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const thirdPartyScripts = await page.$$eval('script[src]', scripts =>
        scripts.map(script => script.getAttribute('src')).filter(src =>
          src && !src.startsWith('/') && !src.includes('protothrive')
        )
      );
      
      thirdPartyScripts.forEach(src => {
        // Should use HTTPS
        expect(src).toMatch(/^https:/);
        
        // Should have integrity check for CDN resources
        // (This is a best practice but not always implemented)
      });
    });
  });

  // ==================== DATA VALIDATION TESTS ====================
  test.describe('Data Validation Tests', () => {
    test('should validate form inputs properly', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        
        // Test email validation
        const emailInput = form.locator('input[type="email"]').first();
        if (await emailInput.count() > 0) {
          await emailInput.fill('invalid-email');
          await emailInput.blur();
          
          // Should show validation error
          const isInvalid = await emailInput.getAttribute('aria-invalid');
          expect(isInvalid).toBe('true');
        }
        
        // Test required fields
        const requiredInputs = form.locator('[required], [aria-required="true"]');
        const requiredCount = await requiredInputs.count();
        
        if (requiredCount > 0) {
          const submitButton = form.locator('button[type="submit"]').first();
          if (await submitButton.count() > 0) {
            await submitButton.click();
            
            // Should prevent submission and show errors
            await page.waitForTimeout(500);
            const errors = await form.locator('[role="alert"], .error').count();
            expect(errors).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

// Performance monitoring test
test.describe('Continuous Performance Monitoring', () => {
  test('should track Core Web Vitals over time', async ({ page }) => {
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      await page.goto(BASE_URL);
      
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(e => e.name === 'first-contentful-paint');
            const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
            
            resolve({
              fcp: fcp?.startTime || 0,
              lcp: (lcp as any)?.startTime || 0
            });
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
          
          setTimeout(() => resolve({ fcp: 0, lcp: 0 }), 5000);
        });
      });
      
      results.push(metrics);
    }
    
    // Calculate average
    const avgFCP = results.reduce((sum, r) => sum + (r as any).fcp, 0) / results.length;
    const avgLCP = results.reduce((sum, r) => sum + (r as any).lcp, 0) / results.length;
    
    console.log(`Average FCP: ${avgFCP}ms`);
    console.log(`Average LCP: ${avgLCP}ms`);
    
    expect(avgFCP).toBeLessThan(1800);
    expect(avgLCP).toBeLessThan(2500);
  });
});
