/**
 * HaveIBeenPwned Password Breach Detection Service
 * Integrates with Troy Hunt's HaveIBeenPwned API to check for compromised passwords
 *
 * Features:
 * - K-anonymity model (only sends first 5 chars of SHA-1 hash)
 * - Privacy-preserving password breach detection
 * - Rate limiting and caching
 * - User notification system for compromised passwords
 */

import * as crypto from 'crypto';

interface BreachCheckResult {
  compromised: boolean;
  breachCount?: number;
  severity: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface PasswordStrengthResult {
  score: number; // 0-100
  feedback: string[];
  breached: boolean;
  recommendChange: boolean;
}

export class PwnedPasswordsService {
  private readonly API_BASE_URL = 'https://api.pwnedpasswords.com';
  private readonly RANGE_ENDPOINT = '/range';
  private readonly CACHE_TTL_HOURS = 24;
  private readonly MIN_BREACH_COUNT_WARN = 10;
  private readonly CRITICAL_BREACH_COUNT = 1000;

  // In-memory cache (would use KV store in production)
  private breachCache: Map<string, { count: number; cachedAt: Date }> = new Map();

  /**
   * Check if password has been compromised in data breaches
   * Uses k-anonymity model - only sends first 5 chars of hash to API
   */
  async checkPassword(password: string): Promise<BreachCheckResult> {
    try {
      // Generate SHA-1 hash of password
      const hash = this.sha1Hash(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Check cache first
      const cachedResult = this.getCachedResult(hash);
      if (cachedResult !== null) {
        return this.formatResult(cachedResult);
      }

      // Query HaveIBeenPwned API with k-anonymity
      const breachCount = await this.queryPwnedAPI(prefix, suffix);

      // Cache result
      this.cacheResult(hash, breachCount);

      return this.formatResult(breachCount);
    } catch (error: any) {
      console.error('Pwned passwords check error:', error);

      // Don't block user on API failure - log and allow
      console.warn('Unable to verify password breach status, allowing registration');
      return {
        compromised: false,
        severity: 'safe',
        message: 'Unable to verify password breach status',
      };
    }
  }

  /**
   * Query HaveIBeenPwned API using k-anonymity model
   */
  private async queryPwnedAPI(prefix: string, suffix: string): Promise<number> {
    const url = `${this.API_BASE_URL}${this.RANGE_ENDPOINT}/${prefix}`;

    // Add user agent as recommended by API
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ProtoThrive-Password-Checker/1.0',
        'Add-Padding': 'true', // Request padding for additional privacy
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded on password breach check');
      }
      throw new Error(`API request failed: ${response.status}`);
    }

    const responseText = await response.text();

    // Parse response - format: SUFFIX:COUNT\r\n
    const lines = responseText.split('\r\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');

      if (hashSuffix.toUpperCase() === suffix.toUpperCase()) {
        return parseInt(countStr, 10);
      }
    }

    // Password not found in breaches
    return 0;
  }

  /**
   * Generate SHA-1 hash of password (as required by HIBP API)
   */
  private sha1Hash(password: string): string {
    return crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Format breach count into user-friendly result
   */
  private formatResult(breachCount: number): BreachCheckResult {
    if (breachCount === 0) {
      return {
        compromised: false,
        breachCount: 0,
        severity: 'safe',
        message: 'Password has not been found in known data breaches',
      };
    }

    if (breachCount < this.MIN_BREACH_COUNT_WARN) {
      return {
        compromised: true,
        breachCount,
        severity: 'low',
        message: `Password found in ${breachCount} data breaches. Consider using a different password.`,
      };
    }

    if (breachCount < 100) {
      return {
        compromised: true,
        breachCount,
        severity: 'medium',
        message: `Password compromised in ${breachCount} data breaches. You should change it.`,
      };
    }

    if (breachCount < this.CRITICAL_BREACH_COUNT) {
      return {
        compromised: true,
        breachCount,
        severity: 'high',
        message: `Password heavily compromised (${breachCount} breaches). Change immediately.`,
      };
    }

    return {
      compromised: true,
      breachCount,
      severity: 'critical',
      message: `CRITICAL: Password extremely common (${breachCount}+ breaches). Never use this password.`,
    };
  }

  /**
   * Check cache for recent breach check
   */
  private getCachedResult(hash: string): number | null {
    const cached = this.breachCache.get(hash);

    if (!cached) return null;

    // Check if cache is still valid
    const now = new Date();
    const ageHours = (now.getTime() - cached.cachedAt.getTime()) / (1000 * 60 * 60);

    if (ageHours > this.CACHE_TTL_HOURS) {
      this.breachCache.delete(hash);
      return null;
    }

    return cached.count;
  }

  /**
   * Cache breach check result
   */
  private cacheResult(hash: string, count: number): void {
    this.breachCache.set(hash, {
      count,
      cachedAt: new Date(),
    });
  }

  /**
   * Comprehensive password strength analysis including breach check
   */
  async analyzePasswordStrength(password: string): Promise<PasswordStrengthResult> {
    const feedback: string[] = [];
    let score = 100;

    // Check length
    if (password.length < 12) {
      score -= 20;
      feedback.push('Password should be at least 12 characters long');
    } else if (password.length < 16) {
      score -= 10;
      feedback.push('Consider using a longer password (16+ characters)');
    }

    // Check character variety
    if (!/[a-z]/.test(password)) {
      score -= 15;
      feedback.push('Add lowercase letters');
    }
    if (!/[A-Z]/.test(password)) {
      score -= 15;
      feedback.push('Add uppercase letters');
    }
    if (!/[0-9]/.test(password)) {
      score -= 15;
      feedback.push('Add numbers');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      score -= 15;
      feedback.push('Add special characters');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }
    if (/(?:abc|123|qwerty|password)/i.test(password)) {
      score -= 20;
      feedback.push('Avoid common patterns and dictionary words');
    }

    // Check breach database
    const breachCheck = await this.checkPassword(password);

    if (breachCheck.compromised) {
      score -= 50; // Heavy penalty for breached passwords
      feedback.push(breachCheck.message);
    }

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      feedback,
      breached: breachCheck.compromised,
      recommendChange: score < 70 || breachCheck.compromised,
    };
  }

  /**
   * Scan existing user passwords and notify of breaches
   * Run this as a scheduled job (e.g., weekly)
   */
  async scanExistingPasswords(userIds: string[]): Promise<{
    scanned: number;
    breached: number;
    notified: number;
  }> {
    let scanned = 0;
    let breached = 0;
    let notified = 0;

    for (const userId of userIds) {
      try {
        // Get user's password hash from database
        const passwordHash = await this.getUserPasswordHash(userId);

        if (!passwordHash) continue;

        // Check if breached (using stored hash)
        const result = await this.checkPasswordHash(passwordHash);

        scanned++;

        if (result.compromised && result.severity !== 'low') {
          breached++;

          // Notify user
          await this.notifyUserOfBreach(userId, result);
          notified++;

          // Log security event
          console.warn(`Password breach detected for user ${userId}: ${result.severity}`);
        }
      } catch (error) {
        console.error(`Error scanning password for user ${userId}:`, error);
      }
    }

    return { scanned, breached, notified };
  }

  /**
   * Check password hash directly (for scheduled scans)
   */
  private async checkPasswordHash(passwordHash: string): Promise<BreachCheckResult> {
    // For stored password hashes, we can't check directly
    // This would need to be implemented differently in production
    // Option 1: Store plaintext temporarily during registration check
    // Option 2: Require password confirmation for scheduled checks
    // Option 3: Only check new passwords on change

    return {
      compromised: false,
      severity: 'safe',
      message: 'Cannot check stored password hashes',
    };
  }

  /**
   * Force password reset for users with compromised passwords
   */
  async forcePasswordReset(userId: string, reason: string): Promise<void> {
    // Mark password as expired
    await this.expireUserPassword(userId);

    // Send notification email
    await this.sendPasswordResetNotification(userId, reason);

    // Log security event
    console.info(`Forced password reset for user ${userId}: ${reason}`);
  }

  // Database integration methods (to be implemented)
  private async getUserPasswordHash(userId: string): Promise<string | null> {
    // Would query: SELECT password_hash FROM users WHERE id = ?
    return null;
  }

  private async notifyUserOfBreach(userId: string, result: BreachCheckResult): Promise<void> {
    // Would send email notification to user about breach
    // Include: severity, breach count, recommended actions
  }

  private async expireUserPassword(userId: string): Promise<void> {
    // Would update: UPDATE users SET password_expired = true WHERE id = ?
  }

  private async sendPasswordResetNotification(userId: string, reason: string): Promise<void> {
    // Would send email with password reset link
  }
}

// Export singleton instance
export const pwnedPasswordsService = new PwnedPasswordsService();
