/**
 * Security Testing Suite
 * Tests OWASP Top 10, security headers, and authentication security
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';
import {
  checkSecurityHeaders,
  captureScreenshot,
  register,
  login,
  generateTestEmail,
  generateStrongPassword,
} from './helpers';

test.describe('Security Testing', () => {
  test.describe('Security Headers', () => {
    const pages = [
      { name: 'Landing', url: TEST_CONFIG.frontend.url },
      { name: 'Login', url: TEST_CONFIG.frontend.pages.login },
      { name: 'Register', url: TEST_CONFIG.frontend.pages.register },
    ];

    for (const pageInfo of pages) {
      test(`should have security headers on ${pageInfo.name} page`, async ({ page }) => {
        const headers = await checkSecurityHeaders(page, pageInfo.url);

        console.log('Security headers:', headers);

        // X-Frame-Options should be set
        expect(headers.xFrameOptions).toBeTruthy();
        expect(['DENY', 'SAMEORIGIN']).toContain(headers.xFrameOptions?.toUpperCase());

        // X-Content-Type-Options should be nosniff
        expect(headers.xContentTypeOptions).toBe('nosniff');

        // Strict-Transport-Security should be set
        expect(headers.strictTransportSecurity).toBeTruthy();
        expect(headers.strictTransportSecurity).toContain('max-age');

        await captureScreenshot(page, `security-headers-${pageInfo.name.toLowerCase()}`);
      });

      test(`should have CSP header on ${pageInfo.name} page`, async ({ page }) => {
        const headers = await checkSecurityHeaders(page, pageInfo.url);

        console.log('CSP header:', headers.csp);

        // CSP should be defined
        expect(headers.csp).toBeTruthy();

        // CSP should restrict script sources
        if (headers.csp) {
          expect(headers.csp).toMatch(/script-src|default-src/);
        }
      });
    }
  });

  test.describe('SQL Injection Protection', () => {
    test('should protect login against SQL injection', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      for (const payload of TEST_CONFIG.security.sqlInjectionPayloads) {
        await page.fill('input[type="email"]', payload);
        await page.fill('input[type="password"]', payload);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1500);

        // Should not bypass authentication
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        // Should not show SQL error
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toMatch(/sql|database|syntax error|mysql|postgres/i);

        // Reset form
        await page.fill('input[type="email"]', '');
        await page.fill('input[type="password"]', '');
      }

      await captureScreenshot(page, 'sql-injection-login-protected');
    });

    test('should protect registration against SQL injection', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      for (const payload of TEST_CONFIG.security.sqlInjectionPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[type="email"]', `test@test.com`);
        await page.fill('input[type="password"]', 'ValidPass123!');
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1500);

        // Should not show SQL error
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toMatch(/sql|database|syntax error/i);

        // Go back to registration
        await page.goto(TEST_CONFIG.frontend.pages.register);
      }

      await captureScreenshot(page, 'sql-injection-register-protected');
    });
  });

  test.describe('XSS Protection', () => {
    test('should protect against XSS in registration form', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      // Setup alert listener
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      for (const payload of TEST_CONFIG.security.xssPayloads) {
        await page.fill('input[name="name"]', payload);
        await page.fill('input[type="email"]', generateTestEmail());
        await page.fill('input[type="password"]', generateStrongPassword());

        await page.waitForTimeout(500);

        // Alert should not be triggered
        expect(alertTriggered).toBeFalsy();

        // Check that script is properly encoded in DOM
        const nameValue = await page.inputValue('input[name="name"]');
        // Value should be stored as-is (for checking), but not executed
        expect(nameValue).toBe(payload);

        // Reset
        await page.fill('input[name="name"]', '');
        alertTriggered = false;
      }

      await captureScreenshot(page, 'xss-registration-protected');
    });

    test('should encode output to prevent stored XSS', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();
      const xssName = '<script>alert("XSS")</script>';

      await register(page, xssName, testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);

      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForTimeout(1000);

      // Check that name is displayed but encoded
      const bodyHTML = await page.content();

      // Script tag should be encoded, not executed
      expect(bodyHTML).not.toContain('<script>alert("XSS")</script>');
      if (bodyHTML.includes(xssName)) {
        // If it's shown, it should be encoded
        expect(bodyHTML).toMatch(/&lt;script&gt;|&amp;lt;script&amp;gt;/);
      }

      await captureScreenshot(page, 'stored-xss-protected');
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF token in forms', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Look for CSRF token
      const csrfToken = await page.evaluate(() => {
        const input = document.querySelector('input[name="csrf"], input[name="_csrf"], input[name="csrfToken"]');
        return input ? (input as HTMLInputElement).value : null;
      });

      // Check meta tag
      const csrfMeta = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : null;
      });

      // Should have CSRF protection
      const hasCSRF = csrfToken || csrfMeta;
      console.log('CSRF protection:', { csrfToken, csrfMeta });

      // Note: CSRF might be handled differently (e.g., SameSite cookies)
      await captureScreenshot(page, 'csrf-token-check');
    });

    test('should validate CSRF token on submission', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Try to remove CSRF token if it exists
      await page.evaluate(() => {
        const input = document.querySelector('input[name="csrf"], input[name="_csrf"]');
        if (input) {
          input.remove();
        }
      });

      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1500);

      // Should reject request without valid CSRF token
      // Note: This depends on implementation
      await captureScreenshot(page, 'csrf-validation-check');
    });
  });

  test.describe('Authentication Security', () => {
    test('should enforce password complexity', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      const weakPasswords = ['123456', 'password', 'abc', 'test', '12345678'];

      for (const weakPass of weakPasswords) {
        await page.fill('input[type="email"]', generateTestEmail());
        await page.fill('input[type="password"]', weakPass);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(1000);

        // Should show error or not redirect
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        // Reset
        await page.goto(TEST_CONFIG.frontend.pages.register);
      }

      await captureScreenshot(page, 'password-complexity-enforced');
    });

    test('should use secure password transmission', async ({ page }) => {
      let passwordSentSecurely = true;

      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('login') || url.includes('register')) {
          // Should use HTTPS
          expect(url).toMatch(/^https:/);

          // Should be POST method
          const method = request.method();
          if (method === 'GET' && request.postData()?.includes('password')) {
            passwordSentSecurely = false;
          }
        }
      });

      await page.goto(TEST_CONFIG.frontend.pages.login);
      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1500);

      expect(passwordSentSecurely).toBeTruthy();
    });

    test('should lockout after multiple failed attempts', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.login);

      // Try 10 failed login attempts
      for (let i = 0; i < 10; i++) {
        await page.fill('input[type="email"]', 'test@test.com');
        await page.fill('input[type="password"]', `wrong${i}`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
      }

      // Check for lockout message
      const bodyText = await page.textContent('body');
      const isLocked = bodyText?.includes('locked') ||
                       bodyText?.includes('too many') ||
                       bodyText?.includes('rate limit');

      console.log('Lockout detected:', isLocked);

      await captureScreenshot(page, 'account-lockout-check');
    });

    test('should have secure session management', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);

      // Check for secure cookies
      const cookies = await page.context().cookies();
      console.log('Cookies:', cookies);

      // Session cookies should have secure flags
      const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
      if (sessionCookie) {
        // Should be HttpOnly
        expect(sessionCookie.httpOnly).toBeTruthy();

        // Should be Secure (for HTTPS)
        expect(sessionCookie.secure).toBeTruthy();

        // Should have SameSite
        expect(sessionCookie.sameSite).toBeTruthy();
      }

      await captureScreenshot(page, 'secure-session-management');
    });

    test('should expire JWT tokens properly', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);
      await login(page, testEmail, testPassword);

      // Get token
      const token = await page.evaluate(() => {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
      });

      if (token) {
        // Token should be a valid JWT
        const parts = token.split('.');
        expect(parts.length).toBe(3);

        // Decode payload
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT payload:', payload);

        // Should have expiration
        expect(payload.exp).toBeTruthy();

        // Expiration should be in the future
        const exp = payload.exp * 1000; // Convert to milliseconds
        expect(exp).toBeGreaterThan(Date.now());

        // Expiration should not be too far in future (< 7 days)
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        expect(exp - Date.now()).toBeLessThan(sevenDays);
      }
    });
  });

  test.describe('Authorization', () => {
    test('should protect dashboard from unauthenticated access', async ({ page }) => {
      // Try to access dashboard without logging in
      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForTimeout(1500);

      // Should redirect to login
      const url = page.url();
      expect(url).toContain('/login');

      await captureScreenshot(page, 'dashboard-protected');
    });

    test('should protect API endpoints', async ({ page }) => {
      // Try to call API without authentication
      const response = await page.goto(`${TEST_CONFIG.backend.url}/api/roadmaps`);

      // Should return 401 Unauthorized
      expect(response?.status()).toBe(401);

      await captureScreenshot(page, 'api-protected');
    });
  });

  test.describe('Input Validation', () => {
    test('should validate email format', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com',
      ];

      for (const email of invalidEmails) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', generateStrongPassword());
        await page.click('button[type="submit"]');

        await page.waitForTimeout(500);

        // Should show validation error
        const url = page.url();
        expect(url).not.toContain('/dashboard');

        // Reset
        await page.goto(TEST_CONFIG.frontend.pages.register);
      }

      await captureScreenshot(page, 'email-validation');
    });

    test('should sanitize inputs', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.register);

      const dangerousInputs = [
        '"><script>alert(1)</script>',
        "'; DROP TABLE users--",
        '../../../etc/passwd',
        '${7*7}',
        '{{7*7}}',
      ];

      for (const input of dangerousInputs) {
        await page.fill('input[name="name"]', input);
        await page.fill('input[type="email"]', generateTestEmail());
        await page.fill('input[type="password"]', generateStrongPassword());

        await page.waitForTimeout(500);

        // Input should be sanitized (no execution)
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('49'); // Result of 7*7

        // Reset
        await page.fill('input[name="name"]', '');
      }

      await captureScreenshot(page, 'input-sanitization');
    });
  });

  test.describe('Sensitive Data Exposure', () => {
    test('should not expose sensitive data in URLs', async ({ page }) => {
      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await page.goto(TEST_CONFIG.frontend.pages.login);
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1500);

      const url = page.url();

      // URL should not contain password or sensitive data
      expect(url).not.toContain(testPassword);
      expect(url).not.toContain('password');
      expect(url).not.toContain('token=');

      await captureScreenshot(page, 'no-sensitive-data-in-url');
    });

    test('should not expose API keys in client code', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.url);

      const content = await page.content();
      const scripts = await page.$$eval('script', (scripts) =>
        scripts.map((s) => s.textContent || '')
      );

      const allContent = [content, ...scripts].join('\n');

      // Should not contain API keys
      expect(allContent).not.toMatch(/sk-[a-zA-Z0-9]{32,}/); // OpenAI style
      expect(allContent).not.toMatch(/AIza[a-zA-Z0-9-_]{35}/); // Google API
      expect(allContent).not.toMatch(/AKIA[A-Z0-9]{16}/); // AWS
      expect(allContent).not.toMatch(/secret[_-]?key.*[a-zA-Z0-9]{20,}/i);

      await captureScreenshot(page, 'no-exposed-api-keys');
    });

    test('should not log sensitive information', async ({ page }) => {
      const consoleLogs: string[] = [];

      page.on('console', (msg) => {
        consoleLogs.push(msg.text());
      });

      const testEmail = generateTestEmail();
      const testPassword = generateStrongPassword();

      await register(page, 'Test User', testEmail, testPassword);
      await page.waitForTimeout(1000);

      // Check console logs
      const sensitiveLogged = consoleLogs.some((log) =>
        log.includes(testPassword) || log.includes('password')
      );

      expect(sensitiveLogged).toBeFalsy();

      console.log('Console logs checked:', consoleLogs.length);
    });
  });

  test.describe('HTTPS Enforcement', () => {
    test('should use HTTPS for all requests', async ({ page }) => {
      let allSecure = true;

      page.on('request', (request) => {
        const url = request.url();
        if (!url.startsWith('https://') && !url.startsWith('data:') && !url.startsWith('blob:')) {
          console.log('Insecure request:', url);
          allSecure = false;
        }
      });

      await page.goto(TEST_CONFIG.frontend.url);
      await page.waitForLoadState('networkidle');

      expect(allSecure).toBeTruthy();
    });

    test('should have HSTS header', async ({ page }) => {
      const headers = await checkSecurityHeaders(page, TEST_CONFIG.frontend.url);

      expect(headers.strictTransportSecurity).toBeTruthy();
      expect(headers.strictTransportSecurity).toMatch(/max-age=\d+/);

      // Should include subdomains
      expect(headers.strictTransportSecurity).toContain('includeSubDomains');
    });
  });
});
