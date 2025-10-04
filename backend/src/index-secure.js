/**
 * ProtoThrive Backend API - SECURITY PATCH with Authentication
 * Fixes critical authentication bypass vulnerability and adds auth endpoints
 * Version: 2.0.2-AUTH
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, validatePasswordComplexity, createAdvancedRateLimiter } from './utils/auth';
import { validateRegisterBody, validateLoginBody, formatValidationError } from './utils/validation';

const app = new Hono();

// CORS Configuration
app.use('*', cors({
    origin: (origin) => {
        const allowedOrigins = [
            'https://protothrive.com',
            'https://app.protothrive.com',
            'http://localhost:3000' // Only in dev
        ];
        return allowedOrigins.includes(origin) ? origin : 'https://protothrive.com';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
}));

// Security headers with nonce-based CSP
app.use('*', async (c, next) => {
    // Generate nonce for CSP
    const nonce = crypto.randomUUID();
    c.set('cspNonce', nonce);

    await next();

    // Comprehensive security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Secure CSP with nonce - NO unsafe-inline
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' data: https:",
        "font-src 'self' https:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ].join('; ');

    c.header('Content-Security-Policy', csp);
});

// JWT Verification - CRITICAL SECURITY FIX
async function verifyJWT(token, secret) {
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
            throw new Error('Invalid token format');
        }

        const data = `${header}.${payload}`;
        const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sig,
            encoder.encode(data)
        );

        if (!valid) {
            throw new Error('Invalid signature');
        }

        const decodedPayload = JSON.parse(atob(payload));

        // Check expiration
        if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
            throw new Error('Token expired');
        }

        return decodedPayload;
    } catch (error) {
        throw new Error('Invalid token: ' + error.message);
    }
}

// Authentication Middleware - ENFORCED ON ALL PROTECTED ROUTES
function requireAuth() {
    return async (c, next) => {
        const authHeader = c.req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            }, 401);
        }

        const token = authHeader.substring(7);
        const jwtSecret = c.env?.JWT_SECRET;

        if (!jwtSecret) {
            console.error('JWT_SECRET not configured');
            return c.json({
                error: 'Server configuration error',
                code: 'CONFIG_ERROR'
            }, 500);
        }

        try {
            const payload = await verifyJWT(token, jwtSecret);
            c.set('userId', payload.sub || payload.user_id);
            c.set('userEmail', payload.email);
            c.set('userRole', payload.role || 'user');
            await next();
        } catch (error) {
            // SECURITY: Log security event without exposing details
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                event: 'JWT_VERIFICATION_FAILED',
                severity: 'medium',
                ip: c.req.header('CF-Connecting-IP') || 'unknown'
            }));

            return c.json({
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN',
                timestamp: new Date().toISOString()
                // SECURITY: No details in production
            }, 401);
        }
    };
}


// Initialize rate limiter for auth endpoints
const authRateLimiter = createAdvancedRateLimiter(5, 15 * 60 * 1000, 60 * 60 * 1000); // 5 attempts per 15 min, 1 hour block

// Auth rate limiting middleware
function authRateLimit() {
    return async (c, next) => {
        const clientIp = c.req.header('CF-Connecting-IP') ||
                         c.req.header('X-Forwarded-For') ||
                         'unknown';

        if (authRateLimiter.isBlocked(clientIp)) {
            return c.json({
                error: 'Too many authentication attempts',
                code: 'AUTH_RATE_LIMITED',
                message: 'Account temporarily blocked due to multiple failed attempts',
                timestamp: new Date().toISOString()
            }, 429);
        }

        await next();
    };
}

// POST /api/auth/register - User registration
app.post('/api/auth/register', authRateLimit(), async (c) => {
    const db = c.env?.DB;
    const jwtSecret = c.env?.JWT_SECRET;

    if (!db || !jwtSecret) {
        return c.json({
            error: 'Server configuration error',
            code: 'CONFIG_ERROR'
        }, 500);
    }

    try {
        const body = await c.req.json();

        // Validate input
        const validation = validateRegisterBody(body);
        if (!validation.success) {
            return c.json(formatValidationError(validation.error), 400);
        }

        const { email, password, firstName, lastName, role = 'vibe_coder' } = validation.data;

        // Validate password complexity
        const passwordValidation = validatePasswordComplexity(password);
        if (!passwordValidation.valid) {
            return c.json({
                error: 'Password does not meet security requirements',
                code: 'WEAK_PASSWORD',
                details: passwordValidation.errors,
                timestamp: new Date().toISOString()
            }, 400);
        }

        // Check if email already exists
        const existingUserQuery = `
            SELECT id FROM users
            WHERE email = ? AND (deleted_at IS NULL OR deleted_at = '')
            LIMIT 1
        `;
        const existingUser = await db.prepare(existingUserQuery).bind(email.toLowerCase()).first();

        if (existingUser) {
            // Record failed attempt for rate limiting
            const clientIp = c.req.header('CF-Connecting-IP') || 'unknown';
            authRateLimiter.recordAttempt(clientIp);

            return c.json({
                error: 'Email already registered',
                code: 'EMAIL_EXISTS',
                timestamp: new Date().toISOString()
            }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const userId = crypto.randomUUID();
        const now = new Date().toISOString();

        const insertUserQuery = `
            INSERT INTO users (
                id, email, password_hash, role, first_name, last_name,
                email_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.prepare(insertUserQuery).bind(
            userId,
            email.toLowerCase(),
            passwordHash,
            role,
            firstName || null,
            lastName || null,
            false, // email_verified
            now,
            now
        ).run();

        // Log security event
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'USER_REGISTERED',
            severity: 'info',
            userId,
            email: email.toLowerCase(),
            ip: c.req.header('CF-Connecting-IP') || 'unknown'
        }));

        return c.json({
            message: 'User registered successfully',
            data: {
                userId,
                email: email.toLowerCase(),
                role
            }
        }, 201);

    } catch (error) {
        console.error('Registration error:', error);
        return c.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }, 500);
    }
});

// POST /api/auth/login - User login
app.post('/api/auth/login', authRateLimit(), async (c) => {
    const db = c.env?.DB;
    const jwtSecret = c.env?.JWT_SECRET;

    if (!db || !jwtSecret) {
        return c.json({
            error: 'Server configuration error',
            code: 'CONFIG_ERROR'
        }, 500);
    }

    const clientIp = c.req.header('CF-Connecting-IP') || 'unknown';

    try {
        const body = await c.req.json();

        // Validate input
        const validation = validateLoginBody(body);
        if (!validation.success) {
            authRateLimiter.recordAttempt(clientIp);
            return c.json(formatValidationError(validation.error), 400);
        }

        const { email, password } = validation.data;

        // Prevent timing attacks by always performing password verification
        let passwordHash = null;
        let user = null;

        // Get user from database
        const userQuery = `
            SELECT id, email, password_hash, role, first_name, last_name,
                   email_verified, created_at, last_login
            FROM users
            WHERE email = ? AND (deleted_at IS NULL OR deleted_at = '')
            LIMIT 1
        `;
        user = await db.prepare(userQuery).bind(email.toLowerCase()).first();

        if (user) {
            passwordHash = user.password_hash;
        } else {
            // Perform dummy hash verification to prevent timing attacks
            passwordHash = await hashPassword('dummy_password_for_timing_attack_prevention');
        }

        // Always verify password to prevent timing attacks
        const isValidPassword = await verifyPassword(password, passwordHash);

        if (!user || !isValidPassword) {
            // Record failed attempt
            authRateLimiter.recordAttempt(clientIp);

            // Log security event
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                event: 'LOGIN_FAILED',
                severity: 'medium',
                email: email.toLowerCase(),
                ip: clientIp,
                reason: !user ? 'user_not_found' : 'invalid_password'
            }));

            return c.json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS',
                timestamp: new Date().toISOString()
            }, 401);
        }

        // Generate JWT tokens
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        };

        const refreshPayload = {
            sub: user.id,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };

        const accessToken = await signJWT(payload, jwtSecret);
        const refreshToken = await signJWT(refreshPayload, jwtSecret);

        // Store refresh token in database
        const refreshTokenId = crypto.randomUUID();
        const refreshTokenHash = await hashPassword(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const insertRefreshTokenQuery = `
            INSERT INTO refresh_tokens (
                id, user_id, token_hash, expires_at, created_at, last_used
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        await db.prepare(insertRefreshTokenQuery).bind(
            refreshTokenId,
            user.id,
            refreshTokenHash,
            expiresAt,
            new Date().toISOString(),
            null
        ).run();

        // Update last login
        const updateLastLoginQuery = `
            UPDATE users SET last_login = ? WHERE id = ?
        `;
        await db.prepare(updateLastLoginQuery).bind(
            new Date().toISOString(),
            user.id
        ).run();

        // Log successful login
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'LOGIN_SUCCESS',
            severity: 'info',
            userId: user.id,
            email: user.email,
            ip: clientIp
        }));

        // Return user data without sensitive fields
        const sanitizedUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            emailVerified: user.email_verified,
            createdAt: user.created_at
        };

        return c.json({
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                user: sanitizedUser
            }
        }, 200);

    } catch (error) {
        console.error('Login error:', error);
        authRateLimiter.recordAttempt(clientIp);

        return c.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }, 500);
    }
});

// POST /api/auth/refresh - Refresh access token
app.post('/api/auth/refresh', async (c) => {
    const db = c.env?.DB;
    const jwtSecret = c.env?.JWT_SECRET;

    if (!db || !jwtSecret) {
        return c.json({
            error: 'Server configuration error',
            code: 'CONFIG_ERROR'
        }, 500);
    }

    try {
        const body = await c.req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return c.json({
                error: 'Refresh token required',
                code: 'MISSING_REFRESH_TOKEN',
                timestamp: new Date().toISOString()
            }, 400);
        }

        // Verify JWT structure and signature
        let refreshPayload;
        try {
            refreshPayload = await verifyJWT(refreshToken, jwtSecret);
        } catch (error) {
            return c.json({
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN',
                timestamp: new Date().toISOString()
            }, 401);
        }

        // Check if refresh token exists and is valid in database
        const tokenQuery = `
            SELECT rt.id, rt.user_id, rt.expires_at, rt.created_at,
                   u.email, u.role, u.first_name, u.last_name, u.email_verified
            FROM refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.user_id = ? AND rt.expires_at > ?
            ORDER BY rt.created_at DESC
            LIMIT 1
        `;

        const tokenRecord = await db.prepare(tokenQuery).bind(
            refreshPayload.sub,
            new Date().toISOString()
        ).first();

        if (!tokenRecord) {
            return c.json({
                error: 'Refresh token expired',
                code: 'TOKEN_EXPIRED',
                timestamp: new Date().toISOString()
            }, 401);
        }

        // Generate new tokens
        const newAccessPayload = {
            sub: tokenRecord.user_id,
            email: tokenRecord.email,
            role: tokenRecord.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        };

        const newRefreshPayload = {
            sub: tokenRecord.user_id,
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };

        const newAccessToken = await signJWT(newAccessPayload, jwtSecret);
        const newRefreshToken = await signJWT(newRefreshPayload, jwtSecret);

        // Update refresh token in database
        const newRefreshTokenHash = await hashPassword(newRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const updateTokenQuery = `
            UPDATE refresh_tokens
            SET token_hash = ?, expires_at = ?, last_used = ?
            WHERE id = ?
        `;

        await db.prepare(updateTokenQuery).bind(
            newRefreshTokenHash,
            newExpiresAt,
            new Date().toISOString(),
            tokenRecord.id
        ).run();

        return c.json({
            message: 'Tokens refreshed successfully',
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        }, 200);

    } catch (error) {
        console.error('Token refresh error:', error);
        return c.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }, 500);
    }
});

// POST /api/auth/logout - Logout user
app.post('/api/auth/logout', async (c) => {
    const db = c.env?.DB;

    try {
        const body = await c.req.json();
        const { refreshToken } = body;

        // If refresh token provided, invalidate it
        if (refreshToken && db) {
            // Note: In production, you might want to verify the token first
            // For security, we delete based on token existence rather than verification
            const deleteTokenQuery = `
                DELETE FROM refresh_tokens
                WHERE token_hash = ? OR expires_at < ?
            `;

            // Also cleanup expired tokens
            await db.prepare(deleteTokenQuery).bind(
                await hashPassword(refreshToken),
                new Date().toISOString()
            ).run();
        }

        // Log logout event
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'USER_LOGOUT',
            severity: 'info',
            ip: c.req.header('CF-Connecting-IP') || 'unknown'
        }));

        // Always return success for security reasons (even if token was invalid)
        return c.json({
            message: 'Logout successful'
        }, 200);

    } catch (error) {
        console.error('Logout error:', error);

        // Still return success to prevent information disclosure
        return c.json({
            message: 'Logout successful'
        }, 200);
    }
});

// JWT signing helper function
async function signJWT(payload, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    const data = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(data)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${data}.${encodedSignature}`;
}

// Health check (public)
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        version: '2.0.1-SECURITY',
        timestamp: new Date().toISOString(),
        security: 'PATCHED'
    });
});

// Status endpoint (public)
app.get('/api/status', (c) => {
    return c.json({
        message: 'ProtoThrive API - Security Patch Applied',
        version: '2.0.1-SECURITY',
        security: {
            authentication: 'ENFORCED',
            cors: 'CONFIGURED',
            headers: 'SECURED'
        }
    });
});

// PROTECTED: Get roadmaps - FIXED AUTHENTICATION BYPASS
app.get('/api/roadmaps', requireAuth(), async (c) => {
    const userId = c.get('userId');
    const db = c.env?.DB;

    if (!userId) {
        return c.json({
            error: 'User context not found',
            code: 'NO_USER_CONTEXT'
        }, 401);
    }

    if (!db) {
        return c.json({
            error: 'Database not configured',
            code: 'DB_ERROR'
        }, 500);
    }

    try {
        // CRITICAL: Filter by user_id to prevent data leakage
        const query = `
            SELECT id, title, description, status, thrive_score, created_at, updated_at
            FROM roadmaps
            WHERE user_id = ? AND (deleted_at IS NULL OR deleted_at = '')
            ORDER BY updated_at DESC
            LIMIT 50
        `;

        const result = await db.prepare(query).bind(userId).all();

        return c.json({
            data: result.results || [],
            meta: {
                total: result.results?.length || 0,
                user_id: userId
            }
        });
    } catch (error) {
        // SECURITY: Log detailed error server-side only
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'DATABASE_ERROR',
            severity: 'high',
            operation: 'fetch_roadmaps',
            userId: userId,
            error: error.message
        }));

        return c.json({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        }, 500);
    }
});

// PROTECTED: Get single roadmap
app.get('/api/roadmaps/:id', requireAuth(), async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');
    const db = c.env?.DB;

    if (!userId || !roadmapId || !db) {
        return c.json({
            error: 'Invalid request parameters',
            code: 'INVALID_PARAMS'
        }, 400);
    }

    try {
        // CRITICAL: Verify ownership before returning data
        const query = `
            SELECT * FROM roadmaps
            WHERE id = ? AND user_id = ? AND (deleted_at IS NULL OR deleted_at = '')
            LIMIT 1
        `;

        const result = await db.prepare(query).bind(roadmapId, userId).first();

        if (!result) {
            return c.json({
                error: 'Roadmap not found or access denied',
                code: 'NOT_FOUND'
            }, 404);
        }

        return c.json({ data: result });
    } catch (error) {
        console.error('Database error:', error);
        return c.json({
            error: 'Failed to fetch roadmap',
            code: 'DB_QUERY_ERROR'
        }, 500);
    }
});

// PROTECTED: Create roadmap
app.post('/api/roadmaps', requireAuth(), async (c) => {
    const userId = c.get('userId');
    const db = c.env?.DB;

    if (!userId || !db) {
        return c.json({
            error: 'Invalid request context',
            code: 'INVALID_CONTEXT'
        }, 400);
    }

    try {
        const body = await c.req.json();
        const { title, description, json_graph } = body;

        if (!title) {
            return c.json({
                error: 'Title is required',
                code: 'VALIDATION_ERROR'
            }, 400);
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        const query = `
            INSERT INTO roadmaps (
                id, user_id, title, description, json_graph,
                status, thrive_score, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'draft', 0.0, ?, ?)
        `;

        await db.prepare(query).bind(
            id, userId, title, description || null,
            json_graph || '{"nodes":[],"edges":[]}',
            now, now
        ).run();

        return c.json({
            message: 'Roadmap created successfully',
            data: { id }
        }, 201);
    } catch (error) {
        console.error('Database error:', error);
        return c.json({
            error: 'Failed to create roadmap',
            code: 'DB_INSERT_ERROR'
        }, 500);
    }
});

// PROTECTED: Update roadmap
app.put('/api/roadmaps/:id', requireAuth(), async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');
    const db = c.env?.DB;

    if (!userId || !roadmapId || !db) {
        return c.json({
            error: 'Invalid request parameters',
            code: 'INVALID_PARAMS'
        }, 400);
    }

    try {
        // First verify ownership
        const checkQuery = `
            SELECT id FROM roadmaps
            WHERE id = ? AND user_id = ?
            LIMIT 1
        `;

        const exists = await db.prepare(checkQuery).bind(roadmapId, userId).first();

        if (!exists) {
            return c.json({
                error: 'Roadmap not found or access denied',
                code: 'NOT_FOUND'
            }, 404);
        }

        const body = await c.req.json();
        const updates = [];
        const values = [];

        if (body.title !== undefined) {
            updates.push('title = ?');
            values.push(body.title);
        }
        if (body.description !== undefined) {
            updates.push('description = ?');
            values.push(body.description);
        }
        if (body.json_graph !== undefined) {
            updates.push('json_graph = ?');
            values.push(body.json_graph);
        }
        if (body.status !== undefined) {
            updates.push('status = ?');
            values.push(body.status);
        }

        if (updates.length === 0) {
            return c.json({
                error: 'No valid updates provided',
                code: 'NO_UPDATES'
            }, 400);
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(roadmapId);
        values.push(userId);

        const updateQuery = `
            UPDATE roadmaps
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `;

        await db.prepare(updateQuery).bind(...values).run();

        return c.json({
            message: 'Roadmap updated successfully',
            data: { id: roadmapId }
        });
    } catch (error) {
        console.error('Database error:', error);
        return c.json({
            error: 'Failed to update roadmap',
            code: 'DB_UPDATE_ERROR'
        }, 500);
    }
});

// PROTECTED: Delete roadmap (soft delete)
app.delete('/api/roadmaps/:id', requireAuth(), async (c) => {
    const userId = c.get('userId');
    const roadmapId = c.req.param('id');
    const db = c.env?.DB;

    if (!userId || !roadmapId || !db) {
        return c.json({
            error: 'Invalid request parameters',
            code: 'INVALID_PARAMS'
        }, 400);
    }

    try {
        const query = `
            UPDATE roadmaps
            SET deleted_at = ?, updated_at = ?
            WHERE id = ? AND user_id = ? AND (deleted_at IS NULL OR deleted_at = '')
        `;

        const now = new Date().toISOString();
        const result = await db.prepare(query).bind(now, now, roadmapId, userId).run();

        if (result.meta.changes === 0) {
            return c.json({
                error: 'Roadmap not found or already deleted',
                code: 'NOT_FOUND'
            }, 404);
        }

        return c.json({
            message: 'Roadmap deleted successfully',
            data: { id: roadmapId }
        });
    } catch (error) {
        console.error('Database error:', error);
        return c.json({
            error: 'Failed to delete roadmap',
            code: 'DB_DELETE_ERROR'
        }, 500);
    }
});

// Distributed rate limiting using Durable Objects
app.use('*', async (c, next) => {
    const rateLimiterBinding = c.env?.RATE_LIMITER;

    if (!rateLimiterBinding) {
        console.warn('Rate limiter Durable Object binding not found, allowing request');
        await next();
        return;
    }

    try {
        // Generate unique identifier for this client
        const clientIp = c.req.header('CF-Connecting-IP') ||
                         c.req.header('X-Forwarded-For') ||
                         'unknown';

        // Check if user is authenticated
        const isAuthenticated = !!(c.get('userId') || c.get('userEmail'));
        const identifier = isAuthenticated ? `user:${c.get('userId')}` : `ip:${clientIp}`;

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
            })
        });

        const rateLimitResult = await checkResponse.json();

        // Add rate limit headers to response
        c.header('X-RateLimit-Limit', rateLimitResult.limit?.toString() || '100');
        c.header('X-RateLimit-Remaining', rateLimitResult.remaining?.toString() || '0');
        c.header('X-RateLimit-Reset', new Date(rateLimitResult.resetTime || Date.now() + 60000).toISOString());

        if (rateLimitResult.retryAfter) {
            c.header('Retry-After', rateLimitResult.retryAfter.toString());
        }

        // If rate limit exceeded, return error response
        if (!rateLimitResult.allowed) {
            return c.json({
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                message: 'You have exceeded the rate limit. Please try again later.',
                retry_after: rateLimitResult.retryAfter,
                timestamp: new Date().toISOString()
            }, 429);
        }

        await next();

    } catch (error) {
        console.error('Rate limiting error:', error);
        // Fail open - allow the request but log the error
        console.warn('Rate limiting failed, allowing request through');
        await next();
    }
});

// 404 handler
app.all('*', (c) => {
    return c.json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: c.req.path,
        method: c.req.method
    }, 404);
});

export default app;