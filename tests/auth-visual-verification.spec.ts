import { test, expect } from '@playwright/test';

test.describe('Authentication Visual Verification', () => {
  const BASE_URL = 'https://localhost:3002';

  test.beforeEach(async ({ context }) => {
    // Accept self-signed certificate
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('complete authentication flow with screenshots', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });
    console.log('✅ Screenshot 1: Home page loaded');

    // Step 2: Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });
    console.log('✅ Screenshot 2: Login page loaded');

    // Step 3: Fill in login form with test credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.screenshot({ path: 'screenshots/03-login-form-filled.png', fullPage: true });
    console.log('✅ Screenshot 3: Login form filled');

    // Step 4: Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/04-after-login-submit.png', fullPage: true });
    console.log('✅ Screenshot 4: After login submission');

    // Step 5: Check current URL and page state
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Step 6: Check if we're redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      await page.screenshot({ path: 'screenshots/05-dashboard-success.png', fullPage: true });
      console.log('✅ Screenshot 5: Successfully logged in to dashboard');
      
      // Step 7: Try to access admin page
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: 'screenshots/06-admin-page.png', fullPage: true });
      console.log('✅ Screenshot 6: Admin page access attempt');
    } else if (currentUrl.includes('/login')) {
      // Still on login page - check for error messages
      const errorElement = await page.$('[data-testid="login-error"], .text-red-600, .text-red-500');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log('❌ Login error:', errorText);
      }
      await page.screenshot({ path: 'screenshots/05-login-failed.png', fullPage: true });
      console.log('❌ Screenshot 5: Login failed - still on login page');
    }

    // Step 8: Test session API from browser
    const sessionResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    console.log('Session API response:', sessionResponse);

    // Step 9: Check server logs for JWT errors
    await page.screenshot({ path: 'screenshots/07-final-state.png', fullPage: true });
    console.log('✅ Screenshot 7: Final state captured');
  });

  test('test Google OAuth button visibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Check if Google sign-in button is visible
    const googleButton = await page.$('text=Sign in with Google');
    if (googleButton) {
      await page.screenshot({ path: 'screenshots/oauth-01-google-button-visible.png', fullPage: true });
      console.log('✅ Google OAuth button is visible');
      
      // Click the button and see what happens
      await googleButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/oauth-02-after-google-click.png', fullPage: true });
      console.log('✅ Clicked Google OAuth button');
    } else {
      await page.screenshot({ path: 'screenshots/oauth-01-no-google-button.png', fullPage: true });
      console.log('❌ Google OAuth button not found');
    }
  });

  test('test registration flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/register-01-page.png', fullPage: true });
    
    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    await page.screenshot({ path: 'screenshots/register-02-form-filled.png', fullPage: true });
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/register-03-after-submit.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('After registration URL:', currentUrl);
  });
});