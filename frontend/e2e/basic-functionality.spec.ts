/**
 * Basic Functionality E2E Tests for ProtoThrive
 * Validates core application functionality and user flows
 */

import { test, expect } from '@playwright/test';

test.describe('ProtoThrive Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check that the page loads without access denied errors
    await expect(page.locator('body')).not.toContainText('Access Denied');
    await expect(page.locator('body')).not.toContainText('404');

    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();

    // Check that the page title is correct
    await expect(page).toHaveTitle(/ProtoThrive.*AI-Powered Project Management/);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Check for canonical URL
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeAttached();

    // Check for Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toBeAttached();
  });

  test('should have skip link for accessibility', async ({ page }) => {
    // Focus on the skip link (should be first focusable element)
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Click skip link should focus main content
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should navigate to test page', async ({ page }) => {
    // Find and click test page link
    const testLink = page.locator('a', { hasText: 'Test Page' });
    await expect(testLink).toBeVisible();
    await testLink.click();

    // Should navigate to test page
    await expect(page).toHaveURL(/.*\/test$/);
  });

  test('should have working login and signup buttons', async ({ page }) => {
    // Check login button
    const loginButton = page.locator('a', { hasText: 'Login' });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveAttribute('href', '/login');

    // Check signup button
    const signupButton = page.locator('a', { hasText: 'Sign Up' });
    await expect(signupButton).toBeVisible();
    await expect(signupButton).toHaveAttribute('href', '/signup');
  });

  test('should display feature cards', async ({ page }) => {
    // Check for feature cards
    const smartRoadmapsCard = page.locator('text=Smart Roadmaps');
    const collaborationCard = page.locator('text=Real-time Collaboration');
    const analyticsCard = page.locator('text=Analytics Dashboard');

    await expect(smartRoadmapsCard).toBeVisible();
    await expect(collaborationCard).toBeVisible();
    await expect(analyticsCard).toBeVisible();
  });

  test('should display status section with operational services', async ({ page }) => {
    // Check status section
    const statusSection = page.locator('text=Current Status');
    await expect(statusSection).toBeVisible();

    // Check for operational services
    const backendStatus = page.locator('text=Backend APIs');
    const frontendStatus = page.locator('text=Frontend Core');
    const legalStatus = page.locator('text=Legal Compliance');

    await expect(backendStatus).toBeVisible();
    await expect(frontendStatus).toBeVisible();
    await expect(legalStatus).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that elements are still visible and properly arranged
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();

    // Check that navigation is responsive
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('should load without performance issues', async ({ page }) => {
    // Navigate and measure performance
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Check that there are no JavaScript errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Should have no critical JavaScript errors
    const criticalErrors = errors.filter(error =>
      !error.includes('net::ERR_') && // Network errors are acceptable in tests
      !error.includes('favicon.ico') // Favicon errors are not critical
    );
    expect(criticalErrors).toHaveLength(0);
  });
});