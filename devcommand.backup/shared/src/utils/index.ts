// Shared utility functions for DevCommand platform

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Calculate thrive score based on completion, UI polish, and risk
 */
export function calculateThriveScore(
  completionPercentage: number,
  uiPolishPercentage: number,
  riskFactor: number,
): number {
  const score = completionPercentage * 0.6 + uiPolishPercentage * 0.3 + (1 - riskFactor) * 0.1;
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

/**
 * Parse JSON safely with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Format error response
 */
export function formatError(code: string, message: string, details?: Record<string, unknown>) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Format success response
 */
export function formatSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    meta,
  };
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = initialDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

/**
 * Truncate string to specified length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Hash string using SHA-256
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if error is rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('429') || error.message.includes('rate');
  }
  return false;
}

/**
 * Extract metadata only from code diff (no actual code)
 */
export function extractMetadataFromDiff(diff: string): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    filesChanged: 0,
    additions: 0,
    deletions: 0,
    fileTypes: new Set<string>(),
  };

  const lines = diff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      metadata.filesChanged = (metadata.filesChanged as number) + 1;
      const match = line.match(/\.(ts|tsx|js|jsx|css|json|md)$/);
      if (match) {
        (metadata.fileTypes as Set<string>).add(match[1]);
      }
    } else if (line.startsWith('+')) {
      metadata.additions = (metadata.additions as number) + 1;
    } else if (line.startsWith('-')) {
      metadata.deletions = (metadata.deletions as number) + 1;
    }
  }

  metadata.fileTypes = Array.from(metadata.fileTypes as Set<string>);
  return metadata;
}

/**
 * Sanitize user input for security
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim();
}

/**
 * Check if user has permission for action based on role
 */
export function hasPermission(
  userRole: string,
  action: string,
  resource?: string,
): boolean {
  const permissions: Record<string, string[]> = {
    vibe_coder: ['read:roadmap', 'write:roadmap', 'read:preview'],
    engineer: ['read:roadmap', 'write:roadmap', 'read:preview', 'trigger:agent', 'deploy:staging'],
    exec: ['read:roadmap', 'read:insights', 'read:roi'],
  };

  const userPermissions = permissions[userRole] || [];
  const actionPermission = `${action}:${resource || '*'}`;

  return userPermissions.some((perm) => {
    if (perm === actionPermission) return true;
    if (perm.endsWith(':*') && actionPermission.startsWith(perm.slice(0, -1))) return true;
    return false;
  });
}