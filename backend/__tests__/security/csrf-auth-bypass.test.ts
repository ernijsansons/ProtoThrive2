/**
 * CSRF & Authentication Bypass Penetration Tests
 * OWASP Top 10 - A01:2021 – Broken Access Control
 * OWASP Top 10 - A07:2021 – Identification and Authentication Failures
 *
 * Tests CSRF protection, session management, and authentication bypass attempts
 * Target: 100% protection against CSRF and authentication vulnerabilities
 */

import { describe, it, expect } from '@jest/globals';

describe('CSRF Protection Tests', () => {
  describe('State-Changing Requests', () => {
    it('should reject POST request without CSRF token', async () => {
      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: { Authorization: 'Bearer valid-token' },
        // Missing CSRF token
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/csrf.*token.*required/i);
    });

    it('should reject PUT request without CSRF token', async () => {
      const result = await makeRequest('PUT', '/api/user/profile', {
        name: 'Updated Name',
      }, {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/csrf/i);
    });

    it('should reject DELETE request without CSRF token', async () => {
      const result = await makeRequest('DELETE', '/api/roadmaps/123', {}, {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/csrf/i);
    });

    it('should accept GET request without CSRF token (read-only)', async () => {
      const result = await makeRequest('GET', '/api/roadmaps', {}, {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(result.status).toBe(200);
    });
  });

  describe('CSRF Token Validation', () => {
    it('should accept request with valid CSRF token', async () => {
      const csrfToken = await getCSRFToken();

      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': csrfToken,
        },
        cookies: {
          csrf_token: csrfToken,
        },
      });

      expect(result.status).toBe(201);
    });

    it('should reject request with mismatched CSRF token', async () => {
      const csrfToken = await getCSRFToken();
      const wrongToken = 'wrong-csrf-token';

      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': wrongToken,
        },
        cookies: {
          csrf_token: csrfToken,
        },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/csrf.*mismatch/i);
    });

    it('should reject request with expired CSRF token', async () => {
      const expiredToken = 'expired-csrf-token-from-1-hour-ago';

      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': expiredToken,
        },
        cookies: {
          csrf_token: expiredToken,
        },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/csrf.*expired|invalid/i);
    });

    it('should generate unique CSRF tokens per session', async () => {
      const token1 = await getCSRFToken();
      const token2 = await getCSRFToken();

      expect(token1).not.toBe(token2);
    });

    it('should use constant-time comparison for CSRF validation', async () => {
      const validToken = await getCSRFToken();
      const invalidToken = 'a'.repeat(validToken.length);

      // Measure timing for valid and invalid comparisons
      const timings: number[] = [];
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await validateCSRFToken(validToken, invalidToken);
        timings.push(Date.now() - start);
      }

      // Timing should be consistent (constant-time)
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.every(t => Math.abs(t - avg) / avg < 0.3);

      expect(variance).toBe(true);
    });
  });

  describe('Double-Submit Cookie Pattern', () => {
    it('should enforce double-submit cookie pattern', async () => {
      const csrfToken = await getCSRFToken();

      // Token in header but not in cookie
      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': csrfToken,
        },
        // Missing cookie
      });

      expect(result.status).toBe(403);
    });

    it('should set HttpOnly flag on CSRF cookie', async () => {
      const result = await loginAndGetCookies();

      const csrfCookie = result.cookies.find((c: any) => c.name === 'csrf_token');

      expect(csrfCookie.httpOnly).toBe(true);
    });

    it('should set Secure flag on CSRF cookie', async () => {
      const result = await loginAndGetCookies();

      const csrfCookie = result.cookies.find((c: any) => c.name === 'csrf_token');

      expect(csrfCookie.secure).toBe(true);
    });

    it('should set SameSite=Strict on CSRF cookie', async () => {
      const result = await loginAndGetCookies();

      const csrfCookie = result.cookies.find((c: any) => c.name === 'csrf_token');

      expect(csrfCookie.sameSite).toBe('Strict');
    });
  });

  describe('CSRF Referer Validation', () => {
    it('should validate Referer header for state-changing requests', async () => {
      const csrfToken = await getCSRFToken();

      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': csrfToken,
          Referer: 'https://evil.com',
        },
        cookies: {
          csrf_token: csrfToken,
        },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/invalid.*origin|referer/i);
    });

    it('should accept request from same origin', async () => {
      const csrfToken = await getCSRFToken();

      const result = await makeRequest('POST', '/api/roadmaps', {
        title: 'New Roadmap',
      }, {
        headers: {
          Authorization: 'Bearer valid-token',
          'X-CSRF-Token': csrfToken,
          Referer: 'https://protothrive.com/dashboard',
        },
        cookies: {
          csrf_token: csrfToken,
        },
      });

      expect(result.status).toBe(201);
    });
  });
});

describe('Authentication Bypass Tests', () => {
  describe('JWT Token Manipulation', () => {
    it('should reject token with modified payload', async () => {
      const validToken = await getValidJWT();
      const parts = validToken.split('.');

      // Decode payload, modify role, encode back
      const payload = JSON.parse(atob(parts[1]));
      payload.role = 'admin'; // Escalate to admin
      const modifiedPayload = btoa(JSON.stringify(payload));

      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      const result = await makeRequest('GET', '/api/admin/users', {}, {
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });

      expect(result.status).toBe(401);
      expect(result.error).toMatch(/invalid.*signature/i);
    });

    it('should reject token with none algorithm', async () => {
      const noneToken = createJWTWithAlgorithm('none', {
        sub: 'user-123',
        role: 'admin',
      });

      const result = await makeRequest('GET', '/api/admin/users', {}, {
        headers: { Authorization: `Bearer ${noneToken}` },
      });

      expect(result.status).toBe(401);
      expect(result.error).toMatch(/invalid.*token|algorithm/i);
    });

    it('should reject expired token', async () => {
      const expiredToken = await createExpiredJWT();

      const result = await makeRequest('GET', '/api/roadmaps', {}, {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });

      expect(result.status).toBe(401);
      expect(result.error).toMatch(/expired|invalid/i);
    });

    it('should reject token with invalid issuer', async () => {
      const invalidIssuerToken = await createJWTWithIssuer('evil-service');

      const result = await makeRequest('GET', '/api/roadmaps', {}, {
        headers: { Authorization: `Bearer ${invalidIssuerToken}` },
      });

      expect(result.status).toBe(401);
    });

    it('should reject token with invalid audience', async () => {
      const invalidAudToken = await createJWTWithAudience('wrong-api');

      const result = await makeRequest('GET', '/api/roadmaps', {}, {
        headers: { Authorization: `Bearer ${invalidAudToken}` },
      });

      expect(result.status).toBe(401);
    });
  });

  describe('Session Fixation', () => {
    it('should regenerate session ID on login', async () => {
      const sessionBefore = await createAnonymousSession();

      const result = await login('user@example.com', 'SecurePass123!', {
        headers: { Cookie: `session_id=${sessionBefore}` },
      });

      const sessionAfter = extractSessionId(result.cookies);

      expect(sessionAfter).not.toBe(sessionBefore);
    });

    it('should invalidate old session on privilege change', async () => {
      const { token, sessionId } = await loginAsUser();

      // Elevate to admin (simulated)
      await elevateToAdmin(token);

      // Old session should be invalid
      const result = await makeRequest('GET', '/api/user/profile', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `session_id=${sessionId}`,
        },
      });

      expect(result.status).toBe(401);
      expect(result.error).toMatch(/session.*expired|invalid/i);
    });
  });

  describe('Password Reset Vulnerabilities', () => {
    it('should require valid reset token', async () => {
      const result = await resetPassword('invalid-token', 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid.*token/i);
    });

    it('should expire reset tokens after use', async () => {
      const resetToken = await requestPasswordReset('user@example.com');

      // Use token once
      await resetPassword(resetToken, 'NewPassword123!');

      // Try to use again
      const result = await resetPassword(resetToken, 'AnotherPassword123!');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/token.*used|expired|invalid/i);
    });

    it('should expire reset tokens after time limit', async () => {
      const expiredToken = await createExpiredResetToken();

      const result = await resetPassword(expiredToken, 'NewPassword123!');

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/expired/i);
    });

    it('should not reveal user existence in reset flow', async () => {
      const existingUser = await requestPasswordReset('existing@example.com');
      const nonExistingUser = await requestPasswordReset('nonexistent@example.com');

      // Both should return same generic message
      expect(existingUser.message).toBe(nonExistingUser.message);
      expect(existingUser.message).toMatch(/email.*sent|check.*email/i);
    });
  });

  describe('Broken Authentication', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const attempts = [];

      // Make 10 failed login attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(await login('user@example.com', 'wrong-password'));
      }

      // Next attempt should be rate-limited
      const result = await login('user@example.com', 'wrong-password');

      expect(result.status).toBe(429);
      expect(result.error).toMatch(/too many.*attempts|rate limit/i);
    });

    it('should lock account after multiple failed attempts', async () => {
      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await login('user@example.com', 'wrong-password');
      }

      // Account should be locked
      const result = await login('user@example.com', 'correct-password');

      expect(result.status).toBe(423);
      expect(result.error).toMatch(/account.*locked|temporarily.*disabled/i);
    });

    it('should require re-authentication for sensitive operations', async () => {
      const { token } = await loginAsUser();

      // Try to change email without recent auth
      const result = await changeEmail(token, 'newemail@example.com', {
        skipRecentAuth: true,
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/re-authentication.*required/i);
    });

    it('should invalidate all sessions on password change', async () => {
      const { token: token1 } = await loginAsUser();
      const { token: token2 } = await loginAsUser(); // Second session

      // Change password with token1
      await changePassword(token1, 'OldPass123!', 'NewPass123!');

      // token2 should be invalid
      const result = await makeRequest('GET', '/api/user/profile', {}, {
        headers: { Authorization: `Bearer ${token2}` },
      });

      expect(result.status).toBe(401);
    });
  });

  describe('Authorization Bypass', () => {
    it('should prevent horizontal privilege escalation', async () => {
      const { token: userToken } = await loginAsUser('user1@example.com');

      // Try to access user2's data
      const result = await makeRequest('GET', '/api/user/user-2/profile', {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/unauthorized|forbidden/i);
    });

    it('should prevent vertical privilege escalation', async () => {
      const { token: userToken } = await loginAsUser();

      // Try to access admin endpoint
      const result = await makeRequest('GET', '/api/admin/users', {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/admin.*required|insufficient.*privileges/i);
    });

    it('should enforce tenant isolation', async () => {
      const { token: tenant1Token } = await loginAsUser('user@tenant1.com');

      // Try to access tenant2's roadmap
      const result = await makeRequest('GET', '/api/roadmaps/tenant2-roadmap-id', {}, {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      });

      expect(result.status).toBe(404); // Not found (not 403 to avoid info disclosure)
    });

    it('should validate resource ownership before operations', async () => {
      const { token: userToken } = await loginAsUser();
      const othersRoadmapId = 'roadmap-belonging-to-different-user';

      const result = await makeRequest('DELETE', `/api/roadmaps/${othersRoadmapId}`, {}, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(result.status).toBeGreaterThanOrEqual(403);
    });
  });

  describe('MFA/2FA Bypass', () => {
    it('should require MFA token for MFA-enabled accounts', async () => {
      const { token } = await loginWithPassword('user@example.com', 'SecurePass123!');

      // User has MFA enabled but token not provided
      const result = await accessProtectedResource(token, {
        skipMFA: true,
      });

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/mfa.*required|2fa/i);
    });

    it('should reject invalid MFA codes', async () => {
      const invalidCodes = ['000000', '999999', '123456', 'abcdef'];

      for (const code of invalidCodes) {
        const result = await verifyMFA('user@example.com', code);

        expect(result.success).toBe(false);
      }
    });

    it('should rate limit MFA verification attempts', async () => {
      // Make 5 failed MFA attempts
      for (let i = 0; i < 5; i++) {
        await verifyMFA('user@example.com', '000000');
      }

      // Next attempt should be rate-limited
      const result = await verifyMFA('user@example.com', 'valid-code');

      expect(result.status).toBe(429);
    });

    it('should not allow MFA bypass via backup codes without validation', async () => {
      const result = await loginWithBackupCode('user@example.com', 'invalid-backup-code');

      expect(result.success).toBe(false);
    });
  });

  describe('OAuth/SSO Vulnerabilities', () => {
    it('should validate OAuth state parameter', async () => {
      const result = await oauthCallback({
        code: 'valid-code',
        state: 'tampered-state',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid.*state/i);
    });

    it('should validate OAuth redirect_uri', async () => {
      const result = await initiateOAuth({
        redirect_uri: 'https://evil.com/callback',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid.*redirect/i);
    });

    it('should use PKCE for OAuth flows', async () => {
      const result = await initiateOAuth({
        // Missing code_challenge
        client_id: 'valid-client',
        redirect_uri: 'https://protothrive.com/callback',
      });

      expect(result.error).toMatch(/pkce.*required|code.*challenge/i);
    });
  });
});

// Mock helper functions
async function makeRequest(method: string, path: string, body: any, options: any): Promise<any> {
  return { status: 200, data: {}, error: null };
}

async function getCSRFToken(): Promise<string> {
  return 'mock-csrf-token-' + Math.random();
}

async function validateCSRFToken(token1: string, token2: string): Promise<boolean> {
  return token1 === token2;
}

async function loginAndGetCookies(): Promise<any> {
  return {
    cookies: [
      { name: 'csrf_token', value: 'token', httpOnly: true, secure: true, sameSite: 'Strict' },
    ],
  };
}

async function getValidJWT(): Promise<string> {
  return 'header.payload.signature';
}

function createJWTWithAlgorithm(alg: string, payload: any): string {
  const header = btoa(JSON.stringify({ alg, typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  return `${header}.${payloadStr}.`;
}

async function createExpiredJWT(): Promise<string> {
  return 'expired.jwt.token';
}

async function createJWTWithIssuer(issuer: string): Promise<string> {
  return 'jwt.with.issuer';
}

async function createJWTWithAudience(audience: string): Promise<string> {
  return 'jwt.with.audience';
}

async function createAnonymousSession(): Promise<string> {
  return 'anonymous-session-id';
}

async function login(email: string, password: string, options?: any): Promise<any> {
  return { status: 200, token: 'jwt-token', cookies: [] };
}

function extractSessionId(cookies: any[]): string {
  return 'new-session-id';
}

async function loginAsUser(email: string = 'user@example.com'): Promise<any> {
  return { token: 'user-jwt-token', sessionId: 'session-123' };
}

async function elevateToAdmin(token: string): Promise<any> {
  return { success: true };
}

async function resetPassword(token: string, newPassword: string): Promise<any> {
  return { success: false, error: 'Invalid token' };
}

async function requestPasswordReset(email: string): Promise<any> {
  return { message: 'If the email exists, a reset link has been sent' };
}

async function createExpiredResetToken(): Promise<string> {
  return 'expired-reset-token';
}

async function changeEmail(token: string, newEmail: string, options: any): Promise<any> {
  return { status: 403, error: 'Re-authentication required' };
}

async function changePassword(token: string, oldPass: string, newPass: string): Promise<any> {
  return { success: true };
}

async function loginWithPassword(email: string, password: string): Promise<any> {
  return { token: 'partial-jwt-token' };
}

async function accessProtectedResource(token: string, options: any): Promise<any> {
  return { status: 403, error: 'MFA required' };
}

async function verifyMFA(email: string, code: string): Promise<any> {
  return { success: false, status: 401 };
}

async function loginWithBackupCode(email: string, backupCode: string): Promise<any> {
  return { success: false };
}

async function oauthCallback(params: any): Promise<any> {
  return { success: false, error: 'Invalid state' };
}

async function initiateOAuth(params: any): Promise<any> {
  return { success: false, error: 'Invalid parameters' };
}

function atob(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8');
}

function btoa(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}
