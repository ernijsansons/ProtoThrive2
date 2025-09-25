// Ref: CLAUDE.md - Enterprise Security Middleware
import { securityService, SecurityEvent } from '../services/securityService';

// Security middleware interfaces
export interface SecurityMiddlewareConfig {
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    customLimits: Map<string, number>;
  };
  inputValidation: {
    enabled: boolean;
    sanitizeHtml: boolean;
    preventSqlInjection: boolean;
    preventXss: boolean;
    maxPayloadSize: number;
  };
  auditLogging: {
    enabled: boolean;
    logSuccessfulRequests: boolean;
    logFailedRequests: boolean;
    logSensitiveData: boolean;
    excludeRoutes: string[];
  };
  cors: {
    enabled: boolean;
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  headers: {
    enabled: boolean;
    forceHttps: boolean;
    preventClickjacking: boolean;
    preventMimeSniffing: boolean;
    enableHsts: boolean;
  };
}

export interface RequestContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  body: any;
  headers: Record<string, string>;
  ip: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
}

export interface SecurityResult {
  allowed: boolean;
  statusCode: number;
  message: string;
  headers?: Record<string, string>;
  auditEvent?: Omit<SecurityEvent, 'id' | 'timestamp'>;
}

export interface ThrottleState {
  count: number;
  resetTime: number;
  blocked: boolean;
  lastRequest: number;
}

export class SecurityMiddleware {
  private config: SecurityMiddlewareConfig;
  private throttleMap: Map<string, ThrottleState>;
  private suspiciousIPs: Set<string>;
  private blockedIPs: Set<string>;

  constructor(config?: Partial<SecurityMiddlewareConfig>) {
    this.config = {
      rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false,
        customLimits: new Map([
          ['/api/auth/login', 5], // Stricter limit for auth endpoints
          ['/api/auth/register', 3],
          ['/api/auth/reset-password', 2],
          ['/api/admin', 10],
        ]),
        ...config?.rateLimiting,
      },
      inputValidation: {
        enabled: true,
        sanitizeHtml: true,
        preventSqlInjection: true,
        preventXss: true,
        maxPayloadSize: 10 * 1024 * 1024, // 10MB
        ...config?.inputValidation,
      },
      auditLogging: {
        enabled: true,
        logSuccessfulRequests: false,
        logFailedRequests: true,
        logSensitiveData: false,
        excludeRoutes: ['/api/health', '/api/metrics'],
        ...config?.auditLogging,
      },
      cors: {
        enabled: true,
        origin: process.env.NODE_ENV === 'production'
          ? ['https://protothrive.com', 'https://app.protothrive.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        optionsSuccessStatus: 200,
        ...config?.cors,
      },
      headers: {
        enabled: true,
        forceHttps: process.env.NODE_ENV === 'production',
        preventClickjacking: true,
        preventMimeSniffing: true,
        enableHsts: process.env.NODE_ENV === 'production',
        ...config?.headers,
      },
    };

    this.throttleMap = new Map();
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();

    console.log('🛡️ Security Middleware: Initialized with enterprise protection');
  }

  // Main middleware handler
  async handle(context: RequestContext): Promise<SecurityResult> {
    try {
      // 1. Check blocked IPs
      if (this.blockedIPs.has(context.ip)) {
        return this.createBlockedResult('IP address is blocked', context);
      }

      // 2. Rate limiting
      if (this.config.rateLimiting.enabled) {
        const rateLimitResult = await this.checkRateLimit(context);
        if (!rateLimitResult.allowed) {
          return rateLimitResult;
        }
      }

      // 3. Input validation and sanitization
      if (this.config.inputValidation.enabled) {
        const validationResult = await this.validateInput(context);
        if (!validationResult.allowed) {
          return validationResult;
        }
      }

      // 4. CORS validation
      if (this.config.cors.enabled) {
        const corsResult = this.validateCors(context);
        if (!corsResult.allowed) {
          return corsResult;
        }
      }

      // 5. Security headers
      const securityHeaders = this.config.headers.enabled
        ? this.getSecurityHeaders(context)
        : {};

      // 6. Audit logging for successful requests
      if (this.config.auditLogging.enabled && this.config.auditLogging.logSuccessfulRequests) {
        await this.logSecurityEvent(context, 'request_allowed', 'low');
      }

      return {
        allowed: true,
        statusCode: 200,
        message: 'Request allowed',
        headers: securityHeaders,
      };
    } catch (error) {
      console.error('Security Middleware Error:', error);

      await this.logSecurityEvent(context, 'middleware_error', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        allowed: false,
        statusCode: 500,
        message: 'Security middleware error',
      };
    }
  }

  // Rate limiting implementation
  private async checkRateLimit(context: RequestContext): Promise<SecurityResult> {
    const identifier = this.getRateLimitIdentifier(context);
    const limit = this.getRateLimitForRoute(context.path);
    const windowMs = this.config.rateLimiting.windowMs;
    const now = Date.now();

    let throttleState = this.throttleMap.get(identifier);

    if (!throttleState || now >= throttleState.resetTime) {
      // Reset or create new throttle state
      throttleState = {
        count: 1,
        resetTime: now + windowMs,
        blocked: false,
        lastRequest: now,
      };
      this.throttleMap.set(identifier, throttleState);
      return { allowed: true, statusCode: 200, message: 'Rate limit OK' };
    }

    // Check if blocked
    if (throttleState.blocked) {
      await this.logSecurityEvent(context, 'rate_limit_blocked', 'medium', {
        identifier,
        limit,
        blocked: true,
      });

      return {
        allowed: false,
        statusCode: 429,
        message: 'Rate limit exceeded - temporarily blocked',
        headers: {
          'Retry-After': Math.ceil((throttleState.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(throttleState.resetTime / 1000).toString(),
        },
      };
    }

    // Increment counter
    throttleState.count++;
    throttleState.lastRequest = now;

    if (throttleState.count > limit) {
      throttleState.blocked = true;

      // Add to suspicious IPs if repeatedly hitting limits
      if (throttleState.count > limit * 2) {
        this.suspiciousIPs.add(context.ip);
      }

      await this.logSecurityEvent(context, 'rate_limit_exceeded', 'medium', {
        identifier,
        limit,
        count: throttleState.count,
      });

      return {
        allowed: false,
        statusCode: 429,
        message: 'Rate limit exceeded',
        headers: {
          'Retry-After': Math.ceil((throttleState.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(throttleState.resetTime / 1000).toString(),
        },
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      message: 'Rate limit OK',
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': (limit - throttleState.count).toString(),
        'X-RateLimit-Reset': Math.ceil(throttleState.resetTime / 1000).toString(),
      },
    };
  }

  // Input validation and sanitization
  private async validateInput(context: RequestContext): Promise<SecurityResult> {
    const { body, query, headers } = context;

    // Check payload size
    if (body && JSON.stringify(body).length > this.config.inputValidation.maxPayloadSize) {
      await this.logSecurityEvent(context, 'payload_too_large', 'medium', {
        size: JSON.stringify(body).length,
        limit: this.config.inputValidation.maxPayloadSize,
      });

      return {
        allowed: false,
        statusCode: 413,
        message: 'Payload too large',
      };
    }

    // SQL injection detection
    if (this.config.inputValidation.preventSqlInjection) {
      const sqlInjectionResult = this.detectSqlInjection(body, query);
      if (sqlInjectionResult.detected) {
        await this.logSecurityEvent(context, 'sql_injection_attempt', 'high', {
          field: sqlInjectionResult.field,
          value: sqlInjectionResult.value,
        });

        return {
          allowed: false,
          statusCode: 400,
          message: 'Invalid input detected',
        };
      }
    }

    // XSS detection
    if (this.config.inputValidation.preventXss) {
      const xssResult = this.detectXss(body, query);
      if (xssResult.detected) {
        await this.logSecurityEvent(context, 'xss_attempt', 'high', {
          field: xssResult.field,
          value: xssResult.value,
        });

        return {
          allowed: false,
          statusCode: 400,
          message: 'Invalid input detected',
        };
      }
    }

    // Check for suspicious patterns
    const suspiciousResult = this.detectSuspiciousPatterns(context);
    if (suspiciousResult.detected) {
      await this.logSecurityEvent(context, 'suspicious_pattern', 'medium', {
        pattern: suspiciousResult.pattern,
        field: suspiciousResult.field,
      });

      // Don't block, but log for monitoring
    }

    return { allowed: true, statusCode: 200, message: 'Input validation passed' };
  }

  // CORS validation
  private validateCors(context: RequestContext): SecurityResult {
    const origin = context.headers.origin;

    if (!origin) {
      // Allow requests without origin (like Postman, curl)
      return { allowed: true, statusCode: 200, message: 'CORS OK' };
    }

    if (!this.config.cors.origin.includes(origin)) {
      return {
        allowed: false,
        statusCode: 403,
        message: 'CORS: Origin not allowed',
        auditEvent: {
          type: 'authorization',
          severity: 'medium',
          ipAddress: context.ip,
          userAgent: context.userAgent,
          description: `CORS violation: Origin ${origin} not allowed`,
          metadata: { origin, allowedOrigins: this.config.cors.origin },
          resolved: false,
        },
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      message: 'CORS OK',
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': this.config.cors.credentials.toString(),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    };
  }

  // Security headers
  private getSecurityHeaders(context: RequestContext): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.headers.forceHttps && !context.url.startsWith('https://')) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    if (this.config.headers.preventClickjacking) {
      headers['X-Frame-Options'] = 'DENY';
    }

    if (this.config.headers.preventMimeSniffing) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // Content Security Policy
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    // Additional security headers
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

    return headers;
  }

  // Helper methods
  private getRateLimitIdentifier(context: RequestContext): string {
    // Use user ID if available, otherwise fall back to IP
    return context.userId || context.ip;
  }

  private getRateLimitForRoute(path: string): number {
    // Check for exact matches first
    if (this.config.rateLimiting.customLimits.has(path)) {
      return this.config.rateLimiting.customLimits.get(path)!;
    }

    // Check for pattern matches
    for (const [pattern, limit] of this.config.rateLimiting.customLimits.entries()) {
      if (path.startsWith(pattern)) {
        return limit;
      }
    }

    return this.config.rateLimiting.maxRequests;
  }

  private detectSqlInjection(body: any, query: any): { detected: boolean; field?: string; value?: string } {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"].*['"])/i,
      /(--|\*\/|\/\*)/,
      /(\bINFORMATION_SCHEMA\b)/i,
      /(\bSYSCOLUMNS\b)/i,
    ];

    const checkValue = (value: any, field: string): { detected: boolean; field?: string; value?: string } => {
      if (typeof value === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            return { detected: true, field, value };
          }
        }
      }
      return { detected: false };
    };

    // Check query parameters
    for (const [key, value] of Object.entries(query || {})) {
      const result = checkValue(value, `query.${key}`);
      if (result.detected) return result;
    }

    // Check body recursively
    const checkObject = (obj: any, prefix = 'body'): { detected: boolean; field?: string; value?: string } => {
      if (typeof obj === 'string') {
        return checkValue(obj, prefix);
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const result = checkObject(obj[i], `${prefix}[${i}]`);
          if (result.detected) return result;
        }
      } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const result = checkObject(value, `${prefix}.${key}`);
          if (result.detected) return result;
        }
      }
      return { detected: false };
    };

    return checkObject(body);
  }

  private detectXss(body: any, query: any): { detected: boolean; field?: string; value?: string } {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi,
      /<link[^>]*href[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    const checkValue = (value: any, field: string): { detected: boolean; field?: string; value?: string } => {
      if (typeof value === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(value)) {
            return { detected: true, field, value };
          }
        }
      }
      return { detected: false };
    };

    // Check query parameters
    for (const [key, value] of Object.entries(query || {})) {
      const result = checkValue(value, `query.${key}`);
      if (result.detected) return result;
    }

    // Check body recursively (similar to SQL injection check)
    const checkObject = (obj: any, prefix = 'body'): { detected: boolean; field?: string; value?: string } => {
      if (typeof obj === 'string') {
        return checkValue(obj, prefix);
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const result = checkObject(obj[i], `${prefix}[${i}]`);
          if (result.detected) return result;
        }
      } else if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const result = checkObject(value, `${prefix}.${key}`);
          if (result.detected) return result;
        }
      }
      return { detected: false };
    };

    return checkObject(body);
  }

  private detectSuspiciousPatterns(context: RequestContext): { detected: boolean; pattern?: string; field?: string } {
    const suspiciousPatterns = [
      { name: 'path_traversal', pattern: /\.\.[\/\\]/g },
      { name: 'command_injection', pattern: /[;&|`$(){}]/g },
      { name: 'suspicious_extensions', pattern: /\.(exe|bat|cmd|sh|ps1|vbs)$/i },
      { name: 'base64_encoded', pattern: /^[A-Za-z0-9+\/]+=*$/ },
      { name: 'hex_encoded', pattern: /^[0-9a-fA-F]+$/ },
    ];

    // Check URL path
    for (const { name, pattern } of suspiciousPatterns) {
      if (pattern.test(context.path)) {
        return { detected: true, pattern: name, field: 'path' };
      }
    }

    // Check user agent for suspicious patterns
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nmap/i,
      /nikto/i,
      /burp/i,
      /acunetix/i,
      /nessus/i,
      /metasploit/i,
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(context.userAgent)) {
        return { detected: true, pattern: 'suspicious_user_agent', field: 'userAgent' };
      }
    }

    return { detected: false };
  }

  private createBlockedResult(message: string, context: RequestContext): SecurityResult {
    return {
      allowed: false,
      statusCode: 403,
      message,
      auditEvent: {
        type: 'authorization',
        severity: 'high',
        ipAddress: context.ip,
        userAgent: context.userAgent,
        userId: context.userId,
        userEmail: context.userEmail,
        description: `Blocked request: ${message}`,
        metadata: { path: context.path, method: context.method },
        resolved: false,
      },
    };
  }

  private async logSecurityEvent(
    context: RequestContext,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this.config.auditLogging.enabled) return;
    if (this.config.auditLogging.excludeRoutes.includes(context.path)) return;

    await securityService.logSecurityEvent({
      type: eventType as any,
      severity,
      userId: context.userId,
      userEmail: context.userEmail,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      description: `${eventType.replace('_', ' ')} for ${context.method} ${context.path}`,
      metadata: {
        ...metadata,
        method: context.method,
        path: context.path,
        query: this.config.auditLogging.logSensitiveData ? context.query : '[redacted]',
        sessionId: context.sessionId,
      },
      resolved: false,
    });
  }

  // Public management methods
  public blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    console.log(`🚫 IP ${ip} blocked: ${reason}`);
  }

  public unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    console.log(`✅ IP ${ip} unblocked`);
  }

  public getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  public getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousIPs);
  }

  public clearThrottleMap(): void {
    this.throttleMap.clear();
    console.log('🧹 Rate limit cache cleared');
  }

  public getThrottleStats(): Map<string, ThrottleState> {
    return new Map(this.throttleMap);
  }

  public updateConfig(newConfig: Partial<SecurityMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Security middleware configuration updated');
  }
}

// Global middleware instance
export const securityMiddleware = new SecurityMiddleware();

// Convenience functions for common operations
export const security = {
  // Main handler
  handle: (context: RequestContext) => securityMiddleware.handle(context),

  // Rate limiting
  checkRate: (ip: string, path: string) => securityMiddleware.handle({
    method: 'GET',
    url: `https://example.com${path}`,
    path,
    query: {},
    body: null,
    headers: {},
    ip,
    userAgent: 'Security Check',
    timestamp: Date.now(),
  }),

  // IP management
  blockIP: (ip: string, reason: string) => securityMiddleware.blockIP(ip, reason),
  unblockIP: (ip: string) => securityMiddleware.unblockIP(ip),
  getBlockedIPs: () => securityMiddleware.getBlockedIPs(),
  getSuspiciousIPs: () => securityMiddleware.getSuspiciousIPs(),

  // Cache management
  clearCache: () => securityMiddleware.clearThrottleMap(),
  getStats: () => securityMiddleware.getThrottleStats(),

  // Configuration
  updateConfig: (config: Partial<SecurityMiddlewareConfig>) => securityMiddleware.updateConfig(config),
};

console.log('🛡️ Security Middleware: Enterprise protection layer initialized');