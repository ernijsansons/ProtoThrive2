import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { unstable_dev } from 'wrangler';
import type { UnstableDevWorker } from 'wrangler';

let worker: UnstableDevWorker;

beforeAll(async () => {
  // Start the worker in test mode
  worker = await unstable_dev('src/index.ts', {
    experimental: { disableExperimentalWarning: true },
    local: true,
    persist: false,
  });
});

afterAll(async () => {
  // Stop the worker
  await worker.stop();
});

beforeEach(async () => {
  // Reset database state before each test
  // This would interact with your test D1 database
});

afterEach(async () => {
  // Clean up after each test
});

// Mock Clerk authentication for tests
export const mockAuth = (userId: string = 'test-user-id', role: string = 'vibe_coder') => {
  return {
    headers: {
      Authorization: `Bearer mock-token-${userId}`,
    },
    userId,
    role,
  };
};

// Helper to create test request
export const createTestRequest = (
  url: string,
  options: RequestInit = {},
  auth = mockAuth()
) => {
  return new Request(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...auth.headers,
      ...options.headers,
    },
  });
};