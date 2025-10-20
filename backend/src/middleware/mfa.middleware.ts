/**
 * MFA Enforcement Middleware
 * Requires MFA verification for sensitive operations
 */

import { Context, Next } from 'hono';
import { mfaService } from '../services/mfa.service';

/**
 * Middleware to require MFA for protected routes
 * Use this for sensitive operations like:
 * - Changing email/password
 * - Accessing admin panels
 * - Financial transactions
 * - Data export/deletion
 */
export async function requireMFA(c: Context, next: Next) {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({
        error: 'Authentication required',
      }, 401);
    }

    // Check if user has MFA enabled
    const mfaEnabled = await mfaService.isMFAEnabled(userId);

    if (mfaEnabled) {
      // Check if current session has completed MFA verification
      const mfaVerified = c.get('mfaVerified');

      if (!mfaVerified) {
        return c.json({
          error: 'MFA verification required',
          requiresMFA: true,
          message: 'This action requires multi-factor authentication. Please verify your identity.',
        }, 403);
      }
    }

    // MFA not required or already verified
    await next();
  } catch (error: any) {
    console.error('MFA middleware error:', error);
    return c.json({
      error: 'MFA verification failed',
      details: error.message,
    }, 500);
  }
}

/**
 * Middleware to optionally require MFA for enhanced security
 * Allows access but flags the session for additional monitoring
 */
export async function optionalMFA(c: Context, next: Next) {
  try {
    const userId = c.get('userId');

    if (userId) {
      const mfaEnabled = await mfaService.isMFAEnabled(userId);
      const mfaVerified = c.get('mfaVerified');

      // Flag for enhanced logging if MFA not verified
      if (mfaEnabled && !mfaVerified) {
        c.set('requiresEnhancedAudit', true);
        console.warn(`User ${userId} accessed resource without MFA verification`);
      }
    }

    await next();
  } catch (error: any) {
    console.error('Optional MFA middleware error:', error);
    // Don't block request on error
    await next();
  }
}

/**
 * Middleware to mark session as MFA-verified after successful verification
 * Called by MFA verification endpoint
 */
export function markMFAVerified(c: Context, next: Next) {
  c.set('mfaVerified', true);
  c.set('mfaVerifiedAt', new Date());
  return next();
}

/**
 * Middleware to check if MFA verification is still valid
 * MFA verification expires after 15 minutes for sensitive operations
 */
export function requireRecentMFA(maxAgeMinutes: number = 15) {
  return async (c: Context, next: Next) => {
    const mfaVerified = c.get('mfaVerified');
    const mfaVerifiedAt = c.get('mfaVerifiedAt');

    if (!mfaVerified || !mfaVerifiedAt) {
      return c.json({
        error: 'Recent MFA verification required',
        requiresMFA: true,
        message: 'This action requires recent multi-factor authentication.',
      }, 403);
    }

    // Check if verification is still fresh
    const now = new Date();
    const verifiedAt = new Date(mfaVerifiedAt);
    const ageMinutes = (now.getTime() - verifiedAt.getTime()) / 60000;

    if (ageMinutes > maxAgeMinutes) {
      return c.json({
        error: 'MFA verification expired',
        requiresMFA: true,
        message: `MFA verification expired. Please verify again (valid for ${maxAgeMinutes} minutes).`,
      }, 403);
    }

    await next();
  };
}

/**
 * Middleware to enforce MFA enrollment for all users
 * Can be enabled organization-wide for enhanced security
 */
export async function enforceMFAEnrollment(c: Context, next: Next) {
  try {
    const userId = c.get('userId');
    const path = c.req.path;

    // Skip enforcement for MFA-related endpoints
    if (path.startsWith('/api/mfa/') || path === '/api/auth/logout') {
      await next();
      return;
    }

    if (userId) {
      const mfaEnabled = await mfaService.isMFAEnabled(userId);

      if (!mfaEnabled) {
        return c.json({
          error: 'MFA enrollment required',
          requiresEnrollment: true,
          message: 'Your organization requires multi-factor authentication. Please enroll to continue.',
          enrollmentUrl: '/api/mfa/enroll',
        }, 403);
      }
    }

    await next();
  } catch (error: any) {
    console.error('MFA enrollment enforcement error:', error);
    // Don't block on error
    await next();
  }
}
