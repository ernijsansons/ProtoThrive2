/**
 * ProtoThrive Validation Test Suite
 * Comprehensive tests demonstrating input validation and error handling
 * Ref: CLAUDE.md - Security validation tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  validate,
  CreateRoadmapSchema,
  UpdateRoadmapSchema,
  CreateSnippetSchema,
  ListQuerySchema,
  UUIDSchema,
  LoginSchema,
  ValidationError
} from '../src/validation/hardened-validation';

describe('Hardened Input Validation Tests', () => {

  describe('CreateRoadmapSchema Validation', () => {
    test('should accept valid roadmap creation data', () => {
      const validData = {
        json_graph: JSON.stringify({
          nodes: [
            {
              id: 'node-1',
              label: 'Start Node',
              position: { x: 0, y: 0, z: 0 },
              status: 'gray',
              type: 'start'
            },
            {
              id: 'node-2',
              label: 'End Node',
              position: { x: 100, y: 100, z: 0 },
              status: 'gray',
              type: 'end'
            }
          ],
          edges: [
            {
              from: 'node-1',
              to: 'node-2',
              type: 'default'
            }
          ]
        }),
        title: 'My Roadmap',
        description: 'A test roadmap',
        vibe_mode: true,
        visibility: 'private',
        tags: ['test', 'demo']
      };

      const result = validate(CreateRoadmapSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('My Roadmap');
        expect(result.data.json_graph.nodes).toHaveLength(2);
        expect(result.data.json_graph.edges).toHaveLength(1);
      }
    });

    test('should reject roadmap with invalid JSON graph', () => {
      const invalidData = {
        json_graph: 'not-valid-json',
        title: 'Invalid Roadmap'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.details[0].field).toBe('json_graph');
        expect(result.error.details[0].message).toContain('Invalid JSON');
      }
    });

    test('should reject roadmap with edges referencing non-existent nodes', () => {
      const invalidData = {
        json_graph: JSON.stringify({
          nodes: [
            {
              id: 'node-1',
              label: 'Only Node',
              position: { x: 0, y: 0 }
            }
          ],
          edges: [
            {
              from: 'node-1',
              to: 'non-existent-node'
            }
          ]
        }),
        title: 'Invalid Edges'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].message).toContain('Edges reference non-existent nodes');
      }
    });

    test('should reject roadmap with self-referencing edges', () => {
      const invalidData = {
        json_graph: JSON.stringify({
          nodes: [
            {
              id: 'node-1',
              label: 'Node',
              position: { x: 0, y: 0 }
            }
          ],
          edges: [
            {
              from: 'node-1',
              to: 'node-1'
            }
          ]
        }),
        title: 'Self-Reference'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].message).toContain('Self-referencing edges are not allowed');
      }
    });

    test('should reject roadmap with duplicate node IDs', () => {
      const invalidData = {
        json_graph: JSON.stringify({
          nodes: [
            {
              id: 'node-1',
              label: 'First',
              position: { x: 0, y: 0 }
            },
            {
              id: 'node-1',
              label: 'Duplicate',
              position: { x: 100, y: 100 }
            }
          ],
          edges: []
        }),
        title: 'Duplicate IDs'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].message).toContain('Duplicate node IDs');
      }
    });

    test('should sanitize HTML in title and description', () => {
      const dataWithHTML = {
        json_graph: JSON.stringify({
          nodes: [{
            id: 'n1',
            label: '<script>alert("xss")</script>Node',
            position: { x: 0, y: 0 }
          }],
          edges: []
        }),
        title: '<b>Title</b> with <script>alert("xss")</script>',
        description: 'Description with <img src=x onerror=alert("xss")>'
      };

      const result = validate(CreateRoadmapSchema, dataWithHTML);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Title with ');
        expect(result.data.description).toBe('Description with ');
        expect(result.data.json_graph.nodes[0].label).toBe('Node');
      }
    });

    test('should reject roadmap with too many nodes', () => {
      const nodes = Array.from({ length: 101 }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        position: { x: i * 10, y: i * 10 }
      }));

      const invalidData = {
        json_graph: JSON.stringify({ nodes, edges: [] }),
        title: 'Too Many Nodes'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].message).toContain('Too many nodes');
      }
    });

    test('should reject invalid node positions', () => {
      const invalidData = {
        json_graph: JSON.stringify({
          nodes: [{
            id: 'n1',
            label: 'Node',
            position: { x: 99999, y: -99999, z: 0 }
          }],
          edges: []
        }),
        title: 'Invalid Position'
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].field).toContain('position');
      }
    });

    test('should reject invalid tags format', () => {
      const invalidData = {
        json_graph: JSON.stringify({
          nodes: [{
            id: 'n1',
            label: 'Node',
            position: { x: 0, y: 0 }
          }],
          edges: []
        }),
        title: 'Invalid Tags',
        tags: ['Valid-tag', 'INVALID_TAG', 'with spaces', '@#$%']
      };

      const result = validate(CreateRoadmapSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].message).toContain('Tags must be lowercase');
      }
    });
  });

  describe('CreateSnippetSchema Validation', () => {
    test('should accept valid snippet creation data', () => {
      const validData = {
        category: 'ui-component',
        code: 'const Component = () => { return <div>Hello</div>; };',
        title: 'React Component',
        description: 'A simple React component',
        language: 'typescript',
        ui_preview_url: 'https://example.com/preview.png',
        tags: ['react', 'ui']
      };

      const result = validate(CreateSnippetSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('ui-component');
        expect(result.data.code).toContain('Component');
      }
    });

    test('should reject snippet with malicious code patterns', () => {
      const maliciousPatterns = [
        'eval("malicious code")',
        'new Function("return this")()',
        'require("child_process").exec("rm -rf /")',
        '__import__("os").system("rm -rf /")',
        'document.cookie',
        '<script>alert("xss")</script>',
        'javascript:void(0)',
        'data:text/html,<script>alert("xss")</script>'
      ];

      maliciousPatterns.forEach(pattern => {
        const invalidData = {
          category: 'test',
          code: pattern,
          title: 'Malicious Code'
        };

        const result = validate(CreateSnippetSchema, invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].message).toContain('dangerous patterns');
        }
      });
    });

    test('should reject snippet with invalid category format', () => {
      const invalidData = {
        category: 'INVALID CATEGORY!',
        code: 'console.log("test");',
        title: 'Test'
      };

      const result = validate(CreateSnippetSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].field).toBe('category');
        expect(result.error.details[0].message).toContain('lowercase alphanumeric');
      }
    });

    test('should reject snippet with invalid URL', () => {
      const invalidURLs = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://example.com/file',
        'http://localhost/admin',
        'http://127.0.0.1/admin',
        'http://192.168.1.1/router',
        'not-a-url'
      ];

      invalidURLs.forEach(url => {
        const invalidData = {
          category: 'test',
          code: 'console.log("test");',
          title: 'Test',
          ui_preview_url: url
        };

        const result = validate(CreateSnippetSchema, invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].field).toBe('ui_preview_url');
          expect(result.error.details[0].message).toContain('URL');
        }
      });
    });

    test('should reject snippet with code exceeding max length', () => {
      const longCode = 'x'.repeat(10001);
      const invalidData = {
        category: 'test',
        code: longCode,
        title: 'Too Long'
      };

      const result = validate(CreateSnippetSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].field).toBe('code');
        expect(result.error.details[0].message).toContain('too long');
      }
    });
  });

  describe('ListQuerySchema Validation', () => {
    test('should accept valid query parameters', () => {
      const validQuery = {
        limit: 50,
        offset: 10,
        sort: 'created_at',
        order: 'desc',
        filter: {
          status: 'active',
          visibility: 'public',
          tags: ['featured'],
          search: 'roadmap'
        }
      };

      const result = validate(ListQuerySchema, validQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
        expect(result.data.sort).toBe('created_at');
      }
    });

    test('should enforce limit boundaries', () => {
      const invalidQueries = [
        { limit: 0 },     // Too low
        { limit: 101 },   // Too high
        { limit: -1 },    // Negative
        { limit: 'abc' }  // Non-numeric
      ];

      invalidQueries.forEach(query => {
        const result = validate(ListQuerySchema, query);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].field).toContain('limit');
        }
      });
    });

    test('should reject invalid sort fields', () => {
      const invalidQuery = {
        sort: 'invalid_field'
      };

      const result = validate(ListQuerySchema, invalidQuery);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.details[0].field).toBe('sort');
      }
    });

    test('should coerce string numbers to actual numbers', () => {
      const queryWithStrings = {
        limit: '25',
        offset: '5'
      };

      const result = validate(ListQuerySchema, queryWithStrings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe('number');
        expect(result.data.limit).toBe(25);
        expect(typeof result.data.offset).toBe('number');
        expect(result.data.offset).toBe(5);
      }
    });
  });

  describe('UUIDSchema Validation', () => {
    test('should accept valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'A987FBC9-4BED-3078-CF07-9141BA07C9F3' // Should be lowercased
      ];

      validUUIDs.forEach(uuid => {
        const result = validate(UUIDSchema, uuid);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(uuid.toLowerCase());
        }
      });
    });

    test('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '550e8400-e29b-41d4-a716',              // Too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
        'not-a-uuid',                           // Invalid format
        '550e8400-xxxx-41d4-a716-446655440000', // Invalid characters
        ''                                       // Empty string
      ];

      invalidUUIDs.forEach(uuid => {
        const result = validate(UUIDSchema, uuid);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].message).toContain('Invalid UUID');
        }
      });
    });
  });

  describe('LoginSchema Validation', () => {
    test('should accept valid login credentials', () => {
      const validLogin = {
        email: 'user@protothrive.com',
        password: 'SecureP@ssw0rd!'
      };

      const result = validate(LoginSchema, validLogin);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@protothrive.com');
      }
    });

    test('should normalize email to lowercase', () => {
      const loginWithUppercaseEmail = {
        email: 'User@ProtoThrive.COM',
        password: 'SecureP@ssw0rd!'
      };

      const result = validate(LoginSchema, loginWithUppercaseEmail);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@protothrive.com');
      }
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@protothrive.com',
        'user@',
        'user@.com',
        'user@domain',
        'user @protothrive.com'
      ];

      invalidEmails.forEach(email => {
        const invalidLogin = {
          email,
          password: 'SecureP@ssw0rd!'
        };

        const result = validate(LoginSchema, invalidLogin);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].field).toBe('email');
          expect(result.error.details[0].message).toContain('Invalid email');
        }
      });
    });

    test('should enforce strong password requirements', () => {
      const weakPasswords = [
        'short',           // Too short
        'alllowercase',    // No uppercase
        'ALLUPPERCASE',    // No lowercase
        'NoNumbers!',      // No numbers
        'N0Symb0ls',       // No special characters
        'a'.repeat(129)    // Too long
      ];

      weakPasswords.forEach(password => {
        const invalidLogin = {
          email: 'user@protothrive.com',
          password
        };

        const result = validate(LoginSchema, invalidLogin);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].field).toBe('password');
        }
      });
    });
  });

  describe('UpdateRoadmapSchema Validation', () => {
    test('should accept partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        status: 'active'
      };

      const result = validate(UpdateRoadmapSchema, partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Title');
        expect(result.data.status).toBe('active');
        expect(result.data.description).toBeUndefined();
      }
    });

    test('should accept empty update object', () => {
      const emptyUpdate = {};

      const result = validate(UpdateRoadmapSchema, emptyUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.keys(result.data)).toHaveLength(0);
      }
    });

    test('should validate thrive_score range', () => {
      const invalidScores = [
        { thrive_score: -0.1 },
        { thrive_score: 1.1 },
        { thrive_score: 2 }
      ];

      invalidScores.forEach(update => {
        const result = validate(UpdateRoadmapSchema, update);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.details[0].field).toBe('thrive_score');
          expect(result.error.details[0].message).toContain('between 0 and 1');
        }
      });
    });
  });

  describe('Error Message Quality', () => {
    test('should provide detailed field-level error messages', () => {
      const complexInvalidData = {
        json_graph: 'not-json',
        title: '',
        visibility: 'invalid-visibility',
        tags: ['valid', 'INVALID', 'another-invalid!']
      };

      const result = validate(CreateRoadmapSchema, complexInvalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.statusCode).toBe(400);
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details).toBeInstanceOf(Array);
        expect(result.error.details.length).toBeGreaterThan(0);

        // Check that each error has required fields
        result.error.details.forEach(detail => {
          expect(detail).toHaveProperty('field');
          expect(detail).toHaveProperty('message');
          expect(detail).toHaveProperty('type');
        });
      }
    });

    test('should include received value for type errors', () => {
      const invalidTypeData = {
        json_graph: JSON.stringify({
          nodes: [{ id: 'n1', label: 'Node', position: { x: 0, y: 0 } }],
          edges: []
        }),
        title: 'Valid Title',
        vibe_mode: 'not-a-boolean' // Should be boolean
      };

      const result = validate(CreateRoadmapSchema, invalidTypeData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const vibeError = result.error.details.find(d => d.field === 'vibe_mode');
        expect(vibeError).toBeDefined();
        if (vibeError) {
          expect(vibeError.type).toBe('invalid_type');
        }
      }
    });
  });
});

// Export for use in integration tests
export const testData = {
  validRoadmap: {
    json_graph: JSON.stringify({
      nodes: [
        { id: 'n1', label: 'Start', position: { x: 0, y: 0, z: 0 } },
        { id: 'n2', label: 'End', position: { x: 100, y: 100, z: 0 } }
      ],
      edges: [{ from: 'n1', to: 'n2' }]
    }),
    title: 'Test Roadmap',
    description: 'For testing',
    vibe_mode: false,
    visibility: 'private'
  },
  validSnippet: {
    category: 'test',
    code: 'console.log("test");',
    title: 'Test Snippet',
    description: 'For testing'
  },
  invalidRoadmap: {
    json_graph: 'invalid',
    title: '<script>alert("xss")</script>'
  },
  maliciousSnippet: {
    category: 'hack',
    code: 'eval("malicious")',
    title: 'Malicious'
  }
};