// Ref: CLAUDE.md - Comprehensive Testing Setup for ProtoThrive
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Mock environment variables
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: false });
process.env.NEXT_PUBLIC_USE_MOCK_AUTH = 'true';
process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8080';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8787';

// Global test setup
beforeAll(() => {
  console.log('🚀 Thermonuclear Test Suite: Initializing global test environment');

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock PerformanceObserver with proper typing
  const MockPerformanceObserver: any = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  MockPerformanceObserver.supportedEntryTypes = ['navigation', 'resource', 'mark', 'measure'];
  global.PerformanceObserver = MockPerformanceObserver;

  // Mock performance API
  Object.defineProperty(global, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntries: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    },
    writable: true,
  });

  // Mock WebSocket
  const MockWebSocket = vi.fn().mockImplementation((url) => ({
    url,
    readyState: 1, // OPEN
    onopen: vi.fn(),
    onclose: vi.fn(),
    onmessage: vi.fn(),
    onerror: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  (MockWebSocket as any).CONNECTING = 0;
  (MockWebSocket as any).OPEN = 1;
  (MockWebSocket as any).CLOSING = 2;
  (MockWebSocket as any).CLOSED = 3;
  global.WebSocket = MockWebSocket as any;

  // Mock crypto API
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: vi.fn((arr) => arr.map(() => Math.floor(Math.random() * 256))),
      subtle: {
        generateKey: vi.fn().mockResolvedValue({}),
        encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
        decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      },
    },
    writable: true,
  });

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
  });

  // Mock fetch
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: 'http://localhost:3000',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      formData: () => Promise.resolve(new FormData()),
      json: () => Promise.resolve({ success: true, data: 'mock data' }),
      text: () => Promise.resolve('mock text'),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      bytes: () => Promise.resolve(new Uint8Array()),
    } as any)
  );

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'test',
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
        ready: Promise.resolve({}),
      },
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
      },
      deviceMemory: 8,
      hardwareConcurrency: 4,
    },
    writable: true,
  });

  // Mock URL
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock Blob
  global.Blob = vi.fn().mockImplementation((content, options) => ({
    size: content?.length || 0,
    type: options?.type || '',
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue(''),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  }));

  // Mock Worker
  global.Worker = vi.fn().mockImplementation((url) => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: vi.fn(),
    onerror: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  // Suppress console warnings in tests
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('validateDOMNesting') ||
       message.includes('useLayoutEffect does nothing on the server') ||
       message.includes('Warning: ReactDOM.render is no longer supported'))
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset localStorage
  window.localStorage.clear();
  window.sessionStorage.clear();

  // Reset fetch mock
  vi.mocked(global.fetch).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: 'http://localhost:3000',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      formData: () => Promise.resolve(new FormData()),
      json: () => Promise.resolve({ success: true, data: 'mock data' }),
      text: () => Promise.resolve('mock text'),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      bytes: () => Promise.resolve(new Uint8Array()),
    } as Response)
  );

  // Reset performance measurements
  performance.clearMarks();
  performance.clearMeasures();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Global cleanup
afterAll(() => {
  console.log('🧹 Thermonuclear Test Suite: Cleaning up global test environment');
  vi.clearAllTimers();
  vi.resetAllMocks();
});

// Custom test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (callback: () => void | Promise<void>, timeout = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const check = async () => {
        try {
          await callback();
          resolve();
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`Timeout after ${timeout}ms: ${error}`));
          } else {
            setTimeout(check, 100);
          }
        }
      };
      check();
    });
  },

  // Mock API responses
  mockApiResponse: (data: any, status = 200) => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    } as Response);
  },

  // Mock WebSocket messages
  mockWebSocketMessage: (ws: any, message: any) => {
    if (ws.onmessage) {
      ws.onmessage({ data: JSON.stringify(message) });
    }
  },

  // Simulate user interactions
  simulateDelay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock intersection observer entries
  mockIntersectionObserver: (entries: any[]) => {
    const callback = vi.mocked(global.IntersectionObserver).mock.calls[0]?.[0];
    if (callback) {
      callback(entries, {} as IntersectionObserver);
    }
  },

  // Mock performance entries
  mockPerformanceEntry: (entry: any) => {
    vi.mocked(performance.getEntries).mockReturnValue([entry]);
    vi.mocked(performance.getEntriesByType).mockReturnValue([entry]);
    vi.mocked(performance.getEntriesByName).mockReturnValue([entry]);
  },

  // Create mock user data
  createMockUser: (overrides: any = {}) => ({
    id: 'user-test-1',
    email: 'test@protothrive.com',
    name: 'Test User',
    role: 'editor',
    status: 'active',
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
    ...overrides,
  }),

  // Create mock team data
  createMockTeam: (overrides: any = {}) => ({
    id: 'team-test-1',
    name: 'Test Team',
    description: 'Test team for unit tests',
    workspaceId: 'workspace-test-1',
    ownerId: 'user-test-1',
    members: [],
    settings: {
      visibility: 'internal',
      allowInvites: true,
      requireApproval: false,
      defaultRole: 'editor',
    },
    stats: {
      memberCount: 5,
      activeMembers: 4,
      roadmapsCount: 12,
      collaborationScore: 0.85,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  // Create mock roadmap data
  createMockRoadmap: (overrides: any = {}) => ({
    id: 'roadmap-test-1',
    title: 'Test Roadmap',
    description: 'Test roadmap for unit tests',
    nodes: [
      {
        id: 'node-1',
        label: 'Start',
        status: 'gray',
        position: { x: 0, y: 0, z: 0 },
      },
      {
        id: 'node-2',
        label: 'Middle',
        status: 'neon',
        position: { x: 100, y: 100, z: 0 },
      },
      {
        id: 'node-3',
        label: 'End',
        status: 'gray',
        position: { x: 200, y: 200, z: 0 },
      },
    ],
    edges: [
      { from: 'node-1', to: 'node-2' },
      { from: 'node-2', to: 'node-3' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  // Performance measurement helpers
  measurePerformance: (name: string, fn: () => void | Promise<void>) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    console.log(`🔥 Performance: ${name} took ${duration.toFixed(2)}ms`);

    return result;
  },

  // Memory usage tracking
  trackMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  },
};

// Export mock data generators
export const mockData = {
  user: testUtils.createMockUser,
  team: testUtils.createMockTeam,
  roadmap: testUtils.createMockRoadmap,

  // Mock performance metrics
  performanceMetric: (overrides: any = {}) => ({
    name: 'test_metric',
    value: 100,
    unit: 'ms',
    timestamp: Date.now(),
    tags: { test: 'true' },
    ...overrides,
  }),

  // Mock cache entry
  cacheEntry: (overrides: any = {}) => ({
    key: 'test_key',
    value: 'test_value',
    timestamp: Date.now(),
    ttl: 3600,
    accessCount: 1,
    lastAccessed: Date.now(),
    size: 100,
    compressed: false,
    encrypted: false,
    tags: ['test'],
    metadata: {},
    ...overrides,
  }),

  // Mock web vital
  webVital: (overrides: any = {}) => ({
    name: 'FCP',
    value: 1500,
    rating: 'good',
    delta: 1500,
    id: 'test-vital-1',
    url: 'http://localhost:3000',
    timestamp: Date.now(),
    ...overrides,
  }),
};

// Test environment validation
const validateTestEnvironment = () => {
  const requiredGlobals = [
    'IntersectionObserver',
    'ResizeObserver',
    'PerformanceObserver',
    'WebSocket',
    'fetch',
    'localStorage',
    'crypto',
  ];

  const missing = requiredGlobals.filter(global => !(global in window || global in globalThis));

  if (missing.length > 0) {
    throw new Error(`Missing required globals for testing: ${missing.join(', ')}`);
  }

  console.log('✅ Thermonuclear Test Environment: All required globals are available');
};

// Run validation
validateTestEnvironment();

console.log('🧪 Thermonuclear Test Setup: Environment configured successfully');