/**
 * Authentication Routes
 * Handles user registration, login, token refresh, and logout
 *
 * Endpoints:
 * - POST /api/auth/register - User registration
 * - POST /api/auth/login - User authentication
 * - POST /api/auth/refresh - Token refresh
 * - POST /api/auth/logout - User logout
 */

import { Hono } from 'hono';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { createRateLimitMiddleware } from '../utils/auth';
import { z } from 'zod';

// Define Env interface for Hono context
interface Env {
  DB: D1Database;
  KV_STORE: KVNamespace;
  JWT_SECRET: string;
  NODE_ENV?: string;
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Create router
const authRouter = new Hono<{ Bindings: Env }>();

// Simple validation middleware
const validateRequest = (schema: z.ZodSchema) => {
  return async (c: any, next: any) => {
    try {
      const body = await c.req.json();
      schema.parse(body);
      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Validation failed',
          details: error.issues.map((e: z.ZodIssue) => ({ field: e.path.join('.'), message: e.message }))
        }, 400);
      }
      throw error;
    }
  };
};

// Rate limit middleware wrapper
const rateLimitMiddleware = (options: { maxRequests: number; windowMs: number }) => {
  return createRateLimitMiddleware(options.maxRequests, options.windowMs);
};

/**
 * POST /api/auth/register
 * Register a new user account
 */
authRouter.post(
  '/register',
  rateLimitMiddleware({ maxRequests: 5, windowMs: 900000 }), // 5 per 15 min
  validateRequest(registerSchema),
  async (c) => {
    try {
      const body = await c.req.json();
      const { email, password, name } = body;

      const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);
      const userRepository = new UserRepository(c.env.DB);

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return c.json({
          error: 'User with this email already exists',
        }, 409);
      }

      // Check password against breach database
      const breachCheck = await authService.checkPasswordBreach(password);
      if (breachCheck.compromised && breachCheck.severity === 'critical') {
        return c.json({
          error: 'Password has been compromised in data breaches. Please choose a different password.',
          breachCount: breachCheck.breachCount,
        }, 400);
      }

      // Register user
      const result = await authService.register(email, password, name);

      return c.json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        },
      }, 201);

    } catch (error: any) {
      console.error('Registration error:', error);
      return c.json({
        error: 'Registration failed',
        details: error.message,
      }, 500);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
authRouter.post(
  '/login',
  rateLimitMiddleware({ maxRequests: 10, windowMs: 300000 }), // 10 per 5 min
  validateRequest(loginSchema),
  async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);

      // Attempt login
      const result = await authService.login(email, password);

      if (!result.success) {
        return c.json({
          error: result.error || 'Invalid credentials',
          remainingAttempts: result.remainingAttempts,
        }, 401);
      }

      // Check if MFA is required
      if (result.requiresMFA) {
        return c.json({
          requiresMFA: true,
          userId: result.userId,
          message: 'Multi-factor authentication required',
        }, 200);
      }

      return c.json({
        success: true,
        user: {
          id: result.user!.id,
          email: result.user!.email,
          name: result.user!.name,
          role: result.user!.role,
        },
        tokens: {
          accessToken: result.tokens!.accessToken,
          refreshToken: result.tokens!.refreshToken,
        },
      }, 200);

    } catch (error: any) {
      console.error('Login error:', error);
      return c.json({
        error: 'Authentication failed',
        details: error.message,
      }, 500);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
authRouter.post(
  '/refresh',
  validateRequest(refreshSchema),
  async (c) => {
    try {
      const body = await c.req.json();
      const { refreshToken } = body;

      const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);

      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        return c.json({
          error: result.error || 'Invalid refresh token',
        }, 401);
      }

      return c.json({
        success: true,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      }, 200);

    } catch (error: any) {
      console.error('Token refresh error:', error);
      return c.json({
        error: 'Token refresh failed',
        details: error.message,
      }, 500);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
authRouter.post(
  '/logout',
  async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          error: 'No authorization token provided',
        }, 401);
      }

      const token = authHeader.substring(7);
      const authService = new AuthService(c.env.DB, c.env.JWT_SECRET);

      await authService.logout(token);

      return c.json({
        success: true,
        message: 'Logged out successfully',
      }, 200);

    } catch (error: any) {
      console.error('Logout error:', error);
      return c.json({
        error: 'Logout failed',
        details: error.message,
      }, 500);
    }
  }
);

export default authRouter;
