/**
 * Authentication utilities for ProtoThrive
 */

import { Context, Next } from 'hono';
import * as jose from 'jose';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class JWTService {
  private secret: Uint8Array;
  private issuer = 'protothrive';
  private audience = 'protothrive-api';

  constructor(secretKey: string) {
    this.secret = new TextEncoder().encode(secretKey);
  }

  async createToken(userId: string, email: string, role: string): Promise<string> {
    const jwt = await new jose.SignJWT({
      sub: userId,
      email,
      role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime('15m')
      .sign(this.secret);

    return jwt;
  }

  async createRefreshToken(userId: string): Promise<string> {
    const jwt = await new jose.SignJWT({ sub: userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime('7d')
      .sign(this.secret);

    return jwt;
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience
      });

      return payload as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

let jwtService: JWTService;

export function initializeJWTService(secretKey: string) {
  jwtService = new JWTService(secretKey);
}

export function getJWTService(): JWTService {
  if (!jwtService) {
    throw new Error('JWT Service not initialized');
  }
  return jwtService;
}

export function createAuthMiddleware() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await getJWTService().verifyToken(token);
      c.set('userId', payload.sub);
      c.set('userEmail', payload.email);
      c.set('userRole', payload.role);
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  };
}

export function createRateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (c: Context, next: Next) => {
    const clientId = c.req.header('X-Forwarded-For') ||
                    c.req.header('CF-Connecting-IP') ||
                    'anonymous';

    const now = Date.now();
    const clientData = requests.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
    } else if (clientData.count >= maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      return c.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
          }
        }
      );
    } else {
      clientData.count++;
    }

    await next();
  };
}

export function createSecurityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  };
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for Cloudflare Workers (replace with proper hashing in production)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}