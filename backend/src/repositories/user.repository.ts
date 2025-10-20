/**
 * User Repository
 * Data access layer for user entities
 */

import { BaseRepository, BaseEntity } from './base.repository';

export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  mfa_enabled: boolean;
  totp_secret?: string | null;
  backup_codes?: string | null;
  login_attempts: number;
  locked_until?: Date | null;
  last_login?: Date | null;
  anonymized: boolean;
  tenant_id?: string | null;
}

export class UserRepository extends BaseRepository<User> {
  constructor(db: D1Database, cache?: KVNamespace) {
    super(db, 'users', cache);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      // Check cache
      if (this.cache) {
        const cacheKey = this.getCacheKey('email', email);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as User;
        }
      }

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE email = ? AND deleted_at IS NULL
      `;

      const result = await this.db
        .prepare(query)
        .bind(email)
        .first<User>();

      // Cache result
      if (result && this.cache) {
        const cacheKey = this.getCacheKey('email', email);
        await this.cache.put(cacheKey, JSON.stringify(result), {
          expirationTtl: 3600,
        });
      }

      return result;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find users by role
   */
  async findByRole(role: User['role']): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE role = ? AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await this.db
        .prepare(query)
        .bind(role)
        .all<User>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw error;
    }
  }

  /**
   * Find users by tenant
   */
  async findByTenant(tenantId: string): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE tenant_id = ? AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await this.db
        .prepare(query)
        .bind(tenantId)
        .all<User>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding users by tenant:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      const query = `
        UPDATE ${this.tableName}
        SET last_login = ?, updated_at = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(now, now, userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET login_attempts = login_attempts + 1
        WHERE id = ?
        RETURNING login_attempts
      `;

      const result = await this.db
        .prepare(query)
        .bind(userId)
        .first<{ login_attempts: number }>();

      await this.invalidateCache(userId);

      return result?.login_attempts || 0;
    } catch (error) {
      console.error('Error incrementing login attempts:', error);
      throw error;
    }
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET login_attempts = 0, locked_until = NULL
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error resetting login attempts:', error);
      throw error;
    }
  }

  /**
   * Lock user account
   */
  async lockAccount(userId: string, durationMinutes: number = 15): Promise<void> {
    try {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

      const query = `
        UPDATE ${this.tableName}
        SET locked_until = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(lockedUntil.toISOString(), userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error locking account:', error);
      throw error;
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const user = await this.findById(userId);
      if (!user || !user.locked_until) {
        return false;
      }

      const now = new Date();
      const lockedUntil = new Date(user.locked_until);

      return now < lockedUntil;
    } catch (error) {
      console.error('Error checking account lock:', error);
      throw error;
    }
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, totpSecret: string, backupCodes: string): Promise<void> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET mfa_enabled = true, totp_secret = ?, backup_codes = ?
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(totpSecret, backupCodes, userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error enabling MFA:', error);
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<void> {
    try {
      const query = `
        UPDATE ${this.tableName}
        SET mfa_enabled = false, totp_secret = NULL, backup_codes = NULL
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw error;
    }
  }

  /**
   * Mark user as anonymized (GDPR)
   */
  async anonymize(userId: string): Promise<void> {
    try {
      const anonymousEmail = `deleted-user-${userId}@anonymized.local`;
      const anonymousName = 'Deleted User';

      const query = `
        UPDATE ${this.tableName}
        SET
          email = ?,
          name = ?,
          anonymized = true,
          password_hash = 'ANONYMIZED',
          mfa_enabled = false,
          totp_secret = NULL,
          backup_codes = NULL
        WHERE id = ?
      `;

      await this.db
        .prepare(query)
        .bind(anonymousEmail, anonymousName, userId)
        .run();

      await this.invalidateCache(userId);
    } catch (error) {
      console.error('Error anonymizing user:', error);
      throw error;
    }
  }

  /**
   * Get users with MFA enabled
   */
  async findMFAEnabledUsers(): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE mfa_enabled = true AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;

      const result = await this.db
        .prepare(query)
        .all<User>();

      return result.results || [];
    } catch (error) {
      console.error('Error finding MFA enabled users:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async search(query: string, limit: number = 20): Promise<User[]> {
    try {
      const searchQuery = `
        SELECT * FROM ${this.tableName}
        WHERE (name LIKE ? OR email LIKE ?)
        AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
      `;

      const searchTerm = `%${query}%`;

      const result = await this.db
        .prepare(searchQuery)
        .bind(searchTerm, searchTerm, limit)
        .all<User>();

      return result.results || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}
