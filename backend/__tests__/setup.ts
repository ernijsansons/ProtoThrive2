/**
 * Jest Test Setup - Global Configuration
 * Provides mocks, utilities, and environment setup for all tests
 */

import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock crypto.subtle for password hashing tests
const nodeCrypto = require('crypto');
if (!(global as any).crypto) {
  (global as any).crypto = {
    subtle: nodeCrypto.webcrypto.subtle,
    getRandomValues: (arr: any) => nodeCrypto.randomFillSync(arr),
  };
}

// Mock performance.now() for timing attack tests
if (!(global as any).performance) {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// Set global test timeout
jest.setTimeout(30000);

// Global test utilities
(global as any).sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-at-least-64-characters-long-for-security-testing';

// Suppress console during tests (optional - can be removed for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global afterEach cleanup
afterEach(() => {
  jest.clearAllMocks();
});
