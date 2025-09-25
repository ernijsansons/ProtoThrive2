import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/a11y',
  outputDir: './test-results/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report/a11y' }],
    ['json', { outputFile: 'test-results/a11y-results.json' }],
    ['list']
  ],

  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports for responsive testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});