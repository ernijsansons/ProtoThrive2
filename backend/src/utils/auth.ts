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

      return {
        sub: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
        iat: payload.iat as number,
        exp: payload.exp as number
      };
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

/**
 * Secure password hashing using PBKDF2 with Web Crypto API
 * @param password - Plain text password
 * @returns Promise<string> - Base64 encoded salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to array buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    key,
    256 // 256 bits = 32 bytes
  );

  // Combine salt and hash, encode as base64
  const combined = new Uint8Array(salt.length + hashBuffer.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hashBuffer), salt.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify password against stored hash
 * @param password - Plain text password
 * @param storedHash - Base64 encoded salt:hash
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = new Uint8Array(
      atob(storedHash).split('').map(char => char.charCodeAt(0))
    );

    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const salt = combined.slice(0, 16);
    const originalHash = combined.slice(16);

    // Convert password to array buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import the password as a key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive key using same parameters
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );

    const newHash = new Uint8Array(hashBuffer);

    // Compare hashes using constant-time comparison
    return constantTimeEquals(originalHash, newHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 * @param a - First array
 * @param b - Second array
 * @returns boolean - True if arrays are equal
 */
function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}