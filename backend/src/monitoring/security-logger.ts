// Ref: CLAUDE.md - Comprehensive Security Event Logging and Monitoring
// Enterprise-grade security monitoring with attack pattern detection

import { ValidationError } from '../validation/hardened-validation';

// Security event types
export enum SecurityEventType {
  VALIDATION_FAILURE = 'validation_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  MALICIOUS_INPUT = 'malicious_input',
  SUSPICIOUS_QUERY = 'suspicious_query',
  AUTHENTICATION_FAILURE = 'auth_failure',
  AUTHORIZATION_FAILURE = 'authz_failure',
  IP_BLOCKED = 'ip_blocked',
  GRAPHQL_ABUSE = 'graphql_abuse',
  SIZE_LIMIT_EXCEEDED = 'size_limit_exceeded',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt'
}

// Security event severity levels
export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Security event interface
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  source: {
    ip: string;
    userAgent: string;
    userId?: string;
    endpoint: string;
    method: string;
  };
  details: {
    message: string;
    errorCode?: string;
    validationErrors?: Array<{
      field: string;
      message: string;
      type: string;
    }>;
    suspiciousPatterns?: string[];
    requestSize?: number;
    queryComplexity?: number;
    metadata?: Record<string, any>;
  };
  actions: {
    blocked: boolean;
    rateLimited: boolean;
    alertSent: boolean;
    escalated: boolean;
  };
}

// Attack pattern detection
class AttackPatternDetector {
  private patterns = new Map<string, {
    count: number;
    firstSeen: number;
    lastSeen: number;
    severity: SecurityEventSeverity;
  }>();

  detectSQLInjection(input: string): string[] {
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /create\s+table/i,
      /alter\s+table/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
      /sp_executesql/i,
      /xp_cmdshell/i,
      /;\s*--/,
      /'\s*or\s+'1'\s*=\s*'1/i,
      /'\s*or\s+1\s*=\s*1/i,
      /'\s*union\s+select\s+null/i,
      /'\s*;\s*drop\s+table/i
    ];

    return sqlPatterns
      .filter(pattern => pattern.test(input))
      .map(pattern => pattern.toString());
  }

  detectXSS(input: string): string[] {
    const xssPatterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /<iframe[\s>]/i,
      /<object[\s>]/i,
      /<embed[\s>]/i,
      /<applet[\s>]/i,
      /<meta[\s>]/i,
      /<link[\s>]/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /document\.write/i,
      /document\.cookie/i,
      /window\.location/i,
      /eval\s*\(/i,
      /innerHTML/i,
      /outerHTML/i
    ];

    return xssPatterns
      .filter(pattern => pattern.test(input))
      .map(pattern => pattern.toString());
  }

  detectCommandInjection(input: string): string[] {
    const cmdPatterns = [
      /\$\(/,
      /`[^`]*`/,
      /\|\s*sh/,
      /\|\s*bash/i,
      /\|\s*cmd/i,
      /\|\s*powershell/i,
      /&&\s*(rm|del|format)/i,
      /;\s*(rm|del|format)/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /spawn\s*\(/i,
      /child_process/i,
      /os\.system/i,
      /subprocess/i
    ];

    return cmdPatterns
      .filter(pattern => pattern.test(input))
      .map(pattern => pattern.toString());
  }

  detectPathTraversal(input: string): string[] {
    const pathPatterns = [
      /\.\.\//,
      /\.\.\\\\]/,
      /\.\.\%2f/i,
      /\.\.\%5c/i,
      /\%2e\%2e\%2f/i,
      /\%2e\%2e\%5c/i,
      /\/etc\/passwd/i,
      /\/etc\/shadow/i,
      /\/windows\/system32/i,
      /\.\.\/\.\.\/\.\./,
      /\\\\\\\\etc\\\\passwd/i
    ];

    return pathPatterns
      .filter(pattern => pattern.test(input))
      .map(pattern => pattern.toString());
  }

  detectAllPatterns(input: string): {
    sqlInjection: string[];
    xss: string[];
    commandInjection: string[];
    pathTraversal: string[];
  } {
    return {
      sqlInjection: this.detectSQLInjection(input),
      xss: this.detectXSS(input),
      commandInjection: this.detectCommandInjection(input),
      pathTraversal: this.detectPathTraversal(input)
    };
  }

  updatePattern(patternType: string, severity: SecurityEventSeverity): void {
    const now = Date.now();
    const pattern = this.patterns.get(patternType);

    if (pattern) {
      pattern.count++;
      pattern.lastSeen = now;
      pattern.severity = severity;
    } else {
      this.patterns.set(patternType, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
        severity
      });
    }
  }

  getPatternStats(): Map<string, any> {
    return this.patterns;
  }
}

// Security metrics collector
class SecurityMetrics {
  private metrics = {
    validationFailures: 0,
    rateLimitHits: 0,
    maliciousInputs: 0,
    blockedIPs: 0,
    graphqlAbuse: 0,
    authFailures: 0,
    suspiciousQueries: 0,
    totalSecurityEvents: 0,
    lastReset: Date.now()
  };

  increment(metric: keyof typeof this.metrics): void {
    if (typeof this.metrics[metric] === 'number') {
      (this.metrics[metric] as number)++;
      this.metrics.totalSecurityEvents++;
    }
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  reset(): void {
    Object.keys(this.metrics).forEach(key => {
      if (key !== 'lastReset' && typeof this.metrics[key as keyof typeof this.metrics] === 'number') {
        (this.metrics as any)[key] = 0;
      }
    });
    this.metrics.lastReset = Date.now();
  }

  getSummary(): {
    totalEvents: number;
    topThreats: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const { totalSecurityEvents, maliciousInputs, rateLimitHits, authFailures } = this.metrics;

    const threats = [];
    if (maliciousInputs > 10) threats.push('High malicious input activity');
    if (rateLimitHits > 50) threats.push('Rate limiting under pressure');
    if (authFailures > 20) threats.push('Authentication attacks detected');

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (totalSecurityEvents > 100) riskLevel = 'critical';
    else if (totalSecurityEvents > 50) riskLevel = 'high';
    else if (totalSecurityEvents > 20) riskLevel = 'medium';

    return {
      totalEvents: totalSecurityEvents,
      topThreats: threats,
      riskLevel
    };
  }
}

// Main security logger class
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events
  private patternDetector = new AttackPatternDetector();
  private metrics = new SecurityMetrics();
  private alertThresholds = {
    rateLimitPerMinute: 50,
    maliciousInputsPerMinute: 10,
    validationFailuresPerMinute: 100,
    authFailuresPerMinute: 20
  };

  private constructor() {
    // Auto-cleanup every hour
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  // Log validation failure with pattern detection
  logValidationFailure(
    ip: string,
    userAgent: string,
    userId: string | undefined,
    endpoint: string,
    method: string,
    error: ValidationError,
    additionalData?: Record<string, any>
  ): void {
    // Detect attack patterns in validation errors
    const suspiciousPatterns: string[] = [];
    error.details.forEach(detail => {
      if (detail.message.includes('dangerous') || detail.message.includes('malicious')) {
        const patterns = this.patternDetector.detectAllPatterns(JSON.stringify(additionalData));
        Object.values(patterns).forEach(patternArray => {
          suspiciousPatterns.push(...patternArray);
        });
      }
    });

    const severity = this.calculateSeverity(error, suspiciousPatterns.length > 0);

    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: suspiciousPatterns.length > 0 ? SecurityEventType.MALICIOUS_INPUT : SecurityEventType.VALIDATION_FAILURE,
      severity,
      source: { ip, userAgent, userId, endpoint, method },
      details: {
        message: error.message,
        errorCode: error.code,
        validationErrors: error.details,
        suspiciousPatterns,
        metadata: additionalData
      },
      actions: {
        blocked: false,
        rateLimited: error.statusCode === 429,
        alertSent: false,
        escalated: severity === SecurityEventSeverity.CRITICAL
      }
    };

    this.addEvent(event);
    this.metrics.increment(suspiciousPatterns.length > 0 ? 'maliciousInputs' : 'validationFailures');
  }

  // Log GraphQL abuse
  logGraphQLAbuse(
    ip: string,
    userAgent: string,
    userId: string | undefined,
    query: string,
    reason: string,
    complexity?: number
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: SecurityEventType.GRAPHQL_ABUSE,
      severity: SecurityEventSeverity.HIGH,
      source: { ip, userAgent, userId, endpoint: '/graphql', method: 'POST' },
      details: {
        message: `GraphQL abuse detected: ${reason}`,
        queryComplexity: complexity,
        metadata: { query: query.substring(0, 1000), reason } // Truncate long queries
      },
      actions: {
        blocked: false,
        rateLimited: false,
        alertSent: true,
        escalated: complexity && complexity > 1000
      }
    };

    this.addEvent(event);
    this.metrics.increment('graphqlAbuse');
  }

  // Log rate limit exceeded
  logRateLimitExceeded(
    ip: string,
    userAgent: string,
    userId: string | undefined,
    endpoint: string,
    method: string
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.MEDIUM,
      source: { ip, userAgent, userId, endpoint, method },
      details: {
        message: 'Rate limit exceeded',
        metadata: { threshold: 'validation_rate_limit' }
      },
      actions: {
        blocked: false,
        rateLimited: true,
        alertSent: false,
        escalated: false
      }
    };

    this.addEvent(event);
    this.metrics.increment('rateLimitHits');
  }

  // Log authentication failure
  logAuthFailure(
    ip: string,
    userAgent: string,
    endpoint: string,
    reason: string,
    attemptedUserId?: string
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: SecurityEventType.AUTHENTICATION_FAILURE,
      severity: SecurityEventSeverity.MEDIUM,
      source: { ip, userAgent, endpoint, method: 'POST' },
      details: {
        message: `Authentication failed: ${reason}`,
        metadata: { attemptedUserId, reason }
      },
      actions: {
        blocked: false,
        rateLimited: false,
        alertSent: false,
        escalated: false
      }
    };

    this.addEvent(event);
    this.metrics.increment('authFailures');
  }

  // Log IP blocking event
  logIPBlocked(ip: string, reason: string, triggerCount: number): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: SecurityEventType.IP_BLOCKED,
      severity: SecurityEventSeverity.HIGH,
      source: { ip, userAgent: 'system', endpoint: 'system', method: 'BLOCK' },
      details: {
        message: `IP blocked due to ${reason}`,
        metadata: { reason, triggerCount, autoBlocked: true }
      },
      actions: {
        blocked: true,
        rateLimited: false,
        alertSent: true,
        escalated: true
      }
    };

    this.addEvent(event);
    this.metrics.increment('blockedIPs');
  }

  // Get security events with filtering
  getEvents(filter?: {
    type?: SecurityEventType;
    severity?: SecurityEventSeverity;
    ip?: string;
    timeRange?: { start: string; end: string };
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        filteredEvents = filteredEvents.filter(e => e.severity === filter.severity);
      }
      if (filter.ip) {
        filteredEvents = filteredEvents.filter(e => e.source.ip === filter.ip);
      }
      if (filter.timeRange) {
        const start = new Date(filter.timeRange.start).getTime();
        const end = new Date(filter.timeRange.end).getTime();
        filteredEvents = filteredEvents.filter(e => {
          const eventTime = new Date(e.timestamp).getTime();
          return eventTime >= start && eventTime <= end;
        });
      }
    }

    const limit = filter?.limit || 100;
    return filteredEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get security metrics
  getMetrics(): any {
    return {
      ...this.metrics.getMetrics(),
      patternStats: Object.fromEntries(this.patternDetector.getPatternStats()),
      summary: this.metrics.getSummary()
    };
  }

  // Generate security report
  generateSecurityReport(timeRange: { start: string; end: string }): {
    summary: any;
    topIPs: Array<{ ip: string; eventCount: number; severity: string }>;
    topEndpoints: Array<{ endpoint: string; eventCount: number }>;
    attackPatterns: any;
    recommendations: string[];
  } {
    const events = this.getEvents({ timeRange });

    // Top IPs by event count
    const ipCounts = new Map<string, { count: number; maxSeverity: SecurityEventSeverity }>();
    events.forEach(event => {
      const current = ipCounts.get(event.source.ip) || { count: 0, maxSeverity: SecurityEventSeverity.LOW };
      current.count++;
      if (this.severityToNumber(event.severity) > this.severityToNumber(current.maxSeverity)) {
        current.maxSeverity = event.severity;
      }
      ipCounts.set(event.source.ip, current);
    });

    const topIPs = Array.from(ipCounts.entries())
      .map(([ip, data]) => ({ ip, eventCount: data.count, severity: data.maxSeverity }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    events.forEach(event => {
      endpointCounts.set(event.source.endpoint, (endpointCounts.get(event.source.endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, eventCount]) => ({ endpoint, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Recommendations based on patterns
    const recommendations = this.generateRecommendations(events);

    return {
      summary: this.metrics.getSummary(),
      topIPs,
      topEndpoints,
      attackPatterns: Object.fromEntries(this.patternDetector.getPatternStats()),
      recommendations
    };
  }

  // Private helper methods
  private addEvent(event: SecurityEvent): void {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check for alerts
    this.checkAlertThresholds(event);
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSeverity(error: ValidationError, hasSuspiciousPatterns: boolean): SecurityEventSeverity {
    if (error.statusCode === 429) return SecurityEventSeverity.HIGH;
    if (hasSuspiciousPatterns) return SecurityEventSeverity.HIGH;
    if (error.details.length > 10) return SecurityEventSeverity.MEDIUM;
    if (error.details.some(d => d.message.includes('dangerous'))) return SecurityEventSeverity.HIGH;
    if (error.details.length > 3) return SecurityEventSeverity.MEDIUM;
    return SecurityEventSeverity.LOW;
  }

  private severityToNumber(severity: SecurityEventSeverity): number {
    switch (severity) {
      case SecurityEventSeverity.LOW: return 1;
      case SecurityEventSeverity.MEDIUM: return 2;
      case SecurityEventSeverity.HIGH: return 3;
      case SecurityEventSeverity.CRITICAL: return 4;
      default: return 0;
    }
  }

  private checkAlertThresholds(event: SecurityEvent): void {
    const recentEvents = this.getEvents({
      timeRange: {
        start: new Date(Date.now() - 60000).toISOString(), // Last minute
        end: new Date().toISOString()
      }
    });

    // Check various alert conditions
    const rateLimitEvents = recentEvents.filter(e => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED).length;
    const maliciousEvents = recentEvents.filter(e => e.type === SecurityEventType.MALICIOUS_INPUT).length;
    const validationEvents = recentEvents.filter(e => e.type === SecurityEventType.VALIDATION_FAILURE).length;
    const authEvents = recentEvents.filter(e => e.type === SecurityEventType.AUTHENTICATION_FAILURE).length;

    if (rateLimitEvents >= this.alertThresholds.rateLimitPerMinute) {
      console.error('SECURITY ALERT: High rate limit activity', { count: rateLimitEvents });
    }
    if (maliciousEvents >= this.alertThresholds.maliciousInputsPerMinute) {
      console.error('SECURITY ALERT: High malicious input activity', { count: maliciousEvents });
    }
    if (validationEvents >= this.alertThresholds.validationFailuresPerMinute) {
      console.warn('SECURITY ALERT: High validation failure rate', { count: validationEvents });
    }
    if (authEvents >= this.alertThresholds.authFailuresPerMinute) {
      console.error('SECURITY ALERT: Possible brute force attack', { count: authEvents });
    }
  }

  private generateRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics.getSummary();

    if (metrics.riskLevel === 'high' || metrics.riskLevel === 'critical') {
      recommendations.push('Consider implementing additional rate limiting');
      recommendations.push('Review and strengthen input validation rules');
    }

    const maliciousEvents = events.filter(e => e.type === SecurityEventType.MALICIOUS_INPUT);
    if (maliciousEvents.length > 10) {
      recommendations.push('Enable WAF or additional input filtering');
      recommendations.push('Consider IP-based blocking for repeat offenders');
    }

    const graphqlEvents = events.filter(e => e.type === SecurityEventType.GRAPHQL_ABUSE);
    if (graphqlEvents.length > 5) {
      recommendations.push('Implement stricter GraphQL query complexity limits');
      recommendations.push('Consider disabling GraphQL introspection in production');
    }

    return recommendations;
  }

  private cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.events = this.events.filter(event => new Date(event.timestamp).getTime() > oneHourAgo);
    console.log(`Security logger cleanup: ${this.events.length} events retained`);
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();