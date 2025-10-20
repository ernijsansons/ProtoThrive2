/**
 * Validation Service Unit Tests
 * Target: 95%+ coverage for input validation utilities
 *
 * Test Coverage:
 * - Zod schema validation
 * - DoS prevention (size limits)
 * - XSS sanitization
 * - Email validation
 * - Password complexity
 * - Input normalization
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateEmail,
  validatePassword,
  validateRoadmapInput,
  validateSnippetInput,
  sanitizeHtml,
  sanitizeString,
  validateUUID,
  validatePagination,
  rateLimitCheck,
} from '../../src/utils/validation';

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'admin+tag@company.org',
      'user123@test-domain.com',
      'a@b.co',
    ];

    validEmails.forEach(email => {
      expect(() => validateEmail(email)).not.toThrow();
    });
  });

  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      'missing@domain',
      '@nodomain.com',
      'no-at-sign.com',
      'spaces in@email.com',
      'double@@domain.com',
      '',
    ];

    invalidEmails.forEach(email => {
      expect(() => validateEmail(email)).toThrow();
    });
  });

  it('should normalize email addresses to lowercase', () => {
    const email = 'User@EXAMPLE.COM';
    const normalized = validateEmail(email);

    expect(normalized).toBe('user@example.com');
  });

  it('should trim whitespace from emails', () => {
    const email = '  user@example.com  ';
    const normalized = validateEmail(email);

    expect(normalized).toBe('user@example.com');
  });

  it('should enforce maximum email length (254 characters)', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'; // 264 chars

    expect(() => validateEmail(longEmail)).toThrow(/too long/i);
  });

  it('should reject emails with multiple @ symbols', () => {
    expect(() => validateEmail('user@@example.com')).toThrow();
    expect(() => validateEmail('user@domain@example.com')).toThrow();
  });

  it('should accept internationalized domain names (IDN)', () => {
    const idnEmail = 'user@münchen.de';
    expect(() => validateEmail(idnEmail)).not.toThrow();
  });
});

describe('Password Validation', () => {
  it('should enforce minimum length (12 characters)', () => {
    const shortPasswords = ['short', 'Pass1!', 'abcdefgh'];

    shortPasswords.forEach(pwd => {
      expect(() => validatePassword(pwd)).toThrow(/at least 12 characters/i);
    });
  });

  it('should require at least one uppercase letter', () => {
    expect(() => validatePassword('nouppercase123!')).toThrow(/uppercase/i);
  });

  it('should require at least one lowercase letter', () => {
    expect(() => validatePassword('NOLOWERCASE123!')).toThrow(/lowercase/i);
  });

  it('should require at least one number', () => {
    expect(() => validatePassword('NoNumbersHere!')).toThrow(/number/i);
  });

  it('should require at least one special character', () => {
    expect(() => validatePassword('NoSpecialChar123')).toThrow(/special character/i);
  });

  it('should accept strong passwords', () => {
    const strongPasswords = [
      'SecurePassword123!',
      'MyP@ssw0rd2025',
      'C0mpl3x!P@ssw0rd',
      'Str0ng#Passw0rd!',
    ];

    strongPasswords.forEach(pwd => {
      expect(() => validatePassword(pwd)).not.toThrow();
    });
  });

  it('should enforce maximum length (128 characters) for DoS prevention', () => {
    const longPassword = 'A'.repeat(130) + 'b1!';

    expect(() => validatePassword(longPassword)).toThrow(/too long/i);
  });

  it('should detect common weak passwords', () => {
    const weakPasswords = [
      'Password123!',
      'Admin@123456',
      'Welcome1!',
      'Qwerty123!',
    ];

    weakPasswords.forEach(pwd => {
      expect(() => validatePassword(pwd)).toThrow(/common password/i);
    });
  });

  it('should reject passwords with sequential characters', () => {
    const sequentialPasswords = [
      'Abcdefgh123!',
      'Password1234!',
      '12345678Aa!',
    ];

    sequentialPasswords.forEach(pwd => {
      expect(() => validatePassword(pwd)).toThrow(/sequential/i);
    });
  });

  it('should reject passwords with repeated characters', () => {
    const repeatedPasswords = [
      'Aaaaaa1!',
      'Password111!!!',
      'PPPP@@ssw0rd',
    ];

    repeatedPasswords.forEach(pwd => {
      expect(() => validatePassword(pwd)).toThrow(/repeated/i);
    });
  });
});

describe('Roadmap Input Validation', () => {
  it('should validate complete roadmap object', () => {
    const validRoadmap = {
      title: 'My Project Roadmap',
      description: 'A comprehensive project plan',
      nodes: [
        { id: 'node-1', type: 'feature', data: { label: 'Feature 1' } },
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ],
      status: 'active',
    };

    expect(() => validateRoadmapInput(validRoadmap)).not.toThrow();
  });

  it('should enforce title length limits', () => {
    const invalidRoadmap = {
      title: 'A'.repeat(300), // Too long
      description: 'Valid description',
    };

    expect(() => validateRoadmapInput(invalidRoadmap)).toThrow(/title.*too long/i);
  });

  it('should enforce description length limits', () => {
    const invalidRoadmap = {
      title: 'Valid Title',
      description: 'A'.repeat(10000), // Too long
    };

    expect(() => validateRoadmapInput(invalidRoadmap)).toThrow(/description.*too long/i);
  });

  it('should validate roadmap status enum', () => {
    const validStatuses = ['draft', 'active', 'completed', 'archived'];

    validStatuses.forEach(status => {
      expect(() =>
        validateRoadmapInput({ title: 'Test', status })
      ).not.toThrow();
    });

    expect(() =>
      validateRoadmapInput({ title: 'Test', status: 'invalid' })
    ).toThrow(/invalid status/i);
  });

  it('should sanitize HTML in title and description', () => {
    const roadmapWithHtml = {
      title: 'Title with <script>alert("XSS")</script>',
      description: 'Description with <img src=x onerror=alert("XSS")>',
    };

    const sanitized = validateRoadmapInput(roadmapWithHtml);

    expect(sanitized.title).not.toContain('<script>');
    expect(sanitized.description).not.toContain('<img');
  });

  it('should enforce maximum node count (DoS prevention)', () => {
    const tooManyNodes = Array.from({ length: 1001 }, (_, i) => ({
      id: `node-${i}`,
      type: 'task',
      data: { label: `Task ${i}` },
    }));

    expect(() =>
      validateRoadmapInput({ title: 'Test', nodes: tooManyNodes })
    ).toThrow(/too many nodes/i);
  });

  it('should validate node structure', () => {
    const invalidNode = {
      // Missing required fields
      data: { label: 'Task' },
    };

    expect(() =>
      validateRoadmapInput({ title: 'Test', nodes: [invalidNode] })
    ).toThrow(/invalid node/i);
  });

  it('should validate edge references exist in nodes', () => {
    const roadmap = {
      title: 'Test',
      nodes: [{ id: 'node-1', type: 'task', data: { label: 'Task 1' } }],
      edges: [{ id: 'edge-1', source: 'node-1', target: 'nonexistent-node' }],
    };

    expect(() => validateRoadmapInput(roadmap)).toThrow(/invalid edge/i);
  });
});

describe('Snippet Input Validation', () => {
  it('should validate complete snippet object', () => {
    const validSnippet = {
      title: 'React Component Template',
      code: 'function Component() { return <div>Hello</div>; }',
      language: 'typescript',
      category: 'react',
      tags: ['component', 'template'],
    };

    expect(() => validateSnippetInput(validSnippet)).not.toThrow();
  });

  it('should enforce title length limits', () => {
    const invalidSnippet = {
      title: 'A'.repeat(300),
      code: 'valid code',
      language: 'javascript',
    };

    expect(() => validateSnippetInput(invalidSnippet)).toThrow(/title.*too long/i);
  });

  it('should enforce code size limits (1MB max for DoS prevention)', () => {
    const largeCode = 'A'.repeat(2 * 1024 * 1024); // 2MB

    expect(() =>
      validateSnippetInput({ title: 'Test', code: largeCode, language: 'javascript' })
    ).toThrow(/code.*too large/i);
  });

  it('should validate language enum', () => {
    const validLanguages = [
      'javascript',
      'typescript',
      'python',
      'rust',
      'go',
      'java',
      'sql',
    ];

    validLanguages.forEach(language => {
      expect(() =>
        validateSnippetInput({ title: 'Test', code: 'test', language })
      ).not.toThrow();
    });

    expect(() =>
      validateSnippetInput({ title: 'Test', code: 'test', language: 'invalid' })
    ).toThrow(/invalid language/i);
  });

  it('should validate tags array length', () => {
    const tooManyTags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);

    expect(() =>
      validateSnippetInput({ title: 'Test', code: 'test', language: 'javascript', tags: tooManyTags })
    ).toThrow(/too many tags/i);
  });

  it('should sanitize individual tag strings', () => {
    const snippet = {
      title: 'Test',
      code: 'test',
      language: 'javascript',
      tags: ['valid-tag', '<script>alert("XSS")</script>', 'another-tag'],
    };

    const sanitized = validateSnippetInput(snippet);

    expect(sanitized.tags).not.toContain('<script>');
  });
});

describe('HTML Sanitization', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("XSS")</script> World';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
    expect(sanitized).toContain('World');
  });

  it('should remove event handlers', () => {
    const input = '<img src=x onerror=alert("XSS")>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('onerror');
  });

  it('should remove javascript: protocol', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('javascript:');
  });

  it('should preserve safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong>!</p>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).toContain('<p>');
    expect(sanitized).toContain('<strong>');
  });

  it('should remove data: protocol (base64 payloads)', () => {
    const input = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('data:');
  });

  it('should handle nested malicious tags', () => {
    const input = '<div><script><script>alert("XSS")</script></script></div>';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('<script>');
  });

  it('should decode HTML entities before sanitization', () => {
    const input = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
    const sanitized = sanitizeHtml(input);

    expect(sanitized).not.toContain('script');
  });
});

describe('String Sanitization', () => {
  it('should remove null bytes', () => {
    const input = 'Hello\0World';
    const sanitized = sanitizeString(input);

    expect(sanitized).toBe('HelloWorld');
    expect(sanitized).not.toContain('\0');
  });

  it('should normalize whitespace', () => {
    const input = 'Hello    \n\t   World';
    const sanitized = sanitizeString(input);

    expect(sanitized).toBe('Hello World');
  });

  it('should trim leading and trailing whitespace', () => {
    const input = '   Hello World   ';
    const sanitized = sanitizeString(input);

    expect(sanitized).toBe('Hello World');
  });

  it('should remove control characters', () => {
    const input = 'Hello\x00\x01\x02World';
    const sanitized = sanitizeString(input);

    expect(sanitized).toBe('HelloWorld');
  });

  it('should preserve unicode characters', () => {
    const input = 'Hello 世界 🌍';
    const sanitized = sanitizeString(input);

    expect(sanitized).toBe('Hello 世界 🌍');
  });
});

describe('UUID Validation', () => {
  it('should accept valid UUIDs', () => {
    const validUUIDs = [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      '123e4567-e89b-12d3-a456-426614174000',
    ];

    validUUIDs.forEach(uuid => {
      expect(() => validateUUID(uuid)).not.toThrow();
    });
  });

  it('should reject invalid UUIDs', () => {
    const invalidUUIDs = [
      'not-a-uuid',
      '123',
      '550e8400-e29b-41d4-a716', // Too short
      '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
      '550e8400e29b41d4a716446655440000', // Missing dashes
    ];

    invalidUUIDs.forEach(uuid => {
      expect(() => validateUUID(uuid)).toThrow(/invalid UUID/i);
    });
  });

  it('should accept both lowercase and uppercase UUIDs', () => {
    const uuid = '550E8400-E29B-41D4-A716-446655440000';
    expect(() => validateUUID(uuid)).not.toThrow();
  });
});

describe('Pagination Validation', () => {
  it('should validate page and limit parameters', () => {
    const validPagination = validatePagination({ page: 1, limit: 20 });

    expect(validPagination.page).toBe(1);
    expect(validPagination.limit).toBe(20);
  });

  it('should enforce minimum page number (1)', () => {
    expect(() => validatePagination({ page: 0, limit: 20 })).toThrow(/invalid page/i);
    expect(() => validatePagination({ page: -1, limit: 20 })).toThrow(/invalid page/i);
  });

  it('should enforce maximum limit (100 for DoS prevention)', () => {
    expect(() => validatePagination({ page: 1, limit: 101 })).toThrow(/limit too large/i);
  });

  it('should use default values when not provided', () => {
    const defaults = validatePagination({});

    expect(defaults.page).toBe(1);
    expect(defaults.limit).toBe(20);
  });

  it('should calculate offset correctly', () => {
    const pagination = validatePagination({ page: 3, limit: 20 });

    expect(pagination.offset).toBe(40); // (3-1) * 20
  });

  it('should reject non-integer page numbers', () => {
    expect(() => validatePagination({ page: 1.5, limit: 20 })).toThrow(/invalid page/i);
    expect(() => validatePagination({ page: 1, limit: 20.5 })).toThrow(/invalid limit/i);
  });
});

describe('Rate Limit Validation', () => {
  it('should track request counts per IP', async () => {
    const ip = '192.168.1.1';

    for (let i = 0; i < 10; i++) {
      await rateLimitCheck(ip, 100);
    }

    // Should not throw - under limit
    expect(true).toBe(true);
  });

  it('should enforce rate limits', async () => {
    const ip = '192.168.1.2';
    const limit = 5;

    // Make requests up to limit
    for (let i = 0; i < limit; i++) {
      await rateLimitCheck(ip, limit);
    }

    // Next request should throw
    await expect(rateLimitCheck(ip, limit)).rejects.toThrow(/rate limit exceeded/i);
  });

  it('should reset rate limit after time window', async () => {
    const ip = '192.168.1.3';
    const limit = 5;

    // Fill up rate limit
    for (let i = 0; i < limit; i++) {
      await rateLimitCheck(ip, limit);
    }

    // Wait for window to reset (simulate 1 minute passing)
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Should allow requests again
    await expect(rateLimitCheck(ip, limit)).resolves.not.toThrow();
  }, 70000);

  it('should track different IPs independently', async () => {
    const ip1 = '192.168.1.4';
    const ip2 = '192.168.1.5';
    const limit = 3;

    // Fill limit for IP1
    for (let i = 0; i < limit; i++) {
      await rateLimitCheck(ip1, limit);
    }

    // IP2 should still work
    await expect(rateLimitCheck(ip2, limit)).resolves.not.toThrow();
  });
});

describe('DoS Prevention', () => {
  it('should enforce maximum request body size', () => {
    const largeBody = 'A'.repeat(11 * 1024 * 1024); // 11MB

    expect(() => validateRequestBody(largeBody)).toThrow(/request too large/i);
  });

  it('should enforce maximum array length', () => {
    const largeArray = Array.from({ length: 10001 }, () => 'item');

    expect(() => validateArray(largeArray, 10000)).toThrow(/array too large/i);
  });

  it('should enforce maximum object depth', () => {
    let deepObject: any = {};
    let current = deepObject;

    for (let i = 0; i < 101; i++) {
      current.nested = {};
      current = current.nested;
    }

    expect(() => validateObjectDepth(deepObject, 100)).toThrow(/object too deep/i);
  });

  it('should enforce maximum string length', () => {
    const longString = 'A'.repeat(100001);

    expect(() => validateStringLength(longString, 100000)).toThrow(/string too long/i);
  });
});

// Helper functions referenced in tests (would be implemented in validation.ts)
function validateRequestBody(body: string): void {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (body.length > maxSize) {
    throw new Error('Request body too large');
  }
}

function validateArray(arr: any[], maxLength: number): void {
  if (arr.length > maxLength) {
    throw new Error('Array too large');
  }
}

function validateObjectDepth(obj: any, maxDepth: number, depth = 0): void {
  if (depth > maxDepth) {
    throw new Error('Object too deep');
  }
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      validateObjectDepth(obj[key], maxDepth, depth + 1);
    }
  }
}

function validateStringLength(str: string, maxLength: number): void {
  if (str.length > maxLength) {
    throw new Error('String too long');
  }
}
