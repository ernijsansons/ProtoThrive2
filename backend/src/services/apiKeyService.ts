// Enterprise-grade API Key Management Service
import CryptoJS from 'crypto-js';
import type { Context } from 'hono';
import type { AuthUser } from '../middleware/auth';

interface APIKey {
  id: string;
  service: string;
  masked_key: string;
  created_by: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  permissions: string[];
  expires_at: string | null;
}

interface CreateAPIKeyRequest {
  service: string;
  permissions?: string[];
  expires_in_days?: number;
}

interface APIKeyWithRaw extends APIKey {
  raw_key?: string; // Only returned once at creation
}

export class APIKeyService {
  private env: any;

  constructor(env: any) {
    this.env = env;
  }

  // Generate a new API key
  private generateAPIKey(service: string): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
    return `pk_${service}_${timestamp}_${randomString}`;
  }

  // Encrypt API key for storage
  private encryptAPIKey(rawKey: string): string {
    if (!this.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    return CryptoJS.AES.encrypt(rawKey, this.env.ENCRYPTION_KEY).toString();
  }

  // Decrypt API key from storage
  private decryptAPIKey(encryptedKey: string): string {
    if (!this.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY not configured');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedKey, this.env.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Mask API key for safe display
  private maskAPIKey(rawKey: string): string {
    if (rawKey.length < 8) return '***';
    return `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}`;
  }

  // Generate audit log entry
  private async logAPIKeyEvent(action: string, keyId: string, userId: string, details?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      key_id: keyId,
      user_id: userId,
      details: details || {},
      ip: 'not_tracked', // Could be enhanced to track IP
    };

    try {
      await this.env.KV.put(`audit:apikey:${keyId}:${Date.now()}`, JSON.stringify(logEntry), {
        expirationTtl: 86400 * 365 // 1 year retention
      });
    } catch (error) {
      console.error('Failed to log API key event:', error);
    }
  }

  // Create new API key
  async createAPIKey(request: CreateAPIKeyRequest, user: AuthUser): Promise<APIKeyWithRaw> {
    if (user.role !== 'admin') {
      throw new Error('Only admins can create API keys');
    }

    const keyId = crypto.randomUUID();
    const rawKey = this.generateAPIKey(request.service);
    const encryptedKey = this.encryptAPIKey(rawKey);
    const maskedKey = this.maskAPIKey(rawKey);

    const expiresAt = request.expires_in_days
      ? new Date(Date.now() + (request.expires_in_days * 24 * 60 * 60 * 1000)).toISOString()
      : null;

    const apiKey: APIKey = {
      id: keyId,
      service: request.service,
      masked_key: maskedKey,
      created_by: user.id,
      created_at: new Date().toISOString(),
      last_used: null,
      is_active: true,
      permissions: request.permissions || [],
      expires_at: expiresAt
    };

    // Store encrypted key separately from metadata
    await this.env.KV.put(`apikey:${keyId}:encrypted`, encryptedKey);
    await this.env.KV.put(`apikey:${keyId}:metadata`, JSON.stringify(apiKey));

    // Store key ID in service index for lookups
    const serviceKeys = await this.getServiceKeys(request.service);
    serviceKeys.push(keyId);
    await this.env.KV.put(`apikey:service:${request.service}`, JSON.stringify(serviceKeys));

    // Log creation
    await this.logAPIKeyEvent('created', keyId, user.id, {
      service: request.service,
      permissions: request.permissions,
      expires_at: expiresAt
    });

    console.log(`API Key created: ${keyId} for service ${request.service} by user ${user.id}`);

    return {
      ...apiKey,
      raw_key: rawKey // Only returned once
    };
  }

  // List API keys (admin only)
  async listAPIKeys(user: AuthUser): Promise<APIKey[]> {
    if (user.role !== 'admin') {
      throw new Error('Only admins can list API keys');
    }

    const keys: APIKey[] = [];

    try {
      // This is a simplified implementation - in production, you'd want pagination
      const allKeys = await this.env.KV.list({ prefix: 'apikey:' });

      for (const key of allKeys.keys) {
        if (key.name.endsWith(':metadata')) {
          const metadata = await this.env.KV.get(key.name);
          if (metadata) {
            keys.push(JSON.parse(metadata));
          }
        }
      }

      return keys.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error listing API keys:', error);
      throw new Error('Failed to list API keys');
    }
  }

  // Get service keys
  private async getServiceKeys(service: string): Promise<string[]> {
    const keys = await this.env.KV.get(`apikey:service:${service}`);
    return keys ? JSON.parse(keys) : [];
  }

  // Validate API key
  async validateAPIKey(rawKey: string): Promise<APIKey | null> {
    try {
      // Extract key ID from the key format if possible, or search
      // This is a simplified lookup - production might use hashing for better performance
      const allKeys = await this.env.KV.list({ prefix: 'apikey:' });

      for (const key of allKeys.keys) {
        if (key.name.endsWith(':encrypted')) {
          const encryptedKey = await this.env.KV.get(key.name);
          if (encryptedKey) {
            try {
              const decryptedKey = this.decryptAPIKey(encryptedKey);
              if (decryptedKey === rawKey) {
                const keyId = key.name.split(':')[1];
                const metadata = await this.env.KV.get(`apikey:${keyId}:metadata`);

                if (metadata) {
                  const apiKey: APIKey = JSON.parse(metadata);

                  // Check if key is active and not expired
                  if (!apiKey.is_active) {
                    return null;
                  }

                  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
                    return null;
                  }

                  // Update last used timestamp
                  apiKey.last_used = new Date().toISOString();
                  await this.env.KV.put(`apikey:${keyId}:metadata`, JSON.stringify(apiKey));

                  // Log usage
                  await this.logAPIKeyEvent('used', keyId, 'system', { endpoint: 'auth' });

                  return apiKey;
                }
              }
            } catch (decryptError) {
              // Continue searching - this key might be corrupted
              console.warn('Failed to decrypt API key:', decryptError);
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  // Deactivate API key
  async deactivateAPIKey(keyId: string, user: AuthUser): Promise<boolean> {
    if (user.role !== 'admin') {
      throw new Error('Only admins can deactivate API keys');
    }

    try {
      const metadata = await this.env.KV.get(`apikey:${keyId}:metadata`);
      if (!metadata) {
        throw new Error('API key not found');
      }

      const apiKey: APIKey = JSON.parse(metadata);
      apiKey.is_active = false;

      await this.env.KV.put(`apikey:${keyId}:metadata`, JSON.stringify(apiKey));

      // Log deactivation
      await this.logAPIKeyEvent('deactivated', keyId, user.id);

      console.log(`API Key deactivated: ${keyId} by user ${user.id}`);

      return true;
    } catch (error) {
      console.error('Error deactivating API key:', error);
      return false;
    }
  }

  // Rotate API key (generate new key, keep same metadata)
  async rotateAPIKey(keyId: string, user: AuthUser): Promise<APIKeyWithRaw> {
    if (user.role !== 'admin') {
      throw new Error('Only admins can rotate API keys');
    }

    try {
      const metadata = await this.env.KV.get(`apikey:${keyId}:metadata`);
      if (!metadata) {
        throw new Error('API key not found');
      }

      const apiKey: APIKey = JSON.parse(metadata);
      const newRawKey = this.generateAPIKey(apiKey.service);
      const newEncryptedKey = this.encryptAPIKey(newRawKey);
      const newMaskedKey = this.maskAPIKey(newRawKey);

      // Update key data
      apiKey.masked_key = newMaskedKey;
      apiKey.last_used = null; // Reset usage

      // Store new encrypted key and metadata
      await this.env.KV.put(`apikey:${keyId}:encrypted`, newEncryptedKey);
      await this.env.KV.put(`apikey:${keyId}:metadata`, JSON.stringify(apiKey));

      // Log rotation
      await this.logAPIKeyEvent('rotated', keyId, user.id);

      console.log(`API Key rotated: ${keyId} by user ${user.id}`);

      return {
        ...apiKey,
        raw_key: newRawKey // Return new key once
      };
    } catch (error) {
      console.error('Error rotating API key:', error);
      throw new Error('Failed to rotate API key');
    }
  }

  // Get API key audit log
  async getAPIKeyAuditLog(keyId: string, user: AuthUser): Promise<any[]> {
    if (user.role !== 'admin') {
      throw new Error('Only admins can view audit logs');
    }

    try {
      const auditEntries: any[] = [];
      const auditKeys = await this.env.KV.list({ prefix: `audit:apikey:${keyId}:` });

      for (const key of auditKeys.keys) {
        const entry = await this.env.KV.get(key.name);
        if (entry) {
          auditEntries.push(JSON.parse(entry));
        }
      }

      return auditEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw new Error('Failed to fetch audit log');
    }
  }
}