/**
 * Multi-Factor Authentication (MFA) Service
 * OWASP compliant TOTP implementation with backup codes
 *
 * Features:
 * - TOTP (Time-based One-Time Password) generation and validation
 * - QR code generation for authenticator apps
 * - Backup codes for account recovery
 * - Rate limiting for brute force protection
 * - Audit logging for security monitoring
 */

import * as crypto from 'crypto';
import { authenticator } from 'otplib';

interface MFASecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface MFAVerificationResult {
  valid: boolean;
  usedBackupCode?: boolean;
  remainingBackupCodes?: number;
  error?: string;
}

interface MFAEnrollmentData {
  userId: string;
  secret: string;
  backupCodes: string[];
  verified: boolean;
  createdAt: Date;
}

export class MFAService {
  private readonly APP_NAME = 'ProtoThrive';
  private readonly BACKUP_CODE_COUNT = 10;
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly TOTP_WINDOW = 1; // Allow 1 step before/after for clock drift
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  // In-memory cache for rate limiting (would use KV in production)
  private verificationAttempts: Map<string, { count: number; lockedUntil?: Date }> = new Map();

  /**
   * Generate MFA secret and QR code for user enrollment
   */
  async generateMFASecret(userId: string, email: string): Promise<MFASecret> {
    // Generate cryptographically secure secret
    const secret = authenticator.generateSecret();

    // Generate OTP Auth URL for QR code
    const otpauthUrl = authenticator.keyuri(email, this.APP_NAME, secret);

    // Generate QR code as data URL (would use qrcode library in production)
    const qrCode = await this.generateQRCode(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code during enrollment or authentication
   */
  async verifyTOTP(
    userId: string,
    secret: string,
    token: string,
    allowBackupCode: boolean = false
  ): Promise<MFAVerificationResult> {
    // Check rate limiting
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        valid: false,
        error: `Account locked due to too many failed attempts. Try again in ${rateLimitCheck.minutesRemaining} minutes.`,
      };
    }

    // Validate token format (6 digits for TOTP)
    if (!/^\d{6}$/.test(token)) {
      this.recordFailedAttempt(userId);
      return {
        valid: false,
        error: 'Invalid token format. Token must be 6 digits.',
      };
    }

    // Verify TOTP with time window for clock drift
    const isValid = authenticator.verify({
      token,
      secret,
      window: this.TOTP_WINDOW,
    });

    if (isValid) {
      this.resetAttempts(userId);
      return { valid: true };
    }

    // If TOTP failed and backup codes are allowed, check backup codes
    if (allowBackupCode) {
      const backupResult = await this.verifyBackupCode(userId, token);
      if (backupResult.valid) {
        this.resetAttempts(userId);
        return backupResult;
      }
    }

    // Record failed attempt
    this.recordFailedAttempt(userId);

    return {
      valid: false,
      error: 'Invalid authentication code.',
    };
  }

  /**
   * Verify backup code and mark as used
   */
  private async verifyBackupCode(userId: string, code: string): Promise<MFAVerificationResult> {
    // Validate backup code format (8 alphanumeric characters)
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return { valid: false, error: 'Invalid backup code format.' };
    }

    // Fetch user's backup codes from database (hashed)
    const backupCodes = await this.getUserBackupCodes(userId);

    // Check if code matches any unused backup code
    for (const hashedCode of backupCodes) {
      if (await this.verifyBackupCodeHash(code, hashedCode)) {
        // Mark code as used
        await this.markBackupCodeUsed(userId, hashedCode);

        const remainingCodes = await this.getRemainingBackupCodeCount(userId);

        // Warn if running low on backup codes
        if (remainingCodes < 3) {
          console.warn(`User ${userId} has only ${remainingCodes} backup codes remaining`);
        }

        return {
          valid: true,
          usedBackupCode: true,
          remainingBackupCodes: remainingCodes,
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid or already used backup code.',
    };
  }

  /**
   * Generate secure backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      let code = '';
      for (let j = 0; j < this.BACKUP_CODE_LENGTH; j++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        code += charset[randomIndex];
      }
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup codes before storage (PBKDF2)
   */
  async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes: string[] = [];

    for (const code of codes) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = await this.pbkdf2Hash(code, salt);
      hashedCodes.push(`${salt}:${hash}`);
    }

    return hashedCodes;
  }

  /**
   * PBKDF2 hash with 100k iterations (OWASP recommendation)
   */
  private async pbkdf2Hash(data: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(data, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      });
    });
  }

  /**
   * Verify backup code against hash
   */
  private async verifyBackupCodeHash(code: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    const computedHash = await this.pbkdf2Hash(code, salt);
    return this.constantTimeCompare(hash, computedHash);
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return mismatch === 0;
  }

  /**
   * Generate QR code for TOTP secret
   */
  private async generateQRCode(otpauthUrl: string): Promise<string> {
    // In production, use qrcode library:
    // const QRCode = require('qrcode');
    // return await QRCode.toDataURL(otpauthUrl);

    // For now, return the URL (frontend can generate QR code)
    return otpauthUrl;
  }

  /**
   * Check rate limiting for verification attempts
   */
  private checkRateLimit(userId: string): { allowed: boolean; minutesRemaining?: number } {
    const attempts = this.verificationAttempts.get(userId);

    if (!attempts) {
      return { allowed: true };
    }

    // Check if locked
    if (attempts.lockedUntil) {
      const now = new Date();
      if (now < attempts.lockedUntil) {
        const minutesRemaining = Math.ceil(
          (attempts.lockedUntil.getTime() - now.getTime()) / 60000
        );
        return { allowed: false, minutesRemaining };
      } else {
        // Lock expired, reset
        this.verificationAttempts.delete(userId);
        return { allowed: true };
      }
    }

    // Check if too many attempts
    if (attempts.count >= this.MAX_VERIFICATION_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60000);
      attempts.lockedUntil = lockedUntil;
      return { allowed: false, minutesRemaining: this.LOCKOUT_DURATION_MINUTES };
    }

    return { allowed: true };
  }

  /**
   * Record failed verification attempt
   */
  private recordFailedAttempt(userId: string): void {
    const attempts = this.verificationAttempts.get(userId) || { count: 0 };
    attempts.count++;
    this.verificationAttempts.set(userId, attempts);

    // Log security event
    console.warn(`Failed MFA verification attempt for user ${userId} (${attempts.count}/${this.MAX_VERIFICATION_ATTEMPTS})`);
  }

  /**
   * Reset verification attempts after successful auth
   */
  private resetAttempts(userId: string): void {
    this.verificationAttempts.delete(userId);
  }

  /**
   * Enable MFA for user (after successful enrollment verification)
   */
  async enableMFA(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    // Hash backup codes before storage
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    // Store in database
    await this.storeMFAData(userId, {
      secret,
      hashedBackupCodes,
      enabled: true,
      enabledAt: new Date(),
    });

    // Log security event
    console.info(`MFA enabled for user ${userId}`);
  }

  /**
   * Disable MFA for user (requires re-authentication)
   */
  async disableMFA(userId: string): Promise<void> {
    // Remove MFA data from database
    await this.removeMFAData(userId);

    // Log security event
    console.info(`MFA disabled for user ${userId}`);
  }

  /**
   * Regenerate backup codes (after using most of them)
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = this.generateBackupCodes();
    const hashedCodes = await this.hashBackupCodes(newCodes);

    // Replace old backup codes with new ones
    await this.updateBackupCodes(userId, hashedCodes);

    // Log security event
    console.info(`Backup codes regenerated for user ${userId}`);

    return newCodes;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const mfaData = await this.getMFAData(userId);
    return mfaData?.enabled === true;
  }

  // Database operations (would integrate with actual DB in production)
  private async getUserBackupCodes(userId: string): Promise<string[]> {
    // Mock implementation - would query D1 database
    return [];
  }

  private async markBackupCodeUsed(userId: string, hashedCode: string): Promise<void> {
    // Mock implementation - would update D1 database
  }

  private async getRemainingBackupCodeCount(userId: string): Promise<number> {
    // Mock implementation - would query D1 database
    return 8;
  }

  private async storeMFAData(userId: string, data: any): Promise<void> {
    // Mock implementation - would insert into D1 database
    // UPDATE users SET mfa_enabled = true, totp_secret = ?, backup_codes = ? WHERE id = ?
  }

  private async removeMFAData(userId: string): Promise<void> {
    // Mock implementation - would update D1 database
    // UPDATE users SET mfa_enabled = false, totp_secret = NULL, backup_codes = NULL WHERE id = ?
  }

  private async updateBackupCodes(userId: string, hashedCodes: string[]): Promise<void> {
    // Mock implementation - would update D1 database
    // UPDATE users SET backup_codes = ? WHERE id = ?
  }

  private async getMFAData(userId: string): Promise<{ enabled: boolean; secret?: string } | null> {
    // Mock implementation - would query D1 database
    return null;
  }
}

// Export singleton instance
export const mfaService = new MFAService();
