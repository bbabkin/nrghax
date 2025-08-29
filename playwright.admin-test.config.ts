import { defineConfig, devices } from '@playwright/test'

/**
 * Admin testing configuration without webServer (uses existing dev server)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for admin tests
  retries: 0,
  workers: 1, // Single worker to avoid conflicts
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-admin-report' }]
  ],
  use: {
    baseURL: 'http://localhost:3002', // Use HTTP since dev server is HTTP
    ignoreHTTPSErrors: false,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false // Show browser for visual testing
      },
    }
  ],
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 15 * 1000, // 15 seconds for assertions
  },
});