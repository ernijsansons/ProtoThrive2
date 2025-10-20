// Ref: CLAUDE.md Thermonuclear Backend Jest Configuration
// Modern Jest configuration for ProtoThrive backend testing

/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment for Node.js
  testEnvironment: 'node',

  // Module name mapping for TypeScript paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1'
  },

  // Module file extensions - prefer TypeScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Resolve modules
  resolver: undefined,

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/src/**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    'utils/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!utils/**/__tests__/**',
    '!**/node_modules/**'
  ],

  // High coverage thresholds for TDD - Phase 1 target: 95%
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],

  // Timeout for async operations
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.wrangler/'
  ],

  // Coverage reporting
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Error handling
  errorOnDeprecated: true,

  // Thermonuclear validation marker
  displayName: 'ProtoThrive Backend Tests - Thermonuclear Configuration'
};