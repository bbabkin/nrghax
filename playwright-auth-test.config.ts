import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for testing authentication with existing dev server
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run auth tests sequentially
  retries: 0, // No retries for quick testing
  workers: 1, // Single worker
  reporter: [['html']],
  
  use: {
    baseURL: 'http://localhost:3002', // Use HTTP since that's what our dev server uses
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer since we have one running already
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
})