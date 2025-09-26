const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Enhanced Jest configuration for ProtoThrive
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',

  // Handle module aliases and paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/contexts/(.*)$': '<rootDir>/src/contexts/$1',
    // Mock static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/setupTests.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,jsx,ts,tsx}',
  ],

  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Transform ignore patterns for problematic modules
  transformIgnorePatterns: [
    '/node_modules/(?!(reactflow|@reactflow|d3-|@splinetool|@heroicons)/)',
  ],

  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [''],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/out/',
    '<rootDir>/dist/',
  ],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Use ts-jest for TypeScript files
  preset: 'ts-jest/presets/js-with-ts-esm',

  // Globals for tests
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);