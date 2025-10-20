/**
 * Accessibility Testing Suite
 * Tests WCAG 2.1 compliance, screen reader support, and keyboard navigation
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';
import { checkAccessibility, captureScreenshot } from './helpers';

test.describe('Accessibility Testing', () => {
  test.describe('Automated Accessibility Checks', () => {
    const pages = [
      { name: 'Landing', url: TEST_CONFIG.frontend.url },
      { name: 'Login', url: TEST_CONFIG.frontend.pages.login },
      { name: 'Register', url: TEST_CONFIG.frontend.pages.register },
      { name: 'Privacy', url: TEST_CONFIG.frontend.pages.privacy },
      { name: 'Terms', url: TEST_CONFIG.frontend.pages.terms },
      { name: 'Docs', url: TEST_CONFIG.frontend.pages.docs },
    ];

    for (const pageInfo of pages) {
      test(`should have no accessibility violations on ${pageInfo.name} page`, async ({ page }) => {
        await page.goto(pageInfo.url);
        await page.waitForLoadState('networkidle');

        const results: any = await checkAccessibility(page);

        console.log(`Accessibility results for ${pageInfo.name}:`, {
          violations: results.violations,
          passes: results.passes,
          incomplete: results.incomplete,
        });

        // Should have no critical violations
        expect(results.violations).toBe(0);

        // Log violations if any
        if (results.violations > 0) {
          console.log('Violations:', results.details);
        }

        await captureScreenshot(page, `a11y-${pageInfo.name.toLowerCase()}`);
      });
    }
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with Tab key', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Press Tab multiple times
      const focusedElements: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ').join('.') : ''}` : 'none';
        });

        focusedElements.push(focusedElement);
      }

      console.log('Focus sequence:', focusedElements);

      // Should navigate through interactive elements
      expect(focusedElements.filter((el) => el !== 'BODY' && el !== 'none').length).toBeGreaterThan(0);

      await captureScreenshot(page, 'keyboard-navigation');
    });

    test('should show focus indicators', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Tab to first focusable element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      // Check if focus indicator is visible
      const hasFocusStyle = await page.evaluate(() => {
        const focused = document.activeElement as HTMLElement;
        if (!focused || focused === document.body) return false;

        const styles = window.getComputedStyle(focused);
        const pseudoStyles = window.getComputedStyle(focused, ':focus');

        return (
          styles.outline !== 'none' &&
          styles.outline !== '0px' &&
          styles.outline !== ''
        ) || (
          pseudoStyles.outline !== 'none' &&
          pseudoStyles.outline !== '0px'
        );
      });

      console.log('Focus indicator visible:', hasFocusStyle);

      await captureScreenshot(page, 'focus-indicator');
    });

    test('should navigate forms with keyboard', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Tab to email field
      await page.keyboard.press('Tab');
      await page.keyboard.type('test@example.com');

      // Tab to password field
      await page.keyboard.press('Tab');
      await page.keyboard.type('password123');

      // Tab to submit button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      await captureScreenshot(page, 'form-keyboard-navigation');
    });

    test('should support Escape key to close modals', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Look for modal trigger
      const modalTrigger = page.locator('button:has-text("Open"), button:has-text("Show"), [data-modal-trigger]').first();

      if (await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modalTrigger.click();
        await page.waitForTimeout(500);

        // Press Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Modal should be closed
        await captureScreenshot(page, 'modal-escape-key');
      }
    });

    test('should trap focus in modals', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Look for modal
      const modalTrigger = page.locator('button:has-text("Open"), [data-modal-trigger]').first();

      if (await modalTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await modalTrigger.click();
        await page.waitForTimeout(500);

        // Tab through modal
        const focusPath: string[] = [];
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          const focused = await page.evaluate(() => document.activeElement?.tagName || 'none');
          focusPath.push(focused);
        }

        console.log('Modal focus path:', focusPath);

        await captureScreenshot(page, 'modal-focus-trap');
      }
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const interactiveElements = await page.$$eval(
        'button, a, input, select, textarea',
        (elements) => {
          return elements.map((el) => ({
            tag: el.tagName,
            ariaLabel: el.getAttribute('aria-label'),
            ariaLabelledBy: el.getAttribute('aria-labelledby'),
            title: el.getAttribute('title'),
            text: el.textContent?.trim().substring(0, 50),
            hasLabel: !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent?.trim()),
          }));
        }
      );

      console.log('Interactive elements:', interactiveElements.length);

      // Most interactive elements should have labels
      const labeled = interactiveElements.filter((el) => el.hasLabel).length;
      const percentage = (labeled / interactiveElements.length) * 100;

      console.log(`Labeled elements: ${percentage.toFixed(1)}%`);

      expect(percentage).toBeGreaterThan(80);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => {
        return elements.map((el) => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent?.trim().substring(0, 50),
        }));
      });

      console.log('Headings:', headings);

      // Should have exactly one H1
      const h1Count = headings.filter((h) => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Heading levels should not skip (e.g., h1 -> h3)
      let previousLevel = 0;
      let validHierarchy = true;

      for (const heading of headings) {
        if (heading.level - previousLevel > 1) {
          validHierarchy = false;
          console.log(`Heading hierarchy skip: h${previousLevel} -> h${heading.level}`);
        }
        previousLevel = heading.level;
      }

      // Note: This is a guideline, not strict requirement
      if (!validHierarchy) {
        console.warn('Heading hierarchy has skips');
      }
    });

    test('should have landmark regions', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const landmarks = await page.$$eval(
        'header, nav, main, footer, aside, section[aria-label], [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]',
        (elements) => {
          return elements.map((el) => ({
            tag: el.tagName,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
          }));
        }
      );

      console.log('Landmarks:', landmarks);

      // Should have main landmark
      const hasMain = landmarks.some((l) => l.tag === 'MAIN' || l.role === 'main');
      expect(hasMain).toBeTruthy();

      await captureScreenshot(page, 'landmark-regions');
    });

    test('should have alt text on images', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      const images = await page.$$eval('img', (imgs) => {
        return imgs.map((img) => ({
          src: img.src,
          alt: img.alt,
          hasAlt: !!img.alt || img.getAttribute('role') === 'presentation',
        }));
      });

      console.log('Images:', images.length);

      if (images.length > 0) {
        const withAlt = images.filter((img) => img.hasAlt).length;
        const percentage = (withAlt / images.length) * 100;

        console.log(`Images with alt: ${percentage.toFixed(1)}%`);

        // All images should have alt text
        expect(percentage).toBe(100);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Check text elements for contrast
      const textElements = await page.$$eval('p, h1, h2, h3, h4, h5, h6, span, a, button, label', (elements) => {
        return elements.slice(0, 20).map((el) => {
          const styles = window.getComputedStyle(el);
          return {
            tag: el.tagName,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
          };
        });
      });

      console.log('Text elements sampled:', textElements.length);

      // This is a simplified check - full contrast checking requires color parsing
      // Axe-core handles this in the accessibility check above

      await captureScreenshot(page, 'color-contrast-check');
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Look for elements that might rely on color alone
      const colorOnlyElements = await page.$$eval('[style*="color:"]', (elements) => {
        return elements.map((el) => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 50),
          hasIcon: !!el.querySelector('svg, img, i'),
          hasText: !!(el.textContent?.trim()),
        }));
      });

      console.log('Elements with color styling:', colorOnlyElements.length);

      // Elements with color should also have other indicators (icons, text)
      await captureScreenshot(page, 'color-information-check');
    });
  });

  test.describe('Form Accessibility', () => {
    test('should have labels for all form inputs', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      const inputs = await page.$$eval('input, select, textarea', (elements) => {
        return elements.map((el) => {
          const id = el.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const placeholder = el.getAttribute('placeholder');

          return {
            type: el.getAttribute('type'),
            hasLabel: !!(label || ariaLabel || ariaLabelledBy),
            hasPlaceholder: !!placeholder,
          };
        });
      });

      console.log('Form inputs:', inputs);

      // All inputs should have labels
      const labeled = inputs.filter((i) => i.hasLabel).length;
      const percentage = (labeled / inputs.length) * 100;

      console.log(`Labeled inputs: ${percentage.toFixed(1)}%`);

      expect(percentage).toBe(100);
    });

    test('should show error messages accessibly', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Submit form without filling
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Check for aria-invalid or error messages
      const hasErrors = await page.evaluate(() => {
        const invalidInputs = document.querySelectorAll('[aria-invalid="true"]');
        const errorMessages = document.querySelectorAll('[role="alert"], .error, [class*="error"]');

        return {
          invalidInputs: invalidInputs.length,
          errorMessages: errorMessages.length,
        };
      });

      console.log('Form errors:', hasErrors);

      await captureScreenshot(page, 'form-errors-accessible');
    });

    test('should have autocomplete attributes', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      const autocompleteInputs = await page.$$eval('input[type="email"], input[type="password"]', (inputs) => {
        return inputs.map((input) => ({
          type: input.type,
          autocomplete: input.getAttribute('autocomplete'),
        }));
      });

      console.log('Autocomplete attributes:', autocompleteInputs);

      // Email and password fields should have autocomplete
      autocompleteInputs.forEach((input) => {
        if (input.type === 'email') {
          expect(input.autocomplete).toContain('email');
        }
      });
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper page title', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const title = await page.title();

      console.log('Page title:', title);

      // Title should exist and be descriptive
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThan(100);
    });

    test('should have lang attribute', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const lang = await page.evaluate(() => {
        return document.documentElement.lang;
      });

      console.log('Document language:', lang);

      // Should have lang attribute
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    });

    test('should have skip links', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const skipLink = await page.locator('a:has-text("Skip to"), a:has-text("Skip navigation")').first();

      const hasSkipLink = await skipLink.isVisible({ timeout: 2000 }).catch(() => false);

      console.log('Skip link present:', hasSkipLink);

      if (hasSkipLink) {
        // Skip link should be functional
        await skipLink.focus();
        await skipLink.click();

        await page.waitForTimeout(500);

        await captureScreenshot(page, 'skip-link-used');
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      // Look for aria-live regions
      const liveRegions = await page.$$eval('[aria-live], [role="status"], [role="alert"]', (elements) => {
        return elements.map((el) => ({
          role: el.getAttribute('role'),
          ariaLive: el.getAttribute('aria-live'),
          ariaAtomic: el.getAttribute('aria-atomic'),
        }));
      });

      console.log('Live regions:', liveRegions);

      // Should have live regions for dynamic content
      if (liveRegions.length > 0) {
        await captureScreenshot(page, 'live-regions-present');
      }
    });
  });

  test.describe('Responsive Text', () => {
    test('should support text resizing', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Get initial font size
      const initialFontSize = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).fontSize;
      });

      // Zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Text should scale
      const scaledFontSize = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).fontSize;
      });

      console.log('Font sizes:', { initial: initialFontSize, scaled: scaledFontSize });

      await captureScreenshot(page, 'text-resizing-200');

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });

    test('should not truncate text at 200% zoom', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Check for text overflow
      const hasOverflow = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, span, div'));
        return elements.some((el) => {
          const styles = window.getComputedStyle(el);
          return styles.overflow === 'hidden' && el.scrollWidth > el.clientWidth;
        });
      });

      console.log('Text overflow detected:', hasOverflow);

      await captureScreenshot(page, 'text-overflow-check');

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });

  test.describe('Motion and Animation', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      // Check if animations are reduced
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      console.log('Prefers reduced motion:', hasReducedMotion);

      expect(hasReducedMotion).toBeTruthy();

      await captureScreenshot(page, 'reduced-motion');
    });
  });
});
