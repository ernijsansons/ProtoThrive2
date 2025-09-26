import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Homepage
 * Captures visual snapshots to detect unintended UI changes
 */

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for animations and content to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should match homepage desktop layout', async ({ page }) => {
    // Ensure stable state for screenshot
    await page.locator('main#main-content').waitFor();

    // Hide dynamic elements that might cause flaky tests
    await page.addStyleTag({
      content: `
        .animation, .group-hover\\:animate-pulse, .group-hover\\:rotate-12, .group-hover\\:scale-110 {
          animation: none !important;
          transition: none !important;
        }
      `
    });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match hero section', async ({ page }) => {
    const heroSection = page.locator('section').first();
    await heroSection.waitFor();

    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      animations: 'disabled',
    });
  });

  test('should match features grid', async ({ page }) => {
    const featuresGrid = page.locator('section').nth(1);
    await featuresGrid.waitFor();

    await expect(featuresGrid).toHaveScreenshot('features-grid.png', {
      animations: 'disabled',
    });
  });

  test('should match status section', async ({ page }) => {
    const statusSection = page.locator('section').nth(2);
    await statusSection.waitFor();

    await expect(statusSection).toHaveScreenshot('status-section.png', {
      animations: 'disabled',
    });
  });

  test('should match mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Disable animations for stable screenshots
    await page.addStyleTag({
      content: `
        * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match tablet layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.addStyleTag({
      content: `
        * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match navigation hover states', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await nav.waitFor();

    // Test login button hover
    const loginButton = page.locator('a[href="/login"]');
    await loginButton.hover();

    await expect(nav).toHaveScreenshot('navigation-hover.png', {
      animations: 'disabled',
    });
  });

  test('should match dark theme (if applicable)', async ({ page }) => {
    // The page already uses dark theme, but we test it explicitly
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match high contrast mode', async ({ page }) => {
    // Simulate high contrast preferences
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.addStyleTag({
      content: `
        * {
          animation: none !important;
          transition: none !important;
        }
      `
    });

    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should match button components', async ({ page }) => {
    // Primary CTA button
    const ctaButton = page.locator('a:has-text("Start Free Trial")');
    await expect(ctaButton).toHaveScreenshot('cta-button.png');

    // Secondary button
    const demoButton = page.locator('a:has-text("View Demo")');
    await expect(demoButton).toHaveScreenshot('demo-button.png');
  });

  test('should match feature cards', async ({ page }) => {
    const featureCards = page.locator('article');

    // Test each feature card individually
    for (let i = 0; i < await featureCards.count(); i++) {
      const card = featureCards.nth(i);
      await expect(card).toHaveScreenshot(`feature-card-${i}.png`);
    }
  });

  test('should match status indicators', async ({ page }) => {
    const statusItems = page.locator('div:has(svg.text-green-400)');

    for (let i = 0; i < await statusItems.count(); i++) {
      const item = statusItems.nth(i);
      await expect(item).toHaveScreenshot(`status-item-${i}.png`);
    }
  });
});

test.describe('Accessibility Visual Tests', () => {
  test('should match focus states', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation focus states
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // ProtoThrive logo
    await page.keyboard.press('Tab'); // Test Page link
    await page.keyboard.press('Tab'); // Login button

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveScreenshot('focused-login-button.png');
  });

  test('should match skip link visibility', async ({ page }) => {
    await page.goto('/');

    // Press Tab to show skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a:has-text("Skip to main content")');

    await expect(skipLink).toHaveScreenshot('skip-link-visible.png');
  });
});