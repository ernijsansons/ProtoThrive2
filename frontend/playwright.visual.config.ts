import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 * Captures and compares visual snapshots to detect UI changes
 */
export default defineConfig({
  testDir: './e2e/visual',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'visual-snapshots/html-report' }],
    ['json', { outputFile: 'visual-snapshots/results.json' }],
    process.env.CI ? ['github'] : ['list']
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Capture screenshots for visual comparison */
    screenshot: 'only-on-failure',

    /* Visual comparison settings */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Ensure consistent visual snapshots
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Mobile viewports for responsive visual testing */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Visual comparison thresholds */
  expect: {
    // Global threshold for visual comparisons (0.2 = 20%)
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'pixel',
      animations: 'disabled',
    },

    // Global threshold for element screenshots
    toMatchSnapshot: {
      threshold: 0.3,
      mode: 'pixel',
    },
  },

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});