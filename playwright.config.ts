import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for End-to-End API testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/tests/e2e/specs',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 2,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 2 : 4,
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3001',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* API testing settings */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  /* Global setup and teardown */
  globalSetup: './src/tests/e2e/setup/global-setup.ts',
  globalTeardown: './src/tests/e2e/setup/global-teardown.ts',

  /* Configure projects for major browsers - we only need API testing */
  projects: [
    {
      name: 'api',
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // API testing doesn't need a browser
        headless: true,
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/e2e',
})
