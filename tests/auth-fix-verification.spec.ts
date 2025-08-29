import { test, expect } from '@playwright/test';

test.describe('Authentication Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the login page
    await page.goto('http://localhost:3002/login');
  });

  test('should load login page without errors', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Supabase Auth Starter/);
    
    // Check that login form is present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that Google OAuth button is present
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should have working NextAuth API endpoints', async ({ page }) => {
    // Test session endpoint
    const sessionResponse = await page.request.get('http://localhost:3002/api/auth/session');
    expect(sessionResponse.status()).toBe(200);
    const sessionData = await sessionResponse.json();
    expect(sessionData).toBeNull(); // No session for unauthenticated user
    
    // Test providers endpoint
    const providersResponse = await page.request.get('http://localhost:3002/api/auth/providers');
    expect(providersResponse.status()).toBe(200);
    const providersData = await providersResponse.json();
    expect(providersData).toHaveProperty('google');
    expect(providersData).toHaveProperty('credentials');
    
    // Test CSRF endpoint
    const csrfResponse = await page.request.get('http://localhost:3002/api/auth/csrf');
    expect(csrfResponse.status()).toBe(200);
    const csrfData = await csrfResponse.json();
    expect(csrfData).toHaveProperty('csrfToken');
  });

  test('should attempt login form submission', async ({ page }) => {
    // Fill in the form with test credentials
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Admin123!@#');
    
    // Take screenshot before submission
    await page.screenshot({ path: 'screenshots/auth-fix-01-before-submit.png' });
    
    // Submit the form and see what happens
    const navigationPromise = page.waitForURL('**/*', { timeout: 10000 });
    
    try {
      await page.click('button[type="submit"]');
      
      // Wait for navigation or timeout
      await navigationPromise;
      
      // Take screenshot after submission
      await page.screenshot({ path: 'screenshots/auth-fix-02-after-submit.png' });
      
      // Check the URL to see what happened
      const currentUrl = page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Check if we're still on login page or redirected
      if (currentUrl.includes('/login')) {
        // Still on login page - check for errors or validation messages
        const errorMessage = await page.locator('[role="alert"], .error, .text-red').first();
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          console.log('Error message found:', errorText);
        }
      } else {
        // Redirected - check if it's to dashboard or other page
        console.log('Redirected to:', currentUrl);
      }
      
    } catch (error) {
      console.log('Login attempt error:', error);
      await page.screenshot({ path: 'screenshots/auth-fix-03-error-state.png' });
    }
  });

  test('should test Google OAuth redirect', async ({ page }) => {
    // Click Google sign-in button
    const googleButton = page.locator('text=Sign in with Google');
    await expect(googleButton).toBeVisible();
    
    // Take screenshot before OAuth
    await page.screenshot({ path: 'screenshots/auth-fix-04-before-google-oauth.png' });
    
    // Click and see what happens (will likely redirect to Google)
    try {
      await googleButton.click();
      
      // Wait a bit for redirect to potentially happen
      await page.waitForTimeout(2000);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'screenshots/auth-fix-05-after-google-click.png' });
      
      const currentUrl = page.url();
      console.log('URL after Google OAuth click:', currentUrl);
      
    } catch (error) {
      console.log('Google OAuth test error:', error);
    }
  });

  test('should verify protected route access', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('http://localhost:3002/admin');
    
    // Should redirect to login
    await page.waitForURL('**/login**', { timeout: 5000 });
    
    // Verify we're on login page
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    await page.screenshot({ path: 'screenshots/auth-fix-06-protected-route-redirect.png' });
  });
});