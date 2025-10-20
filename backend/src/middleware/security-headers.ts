/**
 * Security Headers Middleware - OWASP Compliant
 *
 * @description Addresses critical security vulnerabilities:
 * - Clickjacking protection (X-Frame-Options)
 * - SSL stripping prevention (HSTS)
 * - XSS protection
 * - MIME sniffing prevention
 * - Content Security Policy
 *
 * @compliance OWASP Top 10, WCAG 2.1, SOC 2
 * @version 1.0.0
 * @author ProtoThrive Engineering Team
 */

import { Context, Next } from 'hono';

export interface SecurityHeadersConfig {
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  hstsMaxAge?: number;
  hstsIncludeSubdomains?: boolean;
  hstsPreload?: boolean;
  cspDirectives?: Record<string, string>;
}

/**
 * Creates security headers middleware with configurable options
 *
 * @param config Security headers configuration
 * @returns Middleware function for Hono
 *
 * @example
 * ```typescript
 * app.use('*', createSecurityHeadersMiddleware({
 *   frameOptions: 'DENY',
 *   hstsMaxAge: 31536000,
 *   hstsIncludeSubdomains: true,
 *   hstsPreload: true,
 * }));
 * ```
 */
export const createSecurityHeadersMiddleware = (config: SecurityHeadersConfig = {}) => {
  const {
    frameOptions = 'DENY',
    hstsMaxAge = 31536000, // 1 year in seconds
    hstsIncludeSubdomains = true,
    hstsPreload = true,
  } = config;

  return async (c: Context, next: Next) => {
    // Call next first to allow request processing
    await next();

    // ========================================
    // Clickjacking Protection
    // ========================================
    // Prevents the application from being embedded in iframes
    // Mitigates: Clickjacking attacks, UI redressing
    // Reference: OWASP ASVS 4.0.3 V13.1.1
    c.header('X-Frame-Options', frameOptions);

    // ========================================
    // Force HTTPS (HSTS)
    // ========================================
    // Instructs browsers to only access the site over HTTPS
    // Prevents: SSL stripping attacks, man-in-the-middle attacks
    // Reference: OWASP ASVS 4.0.3 V9.1.1
    const hstsValue = [
      `max-age=${hstsMaxAge}`,
      hstsIncludeSubdomains ? 'includeSubDomains' : '',
      hstsPreload ? 'preload' : '',
    ]
      .filter(Boolean)
      .join('; ');
    c.header('Strict-Transport-Security', hstsValue);

    // ========================================
    // Prevent MIME Type Sniffing
    // ========================================
    // Prevents browsers from MIME-sniffing responses
    // Mitigates: XSS attacks via polyglot files
    // Reference: OWASP ASVS 4.0.3 V14.4.3
    c.header('X-Content-Type-Options', 'nosniff');

    // ========================================
    // XSS Protection (Legacy Browsers)
    // ========================================
    // Enables XSS filtering in legacy browsers
    // Note: Modern browsers use CSP instead
    // Reference: OWASP ASVS 4.0.3 V14.4.1
    c.header('X-XSS-Protection', '1; mode=block');

    // ========================================
    // Content Security Policy
    // ========================================
    // Controls which resources can be loaded and executed
    // Mitigates: XSS, data injection, clickjacking
    // Reference: OWASP ASVS 4.0.3 V14.4.5
    const cspDirectives = config.cspDirectives || {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https:",
      'font-src': "'self' data:",
      'connect-src': "'self' https://protothrive-backend.ernijs-ansons.workers.dev",
      'frame-ancestors': "'none'",
    };

    const cspValue = Object.entries(cspDirectives)
      .map(([directive, value]) => `${directive} ${value}`)
      .join('; ');
    c.header('Content-Security-Policy', cspValue);

    // ========================================
    // Referrer Policy
    // ========================================
    // Controls how much referrer information is shared
    // Prevents: Information leakage via referrer header
    // Reference: OWASP ASVS 4.0.3 V14.5.3
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // ========================================
    // Permissions Policy
    // ========================================
    // Controls which browser features can be used
    // Prevents: Unauthorized access to sensitive browser APIs
    // Reference: OWASP ASVS 4.0.3 V14.5.4
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // ========================================
    // Remove Server Information
    // ========================================
    // Prevents information disclosure about server technology
    // Note: Hono doesn't set X-Powered-By by default, but ensure it's not set
    c.res.headers.delete('X-Powered-By');
  };
};

/**
 * Default security headers middleware with recommended settings
 * Ready to use without configuration
 *
 * @example
 * ```typescript
 * import { defaultSecurityHeaders } from './middleware/security-headers';
 * app.use('*', defaultSecurityHeaders);
 * ```
 */
export const defaultSecurityHeaders = createSecurityHeadersMiddleware({
  frameOptions: 'DENY',
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubdomains: true,
  hstsPreload: true,
});
