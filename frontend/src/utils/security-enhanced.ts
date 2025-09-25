/**
 * Enhanced Security utilities for frontend validation and sanitization
 * Ref: CLAUDE.md - Fortune-50 grade security implementation
 */

// Content Security Policy utilities
export class CSPManager {
  private static nonce: string;

  static generateNonce(): string {
    if (!this.nonce) {
      this.nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return this.nonce;
  }

  static createSecureScript(content: string): HTMLScriptElement {
    const script = document.createElement('script');
    script.nonce = this.generateNonce();
    script.textContent = content;
    return script;
  }

  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
}

// Enhanced Input validation and sanitization
export class InputValidator {
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
  ];

  private static readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /('|(;|--|\/\*|\*\/))/g,
    /(\bOR\b.*\b=\b|\bAND\b.*\b=\b)/gi
  ];

  private static readonly SENSITIVE_PATTERNS = [
    /\b\d{4}\s*-?\s*\d{4}\s*-?\s*\d{4}\s*-?\s*\d{4}\b/g, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email (partial)
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, // IP addresses
    /\b[0-9a-f]{32}\b/gi, // MD5 hashes
    /\b[0-9a-f]{40}\b/gi, // SHA1 hashes
    /\b[0-9a-f]{64}\b/gi  // SHA256 hashes
  ];

  static sanitizeInput(input: string, options: {
    maxLength?: number;
    allowHTML?: boolean;
    removeXSS?: boolean;
    removeSQL?: boolean;
    removeSensitive?: boolean;
  } = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;
    const {
      maxLength = 1000,
      allowHTML = false,
      removeXSS = true,
      removeSQL = true,
      removeSensitive = false
    } = options;

    // Truncate to max length
    sanitized = sanitized.substring(0, maxLength);

    // Remove XSS patterns
    if (removeXSS) {
      this.XSS_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // Remove SQL injection patterns
    if (removeSQL) {
      this.SQL_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
    }

    // Remove sensitive data patterns
    if (removeSensitive) {
      this.SENSITIVE_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
    }

    // Remove HTML if not allowed
    if (!allowHTML) {
      sanitized = this.stripHTML(sanitized);
    }

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  static stripHTML(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Rate limiting for client-side actions
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  static reset(key: string): void {
    this.limits.delete(key);
  }
}

export default {
  CSPManager,
  InputValidator,
  RateLimiter
};