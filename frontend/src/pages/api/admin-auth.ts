// Ref: CLAUDE.md - Super Admin Authentication
import type { NextApiRequest, NextApiResponse } from 'next';

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

  const { email, password } = req.body;

  // Validate credentials
  if (email === SUPER_ADMIN_CREDENTIALS.email && password === SUPER_ADMIN_CREDENTIALS.password) {
    // Generate a mock token (in production, use proper JWT)
    const token = Buffer.from(`super_admin:${Date.now()}`).toString('base64');
    
    console.log('Thermonuclear: Super admin authenticated successfully');
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: 'admin-001',
        email: SUPER_ADMIN_CREDENTIALS.email,
        role: 'super_admin'
      }
    });
  }

  console.log('Thermonuclear: Failed admin authentication attempt');
  return res.status(401).json({ error: 'Invalid credentials' });
}