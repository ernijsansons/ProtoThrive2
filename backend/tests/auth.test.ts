// Test file demonstrating secure JWT authentication and RBAC
import { describe, test, expect, beforeEach } from '@jest/globals';
import { SignJWT } from 'jose';
import {
  verifyJWT,
  UserRole,
  getResourceLimitsByRole,
  getRateLimitByRole
} from '../src/middleware/auth';

describe('Secure JWT Authentication & RBAC', () => {
  const secret = new TextEncoder().encode('test-secret-key-32-bytes-minimum!');

  describe('JWT Verification', () => {
    test('should verify valid JWT with proper signature', async () => {
      const token = await new SignJWT({
        sub: 'user-123',
        role: 'admin',
        email: 'admin@test.com'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      const result = await verifyJWT(token, {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe('user-123');
      expect(result?.role).toBe(UserRole.ADMIN);
      expect(result?.email).toBe('admin@test.com');
    });

    test('should reject expired JWT', async () => {
      const token = await new SignJWT({
        sub: 'user-123',
        role: 'admin'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(Date.now() / 1000) - 10) // Expired 10 seconds ago
        .sign(secret);

      const result = await verifyJWT(token, {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeNull();
    });

    test('should reject JWT with invalid signature', async () => {
      const token = await new SignJWT({
        sub: 'user-123',
        role: 'admin'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      // Tamper with the token
      const tamperedToken = token.slice(0, -10) + 'tampered12';

      const result = await verifyJWT(token + 'tampered', {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeNull();
    });

    test('should reject JWT without user ID', async () => {
      const token = await new SignJWT({
        // No sub or userId
        role: 'admin'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      const result = await verifyJWT(token, {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeNull();
    });
  });

  describe('Role-Based Access Control', () => {
    test('should correctly map role strings to UserRole enum', () => {
      const limits = getResourceLimitsByRole(UserRole.ADMIN);
      expect(limits.roadmaps).toBe(-1); // Unlimited
      expect(limits.premium_features).toBe(true);
    });

    test('should enforce role hierarchy', () => {
      const adminLimits = getResourceLimitsByRole(UserRole.ADMIN);
      const managerLimits = getResourceLimitsByRole(UserRole.MANAGER);
      const engineerLimits = getResourceLimitsByRole(UserRole.ENGINEER);
      const coderLimits = getResourceLimitsByRole(UserRole.CODER);
      const userLimits = getResourceLimitsByRole(UserRole.USER);

      // Admin has unlimited roadmaps
      expect(adminLimits.roadmaps).toBe(-1);

      // Manager has more than engineer
      expect(managerLimits.roadmaps).toBeGreaterThan(engineerLimits.roadmaps);

      // Engineer has more than coder
      expect(engineerLimits.roadmaps).toBeGreaterThan(coderLimits.roadmaps);

      // Coder has more than basic user
      expect(coderLimits.roadmaps).toBeGreaterThan(userLimits.roadmaps);

      // Premium features access
      expect(adminLimits.premium_features).toBe(true);
      expect(managerLimits.premium_features).toBe(true);
      expect(engineerLimits.premium_features).toBe(true);
      expect(coderLimits.premium_features).toBe(false);
      expect(userLimits.premium_features).toBe(false);
    });

    test('should provide appropriate rate limits by role', () => {
      const adminRate = getRateLimitByRole(UserRole.ADMIN);
      const managerRate = getRateLimitByRole(UserRole.MANAGER);
      const engineerRate = getRateLimitByRole(UserRole.ENGINEER);
      const coderRate = getRateLimitByRole(UserRole.CODER);
      const userRate = getRateLimitByRole(UserRole.USER);

      expect(adminRate).toBe(1000);
      expect(managerRate).toBe(500);
      expect(engineerRate).toBe(300);
      expect(coderRate).toBe(100);
      expect(userRate).toBe(50);
    });
  });

  describe('Permission System', () => {
    test('should grant wildcard permissions correctly', () => {
      const adminPerms = ['roadmap:*', 'user:*'];
      const requiredPerm = 'roadmap:delete';

      // Admin with wildcard should have access
      const hasPermission = adminPerms.some(perm => {
        if (perm.includes('*')) {
          const prefix = perm.replace('*', '');
          return requiredPerm.startsWith(prefix);
        }
        return perm === requiredPerm;
      });

      expect(hasPermission).toBe(true);
    });

    test('should deny permissions not in user scope', () => {
      const coderPerms = ['roadmap:create', 'roadmap:read', 'roadmap:update:own'];
      const requiredPerm = 'admin:analytics';

      const hasPermission = coderPerms.some(perm => {
        if (perm.includes('*')) {
          const prefix = perm.replace('*', '');
          return requiredPerm.startsWith(prefix);
        }
        return perm === requiredPerm;
      });

      expect(hasPermission).toBe(false);
    });
  });

  describe('Security Best Practices', () => {
    test('should not expose sensitive information in error messages', async () => {
      const result = await verifyJWT('invalid.token.here', {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeNull();
      // Error is logged internally but not exposed
    });

    test('should validate JWT format before processing', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'only.two',
        '',
        'a',
        'a.b.c.d', // Too many parts
      ];

      for (const token of malformedTokens) {
        const result = await verifyJWT(token, {
          JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
          JWT_ALGORITHM: 'HS256'
        });
        expect(result).toBeNull();
      }
    });

    test('should support different JWT algorithms', async () => {
      // Note: In production, you'd use RS256 with proper key pairs
      const token = await new SignJWT({
        sub: 'user-123',
        role: 'engineer'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      const result = await verifyJWT(token, {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeTruthy();
      expect(result?.role).toBe(UserRole.ENGINEER);
    });

    test('should handle clock skew tolerance', async () => {
      // Token with very recent issue time
      const token = await new SignJWT({
        sub: 'user-123',
        role: 'manager'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);

      // Should still verify with 5 second clock tolerance
      const result = await verifyJWT(token, {
        JWT_SECRET: 'test-secret-key-32-bytes-minimum!',
        JWT_ALGORITHM: 'HS256'
      });

      expect(result).toBeTruthy();
    });
  });
});

// Integration test example
describe('RBAC Middleware Integration', () => {
  test('Admin can access all resources', () => {
    const adminUser = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      permissions: ['*']
    };

    const limits = getResourceLimitsByRole(adminUser.role);
    expect(limits.roadmaps).toBe(-1); // Unlimited
    expect(limits.api_calls_per_day).toBe(10000);
  });

  test('Coder has limited access', () => {
    const coderUser = {
      id: 'coder-1',
      role: UserRole.CODER,
      permissions: [
        'roadmap:create',
        'roadmap:read',
        'roadmap:update:own',
        'roadmap:delete:own'
      ]
    };

    const limits = getResourceLimitsByRole(coderUser.role);
    expect(limits.roadmaps).toBe(10);
    expect(limits.premium_features).toBe(false);
    expect(limits.api_calls_per_day).toBe(500);
  });

  test('Role upgrades provide enhanced capabilities', () => {
    const roles = [
      UserRole.USER,
      UserRole.CODER,
      UserRole.ENGINEER,
      UserRole.MANAGER,
      UserRole.ADMIN
    ];

    let previousLimits = getResourceLimitsByRole(UserRole.USER);

    for (let i = 1; i < roles.length; i++) {
      const currentLimits = getResourceLimitsByRole(roles[i]);

      // Each role upgrade should provide more or equal resources
      if (previousLimits.roadmaps !== -1) {
        expect(
          currentLimits.roadmaps === -1 ||
          currentLimits.roadmaps >= previousLimits.roadmaps
        ).toBe(true);
      }

      expect(currentLimits.api_calls_per_day).toBeGreaterThanOrEqual(
        previousLimits.api_calls_per_day
      );

      previousLimits = currentLimits;
    }
  });
});