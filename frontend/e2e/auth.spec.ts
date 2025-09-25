/**
 * Authentication E2E Tests for ProtoThrive
 * Tests complete authentication flows and user journeys
 *
 * Ref: CLAUDE.md Phase 3 - E2E Testing Framework
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, setupMockAPIs, waitForHydration } from './utils/test-helpers';
import { testUsers, selectors } from './fixtures/test-data';

test.describe('Authentication Flows', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await setupMockAPIs(page);
  });

  test.describe('Development Login', () => {
    test('should login with development token successfully', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Click development login
      await page.click(selectors.auth.devLoginButton);

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Should show user menu indicating successful login
      await expect(page.locator(selectors.auth.userMenu)).toBeVisible();

      // Should show welcome message or user info
      await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
    });

    test('should persist auth state after page reload', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Reload page
      await page.reload();
      await waitForHydration(page);

      // Should still be logged in
      await expect(page.locator(selectors.auth.userMenu)).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should redirect to dashboard when accessing login while authenticated', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Try to access login page
      await page.goto('/login');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Credential Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Fill login form
      await page.fill(selectors.auth.emailInput, testUsers.developer.email);
      await page.fill(selectors.auth.passwordInput, testUsers.developer.password);

      // Submit form
      await page.click(selectors.auth.loginButton);

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator(selectors.auth.userMenu)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Mock failed login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' })
        });
      });

      await page.goto('/login');
      await waitForHydration(page);

      await page.fill(selectors.auth.emailInput, 'invalid@example.com');
      await page.fill(selectors.auth.passwordInput, 'wrongpassword');
      await page.click(selectors.auth.loginButton);

      // Should show error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');

      // Should stay on login page
      await expect(page).toHaveURL('/login');
    });

    test('should validate form fields', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Try to submit empty form
      await page.click(selectors.auth.loginButton);

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

      // Fill invalid email
      await page.fill(selectors.auth.emailInput, 'invalid-email');
      await page.blur(selectors.auth.emailInput);

      // Should show email format error
      await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Logout
      await authHelper.logout();

      // Should redirect to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator(selectors.auth.loginButton)).toBeVisible();
    });

    test('should clear auth state after logout', async ({ page }) => {
      await authHelper.loginWithDeveloper();
      await authHelper.logout();

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should show logout confirmation', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      await page.click(selectors.auth.userMenu);

      // Should show logout option
      await expect(page.locator(selectors.auth.logoutButton)).toBeVisible();

      await page.click(selectors.auth.logoutButton);

      // Should show success message or redirect immediately
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected routes without authentication
      const protectedRoutes = ['/dashboard', '/settings', '/admin'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL('/login');
      }
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Should be able to access dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');

      // Should be able to access settings
      await page.goto('/settings');
      await expect(page).toHaveURL('/settings');
    });
  });

  test.describe('Session Management', () => {
    test('should handle token expiration gracefully', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Mock token validation failure
      await page.route('**/api/auth/validate', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expired' })
        });
      });

      // Make an API call that triggers validation
      await page.goto('/dashboard');
      await page.reload();

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should refresh token automatically', async ({ page }) => {
      await authHelper.loginWithDeveloper();

      // Mock successful token refresh
      let refreshCount = 0;
      await page.route('**/api/auth/validate', async route => {
        refreshCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            user: testUsers.developer,
            refreshed: refreshCount > 1
          })
        });
      });

      // Navigate around to trigger validations
      await page.goto('/settings');
      await page.goto('/dashboard');

      // Should still be authenticated
      await expect(page.locator(selectors.auth.userMenu)).toBeVisible();
    });
  });

  test.describe('OAuth Integration', () => {
    test('should handle OAuth callback successfully', async ({ page }) => {
      // Mock OAuth callback
      await page.goto('/auth/callback?provider=google&code=mock-auth-code');

      // Should process OAuth and redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator(selectors.auth.userMenu)).toBeVisible();
    });

    test('should handle OAuth errors', async ({ page }) => {
      // Mock OAuth error
      await page.goto('/auth/callback?error=access_denied');

      // Should show error and redirect to login
      await expect(page).toHaveURL('/login');
      await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
    });

    test('should initiate OAuth flow', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Click OAuth button
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click('[data-testid="google-oauth-button"]')
      ]);

      // Should open OAuth popup
      expect(popup.url()).toContain('oauth');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Tab through form
      await page.keyboard.press('Tab');
      await expect(page.locator(selectors.auth.emailInput)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator(selectors.auth.passwordInput)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator(selectors.auth.loginButton)).toBeFocused();

      // Should be able to submit with Enter
      await page.fill(selectors.auth.emailInput, testUsers.developer.email);
      await page.fill(selectors.auth.passwordInput, testUsers.developer.password);
      await page.keyboard.press('Enter');

      await expect(page).toHaveURL('/dashboard');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Check form accessibility
      await expect(page.locator(selectors.auth.emailInput)).toHaveAttribute('aria-label');
      await expect(page.locator(selectors.auth.passwordInput)).toHaveAttribute('aria-label');
      await expect(page.locator(selectors.auth.loginButton)).toHaveAttribute('aria-label');
    });

    test('should announce auth state changes to screen readers', async ({ page }) => {
      await page.goto('/login');
      await waitForHydration(page);

      // Should have live region for announcements
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();

      await authHelper.loginWithDeveloper();

      // Should announce successful login
      await expect(page.locator('[aria-live="polite"]')).toContainText('logged in');
    });
  });
});

console.log('Thermonuclear E2E: Authentication tests initialized for comprehensive coverage');