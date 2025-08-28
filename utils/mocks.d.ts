export interface MockFetchResponse {
    ok: boolean;
    json: () => Promise<any>;
    status?: number;
    statusText?: string;
    text?: () => Promise<string>;
}
export interface MockDbResult {
    results: unknown[];
    success: boolean;
    meta?: {
        rows_affected?: number;
        last_row_id?: string;
    };
}
export interface MockApiResponse {
    success: boolean;
    data: unknown;
    id?: string;
    message?: string;
}
export interface MockJwtPayload {
    id: string;
    role: 'vibe_coder' | 'engineer' | 'exec';
    email?: string;
    exp?: number;
}
/**
 * Mock fetch function for external API calls
 * Ref: CLAUDE.md Global Configs & Mocks - Backend Phase
 */
export declare const mockFetch: (url: string, opts?: RequestInit) => Promise<MockFetchResponse>;
/**
 * Mock database query function for D1 operations
 * Ref: CLAUDE.md Global Configs & Mocks - Backend Phase
 */
export declare const mockDbQuery: (query: string, binds?: unknown[]) => MockDbResult;
/**
 * Check kill-switch status from KV
 * Ref: CLAUDE.md Usage Guidelines - Kill-Switch
 */
export declare const checkKillSwitch: (_kv: unknown) => Promise<boolean>;
/**
 * Generate mock UUID
 */
export declare const generateMockUUID: () => string;
/**
 * Mock JWT token validation
 * Ref: CLAUDE.md Phase 5 - Security Mocks
 */
export declare const mockJwtValidation: (token: string) => {
    valid: boolean;
    payload?: MockJwtPayload;
};
/**
 * Validate JWT header and return payload
 * Ref: CLAUDE.md Phase 5 - Security Auth
 */
export declare const validateJwt: (header: string) => Promise<MockJwtPayload>;
/**
 * Budget check function
 * Ref: CLAUDE.md Phase 5 - Security Cost
 */
export declare const checkBudget: (currentBudget: number, additionalCost: number) => number;
/**
 * Mock vault operations
 * Ref: CLAUDE.md Phase 5 - Security Vault
 */
export declare const mockVaultOperations: {
    get: (key: string) => string;
    put: (key: string, value: string) => boolean;
    rotate: () => boolean;
};
/**
 * Mock Spline scene loader
 * Ref: CLAUDE.md Phase 2 - Frontend Mocks
 */
export declare const mockSplineLoader: (sceneUrl: string) => Promise<boolean>;
/**
 * Mock WebSocket connection for real-time updates
 * Ref: CLAUDE.md Phase 2 - Frontend Mocks
 */
export declare const mockWebSocket: (url: string) => {
    send: (data: string) => void;
    close: () => void;
    readyState: number;
    onopen: null;
    onmessage: null;
    onerror: null;
    onclose: null;
};
/**
 * Mock local storage operations
 */
export declare const mockLocalStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
};
/**
 * Mock n8n workflow execution
 * Ref: CLAUDE.md Phase 4 - Automation Mocks
 */
export declare const mockWorkflowExecution: (workflowId: string, data: unknown) => Promise<MockApiResponse>;
/**
 * Mock CI/CD pipeline execution
 * Ref: CLAUDE.md Phase 4 - Automation Mocks
 */
export declare const mockPipelineExecution: (pipeline: string) => Promise<MockApiResponse>;
/**
 * Calculate Thrive Score
 * Ref: CLAUDE.md Global Dummy Data & Thrive Score Formula
 */
export declare const calculateThriveScore: (logs: unknown[]) => {
    score: number;
    status: "gray" | "neon";
};
/**
 * Create dummy data for testing
 * Ref: CLAUDE.md Global Dummy Data
 */
export declare const createDummyData: () => {
    user: {
        id: string;
        role: string;
        email: string;
    };
    roadmap: {
        id: string;
        json_graph: string;
        vibe_mode: boolean;
        thrive_score: number;
    };
    snippet: {
        id: string;
        category: string;
        code: string;
        ui_preview_url: string;
    };
    agentLog: {
        roadmap_id: string;
        task_type: string;
        output: string;
        status: string;
        model_used: string;
        token_count: number;
    };
};
/**
 * Validate all mocks are working
 */
export declare const validateMocks: () => Promise<boolean>;
declare const _default: {
    mockFetch: (url: string, opts?: RequestInit) => Promise<MockFetchResponse>;
    mockDbQuery: (query: string, binds?: unknown[]) => MockDbResult;
    mockSplineLoader: (sceneUrl: string) => Promise<boolean>;
    mockWebSocket: (url: string) => {
        send: (data: string) => void;
        close: () => void;
        readyState: number;
        onopen: null;
        onmessage: null;
        onerror: null;
        onclose: null;
    };
    mockWorkflowExecution: (workflowId: string, data: unknown) => Promise<MockApiResponse>;
    mockPipelineExecution: (pipeline: string) => Promise<MockApiResponse>;
    mockJwtValidation: (token: string) => {
        valid: boolean;
        payload?: MockJwtPayload;
    };
    validateJwt: (header: string) => Promise<MockJwtPayload>;
    mockVaultOperations: {
        get: (key: string) => string;
        put: (key: string, value: string) => boolean;
        rotate: () => boolean;
    };
    checkKillSwitch: (_kv: unknown) => Promise<boolean>;
    checkBudget: (currentBudget: number, additionalCost: number) => number;
    generateMockUUID: () => string;
    calculateThriveScore: (logs: unknown[]) => {
        score: number;
        status: "gray" | "neon";
    };
    createDummyData: () => {
        user: {
            id: string;
            role: string;
            email: string;
        };
        roadmap: {
            id: string;
            json_graph: string;
            vibe_mode: boolean;
            thrive_score: number;
        };
        snippet: {
            id: string;
            category: string;
            code: string;
            ui_preview_url: string;
        };
        agentLog: {
            roadmap_id: string;
            task_type: string;
            output: string;
            status: string;
            model_used: string;
            token_count: number;
        };
    };
    validateMocks: () => Promise<boolean>;
    mockLocalStorage: {
        getItem: (key: string) => string | null;
        setItem: (key: string, value: string) => void;
        removeItem: (key: string) => void;
    };
};
export default _default;
//# sourceMappingURL=mocks.d.ts.map