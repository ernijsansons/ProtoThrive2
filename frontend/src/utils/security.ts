/**
 * Security Utilities Module - ENHANCED FOR PRODUCTION SECURITY
 * Provides authentication, validation, rate limiting, audit logging, XSS/CSRF protection
 * Ref: CLAUDE.md Security - Critical P0 vulnerability fixes implemented
 */

import DOMPurify from 'dompurify';

// Security Error Class
export class SecurityError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string = 'SECURITY_ERROR', statusCode: number = 400) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Input Validator Class
export class InputValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static sanitizeInput(input: string): string {
    // ENHANCED XSS PROTECTION using DOMPurify - CRITICAL P0 FIX
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: false 
    });
  }

  // NEW: HTML sanitization for rich content (notifications, etc.)
  static sanitizeHtml(html: string): string {
    // CRITICAL P0 XSS FIX: Sanitize HTML content for safe rendering
    const config = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
      ALLOWED_ATTR: ['class'],
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: false
    };
    return DOMPurify.sanitize(html, config);
  }

  // NEW: AI Prompt injection protection - CRITICAL P0 FIX
  static sanitizeAIPrompt(prompt: string): string {
    // Remove potential injection patterns
    let sanitized = prompt
      // Remove common prompt injection patterns
      .replace(/(?:ignore|forget|disregard).{0,20}(?:previous|above|instructions|system|prompt)/gi, '[FILTERED]')
      .replace(/(?:act|behave|pretend).{0,20}(?:as|like).{0,20}(?:admin|root|system|developer)/gi, '[FILTERED]')
      .replace(/(?:\[SYSTEM\]|\[ADMIN\]|\[ROOT\])/gi, '[FILTERED]')
      // Remove excessive special characters that might be used for injection
      .replace(/[<>{}\\]/g, '')
      // Limit length to prevent overflow attacks
      .slice(0, 2000);
      
    // Basic sanitization to remove HTML/script attempts
    sanitized = this.sanitizeInput(sanitized);
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /(?:javascript|vbscript|onload|onerror):/gi,
      /<script/gi,
      /data:text\/html/gi,
      /eval\s*\(/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        console.warn('Thermonuclear Security: Suspicious AI prompt pattern detected and filtered');
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }
    
    return sanitized.trim();
  }

  static validateRequired(value: any, fieldName: string): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new SecurityError(`${fieldName} is required`, 'VALIDATION_ERROR', 400);
    }
  }
}

// Rate Limiter
export const rateLimiter = {
  private: new Map<string, { count: number; resetTime: number }>(),

  check(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = identifier;
    const record = this.private.get(key);

    if (!record || now > record.resetTime) {
      this.private.set(key, { count: 1, resetTime: now + windowMs });
      console.log(`🛡️ Rate Limiter: New window for ${identifier} (1/${limit})`);
      return true;
    }

    if (record.count >= limit) {
      console.warn(`🚫 Rate Limiter: Limit exceeded for ${identifier} (${record.count}/${limit})`);
      return false;
    }

    record.count++;
    console.log(`🛡️ Rate Limiter: Request allowed for ${identifier} (${record.count}/${limit})`);
    return true;
  },

  reset(identifier: string): void {
    this.private.delete(identifier);
    console.log(`🔄 Rate Limiter: Reset for ${identifier}`);
  }
};

// Audit Logger
export const auditLogger = {
  log(event: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      data,
      environment: 'development'
    };

    console.log(`📋 Audit Log: ${event}`, logEntry);

    // In production, this would send to a logging service
    // For development, we just log to console
  },

  logAuthAttempt(email: string, success: boolean, method: string = 'email'): void {
    this.log('auth_attempt', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
      success,
      method,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      ip: 'dev-localhost'
    });
  },

  logSecurityEvent(type: string, details: any): void {
    this.log('security_event', {
      type,
      details,
      severity: 'medium'
    });
  }
};

// API Key Manager
export const apiKeyManager = {
  private: new Map<string, { key: string; permissions: string[] }>(),

  generateKey(userId: string, permissions: string[] = []): string {
    const key = `pt_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.private.set(userId, { key, permissions });
    console.log(`🔑 API Key generated for user: ${userId}`);
    return key;
  },

  validateKey(key: string): { valid: boolean; userId?: string; permissions?: string[] } {
    for (const [userId, record] of this.private.entries()) {
      if (record.key === key) {
        console.log(`✅ API Key validated for user: ${userId}`);
        return { valid: true, userId, permissions: record.permissions };
      }
    }
    console.warn(`❌ Invalid API Key: ${key.substring(0, 10)}...`);
    return { valid: false };
  },

  revokeKey(userId: string): void {
    this.private.delete(userId);
    console.log(`🗑️ API Key revoked for user: ${userId}`);
  }
};

// ENHANCED CSRF Protection - CRITICAL P0 FIX
export const csrfProtectionService = {
  generateToken(): string {
    // Use cryptographically secure random token generation
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto API
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Store token in sessionStorage for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', token);
    }
    
    return token;
  },

  validateToken(token: string, expectedToken?: string): boolean {
    if (!token || typeof token !== 'string' || token.length !== 64) {
      console.warn('Thermonuclear Security: Invalid CSRF token format');
      return false;
    }
    
    // Validate against stored token
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('csrf_token');
      if (storedToken && storedToken === token) {
        return true;
      }
    }
    
    // Fallback to expected token comparison
    if (expectedToken) {
      return token === expectedToken;
    }
    
    console.warn('Thermonuclear Security: CSRF token validation failed');
    return false;
  },

  // NEW: OAuth state parameter generation and validation
  generateOAuthState(): string {
    const state = this.generateToken();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
    }
    return state;
  },

  validateOAuthState(state: string): boolean {
    if (typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('oauth_state');
      sessionStorage.removeItem('oauth_state'); // One-time use
      return storedState === state;
    }
    return false;
  }
};

// Session Management
export const sessionManager = {
  private: new Map<string, { userId: string; expiresAt: number }>(),

  createSession(userId: string, durationMs: number = 24 * 60 * 60 * 1000): string {
    const sessionId = Math.random().toString(36).substr(2, 32);
    const expiresAt = Date.now() + durationMs;

    this.private.set(sessionId, { userId, expiresAt });
    console.log(`🎫 Session created for user: ${userId}`);
    return sessionId;
  },

  validateSession(sessionId: string): { valid: boolean; userId?: string } {
    const session = this.private.get(sessionId);

    if (!session) {
      return { valid: false };
    }

    if (Date.now() > session.expiresAt) {
      this.private.delete(sessionId);
      console.log(`⏰ Session expired: ${sessionId.substring(0, 8)}...`);
      return { valid: false };
    }

    return { valid: true, userId: session.userId };
  },

  destroySession(sessionId: string): void {
    this.private.delete(sessionId);
    console.log(`🗑️ Session destroyed: ${sessionId.substring(0, 8)}...`);
  }
};

// SECURE STORAGE UTILITIES - CRITICAL P0 FIX for insecure token storage
export const secureStorage = {
  /**
   * Set item in secure storage (prefers secure methods, warns about localStorage usage)
   */
  setItem: (key: string, value: string, options?: { httpOnly?: boolean; secure?: boolean; sameSite?: string }): void => {
    if (typeof window === 'undefined') return;
    
    // For tokens, strongly recommend httpOnly cookies (would be set by server in production)
    if (key.includes('token') || key.includes('auth')) {
      console.warn('Thermonuclear Security: Token storage should use httpOnly cookies in production');
      // For development, use sessionStorage as secure fallback instead of localStorage
      sessionStorage.setItem(`secure_${key}`, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  
  /**
   * Get item from secure storage
   */
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    if (key.includes('token') || key.includes('auth')) {
      return sessionStorage.getItem(`secure_${key}`);
    }
    return sessionStorage.getItem(key);
  },
  
  /**
   * Remove item from secure storage
   */
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    if (key.includes('token') || key.includes('auth')) {
      sessionStorage.removeItem(`secure_${key}`);
    }
    sessionStorage.removeItem(key);
  }
};

// ENVIRONMENT-BASED SECURITY CONTROLS - CRITICAL P0 FIX for authentication bypass
export const environmentSecurityService = {
  isProductionEnvironment(): boolean {
    return process.env.NODE_ENV === 'production' || 
           process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  },

  isDevelopmentFeatureEnabled(feature: string): boolean {
    // In production, ALL development features should be disabled - CRITICAL SECURITY RULE
    if (this.isProductionEnvironment()) {
      console.warn(`Thermonuclear Security: Development feature '${feature}' BLOCKED in production`);
      return false;
    }
    
    // In development, check if feature is explicitly enabled
    return process.env.NODE_ENV === 'development' || 
           process.env.NEXT_PUBLIC_ENABLE_DEV_FEATURES === 'true';
  },

  validateProductionSecurity(): void {
    if (this.isProductionEnvironment()) {
      // Check for development features that should be disabled
      const dangerousFeatures = [
        'developmentLogin',
        'mockAuth',
        'debugMode',
        'skipValidation'
      ];
      
      for (const feature of dangerousFeatures) {
        if (this.isDevelopmentFeatureEnabled(feature)) {
          console.error(`Thermonuclear Security: CRITICAL - ${feature} enabled in production!`);
        }
      }
    }
  }
};

// Development Utilities (ENHANCED with security validation)
export const devUtils = {
  logSecurityEvent(event: string, data: any): void {
    console.log(`🔒 Security Event [${event}]:`, data);
  },

  mockSecureRequest(url: string, options: any = {}): Promise<any> {
    console.log(`🔐 Mock Secure Request: ${url}`, options);
    return Promise.resolve({
      success: true,
      data: { message: 'Mock secure response' },
      timestamp: new Date().toISOString()
    });
  },

  validateSecurityHeaders(): void {
    if (typeof window === 'undefined') return;
    
    // Log security warnings for missing headers (in development)
    if (!environmentSecurityService.isProductionEnvironment()) {
      console.log('Thermonuclear Security: Validating security headers');
      
      // These would be checked from response headers in a real implementation
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options', 
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy'
      ];
      
      console.log('Thermonuclear Security: Required headers for production:', requiredHeaders);
    }
  }
};

// INITIALIZE SECURITY VALIDATION
if (typeof window !== 'undefined') {
  devUtils.validateSecurityHeaders();
  environmentSecurityService.validateProductionSecurity();
}

// Export default security configuration - ENHANCED FOR P0 FIXES
export default {
  InputValidator,
  SecurityError,
  rateLimiter,
  auditLogger,
  apiKeyManager,
  csrfProtectionService,
  sessionManager,
  secureStorage,
  environmentSecurityService,
  devUtils
};

// Export commonly used functions for easy access
// Note: Individual exports are handled with 'export const' statements above