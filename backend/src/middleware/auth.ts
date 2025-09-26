// Ref: CLAUDE.md Security Phase - Secure JWT Authentication & RBAC Middleware
import type { Context, Next } from 'hono';
import { jwtVerify, importSPKI, importJWK } from 'jose';
import type { JWTPayload } from 'jose';

// Types
export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  permissions?: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ENGINEER = 'engineer',
  CODER = 'vibe_coder',
  USER = 'user'
}

interface JWTCustomPayload extends JWTPayload {
  sub?: string;
  userId?: string;
  role?: string;
  email?: string;
  permissions?: string[];
}

type Bindings = {
  JWT_SECRET?: string;
  JWT_PUBLIC_KEY?: string;
  JWT_ALGORITHM?: string;
  ENVIRONMENT?: string;
}

type Variables = {
  user: AuthUser;
}

// Role hierarchy and permissions
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 80,
  [UserRole.ENGINEER]: 60,
  [UserRole.CODER]: 40,
  [UserRole.USER]: 20
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'roadmap:*',
    'snippet:*',
    'agent:*',
    'analytics:*',
    'admin:*',
    'deploy:*',
    'user:*'
  ],
  [UserRole.MANAGER]: [
    'roadmap:*',
    'snippet:*',
    'agent:*',
    'analytics:read',
    'deploy:*',
    'user:read'
  ],
  [UserRole.ENGINEER]: [
    'roadmap:*',
    'snippet:*',
    'agent:*',
    'deploy:staging',
    'user:read'
  ],
  [UserRole.CODER]: [
    'roadmap:create',
    'roadmap:read',
    'roadmap:update:own',
    'roadmap:delete:own',
    'snippet:read',
    'agent:basic'
  ],
  [UserRole.USER]: [
    'roadmap:read:own',
    'snippet:read'
  ]
};

// JWT Verification with proper security
export async function verifyJWT(
  token: string,
  env: Bindings
): Promise<AuthUser | null> {
  // Input validation
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    console.warn('Invalid token input: empty or non-string');
    return null;
  }

  // Sanitize token
  const sanitizedToken = token.trim();

  // Basic JWT format validation before processing
  const parts = sanitizedToken.split('.');
  if (parts.length !== 3) {
    console.warn('Invalid JWT format: incorrect number of parts');
    return null;
  }

  try {
    const algorithm = env.JWT_ALGORITHM || 'HS256';
    let key: CryptoKey | Uint8Array;

    if (algorithm.startsWith('RS') || algorithm.startsWith('ES')) {
      // Asymmetric algorithms (RSA, ECDSA)
      if (!env.JWT_PUBLIC_KEY) {
        throw new Error('JWT_PUBLIC_KEY not configured for asymmetric algorithm');
      }

      // Support both PEM and JWK formats
      if (env.JWT_PUBLIC_KEY.startsWith('{')) {
        // JWK format
        key = await importJWK(JSON.parse(env.JWT_PUBLIC_KEY), algorithm);
      } else {
        // PEM format
        key = await importSPKI(env.JWT_PUBLIC_KEY, algorithm) as CryptoKey;
      }
    } else {
      // Symmetric algorithms (HMAC)
      if (!env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
      }

      const encoder = new TextEncoder();
      key = encoder.encode(env.JWT_SECRET);
    }

    // Verify JWT with jose
    const { payload } = await jwtVerify(sanitizedToken, key, {
      algorithms: [algorithm as 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512'],
      clockTolerance: 5, // 5 seconds clock tolerance
    });

    // Cast payload to our custom interface for type safety
    const customPayload = payload as JWTCustomPayload;

    // Validate required claims
    const userId = customPayload.sub || customPayload.userId;
    if (!userId || typeof userId !== 'string') {
      throw new Error('Missing or invalid user identifier in token');
    }

    // Validate and normalize role
    const rawRole = customPayload.role || UserRole.USER;
    const role = normalizeRole(rawRole);

    // Extract permissions (either from token or derive from role)
    const permissions = customPayload.permissions || ROLE_PERMISSIONS[role];

    return {
      id: userId,
      role,
      email: customPayload.email,
      permissions
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Normalize role to enum value
function normalizeRole(role: string): UserRole {
  const normalizedRole = role.toLowerCase();

  // Map various role names to our enum
  const roleMapping: Record<string, UserRole> = {
    'admin': UserRole.ADMIN,
    'administrator': UserRole.ADMIN,
    'manager': UserRole.MANAGER,
    'engineer': UserRole.ENGINEER,
    'developer': UserRole.ENGINEER,
    'vibe_coder': UserRole.CODER,
    'coder': UserRole.CODER,
    'user': UserRole.USER,
    'guest': UserRole.USER
  };

  return roleMapping[normalizedRole] || UserRole.USER;
}

// Main JWT middleware
export async function validateJwtMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const environment = c.env?.ENVIRONMENT || 'development';

  // Handle missing auth header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow mock auth only in development
    if (environment === 'development' && !c.env?.JWT_SECRET) {
      c.set('user', {
        id: 'uuid-dev-mock',
        role: UserRole.CODER,
        email: 'dev@protothrive.com',
        permissions: ROLE_PERMISSIONS[UserRole.CODER]
      });
      console.log('Dev Auth: Mock user authenticated');
      return await next();
    }

    return c.json({
      error: 'Authentication required',
      code: 'AUTH-401',
      message: 'Bearer token required in Authorization header'
    }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    // Verify JWT
    const user = await verifyJWT(token, c.env);

    if (!user) {
      throw new Error('Token verification failed');
    }

    // Set user in context
    c.set('user', user);

    console.log(`Auth Success: User ${user.id} authenticated with role ${user.role}`);
    await next();
  } catch (error) {
    console.error('Authentication failed:', error);

    // Determine error type for proper response
    let errorMessage = 'Invalid or expired token';
    let errorCode = 'AUTH-401';

    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token has expired';
        errorCode = 'AUTH-EXPIRED';
      } else if (error.message.includes('signature')) {
        errorMessage = 'Invalid token signature';
        errorCode = 'AUTH-INVALID';
      } else if (error.message.includes('claim')) {
        errorMessage = 'Invalid token claims';
        errorCode = 'AUTH-CLAIMS';
      }
    }

    return c.json({
      error: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString()
    }, 401);
  }
}

// RBAC middleware factory
export function requireRole(allowedRoles: UserRole[]) {
  return async (
    c: Context<{ Variables: { user: AuthUser } }>,
    next: Next
  ): Promise<Response | void> => {
    const user = c.get('user');

    if (!user || !user.role) {
      return c.json({
        error: 'User role not found',
        code: 'AUTH-403',
        message: 'Authentication required with valid role'
      }, 403);
    }

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(user.role)) {
      // Check role hierarchy - higher roles can access lower role endpoints
      const userRoleLevel = ROLE_HIERARCHY[user.role];
      const requiredMinLevel = Math.min(...allowedRoles.map(r => ROLE_HIERARCHY[r]));

      if (userRoleLevel < requiredMinLevel) {
        console.warn(`RBAC: Access denied for role '${user.role}'. Required: ${allowedRoles.join(', ')}`);

        return c.json({
          error: 'Insufficient permissions',
          code: 'AUTH-403',
          message: 'Access denied to this resource'
          // Don't expose role details for security
        }, 403);
      }
    }

    console.log(`RBAC: Role '${user.role}' authorized for ${allowedRoles.join(', ')}`);
    await next();
  };
}

// Permission-based middleware
export function requirePermission(requiredPermissions: string[]) {
  return async (
    c: Context<{ Variables: { user: AuthUser } }>,
    next: Next
  ): Promise<Response | void> => {
    const user = c.get('user');

    if (!user || !user.permissions) {
      return c.json({
        error: 'User permissions not found',
        code: 'AUTH-403',
        message: 'Authentication required with valid permissions'
      }, 403);
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(reqPerm => {
      // Validate required permission format
      if (!reqPerm || typeof reqPerm !== 'string') {
        return false;
      }

      // Support wildcard permissions
      return user.permissions?.some(userPerm => {
        if (!userPerm || typeof userPerm !== 'string') {
          return false;
        }

        if (userPerm.endsWith('*')) {
          const permPrefix = userPerm.slice(0, -1); // Remove only the last * character
          return reqPerm.startsWith(permPrefix);
        }
        return userPerm === reqPerm;
      }) || false;
    });

    if (!hasAllPermissions) {
      console.warn(`Permission denied: User lacks ${requiredPermissions.join(', ')}`);

      return c.json({
        error: 'Insufficient permissions',
        code: 'AUTH-403',
        message: 'Access denied'
        // Don't expose permission details for security
      }, 403);
    }

    console.log(`Permission granted: ${requiredPermissions.join(', ')}`);
    await next();
  };
}

// Resource ownership middleware
export function requireOwnership(resourceType: string) {
  return async (
    c: Context<{ Variables: { user: AuthUser } }>,
    next: Next
  ): Promise<Response | void> => {
    const user = c.get('user');
    const resourceId = c.req.param('id');

    if (!user || !resourceId) {
      return c.json({
        error: 'Invalid request',
        code: 'AUTH-400',
        message: 'User and resource ID required'
      }, 400);
    }

    // Admin and Manager can access all resources
    if ([UserRole.ADMIN, UserRole.MANAGER].includes(user.role)) {
      console.log(`Ownership check bypassed for ${user.role}`);
      await next();
      return;
    }

    // For demonstration, we'll set ownership flag in context
    // In production, check actual resource ownership from database
    const isOwner = await checkResourceOwnership(user.id, resourceId, resourceType, c);

    if (!isOwner) {
      console.warn(`Ownership denied: User ${user.id} does not own ${resourceType} ${resourceId}`);

      return c.json({
        error: 'Access denied',
        code: 'AUTH-403',
        message: `You do not have access to this ${resourceType}`
      }, 403);
    }

    console.log(`Ownership verified: User ${user.id} owns ${resourceType} ${resourceId}`);
    await next();
  };
}

// Helper to check resource ownership (mock implementation)
async function checkResourceOwnership(
  userId: string,
  resourceId: string,
  resourceType: string,
  c: Context
): Promise<boolean> {
  // In production, query database to verify ownership
  // This is a simplified mock
  try {
    const db = c.get('db' as any);
    if (!db) return false;

    switch (resourceType) {
      case 'roadmap':
        const roadmap = await db.queryRoadmap?.(resourceId, userId);
        return !!roadmap;
      case 'snippet':
        // Snippets might be public or have different ownership rules
        return true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership check failed:', error);
    return false;
  }
}

// Rate limiting by role
export function getRateLimitByRole(role: UserRole): number {
  const limits: Record<UserRole, number> = {
    [UserRole.ADMIN]: 1000,     // 1000 requests per minute
    [UserRole.MANAGER]: 500,     // 500 requests per minute
    [UserRole.ENGINEER]: 300,    // 300 requests per minute
    [UserRole.CODER]: 100,       // 100 requests per minute
    [UserRole.USER]: 50          // 50 requests per minute
  };

  return limits[role] || limits[UserRole.USER];
}

// Business rule helper for resource limits
export function getResourceLimitsByRole(role: UserRole) {
  const limits = {
    [UserRole.ADMIN]: {
      roadmaps: -1, // unlimited
      snippets: -1,
      agents: -1,
      premium_features: true,
      api_calls_per_day: 10000
    },
    [UserRole.MANAGER]: {
      roadmaps: 100,
      snippets: 500,
      agents: 50,
      premium_features: true,
      api_calls_per_day: 5000
    },
    [UserRole.ENGINEER]: {
      roadmaps: 50,
      snippets: 200,
      agents: 20,
      premium_features: true,
      api_calls_per_day: 2000
    },
    [UserRole.CODER]: {
      roadmaps: 10,
      snippets: 50,
      agents: 5,
      premium_features: false,
      api_calls_per_day: 500
    },
    [UserRole.USER]: {
      roadmaps: 3,
      snippets: 10,
      agents: 1,
      premium_features: false,
      api_calls_per_day: 100
    }
  };

  return limits[role] || limits[UserRole.USER];
}

export default {
  validateJwtMiddleware,
  requireRole,
  requirePermission,
  requireOwnership,
  UserRole,
  getResourceLimitsByRole,
  getRateLimitByRole
};