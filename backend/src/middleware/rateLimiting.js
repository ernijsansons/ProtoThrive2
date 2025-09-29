/**
 * Rate limiting middleware using Durable Objects for ProtoThrive
 */
import { RATE_LIMIT_CONFIGS } from '../durable-objects/RateLimiter';
/**
 * Create rate limiting middleware with Durable Objects
 */
export function createDurableRateLimitMiddleware(options = {}) {
    return async (c, next) => {
        const env = c.env;
        // Skip rate limiting for specified paths
        if (options.skipPaths && options.skipPaths.includes(c.req.path)) {
            await next();
            return;
        }
        // Skip for health checks and status endpoints
        if (c.req.path === '/health' || c.req.path === '/api/status') {
            await next();
            return;
        }
        try {
            // Generate client identifier
            const clientId = options.keyGenerator
                ? options.keyGenerator(c)
                : getClientId(c);
            // Get rate limit configuration for this endpoint
            const config = options.config ||
                RATE_LIMIT_CONFIGS[c.req.path] ||
                RATE_LIMIT_CONFIGS['default'];
            // Get Durable Object instance
            const rateLimiterId = env.RATE_LIMITER.idFromName(`rate-limiter-${getRegion()}`);
            const rateLimiter = env.RATE_LIMITER.get(rateLimiterId);
            // Check rate limit
            const response = await rateLimiter.fetch(new Request('https://rate-limiter/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    config,
                    endpoint: c.req.path
                })
            }));
            const result = await response.json();
            // Add rate limit headers to response
            c.header('X-RateLimit-Limit', config.maxRequests.toString());
            c.header('X-RateLimit-Remaining', result.remaining.toString());
            c.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
            if (!result.allowed) {
                if (result.retryAfter) {
                    c.header('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
                }
                if (options.onLimitReached) {
                    return options.onLimitReached(c);
                }
                return c.json({
                    error: 'Rate limit exceeded',
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many requests. Limit: ${config.maxRequests} per ${config.windowMs / 1000}s`,
                    retryAfter: result.retryAfter ? Math.ceil(result.retryAfter / 1000) : undefined
                }, 429);
            }
            await next();
        }
        catch (error) {
            console.error('Rate limiting error:', error);
            // Fail open - allow request if rate limiting fails
            await next();
        }
    };
}
/**
 * Get client identifier from request
 */
function getClientId(c) {
    // Priority order for client identification
    const clientIp = c.req.header('CF-Connecting-IP') ||
        c.req.header('X-Forwarded-For') ||
        c.req.header('X-Real-IP') ||
        'unknown';
    // If user is authenticated, use user ID for more accurate limiting
    const userId = c.get('userId');
    if (userId) {
        return `user:${userId}`;
    }
    // Use IP address for anonymous users
    return `ip:${clientIp}`;
}
/**
 * Get region for Durable Object placement
 */
function getRegion() {
    // Use Cloudflare's colo (data center) if available
    return process.env.CF_RAY?.split('-')[1] || 'global';
}
/**
 * Enhanced rate limiting middleware with user-specific and endpoint-specific limits
 */
export function createSmartRateLimitMiddleware() {
    return createDurableRateLimitMiddleware({
        keyGenerator: (c) => {
            const userId = c.get('userId');
            const userRole = c.get('userRole');
            const clientIp = getClientId(c);
            // Different limits based on user role
            if (userId) {
                const roleMultiplier = getRoleMultiplier(userRole);
                return `user:${userId}:${roleMultiplier}`;
            }
            return clientIp;
        },
        skipPaths: ['/health', '/api/status', '/'],
        onLimitReached: async (c) => {
            // Enhanced rate limit response with helpful information
            const resetTime = c.res.headers.get('X-RateLimit-Reset');
            const retryAfter = c.res.headers.get('Retry-After');
            return c.json({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'You have exceeded the rate limit for this endpoint',
                details: {
                    endpoint: c.req.path,
                    resetTime,
                    retryAfter: retryAfter ? `${retryAfter} seconds` : undefined,
                    upgradeMessage: 'Upgrade your plan for higher rate limits'
                },
                timestamp: new Date().toISOString()
            }, 429);
        }
    });
}
/**
 * Get rate limit multiplier based on user role
 */
function getRoleMultiplier(role) {
    switch (role) {
        case 'admin':
            return 10; // 10x higher limits
        case 'premium':
            return 5; // 5x higher limits
        case 'pro':
            return 3; // 3x higher limits
        case 'user':
        default:
            return 1; // Standard limits
    }
}
/**
 * Burst protection middleware for high-traffic scenarios
 */
export function createBurstProtectionMiddleware(options) {
    return createDurableRateLimitMiddleware({
        config: {
            maxRequests: options.burstThreshold,
            windowMs: options.burstWindowMs,
            burstLimit: Math.floor(options.burstThreshold * 0.5)
        },
        keyGenerator: (c) => `burst:${getClientId(c)}`,
        onLimitReached: async (c) => {
            return c.json({
                error: 'Burst limit exceeded',
                code: 'BURST_LIMIT_EXCEEDED',
                message: 'Too many requests in a short period. Please slow down.',
                timestamp: new Date().toISOString()
            }, 429);
        }
    });
}
