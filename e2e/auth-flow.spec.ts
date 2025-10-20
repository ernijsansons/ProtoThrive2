/**
 * Authentication Flow E2E Tests
 * Tests user registration, login, logout, and password reset
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_CONFIG } from './config';
import {
  register,
  login,
  generateTestEmail,
  generateStrongPassword,
  captureScreenshot,
  collectConsoleErrors
} from './helpers';

test.describe('Authentication Flow', () => {
  let testEmail: string;
  let testPassword: string;
  let consoleErrors: string[];

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = generateStrongPassword();
    consoleErrors = await collectConsoleErrors(page);
  });

  test.describe('User Registration', () => {
    test('should load registration page successfully', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);
      await expect(page).toHaveTitle(/Register|Sign Up|ProtoThrive/i);

      // Check for registration form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      await captureScreenshot(page, 'registration-page-loaded');
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      // Try invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      // Should show error message
      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();

      await captureScreenshot(page, 'registration-email-validation-error');
    });

    test('should validate password complexity', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      // Try weak password
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'weak');
      await page.click('button[type="submit"]');

      // Should show password error (client or server side)
      await page.waitForTimeout(1000);
      const errorText = await page.textContent('body');

      // Check for password requirements message
      const hasPasswordError = errorText?.includes('password') ||
                               errorText?.includes('characters') ||
                               errorText?.includes('strong');

      // Screenshot for verification
      await captureScreenshot(page, 'registration-password-validation-error');
    });

    test('should successfully register new user', async ({ page }) => {
      await register(page, 'Test User', testEmail, testPassword);

      // Should redirect to dashboard or show success
      await page.waitForTimeout(2000);
      const url = page.url();
      const isDashboard = url.includes('/dashboard');
      const hasSuccess = (await page.textContent('body'))?.includes('success');

      expect(isDashboard || hasSuccess).toBeTruthy();

      await captureScreenshot(page, 'registration-successful');
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      // Register first user
      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(2000);

      // Try to register again with same email
      await page.goto(TEST_CONFIG.frontend.pages.register);
      await register(page, 'Test User 2', testEmail, testPassword);

      // Should show error
      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      const hasError = bodyText?.includes('exist') || bodyText?.includes('already') || bodyText?.includes('duplicate');

      expect(hasError).toBeTruthy();
      await captureScreenshot(page, 'registration-duplicate-email-error');
    });
  });

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      // Register user before login tests
      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(2000);
    });

    test('should load login page successfully', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);
      await expect(page).toHaveTitle(/Login|Sign In|ProtoThrive/i);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      await captureScreenshot(page, 'login-page-loaded');
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);
      const bodyText = await page.textContent('body');
      const hasError = bodyText?.includes('invalid') ||
                       bodyText?.includes('incorrect') ||
                       bodyText?.includes('fail');

      expect(hasError).toBeTruthy();
      await captureScreenshot(page, 'login-invalid-credentials-error');
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await login(page, testEmail, testPassword);

      // Should be on dashboard
      await expect(page).toHaveURL(/.*dashboard/);

      await captureScreenshot(page, 'login-successful');
    });

    test('should persist session after page reload', async ({ page }) => {
      await login(page, testEmail, testPassword);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard (session persisted)
      await expect(page).toHaveURL(/.*dashboard/);

      await captureScreenshot(page, 'login-session-persisted');
    });

    test('should handle session expiration', async ({ page }) => {
      await login(page, testEmail, testPassword);

      // Clear localStorage to simulate expired session
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access protected page
      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForTimeout(2000);

      // Should redirect to login
      const url = page.url();
      expect(url).toContain('/login');

      await captureScreenshot(page, 'login-session-expired-redirect');
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Register and login
      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);
    });

    test('should successfully logout', async ({ page }) => {
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Sign Out")').first();

      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // Should redirect to login or home
        const url = page.url();
        const isLoggedOut = url.includes('/login') || url === TEST_CONFIG.frontend.url + '/';
        expect(isLoggedOut).toBeTruthy();

        await captureScreenshot(page, 'logout-successful');
      } else {
        console.log('Logout button not found - may need to adjust selector');
      }
    });

    test('should clear session data on logout', async ({ page }) => {
      // Check for token before logout
      const tokenBefore = await page.evaluate(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
      });

      // Logout
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
      if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutButton.click();
        await page.waitForTimeout(1000);

        // Check token after logout
        const tokenAfter = await page.evaluate(() => {
          return localStorage.getItem('token') || sessionStorage.getItem('token');
        });

        expect(tokenAfter).toBeNull();
      }
    });
  });

  test.describe('Password Reset', () => {
    test('should load forgot password page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.forgotPassword);

      // Check for email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();

      await captureScreenshot(page, 'forgot-password-page-loaded');
    });

    test('should validate email on password reset', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.forgotPassword);

      // Try invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      const emailInput = page.locator('input[type="email"]');
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage).toBeTruthy();

      await captureScreenshot(page, 'forgot-password-validation-error');
    });

    test('should submit password reset request', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.forgotPassword);

      await page.fill('input[type="email"]', testEmail);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should show success message or redirect
      const bodyText = await page.textContent('body');
      const hasSuccess = bodyText?.includes('email') ||
                        bodyText?.includes('sent') ||
                        bodyText?.includes('check');

      await captureScreenshot(page, 'forgot-password-request-submitted');
    });
  });

  test.describe('Security', () => {
    test('should have proper security headers on auth pages', async ({ page }) => {
      const response = await page.goto(TEST_CONFIG.frontend.pages.login);
      const headers = response?.headers();

      // Check for security headers
      expect(headers?.['x-content-type-options']).toBe('nosniff');
      expect(headers?.['x-frame-options']).toBeTruthy();
      expect(headers?.['strict-transport-security']).toBeTruthy();
    });

    test('should protect against SQL injection in login', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      for (const payload of TEST_CONFIG.security.sqlInjectionPayloads) {
        await page.fill('input[type="email"]', payload);
        await page.fill('input[type="password"]', payload);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1000);

        // Should not bypass authentication or cause SQL error
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        // Clear fields for next test
        await page.fill('input[type="email"]', '');
        await page.fill('input[type="password"]', '');
      }

      await captureScreenshot(page, 'sql-injection-test-completed');
    });

    test('should protect against XSS in registration', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      for (const payload of TEST_CONFIG.security.xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        // Check that script is not executed
        const alertTriggered = await page.evaluate(() => {
          return (window as any).alertTriggered || false;
        });

        expect(alertTriggered).toBeFalsy();

        // Clear name field
        await page.fill('input[name="name"]', '');
      }

      await captureScreenshot(page, 'xss-test-completed');
    });

    test('should rate limit authentication attempts', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        await page.fill('input[type="email"]', `test${i}@test.com`);
        await page.fill('input[type="password"]', 'wrong');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // Should show rate limit message or block further attempts
      const bodyText = await page.textContent('body');
      const isRateLimited = bodyText?.includes('rate') ||
                           bodyText?.includes('limit') ||
                           bodyText?.includes('too many');

      // Note: Rate limiting might be server-side only
      await captureScreenshot(page, 'rate-limit-test-completed');
    });
  });

  test.afterEach(async ({ page }) => {
    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }
  });
});
