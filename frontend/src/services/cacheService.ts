// Ref: CLAUDE.md - Enterprise-Grade Caching Service for ProtoThrive
import { rateLimiter } from '../utils/security';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of entries
  staleWhileRevalidate: boolean;
  compression: boolean;
  encryption: boolean;
  namespace: string;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Size in bytes
  compressed: boolean;
  encrypted: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  totalSize: number; // bytes
  evictions: number;
  operations: number;
  averageAccessTime: number; // ms
  memoryUsage: number; // bytes
  compressionRatio: number;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'cloudflare' | 'browser';
  priority: number;
  maxSize: number;
  ttl: number;
  available: boolean;
}

export class CacheService {
  private layers: Map<string, CacheLayer> = new Map();
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    totalSize: 0,
    evictions: 0,
    operations: 0,
    averageAccessTime: 0,
    memoryUsage: 0,
    compressionRatio: 1,
  };
  private accessTimes: number[] = [];
  private config: CacheConfig;
  private compressionWorker?: Worker;
  private encryptionKey?: CryptoKey;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 3600, // 1 hour default
      maxSize: 1000, // 1000 entries default
      staleWhileRevalidate: true,
      compression: true,
      encryption: false,
      namespace: 'protothrive',
      ...config,
    };

    this.initializeLayers();
    this.setupCleanupInterval();

    if (this.config.compression) {
      this.initializeCompression();
    }

    if (this.config.encryption) {
      this.initializeEncryption();
    }

    console.log('Thermonuclear Cache Service initialized with multi-layer architecture');
  }

  private initializeLayers() {
    // Memory layer (fastest)
    this.layers.set('memory', {
      name: 'Memory',
      type: 'memory',
      priority: 1,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      available: true,
    });

    // Browser storage layer
    if (typeof window !== 'undefined' && window.localStorage) {
      this.layers.set('browser', {
        name: 'Browser Storage',
        type: 'browser',
        priority: 2,
        maxSize: 50, // Limited browser storage
        ttl: this.config.ttl * 24, // Longer TTL for browser
        available: true,
      });
    }

    // Redis layer (if available in production)
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      this.layers.set('redis', {
        name: 'Redis',
        type: 'redis',
        priority: 3,
        maxSize: 10000,
        ttl: this.config.ttl * 7, // Week-long storage
        available: true,
      });
    }

    // Cloudflare KV layer (if available)
    if (process.env.NODE_ENV === 'production' && process.env.CF_ACCOUNT_ID) {
      this.layers.set('cloudflare', {
        name: 'Cloudflare KV',
        type: 'cloudflare',
        priority: 4,
        maxSize: 100000,
        ttl: this.config.ttl * 30, // Month-long storage
        available: true,
      });
    }
  }

  private setupCleanupInterval() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanup();
      this.updateStats();
    }, 5 * 60 * 1000);
  }

  private async initializeCompression() {
    // Use CompressionStream if available (modern browsers)
    if (typeof window !== 'undefined' && 'CompressionStream' in window) {
      console.log('Thermonuclear Cache: Compression streams available');
    } else {
      // Fallback to Web Worker compression
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { action, data, id } = e.data;

            if (action === 'compress') {
              // Simple compression simulation (in real implementation, use pako or similar)
              const compressed = JSON.stringify(data);
              self.postMessage({ action: 'compressed', data: compressed, id });
            } else if (action === 'decompress') {
              try {
                const decompressed = JSON.parse(data);
                self.postMessage({ action: 'decompressed', data: decompressed, id });
              } catch (error) {
                self.postMessage({ action: 'error', error: error.message, id });
              }
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
        console.log('Thermonuclear Cache: Compression worker initialized');
      } catch (error) {
        console.warn('Thermonuclear Cache: Failed to initialize compression worker:', error);
      }
    }
  }

  private async initializeEncryption() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
        console.log('Thermonuclear Cache: Encryption initialized');
      } catch (error) {
        console.warn('Thermonuclear Cache: Failed to initialize encryption:', error);
      }
    }
  }

  // Core cache operations
  async get<T>(key: string, options: {
    layer?: string;
    skipStale?: boolean;
    tags?: string[];
  } = {}): Promise<T | null> {
    const startTime = performance.now();
    this.stats.operations++;

    try {
      const fullKey = `${this.config.namespace}:${key}`;

      // Try layers in priority order
      const sortedLayers = Array.from(this.layers.values()).sort((a, b) => a.priority - b.priority);

      for (const layer of sortedLayers) {
        if (options.layer && layer.name !== options.layer) continue;
        if (!layer.available) continue;

        const entry = await this.getFromLayer(fullKey, layer);

        if (entry) {
          // Check if entry is expired
          const isExpired = Date.now() - entry.timestamp > entry.ttl * 1000;

          if (!isExpired || (!options.skipStale && this.config.staleWhileRevalidate)) {
            // Update access statistics
            entry.accessCount++;
            entry.lastAccessed = Date.now();

            this.stats.hits++;
            this.recordAccessTime(performance.now() - startTime);

            // If stale, trigger background refresh
            if (isExpired && this.config.staleWhileRevalidate) {
              this.triggerBackgroundRefresh(key);
            }

            return await this.deserializeValue(entry.value, entry);
          }
        }
      }

      // Cache miss
      this.stats.misses++;
      this.recordAccessTime(performance.now() - startTime);
      return null;
    } catch (error) {
      console.error('Thermonuclear Cache: Get operation failed:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options: {
    ttl?: number;
    layer?: string;
    tags?: string[];
    compress?: boolean;
    encrypt?: boolean;
    metadata?: Record<string, any>;
  } = {}): Promise<boolean> {
    const startTime = performance.now();
    this.stats.operations++;

    try {
      const fullKey = `${this.config.namespace}:${key}`;
      const ttl = options.ttl || this.config.ttl;

      const serializedValue = await this.serializeValue(value, {
        compress: options.compress ?? this.config.compression,
        encrypt: options.encrypt ?? this.config.encryption,
      });

      const entry: CacheEntry<T> = {
        key: fullKey,
        value: serializedValue,
        timestamp: Date.now(),
        ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(serializedValue),
        compressed: options.compress ?? this.config.compression,
        encrypted: options.encrypt ?? this.config.encryption,
        tags: options.tags || [],
        metadata: options.metadata || {},
      };

      // Set in specified layer or all available layers
      const targetLayers = options.layer
        ? [this.layers.get(options.layer)].filter(Boolean)
        : Array.from(this.layers.values()).filter(layer => layer.available);

      let success = false;
      for (const layer of targetLayers) {
        if (await this.setToLayer(fullKey, entry, layer!)) {
          success = true;
        }
      }

      if (success) {
        this.stats.totalKeys++;
        this.stats.totalSize += entry.size;
        this.recordAccessTime(performance.now() - startTime);
      }

      return success;
    } catch (error) {
      console.error('Thermonuclear Cache: Set operation failed:', error);
      return false;
    }
  }

  async delete(key: string, options: {
    layer?: string;
    tags?: string[];
  } = {}): Promise<boolean> {
    const fullKey = `${this.config.namespace}:${key}`;

    const targetLayers = options.layer
      ? [this.layers.get(options.layer)].filter(Boolean)
      : Array.from(this.layers.values()).filter(layer => layer.available);

    let success = false;
    for (const layer of targetLayers) {
      if (await this.deleteFromLayer(fullKey, layer!)) {
        success = true;
      }
    }

    return success;
  }

  async clear(options: {
    layer?: string;
    tags?: string[];
    namespace?: string;
  } = {}): Promise<boolean> {
    const targetLayers = options.layer
      ? [this.layers.get(options.layer)].filter(Boolean)
      : Array.from(this.layers.values()).filter(layer => layer.available);

    let success = false;
    for (const layer of targetLayers) {
      if (await this.clearLayer(layer!, options)) {
        success = true;
      }
    }

    if (success) {
      this.resetStats();
    }

    return success;
  }

  // Advanced operations
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    // Batch get operations for better performance
    const promises = keys.map(async key => {
      const value = await this.get<T>(key);
      return { key, value };
    });

    const resolved = await Promise.all(promises);
    resolved.forEach(({ key, value }) => {
      results.set(key, value);
    });

    return results;
  }

  async mset<T>(entries: Map<string, T>, options: {
    ttl?: number;
    layer?: string;
  } = {}): Promise<boolean> {
    const promises = Array.from(entries.entries()).map(([key, value]) =>
      this.set(key, value, options)
    );

    const results = await Promise.all(promises);
    return results.every(result => result);
  }

  async getByTags<T>(tags: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    // Search through memory cache first
    for (const [key, entry] of this.memoryCache) {
      if (tags.some(tag => entry.tags.includes(tag))) {
        const value = await this.deserializeValue(entry.value, entry);
        if (value !== null) {
          results.set(key.replace(`${this.config.namespace}:`, ''), value);
        }
      }
    }

    return results;
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0;

    // Invalidate from all layers
    for (const layer of this.layers.values()) {
      if (!layer.available) continue;

      if (layer.type === 'memory') {
        const keysToDelete: string[] = [];
        for (const [key, entry] of this.memoryCache) {
          if (tags.some(tag => entry.tags.includes(tag))) {
            keysToDelete.push(key);
          }
        }

        for (const key of keysToDelete) {
          this.memoryCache.delete(key);
          invalidated++;
        }
      }
      // Add logic for other layers if needed
    }

    return invalidated;
  }

  // Layer-specific operations
  private async getFromLayer(key: string, layer: CacheLayer): Promise<CacheEntry | null> {
    switch (layer.type) {
      case 'memory':
        return this.memoryCache.get(key) || null;

      case 'browser':
        return this.getBrowserCache(key);

      case 'redis':
        return this.getRedisCache(key);

      case 'cloudflare':
        return this.getCloudflareCache(key);

      default:
        return null;
    }
  }

  private async setToLayer(key: string, entry: CacheEntry, layer: CacheLayer): Promise<boolean> {
    // Check size limits
    if (this.getLayerSize(layer) >= layer.maxSize) {
      await this.evictFromLayer(layer);
    }

    switch (layer.type) {
      case 'memory':
        this.memoryCache.set(key, entry);
        return true;

      case 'browser':
        return this.setBrowserCache(key, entry);

      case 'redis':
        return this.setRedisCache(key, entry);

      case 'cloudflare':
        return this.setCloudflareCache(key, entry);

      default:
        return false;
    }
  }

  private async deleteFromLayer(key: string, layer: CacheLayer): Promise<boolean> {
    switch (layer.type) {
      case 'memory':
        return this.memoryCache.delete(key);

      case 'browser':
        return this.deleteBrowserCache(key);

      case 'redis':
        return this.deleteRedisCache(key);

      case 'cloudflare':
        return this.deleteCloudflareCache(key);

      default:
        return false;
    }
  }

  private async clearLayer(layer: CacheLayer, options: any): Promise<boolean> {
    switch (layer.type) {
      case 'memory':
        this.memoryCache.clear();
        return true;

      case 'browser':
        return this.clearBrowserCache(options);

      case 'redis':
        return this.clearRedisCache(options);

      case 'cloudflare':
        return this.clearCloudflareCache(options);

      default:
        return false;
    }
  }

  // Browser storage implementation
  private getBrowserCache(key: string): CacheEntry | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setBrowserCache(key: string, entry: CacheEntry): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch {
      return false;
    }
  }

  private deleteBrowserCache(key: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  private clearBrowserCache(options: any): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(options.namespace || this.config.namespace)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch {
      return false;
    }
  }

  // Redis implementation (mock for development)
  private async getRedisCache(key: string): Promise<CacheEntry | null> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Redis GET ${key}`);
    return null;
  }

  private async setRedisCache(key: string, entry: CacheEntry): Promise<boolean> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Redis SET ${key}`);
    return true;
  }

  private async deleteRedisCache(key: string): Promise<boolean> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Redis DEL ${key}`);
    return true;
  }

  private async clearRedisCache(options: any): Promise<boolean> {
    // Mock implementation
    console.log('Thermonuclear Cache: Redis FLUSHALL');
    return true;
  }

  // Cloudflare KV implementation (mock for development)
  private async getCloudflareCache(key: string): Promise<CacheEntry | null> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Cloudflare KV GET ${key}`);
    return null;
  }

  private async setCloudflareCache(key: string, entry: CacheEntry): Promise<boolean> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Cloudflare KV PUT ${key}`);
    return true;
  }

  private async deleteCloudflareCache(key: string): Promise<boolean> {
    // Mock implementation
    console.log(`Thermonuclear Cache: Cloudflare KV DELETE ${key}`);
    return true;
  }

  private async clearCloudflareCache(options: any): Promise<boolean> {
    // Mock implementation
    console.log('Thermonuclear Cache: Cloudflare KV PURGE');
    return true;
  }

  // Utility methods
  private async serializeValue(value: any, options: {
    compress: boolean;
    encrypt: boolean;
  }): Promise<any> {
    let serialized = value;

    // Compression
    if (options.compress && this.compressionWorker) {
      try {
        serialized = await this.compress(serialized);
      } catch (error) {
        console.warn('Thermonuclear Cache: Compression failed:', error);
      }
    }

    // Encryption
    if (options.encrypt && this.encryptionKey) {
      try {
        serialized = await this.encrypt(serialized);
      } catch (error) {
        console.warn('Thermonuclear Cache: Encryption failed:', error);
      }
    }

    return serialized;
  }

  private async deserializeValue(value: any, entry: CacheEntry): Promise<any> {
    let deserialized = value;

    // Decryption
    if (entry.encrypted && this.encryptionKey) {
      try {
        deserialized = await this.decrypt(deserialized);
      } catch (error) {
        console.warn('Thermonuclear Cache: Decryption failed:', error);
        return null;
      }
    }

    // Decompression
    if (entry.compressed && this.compressionWorker) {
      try {
        deserialized = await this.decompress(deserialized);
      } catch (error) {
        console.warn('Thermonuclear Cache: Decompression failed:', error);
        return null;
      }
    }

    return deserialized;
  }

  private async compress(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        resolve(JSON.stringify(data));
        return;
      }

      const id = Math.random().toString(36);

      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handler);
          if (e.data.action === 'compressed') {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ action: 'compress', data, id });
    });
  }

  private async decompress(data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.compressionWorker) {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
        return;
      }

      const id = Math.random().toString(36);

      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handler);
          if (e.data.action === 'decompressed') {
            resolve(e.data.data);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      this.compressionWorker.addEventListener('message', handler);
      this.compressionWorker.postMessage({ action: 'decompress', data, id });
    });
  }

  private async encrypt(data: any): Promise<ArrayBuffer> {
    if (!this.encryptionKey) throw new Error('Encryption key not available');

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return combined.buffer;
  }

  private async decrypt(encryptedData: ArrayBuffer): Promise<any> {
    if (!this.encryptionKey) throw new Error('Encryption key not available');

    const data = new Uint8Array(encryptedData);
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);
    return JSON.parse(jsonString);
  }

  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  private getLayerSize(layer: CacheLayer): number {
    switch (layer.type) {
      case 'memory':
        return this.memoryCache.size;
      case 'browser':
        // Approximate size calculation for browser storage
        let size = 0;
        if (typeof window !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.config.namespace)) {
              size++;
            }
          }
        }
        return size;
      default:
        return 0;
    }
  }

  private async evictFromLayer(layer: CacheLayer): Promise<void> {
    // LRU eviction strategy
    if (layer.type === 'memory') {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      // Remove oldest 10% of entries
      const toRemove = Math.ceil(entries.length * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
        this.stats.evictions++;
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Clean up memory cache
    for (const [key, entry] of this.memoryCache) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    });

    console.log(`Thermonuclear Cache: Cleaned up ${expiredKeys.length} expired entries`);
  }

  private triggerBackgroundRefresh(key: string): void {
    // Placeholder for background refresh logic
    console.log(`Thermonuclear Cache: Background refresh triggered for ${key}`);
  }

  private recordAccessTime(time: number): void {
    this.accessTimes.push(time);
    if (this.accessTimes.length > 1000) {
      this.accessTimes = this.accessTimes.slice(-1000); // Keep last 1000 measurements
    }
  }

  private updateStats(): void {
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    this.stats.averageAccessTime = this.accessTimes.reduce((a, b) => a + b, 0) / this.accessTimes.length || 0;
    this.stats.totalKeys = this.memoryCache.size;
    this.stats.memoryUsage = Array.from(this.memoryCache.values()).reduce((sum, entry) => sum + entry.size, 0);
  }

  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      totalSize: 0,
      evictions: 0,
      operations: 0,
      averageAccessTime: 0,
      memoryUsage: 0,
      compressionRatio: 1,
    };
    this.accessTimes = [];
  }

  // Public API for monitoring
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  getLayers(): CacheLayer[] {
    return Array.from(this.layers.values());
  }

  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    layers: Array<{ name: string; available: boolean; health: string }>;
    performance: {
      hitRate: number;
      averageResponseTime: number;
      memoryUsage: number;
    };
  } {
    const stats = this.getStats();
    const layerHealth = Array.from(this.layers.values()).map(layer => ({
      name: layer.name,
      available: layer.available,
      health: layer.available ? 'healthy' : 'down',
    }));

    const availableLayers = layerHealth.filter(l => l.available).length;
    const status = availableLayers === 0 ? 'unhealthy' :
                  availableLayers < this.layers.size ? 'degraded' : 'healthy';

    return {
      status,
      layers: layerHealth,
      performance: {
        hitRate: stats.hitRate,
        averageResponseTime: stats.averageAccessTime,
        memoryUsage: stats.memoryUsage,
      },
    };
  }

  // Warmup cache with common data
  async warmup(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    console.log(`Thermonuclear Cache: Warming up ${entries.length} entries`);

    const promises = entries.map(({ key, value, ttl }) =>
      this.set(key, value, { ttl })
    );

    await Promise.all(promises);
    console.log('Thermonuclear Cache: Warmup completed');
  }

  // Export/Import for backup/restore
  async export(): Promise<{ entries: CacheEntry[]; metadata: any }> {
    const entries = Array.from(this.memoryCache.values());
    return {
      entries,
      metadata: {
        timestamp: Date.now(),
        version: '1.0.0',
        namespace: this.config.namespace,
        stats: this.getStats(),
      },
    };
  }

  async import(data: { entries: CacheEntry[]; metadata: any }): Promise<void> {
    console.log(`Thermonuclear Cache: Importing ${data.entries.length} entries`);

    for (const entry of data.entries) {
      // Only import non-expired entries
      const isExpired = Date.now() - entry.timestamp > entry.ttl * 1000;
      if (!isExpired) {
        this.memoryCache.set(entry.key, entry);
      }
    }

    this.updateStats();
    console.log('Thermonuclear Cache: Import completed');
  }
}

// Export singleton instance
export const cacheService = new CacheService({
  ttl: 3600, // 1 hour
  maxSize: 1000,
  staleWhileRevalidate: true,
  compression: true,
  encryption: false,
  namespace: 'protothrive',
});

// Convenience methods
export const cache = {
  get: <T>(key: string) => cacheService.get<T>(key),
  set: <T>(key: string, value: T, ttl?: number) => cacheService.set(key, value, { ttl }),
  delete: (key: string) => cacheService.delete(key),
  clear: () => cacheService.clear(),
  stats: () => cacheService.getStats(),
  health: () => cacheService.getHealth(),
};