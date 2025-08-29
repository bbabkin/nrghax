import { defineConfig, devices } from '@playwright/test'

/**
 * Config specifically for authentication verification tests
 * Uses the existing HTTP dev server running on port 3002
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1, // Run tests sequentially to avoid conflicts
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:3002', // HTTP not HTTPS
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

  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
});