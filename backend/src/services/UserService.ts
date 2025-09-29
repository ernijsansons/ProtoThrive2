/**
 * User service for ProtoThrive authentication and user management
 */

import { DatabaseService } from '../utils/db';
import { hashPassword, verifyPassword } from '../utils/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'pro' | 'premium' | 'admin';
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  last_login?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'pro' | 'premium';
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
    const { email, password, name, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert user into database
    const query = `
      INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at, email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = new Date().toISOString();

    await this.db.database.prepare(query).bind(
      userId,
      email.toLowerCase(),
      name,
      hashedPassword,
      role,
      now,
      now,
      false
    ).run();

    // Return user without password
    return {
      id: userId,
      email: email.toLowerCase(),
      name,
      role,
      created_at: now,
      updated_at: now,
      email_verified: false
    };
  }

  /**
   * Authenticate user login
   */
  async authenticateUser(loginData: LoginRequest): Promise<User | null> {
    const { email, password } = loginData;

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

    // Return user without password
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any> {
    const query = `
      SELECT id, email, name, password_hash, role, created_at, updated_at, email_verified, last_login
      FROM users
      WHERE email = ?
    `;

    const result = await this.db.database.prepare(query).bind(email.toLowerCase()).first();
    return result;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const query = `
      SELECT id, email, name, role, created_at, updated_at, email_verified, last_login
      FROM users
      WHERE id = ?
    `;

    const result = await this.db.database.prepare(query).bind(userId).first();
    return result as User | null;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<boolean> {
    const allowedFields = ['name', 'email'];
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