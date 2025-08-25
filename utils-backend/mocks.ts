// Ref: CLAUDE.md Global Configs & Mocks
// Thermonuclear Mock Utilities for ProtoThrive Backend

export interface MockFetchResponse {
  ok: boolean;
  json: () => Promise<any>;
  status?: number;
  statusText?: string;
}

export interface MockDbResult {
  results: any[];
  success: boolean;
  meta?: {
    rows_affected?: number;
    last_row_id?: string;
  };
}

/**
 * Mock fetch function for external API calls
 * Ref: CLAUDE.md Global Configs & Mocks - JS Mocks
 */
export const mockFetch = (url: string, opts: RequestInit = {}): Promise<MockFetchResponse> => {
  console.log(`THERMONUCLEAR MOCK FETCH: ${url} -Opts: ${JSON.stringify(opts)}`);
  
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ 
      success: true, 
      data: 'thermo_mock', 
      id: 'uuid-thermo-mock' 
    })
  });
};

/**
 * Mock database query function for D1 operations
 * Ref: CLAUDE.md Global Configs & Mocks - JS Mocks
 */
export const mockDbQuery = (query: string, binds?: any[]): MockDbResult => {
  console.log(`THERMONUCLEAR MOCK DB: ${query} - Binds: ${JSON.stringify(binds)}`);
  
  // Return different results based on query type
  if (query.toLowerCase().includes('select')) {
    // SELECT queries return dummy data
    if (query.includes('roadmaps')) {
      return {
        success: true,
        results: [{
          id: 'uuid-thermo',
          user_id: 'uuid-thermo-1',
          json_graph: '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
          status: 'draft',
          vibe_mode: 1,
          thrive_score: 0.45,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      };
    } else if (query.includes('snippets')) {
      return {
        success: true,
        results: [{
          id: 'sn-thermo-1',
          category: 'ui',
          code: 'console.log("Thermo UI Dummy");',
          ui_preview_url: 'mock_neon.png',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      };
    } else if (query.includes('users')) {
      return {
        success: true,
        results: [{
          id: 'uuid-thermo-1',
          email: 'test@proto.com',
          role: 'vibe_coder',
          created_at: new Date().toISOString(),
          deleted_at: null
        }]
      };
    } else if (query.includes('agent_logs')) {
      return {
        success: true,
        results: [{
          id: 'log-thermo-1',
          roadmap_id: 'rm-thermo-1',
          task_type: 'ui',
          output: '// Thermo Code',
          status: 'success',
          model_used: 'kimi',
          token_count: 50,
          timestamp: new Date().toISOString()
        }]
      };
    }
  } else if (query.toLowerCase().includes('insert')) {
    // INSERT queries return success with generated ID
    return {
      success: true,
      results: [],
      meta: {
        rows_affected: 1,
        last_row_id: 'uuid-new-thermo'
      }
    };
  } else if (query.toLowerCase().includes('update')) {
    // UPDATE queries return success with rows affected
    return {
      success: true,
      results: [],
      meta: {
        rows_affected: 1
      }
    };
  } else if (query.toLowerCase().includes('delete')) {
    // DELETE queries return success with rows affected
    return {
      success: true,
      results: [],
      meta: {
        rows_affected: 1
      }
    };
  }
  
  // Default return for any other query
  return {
    success: true,
    results: []
  };
};

/**
 * Generate a mock UUID
 */
export const generateMockUUID = (): string => {
  return 'uuid-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Check if KV is paused (kill-switch)
 * Ref: CLAUDE.md Usage Guidelines - Kill-Switch
 */
export const checkKillSwitch = async (_kv: any): Promise<boolean> => {
  // Mock implementation - always return false (not paused)
  console.log('THERMONUCLEAR: Checking kill-switch - proto_paused = false');
  return false;
};