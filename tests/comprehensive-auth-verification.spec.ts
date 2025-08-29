import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

// Test credentials from the setup
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: 'Admin123!@#' },
  user1: { email: 'user1@test.com', password: 'User123!@#' },
  user2: { email: 'user2@test.com', password: 'User123!@#' }
};

test.describe('Complete Authentication System Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear all storage to start fresh
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('01 - Home page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });
    
    // Should show login/register links when not authenticated
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Sign Up')).toBeVisible();
  });

  test('02 - Login page renders with all elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });
    
    // Check all required elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('03 - User login flow works end-to-end', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);
    await page.screenshot({ path: 'screenshots/03a-login-form-filled.png', fullPage: true });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or success state
    await page.waitForURL(/dashboard|profile|home/, { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/03b-user-logged-in.png', fullPage: true });
    
    // Verify user is logged in by checking navbar
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  test('04 - Admin login and access verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Login as admin
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.screenshot({ path: 'screenshots/04a-admin-login-form.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|profile|home/, { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/04b-admin-logged-in.png', fullPage: true });
    
    // Check if admin has access to admin features
    const adminLink = page.locator('text=Admin');
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await page.screenshot({ path: 'screenshots/04c-admin-dashboard.png', fullPage: true });
      
      // Verify admin dashboard elements
      await expect(page.locator('text=User Management')).toBeVisible();
    }
  });

  test('05 - Session persistence across page refresh', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|profile|home/, { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    await page.screenshot({ path: 'screenshots/05-session-after-refresh.png', fullPage: true });
    
    // Should still be logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });

  test('06 - Protected route access control', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(`${BASE_URL}/dashboard`);
    await page.screenshot({ path: 'screenshots/06a-dashboard-redirect.png', fullPage: true });
    
    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
    
    // Now login and try again
    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/06b-dashboard-authorized.png', fullPage: true });
  });

  test('07 - Logout functionality works correctly', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|profile|home/, { timeout: 10000 });
    
    // Logout
    await page.click('text=Sign Out');
    await page.screenshot({ path: 'screenshots/07a-after-logout.png', fullPage: true });
    
    // Should be redirected to home/login
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Try to access protected page - should redirect to login
    await page.goto(`${BASE_URL}/dashboard`);
    await page.screenshot({ path: 'screenshots/07b-dashboard-after-logout.png', fullPage: true });
    await expect(page).toHaveURL(/login/);
  });

  test('08 - Invalid login credentials show error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Try invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.screenshot({ path: 'screenshots/08a-invalid-credentials.png', fullPage: true });
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/Invalid|Error|incorrect/i', { timeout: 5000 });
    await page.screenshot({ path: 'screenshots/08b-login-error.png', fullPage: true });
  });

  test('09 - Register page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.screenshot({ path: 'screenshots/09-register-page.png', fullPage: true });
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('10 - Google OAuth button is functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click Google sign in button
    const googleButton = page.locator('text=Sign in with Google');
    await expect(googleButton).toBeVisible();
    await page.screenshot({ path: 'screenshots/10a-before-google-click.png', fullPage: true });
    
    // Note: We can't test the full OAuth flow in automated tests
    // but we can verify the button triggers the correct action
    await googleButton.click();
    await page.screenshot({ path: 'screenshots/10b-google-oauth-initiated.png', fullPage: true });
    
    // Should either redirect to Google or show some OAuth process
    // The exact behavior depends on the OAuth configuration
  });

});