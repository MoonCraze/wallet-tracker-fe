import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory containing test files
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only was accidentally left in
  forbidOnly: !!process.env.CI,

  // Retry failed tests (more on CI)
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for navigation actions
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure (first retry only)
    video: 'on-first-retry',

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Projects for different browsers
  projects: [
    // Authentication setup - runs before tests that need auth
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop Chrome tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Mobile viewport tests (optional)
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
      },
      dependencies: ['setup'],
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server to start
  },
});
