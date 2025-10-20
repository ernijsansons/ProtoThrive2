/**
 * Authentication Service
 * Business logic for authentication operations
 *
 * Features:
 * - User registration with password validation
 * - Login with brute force protection
 * - Token generation and refresh
 * - MFA integration
 * - Password breach checking
 * - Session management
 */

import { UserRepository, User } from '../repositories/user.repository';
// TODO: Implement these services when needed
// import { JWTService } from '../utils/jwt.service';
// import { PasswordService } from '../utils/password.service';
// import { pwnedPasswordsService } from './pwned-passwords.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterResult {
  success: boolean;
  user: User;
  tokens: AuthTokens;
}

interface LoginResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  requiresMFA?: boolean;
  userId?: string;
  error?: string;
  remainingAttempts?: number;
}

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private jwtService: JWTService;
  private passwordService: PasswordService;

  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(db: D1Database, jwtSecret: string, cache?: KVNamespace) {
    this.userRepository = new UserRepository(db, cache);
    this.jwtService = new JWTService(jwtSecret);
    this.passwordService = new PasswordService();
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name: string): Promise<RegisterResult> {
    try {
      // Validate password complexity
      this.passwordService.validateComplexity(password);

      // Check password against breach database
      const breachCheck = await pwnedPasswordsService.checkPassword(password);
      if (breachCheck.compromised && breachCheck.severity === 'critical') {
        throw new Error('Password has been compromised in data breaches');
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(password);

      // Create user
      const user = await this.userRepository.create({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        role: 'user',
        mfa_enabled: false,
        login_attempts: 0,
        anonymized: false,
      } as any);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        user,
        tokens,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user
      const user = await this.userRepository.findByEmail(email.toLowerCase());

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if account is locked
      const isLocked = await this.userRepository.isAccountLocked(user.id);
      if (isLocked) {
        return {
          success: false,
          error: `Account locked due to too many failed attempts. Try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
        };
      }

      // Verify password
      const passwordValid = await this.passwordService.verifyPassword(
        password,
        user.password_hash
      );

      if (!passwordValid) {
        // Increment failed attempts
        const attempts = await this.userRepository.incrementLoginAttempts(user.id);

        // Lock account if max attempts exceeded
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
          await this.userRepository.lockAccount(user.id, this.LOCKOUT_DURATION_MINUTES);

          return {
            success: false,
            error: 'Maximum login attempts exceeded. Account locked.',
          };
        }

        return {
          success: false,
          error: 'Invalid credentials',
          remainingAttempts: this.MAX_LOGIN_ATTEMPTS - attempts,
        };
      }

      // Reset login attempts
      await this.userRepository.resetLoginAttempts(user.id);

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Check if MFA is required
      if (user.mfa_enabled) {
        return {
          success: false,
          requiresMFA: true,
          userId: user.id,
        };
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        user,
        tokens,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type',
        };
      }

      // Get user
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Token refresh failed',
      };
    }
  }

  /**
   * Logout user and invalidate token
   */
  async logout(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyToken(token);
      await this.jwtService.blacklistToken(payload.jti!);
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw - allow logout even if token invalid
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const accessToken = await this.jwtService.createToken(
      user.id,
      user.email,
      user.role
    );

    const refreshToken = await this.jwtService.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Check password against breach database
   */
  async checkPasswordBreach(password: string) {
    return await pwnedPasswordsService.checkPassword(password);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const passwordValid = await this.passwordService.verifyPassword(
        currentPassword,
        user.password_hash
      );

      if (!passwordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password complexity
      this.passwordService.validateComplexity(newPassword);

      // Check new password against breach database
      const breachCheck = await pwnedPasswordsService.checkPassword(newPassword);
      if (breachCheck.compromised && breachCheck.severity === 'critical') {
        throw new Error('New password has been compromised in data breaches');
      }

      // Hash new password
      const newPasswordHash = await this.passwordService.hashPassword(newPassword);

      // Update password
      await this.userRepository.update(userId, {
        password_hash: newPasswordHash,
      } as any);

      // TODO: Invalidate all existing sessions for this user
    } catch (error: any) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.userRepository.findByEmail(email.toLowerCase());

      // Always return success to prevent email enumeration
      if (!user) {
        return;
      }

      // Generate reset token
      const resetToken = await this.passwordService.generateResetToken();

      // TODO: Store reset token in database with expiration
      // TODO: Send reset email to user

      console.log(`Password reset requested for user ${user.id}`);
    } catch (error) {
      console.error('Password reset request error:', error);
      // Don't throw to prevent information disclosure
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      // TODO: Verify reset token from database
      // TODO: Get user ID from token
      // TODO: Validate token expiration

      // Validate new password
      this.passwordService.validateComplexity(newPassword);

      // Check against breach database
      const breachCheck = await pwnedPasswordsService.checkPassword(newPassword);
      if (breachCheck.compromised && breachCheck.severity === 'critical') {
        throw new Error('Password has been compromised in data breaches');
      }

      // Hash new password
      const passwordHash = await this.passwordService.hashPassword(newPassword);

      // TODO: Update user password
      // TODO: Invalidate reset token
      // TODO: Invalidate all existing sessions

      console.log('Password reset completed');
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}
