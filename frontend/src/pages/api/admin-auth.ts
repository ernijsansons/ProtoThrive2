// Ref: CLAUDE.md - Super Admin Authentication (SECURE VERSION)
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEnvironment, verifyPassword, generateToken, checkRateLimit, createSession } from '../../utils/edge-auth';

// Export edge runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

// Mock super admin credentials - in production, use proper auth service
const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@protothrive.com',
  password: 'ThermonuclearAdmin2025!' // In production, this would be hashed
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP as string)) {
    return res.status(429).json({ error: 'Too many login attempts' });
  }

  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Basic input sanitization (Edge Runtime compatible)
  const sanitizedEmail = email.replace(/[<>"'&]/g, '');
  const sanitizedPassword = password.replace(/[<>"'&]/g, '');

  try {
    const env = validateEnvironment();
    
    // Verify credentials against environment variables
    if (sanitizedEmail === env.ADMIN_EMAIL && env.ADMIN_PASSWORD_HASH) {
      const isValidPassword = await verifyPassword(sanitizedPassword, env.ADMIN_PASSWORD_HASH);
      
      if (isValidPassword) {
        // Generate secure JWT token and session
        const token = generateToken({
          id: 'admin-001',
          email: env.ADMIN_EMAIL || 'admin@protothrive.com',
          role: 'super_admin'
        });

        const sessionId = createSession({
          id: 'admin-001',
          email: env.ADMIN_EMAIL || 'admin@protothrive.com',
          role: 'super_admin'
        });

        console.log('Thermonuclear: Super admin authenticated successfully');

        return res.status(200).json({
          success: true,
          token,
          sessionId,
          user: {
            id: 'admin-001',
            email: env.ADMIN_EMAIL || 'admin@protothrive.com',
            role: 'super_admin'
          }
        });
      }
    }

    console.log('Thermonuclear: Failed admin authentication attempt');
    return res.status(401).json({ error: 'Invalid credentials' });
    
  } catch (error) {
    console.error('Thermonuclear Security Error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
}
