// Ref: CLAUDE.md - Hardened Validation Module with Zero-Trust Security
// Enterprise-grade input validation with comprehensive error reporting

import { z, ZodError, ZodIssue } from 'zod';

// Configuration for validation limits and security
export interface ValidationConfig {
  maxRequestSize: number;
  maxArraySize: number;
  maxStringLength: number;
  maxNodeCount: number;
  maxEdgeCount: number;
  rateLimitWindow: number;
  rateLimitMax: number;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  maxRequestSize: 1024 * 1024, // 1MB
  maxArraySize: 1000,
  maxStringLength: 100000,
  maxNodeCount: 100,
  maxEdgeCount: 200,
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 100 // requests per window
};

// Rate limiting for validation requests
class ValidationRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  isAllowed(identifier: string, config = DEFAULT_VALIDATION_CONFIG): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + config.rateLimitWindow
      });
      return true;
    }

    if (record.count >= config.rateLimitMax) {
      return false;
    }

    record.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const globalRateLimiter = new ValidationRateLimiter();

// Cleanup rate limiter every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => globalRateLimiter.cleanup(), 5 * 60 * 1000);
}

// Custom error class for validation with detailed field-level errors
export class ValidationError extends Error {
  public statusCode: number;
  public code: string;
  public details: Array<{
    field: string;
    message: string;
    type: string;
    received?: any;
  }>;

  constructor(errors: ZodIssue[], statusCode = 400) {
    const details = errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      type: err.code,
      received: err.code === 'invalid_type' ? (err as any).received : undefined
    }));

    super(`Validation failed: ${details.length} error(s) found`);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

// Enhanced sanitization helpers
const sanitizers = {
  // Remove all HTML tags and dangerous content
  stripHTML: (str: string) => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
  },

  // Sanitize for SQL injection
  escapeSql: (str: string) => {
    return str
      .replace(/['";\\]/g, '\\$&')
      .replace(/[\0\n\r\x1a]/g, '');
  },

  // Sanitize file paths
  sanitizePath: (str: string) => {
    return str
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9._\-\/]/g, '');
  }
};

// Strict Node schema with position validation
const NodePositionSchema = z.object({
  x: z.number().min(-10000).max(10000),
  y: z.number().min(-10000).max(10000),
  z: z.number().min(-10000).max(10000).default(0)
});

const NodeSchema = z.object({
  id: z.string()
    .min(1, 'Node ID is required')
    .max(50, 'Node ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Node ID contains invalid characters'),

  label: z.string()
    .min(1, 'Node label is required')
    .max(200, 'Node label too long')
    .transform(sanitizers.stripHTML),

  status: z.enum(['gray', 'neon', 'active', 'completed', 'failed'])
    .default('gray'),

  position: NodePositionSchema,

  type: z.enum(['default', 'start', 'end', 'decision', 'process', 'ui', 'code', 'deploy'])
    .default('default'),

  metadata: z.record(z.unknown()).optional()
});

// Strict Edge schema with validation
const EdgeSchema = z.object({
  id: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Edge ID contains invalid characters')
    .optional(),

  from: z.string()
    .min(1, 'Source node ID is required')
    .max(50, 'Source node ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid source node ID'),

  to: z.string()
    .min(1, 'Target node ID is required')
    .max(50, 'Target node ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid target node ID'),

  label: z.string()
    .max(100, 'Edge label too long')
    .transform(sanitizers.stripHTML)
    .optional(),

  type: z.enum(['default', 'success', 'failure', 'conditional'])
    .default('default')
});

// Graph schema with comprehensive validation
const GraphSchema = z.object({
  nodes: z.array(NodeSchema)
    .min(1, 'At least one node is required')
    .max(100, 'Too many nodes (max: 100)'),

  edges: z.array(EdgeSchema)
    .max(200, 'Too many edges (max: 200)')
    .default([])
})
.refine(data => {
  // Ensure all edge references point to existing nodes
  const nodeIds = new Set(data.nodes.map(n => n.id));
  return data.edges.every(edge =>
    nodeIds.has(edge.from) && nodeIds.has(edge.to)
  );
}, {
  message: 'Edges reference non-existent nodes'
})
.refine(data => {
  // Check for duplicate node IDs
  const nodeIds = data.nodes.map(n => n.id);
  return nodeIds.length === new Set(nodeIds).size;
}, {
  message: 'Duplicate node IDs detected'
})
.refine(data => {
  // Prevent self-referencing edges
  return !data.edges.some(edge => edge.from === edge.to);
}, {
  message: 'Self-referencing edges are not allowed'
});

// CREATE Roadmap validation schema
export const CreateRoadmapSchema = z.object({
  json_graph: z.union([
    z.string().transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        return GraphSchema.parse(parsed);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof ZodError
            ? error.errors[0].message
            : 'Invalid JSON graph structure'
        });
        return z.NEVER;
      }
    }),
    GraphSchema
  ]),

  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .transform(sanitizers.stripHTML),

  description: z.string()
    .max(1000, 'Description too long')
    .transform(sanitizers.stripHTML)
    .optional(),

  vibe_mode: z.boolean().default(false),

  visibility: z.enum(['private', 'public', 'team']).default('private'),

  tags: z.array(
    z.string()
      .min(1)
      .max(30)
      .regex(/^[a-z0-9-]+$/, 'Tags must be lowercase alphanumeric with hyphens')
  )
  .max(10, 'Too many tags (max: 10)')
  .optional()
});

// UPDATE Roadmap validation schema (all fields optional)
export const UpdateRoadmapSchema = z.object({
  json_graph: z.union([
    z.string().transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        return GraphSchema.parse(parsed);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof ZodError
            ? error.errors[0].message
            : 'Invalid JSON graph structure'
        });
        return z.NEVER;
      }
    }),
    GraphSchema
  ]).optional(),

  title: z.string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long')
    .transform(sanitizers.stripHTML)
    .optional(),

  description: z.string()
    .max(1000, 'Description too long')
    .transform(sanitizers.stripHTML)
    .optional(),

  status: z.enum(['draft', 'active', 'completed', 'archived'])
    .optional(),

  vibe_mode: z.boolean().optional(),

  visibility: z.enum(['private', 'public', 'team']).optional(),

  thrive_score: z.number()
    .min(0, 'Score must be between 0 and 1')
    .max(1, 'Score must be between 0 and 1')
    .optional(),

  tags: z.array(
    z.string()
      .min(1)
      .max(30)
      .regex(/^[a-z0-9-]+$/, 'Tags must be lowercase alphanumeric with hyphens')
  )
  .max(10, 'Too many tags (max: 10)')
  .optional()
});

// Snippet validation schema
export const CreateSnippetSchema = z.object({
  category: z.string()
    .min(1, 'Category is required')
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Category must be lowercase alphanumeric'),

  code: z.string()
    .min(1, 'Code is required')
    .max(10000, 'Code too long')
    .refine(code => {
      // Advanced malicious pattern detection with comprehensive coverage
      const dangerousPatterns = [
        // JavaScript execution
        /eval\s*\(/i,
        /Function\s*\(/i,
        /setTimeout\s*\(/i,
        /setInterval\s*\(/i,
        /setImmediate\s*\(/i,
        /requestAnimationFrame\s*\(/i,

        // Process and system execution
        /child_process/i,
        /require\s*\(\s*['"`]child_process/i,
        /__import__/i,
        /os\.system/i,
        /os\.popen/i,
        /subprocess\.(call|run|Popen|check_output)/i,
        /exec\s*\(/i,
        /spawn\s*\(/i,
        /execFile\s*\(/i,
        /execSync\s*\(/i,
        /spawnSync\s*\(/i,

        // DOM and browser exploitation
        /document\.write/i,
        /document\.writeln/i,
        /document\.cookie/i,
        /window\.location/i,
        /location\.href/i,
        /location\.replace/i,
        /location\.assign/i,
        /innerHTML/i,
        /outerHTML/i,
        /insertAdjacentHTML/i,

        // Script injection
        /<script[\s>]/i,
        /<\/script>/i,
        /<iframe[\s>]/i,
        /<object[\s>]/i,
        /<embed[\s>]/i,
        /<applet[\s>]/i,
        /<meta[\s>]/i,
        /<link[\s>]/i,

        // Protocol handlers
        /javascript:/i,
        /data:text\/html/i,
        /data:application\/javascript/i,
        /vbscript:/i,
        /about:/i,
        /chrome:/i,
        /chrome-extension:/i,
        /moz-extension:/i,

        // Storage manipulation
        /localStorage\./i,
        /sessionStorage\./i,
        /globalStorage/i,
        /indexedDB/i,

        // Network requests and imports
        /XMLHttpRequest/i,
        /fetch\s*\(/i,
        /import\s*\(/i,
        /require\s*\(/i,
        /importScripts/i,

        // File system operations
        /readFileSync/i,
        /writeFileSync/i,
        /unlinkSync/i,
        /mkdirSync/i,

        // SQL injection patterns
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /create\s+table/i,
        /alter\s+table/i,
        /grant\s+all/i,

        // Command injection
        /\$\(/,
        /`[^`]*`/,
        /\|\s*sh/,
        /\|\s*bash/i,
        /\|\s*cmd/i,
        /\|\s*powershell/i,
        /&&\s*(rm|del|format)/i,
        /;\s*(rm|del|format)/i,

        // Obfuscation techniques
        /String\.fromCharCode/i,
        /atob\s*\(/i,
        /btoa\s*\(/i,
        /unescape\s*\(/i,
        /decodeURIComponent\s*\(/i,
        /\\x[0-9a-f]{2}/i,
        /\\u[0-9a-f]{4}/i,
        /\\[0-7]{3}/,

        // Event handlers
        /on\w+\s*=/i,
        /addEventListener/i,
        /attachEvent/i,

        // Global object manipulation
        /window\[/i,
        /this\.constructor/i,
        /arguments\.callee/i,
        /\.constructor\.constructor/i,

        // Template literal injection
        /\$\{[^}]*eval/i,
        /\$\{[^}]*Function/i,

        // Null bytes and control characters
        /\0/,
        /[\x00-\x1f\x7f-\x9f]/,

        // URL encoding bypasses
        /%3c%73%63%72%69%70%74/i, // <script
        /%6a%61%76%61%73%63%72%69%70%74/i, // javascript
        /%65%76%61%6c/i, // eval

        // Modern JS features that could be dangerous
        /Proxy\s*\(/i,
        /Reflect\./i,
        /SharedArrayBuffer/i,
        /WebAssembly/i,

        // Server-side template injection
        /\{\{.*\}\}/,
        /\{%.*%\}/,
        /<%.*%>/,
        /\$\{.*\}/
      ];

      return !dangerousPatterns.some(pattern => pattern.test(code));
    }, {
      message: 'Code contains potentially dangerous patterns'
    }),

  title: z.string()
    .min(1, 'Title is required')
    .max(200)
    .transform(sanitizers.stripHTML),

  description: z.string()
    .max(500)
    .transform(sanitizers.stripHTML)
    .optional(),

  language: z.enum(['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'sql', 'html', 'css'])
    .optional(),

  ui_preview_url: z.string()
    .url('Invalid URL format')
    .refine(url => {
      // SECURITY FIX: Enhanced URL validation with comprehensive internal network blocking
      if (typeof url !== 'string') return false;

      // Check for dangerous protocols and edge cases
      const dangerousProtocols = /^(javascript|data|vbscript|file|ftp|jar|netdoc|mailto|news|gopher|ldap|finger):/i;
      if (dangerousProtocols.test(url)) {
        return false;
      }

      // Block URL-encoded dangerous protocols
      if (/(%6A%61%76%61%73%63%72%69%70%74|%64%61%74%61)/i.test(url)) {
        return false;
      }

      try {
        const parsed = new URL(url);

        // Only allow HTTP(S) protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return false;
        }

        const hostname = parsed.hostname.toLowerCase();

        // Comprehensive internal network blocking (IPv4)
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const ipv4Match = hostname.match(ipv4Regex);

        if (ipv4Match) {
          const [, a, b, c, d] = ipv4Match.map(Number);

          // Block private IPv4 ranges
          if (
            // 10.0.0.0/8 (Class A private)
            a === 10 ||
            // 172.16.0.0/12 (Class B private)
            (a === 172 && b >= 16 && b <= 31) ||
            // 192.168.0.0/16 (Class C private)
            (a === 192 && b === 168) ||
            // 127.0.0.0/8 (Loopback)
            a === 127 ||
            // 169.254.0.0/16 (Link-local)
            (a === 169 && b === 254) ||
            // 224.0.0.0/4 (Multicast)
            a >= 224 && a <= 239 ||
            // 240.0.0.0/4 (Reserved)
            a >= 240 ||
            // 0.0.0.0/8 (This network)
            a === 0
          ) {
            return false;
          }
        }

        // Block internal hostnames and DNS rebinding attempts
        const blockedHostnames = [
          'localhost', 'localtest.me', 'local.test',
          'broadcasthost', 'ip6-localhost', 'ip6-loopback',
          'ip6-localnet', 'ip6-mcastprefix', 'ip6-allnodes',
          'ip6-allrouters', 'ip6-allhosts'
        ];

        if (blockedHostnames.includes(hostname)) {
          return false;
        }

        // Block IPv6 loopback and local addresses
        if (hostname.includes('::1') || hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
          return false;
        }

        // Block URLs with ports that could indicate internal services
        if (parsed.port) {
          const port = parseInt(parsed.port);
          const dangerousPorts = [22, 23, 25, 53, 110, 143, 993, 995, 1433, 1521, 3306, 3389, 5432, 5984, 6379, 9200, 9300, 11211, 27017, 27018, 27019, 50070];
          if (dangerousPorts.includes(port)) {
            return false;
          }
        }

        // Additional hostname validation
        if (hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
          return false;
        }

        // Block obviously suspicious TLDs
        const suspiciousTlds = ['.local', '.internal', '.corp', '.home', '.lan'];
        if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    }, 'Invalid or potentially dangerous URL')
    .optional(),

  tags: z.array(z.string().regex(/^[a-z0-9-]+$/))
    .max(5)
    .optional()
});

// Query parameter validation
export const ListQuerySchema = z.object({
  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),

  offset: z.coerce.number()
    .int()
    .min(0)
    .default(0),

  sort: z.enum(['created_at', 'updated_at', 'title', 'thrive_score'])
    .optional(),

  order: z.enum(['asc', 'desc'])
    .default('desc'),

  filter: z.object({
    status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
    visibility: z.enum(['private', 'public', 'team']).optional(),
    tags: z.array(z.string()).optional(),
    search: z.string().max(100).optional()
  }).optional()
});

// UUID validation
export const UUIDSchema = z.string()
  .uuid('Invalid UUID format')
  .transform(id => id.toLowerCase());

// Auth token validation
export const AuthTokenSchema = z.object({
  token: z.string()
    .min(1, 'Token is required')
    .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Invalid JWT format')
});

// Login validation
export const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .max(255),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
});

// Input size validation
export function validateInputSize(data: unknown, config = DEFAULT_VALIDATION_CONFIG): void {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new TextEncoder().encode(jsonString).length;

  if (sizeInBytes > config.maxRequestSize) {
    throw new ValidationError([{
      path: ['input'],
      message: `Input size exceeds maximum allowed (${sizeInBytes} > ${config.maxRequestSize} bytes)`,
      code: 'too_big'
    }]);
  }
}

// Rate limit validation with detailed error reporting
export function validateWithRateLimit<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  identifier: string = 'default',
  config = DEFAULT_VALIDATION_CONFIG
): { success: true; data: T } | { success: false; error: ValidationError } {
  // Check rate limit first
  if (!globalRateLimiter.isAllowed(identifier, config)) {
    return {
      success: false,
      error: new ValidationError([{
        path: ['rate_limit'],
        message: 'Too many validation requests. Please slow down.',
        code: 'too_many_requests'
      }], 429)
    };
  }

  // Check input size
  try {
    validateInputSize(data, config);
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error };
    }
    throw error;
  }

  // Perform validation
  return validate(schema, data);
}

// Validation wrapper function with detailed error reporting
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: new ValidationError(error.errors)
      };
    }
    throw error;
  }
}

// Performance-optimized validation cache
class ValidationCache {
  private cache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private maxSize = 1000;
  private defaultTTL = 300000; // 5 minutes

  private generateKey(schema: any, data: unknown): string {
    // Create a hash-like key from schema and data
    const schemaKey = schema._def?.typeName || 'unknown';
    const dataKey = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return `${schemaKey}_${this.simpleHash(dataKey)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  get<T>(schema: any, data: unknown): T | null {
    const key = this.generateKey(schema, data);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check TTL
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  set<T>(schema: any, data: unknown, result: T, ttl = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const key = this.generateKey(schema, data);
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; hitRatio: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: 0 // Would need to track hits/misses for accurate ratio
    };
  }
}

const validationCache = new ValidationCache();

// Performance-optimized validation with caching
export function validateWithCache<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  useCache = true
): { success: true; data: T } | { success: false; error: ValidationError } {
  // Check cache first
  if (useCache) {
    const cached = validationCache.get<T>(schema, data);
    if (cached) {
      return { success: true, data: cached };
    }
  }

  // Perform validation
  const result = validate(schema, data);

  // Cache successful results
  if (useCache && result.success) {
    validationCache.set(schema, data, result.data);
  }

  return result;
}

// Streaming validation for large inputs
export async function* validateStream<T>(
  schema: z.ZodSchema<T>,
  dataStream: AsyncIterable<unknown>
): AsyncGenerator<{ success: true; data: T } | { success: false; error: ValidationError }> {
  for await (const data of dataStream) {
    yield validate(schema, data);
  }
}

// Batch validation with parallel processing
export async function validateBatch<T>(
  schema: z.ZodSchema<T>,
  dataArray: unknown[],
  options: {
    parallel?: boolean;
    batchSize?: number;
    useCache?: boolean;
  } = {}
): Promise<Array<{ success: true; data: T } | { success: false; error: ValidationError }>> {
  const { parallel = true, batchSize = 100, useCache = true } = options;

  if (!parallel || dataArray.length <= batchSize) {
    // Sequential processing for small batches
    return dataArray.map(data =>
      useCache ? validateWithCache(schema, data) : validate(schema, data)
    );
  }

  // Parallel processing for large batches
  const results: Array<{ success: true; data: T } | { success: false; error: ValidationError }> = [];
  const chunks: unknown[][] = [];

  // Split into chunks
  for (let i = 0; i < dataArray.length; i += batchSize) {
    chunks.push(dataArray.slice(i, i + batchSize));
  }

  // Process chunks in parallel
  const chunkPromises = chunks.map(async (chunk) =>
    chunk.map(data => useCache ? validateWithCache(schema, data) : validate(schema, data))
  );

  const chunkResults = await Promise.all(chunkPromises);

  // Flatten results
  chunkResults.forEach(chunkResult => {
    results.push(...chunkResult);
  });

  return results;
}

// Lazy validation - defer expensive validations
export class LazyValidator<T> {
  private schema: z.ZodSchema<T>;
  private data: unknown;
  private cached: { result: { success: true; data: T } | { success: false; error: ValidationError }; validated: boolean } = {
    result: { success: false, error: new ValidationError([]) },
    validated: false
  };

  constructor(schema: z.ZodSchema<T>, data: unknown) {
    this.schema = schema;
    this.data = data;
  }

  validate(): { success: true; data: T } | { success: false; error: ValidationError } {
    if (!this.cached.validated) {
      this.cached.result = validate(this.schema, this.data);
      this.cached.validated = true;
    }
    return this.cached.result;
  }

  isValid(): boolean {
    return this.validate().success;
  }

  getData(): T {
    const result = this.validate();
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }
}

// Memory-efficient validation for very large objects
export function validateLargeObject<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options: {
    chunkSize?: number;
    memoryLimit?: number; // bytes
  } = {}
): { success: true; data: T } | { success: false; error: ValidationError } {
  const { chunkSize = 1000, memoryLimit = 50 * 1024 * 1024 } = options; // 50MB default

  // Check memory usage
  const dataString = JSON.stringify(data);
  const dataSize = new TextEncoder().encode(dataString).length;

  if (dataSize > memoryLimit) {
    return {
      success: false,
      error: new ValidationError([{
        path: ['input'],
        message: `Input size ${dataSize} bytes exceeds memory limit ${memoryLimit} bytes`,
        code: 'too_big'
      }])
    };
  }

  // For very large objects, validate in chunks if possible
  if (Array.isArray(data) && data.length > chunkSize) {
    try {
      // Validate array schema first
      if (!z.array(z.any()).safeParse(data).success) {
        return validate(schema, data);
      }

      // Validate in chunks
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const chunkResult = validate(z.array((schema as any)._def.type), chunk);
        if (!chunkResult.success) {
          return chunkResult;
        }
      }

      // If all chunks pass, validate the complete object
      return validate(schema, data);

    } catch (error) {
      return validate(schema, data);
    }
  }

  // Default validation for smaller objects
  return validate(schema, data);
}

// Performance monitoring for validation operations
class ValidationPerformanceMonitor {
  private metrics = {
    totalValidations: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    avgTime: 0,
    slowQueries: [] as Array<{ schema: string; time: number; timestamp: number }>
  };

  startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  recordValidation(time: number, success: boolean, fromCache = false): void {
    this.metrics.totalValidations++;
    this.metrics.totalTime += time;
    this.metrics.avgTime = this.metrics.totalTime / this.metrics.totalValidations;

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    if (!success) {
      this.metrics.errors++;
    }

    // Track slow queries (>100ms)
    if (time > 100) {
      this.metrics.slowQueries.push({
        schema: 'unknown', // Could be enhanced with schema identification
        time,
        timestamp: Date.now()
      });

      // Keep only last 100 slow queries
      if (this.metrics.slowQueries.length > 100) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(-100);
      }
    }
  }

  getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalValidations: 0,
      totalTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      avgTime: 0,
      slowQueries: []
    };
  }
}

const performanceMonitor = new ValidationPerformanceMonitor();

// Enhanced validation function with performance monitoring
export function validateWithMonitoring<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  useCache = true
): { success: true; data: T } | { success: false; error: ValidationError } {
  const timer = performanceMonitor.startTimer();

  let result: { success: true; data: T } | { success: false; error: ValidationError };
  let fromCache = false;

  if (useCache) {
    const cached = validationCache.get<T>(schema, data);
    if (cached) {
      result = { success: true, data: cached };
      fromCache = true;
    } else {
      result = validate(schema, data);
      if (result.success) {
        validationCache.set(schema, data, result.data);
      }
    }
  } else {
    result = validate(schema, data);
  }

  const time = timer();
  performanceMonitor.recordValidation(time, result.success, fromCache);

  return result;
}

// Export performance utilities
export {
  validationCache,
  performanceMonitor,
  LazyValidator,
  validateWithCache,
  validateStream,
  validateBatch,
  validateLargeObject,
  validateWithMonitoring
};

// Async validation wrapper
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  const result = validate(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// Export types
export type CreateRoadmapInput = z.infer<typeof CreateRoadmapSchema>;
export type UpdateRoadmapInput = z.infer<typeof UpdateRoadmapSchema>;
export type CreateSnippetInput = z.infer<typeof CreateSnippetSchema>;
export type ListQueryInput = z.infer<typeof ListQuerySchema>;
export type LoginInput = z.infer<typeof LoginSchema>;