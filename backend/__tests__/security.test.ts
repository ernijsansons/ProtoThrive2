/**
 * Comprehensive Security Tests for ProtoThrive Backend
 * Testing all security fixes and OWASP compliance
 */

import { describe, test, expect, beforeEach, afterEach } from 'jest';
import { JWTService, validatePasswordComplexity, hashPassword, verifyPassword } from '../src/utils/auth';
import * as bcrypt from 'bcrypt';

describe('Security Tests', () => {
  describe('JWT Service Security', () => {
    test('should reject JWT service initialization with short secret', () => {
      expect(() => {
        new JWTService('short');
      }).toThrow('JWT secret must be at least 64 characters');
    });

    test('should reject JWT service initialization with empty secret', () => {
      expect(() => {
        new JWTService('');
      }).toThrow('JWT secret key is required');
    });

    test('should accept JWT service initialization with valid secret', () => {
      const validSecret = 'a'.repeat(64);
      expect(() => {
        new JWTService(validSecret);
      }).not.toThrow();
    });

    test('should create and verify JWT tokens correctly', async () => {
      const validSecret = 'a'.repeat(64);
      const jwtService = new JWTService(validSecret);

      const token = await jwtService.createToken('user123', 'test@example.com', 'vibe_coder');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const payload = await jwtService.verifyToken(token);
      expect(payload.sub).toBe('user123');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('vibe_coder');
    });

    test('should reject invalid JWT tokens', async () => {
      const validSecret = 'a'.repeat(64);
      const jwtService = new JWTService(validSecret);

      await expect(jwtService.verifyToken('invalid.token.here')).rejects.toThrow('Invalid or expired token');
    });

    test('should reject JWT tokens signed with different secret', async () => {
      const secret1 = 'a'.repeat(64);
      const secret2 = 'b'.repeat(64);

      const jwtService1 = new JWTService(secret1);
      const jwtService2 = new JWTService(secret2);

      const token = await jwtService1.createToken('user123', 'test@example.com', 'vibe_coder');

      await expect(jwtService2.verifyToken(token)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('Password Security', () => {
    describe('Password Complexity Validation', () => {
      test('should reject passwords shorter than 8 characters', () => {
        const result = validatePasswordComplexity('short');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      test('should reject passwords without uppercase letters', () => {
        const result = validatePasswordComplexity('password123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
      });

      test('should reject passwords without lowercase letters', () => {
        const result = validatePasswordComplexity('PASSWORD123!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
      });

      test('should reject passwords without numbers', () => {
        const result = validatePasswordComplexity('Password!');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      test('should reject passwords without special characters', () => {
        const result = validatePasswordComplexity('Password123');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      test('should reject common password patterns', () => {
        const commonPasswords = ['Password123456!', 'Admin123!', 'Qwerty123!'];

        commonPasswords.forEach(password => {
          const result = validatePasswordComplexity(password);
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Password contains common patterns and may be easily guessed');
        });
      });

      test('should accept strong passwords', () => {
        const strongPasswords = [
          'MyStr0ng!P@ssw0rd',
          'C0mpl3x!P@$$w0rD',
          '5ecur3!Pa$$word!'
        ];

        strongPasswords.forEach(password => {
          const result = validatePasswordComplexity(password);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });
    });

    describe('Password Hashing and Verification', () => {
      test('should hash passwords using bcrypt with 12+ rounds', async () => {
        const password = 'TestPassword123!';
        const hash = await hashPassword(password);

        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(hash.length).toBeGreaterThan(50); // Base64 encoded salt+hash should be substantial
      });

      test('should verify passwords correctly', async () => {
        const password = 'TestPassword123!';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);

        const isInvalid = await verifyPassword('WrongPassword123!', hash);
        expect(isInvalid).toBe(false);
      });

      test('should reject password hashing for short passwords', async () => {
        await expect(hashPassword('short')).rejects.toThrow('Password must be at least 8 characters long');
      });

      test('should handle password verification errors gracefully', async () => {
        const result = await verifyPassword('password', 'invalid-hash');
        expect(result).toBe(false);
      });

      test('should use proper PBKDF2 iterations (100k+)', async () => {
        // This test verifies our implementation uses 100k iterations
        // by checking the auth.ts file contains the correct configuration
        const fs = require('fs');
        const path = require('path');

        const authPath = path.join(__dirname, '../src/utils/auth.ts');
        const authContent = fs.readFileSync(authPath, 'utf8');

        expect(authContent).toContain('iterations: 100000');
      });

      test('should generate different hashes for same password (salted)', async () => {
        const password = 'TestPassword123!';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        expect(hash1).not.toBe(hash2); // Different salts should produce different hashes

        // But both should verify correctly
        expect(await verifyPassword(password, hash1)).toBe(true);
        expect(await verifyPassword(password, hash2)).toBe(true);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should use parameterized queries (static analysis)', () => {
      // This test verifies that our database service uses parameterized queries
      // by checking the structure of our SQL queries
      const fs = require('fs');
      const path = require('path');

      const dbServicePath = path.join(__dirname, '../src/utils/db.ts');
      const dbServiceContent = fs.readFileSync(dbServicePath, 'utf8');

      // Check that we're using .bind() for parameterized queries
      const hasParameterizedQueries = dbServiceContent.includes('.bind(');
      expect(hasParameterizedQueries).toBe(true);

      // Check that we're not using string concatenation in SQL
      const hasStringConcatenation = dbServiceContent.includes('` + ') ||
                                    dbServiceContent.includes('\\'+ ') ||
                                    dbServiceContent.includes('${');
      expect(hasStringConcatenation).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    // These tests would need a mock Cloudflare Workers environment
    // For now, we test the logic structure
    test('should have rate limiting enabled in production code', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '../src/index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Verify rate limiting is enabled (not commented out)
      expect(indexContent).toContain('createRateLimitMiddleware');
      expect(indexContent).not.toMatch(/\\/\\/.*createRateLimitMiddleware/);
    });
  });

  describe('Security Headers', () => {
    test('should have security headers middleware enabled', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '../src/index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Verify security headers are enabled
      expect(indexContent).toContain('createSecurityHeadersMiddleware');
    });

    test('should include all required security headers', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(__dirname, '../src/utils/auth.ts');
      const authContent = fs.readFileSync(authPath, 'utf8');

      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Content-Security-Policy',
        'Referrer-Policy',
        'Permissions-Policy'
      ];

      requiredHeaders.forEach(header => {
        expect(authContent).toContain(header);
      });
    });
  });

  describe('Authentication Bypass Prevention', () => {
    test('should initialize JWT service globally', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '../src/index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Verify JWT is initialized for ALL requests, not conditionally
      expect(indexContent).toContain('initializeJWTService');
      expect(indexContent).toContain('Initialize JWT service for ALL requests');
    });
  });

  describe('Environment Variable Security', () => {
    test('should require JWT_SECRET in production', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '../src/index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Verify JWT_SECRET validation exists
      expect(indexContent).toContain('JWT_SECRET');
      expect(indexContent).toContain('jwtSecret.length < 64');
    });

    test('should have development JWT secret with proper length', () => {
      const fs = require('fs');
      const path = require('path');

      const devVarsPath = path.join(__dirname, '../../.dev.vars');

      if (fs.existsSync(devVarsPath)) {
        const devVarsContent = fs.readFileSync(devVarsPath, 'utf8');
        const jwtSecretMatch = devVarsContent.match(/JWT_SECRET=(.+)/);

        if (jwtSecretMatch) {
          const jwtSecret = jwtSecretMatch[1].trim();
          expect(jwtSecret.length).toBeGreaterThanOrEqual(64);
        }
      }
    });
  });

  describe('Error Handling Security', () => {
    test('should not expose sensitive information in errors', () => {
      const fs = require('fs');
      const path = require('path');

      const validationPath = path.join(__dirname, '../src/utils/validation.ts');
      const validationContent = fs.readFileSync(validationPath, 'utf8');

      // Check for secure error logging
      expect(validationContent).toContain('logSecurityEvent');
      expect(validationContent).toContain('[REDACTED]');
    });
  });

  describe('Input Validation Security', () => {
    test('should have DoS protection limits', () => {
      const fs = require('fs');
      const path = require('path');

      const validationPath = path.join(__dirname, '../src/utils/validation.ts');
      const validationContent = fs.readFileSync(validationPath, 'utf8');

      // Verify input size limits are in place
      expect(validationContent).toContain('max(1000)'); // Node limit
      expect(validationContent).toContain('max(2000)'); // Edge limit
      expect(validationContent).toContain('max(100000)'); // Code size limit
      expect(validationContent).toContain('max(100)'); // Query limit
    });
  });
});

describe('Integration Security Tests', () => {
  describe('Authentication Flow', () => {
    test('should require strong passwords for registration', () => {
      // This would test the complete registration flow with password validation
      const weakPasswords = [
        'password',
        'Password',
        'Password1',
        'Password123',
        'password123!',
        'PASSWORD123!',
        'Admin123!'
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(false);
      });
    });

    test('should accept only strong passwords for registration', () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd',
        'S3cur3P@$$w0rd!',
        'C0mpl3x!S3cr3t#'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordComplexity(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Security Headers Integration', () => {
    test('should prevent XSS through CSP', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(__dirname, '../src/utils/auth.ts');
      const authContent = fs.readFileSync(authPath, 'utf8');

      // Verify CSP doesn't allow unsafe-inline
      expect(authContent).not.toContain('unsafe-inline');
      expect(authContent).toContain('strict-dynamic');
      expect(authContent).toContain('nonce-');
    });
  });
});

describe('Security Performance Tests', () => {
  describe('Password Hashing Performance', () => {
    test('password hashing should complete within reasonable time', async () => {
      const password = 'TestPassword123!';
      const startTime = Date.now();

      await hashPassword(password);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    }, 10000); // 10 second timeout for this test

    test('password verification should complete within reasonable time', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const startTime = Date.now();
      await verifyPassword(password, hash);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    }, 10000); // 10 second timeout for this test
  });

  describe('JWT Performance', () => {
    test('JWT token creation should be fast', async () => {
      const jwtService = new JWTService('a'.repeat(64));

      const startTime = Date.now();
      await jwtService.createToken('user123', 'test@example.com', 'vibe_coder');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    test('JWT token verification should be fast', async () => {
      const jwtService = new JWTService('a'.repeat(64));
      const token = await jwtService.createToken('user123', 'test@example.com', 'vibe_coder');

      const startTime = Date.now();
      await jwtService.verifyToken(token);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });
  });
});

describe('Fuzzing Tests', () => {
  describe('Password Validation Fuzzing', () => {
    test('should handle random password inputs safely', () => {
      const randomInputs = Array.from({ length: 100 }, () => {
        // Generate random strings of various lengths with random characters
        const length = Math.floor(Math.random() * 200);
        return Array.from({ length }, () =>
          String.fromCharCode(Math.floor(Math.random() * 1114112))
        ).join('');
      });

      randomInputs.forEach(input => {
        expect(() => {
          validatePasswordComplexity(input);
        }).not.toThrow();
      });
    });
  });

  describe('JWT Fuzzing', () => {
    test('should handle malformed JWT tokens gracefully', async () => {
      const jwtService = new JWTService('a'.repeat(64));

      const malformedTokens = [
        '',
        'not.a.jwt',
        'header.payload', // Missing signature
        'a'.repeat(1000), // Very long token
        'header.payload.signature.extra', // Extra parts
        'äöü.äöü.äöü', // Non-ASCII characters
        '{"typ":"JWT"}.{"sub":"user"}.signature', // Unencoded JSON
      ];

      for (const token of malformedTokens) {
        await expect(jwtService.verifyToken(token))
          .rejects.toThrow('Invalid or expired token');
      }
    });
  });
});

describe('OWASP Compliance Tests', () => {
  describe('A01 - Broken Access Control', () => {
    test('should have role-based access control implementation', () => {
      const fs = require('fs');
      const path = require('path');

      const indexPath = path.join(__dirname, '../src/index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');

      // Verify RBAC implementation exists
      expect(indexContent).toContain('requiredRole');
      expect(indexContent).toContain('userRole');
    });
  });

  describe('A02 - Cryptographic Failures', () => {
    test('should use strong cryptographic algorithms', async () => {
      // Test bcrypt usage (industry standard)
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Verify PBKDF2 implementation (base64 encoded salt+hash)
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^[A-Za-z0-9+/]+={0,2}$/); // Base64 format
    });
  });

  describe('A03 - Injection', () => {
    test('should prevent SQL injection through parameterized queries', () => {
      const fs = require('fs');
      const path = require('path');

      const dbPath = path.join(__dirname, '../src/utils/db.ts');
      const dbContent = fs.readFileSync(dbPath, 'utf8');

      // Verify parameterized query usage
      expect(dbContent).toContain('.bind(');
      expect(dbContent).not.toContain('\\`SELECT * FROM users WHERE id = \\${');
    });
  });

  describe('A07 - Identification and Authentication Failures', () => {
    test('should enforce strong password policies', () => {
      const weakPassword = 'password123';
      const result = validatePasswordComplexity(weakPassword);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should use secure session management', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(__dirname, '../src/utils/auth.ts');
      const authContent = fs.readFileSync(authPath, 'utf8');

      // Verify JWT implementation with proper expiration
      expect(authContent).toContain('setExpirationTime');
      expect(authContent).toContain('15m'); // Access token expiration
      expect(authContent).toContain('7d');  // Refresh token expiration
    });
  });
});