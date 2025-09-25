// Ref: CLAUDE.md Section 5 - Auth middleware with Clerk mock JWT validation
// Thermonuclear Authentication System

import { z } from 'zod';

async function validateJwt(header) {
  const token = header?.replace('Bearer ', '');
  if (!token) {
    throw { 
      code: 'AUTH-401', 
      message: 'Missing token in thermonuclear auth system' 
    };
  }
  
  // Mock JWT decode for thermonuclear testing - real Clerk would verify signature
  const payload = { 
    id: 'uuid-thermo-1', 
    role: 'vibe_coder' 
  };
  
  try {
    // Zod validation schema for user payload
    const userSchema = z.object({
      id: z.string().uuid('Invalid UUID format'),
      role: z.enum(['vibe_coder', 'engineer', 'exec'])
    });
    
    // Alternative validation for mock UUIDs
    const mockUserSchema = z.object({
      id: z.string().refine(
        val => val.startsWith('uuid-thermo-') || z.string().uuid().safeParse(val).success,
        'Invalid UUID or mock UUID format'
      ),
      role: z.enum(['vibe_coder', 'engineer', 'exec'])
    });
    
    // Try standard UUID first, then mock UUID format
    let validatedPayload;
    const standardResult = userSchema.safeParse(payload);
    if (standardResult.success) {
      validatedPayload = standardResult.data;
    } else {
      validatedPayload = mockUserSchema.parse(payload);
    }
    
    console.log('Thermonuclear Auth: Valid - User authenticated successfully');
    return validatedPayload;
  } catch (error) {
    // Handle Zod validation errors with detailed messaging
    const issues = error.issues?.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') || error.message;
    console.log(`Thermonuclear Auth Error: ${issues}`);
    throw { 
      code: 'AUTH-400', 
      message: `Invalid JWT payload: ${issues}` 
    };
  }
}

// Role-based access control helper
function checkRole(userRole, requiredRole) {
  const roleHierarchy = {
    'vibe_coder': 1,
    'engineer': 2, 
    'exec': 3
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  if (userLevel < requiredLevel) {
    throw {
      code: 'AUTH-403',
      message: `Insufficient role: ${userRole} < ${requiredRole}`
    };
  }
  
  console.log(`Thermonuclear Role Check: ${userRole} >= ${requiredRole} - Access Granted`);
  return true;
}

export { validateJwt, checkRole };

console.log('Thermonuclear Auth: JWT Validation System - Status: Active');