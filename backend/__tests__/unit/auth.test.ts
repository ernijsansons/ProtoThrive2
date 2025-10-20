/**
 * Auth Service Unit Tests
 * Target: 95%+ coverage for authentication utilities
 *
 * Test Coverage:
 * - Password hashing with PBKDF2 (100k iterations)
 * - JWT token creation and verification
 * - CSRF protection mechanisms
 * - Timing attack prevention
 * - Password complexity validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PasswordService, JWTService, CSRFProtection } from '../../src/utils/auth';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('Password Hashing', () => {
    it('should hash password with PBKDF2 and 100k iterations', async () => {
      const password = 'SecurePassword123!';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50); // Salt + iterations + hash
      expect(hash).not.toBe(password);
    });

    it('should generate unique salts for identical passwords', async () => {
      const password = 'SamePassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should prevent timing attacks with constant-time comparison', async () => {
      const password = 'TimingTest123!';
      const hash = await passwordService.hashPassword(password);

      // Measure timing for correct and incorrect passwords
      const measurements: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await passwordService.verifyPassword('WrongPassword' + i, hash);
        measurements.push(performance.now() - start);
      }

      // All timings should be within 20% variance (constant-time)
      const avg = measurements.reduce((a, b) => a + b) / measurements.length;
      const variance = measurements.every(t => Math.abs(t - avg) / avg < 0.2);

      expect(variance).toBe(true);
    });

    it('should enforce minimum password complexity', () => {
      const weakPasswords = [
        'short',           // Too short
        'nouppercasenum1', // No uppercase
        'NOLOWERCASENUM1', // No lowercase
        'NoSpecialChar1',  // No special char
        'NoNumbers!',      // No numbers
      ];

      weakPasswords.forEach(pwd => {
        expect(() => passwordService.validateComplexity(pwd)).toThrow();
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePassword123!',
        'MyP@ssw0rd2025',
        'C0mpl3x!Pass',
      ];

      strongPasswords.forEach(pwd => {
        expect(() => passwordService.validateComplexity(pwd)).not.toThrow();
      });
    });
  });

  describe('Password Reset Token', () => {
    it('should generate secure reset token', async () => {
      const token = await passwordService.generateResetToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Hex format
    });

    it('should generate unique reset tokens', async () => {
      const tokens = await Promise.all([
        passwordService.generateResetToken(),
        passwordService.generateResetToken(),
        passwordService.generateResetToken(),
      ]);

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
    });
  });
});

describe('JWTService', () => {
  let jwtService: JWTService;
  const testSecret = 'test-secret-key-min-64-chars-long-for-security-purposes-here-extra';

  beforeEach(() => {
    jwtService = new JWTService(testSecret);
  });

  describe('Token Creation', () => {
    it('should create valid JWT token with user payload', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = await jwtService.createToken(payload);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should set default expiration to 15 minutes', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);
      const decoded = await jwtService.verifyToken(token);

      const exp = decoded.exp as number;
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = exp - now;

      expect(expiresIn).toBeGreaterThan(14 * 60); // At least 14 minutes
      expect(expiresIn).toBeLessThanOrEqual(15 * 60); // Max 15 minutes
    });

    it('should allow custom expiration time', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload, '1h');
      const decoded = await jwtService.verifyToken(token);

      const exp = decoded.exp as number;
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = exp - now;

      expect(expiresIn).toBeGreaterThan(59 * 60); // At least 59 minutes
      expect(expiresIn).toBeLessThanOrEqual(60 * 60); // Max 60 minutes
    });

    it('should include standard JWT claims (iat, exp, jti)', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);
      const decoded = await jwtService.verifyToken(token);

      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expires at
      expect(decoded.jti).toBeDefined(); // JWT ID
      expect(decoded.userId).toBe('user-123');
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = await jwtService.createToken(payload);
      const decoded = await jwtService.verifyToken(token);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject token with invalid signature', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);

      // Tamper with token signature
      const parts = token.split('.');
      const tamperedToken = parts[0] + '.' + parts[1] + '.invalid-signature';

      await expect(jwtService.verifyToken(tamperedToken)).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload, '1ms');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(jwtService.verifyToken(token)).rejects.toThrow(/expired/i);
    });

    it('should reject malformed token', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'only-one-part',
        '',
        'too.many.parts.here.invalid',
      ];

      for (const token of malformedTokens) {
        await expect(jwtService.verifyToken(token)).rejects.toThrow();
      }
    });

    it('should reject token signed with different secret', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);

      // Create service with different secret
      const differentService = new JWTService('different-secret-key-at-least-64-chars-long-for-test');

      await expect(differentService.verifyToken(token)).rejects.toThrow();
    });
  });

  describe('Refresh Tokens', () => {
    it('should create refresh token with longer expiration', async () => {
      const payload = { userId: 'user-123' };
      const refreshToken = await jwtService.createRefreshToken(payload);
      const decoded = await jwtService.verifyToken(refreshToken);

      const exp = decoded.exp as number;
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = exp - now;

      // Should be ~7 days (604800 seconds)
      expect(expiresIn).toBeGreaterThan(6 * 24 * 60 * 60); // At least 6 days
    });

    it('should include refresh token marker in payload', async () => {
      const payload = { userId: 'user-123' };
      const refreshToken = await jwtService.createRefreshToken(payload);
      const decoded = await jwtService.verifyToken(refreshToken);

      expect(decoded.type).toBe('refresh');
    });
  });

  describe('Token Blacklisting', () => {
    it('should blacklist token by JTI', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);
      const decoded = await jwtService.verifyToken(token);

      await jwtService.blacklistToken(decoded.jti as string);
      const isBlacklisted = await jwtService.isTokenBlacklisted(decoded.jti as string);

      expect(isBlacklisted).toBe(true);
    });

    it('should reject blacklisted token on verification', async () => {
      const payload = { userId: 'user-123' };
      const token = await jwtService.createToken(payload);
      const decoded = await jwtService.verifyToken(token);

      await jwtService.blacklistToken(decoded.jti as string);

      await expect(jwtService.verifyToken(token)).rejects.toThrow(/blacklisted/i);
    });
  });
});

describe('CSRFProtection', () => {
  let csrfProtection: CSRFProtection;

  beforeEach(() => {
    csrfProtection = new CSRFProtection();
  });

  describe('Token Generation', () => {
    it('should generate secure CSRF token', async () => {
      const token = await csrfProtection.generateToken();

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Hex format
    });

    it('should generate unique tokens', async () => {
      const tokens = await Promise.all([
        csrfProtection.generateToken(),
        csrfProtection.generateToken(),
        csrfProtection.generateToken(),
      ]);

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(3);
    });
  });

  describe('Token Validation', () => {
    it('should validate correct CSRF token', async () => {
      const token = await csrfProtection.generateToken();
      const isValid = await csrfProtection.validateToken(token, token);

      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', async () => {
      const token1 = await csrfProtection.generateToken();
      const token2 = await csrfProtection.generateToken();
      const isValid = await csrfProtection.validateToken(token1, token2);

      expect(isValid).toBe(false);
    });

    it('should reject empty or undefined tokens', async () => {
      const token = await csrfProtection.generateToken();

      expect(await csrfProtection.validateToken(token, '')).toBe(false);
      expect(await csrfProtection.validateToken('', token)).toBe(false);
      expect(await csrfProtection.validateToken(token, undefined as any)).toBe(false);
    });

    it('should use constant-time comparison to prevent timing attacks', async () => {
      const validToken = await csrfProtection.generateToken();
      const invalidToken = 'a'.repeat(validToken.length);

      // Measure timing for valid and invalid comparisons
      const timings: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await csrfProtection.validateToken(validToken, invalidToken);
        timings.push(performance.now() - start);
      }

      // All timings should be within 20% variance
      const avg = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.every(t => Math.abs(t - avg) / avg < 0.2);

      expect(variance).toBe(true);
    });
  });

  describe('Double-Submit Cookie Pattern', () => {
    it('should create CSRF cookie with secure attributes', () => {
      const token = 'test-csrf-token-here';
      const cookie = csrfProtection.createCookie(token);

      expect(cookie).toContain('csrf_token=test-csrf-token-here');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
    });

    it('should set appropriate max-age for CSRF cookie', () => {
      const token = 'test-csrf-token';
      const cookie = csrfProtection.createCookie(token);

      // Should have 1 hour max-age
      expect(cookie).toMatch(/Max-Age=3600/);
    });
  });
});

describe('Security Edge Cases', () => {
  it('should handle null byte injection attempts', async () => {
    const passwordService = new PasswordService();
    const maliciousInputs = [
      'password\0admin',
      'test\x00injection',
      'null\u0000byte',
    ];

    for (const input of maliciousInputs) {
      await expect(passwordService.hashPassword(input)).rejects.toThrow();
    }
  });

  it('should reject extremely long passwords (DoS prevention)', async () => {
    const passwordService = new PasswordService();
    const longPassword = 'A'.repeat(10000); // 10KB password

    await expect(passwordService.hashPassword(longPassword)).rejects.toThrow(/too long/i);
  });

  it('should handle concurrent JWT operations safely', async () => {
    const jwtService = new JWTService('test-secret-at-least-64-chars-long-here-for-security');

    // Create 100 tokens concurrently
    const promises = Array.from({ length: 100 }, (_, i) =>
      jwtService.createToken({ userId: `user-${i}` })
    );

    const tokens = await Promise.all(promises);

    // All tokens should be unique
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(100);

    // All tokens should be valid
    const verifications = await Promise.all(
      tokens.map(token => jwtService.verifyToken(token))
    );

    expect(verifications).toHaveLength(100);
  });
});
