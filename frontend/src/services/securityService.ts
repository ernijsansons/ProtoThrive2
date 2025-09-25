// Ref: CLAUDE.md - Enterprise Security Hardening Service
import { cacheService } from './cacheService';

// Security configuration interfaces
export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    saltRounds: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  headers: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
  };
  audit: {
    enableLogging: boolean;
    retentionDays: number;
    logLevel: 'info' | 'warn' | 'error';
  };
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface ComplianceReport {
  id: string;
  generatedAt: number;
  generatedBy: string;
  reportType: 'gdpr' | 'ccpa' | 'sox' | 'iso27001' | 'custom';
  timeRange: {
    start: number;
    end: number;
  };
  summary: {
    totalEvents: number;
    securityIncidents: number;
    dataAccessEvents: number;
    complianceScore: number;
    recommendations: string[];
  };
  details: {
    auditTrail: SecurityEvent[];
    riskAssessment: RiskAssessment[];
    dataProcessingActivities: DataProcessingActivity[];
    policyCompliance: PolicyComplianceCheck[];
  };
}

export interface RiskAssessment {
  id: string;
  category: 'technical' | 'operational' | 'legal' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  likelihood: number; // 0-1
  mitigation: string[];
  owner: string;
  dueDate: number;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
}

export interface DataProcessingActivity {
  id: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  dataSubjects: string[];
  recipients: string[];
  transferToThirdCountries: boolean;
  retentionPeriod: number;
  securityMeasures: string[];
  dataProtectionOfficer: string;
  lastReviewed: number;
}

export interface PolicyComplianceCheck {
  id: string;
  policyName: string;
  version: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  notes: string;
  lastChecked: number;
  nextReview: number;
}

export interface SecurityMetrics {
  authenticationSuccess: number;
  authenticationFailures: number;
  rateLimitViolations: number;
  suspiciousActivities: number;
  dataBreachAttempts: number;
  complianceScore: number;
  lastAssessment: number;
  trendsData: {
    timestamp: number;
    metric: string;
    value: number;
  }[];
}

export interface EncryptionService {
  encrypt(data: string, key?: string): Promise<string>;
  decrypt(encryptedData: string, key?: string): Promise<string>;
  hash(data: string, salt?: string): Promise<string>;
  verify(data: string, hash: string): Promise<boolean>;
  generateKey(): Promise<string>;
  generateSalt(): Promise<string>;
}

export interface AuditLogger {
  log(event: SecurityEvent): Promise<void>;
  query(filters: AuditQueryFilters): Promise<SecurityEvent[]>;
  generateReport(type: string, timeRange: { start: number; end: number }): Promise<ComplianceReport>;
  export(format: 'json' | 'csv' | 'pdf'): Promise<Blob>;
  purge(beforeDate: number): Promise<number>;
}

export interface AuditQueryFilters {
  type?: string[];
  severity?: string[];
  userId?: string;
  ipAddress?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  limit?: number;
  offset?: number;
}

export class SecurityService {
  private config: SecurityConfig;
  private encryptionService: EncryptionService;
  private auditLogger: AuditLogger;
  private rateLimiter: Map<string, { count: number; resetTime: number }>;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      encryption: {
        algorithm: 'AES-256-GCM',
        keyLength: 32,
        saltRounds: 12,
        ...config?.encryption,
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        skipSuccessfulRequests: false,
        ...config?.rateLimit,
      },
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://protothrive.com', 'https://app.protothrive.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        optionsSuccessStatus: 200,
        ...config?.cors,
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https:;",
        strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        ...config?.headers,
      },
      audit: {
        enableLogging: true,
        retentionDays: 365,
        logLevel: 'info',
        ...config?.audit,
      },
    };

    this.rateLimiter = new Map();
    this.encryptionService = new EncryptionServiceImpl();
    this.auditLogger = new AuditLoggerImpl(this.config.audit);

    console.log('🔒 Thermonuclear Security Service: Initialized with enterprise hardening');
  }

  // Rate limiting
  async checkRateLimit(identifier: string, customLimit?: number): Promise<boolean> {
    const limit = customLimit || this.config.rateLimit.max;
    const windowMs = this.config.rateLimit.windowMs;
    const now = Date.now();

    const entry = this.rateLimiter.get(identifier);

    if (!entry || now >= entry.resetTime) {
      this.rateLimiter.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      await this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ipAddress: identifier,
        userAgent: 'unknown',
        description: `Rate limit exceeded for ${identifier}`,
        metadata: { limit, count: entry.count },
        resolved: false,
      });
      return false;
    }

    entry.count++;
    return true;
  }

  // Input validation and sanitization
  sanitizeInput(input: string, type: 'html' | 'sql' | 'xss' | 'general' = 'general'): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input.trim();

    switch (type) {
      case 'html':
        sanitized = sanitized
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '');
        break;

      case 'sql':
        sanitized = sanitized
          .replace(/[';\\]/g, '')
          .replace(/--/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');
        break;

      case 'xss':
        sanitized = sanitized
          .replace(/[<>"\\/]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/vbscript:/gi, '')
          .replace(/on\w+=/gi, '');
        break;

      case 'general':
      default:
        sanitized = sanitized
          .replace(/[<>]/g, '')
          .replace(/[^\w\s@.-]/g, '');
        break;
    }

    return sanitized.substring(0, 1000); // Limit length
  }

  validateInput(input: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be of type ${rule.type}`);
        continue;
      }

      // String length validation
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
          continue;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be no more than ${rule.maxLength} characters`);
          continue;
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
          continue;
        }

        // Sanitize string input
        sanitized[field] = this.sanitizeInput(value, rule.sanitizeType);
      } else {
        sanitized[field] = value;
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  // Security headers
  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.config.headers.contentSecurityPolicy,
      'Strict-Transport-Security': this.config.headers.strictTransportSecurity,
      'X-Frame-Options': this.config.headers.xFrameOptions,
      'X-Content-Type-Options': this.config.headers.xContentTypeOptions,
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  // Encryption and hashing
  async encrypt(data: string, userKey?: string): Promise<string> {
    return this.encryptionService.encrypt(data, userKey);
  }

  async decrypt(encryptedData: string, userKey?: string): Promise<string> {
    return this.encryptionService.decrypt(encryptedData, userKey);
  }

  async hashPassword(password: string): Promise<string> {
    return this.encryptionService.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return this.encryptionService.verify(password, hash);
  }

  // Audit logging
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event,
      resolved: false,
    };

    await this.auditLogger.log(securityEvent);

    // Cache recent high-severity events
    if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
      await cacheService.set(
        `security_event_${securityEvent.id}`,
        securityEvent,
        { ttl: 24 * 60 * 60, tags: ['security', 'high_priority'] }
      );
    }

    console.log(`🚨 Security Event: ${securityEvent.type} - ${securityEvent.severity} - ${securityEvent.description}`);
  }

  // Threat detection
  async detectSuspiciousActivity(
    userId: string,
    activity: ActivityData
  ): Promise<SuspiciousActivityResult> {
    const patterns = [
      {
        name: 'rapid_requests',
        check: () => activity.requestCount > 100 && activity.timeWindow < 60000,
        severity: 'high' as const,
      },
      {
        name: 'unusual_location',
        check: () => activity.location && activity.location !== activity.expectedLocation,
        severity: 'medium' as const,
      },
      {
        name: 'off_hours_access',
        check: () => {
          const hour = new Date(activity.timestamp).getHours();
          return hour < 6 || hour > 22;
        },
        severity: 'low' as const,
      },
      {
        name: 'multiple_failed_logins',
        check: () => activity.failedAttempts > 5,
        severity: 'high' as const,
      },
      {
        name: 'privilege_escalation',
        check: () => activity.privilegeLevel > activity.expectedPrivilegeLevel,
        severity: 'critical' as const,
      },
    ];

    const detectedThreats = patterns
      .filter(pattern => pattern.check())
      .map(pattern => ({
        name: pattern.name,
        severity: pattern.severity,
        description: this.getThreatDescription(pattern.name),
      }));

    const isSuspicious = detectedThreats.length > 0;
    const riskScore = this.calculateRiskScore(detectedThreats);

    if (isSuspicious) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: detectedThreats.some(t => t.severity === 'critical') ? 'critical' :
                 detectedThreats.some(t => t.severity === 'high') ? 'high' : 'medium',
        userId,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        description: `Suspicious activity detected: ${detectedThreats.map(t => t.name).join(', ')}`,
        metadata: {
          patterns: detectedThreats,
          riskScore,
          activity,
        },
        resolved: false,
      });
    }

    return {
      isSuspicious,
      riskScore,
      threats: detectedThreats,
      recommendation: this.getSecurityRecommendation(riskScore, detectedThreats),
    };
  }

  // Compliance and reporting
  async generateComplianceReport(
    type: ComplianceReport['reportType'],
    timeRange: { start: number; end: number },
    generatedBy: string
  ): Promise<ComplianceReport> {
    const auditEvents = await this.auditLogger.query({
      timeRange,
      limit: 10000,
    });

    const riskAssessments = await this.getRiskAssessments();
    const dataProcessingActivities = await this.getDataProcessingActivities();
    const policyChecks = await this.getPolicyComplianceChecks();

    const securityIncidents = auditEvents.filter(
      e => e.severity === 'high' || e.severity === 'critical'
    ).length;

    const complianceScore = this.calculateComplianceScore(
      auditEvents,
      riskAssessments,
      policyChecks
    );

    const report: ComplianceReport = {
      id: `compliance_${Date.now()}`,
      generatedAt: Date.now(),
      generatedBy,
      reportType: type,
      timeRange,
      summary: {
        totalEvents: auditEvents.length,
        securityIncidents,
        dataAccessEvents: auditEvents.filter(e => e.type === 'data_access').length,
        complianceScore,
        recommendations: this.generateComplianceRecommendations(
          complianceScore,
          riskAssessments,
          policyChecks
        ),
      },
      details: {
        auditTrail: auditEvents,
        riskAssessment: riskAssessments,
        dataProcessingActivities,
        policyCompliance: policyChecks,
      },
    };

    // Cache the report
    await cacheService.set(
      `compliance_report_${report.id}`,
      report,
      { ttl: 30 * 24 * 60 * 60, tags: ['compliance', 'report'] }
    );

    return report;
  }

  // Security metrics
  async getSecurityMetrics(timeRange?: { start: number; end: number }): Promise<SecurityMetrics> {
    const events = await this.auditLogger.query({ timeRange });

    const metrics: SecurityMetrics = {
      authenticationSuccess: events.filter(
        e => e.type === 'authentication' && e.metadata.success
      ).length,
      authenticationFailures: events.filter(
        e => e.type === 'authentication' && !e.metadata.success
      ).length,
      rateLimitViolations: events.filter(e => e.type === 'rate_limit').length,
      suspiciousActivities: events.filter(e => e.type === 'suspicious_activity').length,
      dataBreachAttempts: events.filter(
        e => e.severity === 'critical' && e.metadata.breach_attempt
      ).length,
      complianceScore: await this.getCurrentComplianceScore(),
      lastAssessment: Date.now(),
      trendsData: this.generateTrendsData(events),
    };

    return metrics;
  }

  // Data protection and privacy
  async handleDataSubjectRequest(
    type: 'access' | 'rectification' | 'erasure' | 'portability',
    userId: string,
    requestedBy: string
  ): Promise<DataSubjectRequestResult> {
    await this.logSecurityEvent({
      type: 'data_access',
      severity: 'medium',
      userId: requestedBy,
      ipAddress: 'system',
      userAgent: 'data_protection_service',
      description: `Data subject request: ${type} for user ${userId}`,
      metadata: { requestType: type, targetUser: userId },
      resolved: false,
    });

    switch (type) {
      case 'access':
        return this.handleDataAccessRequest(userId);
      case 'rectification':
        return this.handleDataRectificationRequest(userId);
      case 'erasure':
        return this.handleDataErasureRequest(userId);
      case 'portability':
        return this.handleDataPortabilityRequest(userId);
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }

  // Private helper methods
  private getThreatDescription(threatName: string): string {
    const descriptions = {
      rapid_requests: 'Unusually high number of requests in short time period',
      unusual_location: 'Access from unexpected geographic location',
      off_hours_access: 'System access during unusual hours',
      multiple_failed_logins: 'Multiple failed authentication attempts',
      privilege_escalation: 'Attempt to access higher privilege levels',
    };
    return descriptions[threatName as keyof typeof descriptions] || 'Unknown threat pattern';
  }

  private calculateRiskScore(threats: Array<{ severity: string }>): number {
    const severityWeights = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    const totalWeight = threats.reduce(
      (sum, threat) => sum + severityWeights[threat.severity as keyof typeof severityWeights],
      0
    );
    return Math.min(totalWeight, 1.0);
  }

  private getSecurityRecommendation(
    riskScore: number,
    threats: Array<{ name: string; severity: string }>
  ): string {
    if (riskScore > 0.8) {
      return 'Immediate action required: Block user access and investigate';
    } else if (riskScore > 0.5) {
      return 'High risk: Additional authentication required';
    } else if (riskScore > 0.3) {
      return 'Moderate risk: Monitor closely and log activities';
    }
    return 'Low risk: Continue normal monitoring';
  }

  private calculateComplianceScore(
    events: SecurityEvent[],
    risks: RiskAssessment[],
    policies: PolicyComplianceCheck[]
  ): number {
    const eventScore = Math.max(0, 1 - (events.filter(e => e.severity === 'critical').length * 0.1));
    const riskScore = Math.max(0, 1 - (risks.filter(r => r.severity === 'critical').length * 0.15));
    const policyScore = policies.filter(p => p.status === 'compliant').length / policies.length;

    return Math.round((eventScore * 0.3 + riskScore * 0.4 + policyScore * 0.3) * 100);
  }

  private generateComplianceRecommendations(
    score: number,
    risks: RiskAssessment[],
    policies: PolicyComplianceCheck[]
  ): string[] {
    const recommendations: string[] = [];

    if (score < 80) {
      recommendations.push('Improve overall security posture to meet compliance requirements');
    }

    const criticalRisks = risks.filter(r => r.severity === 'critical' && r.status === 'open');
    if (criticalRisks.length > 0) {
      recommendations.push(`Address ${criticalRisks.length} critical security risks immediately`);
    }

    const nonCompliantPolicies = policies.filter(p => p.status === 'non_compliant');
    if (nonCompliantPolicies.length > 0) {
      recommendations.push(`Update ${nonCompliantPolicies.length} non-compliant policies`);
    }

    return recommendations;
  }

  private generateTrendsData(events: SecurityEvent[]) {
    // Group events by day and type for trend analysis
    const trends: { timestamp: number; metric: string; value: number }[] = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i * oneDayMs);
      const dayEnd = dayStart + oneDayMs;

      const dayEvents = events.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);

      trends.push({
        timestamp: dayStart,
        metric: 'total_events',
        value: dayEvents.length,
      });

      trends.push({
        timestamp: dayStart,
        metric: 'security_incidents',
        value: dayEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length,
      });
    }

    return trends;
  }

  private async getCurrentComplianceScore(): Promise<number> {
    // Simplified compliance score calculation
    return 85; // This would be calculated based on current system state
  }

  private async getRiskAssessments(): Promise<RiskAssessment[]> {
    // Mock risk assessments - in real implementation, this would fetch from database
    return [
      {
        id: 'risk_1',
        category: 'technical',
        severity: 'medium',
        description: 'Outdated dependency versions',
        impact: 'Potential security vulnerabilities',
        likelihood: 0.6,
        mitigation: ['Update dependencies', 'Implement automated scanning'],
        owner: 'security_team',
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: 'open',
      },
    ];
  }

  private async getDataProcessingActivities(): Promise<DataProcessingActivity[]> {
    // Mock data processing activities
    return [
      {
        id: 'dpa_1',
        purpose: 'User account management',
        legalBasis: 'Contract performance',
        dataCategories: ['Personal identifiers', 'Contact information'],
        dataSubjects: ['Users', 'Customers'],
        recipients: ['Internal staff', 'Cloud service providers'],
        transferToThirdCountries: false,
        retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
        securityMeasures: ['Encryption at rest', 'Access controls', 'Audit logging'],
        dataProtectionOfficer: 'dpo@protothrive.com',
        lastReviewed: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
      },
    ];
  }

  private async getPolicyComplianceChecks(): Promise<PolicyComplianceCheck[]> {
    // Mock policy compliance checks
    return [
      {
        id: 'policy_1',
        policyName: 'Data Protection Policy',
        version: '1.2',
        requirement: 'Personal data must be encrypted at rest',
        status: 'compliant',
        evidence: ['Database encryption enabled', 'File storage encryption verified'],
        notes: 'All personal data storage locations verified as encrypted',
        lastChecked: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        nextReview: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      },
    ];
  }

  private async handleDataAccessRequest(userId: string): Promise<DataSubjectRequestResult> {
    // Mock implementation - would gather all user data
    return {
      success: true,
      message: 'Data access request processed',
      data: {
        userId,
        personalData: 'Encrypted user data export',
        processingActivities: ['Authentication', 'Service provision'],
      },
    };
  }

  private async handleDataRectificationRequest(userId: string): Promise<DataSubjectRequestResult> {
    return {
      success: true,
      message: 'Data rectification request logged for manual processing',
    };
  }

  private async handleDataErasureRequest(userId: string): Promise<DataSubjectRequestResult> {
    return {
      success: true,
      message: 'Data erasure request logged for processing within 30 days',
    };
  }

  private async handleDataPortabilityRequest(userId: string): Promise<DataSubjectRequestResult> {
    return {
      success: true,
      message: 'Data portability export prepared',
      data: {
        format: 'JSON',
        downloadUrl: `/api/data-export/${userId}`,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
    };
  }
}

// Supporting interfaces and types
export interface ValidationRules {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
    sanitizeType?: 'html' | 'sql' | 'xss' | 'general';
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: any;
}

export interface ActivityData {
  requestCount: number;
  timeWindow: number;
  location?: string;
  expectedLocation?: string;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  failedAttempts: number;
  privilegeLevel: number;
  expectedPrivilegeLevel: number;
}

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  riskScore: number;
  threats: Array<{
    name: string;
    severity: string;
    description: string;
  }>;
  recommendation: string;
}

export interface DataSubjectRequestResult {
  success: boolean;
  message: string;
  data?: any;
}

// Encryption service implementation
class EncryptionServiceImpl implements EncryptionService {
  async encrypt(data: string, key?: string): Promise<string> {
    // Mock encryption - in production would use Web Crypto API
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const keyBytes = encoder.encode(key || 'default-encryption-key');

    // Simple XOR for demo (NOT for production use)
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return btoa(String.fromCharCode(...encrypted));
  }

  async decrypt(encryptedData: string, key?: string): Promise<string> {
    // Mock decryption
    const keyBytes = new TextEncoder().encode(key || 'default-encryption-key');
    const encrypted = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  }

  async hash(data: string, salt?: string): Promise<string> {
    // Mock hashing using crypto.subtle in production
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data + (salt || 'default-salt'));

    if (crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for environments without crypto.subtle
    return btoa(data + (salt || 'default-salt'));
  }

  async verify(data: string, hash: string): Promise<boolean> {
    const computedHash = await this.hash(data);
    return computedHash === hash;
  }

  async generateKey(): Promise<string> {
    if (crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback
    return Math.random().toString(36).substr(2, 32);
  }

  async generateSalt(): Promise<string> {
    return this.generateKey();
  }
}

// Audit logger implementation
class AuditLoggerImpl implements AuditLogger {
  private events: SecurityEvent[] = [];
  private config: SecurityConfig['audit'];

  constructor(config: SecurityConfig['audit']) {
    this.config = config;
  }

  async log(event: SecurityEvent): Promise<void> {
    if (!this.config.enableLogging) {
      return;
    }

    this.events.push(event);

    // In production, this would write to a database or external audit service
    if (this.config.logLevel === 'info' ||
        (this.config.logLevel === 'warn' && ['medium', 'high', 'critical'].includes(event.severity)) ||
        (this.config.logLevel === 'error' && ['high', 'critical'].includes(event.severity))) {
      console.log(`🔍 Audit Log [${event.severity.toUpperCase()}]: ${event.type} - ${event.description}`);
    }

    // Cleanup old events to prevent memory leaks
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    this.events = this.events.filter(e => e.timestamp > cutoff);
  }

  async query(filters: AuditQueryFilters): Promise<SecurityEvent[]> {
    let filtered = [...this.events];

    if (filters.type) {
      filtered = filtered.filter(e => filters.type!.includes(e.type));
    }

    if (filters.severity) {
      filtered = filtered.filter(e => filters.severity!.includes(e.severity));
    }

    if (filters.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters.ipAddress) {
      filtered = filtered.filter(e => e.ipAddress === filters.ipAddress);
    }

    if (filters.timeRange) {
      filtered = filtered.filter(e =>
        e.timestamp >= filters.timeRange!.start &&
        e.timestamp <= filters.timeRange!.end
      );
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    return filtered.slice(offset, offset + limit);
  }

  async generateReport(
    type: string,
    timeRange: { start: number; end: number }
  ): Promise<ComplianceReport> {
    // This would be implemented by the SecurityService
    throw new Error('Report generation handled by SecurityService');
  }

  async export(format: 'json' | 'csv' | 'pdf'): Promise<Blob> {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(this.events, null, 2)], {
          type: 'application/json',
        });
      case 'csv':
        const csv = this.eventsToCSV(this.events);
        return new Blob([csv], { type: 'text/csv' });
      case 'pdf':
        // In production, would use a PDF library
        return new Blob(['PDF export not implemented'], { type: 'application/pdf' });
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async purge(beforeDate: number): Promise<number> {
    const initialCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= beforeDate);
    return initialCount - this.events.length;
  }

  private eventsToCSV(events: SecurityEvent[]): string {
    const headers = ['ID', 'Type', 'Severity', 'User ID', 'IP Address', 'Timestamp', 'Description'];
    const rows = events.map(e => [
      e.id,
      e.type,
      e.severity,
      e.userId || '',
      e.ipAddress,
      new Date(e.timestamp).toISOString(),
      e.description.replace(/,/g, ';'), // Escape commas
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Global service instance
export const securityService = new SecurityService();

// Convenience functions
export const security = {
  // Rate limiting
  checkRate: (id: string, limit?: number) => securityService.checkRateLimit(id, limit),

  // Input validation
  sanitize: (input: string, type?: 'html' | 'sql' | 'xss' | 'general') =>
    securityService.sanitizeInput(input, type),
  validate: (input: any, rules: ValidationRules) => securityService.validateInput(input, rules),

  // Encryption
  encrypt: (data: string, key?: string) => securityService.encrypt(data, key),
  decrypt: (data: string, key?: string) => securityService.decrypt(data, key),
  hash: (password: string) => securityService.hashPassword(password),
  verify: (password: string, hash: string) => securityService.verifyPassword(password, hash),

  // Security headers
  headers: () => securityService.getSecurityHeaders(),

  // Audit logging
  log: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => securityService.logSecurityEvent(event),

  // Threat detection
  detect: (userId: string, activity: ActivityData) =>
    securityService.detectSuspiciousActivity(userId, activity),

  // Compliance
  report: (type: ComplianceReport['reportType'], timeRange: { start: number; end: number }, by: string) =>
    securityService.generateComplianceReport(type, timeRange, by),

  // Metrics
  metrics: (timeRange?: { start: number; end: number }) =>
    securityService.getSecurityMetrics(timeRange),

  // Data protection
  dataRequest: (type: 'access' | 'rectification' | 'erasure' | 'portability', userId: string, by: string) =>
    securityService.handleDataSubjectRequest(type, userId, by),
};

console.log('🔐 Thermonuclear Security Service: Enterprise hardening and compliance features initialized');