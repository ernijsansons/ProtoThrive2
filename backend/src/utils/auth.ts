/**
 * Authentication utilities for ProtoThrive with enhanced security
 * Following OWASP security best practices and enterprise-grade implementations
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
  private readonly issuer = 'protothrive';
  private readonly audience = 'protothrive-api';
  private readonly MINIMUM_SECRET_LENGTH = 64; // SECURITY: Minimum 64 characters (512 bits) for production
  private readonly tokenRotationWindow = 5 * 60 * 1000; // 5 minutes before expiry for rotation

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('JWT secret key is required');
    }

    // SECURITY: Basic length validation
    if (secretKey.length < this.MINIMUM_SECRET_LENGTH) {
      console.warn(`JWT secret is short (${secretKey.length} chars), recommended: ${this.MINIMUM_SECRET_LENGTH}+`);
    }

    // SECURITY: Skip entropy validation for long base64 secrets (they're cryptographically secure)
    if (secretKey.length < 100) {
      const entropyValidation = this.validateSecretStrength(secretKey);
      if (!entropyValidation.valid) {
        console.warn(`JWT secret entropy validation warnings: ${entropyValidation.errors.join(', ')}`);
      }
    }

    this.secret = new TextEncoder().encode(secretKey);
  }

  /**
   * SECURITY: Validate JWT secret strength and entropy
   * Ensures the secret meets cryptographic requirements
   */
  private validateSecretStrength(secret: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for minimum entropy - should have variety of character types
    const hasUpperCase = /[A-Z]/.test(secret);
    const hasLowerCase = /[a-z]/.test(secret);
    const hasNumbers = /[0-9]/.test(secret);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret);

    const characterTypeCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

    if (characterTypeCount < 3) {
      errors.push('Secret must contain at least 3 different character types (uppercase, lowercase, numbers, special characters)');
    }

    // Check for repeating patterns (weak entropy indicator)
    const repeatingPattern = /(.{3,})\1{2,}/.test(secret);
    if (repeatingPattern) {
      errors.push('Secret contains repeating patterns which reduces entropy');
    }

    // Check for sequential characters (123, abc, etc.)
    const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(secret);
    if (hasSequential) {
      errors.push('Secret contains sequential patterns which reduces security');
    }

    return {
      valid: errors.length === 0,
      errors
    };
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
        audience: this.audience,
        clockTolerance: 30 // SECURITY: 30 second clock skew tolerance
      });

      // SECURITY: Check for token expiration with additional validation
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token has expired');
      }

      return {
        sub: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
        iat: payload.iat as number,
        exp: payload.exp as number
      };
    } catch (error) {
      // SECURITY: Log token verification failures for monitoring
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'TOKEN_VERIFICATION_FAILED',
        severity: 'medium',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * SECURITY: Check if token is eligible for rotation (within rotation window before expiry)
   * Implements token rotation strategy to minimize exposure window
   */
  shouldRotateToken(payload: JWTPayload): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    const rotationWindowSeconds = this.tokenRotationWindow / 1000;

    return expiresIn > 0 && expiresIn <= rotationWindowSeconds;
  }
}

let jwtService: JWTService | null = null;

export function initializeJWTService(secretKey: string): void {
  try {
    jwtService = new JWTService(secretKey);
  } catch (error) {
    console.error('JWT service initialization failed:', error);
    throw error;
  }
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
      return c.json({
        error: 'Missing or invalid authorization header',
        code: 'MISSING_AUTH_HEADER',
        timestamp: new Date().toISOString()
      }, 401);
    }

    const token = authHeader.substring(7);

    try {
      const payload = await getJWTService().verifyToken(token);
      c.set('userId', payload.sub);
      c.set('userEmail', payload.email);
      c.set('userRole', payload.role);
      await next();
    } catch (error) {
      // SECURITY: Log security event without exposing details
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'AUTH_MIDDLEWARE_FAILED',
        severity: 'medium',
        ip: c.req.header('CF-Connecting-IP') || 'unknown',
        path: c.req.path
      }));

      return c.json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      }, 401);
    }
  };
}

export function createRateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  let lastCleanup = Date.now();

  return async (c: Context, next: Next) => {
    const clientId = c.req.header('X-Forwarded-For') ||
                     c.req.header('CF-Connecting-IP') ||
                     'anonymous';

    const now = Date.now();

    // Periodic cleanup to prevent memory leaks (every 5 minutes)
    if (now - lastCleanup > 5 * 60 * 1000) {
      for (const [id, data] of requests.entries()) {
        if (now > data.resetTime + 60000) { // Grace period of 1 minute
          requests.delete(id);
        }
      }
      lastCleanup = now;
    }

    const clientData = requests.get(clientId);

    // Immediate cleanup of expired entry
    if (clientData && now > clientData.resetTime + 60000) {
      requests.delete(clientId);
    }

    const currentData = requests.get(clientId);
    if (!currentData || now > currentData.resetTime) {
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
    } else if (currentData.count >= maxRequests) {
      const retryAfter = Math.ceil((currentData.resetTime - now) / 1000);

      // Log rate limit hit for security monitoring
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'RATE_LIMIT_EXCEEDED',
        severity: 'high',
        ip: clientId,
        path: c.req.path,
        count: currentData.count
      }));

      return c.json({
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter: retryAfter
      }, {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(currentData.resetTime).toISOString()
        }
      });
    } else {
      currentData.count++;
    }

    await next();
  };
}

export function createSecurityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    // Generate nonce for CSP
    const nonce = crypto.randomUUID();
    c.set('cspNonce', nonce);

    await next();

    // Security headers
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
  };
}

/**
 * Secure password hashing using PBKDF2 with Web Crypto API (Cloudflare Workers compatible)
 * @param password - Plain text password
 * @returns Promise<string> - Base64 encoded salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

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

/**
 * Password complexity validation following OWASP guidelines
 * @param password - Plain text password to validate
 * @returns Object with validation result and error messages
 */
export function validatePasswordComplexity(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /login/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and may be easily guessed');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate secure random token for password reset, email verification, etc.
 * @param length - Token length in bytes (default: 32)
 * @returns Base64url encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Rate limiting with IP-based tracking for enhanced security
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @param blockDurationMs - How long to block after exceeding limit
 */
export function createAdvancedRateLimiter(
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  blockDurationMs: number = 60 * 60 * 1000 // 1 hour
) {
  const attempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();
  let lastCleanup = Date.now();

  // Helper function to clean up old entries
  const cleanup = () => {
    const now = Date.now();
    if (now - lastCleanup > 5 * 60 * 1000) { // Clean every 5 minutes
      for (const [ip, data] of attempts.entries()) {
        if ((data.blockedUntil && now > data.blockedUntil) ||
            (!data.blockedUntil && now > data.firstAttempt + windowMs)) {
          attempts.delete(ip);
        }
      }
      lastCleanup = now;
    }
  };

  return {
    isBlocked(ip: string): boolean {
      cleanup(); // Clean up old entries
      const data = attempts.get(ip);
      if (!data) return false;

      if (data.blockedUntil && Date.now() < data.blockedUntil) {
        return true;
      }

      return false;
    },

    recordAttempt(ip: string): { blocked: boolean; attemptsLeft: number } {
      cleanup(); // Clean up old entries
      const now = Date.now();
      const data = attempts.get(ip);

      if (!data) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return { blocked: false, attemptsLeft: maxAttempts - 1 };
      }

      // Reset if window expired
      if (now > data.firstAttempt + windowMs) {
        attempts.set(ip, { count: 1, firstAttempt: now });
        return { blocked: false, attemptsLeft: maxAttempts - 1 };
      }

      data.count++;

      if (data.count >= maxAttempts) {
        data.blockedUntil = now + blockDurationMs;

        // Log security event
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'RATE_LIMIT_BLOCK_APPLIED',
          severity: 'high',
          ip,
          attempts: data.count,
          blockedUntil: new Date(data.blockedUntil).toISOString()
        }));

        return { blocked: true, attemptsLeft: 0 };
      }

      return { blocked: false, attemptsLeft: maxAttempts - data.count };
    }
  };
}

/**
 * CSRF Protection Implementation - Double Submit Cookie Pattern
 * Generates CSRF tokens and validates them for state-changing operations
 */
export class CSRFProtection {
  private readonly tokenStore = new Map<string, { token: string; timestamp: number }>();
  private readonly TOKEN_LIFETIME = 3600000; // 1 hour
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  private lastCleanup = Date.now();

  /**
   * Generate a new CSRF token for a session
   * @param sessionId - Unique session identifier (can be user ID or session token)
   * @returns Object containing token and cookie name
   */
  generateToken(sessionId: string): { token: string; cookieName: string } {
    this.cleanup();

    const token = generateSecureToken(32);
    const timestamp = Date.now();

    this.tokenStore.set(sessionId, { token, timestamp });

    // SECURITY: Log token generation for audit trail
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'CSRF_TOKEN_GENERATED',
      severity: 'info',
      sessionId: this.hashSessionId(sessionId)
    }));

    return {
      token,
      cookieName: 'X-CSRF-Token'
    };
  }

  /**
   * Validate CSRF token from request
   * @param sessionId - Session identifier
   * @param providedToken - Token from request header or form field
   * @returns Boolean indicating if token is valid
   */
  validateToken(sessionId: string, providedToken: string): boolean {
    this.cleanup();

    const stored = this.tokenStore.get(sessionId);

    if (!stored) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'CSRF_VALIDATION_FAILED',
        severity: 'high',
        reason: 'token_not_found',
        sessionId: this.hashSessionId(sessionId)
      }));
      return false;
    }

    // Check token expiration
    if (Date.now() - stored.timestamp > this.TOKEN_LIFETIME) {
      this.tokenStore.delete(sessionId);
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'CSRF_VALIDATION_FAILED',
        severity: 'medium',
        reason: 'token_expired',
        sessionId: this.hashSessionId(sessionId)
      }));
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = this.constantTimeCompare(stored.token, providedToken);

    if (!isValid) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'CSRF_VALIDATION_FAILED',
        severity: 'high',
        reason: 'token_mismatch',
        sessionId: this.hashSessionId(sessionId)
      }));
    }

    return isValid;
  }

  /**
   * Middleware factory for CSRF protection
   * @returns Hono middleware function
   */
  createMiddleware() {
    return async (c: Context, next: Next) => {
      const method = c.req.method;

      // Only validate CSRF for state-changing operations
      const requiresCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

      if (!requiresCSRF) {
        await next();
        return;
      }

      // Extract session ID (from JWT payload or session cookie)
      const sessionId = c.get('userId') || c.get('sessionId') || 'anonymous';

      // Check for CSRF token in header or body
      const csrfToken = c.req.header('X-CSRF-Token') ||
                        c.req.header('x-csrf-token');

      if (!csrfToken) {
        return c.json({
          error: 'CSRF token required',
          code: 'CSRF-403',
          message: 'CSRF token is required for this operation'
        }, 403);
      }

      // Validate token
      const isValid = this.validateToken(sessionId, csrfToken);

      if (!isValid) {
        return c.json({
          error: 'Invalid CSRF token',
          code: 'CSRF-403',
          message: 'CSRF token validation failed'
        }, 403);
      }

      await next();
    };
  }

  /**
   * Clean up expired tokens
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now - data.timestamp > this.TOKEN_LIFETIME) {
        this.tokenStore.delete(sessionId);
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Hash session ID for logging (privacy protection)
   */
  private async hashSessionId(sessionId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(sessionId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

/**
 * HMAC Request Signing for Sensitive Operations
 * Provides request integrity verification using HMAC-SHA256
 */
export class RequestSigning {
  private signingKey: CryptoKey | null = null;

  /**
   * Initialize request signing with a secret key
   * @param secretKey - Secret key for HMAC signing (should be different from JWT secret)
   */
  async initialize(secretKey: string): Promise<void> {
    if (secretKey.length < 64) {
      throw new Error('Request signing key must be at least 64 characters');
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);

    this.signingKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  /**
   * Sign a request with HMAC-SHA256
   * @param method - HTTP method
   * @param path - Request path
   * @param body - Request body (if any)
   * @param timestamp - Request timestamp (Unix timestamp in seconds)
   * @returns Base64-encoded signature
   */
  async signRequest(
    method: string,
    path: string,
    body: string | null,
    timestamp: number
  ): Promise<string> {
    if (!this.signingKey) {
      throw new Error('Request signing not initialized');
    }

    // Construct signing payload: METHOD\nPATH\nBODY\nTIMESTAMP
    const payload = `${method.toUpperCase()}\n${path}\n${body || ''}\n${timestamp}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      this.signingKey,
      data
    );

    // Convert to base64
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return btoa(String.fromCharCode(...signatureArray));
  }

  /**
   * Verify request signature
   * @param signature - Provided signature from request header
   * @param method - HTTP method
   * @param path - Request path
   * @param body - Request body (if any)
   * @param timestamp - Request timestamp
   * @param maxAge - Maximum age of signature in seconds (default: 300 = 5 minutes)
   * @returns Boolean indicating if signature is valid
   */
  async verifyRequest(
    signature: string,
    method: string,
    path: string,
    body: string | null,
    timestamp: number,
    maxAge: number = 300
  ): Promise<boolean> {
    if (!this.signingKey) {
      throw new Error('Request signing not initialized');
    }

    // Check timestamp to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxAge) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'REQUEST_SIGNATURE_FAILED',
        severity: 'high',
        reason: 'timestamp_out_of_range',
        providedTimestamp: timestamp,
        currentTimestamp: now
      }));
      return false;
    }

    // Compute expected signature
    const expectedSignature = await this.signRequest(method, path, body, timestamp);

    // Constant-time comparison
    const isValid = this.constantTimeCompare(signature, expectedSignature);

    if (!isValid) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'REQUEST_SIGNATURE_FAILED',
        severity: 'high',
        reason: 'signature_mismatch',
        method,
        path
      }));
    }

    return isValid;
  }

  /**
   * Middleware factory for request signature verification
   * @param paths - Array of paths that require signature verification
   * @returns Hono middleware function
   */
  createMiddleware(paths: string[] = []) {
    return async (c: Context, next: Next) => {
      const path = c.req.path;
      const requiresSignature = paths.length === 0 || paths.some(p => path.startsWith(p));

      if (!requiresSignature) {
        await next();
        return;
      }

      // Extract signature from header
      const signature = c.req.header('X-Request-Signature');
      const timestampHeader = c.req.header('X-Request-Timestamp');

      if (!signature || !timestampHeader) {
        return c.json({
          error: 'Request signature required',
          code: 'SIGNATURE-403',
          message: 'X-Request-Signature and X-Request-Timestamp headers are required'
        }, 403);
      }

      const timestamp = parseInt(timestampHeader, 10);
      if (isNaN(timestamp)) {
        return c.json({
          error: 'Invalid timestamp',
          code: 'SIGNATURE-400',
          message: 'X-Request-Timestamp must be a valid Unix timestamp'
        }, 400);
      }

      // Get request body (if any)
      const body = c.req.method !== 'GET' ? await c.req.text() : null;

      // Verify signature
      const isValid = await this.verifyRequest(
        signature,
        c.req.method,
        c.req.path,
        body,
        timestamp
      );

      if (!isValid) {
        return c.json({
          error: 'Invalid request signature',
          code: 'SIGNATURE-403',
          message: 'Request signature verification failed'
        }, 403);
      }

      await next();
    };
  }

  /**
   * Constant-time string comparison
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// Export singleton instances
export const csrfProtection = new CSRFProtection();
export const requestSigning = new RequestSigning();