// Secure Authentication Utilities
// Ref: CLAUDE.md - Security Phase 5

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  JWT_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string(),
  ENCRYPTION_KEY: z.string().length(32),
});

// Validate environment variables
export function validateEnvironment() {
  try {
    const env = {
      JWT_SECRET: process.env.JWT_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    };
    
    return envSchema.parse(env);
  } catch (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
}

// Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Secure password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT token generation
export function generateToken(payload: { id: string; role: string; email: string }): string {
  const env = validateEnvironment();
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

// JWT token verification
export function verifyToken(token: string): { id: string; role: string; email: string } {
  const env = validateEnvironment();
  return jwt.verify(token, env.JWT_SECRET) as { id: string; role: string; email: string };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '');
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  isAllowed(identifier: string, maxAttempts: number = 5, windowMs: number = 900000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
}
