// Ref: CLAUDE.md Thermonuclear Unified Mocks - All Phases Consolidated
// ProtoThrive Root utils/mocks.ts - Complete JavaScript/TypeScript Mock Library
// Generated: 2025-08-24 by Thermonuclear Integration Terminal

export interface MockFetchResponse {
  ok: boolean;
  json: () => Promise<any>;
  status?: number;
  statusText?: string;
  text?: () => Promise<string>;
}

export interface MockDbResult {
  results: any[];
  success: boolean;
  meta?: {
    rows_affected?: number;
    last_row_id?: string;
  };
}

export interface MockApiResponse {
  success: boolean;
  data: any;
  id?: string;
  message?: string;
}

export interface MockJwtPayload {
  id: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
  email?: string;
  exp?: number;
}

// ======================
// BACKEND MOCKS (From backend/utils/mocks.ts)
// ======================

/**
 * Mock fetch function for external API calls
 * Ref: CLAUDE.md Global Configs & Mocks - Backend Phase
 */
export const mockFetch = (url: string, opts: RequestInit = {}): Promise<MockFetchResponse> => {
  console.log(`THERMONUCLEAR MOCK FETCH: ${url} - Opts: ${JSON.stringify(opts)}`);
  
  // Simulate different responses based on URL patterns
  let mockData: any = { success: true, data: 'thermo_mock', id: 'uuid-thermo-mock' };
  
  if (url.includes('claude')) {
    mockData = { model: 'claude', response: '// Thermonuclear Claude Response', tokens: 150 };
  } else if (url.includes('kimi')) {
    mockData = { model: 'kimi', response: '// Thermonuclear Kimi Response', tokens: 75 };
  } else if (url.includes('uxpilot')) {
    mockData = { model: 'uxpilot', ui_preview: 'neon_ui.png', css: 'background: neon-gradient' };
  } else if (url.includes('vercel')) {
    mockData = { deployment_url: 'https://proto-thermo.vercel.app', status: 'ready' };
  } else if (url.includes('spline')) {
    mockData = { scene_url: 'https://prod.spline.design/neon-cube-thermo', loaded: true };
  }
  
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => mockData,
    text: async () => JSON.stringify(mockData)
  });
};

/**
 * Mock database query function for D1 operations
 * Ref: CLAUDE.md Global Configs & Mocks - Backend Phase
 */
export const mockDbQuery = (query: string, binds?: any[]): MockDbResult => {
  console.log(`THERMONUCLEAR MOCK DB: ${query} - Binds: ${JSON.stringify(binds)}`);
  
  // Return different results based on query type
  if (query.toLowerCase().includes('select')) {
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
        results: Array.from({length: 50}, (_, i) => ({
          id: `sn-thermo-${i}`,
          category: i % 4 === 0 ? 'ui' : i % 4 === 1 ? 'auth' : i % 4 === 2 ? 'deploy' : 'api',
          code: `console.log("Thermo Snippet ${i}");`,
          ui_preview_url: 'mock_neon.png',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
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
    return {
      success: true,
      results: [],
      meta: {
        rows_affected: 1,
        last_row_id: 'uuid-new-thermo'
      }
    };
  } else if (query.toLowerCase().includes('update') || query.toLowerCase().includes('delete')) {
    return {
      success: true,
      results: [],
      meta: {
        rows_affected: 1
      }
    };
  }
  
  return { success: true, results: [] };
};

/**
 * Check kill-switch status from KV
 * Ref: CLAUDE.md Usage Guidelines - Kill-Switch
 */
export const checkKillSwitch = async (_kv: any): Promise<boolean> => {
  console.log('THERMONUCLEAR: Checking kill-switch - proto_paused = false');
  return false; // Always operational in mock mode
};

/**
 * Generate mock UUID
 */
export const generateMockUUID = (): string => {
  return 'uuid-thermo-' + Math.random().toString(36).substr(2, 9);
};

// ======================
// SECURITY MOCKS (From security/src/auth.js, cost.js)
// ======================

/**
 * Mock JWT token validation
 * Ref: CLAUDE.md Phase 5 - Security Mocks
 */
export const mockJwtValidation = (token: string): { valid: boolean; payload?: MockJwtPayload } => {
  console.log(`THERMONUCLEAR MOCK JWT: Validating token`);
  
  if (token && (token.includes('mock') || token.includes('thermo'))) {
    return {
      valid: true,
      payload: {
        id: 'uuid-thermo-1',
        role: 'vibe_coder',
        email: 'test@proto.com',
        exp: Date.now() + 3600000 // 1 hour from now
      }
    };
  }
  
  return { valid: false };
};

/**
 * Validate JWT header and return payload
 * Ref: CLAUDE.md Phase 5 - Security Auth
 */
export const validateJwt = async (header: string): Promise<MockJwtPayload> => {
  const token = header?.replace('Bearer ', '');
  if (!token) {
    throw { code: 'AUTH-401', message: 'Missing token' };
  }
  
  const result = mockJwtValidation(token);
  if (!result.valid || !result.payload) {
    throw { code: 'AUTH-401', message: 'Invalid token' };
  }
  
  console.log("Thermonuclear Auth: Valid");
  return result.payload;
};

/**
 * Budget check function
 * Ref: CLAUDE.md Phase 5 - Security Cost
 */
export const checkBudget = (currentBudget: number, additionalCost: number): number => {
  const total = currentBudget + additionalCost;
  const limit = 0.10; // $0.10 per task
  
  console.log(`Thermonuclear Budget: ${total.toFixed(4)}`);
  
  if (total > limit) {
    throw { code: 'BUDGET-429', message: `Task cost $${total.toFixed(4)} exceeds limit $${limit}` };
  }
  
  return total;
};

/**
 * Mock vault operations
 * Ref: CLAUDE.md Phase 5 - Security Vault
 */
export const mockVaultOperations = {
  get: (key: string): string => {
    console.log(`Thermonuclear Vault Get ${key}`);
    const secrets: Record<string, string> = {
      'claude_key': 'sk-ant-mock_claude_thermo',
      'kimi_key': 'mock_kimi_nuclear',
      'uxpilot_key': 'mock_ux_thermo',
      'jwt_secret': 'mock_jwt_secret_thermonuclear_2025'
    };
    return secrets[key] || 'mock_secret_value';
  },
  
  put: (key: string, value: string): boolean => {
    console.log(`Thermonuclear Vault Put ${key}`);
    return true;
  },
  
  rotate: (): boolean => {
    console.log('Thermonuclear Vault: Rotating keys');
    return true;
  }
};

// ======================
// FRONTEND MOCKS
// ======================

/**
 * Mock Spline scene loader
 * Ref: CLAUDE.md Phase 2 - Frontend Mocks
 */
export const mockSplineLoader = (sceneUrl: string): Promise<boolean> => {
  console.log(`THERMONUCLEAR MOCK SPLINE: Loading scene ${sceneUrl}`);
  return Promise.resolve(true);
};

/**
 * Mock WebSocket connection for real-time updates
 * Ref: CLAUDE.md Phase 2 - Frontend Mocks
 */
export const mockWebSocket = (url: string) => {
  console.log(`THERMONUCLEAR MOCK WEBSOCKET: Connecting to ${url}`);
  
  return {
    send: (data: string) => console.log(`THERMONUCLEAR WS SEND: ${data}`),
    close: () => console.log('THERMONUCLEAR WS CLOSE'),
    readyState: 1, // OPEN
    onopen: null,
    onmessage: null,
    onerror: null,
    onclose: null
  };
};

/**
 * Mock local storage operations
 */
export const mockLocalStorage = {
  getItem: (key: string): string | null => {
    console.log(`THERMONUCLEAR LOCALSTORAGE GET: ${key}`);
    return key.includes('thrive') ? '0.45' : null;
  },
  setItem: (key: string, value: string): void => {
    console.log(`THERMONUCLEAR LOCALSTORAGE SET: ${key} = ${value}`);
  },
  removeItem: (key: string): void => {
    console.log(`THERMONUCLEAR LOCALSTORAGE REMOVE: ${key}`);
  }
};

// ======================
// AUTOMATION MOCKS
// ======================

/**
 * Mock n8n workflow execution
 * Ref: CLAUDE.md Phase 4 - Automation Mocks
 */
export const mockWorkflowExecution = (workflowId: string, data: any): Promise<MockApiResponse> => {
  console.log(`THERMONUCLEAR MOCK WORKFLOW: ${workflowId} - Data: ${JSON.stringify(data)}`);
  
  return Promise.resolve({
    success: true,
    data: {
      execution_id: 'exec-thermo-' + Math.random().toString(36).substr(2, 9),
      status: 'completed',
      outputs: ['task_completed', 'notification_sent', 'metrics_updated']
    },
    message: 'Workflow executed successfully'
  });
};

/**
 * Mock CI/CD pipeline execution
 * Ref: CLAUDE.md Phase 4 - Automation Mocks
 */
export const mockPipelineExecution = (pipeline: string): Promise<MockApiResponse> => {
  console.log(`THERMONUCLEAR MOCK PIPELINE: ${pipeline}`);
  
  return Promise.resolve({
    success: true,
    data: {
      pipeline_id: 'pipe-thermo-' + Math.random().toString(36).substr(2, 9),
      status: 'passed',
      stages: ['lint', 'test', 'build', 'deploy'],
      duration_ms: 45000
    }
  });
};

// ======================
// UTILITY FUNCTIONS
// ======================

/**
 * Calculate Thrive Score
 * Ref: CLAUDE.md Global Dummy Data & Thrive Score Formula
 */
export const calculateThriveScore = (logs: any[]): { score: number; status: 'gray' | 'neon' } => {
  if (!logs || logs.length === 0) return { score: 0, status: 'gray' };
  
  const completion = logs.filter(l => l.status === 'success').length / logs.length * 0.6;
  const ui_polish = logs.filter(l => l.type === 'ui').length / logs.length * 0.3;
  const risk = 1 - (logs.filter(l => l.status === 'fail').length / logs.length) * 0.1;
  const score = completion + ui_polish + risk;
  
  console.log(`THERMONUCLEAR THRIVE SCORE: ${score.toFixed(2)}`);
  
  return {
    score: parseFloat(score.toFixed(2)),
    status: score > 0.5 ? 'neon' : 'gray'
  };
};

/**
 * Create dummy data for testing
 * Ref: CLAUDE.md Global Dummy Data
 */
export const createDummyData = () => {
  return {
    user: { id: 'uuid-thermo-1', role: 'vibe_coder', email: 'test@proto.com' },
    roadmap: {
      id: 'rm-thermo-1',
      json_graph: '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
      vibe_mode: true,
      thrive_score: 0.45
    },
    snippet: { id: 'sn-thermo-1', category: 'ui', code: 'console.log("Thermo UI Dummy");', ui_preview_url: 'mock_neon.png' },
    agentLog: { roadmap_id: 'rm-thermo-1', task_type: 'ui', output: '// Thermo Code', status: 'success', model_used: 'kimi', token_count: 50 }
  };
};

// ======================
// VALIDATION & TESTING
// ======================

/**
 * Validate all mocks are working
 */
export const validateMocks = async (): Promise<boolean> => {
  try {
    console.log('THERMONUCLEAR: Validating unified mocks...');
    
    // Test fetch mock
    const fetchResult = await mockFetch('https://api.claude.ai/test');
    if (!fetchResult.ok) throw new Error('Fetch mock failed');
    
    // Test DB mock
    const dbResult = mockDbQuery('SELECT * FROM roadmaps WHERE id = ?', ['test-id']);
    if (!dbResult.success) throw new Error('DB mock failed');
    
    // Test JWT mock
    const jwtResult = mockJwtValidation('mock-jwt-token');
    if (!jwtResult.valid) throw new Error('JWT mock failed');
    
    // Test budget check
    const budgetResult = checkBudget(0.05, 0.03);
    if (budgetResult <= 0) throw new Error('Budget mock failed');
    
    // Test Thrive Score
    const thriveResult = calculateThriveScore([
      { status: 'success', type: 'ui' },
      { status: 'success', type: 'api' }
    ]);
    if (thriveResult.score <= 0) throw new Error('Thrive Score mock failed');
    
    console.log('✅ THERMONUCLEAR: All unified mocks validated successfully');
    return true;
    
  } catch (error: any) {
    console.error('❌ THERMONUCLEAR MOCK VALIDATION FAILED:', error.message);
    return false;
  }
};

// ======================
// EXPORTS (All Mock Functions)
// ======================

// Export default object for easier imports
export default {
  mockFetch,
  mockDbQuery,
  mockSplineLoader,
  mockWebSocket,
  mockWorkflowExecution,
  mockPipelineExecution,
  mockJwtValidation,
  validateJwt,
  mockVaultOperations,
  checkKillSwitch,
  checkBudget,
  generateMockUUID,
  calculateThriveScore,
  createDummyData,
  validateMocks,
  mockLocalStorage
};

console.log('🚀 THERMONUCLEAR UNIFIED MOCKS: TypeScript/JavaScript complete mock library loaded - All phases consolidated');