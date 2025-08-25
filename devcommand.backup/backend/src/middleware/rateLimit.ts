// Rate limiting middleware using Durable Objects
import type { Context, Next } from 'hono';
import type { Env } from '../types/env';
import { ERROR_CODES, RATE_LIMITS } from '@devcommand/shared';

export async function rateLimitMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const userId = c.get('userId') || 'anonymous';
  const userRole = c.get('userRole') || 'anonymous';
  const path = c.req.path;

  // Different rate limits for different endpoints
  let limit = RATE_LIMITS.DEFAULT;
  
  if (userId === 'anonymous') {
    limit = RATE_LIMITS.ANONYMOUS;
  } else if (path.startsWith('/api/agents')) {
    limit = RATE_LIMITS.AGENT_TASKS;
  }

  // Get rate limiter Durable Object
  const id = c.env.RATE_LIMITER.idFromName(`${userId}:${path}`);
  const limiter = c.env.RATE_LIMITER.get(id);

  // Check rate limit
  const request = new Request('http://internal/check', {
    method: 'POST',
    body: JSON.stringify({ limit, window: 60 }), // 60 second window
  });

  const response = await limiter.fetch(request);
  const result = await response.json() as { allowed: boolean; remaining: number };

  // Add rate limit headers
  c.header('X-RateLimit-Limit', String(limit));
  c.header('X-RateLimit-Remaining', String(result.remaining));
  c.header('X-RateLimit-Reset', String(Date.now() + 60000)); // 1 minute

  if (!result.allowed) {
    return c.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many requests. Please try again later.',
          details: {
            limit,
            window: '60s',
            retryAfter: 60,
          },
        },
      },
      429,
    );
  }

  return next();
}