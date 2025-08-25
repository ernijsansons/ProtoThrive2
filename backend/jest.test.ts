// Ref: CLAUDE.md Terminal 1 Phase 1 - Test Suite
// Thermonuclear Test Suite for ProtoThrive Backend

import { 
  validateRoadmapBody, 
  validateSnippetBody,
  validateAgentLogBody,
  validateInsightBody,
  validateUUID,
  validateQueryParams
} from './utils/validation';
import {
  mockFetch,
  mockDbQuery,
  generateMockUUID,
  checkKillSwitch
} from '../utils/mocks';

// Test validation functions
describe('Validation Utils', () => {
  describe('validateRoadmapBody', () => {
    test('should accept valid roadmap body', () => {
      const validBody = {
        json_graph: '{"nodes":[{"id":"n1"}],"edges":[]}',
        vibe_mode: true
      };
      
      expect(() => validateRoadmapBody(validBody)).not.toThrow();
      const result = validateRoadmapBody(validBody);
      expect(result.json_graph).toBe(validBody.json_graph);
      expect(result.vibe_mode).toBe(true);
    });

    test('should reject invalid JSON in json_graph', () => {
      const invalidBody = {
        json_graph: 'invalid json',
        vibe_mode: true
      };
      
      expect(() => validateRoadmapBody(invalidBody)).toThrow('VAL-400');
    });

    test('should reject too short json_graph', () => {
      const invalidBody = {
        json_graph: '{}',
        vibe_mode: true
      };
      
      expect(() => validateRoadmapBody(invalidBody)).toThrow('VAL-400');
    });

    test('should reject missing vibe_mode', () => {
      const invalidBody = {
        json_graph: '{"nodes":[{"id":"n1"}],"edges":[]}'
      };
      
      expect(() => validateRoadmapBody(invalidBody)).toThrow('VAL-400');
    });
  });

  describe('validateSnippetBody', () => {
    test('should accept valid snippet body', () => {
      const validBody = {
        category: 'ui',
        code: 'console.log("Hello");',
        ui_preview_url: 'https://example.com/preview.png'
      };
      
      expect(() => validateSnippetBody(validBody)).not.toThrow();
      const result = validateSnippetBody(validBody);
      expect(result.category).toBe('ui');
      expect(result.code).toBe('console.log("Hello");');
      expect(result.ui_preview_url).toBe('https://example.com/preview.png');
    });

    test('should accept snippet without ui_preview_url', () => {
      const validBody = {
        category: 'backend',
        code: 'function test() {}'
      };
      
      expect(() => validateSnippetBody(validBody)).not.toThrow();
    });

    test('should reject empty category', () => {
      const invalidBody = {
        category: '',
        code: 'console.log("Hello");'
      };
      
      expect(() => validateSnippetBody(invalidBody)).toThrow('VAL-400');
    });

    test('should reject invalid URL format', () => {
      const invalidBody = {
        category: 'ui',
        code: 'console.log("Hello");',
        ui_preview_url: 'not-a-url'
      };
      
      expect(() => validateSnippetBody(invalidBody)).toThrow('VAL-400');
    });
  });

  describe('validateUUID', () => {
    test('should accept valid UUID formats', () => {
      expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(validateUUID('uuid-thermo-1')).toBe(true); // Mock format
    });

    test('should reject invalid UUID formats', () => {
      expect(validateUUID('invalid-uuid')).toBe(false);
      expect(validateUUID('12345')).toBe(false);
      expect(validateUUID('')).toBe(false);
    });
  });

  describe('validateQueryParams', () => {
    test('should set default values for missing params', () => {
      const result = validateQueryParams({});
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    test('should accept valid query params', () => {
      const params = {
        limit: '50',
        offset: '10',
        status: 'active',
        category: 'ui'
      };
      
      const result = validateQueryParams(params);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(10);
      expect(result.status).toBe('active');
      expect(result.category).toBe('ui');
    });

    test('should reject limit over 100', () => {
      const params = { limit: '150' };
      expect(() => validateQueryParams(params)).toThrow('VAL-400');
    });

    test('should reject negative offset', () => {
      const params = { offset: '-10' };
      expect(() => validateQueryParams(params)).toThrow('VAL-400');
    });
  });
});

// Test mock utilities
describe('Mock Utilities', () => {
  describe('mockFetch', () => {
    test('should return successful mock response', async () => {
      const response = await mockFetch('https://example.com/api', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });
      
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBe('thermo_mock');
      expect(data.id).toBe('uuid-thermo-mock');
    });
  });

  describe('mockDbQuery', () => {
    test('should return roadmap data for SELECT queries', () => {
      const result = mockDbQuery('SELECT * FROM roadmaps WHERE id = ?', ['uuid-1']);
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].id).toBe('uuid-thermo');
      expect(result.results[0].json_graph).toContain('Thermo Start');
      expect(result.results[0].thrive_score).toBe(0.45);
    });

    test('should return snippet data for SELECT queries', () => {
      const result = mockDbQuery('SELECT * FROM snippets WHERE category = ?', ['ui']);
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].category).toBe('ui');
      expect(result.results[0].code).toContain('Thermo UI Dummy');
    });

    test('should return success for INSERT queries', () => {
      const result = mockDbQuery('INSERT INTO roadmaps VALUES ?', ['data']);
      
      expect(result.success).toBe(true);
      expect(result.meta?.rows_affected).toBe(1);
      expect(result.meta?.last_row_id).toBe('uuid-new-thermo');
    });

    test('should return success for UPDATE queries', () => {
      const result = mockDbQuery('UPDATE roadmaps SET status = ?', ['active']);
      
      expect(result.success).toBe(true);
      expect(result.meta?.rows_affected).toBe(1);
    });

    test('should return success for DELETE queries', () => {
      const result = mockDbQuery('DELETE FROM users WHERE id = ?', ['uuid-1']);
      
      expect(result.success).toBe(true);
      expect(result.meta?.rows_affected).toBe(1);
    });
  });

  describe('generateMockUUID', () => {
    test('should generate unique mock UUIDs', () => {
      const uuid1 = generateMockUUID();
      const uuid2 = generateMockUUID();
      
      expect(uuid1).toMatch(/^uuid-[a-z0-9]{9}$/);
      expect(uuid2).toMatch(/^uuid-[a-z0-9]{9}$/);
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('checkKillSwitch', () => {
    test('should return false (not paused) in mock', async () => {
      const mockKV = {};
      const isPaused = await checkKillSwitch(mockKV);
      
      expect(isPaused).toBe(false);
    });
  });
});

// Test for agent log validation
describe('Agent Log Validation', () => {
  test('should accept valid agent log', () => {
    const validLog = {
      roadmap_id: 'uuid-thermo-1',
      task_type: 'ui',
      output: '// Generated code',
      status: 'success' as const,
      model_used: 'kimi',
      token_count: 150
    };
    
    expect(() => validateAgentLogBody(validLog)).not.toThrow();
  });

  test('should reject invalid status', () => {
    const invalidLog = {
      roadmap_id: 'uuid-thermo-1',
      task_type: 'ui',
      output: '// Generated code',
      status: 'invalid-status',
      model_used: 'kimi',
      token_count: 150
    };
    
    expect(() => validateAgentLogBody(invalidLog)).toThrow('VAL-400');
  });

  test('should reject negative token count', () => {
    const invalidLog = {
      roadmap_id: 'uuid-thermo-1',
      task_type: 'ui',
      output: '// Generated code',
      status: 'success' as const,
      model_used: 'kimi',
      token_count: -10
    };
    
    expect(() => validateAgentLogBody(invalidLog)).toThrow('VAL-400');
  });
});

// Test for insight validation
describe('Insight Validation', () => {
  test('should accept valid insight', () => {
    const validInsight = {
      roadmap_id: 'uuid-thermo-1',
      type: 'performance' as const,
      data: '{"metrics": {"speed": 0.95}}',
      score: 0.85
    };
    
    expect(() => validateInsightBody(validInsight)).not.toThrow();
  });

  test('should reject score outside 0-1 range', () => {
    const invalidInsight = {
      roadmap_id: 'uuid-thermo-1',
      type: 'performance' as const,
      data: '{"metrics": {}}',
      score: 1.5
    };
    
    expect(() => validateInsightBody(invalidInsight)).toThrow('VAL-400');
  });

  test('should reject invalid JSON in data field', () => {
    const invalidInsight = {
      roadmap_id: 'uuid-thermo-1',
      type: 'performance' as const,
      data: 'not json',
      score: 0.5
    };
    
    expect(() => validateInsightBody(invalidInsight)).toThrow('VAL-400');
  });

  test('should reject invalid type', () => {
    const invalidInsight = {
      roadmap_id: 'uuid-thermo-1',
      type: 'invalid-type',
      data: '{}',
      score: 0.5
    };
    
    expect(() => validateInsightBody(invalidInsight)).toThrow('VAL-400');
  });
});

console.log('Thermonuclear Test Suite: All tests defined - Run with npm test');