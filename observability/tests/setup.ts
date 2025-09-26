// Jest test setup file
import { jest } from '@jest/globals';

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.ENVIRONMENT = 'test';

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidJson(): R;
      toHaveLogLevel(level: string): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidJson(received: string) {
    try {
      JSON.parse(received);
      return {
        message: () => `Expected ${received} not to be valid JSON`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected ${received} to be valid JSON, but got: ${error}`,
        pass: false,
      };
    }
  },

  toHaveLogLevel(received: any, expectedLevel: string) {
    const hasLevel = received && received.level === expectedLevel;
    return {
      message: () =>
        hasLevel
          ? `Expected log not to have level ${expectedLevel}`
          : `Expected log to have level ${expectedLevel}, but got ${received?.level}`,
      pass: hasLevel,
    };
  },
});

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

export {};