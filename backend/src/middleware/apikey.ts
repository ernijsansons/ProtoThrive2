// API Key Authentication Middleware
import type { Context, Next } from 'hono';
import { APIKeyService } from '../services/apiKeyService';
import type { AuthUser } from './auth';

type Bindings = {
  KV: any;
  ENCRYPTION_KEY?: string;
}

type Variables = {
  user: AuthUser;
  apiKey?: any;
}

// API Key authentication middleware
export async function validateAPIKeyMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');

  // Check for API key in header
  const apiKey = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : apiKeyHeader;

  if (!apiKey) {
    return c.json({
      error: 'API_KEY_REQUIRED',
      message: 'API key required for this endpoint'
    }, 401);
  }

  try {
    const apiKeyService = new APIKeyService(c.env);
    const validatedKey = await apiKeyService.validateAPIKey(apiKey);

    if (!validatedKey) {
      console.warn('Invalid API key attempt');
      return c.json({
        error: 'INVALID_API_KEY',
        message: 'Invalid or expired API key'
      }, 401);
    }

    // Create a user context from API key
    const user: AuthUser = {
      id: validatedKey.created_by,
      email: 'api-key-user@system',
      role: 'admin', // API keys currently have admin privileges
      permissions: validatedKey.permissions
    };

    c.set('user', user);
    c.set('apiKey', validatedKey);

    console.log(`API Key authenticated: ${validatedKey.id} for service ${validatedKey.service}`);

  } catch (error) {
    console.error('API key validation error:', error);
    return c.json({
      error: 'AUTH_ERROR',
      message: 'Authentication failed'
    }, 500);
  }

  await next();
}

// Check API key permissions
export function requireAPIKeyPermission(requiredPermissions: string[]) {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const apiKey = c.get('apiKey');

    if (!apiKey) {
      return c.json({
        error: 'NO_API_KEY',
        message: 'API key context not found'
      }, 401);
    }

    const hasPermission = requiredPermissions.every(permission =>
      apiKey.permissions.includes(permission) || apiKey.permissions.includes('*')
    );

    if (!hasPermission) {
      console.warn(`API key ${apiKey.id} lacks required permissions: ${requiredPermissions.join(', ')}`);
      return c.json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'API key lacks required permissions',
        required: requiredPermissions,
        granted: apiKey.permissions
      }, 403);
    }

    await next();
  };
}