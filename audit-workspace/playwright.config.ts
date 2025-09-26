// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * ProtoThrive E2E Test Configuration
 * Comprehensive testing across browsers, devices, and conditions
 */

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Test match pattern
  testMatch: '**/*.spec.ts',
  
  // Maximum time one test can run
  timeout: 30000,
  
  // Global timeout for the whole test suite
  globalTimeout: 60 * 60 * 1000, // 1 hour
  
  // Number of retries on CI
  retries: process.env.CI ? 2 : 0,
  
  // Number of parallel workers
  workers: process.env.CI ? 4 : undefined,
  
  // Reporter configuration
  reporter: [
    // Console reporter for development
    ['list'],
    // HTML reporter for detailed results
    ['html', { 
      outputFolder: 'test-results/html',
      open: 'never'
    }],
    // JSON reporter for CI integration
    ['json', { 
      outputFile: 'test-results/results.json' 
    }],
    // JUnit reporter for CI systems
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    // Custom screenshot reporter
    ['./reporters/screenshot-reporter.ts'],
    // Allure reporter for comprehensive reporting
    ['allure-playwright', {
      outputFolder: 'test-results/allure',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: false,
    }]
  ],
  
  // Shared test configuration
  use: {
    // Base URL for the application
    baseURL: process.env.BASE_URL || 'https://protothrive-frontend.pages.dev',
    
    // Artifact settings
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    trace: 'on-first-retry',
    
    // Navigation timeout
    navigationTimeout: 10000,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // User agent
    userAgent: 'Mozilla/5.0 (ProtoThrive E2E Tests) Chrome/120.0.0.0',
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'America/New_York',
    
    // Permissions
    permissions: ['geolocation', 'notifications'],
    
    // Geolocation
    geolocation: { longitude: -95.3698, latitude: 29.7604 }, // Houston, TX
    
    // Color scheme
    colorScheme: 'light',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Test-Suite': 'ProtoThrive-E2E',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    
    // HTTP credentials for basic auth
    httpCredentials: process.env.HTTP_AUTH ? {
      username: process.env.HTTP_USERNAME!,
      password: process.env.HTTP_PASSWORD!
    } : undefined,
    
    // Offline mode
    offline: false,
    
    // JavaScript enabled
    javaScriptEnabled: true,
    
    // Has touch
    hasTouch: false,
    
    // Is mobile
    isMobile: false,
    
    // Device scale factor
    deviceScaleFactor: 1,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Context options
    contextOptions: {
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 1280, height: 720 }
      }
    }
  },
  
  // Configure projects for different browsers and devices
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Mobile Devices
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 14 Pro'],
        viewport: { width: 393, height: 852 }
      },
    },
    {
      name: 'Mobile Safari SE',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      },
    },
    
    // Tablets
    {
      name: 'iPad',
      use: { 
        ...devices['iPad (gen 7)'],
        viewport: { width: 810, height: 1080 }
      },
    },
    {
      name: 'iPad Pro',
      use: { 
        ...devices['iPad Pro 11'],
        viewport: { width: 834, height: 1194 }
      },
    },
    
    // Accessibility Testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Force high contrast mode
        colorScheme: 'dark',
        // Reduced motion
        reducedMotion: 'reduce',
      },
    },
    
    // Performance Testing (Slow Network)
    {
      name: 'slow-network',
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G
        offline: false,
        // Add custom context options for network throttling
        contextOptions: {
          // This would be handled by CDP if supported
        }
      },
    },
    
    // Locale Testing
    {
      name: 'locale-es',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'es-ES',
        timezoneId: 'Europe/Madrid',
      },
    },
    {
      name: 'locale-de',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
      },
    },
    {
      name: 'locale-ja',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
      },
    },
    
    // Dark Mode Testing
    {
      name: 'dark-mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
      },
    },
    
    // Authenticated User Testing
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/auth/user.json',
      },
    },
    
    // Admin User Testing
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/auth/admin.json',
      },
    },
  ],
  
  // Web server configuration for local testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
    },
  },
  
  // Global setup
  globalSetup: './tests/global-setup.ts',
  
  // Global teardown
  globalTeardown: './tests/global-teardown.ts',
  
  // Output folder for test artifacts
  outputDir: 'test-results/artifacts',
  
  // Whether to preserve output
  preserveOutput: 'failures-only',
  
  // Fail the build on test failure
  forbidOnly: !!process.env.CI,
  
  // Quiet mode
  quiet: false,
  
  // Update snapshots
  updateSnapshots: 'missing',
  
  // Expect configuration
  expect: {
    // Maximum time expect() should wait
    timeout: 5000,
    
    // Configuration for toHaveScreenshot
    toHaveScreenshot: {
      // Threshold between 0-1
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  
  // Maximum failures
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Metadata for reporting
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    browser: 'all',
    platform: process.platform,
    version: process.env.npm_package_version,
    buildNumber: process.env.BUILD_NUMBER || 'local',
    testRun: new Date().toISOString(),
  },
});
