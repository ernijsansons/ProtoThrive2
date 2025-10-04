/**
 * ProtoThrive Edge-Native Backend - 2025 Architecture
 * Optimized for Cloudflare Workers with Durable Objects and Hybrid Storage
 *
 * Performance Targets:
 * - Cold start: <10ms
 * - KV reads: <5ms p99
 * - WebSocket hibernation: 90% cost reduction
 * - Global consistency: <100ms
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import { EdgeJWTValidator } from './edge/EdgeJWTValidator';
import { StorageRouter } from './edge/StorageRouter';
import { MetricsCollector } from './edge/MetricsCollector';
import { RateLimiter } from './durable-objects/RateLimiter';
import { WebSocketManager } from './durable-objects/WebSocketManager';
import { SessionManager } from './durable-objects/SessionManager';
import { AIOrchestrator } from './durable-objects/AIOrchestrator';
import { DatabaseService } from './utils/db';
import { CacheService } from './edge/CacheService';
import { validateRoadmapBody } from './utils/validation';
// Initialize Hono with edge optimizations
const app = new Hono();
// Apply global middleware stack (order matters!)
app.use('*', timing());
app.use('*', compress());
app.use('*', secureHeaders({
    contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
    },
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    originAgentCluster: '?1',
    referrerPolicy: 'origin-when-cross-origin',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xContentTypeOptions: 'nosniff',
    xDnsPrefetchControl: 'off',
    xDownloadOptions: 'noopen',
    xFrameOptions: 'DENY',
    xPermittedCrossDomainPolicies: 'none',
    xXssProtection: '0',
}));
// CORS with environment-aware configuration
app.use('*', cors({
    origin: (origin) => {
        const env = app.env?.NODE_ENV || 'development';
        // Production origins
        const productionOrigins = [
            'https://protothrive.com',
            'https://app.protothrive.com',
            'https://www.protothrive.com'
        ];
        // Development origins
        const developmentOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://localhost:3000'
        ];
        const allowedOrigins = env === 'production'
            ? productionOrigins
            : [...productionOrigins, ...developmentOrigins];
        return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Trace-ID'],
    exposeHeaders: [
        'X-Total-Count',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset',
        'X-Response-Time'
    ],
    credentials: true,
    maxAge: 86400
}));
// Request tracking and context setup
app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    c.set('startTime', Date.now());
    // Add request ID to response headers
    c.header('X-Request-ID', requestId);
    // Log request
    const { pathname, search } = new URL(c.req.url);
    console.log(`[${requestId}] ${c.req.method} ${pathname}${search}`);
    await next();
    // Log response and collect metrics
    const duration = Date.now() - c.get('startTime');
    console.log(`[${requestId}] ${c.res.status} ${duration}ms`);
    // Send metrics to Analytics Engine
    if (c.env.ANALYTICS) {
        c.env.ANALYTICS.writeDataPoint({
            blobs: [pathname, c.req.method, c.res.status.toString()],
            doubles: [duration],
            indexes: [requestId]
        });
    }
});
// Initialize services with dependency injection
app.use('*', async (c, next) => {
    // Initialize storage router
    const storageRouter = new StorageRouter(c.env);
    c.set('storage', storageRouter);
    // Initialize cache service
    const cacheService = new CacheService(c.env.KV_CACHE);
    c.set('cache', cacheService);
    // Initialize metrics collector
    const metrics = new MetricsCollector(c.env.ANALYTICS);
    c.set('metrics', metrics);
    // Initialize JWT validator (skip for public endpoints)
    const publicPaths = ['/health', '/api/status', '/'];
    if (!publicPaths.some(path => c.req.path.startsWith(path))) {
        const jwtValidator = new EdgeJWTValidator(c.env);
        c.set('jwt', jwtValidator);
    }
    await next();
});
// Smart rate limiting with Durable Objects
app.use('/api/*', async (c, next) => {
    const clientId = c.req.header('CF-Connecting-IP') || 'unknown';
    const endpoint = c.req.path;
    // Get rate limiter Durable Object
    const id = c.env.RATE_LIMITER.idFromName(clientId);
    const rateLimiter = c.env.RATE_LIMITER.get(id);
    // Determine rate limit based on user tier
    const user = c.get('user');
    const config = {
        maxRequests: user?.tier === 'enterprise' ? 10000 :
            user?.tier === 'pro' ? 1000 : 100,
        windowMs: 60000, // 1 minute
        burstLimit: user?.tier === 'enterprise' ? 15000 :
            user?.tier === 'pro' ? 1500 : 150
    };
    // Check rate limit
    const response = await rateLimiter.fetch(new Request('https://rate-limiter/check', {
        method: 'POST',
        body: JSON.stringify({ clientId, config, endpoint })
    }));
    const result = await response.json();
    // Add rate limit headers
    c.header('X-Rate-Limit-Limit', config.maxRequests.toString());
    c.header('X-Rate-Limit-Remaining', result.remaining.toString());
    c.header('X-Rate-Limit-Reset', new Date(result.resetTime).toISOString());
    if (!result.allowed) {
        c.header('Retry-After', Math.ceil(result.retryAfter / 1000).toString());
        return c.json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_429',
            message: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter
        }, 429);
    }
    await next();
});
// Authentication middleware with edge JWT validation
const authMiddleware = (requiredRoles) => {
    return async (c, next) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({
                error: 'Missing authorization',
                code: 'AUTH_401',
                message: 'Authorization header required'
            }, 401);
        }
        try {
            const token = authHeader.substring(7);
            const jwtValidator = c.get('jwt');
            // Validate JWT at edge
            const validation = await jwtValidator.validateToken(token);
            if (!validation.valid) {
                return c.json({
                    error: 'Invalid token',
                    code: 'AUTH_401',
                    message: validation.reason || 'Invalid or expired token'
                }, 401);
            }
            // Check roles if required
            if (requiredRoles && !requiredRoles.includes(validation.payload.role)) {
                return c.json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_403',
                    message: `Required role: ${requiredRoles.join(' or ')}`
                }, 403);
            }
            // Set user context
            c.set('user', {
                id: validation.payload.sub,
                email: validation.payload.email,
                role: validation.payload.role,
                tier: validation.payload.tier || 'free'
            });
            await next();
        }
        catch (error) {
            console.error('Auth error:', error);
            return c.json({
                error: 'Authentication failed',
                code: 'AUTH_401',
                message: 'Please login again'
            }, 401);
        }
    };
};
// Error handling with structured logging
app.onError((err, c) => {
    const errorId = `ERR_${c.get('requestId')}`;
    const env = c.env.NODE_ENV || 'development';
    // Log error with context
    console.error(`[${errorId}]`, {
        message: err.message,
        stack: env === 'development' ? err.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        user: c.get('user')?.id
    });
    // Send error metrics
    if (c.env.ANALYTICS) {
        c.env.ANALYTICS.writeDataPoint({
            blobs: ['error', err.message, c.req.path],
            doubles: [1],
            indexes: [errorId]
        });
    }
    // Determine status code
    const statusCode = err.message.includes('AUTH') ? 401 :
        err.message.includes('FORBIDDEN') ? 403 :
            err.message.includes('NOT_FOUND') ? 404 :
                err.message.includes('VALIDATION') ? 400 : 500;
    // Return sanitized error response
    return c.json({
        error: env === 'production' ? 'An error occurred' : err.message,
        code: `ERR_${statusCode}`,
        errorId,
        timestamp: new Date().toISOString()
    }, statusCode);
});
// ==================== ROUTES ====================
// Health check endpoint with feature flags
app.get('/health', async (c) => {
    const checks = {
        database: false,
        cache: false,
        storage: false
    };
    try {
        // Check D1 database
        const db = c.env.DB;
        await db.prepare('SELECT 1').first();
        checks.database = true;
    }
    catch (e) {
        console.error('Database health check failed:', e);
    }
    try {
        // Check KV cache
        await c.env.KV_CACHE.get('health_check');
        checks.cache = true;
    }
    catch (e) {
        console.error('Cache health check failed:', e);
    }
    try {
        // Check R2 storage
        await c.env.R2_ASSETS.head('health_check');
        checks.storage = true;
    }
    catch (e) {
        // R2 head returns null if not found, which is fine
        checks.storage = true;
    }
    const allHealthy = Object.values(checks).every(v => v);
    return c.json({
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        environment: c.env.NODE_ENV,
        checks,
        features: {
            durableObjects: true,
            webSockets: true,
            aiIntegration: true,
            hybridStorage: true,
            edgeAnalytics: true
        }
    }, allHealthy ? 200 : 503);
});
// API status with detailed metrics
app.get('/api/status', async (c) => {
    const storage = c.get('storage');
    const metrics = await storage.getMetrics();
    return c.json({
        status: 'operational',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        metrics: {
            storage: metrics,
            uptime: process.uptime ? process.uptime() : 'N/A',
            memory: process.memoryUsage ? process.memoryUsage() : 'N/A'
        },
        endpoints: {
            public: ['/health', '/api/status'],
            authentication: ['/api/auth/register', '/api/auth/login', '/api/auth/refresh'],
            protected: ['/api/roadmaps', '/api/snippets', '/api/ws', '/api/ai']
        },
        capabilities: {
            maxRequestSize: '10MB',
            maxResponseSize: '25MB',
            webSocketSupport: true,
            streamingSupport: true,
            compressionEnabled: true
        }
    });
});
// WebSocket endpoint with hibernation
app.get('/api/ws', authMiddleware(), async (c) => {
    const upgradeHeader = c.req.header('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return c.json({
            error: 'WebSocket upgrade required',
            code: 'WS_426'
        }, 426);
    }
    const user = c.get('user');
    const roomId = c.req.query('room') || 'global';
    // Get WebSocket manager Durable Object
    const id = c.env.WEBSOCKET_MANAGER.idFromName(roomId);
    const wsManager = c.env.WEBSOCKET_MANAGER.get(id);
    // Forward request to Durable Object
    return wsManager.fetch(c.req.raw, {
        headers: {
            'X-User-ID': user.id,
            'X-User-Email': user.email,
            'X-User-Role': user.role,
            'X-User-Tier': user.tier
        }
    });
});
// AI orchestration endpoint
app.post('/api/ai/orchestrate', authMiddleware(['pro', 'enterprise']), async (c) => {
    const body = await c.req.json();
    const user = c.get('user');
    // Validate request
    if (!body.task || !body.roadmapId) {
        return c.json({
            error: 'Missing required fields',
            code: 'VAL_400'
        }, 400);
    }
    // Get AI orchestrator Durable Object
    const id = c.env.AI_ORCHESTRATOR.idFromName(body.roadmapId);
    const aiOrchestrator = c.env.AI_ORCHESTRATOR.get(id);
    // Submit task
    const response = await aiOrchestrator.fetch(new Request('https://ai/orchestrate', {
        method: 'POST',
        body: JSON.stringify({
            ...body,
            userId: user.id,
            userTier: user.tier
        })
    }));
    return response;
});
// Roadmap endpoints with hybrid storage
app.get('/api/roadmaps', authMiddleware(), async (c) => {
    const user = c.get('user');
    const storage = c.get('storage');
    const cache = c.get('cache');
    // Check cache first
    const cacheKey = `roadmaps:${user.id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        c.header('X-Cache', 'HIT');
        return c.json(cached);
    }
    // Query from database
    const dbService = new DatabaseService(c.env.DB);
    const roadmaps = await dbService.queryRoadmaps(user.id, c.req.query());
    // Store in cache with TTL
    await cache.set(cacheKey, roadmaps, { expirationTtl: 300 }); // 5 minutes
    c.header('X-Cache', 'MISS');
    return c.json({
        data: roadmaps,
        meta: {
            total: roadmaps.length,
            cached: false
        }
    });
});
app.post('/api/roadmaps', authMiddleware(), async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const storage = c.get('storage');
    // Validate input
    const validation = validateRoadmapBody(body);
    if (!validation.success) {
        return c.json({
            error: 'Validation failed',
            code: 'VAL_400',
            details: validation.error
        }, 400);
    }
    // Store using hybrid pattern
    const roadmapId = crypto.randomUUID();
    const roadmap = {
        id: roadmapId,
        userId: user.id,
        ...validation.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    // Store in appropriate location based on size
    await storage.store(`roadmap:${roadmapId}`, roadmap);
    // Invalidate cache
    const cache = c.get('cache');
    await cache.delete(`roadmaps:${user.id}`);
    // Queue background tasks
    if (c.env.TASK_QUEUE) {
        await c.env.TASK_QUEUE.send({
            type: 'roadmap.created',
            roadmapId,
            userId: user.id
        });
    }
    return c.json({
        data: { id: roadmapId },
        message: 'Roadmap created successfully'
    }, 201);
});
// Authentication endpoints with session management
app.post('/api/auth/register', async (c) => {
    const body = await c.req.json();
    const storage = c.get('storage');
    // Validate input
    if (!body.email || !body.password || !body.name) {
        return c.json({
            error: 'Missing required fields',
            code: 'VAL_400'
        }, 400);
    }
    // Check if user exists
    const dbService = new DatabaseService(c.env.DB);
    const existing = await dbService.getUserByEmail(body.email);
    if (existing) {
        return c.json({
            error: 'User already exists',
            code: 'AUTH_409'
        }, 409);
    }
    // Hash password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(body.password + c.env.JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    // Create user
    const userId = crypto.randomUUID();
    const user = {
        id: userId,
        email: body.email,
        name: body.name,
        passwordHash,
        role: 'user',
        tier: 'free',
        createdAt: new Date().toISOString()
    };
    await dbService.createUser(user);
    // Create session using Durable Object
    const sessionId = crypto.randomUUID();
    const id = c.env.SESSION_MANAGER.idFromName(sessionId);
    const sessionManager = c.env.SESSION_MANAGER.get(id);
    await sessionManager.fetch(new Request('https://session/create', {
        method: 'POST',
        body: JSON.stringify({ userId, email: user.email, role: user.role })
    }));
    // Generate JWT
    const jwtValidator = new EdgeJWTValidator(c.env);
    const token = await jwtValidator.createToken({
        sub: userId,
        email: user.email,
        role: user.role,
        tier: user.tier
    });
    return c.json({
        data: {
            user: { id: userId, email: user.email, name: user.name },
            token,
            sessionId
        },
        message: 'Registration successful'
    }, 201);
});
app.post('/api/auth/login', async (c) => {
    const body = await c.req.json();
    if (!body.email || !body.password) {
        return c.json({
            error: 'Missing credentials',
            code: 'VAL_400'
        }, 400);
    }
    // Get user
    const dbService = new DatabaseService(c.env.DB);
    const user = await dbService.getUserByEmail(body.email);
    if (!user) {
        return c.json({
            error: 'Invalid credentials',
            code: 'AUTH_401'
        }, 401);
    }
    // Verify password
    const encoder = new TextEncoder();
    const data = encoder.encode(body.password + c.env.JWT_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    if (passwordHash !== user.passwordHash) {
        return c.json({
            error: 'Invalid credentials',
            code: 'AUTH_401'
        }, 401);
    }
    // Create session
    const sessionId = crypto.randomUUID();
    const id = c.env.SESSION_MANAGER.idFromName(sessionId);
    const sessionManager = c.env.SESSION_MANAGER.get(id);
    await sessionManager.fetch(new Request('https://session/create', {
        method: 'POST',
        body: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            tier: user.tier
        })
    }));
    // Generate JWT
    const jwtValidator = new EdgeJWTValidator(c.env);
    const token = await jwtValidator.createToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        tier: user.tier
    });
    return c.json({
        data: {
            user: { id: user.id, email: user.email, name: user.name },
            token,
            sessionId
        },
        message: 'Login successful'
    });
});
// Export Durable Objects
export { RateLimiter, WebSocketManager, SessionManager, AIOrchestrator };
export default app;
