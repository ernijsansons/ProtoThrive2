import { useState, useEffect, useCallback } from 'react';

// Ultimate Security Utilities
export const ultimateSecurity = {
  // Advanced encryption utilities
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    
    generateKey: async (): Promise<CryptoKey> => {
      return await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
    },
    
    encrypt: async (data: string, key: CryptoKey): Promise<string> => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
      
      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);
      
      return btoa(String.fromCharCode(...combined));
    },
    
    decrypt: async (encryptedData: string, key: CryptoKey): Promise<string> => {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      return new TextDecoder().decode(decrypted);
    }
  },
  
  // Advanced input sanitization
  sanitization: {
    html: (input: string): string => {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    },
    
    sql: (input: string): string => {
      return input.replace(/['";\-]/g, '');
    },
    
    xss: (input: string): string => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
  },
  
  // Advanced rate limiting
  rateLimiting: {
    requests: new Map<string, { count: number; resetTime: number }>(),
    
    isAllowed: (identifier: string, limit: number = 100, windowMs: number = 60000): boolean => {
      const now = Date.now();
      const record = ultimateSecurity.rateLimiting.requests.get(identifier);
      
      if (!record || now > record.resetTime) {
        ultimateSecurity.rateLimiting.requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs
        });
        return true;
      }
      
      if (record.count >= limit) {
        return false;
      }
      
      record.count++;
      return true;
    }
  },
  
  // Advanced session management
  session: {
    create: (data: any, expiryHours: number = 24): string => {
      const session = {
        data,
        created: Date.now(),
        expires: Date.now() + (expiryHours * 60 * 60 * 1000)
      };
      
      return btoa(JSON.stringify(session));
    },
    
    validate: (sessionToken: string): any | null => {
      try {
        const session = JSON.parse(atob(sessionToken));
        
        if (Date.now() > session.expires) {
          return null;
        }
        
        return session.data;
      } catch {
        return null;
      }
    }
  }
};

// Advanced security hooks
export const useUltimateSecurity = () => {
  const [securityLevel, setSecurityLevel] = useState('high');
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  
  useEffect(() => {
    const initializeSecurity = async () => {
      const key = await ultimateSecurity.encryption.generateKey();
      setEncryptionKey(key);
    };
    
    initializeSecurity();
  }, []);
  
  const encryptData = useCallback(async (data: string) => {
    if (!encryptionKey) return data;
    return await ultimateSecurity.encryption.encrypt(data, encryptionKey);
  }, [encryptionKey]);
  
  const decryptData = useCallback(async (encryptedData: string) => {
    if (!encryptionKey) return encryptedData;
    return await ultimateSecurity.encryption.decrypt(encryptedData, encryptionKey);
  }, [encryptionKey]);
  
  return {
    securityLevel,
    setSecurityLevel,
    encryptData,
    decryptData,
    sanitize: ultimateSecurity.sanitization,
    rateLimit: ultimateSecurity.rateLimiting.isAllowed
  };
};
