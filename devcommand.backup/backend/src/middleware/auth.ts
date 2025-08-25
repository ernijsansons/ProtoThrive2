// Authentication middleware using Clerk
import { verifyToken } from '@clerk/backend';
import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Env } from '../types/env';
import { formatError, ERROR_CODES } from '@devcommand/shared';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  // Skip auth for webhooks (they use different verification)
  if (c.req.path.startsWith('/api/webhooks')) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      formatError(ERROR_CODES.UNAUTHORIZED, 'Missing or invalid authorization header'),
      401
    );
  }

  const token = authHeader.substring(7);

  try {
    // Check cache first for performance
    const cachedSession = await c.env.CACHE.get(`session:${token}`);
    if (cachedSession) {
      const session = JSON.parse(cachedSession);
      c.set('userId', session.userId);
      c.set('userEmail', session.email);
      c.set('userRole', session.userRole);
      return next();
    }

    // Verify the token with Clerk
    const verifiedToken = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    if (!verifiedToken) {
      throw new Error('Invalid token');
    }

    // Extract user information from the token
    const userId = verifiedToken.sub;
    const userEmail = verifiedToken.email || '';
    
    // Get user role from database
    const userResult = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ? AND deleted_at IS NULL'
    )
      .bind(userId)
      .first();

    let userRole = 'vibe_coder';

    if (!userResult) {
      // Create user if not exists (first login)
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, role) VALUES (?, ?, ?)'
      )
        .bind(userId, userEmail, userRole)
        .run();
    } else {
      userRole = userResult.role as string;
    }

    // Set context values
    c.set('userId', userId);
    c.set('userEmail', userEmail);
    c.set('userRole', userRole);

    // Store session in KV cache for performance
    await c.env.CACHE.put(
      `session:${token}`,
      JSON.stringify({
        userId,
        userRole,
        email: userEmail,
      }),
      {
        expirationTtl: 7200, // 2 hours
      }
    );

    return next();
  } catch (error) {
    console.error('Auth error:', error);
    
    return c.json(
      formatError(ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token'),
      401
    );
  }
}

// Optional auth middleware - doesn't fail if no token
export const optionalAuthMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      // Check cache first
      const cachedSession = await c.env.CACHE.get(`session:${token}`);
      if (cachedSession) {
        const session = JSON.parse(cachedSession);
        c.set('userId', session.userId);
        c.set('userEmail', session.email);
        c.set('userRole', session.userRole);
      } else {
        // Verify with Clerk
        const verifiedToken = await verifyToken(token, {
          secretKey: c.env.CLERK_SECRET_KEY,
        });

        if (verifiedToken) {
          const userId = verifiedToken.sub;
          const userEmail = verifiedToken.email || '';
          
          const userResult = await c.env.DB.prepare(
            'SELECT role FROM users WHERE id = ?'
          )
            .bind(userId)
            .first();

          if (userResult) {
            c.set('userId', userId);
            c.set('userEmail', userEmail);
            c.set('userRole', userResult.role as string);
          }
        }
      }
    } catch (error) {
      // Ignore errors for optional auth
      console.log('Optional auth failed, continuing as anonymous');
    }
  }

  await next();
});

// Admin-only middleware
export const adminMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const userRole = c.get('userRole');
  
  if (userRole !== 'admin') {
    return c.json(
      formatError(ERROR_CODES.FORBIDDEN, 'Admin access required'),
      403
    );
  }

  await next();
});

// Engineer-only middleware (for HITL tasks)
export const engineerMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const userRole = c.get('userRole');
  
  if (userRole !== 'engineer' && userRole !== 'admin') {
    return c.json(
      formatError(ERROR_CODES.FORBIDDEN, 'Engineer access required'),
      403
    );
  }

  await next();
});