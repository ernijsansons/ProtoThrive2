/**
 * User service for ProtoThrive authentication and user management
 */

import { DatabaseService } from '../utils/db';
import { hashPassword, verifyPassword } from '../utils/auth';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'vibe_coder' | 'engineer' | 'exec' | 'admin';
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  last_login?: string;
  name?: string; // Computed field for backward compatibility
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'vibe_coder' | 'engineer' | 'exec';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserService {
  constructor(private db: DatabaseService) {}

  /**
   * Create a new user account
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const { email, password, name, firstName, lastName, role = 'vibe_coder' } = userData;

      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // FIXED: Map old 'user' role to new 'vibe_coder' role
      const mappedRole = (role as string) === 'user' ? 'vibe_coder' : role;
      const validRoles = ['vibe_coder', 'engineer', 'exec', 'admin'];

      if (!validRoles.includes(mappedRole)) {
        throw new Error(`Invalid role: ${mappedRole}. Must be one of: ${validRoles.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password securely
      const hashedPassword = await hashPassword(password);

      // Generate user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // FIXED: Use correct schema field names
      const query = `
        INSERT INTO users (id, email, first_name, last_name, password_hash, role, created_at, updated_at, email_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date().toISOString();
      const userFirstName = firstName || name || '';
      const userLastName = lastName || '';

      await this.db.database.prepare(query).bind(
        userId,
        email.toLowerCase(),
        userFirstName,
        userLastName,
        hashedPassword,
        mappedRole,
        now,
        now,
        false
      ).run();

      // Return user without password
      return {
        id: userId,
        email: email.toLowerCase(),
        first_name: userFirstName,
        last_name: userLastName,
        name: `${userFirstName} ${userLastName}`.trim() || email.split('@')[0],
        role: mappedRole,
        created_at: now,
        updated_at: now,
        email_verified: false
      };
    } catch (error) {
      console.error('Create user error:', error);
      if (error instanceof Error) {
        if (error.message.includes('UNIQUE constraint failed') || error.message.includes('already exists')) {
          throw new Error('User already exists with this email');
        }
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(loginData: LoginRequest): Promise<User | null> {
    try {
      const { email, password } = loginData;

      if (!email || !password) {
        return null;
      }

      // Get user by email
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Return user without password and with computed name field
      const { password_hash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || (user.email as string).split('@')[0]
      } as User;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    try {
      if (!email) {
        return null;
      }

      // FIXED: Use correct schema field names
      const query = `
        SELECT id, email, first_name, last_name, password_hash, role, created_at, updated_at, email_verified, last_login
        FROM users
        WHERE email = ?
      `;

      const result = await this.db.database.prepare(query).bind(email.toLowerCase()).first();
      return result;
    } catch (error) {
      console.error('Get user by email error:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        return null;
      }

      // FIXED: Use correct schema field names
      const query = `
        SELECT id, email, first_name, last_name, role, created_at, updated_at, email_verified, last_login
        FROM users
        WHERE id = ?
      `;

      const result = await this.db.database.prepare(query).bind(userId).first();

      if (!result) {
        return null;
      }

      // Add computed name field for backward compatibility
      return {
        ...result,
        name: `${result.first_name || ''} ${result.last_name || ''}`.trim() || (result.email as string).split('@')[0]
      } as User;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw new Error('Failed to fetch user by ID');
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Pick<User, 'first_name' | 'last_name' | 'email'>>): Promise<boolean> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // FIXED: Use correct schema field names
      const allowedFields = ['first_name', 'last_name', 'email'];
      const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

      if (updateFields.length === 0) {
        return false;
      }

      const setClause = updateFields.map(field => `${field} = ?`).join(', ');
      const values = updateFields.map(field => updates[field as keyof typeof updates]);

      const query = `
        UPDATE users
        SET ${setClause}, updated_at = ?
        WHERE id = ?
      `;

      const result = await this.db.database.prepare(query).bind(
        ...values,
        new Date().toISOString(),
        userId
      ).run();

      return result.success;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get user with password hash
    const query = `
      SELECT password_hash
      FROM users
      WHERE id = ?
    `;

    const user = await this.db.database.prepare(query).bind(userId).first() as { password_hash: string } | null;
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    const updateQuery = `
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `;

    const result = await this.db.database.prepare(updateQuery).bind(
      hashedNewPassword,
      new Date().toISOString(),
      userId
    ).run();

    return result.success;
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = ?
      WHERE id = ?
    `;

    await this.db.database.prepare(query).bind(
      new Date().toISOString(),
      userId
    ).run();
  }

  /**
   * Verify email address
   */
  async verifyEmail(userId: string): Promise<boolean> {
    const query = `
      UPDATE users
      SET email_verified = true, updated_at = ?
      WHERE id = ?
    `;

    const result = await this.db.database.prepare(query).bind(
      new Date().toISOString(),
      userId
    ).run();

    return result.success;
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<boolean> {
    const query = `DELETE FROM users WHERE id = ?`;
    const result = await this.db.database.prepare(query).bind(userId).run();
    return result.success;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    roadmapsCount: number;
    snippetsCount: number;
    joinedDate: string;
    lastActive: string;
  }> {
    // Get roadmap count
    const roadmapQuery = `SELECT COUNT(*) as count FROM roadmaps WHERE user_id = ?`;
    const roadmapResult = await this.db.database.prepare(roadmapQuery).bind(userId).first() as { count: number };

    // Get snippet count (mock for now)
    const snippetCount = 0;

    // Get user join date and last login
    const userQuery = `SELECT created_at, last_login FROM users WHERE id = ?`;
    const userResult = await this.db.database.prepare(userQuery).bind(userId).first() as {
      created_at: string;
      last_login: string;
    } | null;

    return {
      roadmapsCount: roadmapResult?.count || 0,
      snippetsCount: snippetCount,
      joinedDate: userResult?.created_at || '',
      lastActive: userResult?.last_login || userResult?.created_at || ''
    };
  }
}