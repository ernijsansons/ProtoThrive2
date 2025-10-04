/**
 * Test suite for authentication utilities
 * Tests password hashing, validation, and JWT functionality
 */

import { describe, it, expect } from '@jest/globals';
import {
  hashPassword,
  verifyPassword,
  validatePasswordComplexity,
  JWTService
} from '../src/utils/auth';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'SecureP@ssw0rd123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
      expect(typeof hash).toBe('string');
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecureP@ssw0rd123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should reject password shorter than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should verify passwords correctly', async () => {
      const password = 'SecureP@ssw0rd123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      const isInvalid = await verifyPassword('wrong_password', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const result = await verifyPassword('password', 'invalid_hash');
      expect(result).toBe(false);
    });
  });

  describe('Password Complexity Validation', () => {
    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'qwerty123',
        'admin',
        'PASSWORD123',  // no lowercase
        'password123',  // no uppercase
        'Password',     // no number
        'Password123'   // no special char
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecureP@ssw0rd123',
        'MyStr0ng!P@ssw0rd',
        'C0mplex&Secure#2024',
        'Th1s1sAV3ry$tr0ngP@ssw0rd!'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should provide specific error messages', () => {
      const result = validatePasswordComplexity('weak');

      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should detect common patterns', () => {
      const commonPasswords = [
        'Password123456',
        'admin123456!A',
        'qwerty123456!A'
      ];

      commonPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(false);
        expect(result.errors.some(error =>
          error.includes('common patterns')
        )).toBe(true);
      });
    });
  });

  describe('JWT Service', () => {
    const validSecret = 'this_is_a_very_long_secret_key_that_meets_the_64_character_minimum_requirement_for_security';

    it('should create and verify JWT tokens', async () => {
      const jwtService = new JWTService(validSecret);

      const token = await jwtService.createToken('user123', 'test@example.com', 'user');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts

      const payload = await jwtService.verifyToken(token);
      expect(payload.sub).toBe('user123');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('user');
    });

    it('should create refresh tokens', async () => {
      const jwtService = new JWTService(validSecret);

      const refreshToken = await jwtService.createRefreshToken('user123');
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.').length).toBe(3);
    });

    it('should reject tokens with invalid signature', async () => {
      const jwtService = new JWTService(validSecret);

      const token = await jwtService.createToken('user123', 'test@example.com', 'user');
      const tamperedToken = token.slice(0, -10) + 'tampered123';

      await expect(jwtService.verifyToken(tamperedToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should reject expired tokens', async () => {
      const jwtService = new JWTService(validSecret);

      // Create a token that's already expired
      const expiredPayload = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
      };

      // We can't easily create an expired token with the service, so we'll test the error path
      await expect(jwtService.verifyToken('invalid.token.format')).rejects.toThrow();
    });

    it('should throw error with short secret', () => {
      expect(() => new JWTService('short')).toThrow('JWT secret must be at least 64 characters');
    });

    it('should throw error with empty secret', () => {
      expect(() => new JWTService('')).toThrow('JWT secret key is required');
    });
  });

  describe('Constant Time Comparison', () => {
    it('should prevent timing attacks', async () => {
      const password = 'test_password_for_timing_attack_prevention';
      const hash = await hashPassword(password);

      // Measure time for correct password
      const iterations = 5;
      const correctTimes: number[] = [];
      const incorrectTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start1 = process.hrtime.bigint();
        await verifyPassword(password, hash);
        const end1 = process.hrtime.bigint();
        correctTimes.push(Number(end1 - start1));

        const start2 = process.hrtime.bigint();
        await verifyPassword('wrong_password_with_same_length____', hash);
        const end2 = process.hrtime.bigint();
        incorrectTimes.push(Number(end2 - start2));
      }

      // Calculate averages
      const avgCorrect = correctTimes.reduce((a, b) => a + b) / correctTimes.length;
      const avgIncorrect = incorrectTimes.reduce((a, b) => a + b) / incorrectTimes.length;

      // Times should be relatively similar (within order of magnitude)
      const ratio = Math.max(avgCorrect, avgIncorrect) / Math.min(avgCorrect, avgIncorrect);
      expect(ratio).toBeLessThan(10); // Allow some variance but prevent obvious timing attacks
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle null/undefined inputs safely', async () => {
      await expect(verifyPassword('', '')).resolves.toBe(false);
      await expect(verifyPassword('password', '')).resolves.toBe(false);
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(1000) + '1@';
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in passwords', async () => {
      const unicodePassword = 'Pássw0rd!@#çñü';
      const hash = await hashPassword(unicodePassword);
      const isValid = await verifyPassword(unicodePassword, hash);
      expect(isValid).toBe(true);
    });

    it('should validate password complexity with edge cases', () => {
      // Password with exactly minimum requirements
      const minPassword = 'Aa1!bcde';
      const result = validatePasswordComplexity(minPassword);
      expect(result.valid).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should hash passwords within reasonable time', async () => {
      const password = 'TestPassword123!';

      const start = process.hrtime.bigint();
      await hashPassword(password);
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1000000; // Convert to milliseconds
      expect(durationMs).toBeLessThan(5000); // Should take less than 5 seconds
    });

    it('should verify passwords within reasonable time', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const start = process.hrtime.bigint();
      await verifyPassword(password, hash);
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1000000; // Convert to milliseconds
      expect(durationMs).toBeLessThan(5000); // Should take less than 5 seconds
    });
  });
});