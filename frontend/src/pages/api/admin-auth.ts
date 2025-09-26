// Ref: CLAUDE.md - Super Admin Authentication (SECURE VERSION)
import type { NextApiRequest, NextApiResponse } from 'next';
import { validateEnvironment, verifyPassword, generateToken, checkRateLimit, createSession } from '../../utils/edge-auth';

// Export edge runtime for Cloudflare Pages compatibility
export const runtime = 'edge';

// SECURITY FIX: Removed hardcoded credentials - use environment variables only

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

  // SECURITY FIX: Enhanced input sanitization and validation
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Invalid password length' });
  }
  
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedPassword = password;

  try {
    const env = validateEnvironment();
    
    // SECURITY FIX: Verify credentials against secure environment variables only
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) {
      console.error('Thermonuclear Security: Admin credentials not configured');
      return res.status(500).json({ error: 'Authentication service not available' });
    }
    
    if (sanitizedEmail === env.ADMIN_EMAIL) {
      const isValidPassword = await verifyPassword(sanitizedPassword, env.ADMIN_PASSWORD_HASH);
      
      if (isValidPassword) {
        // Generate secure JWT token and session
        const token = generateToken({
          id: 'admin-001',
          email: env.ADMIN_EMAIL || 'admin@localhost.dev',
          role: 'super_admin'
        });

        const sessionId = createSession({
          id: 'admin-001',
          email: env.ADMIN_EMAIL || 'admin@localhost.dev',
          role: 'super_admin'
        });

        console.log('Thermonuclear: Super admin authenticated successfully');

        return res.status(200).json({
          success: true,
          token,
          sessionId,
          user: {
            id: 'admin-001',
            email: env.ADMIN_EMAIL || 'admin@localhost.dev',
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
