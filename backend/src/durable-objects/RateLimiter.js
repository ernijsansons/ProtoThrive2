/**
 * RateLimiter Durable Object for ProtoThrive
 * Provides distributed, persistent rate limiting across edge locations
 */
export class RateLimiter {
    state;
    env;
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }
    async fetch(request) {
        const url = new URL(request.url);
        const method = request.method;
        if (method === 'POST' && url.pathname === '/check') {
            return this.handleRateLimitCheck(request);
        }
        if (method === 'DELETE' && url.pathname === '/reset') {
            return this.handleReset(request);
        }
        return new Response('Method not allowed', { status: 405 });
    }
    /**
     * Check rate limit for a client
     */
    async handleRateLimitCheck(request) {
        try {
            const body = await request.json();
            const { clientId, config, endpoint } = body;
            const key = endpoint ? `${clientId}:${endpoint}` : clientId;
            const result = await this.checkRateLimit(key, config);
            return new Response(JSON.stringify(result), {
                status: result.allowed ? 200 : 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                    ...(result.retryAfter && {
                        'Retry-After': Math.ceil(result.retryAfter / 1000).toString()
                    })
                }
            });
        }
        catch (error) {
            console.error('Rate limit check error:', error);
            return new Response(JSON.stringify({
                error: 'Rate limit check failed',
                allowed: false
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    /**
     * Reset rate limit for a client
     */
    async handleReset(request) {
        try {
            const body = await request.json();
            const { clientId, endpoint } = body;
            const key = endpoint ? `${clientId}:${endpoint}` : clientId;
            await this.state.storage.delete(key);
            return new Response(JSON.stringify({
                success: true,
                message: 'Rate limit reset successfully'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (error) {
            console.error('Rate limit reset error:', error);
            return new Response(JSON.stringify({
                error: 'Rate limit reset failed',
                success: false
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    /**
     * Core rate limiting logic with token bucket algorithm
     */
    async checkRateLimit(key, config) {
        const now = Date.now();
        const windowMs = config.windowMs;
        const maxRequests = config.maxRequests;
        const burstLimit = config.burstLimit || Math.floor(maxRequests * 1.5);
        // Get current state
        const storedState = await this.state.storage.get(key);
        let state;
        if (!storedState || now > storedState.resetTime) {
            // Initialize or reset window
            state = {
                count: 1,
                resetTime: now + windowMs,
                burst: 1,
                lastRequest: now
            };
        }
        else {
            // Update existing state
            const timeSinceLastRequest = now - storedState.lastRequest;
            const tokensToAdd = Math.floor(timeSinceLastRequest * maxRequests / windowMs);
            state = {
                count: storedState.count + 1,
                resetTime: storedState.resetTime,
                burst: Math.min(burstLimit, storedState.burst + tokensToAdd),
                lastRequest: now
            };
        }
        // Check rate limits
        const allowed = state.count <= maxRequests && state.burst > 0;
        if (allowed) {
            state.burst = Math.max(0, state.burst - 1);
            // Store updated state
            await this.state.storage.put(key, state);
        }
        const remaining = Math.max(0, maxRequests - state.count);
        const retryAfter = allowed ? undefined : state.resetTime - now;
        return {
            allowed,
            remaining,
            resetTime: state.resetTime,
            retryAfter
        };
    }
    /**
     * Clean up expired entries periodically
     */
    async cleanup() {
        const now = Date.now();
        const allEntries = await this.state.storage.list();
        const expiredKeys = [];
        for (const [key, state] of allEntries) {
            if (now > state.resetTime + 60000) { // Grace period of 1 minute
                expiredKeys.push(key);
            }
        }
        if (expiredKeys.length > 0) {
            await this.state.storage.delete(expiredKeys);
            console.log(`Cleaned up ${expiredKeys.length} expired rate limit entries`);
        }
    }
}
/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
    // Authentication endpoints - stricter limits
    '/api/auth/login': {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        burstLimit: 3
    },
    '/api/auth/register': {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        burstLimit: 2
    },
    // API endpoints - standard limits
    '/api/roadmaps': {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
        burstLimit: 150
    },
    '/api/snippets': {
        maxRequests: 50,
        windowMs: 60 * 1000, // 1 minute
        burstLimit: 75
    },
    // AI agent endpoints - resource intensive
    '/api/ai/orchestrate': {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
        burstLimit: 5
    },
    // Default configuration
    'default': {
        maxRequests: 1000,
        windowMs: 60 * 1000, // 1 minute
        burstLimit: 1500
    }
};
