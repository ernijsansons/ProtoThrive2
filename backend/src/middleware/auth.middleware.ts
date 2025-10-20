/**
 * Authentication Middleware - JWT Token Validation
 *
 * @description Enforces JWT authentication on protected API endpoints
 * Phase 1: API Authentication Enforcement (78% → 80%)
 *
 * @security
 * - Validates JWT tokens from Authorization header
 * - Extracts and attaches user context to request
 * - Returns 401 for missing/invalid tokens
 * - Supports optional authentication for public/private content
 *
 * @compliance OWASP ASVS 4.0.3 V2.1 (Authentication)
 * @version 1.0.0
 * @author ProtoThrive Engineering Team
 */

import { Context, Next } from 'hono';
import { getJWTService } from '../utils/auth';

/**
 * Extended context with authenticated user information
 */
export interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * JWT Authentication Middleware (Required)
 *
 * @description Validates JWT token and attaches user to context
 * Returns 401 Unauthorized if token is missing or invalid
 *
 * @usage Apply to protected routes that require authentication
 * @example
 * ```typescript
 * app.get('/api/roadmaps', requireAuth, async (c) => {
 *   const user = c.get('user');
 *   // User is guaranteed to be authenticated
 * });
 * ```
 *
 * @param c Hono context
 * @param next Next middleware function
 * @returns 401 if unauthorized, otherwise continues to next middleware
 */
export const requireAuth = async (c: AuthenticatedContext, next: Next) => {
  const authHeader = c.req.header('Authorization');

  // Check for Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: 'Authentication required',
        code: 'UNAUTHORIZED_401',
        message: 'Missing or invalid Authorization header. Please provide a valid JWT token.',
        hint: 'Include header: Authorization: Bearer <your-token>',
      },
      401
    );
  }

  // Extract token (remove 'Bearer ' prefix)
  const token = authHeader.substring(7);

  if (!token) {
    return c.json(
      {
        error: 'Authentication required',
        code: 'UNAUTHORIZED_401',
        message: 'Authorization token is empty',
      },
      401
    );
  }

  try {
    // Verify JWT token
    const jwtService = getJWTService();
    const payload = await jwtService.verifyToken(token);

    // Extract user information from token payload
    const user = {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };

    // Validate required fields
    if (!user.id || !user.email || !user.role) {
      return c.json(
        {
          error: 'Invalid token payload',
          code: 'INVALID_TOKEN_401',
          message: 'Token is missing required user information',
        },
        401
      );
    }

    // Attach user to context for downstream handlers
    c.set('user', user);

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    // Token verification failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return c.json(
      {
        error: 'Invalid token',
        code: 'INVALID_TOKEN_401',
        message: 'Token validation failed',
        details: errorMessage,
      },
      401
    );
  }
};

/**
 * Optional Authentication Middleware
 *
 * @description Attaches user to context if valid token is provided,
 * but doesn't require authentication. Useful for endpoints that serve
 * both public and private content.
 *
 * @usage Apply to routes that show different content for authenticated users
 * @example
 * ```typescript
 * app.get('/api/snippets', optionalAuth, async (c) => {
 *   const user = c.get('user');
 *   if (user) {
 *     // Show user's private snippets + public snippets
 *   } else {
 *     // Show only public snippets
 *   }
 * });
 * ```
 *
 * @param c Hono context
 * @param next Next middleware function
 * @returns Always continues, user may or may not be attached
 */
export const optionalAuth = async (c: AuthenticatedContext, next: Next) => {
  const authHeader = c.req.header('Authorization');

  // If no auth header, continue without user
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await next();
    return;
  }

  const token = authHeader.substring(7);

  // If empty token, continue without user
  if (!token) {
    await next();
    return;
  }

  try {
    // Try to verify token
    const jwtService = getJWTService();
    const payload = await jwtService.verifyToken(token);

    // Extract user information
    const user = {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };

    // Only attach user if all required fields are present
    if (user.id && user.email && user.role) {
      c.set('user', user);
    }
  } catch {
    // Invalid token, but that's okay for optional auth
    // Continue without user attached
  }

  // Always continue to next middleware
  await next();
};

/**
 * Role-Based Authorization Middleware
 *
 * @description Checks if authenticated user has required role
 * Must be used AFTER requireAuth middleware
 *
 * @usage Apply to admin-only or role-specific routes
 * @example
 * ```typescript
 * app.delete('/api/admin/users/:id',
 *   requireAuth,
 *   requireRole(['admin', 'super_admin']),
 *   async (c) => {
 *     // Only admins can access this
 *   }
 * );
 * ```
 *
 * @param allowedRoles Array of roles that are allowed
 * @returns Middleware function
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (c: AuthenticatedContext, next: Next) => {
    const user = c.get('user');

    // User should exist (requireAuth should run first)
    if (!user) {
      return c.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED_401',
          message: 'User context not found. Ensure requireAuth middleware runs first.',
        },
        401
      );
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          error: 'Forbidden',
          code: 'FORBIDDEN_403',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          userRole: user.role,
        },
        403
      );
    }

    // User has required role, continue
    await next();
  };
};

/**
 * Resource Ownership Validation
 *
 * @description Ensures user owns the resource they're trying to access
 * Admins bypass ownership checks
 *
 * @usage Apply to routes that modify user-specific resources
 * @example
 * ```typescript
 * app.delete('/api/roadmaps/:id',
 *   requireAuth,
 *   requireOwnership('roadmap'),
 *   async (c) => {
 *     // User owns this roadmap or is admin
 *   }
 * );
 * ```
 *
 * @param resourceType Type of resource for error messages
 * @returns Middleware function that validates ownership
 */
export const requireOwnership = (resourceType: string) => {
  return async (c: AuthenticatedContext, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED_401',
        },
        401
      );
    }

    // Admins bypass ownership checks
    if (user.role === 'admin' || user.role === 'super_admin') {
      await next();
      return;
    }

    // Get resource from context (should be set by previous middleware)
    const resource: any = c.get('resource');

    if (!resource) {
      return c.json(
        {
          error: 'Internal error',
          code: 'INTERNAL_ERROR_500',
          message: 'Resource not loaded. Ensure resource is fetched before ownership check.',
        },
        500
      );
    }

    // Check ownership (resource should have user_id or owner_id)
    const ownerId = resource.user_id || resource.owner_id || resource.created_by;

    if (ownerId !== user.id) {
      return c.json(
        {
          error: 'Forbidden',
          code: 'FORBIDDEN_403',
          message: `You do not have permission to access this ${resourceType}`,
        },
        403
      );
    }

    // User owns the resource, continue
    await next();
  };
};
