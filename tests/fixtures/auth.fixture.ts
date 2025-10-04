import { test as base, expect } from '@playwright/test';

// Define authentication fixtures
export type AuthFixtures = {
  authenticatedContext: {
    token: string;
    userId: string;
    email: string;
  };
};

// Extend base test with authentication
export const test = base.extend<AuthFixtures>({
  authenticatedContext: async ({ request, baseURL }, use) => {
    // Login and get token
    const loginResponse = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: process.env.TEST_USER_EMAIL || 'test@protothrive.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      },
    });

    if (!loginResponse.ok()) {
      // If login fails, try to register first
      const registerResponse = await request.post(`${baseURL}/api/auth/register`, {
        data: {
          email: process.env.TEST_USER_EMAIL || 'test@protothrive.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
          name: 'Test User',
        },
      });

      expect(registerResponse.ok()).toBeTruthy();

      // Try login again
      const retryLogin = await request.post(`${baseURL}/api/auth/login`, {
        data: {
          email: process.env.TEST_USER_EMAIL || 'test@protothrive.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
        },
      });

      expect(retryLogin.ok()).toBeTruthy();
      const data = await retryLogin.json();

      await use({
        token: data.token,
        userId: data.user.id,
        email: data.user.email,
      });
    } else {
      const data = await loginResponse.json();

      await use({
        token: data.token,
        userId: data.user.id,
        email: data.user.email,
      });
    }
  },
});

export { expect };