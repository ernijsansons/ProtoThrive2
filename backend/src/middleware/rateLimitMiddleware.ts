/**
 * Distributed Rate Limiting Middleware for ProtoThrive
 *
 * Uses Durable Objects for distributed, persistent rate limiting across
 * all edge locations with different limits for authenticated vs unauthenticated users.
 */

import { Context, Next } from 'hono';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (c: Context) => string;
  onLimitReached?: (c: Context) => Response | Promise<Response>;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Create a rate limiting middleware that uses Durable Objects
 */
export function createDistributedRateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    onLimitReached = defaultLimitReachedHandler
  } = options;

  return async (c: Context, next: Next) => {
    const rateLimiterBinding = c.env?.RATE_LIMITER;

    if (!rateLimiterBinding) {
      console.warn('Rate limiter Durable Object binding not found, allowing request');
      await next();
      return;
    }

    try {
      // Generate unique identifier for this client
      const identifier = keyGenerator(c);

      // Check if user is authenticated
      const isAuthenticated = !!(c.get('userId') || c.get('userEmail'));

      // Get Durable Object instance
      const rateLimiterId = rateLimiterBinding.idFromName('global-rate-limiter');
      const rateLimiterStub = rateLimiterBinding.get(rateLimiterId);

      // Check rate limit
      const checkResponse = await rateLimiterStub.fetch('http://localhost/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          isAuthenticated,
          customConfig: {
            windowMs,
            maxRequests: isAuthenticated ? 1000 : maxRequests,
          }
        })
      });

      const rateLimitResult: RateLimitResult = await checkResponse.json();

      // Add rate limit headers to response
      c.header('X-RateLimit-Limit', rateLimitResult.limit.toString());
      c.header('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      c.header('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      if (rateLimitResult.retryAfter) {
        c.header('Retry-After', rateLimitResult.retryAfter.toString());
      }

      // If rate limit exceeded, return error response
      if (!rateLimitResult.allowed) {
        return await onLimitReached(c);
      }

      // Store rate limit info for potential rollback
      c.set('rateLimitResult', rateLimitResult);
      c.set('rateLimiterStub', rateLimiterStub);
      c.set('rateLimitIdentifier', identifier);

      // Continue to next middleware
      await next();

      // Handle successful/failed requests based on configuration
      const responseStatus = c.res.status;
      const shouldSkip = (
        (skipSuccessfulRequests && responseStatus >= 200 && responseStatus < 400) ||
        (skipFailedRequests && responseStatus >= 400)
      );

      if (shouldSkip) {
        // Rollback the rate limit increment (not implemented in this example)
        console.log('Rate limit increment should be rolled back for status:', responseStatus);
      }

    } catch (error) {
      console.error('Rate limiting error:', error);

      // Fail open - allow the request but log the error
      console.warn('Rate limiting failed, allowing request through');
      await next();
    }
  };
}

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') ||
            c.req.header('X-Forwarded-For') ||
            c.req.header('X-Real-IP') ||
            'unknown';

  const userId = c.get('userId');

  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ip}`;
}

/**
 * Default handler for when rate limit is exceeded
 */
function defaultLimitReachedHandler(c: Context): Response {
  return c.json({
    error: 'Too Many Requests',
    code: 'RATE_LIMITED',
    message: 'You have exceeded the rate limit. Please try again later.',
    timestamp: new Date().toISOString()
  }, 429);
}

/**
 * Create endpoint-specific rate limiting middleware
 */
export function createEndpointRateLimit(endpoint: string, customLimits?: Partial<RateLimitOptions>) {
  return createDistributedRateLimit({
    keyGenerator: (c: Context) => {
      const baseKey = defaultKeyGenerator(c);
      return `${baseKey}:${endpoint}`;
    },
    ...customLimits
  });
}

/**
 * Pre-configured rate limiters for common endpoints
 */
export const RateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createEndpointRateLimit('auth', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // More permissive for API endpoints
  api: createEndpointRateLimit('api', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  // Very strict for AI endpoints
  ai: createEndpointRateLimit('ai', {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // General rate limiting
  general: createDistributedRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  })
};

/**
 * IP-based rate limiting (more aggressive)
 */
export function createIPRateLimit(options: RateLimitOptions = {}) {
  return createDistributedRateLimit({
    ...options,
    keyGenerator: (c: Context) => {
      const ip = c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                c.req.header('X-Real-IP') ||
                'unknown';
      return `ip:${ip}`;
    }
  });
}

/**
 * User-based rate limiting (when authenticated)
 */
export function createUserRateLimit(options: RateLimitOptions = {}) {
  return createDistributedRateLimit({
    ...options,
    keyGenerator: (c: Context) => {
      const userId = c.get('userId');

      if (!userId) {
        // Fall back to IP if not authenticated
        const ip = c.req.header('CF-Connecting-IP') ||
                  c.req.header('X-Forwarded-For') ||
                  c.req.header('X-Real-IP') ||
                  'unknown';
        return `ip:${ip}`;
      }

      return `user:${userId}`;
    }
  });
}

/**
 * Sliding window rate limiter with more accurate tracking
 */
export function createSlidingWindowRateLimit(options: RateLimitOptions = {}) {
  return createDistributedRateLimit({
    ...options,
    keyGenerator: (c: Context) => {
      const baseKey = defaultKeyGenerator(c);
      const now = Date.now();
      const windowStart = Math.floor(now / (options.windowMs || 60000)) * (options.windowMs || 60000);
      return `${baseKey}:${windowStart}`;
    }
  });
}

/**
 * Reset rate limit for a specific identifier
 */
export async function resetRateLimit(env: any, identifier: string): Promise<boolean> {
  try {
    const rateLimiterBinding = env.RATE_LIMITER;
    if (!rateLimiterBinding) {
      console.warn('Rate limiter Durable Object binding not found');
      return false;
    }

    const rateLimiterId = rateLimiterBinding.idFromName('global-rate-limiter');
    const rateLimiterStub = rateLimiterBinding.get(rateLimiterId);

    const response = await rateLimiterStub.fetch('http://localhost/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to reset rate limit:', error);
    return false;
  }
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(env: any): Promise<any> {
  try {
    const rateLimiterBinding = env.RATE_LIMITER;
    if (!rateLimiterBinding) {
      console.warn('Rate limiter Durable Object binding not found');
      return null;
    }

    const rateLimiterId = rateLimiterBinding.idFromName('global-rate-limiter');
    const rateLimiterStub = rateLimiterBinding.get(rateLimiterId);

    const response = await rateLimiterStub.fetch('http://localhost/stats');
    return await response.json();
  } catch (error) {
    console.error('Failed to get rate limit stats:', error);
    return null;
  }
}