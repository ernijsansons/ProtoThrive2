/**
 * MFA/2FA API Routes
 * Endpoints for multi-factor authentication enrollment and verification
 */

import { Hono } from 'hono';
import { mfaService } from '../services/mfa.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';

const mfaRouter = new Hono();

// Request validation schemas
const enrollMFASchema = z.object({
  email: z.string().email(),
});

const verifyEnrollmentSchema = z.object({
  secret: z.string().min(16),
  token: z.string().regex(/^\d{6}$/, 'Token must be 6 digits'),
});

const verifyMFASchema = z.object({
  token: z.string().regex(/^[A-Z0-9]{6,8}$/, 'Invalid token format'),
  useBackupCode: z.boolean().optional(),
});

const disableMFASchema = z.object({
  password: z.string().min(1, 'Password required for MFA disable'),
});

/**
 * POST /api/mfa/enroll
 * Initiate MFA enrollment - generate secret and QR code
 */
mfaRouter.post('/enroll', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const userEmail = c.get('userEmail');

    // Check if MFA already enabled
    const mfaEnabled = await mfaService.isMFAEnabled(userId);
    if (mfaEnabled) {
      return c.json({
        error: 'MFA is already enabled for this account',
      }, 400);
    }

    // Generate MFA secret and QR code
    const mfaSecret = await mfaService.generateMFASecret(userId, userEmail);

    // Log security event
    await logSecurityEvent(userId, 'mfa_enrollment_initiated', {
      timestamp: new Date().toISOString(),
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    });

    return c.json({
      success: true,
      data: {
        secret: mfaSecret.secret,
        qrCode: mfaSecret.qrCode,
        backupCodes: mfaSecret.backupCodes,
        message: 'Scan the QR code with your authenticator app and verify with a code',
      },
    });
  } catch (error: any) {
    console.error('MFA enrollment error:', error);
    return c.json({
      error: 'Failed to initiate MFA enrollment',
      details: error.message,
    }, 500);
  }
});

/**
 * POST /api/mfa/verify-enrollment
 * Complete MFA enrollment by verifying TOTP code
 */
mfaRouter.post('/verify-enrollment', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Validate request
    const validation = verifyEnrollmentSchema.safeParse(body);
    if (!validation.success) {
      return c.json({
        error: 'Invalid request data',
        details: validation.error.errors,
      }, 400);
    }

    const { secret, token } = validation.data;

    // Verify TOTP code
    const verificationResult = await mfaService.verifyTOTP(userId, secret, token, false);

    if (!verificationResult.valid) {
      return c.json({
        error: verificationResult.error || 'Invalid verification code',
      }, 401);
    }

    // Enable MFA for user
    const backupCodes = await mfaService.regenerateBackupCodes(userId);
    await mfaService.enableMFA(userId, secret, backupCodes);

    // Log security event
    await logSecurityEvent(userId, 'mfa_enabled', {
      timestamp: new Date().toISOString(),
      ip: c.req.header('cf-connecting-ip'),
    });

    return c.json({
      success: true,
      message: 'MFA successfully enabled',
      backupCodes: backupCodes,
      warning: 'Save these backup codes in a secure location. You will not be able to view them again.',
    });
  } catch (error: any) {
    console.error('MFA verification error:', error);
    return c.json({
      error: 'Failed to verify MFA enrollment',
      details: error.message,
    }, 500);
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA code during login
 */
mfaRouter.post('/verify', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Validate request
    const validation = verifyMFASchema.safeParse(body);
    if (!validation.success) {
      return c.json({
        error: 'Invalid request data',
        details: validation.error.errors,
      }, 400);
    }

    const { token, useBackupCode = false } = validation.data;

    // Get user's MFA secret
    const mfaData = await getMFAData(userId);
    if (!mfaData || !mfaData.enabled) {
      return c.json({
        error: 'MFA is not enabled for this account',
      }, 400);
    }

    // Verify TOTP code or backup code
    const verificationResult = await mfaService.verifyTOTP(
      userId,
      mfaData.secret,
      token,
      useBackupCode
    );

    if (!verificationResult.valid) {
      // Log failed attempt
      await logSecurityEvent(userId, 'mfa_verification_failed', {
        timestamp: new Date().toISOString(),
        ip: c.req.header('cf-connecting-ip'),
        error: verificationResult.error,
      });

      return c.json({
        error: verificationResult.error || 'Invalid MFA code',
      }, 401);
    }

    // Log successful verification
    await logSecurityEvent(userId, 'mfa_verification_success', {
      timestamp: new Date().toISOString(),
      ip: c.req.header('cf-connecting-ip'),
      usedBackupCode: verificationResult.usedBackupCode,
    });

    // Warn if backup codes running low
    if (verificationResult.usedBackupCode && verificationResult.remainingBackupCodes! < 3) {
      return c.json({
        success: true,
        verified: true,
        warning: `Only ${verificationResult.remainingBackupCodes} backup codes remaining. Consider regenerating them.`,
        remainingBackupCodes: verificationResult.remainingBackupCodes,
      });
    }

    return c.json({
      success: true,
      verified: true,
    });
  } catch (error: any) {
    console.error('MFA verification error:', error);
    return c.json({
      error: 'Failed to verify MFA code',
      details: error.message,
    }, 500);
  }
});

/**
 * POST /api/mfa/disable
 * Disable MFA (requires password re-authentication)
 */
mfaRouter.post('/disable', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    // Validate request
    const validation = disableMFASchema.safeParse(body);
    if (!validation.success) {
      return c.json({
        error: 'Password required to disable MFA',
        details: validation.error.errors,
      }, 400);
    }

    const { password } = validation.data;

    // Verify password (re-authentication required for sensitive operation)
    const passwordValid = await verifyUserPassword(userId, password);
    if (!passwordValid) {
      return c.json({
        error: 'Invalid password',
      }, 401);
    }

    // Check if MFA is enabled
    const mfaEnabled = await mfaService.isMFAEnabled(userId);
    if (!mfaEnabled) {
      return c.json({
        error: 'MFA is not enabled for this account',
      }, 400);
    }

    // Disable MFA
    await mfaService.disableMFA(userId);

    // Log security event
    await logSecurityEvent(userId, 'mfa_disabled', {
      timestamp: new Date().toISOString(),
      ip: c.req.header('cf-connecting-ip'),
    });

    return c.json({
      success: true,
      message: 'MFA has been disabled',
    });
  } catch (error: any) {
    console.error('MFA disable error:', error);
    return c.json({
      error: 'Failed to disable MFA',
      details: error.message,
    }, 500);
  }
});

/**
 * POST /api/mfa/regenerate-backup-codes
 * Generate new backup codes (invalidates old ones)
 */
mfaRouter.post('/regenerate-backup-codes', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    // Check if MFA is enabled
    const mfaEnabled = await mfaService.isMFAEnabled(userId);
    if (!mfaEnabled) {
      return c.json({
        error: 'MFA is not enabled for this account',
      }, 400);
    }

    // Generate new backup codes
    const newBackupCodes = await mfaService.regenerateBackupCodes(userId);

    // Log security event
    await logSecurityEvent(userId, 'backup_codes_regenerated', {
      timestamp: new Date().toISOString(),
      ip: c.req.header('cf-connecting-ip'),
    });

    return c.json({
      success: true,
      backupCodes: newBackupCodes,
      message: 'New backup codes generated. Old codes are now invalid.',
      warning: 'Save these codes in a secure location.',
    });
  } catch (error: any) {
    console.error('Backup code regeneration error:', error);
    return c.json({
      error: 'Failed to regenerate backup codes',
      details: error.message,
    }, 500);
  }
});

/**
 * GET /api/mfa/status
 * Check if MFA is enabled for current user
 */
mfaRouter.get('/status', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const mfaEnabled = await mfaService.isMFAEnabled(userId);

    return c.json({
      enabled: mfaEnabled,
      requiresSetup: !mfaEnabled,
    });
  } catch (error: any) {
    console.error('MFA status check error:', error);
    return c.json({
      error: 'Failed to check MFA status',
      details: error.message,
    }, 500);
  }
});

// Helper functions (would integrate with actual services)
async function logSecurityEvent(userId: string, eventType: string, metadata: any): Promise<void> {
  // Would insert into mfa_events table in database
  console.log(`[SECURITY EVENT] ${eventType}:`, { userId, ...metadata });
}

async function getMFAData(userId: string): Promise<{ enabled: boolean; secret: string } | null> {
  // Would query D1 database for user's MFA data
  // SELECT mfa_enabled, totp_secret FROM users WHERE id = ?
  return null;
}

async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  // Would verify password against stored hash
  // SELECT password_hash FROM users WHERE id = ?
  // Then compare with pbkdf2
  return true;
}

export default mfaRouter;
