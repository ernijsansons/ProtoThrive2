// Test Utilities for ProtoThrive
// Ref: CLAUDE.md - Global Mocks/Dummies/Configs

import { mockFetch } from './mocks';

// Mock environment variables for testing
export const mockEnv = {
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  ADMIN_EMAIL: 'admin@protothrive.com',
  ADMIN_PASSWORD_HASH: '$2b$12$test.hash.for.testing.only',
  ENCRYPTION_KEY: 'test-encryption-key-32-chars',
  NODE_ENV: 'test'
};

// Mock authentication for testing
export const mockAuth = {
  token: 'mock.jwt.token.for.testing',
  user: {
    id: 'test-user-001',
    email: 'test@protothrive.com',
    role: 'vibe_coder'
  }
};

// Test data utilities
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-001',
  email: 'test@protothrive.com',
  role: 'vibe_coder',
  createdAt: new Date().toISOString(),
  ...overrides
});

export const createTestRoadmap = (overrides = {}) => ({
  id: 'test-roadmap-001',
  title: 'Test Roadmap',
  description: 'Test roadmap description',
  status: 'active',
  userId: 'test-user-001',
  createdAt: new Date().toISOString(),
  ...overrides
});

// Test API utilities
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
});

// Test validation utilities
export const validateTestResponse = (response: any, expectedKeys: string[]) => {
  const missingKeys = expectedKeys.filter(key => !(key in response));
  if (missingKeys.length > 0) {
    throw new Error(`Missing required keys: ${missingKeys.join(', ')}`);
  }
  return true;
};

// Test cleanup utilities
export const cleanupTestData = async () => {
  // Clear any test data from localStorage
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
  
  // Reset any global mocks
  if (typeof mockFetch !== 'undefined') {
    mockFetch.reset();
  }
};
