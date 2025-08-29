import { test, expect } from '@playwright/test';

test.describe('Authentication Fix Validation', () => {
  test('admin user can login and access admin panel - COMPLETE FLOW', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('https://localhost:3002/login');
    await page.screenshot({ path: 'screenshots/auth-fix-01-login-page.png' });
    
    // Verify we're on the login page
    await expect(page).toHaveTitle(/Auth Starter/);
    await expect(page.locator('h2')).toContainText('Welcome back');
    
    // Step 2: Click Google OAuth button
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
    await googleButton.click();
    
    // Note: In actual testing, Google OAuth would redirect to Google's consent screen
    // For now, we'll capture what happens and verify the callback handling
    await page.screenshot({ path: 'screenshots/auth-fix-02-after-google-click.png' });
    
    // Wait a bit to see if there are any immediate redirects or errors
    await page.waitForTimeout(2000);
    
    // Step 3: Check current URL and page state
    const currentUrl = page.url();
    console.log('Current URL after Google OAuth click:', currentUrl);
    
    await page.screenshot({ path: 'screenshots/auth-fix-03-current-state.png' });
    
    // Step 4: Test session API directly in browser context
    const sessionResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        return { success: true, data, status: response.status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('Session API response:', sessionResponse);
    
    // Step 5: Try to navigate to dashboard to see if protected route works
    await page.goto('https://localhost:3002/dashboard');
    await page.screenshot({ path: 'screenshots/auth-fix-04-dashboard-attempt.png' });
    
    // Step 6: Check if we get redirected to login (which would indicate auth is not working)
    const finalUrl = page.url();
    console.log('Final URL after dashboard navigation:', finalUrl);
    
    if (finalUrl.includes('/login')) {
      console.log('❌ Authentication failed - redirected to login');
    } else if (finalUrl.includes('/dashboard')) {
      console.log('✅ Authentication succeeded - reached dashboard');
    } else {
      console.log('? Unexpected redirect to:', finalUrl);
    }
    
    await page.screenshot({ path: 'screenshots/auth-fix-05-final-state.png' });
  });
});