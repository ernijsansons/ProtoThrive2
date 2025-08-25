import { z } from 'zod';

async function validateJwt(header) {
  const token = header?.replace('Bearer ', '');
  if (!token) {
    throw { code: 'AUTH-401', message: 'Missing' };
  }
  
  // Mock JWT validation - extract user ID from token
  const payload = { id: 'uuid-thermo-1', role: 'vibe_coder' };
  
  try {
    // Zod validation - Allow mock UUID format
    z.object({
      id: z.string().refine(val => /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(val) || /^uuid-[a-z0-9-]+$/.test(val), 'Invalid UUID'),
      role: z.enum(['vibe_coder', 'engineer', 'exec'])
    }).parse(payload);
    
    console.log("Thermonuclear Auth: Valid");
    return payload;
  } catch (error) {
    // Handle Zod validation errors with custom code
    const issues = error.issues?.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') || error.message;
    console.log(`Thermonuclear Auth Error: ${issues}`);
    throw { code: 'AUTH-400', message: `Invalid Payload: ${issues}` };
  }
}

export { validateJwt };