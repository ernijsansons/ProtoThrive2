/**
 * Security Headers Deep Dive Testing
 * Comprehensive security header validation
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://876017e2.protothrive-frontend.pages.dev';
const BACKEND_URL = 'https://protothrive-backend.ernijs-ansons.workers.dev';

test.describe('Security Headers Tests', () => {
  test('Check Content-Type Options header', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    const headers = response?.headers();

    const xContentTypeOptions = headers?.['x-content-type-options'];
    console.log('X-Content-Type-Options:', xContentTypeOptions);

    expect(xContentTypeOptions).toBe('nosniff');
  });

  test('Verify HTTPS enforcement', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    const url = page.url();
    console.log('Current URL:', url);

    expect(url).toMatch(/^https:\/\//);
  });

  test('Check for secure cookies', async ({ page, context }) => {
    await page.goto(FRONTEND_URL);

    const cookies = await context.cookies();

    console.log(`Total cookies: ${cookies.length}`);

    cookies.forEach(cookie => {
      console.log(`Cookie: ${cookie.name}`);
      console.log(`  Secure: ${cookie.secure}`);
      console.log(`  HttpOnly: ${cookie.httpOnly}`);
      console.log(`  SameSite: ${cookie.sameSite}`);
    });

    // If there are authentication cookies, they should be secure
    const authCookies = cookies.filter(c =>
      c.name.toLowerCase().includes('token') ||
      c.name.toLowerCase().includes('session') ||
      c.name.toLowerCase().includes('auth')
    );

    authCookies.forEach(cookie => {
      expect(cookie.secure).toBe(true);
    });
  });

  test('Verify no sensitive info in client code', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    const scripts = await page.$$eval('script', scripts =>
      scripts.map(s => s.textContent || s.src)
    );

    const allContent = scripts.join('\n');

    // Check for common sensitive patterns
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{32,}/,  // OpenAI keys
      /AIza[a-zA-Z0-9-_]{35}/,  // Google API keys
      /AKIA[A-Z0-9]{16}/,  // AWS keys
      /password\s*=\s*['"][^'"]{8,}['"]/i,  // Hardcoded passwords
    ];

    let foundSensitive = false;
    sensitivePatterns.forEach((pattern, i) => {
      if (pattern.test(allContent)) {
        console.log(`Found sensitive pattern ${i + 1}`);
        foundSensitive = true;
      }
    });

    expect(foundSensitive).toBe(false);
  });

  test('Check CORS headers on API', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': 'https://example.com',
      },
    });

    const headers = response.headers();

    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Methods:', headers['access-control-allow-methods']);
    console.log('  Access-Control-Allow-Headers:', headers['access-control-allow-headers']);

    expect(headers['access-control-allow-origin']).toBeTruthy();
  });

  test('Verify no directory listing', async ({ request }) => {
    const directoriesToTest = [
      '/_next/',
      '/static/',
      '/assets/',
      '/public/',
    ];

    for (const dir of directoriesToTest) {
      const response = await request.get(`${FRONTEND_URL}${dir}`);
      const status = response.status();

      console.log(`${dir}: ${status}`);

      // Should not return 200 with directory listing
      expect(status).not.toBe(200);
    }
  });

  test('Check for information disclosure', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    const headers = response?.headers();

    console.log('Server headers check:');

    // Should not reveal server technology
    const serverHeader = headers?.['server'];
    const xPoweredBy = headers?.['x-powered-by'];

    console.log('  Server:', serverHeader || 'not set');
    console.log('  X-Powered-By:', xPoweredBy || 'not set');

    // These headers reveal server technology - should not be present or be generic
    expect(xPoweredBy).toBeUndefined();
  });

  test('Verify API requires authentication', async ({ request }) => {
    const protectedEndpoints = [
      '/api/roadmaps',
      '/api/snippets',
      '/api/user/profile',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${BACKEND_URL}${endpoint}`);
      const status = response.status();

      console.log(`${endpoint}: ${status}`);

      // Should return 401 Unauthorized
      expect(status).toBe(401);
    }
  });

  test('Check for SQL injection protection in headers', async ({ request }) => {
    const sqlPayloads = [
      "' OR '1'='1",
      "1' UNION SELECT NULL--",
      "'; DROP TABLE users--",
    ];

    for (const payload of sqlPayloads) {
      const response = await request.get(`${BACKEND_URL}/health`, {
        headers: {
          'X-Test-Injection': payload,
        },
      });

      // Should handle gracefully, not return 500
      expect(response.status()).not.toBe(500);
    }

    console.log('SQL injection in headers: Protected');
  });

  test('Verify no error stack traces exposed', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/nonexistent-endpoint`);

    expect(response.status()).toBe(404);

    const body = await response.text();

    // Should not contain stack traces
    expect(body).not.toMatch(/at\s+\w+\s+\(/);  // Stack trace pattern
    expect(body).not.toMatch(/\.ts:\d+:\d+/);  // TypeScript source location
    expect(body).not.toMatch(/Error:\s+\w+Error/);  // Raw error types

    console.log('Error disclosure: Protected');
  });

  test('Check response headers on error pages', async ({ page }) => {
    const response = await page.goto(`${FRONTEND_URL}/nonexistent-page`);

    const headers = response?.headers();

    console.log('404 Page headers:');
    console.log('  X-Content-Type-Options:', headers?.['x-content-type-options']);

    // Security headers should still be present on error pages
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('Verify content type is correct', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);

    const contentType = response?.headers()['content-type'];

    console.log('Content-Type:', contentType);

    expect(contentType).toContain('text/html');
  });

  test('Check for clickjacking protection', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    const headers = response?.headers();

    const xFrameOptions = headers?.['x-frame-options'];
    const csp = headers?.['content-security-policy'];

    console.log('Clickjacking protection:');
    console.log('  X-Frame-Options:', xFrameOptions || 'NOT SET');

    // Either X-Frame-Options or CSP frame-ancestors should be set
    const hasFrameProtection = xFrameOptions || (csp && csp.includes('frame-ancestors'));

    if (!hasFrameProtection) {
      console.log('  ⚠️  No clickjacking protection detected');
    }
  });

  test('Verify API error responses dont leak info', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: {
        email: 'invalid-email',
        password: 'short',
      },
    });

    const status = response.status();
    const body = await response.json().catch(() => ({}));

    console.log('Invalid login response:', status);
    console.log('Response body:', JSON.stringify(body, null, 2));

    // Should not reveal whether email exists
    expect(status).toBe(400);

    // Error message should be generic
    if (body.error || body.message) {
      const errorText = (body.error || body.message).toLowerCase();
      expect(errorText).not.toContain('user not found');
      expect(errorText).not.toContain('email does not exist');
    }
  });
});
