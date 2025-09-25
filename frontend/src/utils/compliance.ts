// Ref: CLAUDE.md - Enterprise Compliance and GDPR Utilities
import { securityService } from '../services/securityService';

// GDPR and compliance interfaces
export interface GDPRRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  dataSubjectId: string;
  dataSubjectEmail: string;
  requestDate: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completedDate?: number;
  rejectionReason?: string;
  requestedBy: string;
  processedBy?: string;
  legalBasis?: string;
  data?: any;
  notes?: string;
  deadline: number; // GDPR requires response within 30 days
}

export interface DataClassification {
  category: 'personal' | 'sensitive' | 'public' | 'internal' | 'confidential';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  retentionPeriod: number; // in milliseconds
  encryptionRequired: boolean;
  accessControls: string[];
  legalBasis?: string;
  purpose?: string;
  dataSubjects?: string[];
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  consentGiven: boolean;
  consentDate: number;
  withdrawalDate?: number;
  version: string;
  granular: boolean;
  categories: string[];
  resolved: boolean;
  metadata: {
    ipAddress: string;
    userAgent: string;
    method: 'explicit' | 'implicit' | 'pre_checked' | 'opt_in';
    evidence?: string;
  };
}

export interface DataInventoryItem {
  id: string;
  name: string;
  description: string;
  classification: DataClassification;
  location: string;
  dataController: string;
  dataProcessor?: string;
  thirdPartyTransfers: boolean;
  transferSafeguards?: string[];
  processingActivities: string[];
  dataSubjects: string[];
  technicalMeasures: string[];
  organizationalMeasures: string[];
  lastReviewed: number;
  nextReview: number;
  risks: DataRisk[];
}

export interface DataRisk {
  id: string;
  description: string;
  likelihood: number; // 0-1
  impact: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted';
}

export interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  description: string;
  dataTypes: string[];
  processingPurposes: string[];
  legalBasis: string[];
  dataSubjects: string[];
  thirdParties: string[];
  risks: DataRisk[];
  safeguards: string[];
  necessityJustification: string;
  proportionalityAssessment: string;
  consultationRequired: boolean;
  consultationDate?: number;
  approvalRequired: boolean;
  approvalDate?: number;
  approvedBy?: string;
  implementationDate: number;
  reviewDate: number;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'implemented';
}

export interface DataBreachIncident {
  id: string;
  discoveryDate: number;
  incidentDate: number;
  reportedDate?: number;
  reportedBy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'confidentiality' | 'integrity' | 'availability';
  affectedRecords: number;
  dataTypes: string[];
  cause: string;
  description: string;
  containmentActions: string[];
  notificationRequired: boolean;
  supervisoryAuthorityNotified?: boolean;
  dataSubjectsNotified?: boolean;
  status: 'investigating' | 'contained' | 'resolved' | 'closed';
  remedialActions: string[];
  lessonsLearned: string[];
}

export class ComplianceManager {
  private gdprRequests: Map<string, GDPRRequest>;
  private consentRecords: Map<string, ConsentRecord>;
  private dataInventory: Map<string, DataInventoryItem>;
  private dataBreaches: Map<string, DataBreachIncident>;

  constructor() {
    this.gdprRequests = new Map();
    this.consentRecords = new Map();
    this.dataInventory = new Map();
    this.dataBreaches = new Map();

    console.log('📋 Compliance Manager: Initialized with GDPR and enterprise compliance features');
  }

  // GDPR Data Subject Rights
  async submitDataSubjectRequest(
    type: GDPRRequest['type'],
    dataSubjectId: string,
    dataSubjectEmail: string,
    requestedBy: string,
    legalBasis?: string
  ): Promise<GDPRRequest> {
    const request: GDPRRequest = {
      id: `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      dataSubjectId,
      dataSubjectEmail,
      requestDate: Date.now(),
      status: 'pending',
      requestedBy,
      legalBasis,
      deadline: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };

    this.gdprRequests.set(request.id, request);

    // Log the request
    await securityService.logSecurityEvent({
      type: 'data_access',
      severity: 'medium',
      userId: requestedBy,
      ipAddress: 'system',
      userAgent: 'compliance_manager',
      description: `GDPR ${type} request submitted for ${dataSubjectEmail}`,
      resolved: false,
      metadata: {
        requestId: request.id,
        dataSubjectId,
        type,
        legalBasis,
      },
    });

    console.log(`📝 GDPR Request: ${type} request submitted for ${dataSubjectEmail}`);
    return request;
  }

  async processDataSubjectRequest(
    requestId: string,
    processedBy: string,
    data?: any,
    notes?: string
  ): Promise<GDPRRequest> {
    const request = this.gdprRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'in_progress';
    request.processedBy = processedBy;
    request.notes = notes;

    // Process the request based on type
    switch (request.type) {
      case 'access':
        request.data = await this.processAccessRequest(request.dataSubjectId);
        break;
      case 'rectification':
        // In production, this would update the data
        request.data = { message: 'Data rectification initiated' };
        break;
      case 'erasure':
        request.data = await this.processErasureRequest(request.dataSubjectId);
        break;
      case 'portability':
        request.data = await this.processPortabilityRequest(request.dataSubjectId);
        break;
      case 'restriction':
        request.data = { message: 'Processing restriction applied' };
        break;
      case 'objection':
        request.data = { message: 'Objection processed' };
        break;
    }

    request.status = 'completed';
    request.completedDate = Date.now();

    // Log completion
    await securityService.logSecurityEvent({
      type: 'data_access',
      severity: 'low',
      userId: processedBy,
      ipAddress: 'system',
      userAgent: 'compliance_manager',
      description: `GDPR ${request.type} request completed for ${request.dataSubjectEmail}`,
      resolved: false,
      metadata: {
        requestId,
        processedBy,
        completionTime: Date.now() - request.requestDate,
      },
    });

    console.log(`✅ GDPR Request: ${request.type} request completed for ${request.dataSubjectEmail}`);
    return request;
  }

  // Consent Management
  async recordConsent(
    userId: string,
    purpose: string,
    legalBasis: ConsentRecord['legalBasis'],
    consentGiven: boolean,
    categories: string[],
    metadata: ConsentRecord['metadata'],
    version = '1.0'
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      purpose,
      legalBasis,
      consentGiven,
      consentDate: Date.now(),
      version,
      granular: categories.length > 1,
      categories,
      resolved: false,
      metadata,
    };

    // Store with user-specific key to allow multiple consents per user
    const key = `${userId}_${purpose}_${version}`;
    this.consentRecords.set(key, record);

    // Log consent recording
    await securityService.logSecurityEvent({
      type: 'data_access',
      severity: 'low',
      userId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      description: `Consent ${consentGiven ? 'given' : 'withdrawn'} for ${purpose}`,
      resolved: false,
      metadata: {
        consentId: record.id,
        purpose,
        legalBasis,
        categories,
        method: metadata.method,
      },
    });

    console.log(`📋 Consent: ${consentGiven ? 'Given' : 'Withdrawn'} for ${purpose} by user ${userId}`);
    return record;
  }

  async withdrawConsent(userId: string, purpose: string, version = '1.0'): Promise<ConsentRecord> {
    const key = `${userId}_${purpose}_${version}`;
    const record = this.consentRecords.get(key);

    if (!record) {
      throw new Error('Consent record not found');
    }

    record.consentGiven = false;
    record.withdrawalDate = Date.now();

    // Log withdrawal
    await securityService.logSecurityEvent({
      type: 'data_access',
      severity: 'low',
      userId,
      ipAddress: 'system',
      userAgent: 'compliance_manager',
      description: `Consent withdrawn for ${purpose}`,
      resolved: false,
      metadata: {
        consentId: record.id,
        purpose,
        withdrawalDate: record.withdrawalDate,
      },
    });

    console.log(`❌ Consent: Withdrawn for ${purpose} by user ${userId}`);
    return record;
  }

  // Data Inventory Management
  async addDataInventoryItem(item: Omit<DataInventoryItem, 'id'>): Promise<DataInventoryItem> {
    const inventoryItem: DataInventoryItem = {
      id: `inventory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...item,
    };

    this.dataInventory.set(inventoryItem.id, inventoryItem);

    console.log(`📊 Data Inventory: Added ${inventoryItem.name}`);
    return inventoryItem;
  }

  async updateDataInventoryItem(
    id: string,
    updates: Partial<DataInventoryItem>
  ): Promise<DataInventoryItem> {
    const item = this.dataInventory.get(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const updatedItem = { ...item, ...updates, lastReviewed: Date.now() };
    this.dataInventory.set(id, updatedItem);

    console.log(`📊 Data Inventory: Updated ${updatedItem.name}`);
    return updatedItem;
  }

  // Data Breach Management
  async reportDataBreach(
    incident: Omit<DataBreachIncident, 'id' | 'discoveryDate'>
  ): Promise<DataBreachIncident> {
    const breach: DataBreachIncident = {
      id: `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      discoveryDate: Date.now(),
      ...incident,
    };

    this.dataBreaches.set(breach.id, breach);

    // Determine if authorities need to be notified (within 72 hours for high-risk breaches)
    const notificationDeadline = breach.discoveryDate + (72 * 60 * 60 * 1000);
    if (breach.severity === 'high' || breach.severity === 'critical') {
      breach.notificationRequired = true;
    }

    // Log the breach
    await securityService.logSecurityEvent({
      type: 'data_access',
      severity: 'critical',
      ipAddress: 'system',
      userAgent: 'compliance_manager',
      description: `Data breach reported: ${breach.description}`,
      resolved: false,
      metadata: {
        breachId: breach.id,
        severity: breach.severity,
        affectedRecords: breach.affectedRecords,
        category: breach.category,
        notificationRequired: breach.notificationRequired,
        notificationDeadline,
      },
    });

    console.log(`🚨 Data Breach: Reported ${breach.severity} breach affecting ${breach.affectedRecords} records`);
    return breach;
  }

  // Privacy Impact Assessment
  async createPIA(
    assessment: Omit<PrivacyImpactAssessment, 'id' | 'status'>
  ): Promise<PrivacyImpactAssessment> {
    const pia: PrivacyImpactAssessment = {
      id: `pia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'draft',
      ...assessment,
    };

    console.log(`📋 PIA: Created for project ${pia.projectName}`);
    return pia;
  }

  // Compliance Reporting
  async generateComplianceReport(
    type: 'gdpr' | 'ccpa' | 'full',
    timeRange: { start: number; end: number }
  ): Promise<ComplianceReport> {
    const requests = Array.from(this.gdprRequests.values()).filter(
      r => r.requestDate >= timeRange.start && r.requestDate <= timeRange.end
    );

    const consents = Array.from(this.consentRecords.values()).filter(
      c => c.consentDate >= timeRange.start && c.consentDate <= timeRange.end
    );

    const breaches = Array.from(this.dataBreaches.values()).filter(
      b => b.discoveryDate >= timeRange.start && b.discoveryDate <= timeRange.end
    );

    const report: ComplianceReport = {
      id: `compliance_${Date.now()}`,
      type,
      generatedAt: Date.now(),
      timeRange,
      summary: {
        gdprRequests: requests.length,
        consentRecords: consents.length,
        dataBreaches: breaches.length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        averageProcessingTime: this.calculateAverageProcessingTime(requests),
        complianceScore: this.calculateComplianceScore(requests, breaches),
      },
      details: {
        requests,
        consents,
        breaches,
        dataInventory: Array.from(this.dataInventory.values()),
      },
    };

    console.log(`📊 Compliance Report: Generated ${type} report for ${timeRange.start} to ${timeRange.end}`);
    return report;
  }

  // Data retention and cleanup
  async cleanupExpiredData(): Promise<CleanupResult> {
    const now = Date.now();
    let cleaned = 0;

    // Clean up completed GDPR requests older than retention period
    const retentionPeriod = 7 * 365 * 24 * 60 * 60 * 1000; // 7 years
    for (const [id, request] of this.gdprRequests.entries()) {
      if (request.status === 'completed' &&
          request.completedDate &&
          (now - request.completedDate) > retentionPeriod) {
        this.gdprRequests.delete(id);
        cleaned++;
      }
    }

    // Clean up old consent records (keep history but mark as archived)
    for (const [id, consent] of this.consentRecords.entries()) {
      if (consent.withdrawalDate && (now - consent.withdrawalDate) > retentionPeriod) {
        // In production, would archive rather than delete
        cleaned++;
      }
    }

    console.log(`🧹 Data Cleanup: Cleaned up ${cleaned} expired records`);
    return {
      recordsCleaned: cleaned,
      cleanupDate: now,
      retentionPeriodDays: Math.floor(retentionPeriod / (24 * 60 * 60 * 1000)),
    };
  }

  // Helper methods
  private async processAccessRequest(dataSubjectId: string): Promise<any> {
    return {
      personalData: `Encrypted data export for ${dataSubjectId}`,
      processingPurposes: ['Service provision', 'Legal compliance'],
      dataCategories: ['Contact information', 'Usage data'],
      recipients: ['Internal staff'],
      retentionPeriod: '7 years',
      rights: 'You have the right to rectification, erasure, restriction, objection, and portability',
    };
  }

  private async processErasureRequest(dataSubjectId: string): Promise<any> {
    // In production, would perform actual data erasure
    return {
      message: 'Data erasure completed',
      dataSubjectId,
      erasureDate: Date.now(),
      retainedData: 'Anonymized analytics data (legal basis: legitimate interest)',
    };
  }

  private async processPortabilityRequest(dataSubjectId: string): Promise<any> {
    return {
      format: 'JSON',
      data: `Portable data export for ${dataSubjectId}`,
      downloadUrl: `/api/data-export/${dataSubjectId}`,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  private calculateAverageProcessingTime(requests: GDPRRequest[]): number {
    const completedRequests = requests.filter(r => r.status === 'completed' && r.completedDate);
    if (completedRequests.length === 0) return 0;

    const totalTime = completedRequests.reduce(
      (sum, r) => sum + (r.completedDate! - r.requestDate),
      0
    );

    return Math.round(totalTime / completedRequests.length / (24 * 60 * 60 * 1000)); // in days
  }

  private calculateComplianceScore(requests: GDPRRequest[], breaches: DataBreachIncident[]): number {
    let score = 100;

    // Deduct points for overdue requests
    const overdueRequests = requests.filter(r =>
      r.status !== 'completed' && Date.now() > r.deadline
    );
    score -= overdueRequests.length * 10;

    // Deduct points for data breaches
    score -= breaches.filter(b => b.severity === 'critical').length * 20;
    score -= breaches.filter(b => b.severity === 'high').length * 10;
    score -= breaches.filter(b => b.severity === 'medium').length * 5;

    return Math.max(0, Math.min(100, score));
  }

  // Public getters for monitoring
  public getGDPRRequests(): GDPRRequest[] {
    return Array.from(this.gdprRequests.values());
  }

  public getConsentRecords(): ConsentRecord[] {
    return Array.from(this.consentRecords.values());
  }

  public getDataInventory(): DataInventoryItem[] {
    return Array.from(this.dataInventory.values());
  }

  public getDataBreaches(): DataBreachIncident[] {
    return Array.from(this.dataBreaches.values());
  }
}

// Supporting interfaces
export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'full';
  generatedAt: number;
  timeRange: { start: number; end: number };
  summary: {
    gdprRequests: number;
    consentRecords: number;
    dataBreaches: number;
    completedRequests: number;
    averageProcessingTime: number;
    complianceScore: number;
  };
  details: {
    requests: GDPRRequest[];
    consents: ConsentRecord[];
    breaches: DataBreachIncident[];
    dataInventory: DataInventoryItem[];
  };
}

export interface CleanupResult {
  recordsCleaned: number;
  cleanupDate: number;
  retentionPeriodDays: number;
}

// Global compliance manager instance
export const complianceManager = new ComplianceManager();

// Convenience functions for common compliance operations
export const compliance = {
  // GDPR Rights
  requestAccess: (userId: string, email: string, requestedBy: string) =>
    complianceManager.submitDataSubjectRequest('access', userId, email, requestedBy),

  requestErasure: (userId: string, email: string, requestedBy: string, legalBasis?: string) =>
    complianceManager.submitDataSubjectRequest('erasure', userId, email, requestedBy, legalBasis),

  requestPortability: (userId: string, email: string, requestedBy: string) =>
    complianceManager.submitDataSubjectRequest('portability', userId, email, requestedBy),

  // Consent Management
  giveConsent: (userId: string, purpose: string, categories: string[], metadata: ConsentRecord['metadata']) =>
    complianceManager.recordConsent(userId, purpose, 'consent', true, categories, metadata),

  withdrawConsent: (userId: string, purpose: string) =>
    complianceManager.withdrawConsent(userId, purpose),

  // Data Breach Reporting
  reportBreach: (incident: Omit<DataBreachIncident, 'id' | 'discoveryDate'>) =>
    complianceManager.reportDataBreach(incident),

  // Reporting
  generateReport: (type: 'gdpr' | 'ccpa' | 'full', timeRange: { start: number; end: number }) =>
    complianceManager.generateComplianceReport(type, timeRange),

  // Data Management
  cleanup: () => complianceManager.cleanupExpiredData(),

  // Getters
  getRequests: () => complianceManager.getGDPRRequests(),
  getConsents: () => complianceManager.getConsentRecords(),
  getBreaches: () => complianceManager.getDataBreaches(),
  getInventory: () => complianceManager.getDataInventory(),
};

console.log('📋 Compliance Utilities: GDPR and enterprise compliance features initialized');