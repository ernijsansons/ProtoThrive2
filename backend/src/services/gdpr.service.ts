/**
 * GDPR Compliance Service
 * Implements EU General Data Protection Regulation requirements
 *
 * Features:
 * - Right to Access (Data Export)
 * - Right to be Forgotten (Data Deletion/Anonymization)
 * - Right to Rectification (Data Updates)
 * - Right to Data Portability (Machine-readable format)
 * - Consent Management
 * - Data Processing Records
 */

interface DataExportRequest {
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
}

interface UserDataExport {
  personalInformation: {
    email: string;
    name: string;
    createdAt: Date;
    lastLogin: Date;
  };
  roadmaps: any[];
  snippets: any[];
  sessions: any[];
  auditLogs: any[];
  consents: any[];
  metadata: {
    exportedAt: Date;
    dataVersion: string;
    format: 'json';
  };
}

interface AnonymizationResult {
  success: boolean;
  recordsAnonymized: number;
  retentionApplied: boolean;
}

export class GDPRService {
  private readonly EXPORT_EXPIRY_DAYS = 30;
  private readonly ANONYMIZATION_RETENTION_DAYS = 90;
  private readonly MAX_EXPORT_SIZE_MB = 100;

  /**
   * Handle GDPR data export request (Right to Access)
   * Article 15 - Right of access by the data subject
   */
  async requestDataExport(userId: string): Promise<DataExportRequest> {
    try {
      // Check for existing pending requests
      const existingRequest = await this.getExistingExportRequest(userId);
      if (existingRequest && existingRequest.status === 'pending') {
        return existingRequest;
      }

      // Create new export request
      const request: DataExportRequest = {
        userId,
        requestedAt: new Date(),
        status: 'pending',
      };

      // Store request in database
      await this.storeExportRequest(request);

      // Queue background job for data compilation
      await this.queueDataExportJob(userId);

      // Log GDPR activity
      await this.logGDPRActivity(userId, 'data_export_requested', {
        requestId: this.generateRequestId(userId),
      });

      return request;
    } catch (error: any) {
      console.error('Data export request error:', error);
      throw new Error('Failed to create data export request');
    }
  }

  /**
   * Compile and export all user data
   * Runs as background job to handle large datasets
   */
  async compileUserData(userId: string): Promise<UserDataExport> {
    try {
      // Gather all user data from various sources
      const [
        personalInfo,
        roadmaps,
        snippets,
        sessions,
        auditLogs,
        consents,
      ] = await Promise.all([
        this.getUserPersonalInfo(userId),
        this.getUserRoadmaps(userId),
        this.getUserSnippets(userId),
        this.getUserSessions(userId),
        this.getUserAuditLogs(userId),
        this.getUserConsents(userId),
      ]);

      const exportData: UserDataExport = {
        personalInformation: personalInfo,
        roadmaps,
        snippets,
        sessions: this.sanitizeSessions(sessions),
        auditLogs: this.sanitizeAuditLogs(auditLogs),
        consents,
        metadata: {
          exportedAt: new Date(),
          dataVersion: '1.0.0',
          format: 'json',
        },
      };

      // Validate export size
      const sizeCheck = this.validateExportSize(exportData);
      if (!sizeCheck.valid) {
        throw new Error(`Export size exceeds limit: ${sizeCheck.sizeMB}MB`);
      }

      return exportData;
    } catch (error: any) {
      console.error('Data compilation error:', error);
      throw new Error('Failed to compile user data');
    }
  }

  /**
   * Generate downloadable export file and store in R2
   */
  async generateExportFile(userId: string, data: UserDataExport): Promise<string> {
    try {
      // Convert to JSON
      const jsonData = JSON.stringify(data, null, 2);

      // Generate unique filename
      const filename = `user-data-export-${userId}-${Date.now()}.json`;

      // Upload to R2 (Cloudflare Object Storage)
      const downloadUrl = await this.uploadToR2(filename, jsonData);

      // Set expiration (30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.EXPORT_EXPIRY_DAYS);

      // Update export request with download URL
      await this.updateExportRequest(userId, {
        status: 'completed',
        downloadUrl,
        expiresAt,
      });

      // Send notification email with download link
      await this.notifyUserOfExportReady(userId, downloadUrl, expiresAt);

      // Log GDPR activity
      await this.logGDPRActivity(userId, 'data_export_completed', {
        filename,
        expiresAt,
      });

      return downloadUrl;
    } catch (error: any) {
      console.error('Export file generation error:', error);
      throw new Error('Failed to generate export file');
    }
  }

  /**
   * Handle data deletion request (Right to be Forgotten)
   * Article 17 - Right to erasure ('right to be forgotten')
   */
  async requestDataDeletion(
    userId: string,
    reason: string,
    immediateDelete: boolean = false
  ): Promise<{
    scheduled: boolean;
    deletionDate: Date;
    anonymized: boolean;
  }> {
    try {
      if (immediateDelete) {
        // Immediate hard delete (use with caution)
        await this.hardDeleteUserData(userId);

        await this.logGDPRActivity(userId, 'data_deletion_immediate', { reason });

        return {
          scheduled: false,
          deletionDate: new Date(),
          anonymized: false,
        };
      } else {
        // Schedule deletion with retention period (GDPR compliant)
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + this.ANONYMIZATION_RETENTION_DAYS);

        await this.scheduleDataDeletion(userId, deletionDate, reason);

        // Anonymize immediately, delete after retention
        await this.anonymizeUserData(userId);

        await this.logGDPRActivity(userId, 'data_deletion_scheduled', {
          reason,
          deletionDate,
        });

        return {
          scheduled: true,
          deletionDate,
          anonymized: true,
        };
      }
    } catch (error: any) {
      console.error('Data deletion request error:', error);
      throw new Error('Failed to process data deletion request');
    }
  }

  /**
   * Anonymize user data (keep for analytics/audit, remove PII)
   */
  async anonymizeUserData(userId: string): Promise<AnonymizationResult> {
    try {
      let recordsAnonymized = 0;

      // Anonymize user table
      await this.anonymizeUserRecord(userId);
      recordsAnonymized++;

      // Anonymize roadmaps (keep structure, remove identifying info)
      const roadmapsAnonymized = await this.anonymizeUserRoadmaps(userId);
      recordsAnonymized += roadmapsAnonymized;

      // Anonymize snippets
      const snippetsAnonymized = await this.anonymizeUserSnippets(userId);
      recordsAnonymized += snippetsAnonymized;

      // Anonymize audit logs (keep for compliance, remove PII)
      const logsAnonymized = await this.anonymizeAuditLogs(userId);
      recordsAnonymized += logsAnonymized;

      // Mark user as anonymized
      await this.markUserAsAnonymized(userId);

      await this.logGDPRActivity(userId, 'data_anonymized', {
        recordsAnonymized,
      });

      return {
        success: true,
        recordsAnonymized,
        retentionApplied: true,
      };
    } catch (error: any) {
      console.error('Data anonymization error:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Hard delete all user data (no retention)
   * Use only when legally required or after retention period
   */
  private async hardDeleteUserData(userId: string): Promise<void> {
    try {
      // Delete in order to handle foreign key constraints
      await this.deleteUserSessions(userId);
      await this.deleteUserRoadmaps(userId);
      await this.deleteUserSnippets(userId);
      await this.deleteUserConsents(userId);
      await this.deleteUserMFAData(userId);

      // Keep audit logs for compliance (anonymized)
      await this.anonymizeAuditLogs(userId);

      // Finally, delete user record
      await this.deleteUserRecord(userId);

      console.info(`Hard delete completed for user ${userId}`);
    } catch (error: any) {
      console.error('Hard delete error:', error);
      throw new Error('Failed to hard delete user data');
    }
  }

  /**
   * Record user consent for data processing
   * Article 7 - Conditions for consent
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    version: string
  ): Promise<void> {
    try {
      await this.storeConsent({
        userId,
        consentType,
        granted,
        version,
        timestamp: new Date(),
        ipAddress: await this.getCurrentIP(),
      });

      await this.logGDPRActivity(userId, 'consent_recorded', {
        consentType,
        granted,
        version,
      });
    } catch (error: any) {
      console.error('Consent recording error:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get all consents for user
   */
  async getUserConsentHistory(userId: string): Promise<any[]> {
    return await this.getUserConsents(userId);
  }

  /**
   * Withdraw consent
   * Article 7(3) - Withdrawal of consent
   */
  async withdrawConsent(userId: string, consentType: string): Promise<void> {
    try {
      await this.recordConsent(userId, consentType, false, 'withdrawal');

      // Take action based on consent type
      if (consentType === 'marketing_emails') {
        await this.unsubscribeFromMarketing(userId);
      } else if (consentType === 'analytics_tracking') {
        await this.disableAnalytics(userId);
      }

      await this.logGDPRActivity(userId, 'consent_withdrawn', { consentType });
    } catch (error: any) {
      console.error('Consent withdrawal error:', error);
      throw new Error('Failed to withdraw consent');
    }
  }

  /**
   * Validate export size doesn't exceed limits
   */
  private validateExportSize(data: UserDataExport): { valid: boolean; sizeMB: number } {
    const jsonStr = JSON.stringify(data);
    const sizeMB = Buffer.byteLength(jsonStr, 'utf-8') / (1024 * 1024);

    return {
      valid: sizeMB <= this.MAX_EXPORT_SIZE_MB,
      sizeMB: Math.round(sizeMB * 100) / 100,
    };
  }

  /**
   * Sanitize sensitive data from sessions before export
   */
  private sanitizeSessions(sessions: any[]): any[] {
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.created_at,
      lastAccessed: session.last_accessed,
      ipAddress: this.maskIP(session.ip_address),
      userAgent: session.user_agent,
      // Omit session tokens
    }));
  }

  /**
   * Sanitize audit logs (remove internal system details)
   */
  private sanitizeAuditLogs(logs: any[]): any[] {
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      timestamp: log.timestamp,
      ipAddress: this.maskIP(log.ip_address),
      // Omit internal identifiers
    }));
  }

  /**
   * Mask IP address for privacy (keep first 2 octets)
   */
  private maskIP(ip: string): string {
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'masked';
  }

  // Database integration methods (to be implemented with actual D1 queries)
  private async getExistingExportRequest(userId: string): Promise<DataExportRequest | null> {
    // SELECT * FROM data_export_requests WHERE user_id = ? AND status = 'pending'
    return null;
  }

  private async storeExportRequest(request: DataExportRequest): Promise<void> {
    // INSERT INTO data_export_requests ...
  }

  private async queueDataExportJob(userId: string): Promise<void> {
    // Queue background job (Cloudflare Queue or Durable Object)
  }

  private async updateExportRequest(userId: string, updates: Partial<DataExportRequest>): Promise<void> {
    // UPDATE data_export_requests SET ... WHERE user_id = ?
  }

  private async getUserPersonalInfo(userId: string): Promise<any> {
    // SELECT email, name, created_at, last_login FROM users WHERE id = ?
    return {};
  }

  private async getUserRoadmaps(userId: string): Promise<any[]> {
    // SELECT * FROM roadmaps WHERE user_id = ?
    return [];
  }

  private async getUserSnippets(userId: string): Promise<any[]> {
    // SELECT * FROM snippets WHERE user_id = ?
    return [];
  }

  private async getUserSessions(userId: string): Promise<any[]> {
    // SELECT * FROM sessions WHERE user_id = ?
    return [];
  }

  private async getUserAuditLogs(userId: string): Promise<any[]> {
    // SELECT * FROM audit_logs WHERE user_id = ?
    return [];
  }

  private async getUserConsents(userId: string): Promise<any[]> {
    // SELECT * FROM user_consents WHERE user_id = ?
    return [];
  }

  private async uploadToR2(filename: string, data: string): Promise<string> {
    // Upload to Cloudflare R2
    return `https://storage.protothrive.com/exports/${filename}`;
  }

  private async notifyUserOfExportReady(userId: string, url: string, expiresAt: Date): Promise<void> {
    // Send email notification
  }

  private async scheduleDataDeletion(userId: string, deletionDate: Date, reason: string): Promise<void> {
    // INSERT INTO scheduled_deletions ...
  }

  private async anonymizeUserRecord(userId: string): Promise<void> {
    // UPDATE users SET email = 'deleted-user-' || id, name = 'Deleted User', ... WHERE id = ?
  }

  private async anonymizeUserRoadmaps(userId: string): Promise<number> {
    // UPDATE roadmaps SET user_id = NULL, ...
    return 0;
  }

  private async anonymizeUserSnippets(userId: string): Promise<number> {
    // UPDATE snippets SET user_id = NULL, ...
    return 0;
  }

  private async anonymizeAuditLogs(userId: string): Promise<number> {
    // UPDATE audit_logs SET user_id = 'anonymized', email = 'redacted', ...
    return 0;
  }

  private async markUserAsAnonymized(userId: string): Promise<void> {
    // UPDATE users SET anonymized = true, anonymized_at = CURRENT_TIMESTAMP WHERE id = ?
  }

  private async deleteUserSessions(userId: string): Promise<void> {
    // DELETE FROM sessions WHERE user_id = ?
  }

  private async deleteUserRoadmaps(userId: string): Promise<void> {
    // DELETE FROM roadmaps WHERE user_id = ?
  }

  private async deleteUserSnippets(userId: string): Promise<void> {
    // DELETE FROM snippets WHERE user_id = ?
  }

  private async deleteUserConsents(userId: string): Promise<void> {
    // DELETE FROM user_consents WHERE user_id = ?
  }

  private async deleteUserMFAData(userId: string): Promise<void> {
    // UPDATE users SET mfa_enabled = false, totp_secret = NULL, backup_codes = NULL WHERE id = ?
  }

  private async deleteUserRecord(userId: string): Promise<void> {
    // DELETE FROM users WHERE id = ?
  }

  private async storeConsent(consent: any): Promise<void> {
    // INSERT INTO user_consents ...
  }

  private async unsubscribeFromMarketing(userId: string): Promise<void> {
    // Update marketing preferences
  }

  private async disableAnalytics(userId: string): Promise<void> {
    // Disable analytics tracking
  }

  private async getCurrentIP(): Promise<string> {
    return 'unknown';
  }

  private async logGDPRActivity(userId: string, action: string, metadata: any): Promise<void> {
    console.log(`[GDPR] ${action}:`, { userId, ...metadata });
  }

  private generateRequestId(userId: string): string {
    return `export-${userId}-${Date.now()}`;
  }
}

// Export singleton instance
export const gdprService = new GDPRService();
