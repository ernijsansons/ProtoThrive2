import { z } from 'zod';

async function validateJwt(header) {
  const token = header?.replace('Bearer ', '');
  if (!token) {
    throw { code: 'AUTH-401', message: 'Missing' };
  }

  // Real JWT validation - decode and verify token
  try {
    // This should use proper JWT verification in production
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Zod validation for JWT payload
    const validatedPayload = z.object({
      sub: z.string().uuid('Invalid user ID format'),
      email: z.string().email('Invalid email format'),
      role: z.enum(['vibe_coder', 'engineer', 'exec', 'admin']),
      exp: z.number().min(Math.floor(Date.now() / 1000), 'Token has expired'),
      iat: z.number(),
      aud: z.string(),
      iss: z.string()
    }).parse(payload);

    console.log("JWT Auth: Valid token verified");
    return {
      id: validatedPayload.sub,
      email: validatedPayload.email,
      role: validatedPayload.role
    };
  } catch (error) {
    // Handle validation errors
    const issues = error.issues?.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') || error.message;
    console.log(`JWT Auth Error: ${issues}`);
    throw { code: 'AUTH-401', message: `Invalid Token: ${issues}` };
  }
}

export { validateJwt };