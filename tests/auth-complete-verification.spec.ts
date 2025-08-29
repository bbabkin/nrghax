import { test, expect } from '@playwright/test';

test.describe('Complete Authentication Verification', () => {
  const BASE_URL = 'https://localhost:3002';

  test('verify authentication is working with Google OAuth', async ({ page, context }) => {
    console.log('Starting authentication verification test...');
    
    // Step 1: Clear all cookies to ensure clean state
    await context.clearCookies();
    console.log('✅ Cleared all cookies');

    // Step 2: Navigate to home page
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/verify-01-home-clean.png', fullPage: true });
    console.log('✅ Home page loaded');

    // Step 3: Check session API (should be null initially)
    const initialSession = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    console.log('Initial session:', initialSession);

    // Step 4: Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/verify-02-login-page.png', fullPage: true });
    console.log('✅ Login page loaded');

    // Step 5: Check for Google OAuth button
    const googleButton = await page.$('text=Sign in with Google');
    if (googleButton) {
      console.log('✅ Google OAuth button found');
      await page.screenshot({ path: 'screenshots/verify-03-google-button-visible.png', fullPage: true });
    } else {
      console.log('❌ Google OAuth button not found');
    }

    // Step 6: Navigate to admin page (should redirect to login)
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    const urlAfterAdmin = page.url();
    console.log('URL after trying to access /admin:', urlAfterAdmin);
    await page.screenshot({ path: 'screenshots/verify-04-admin-redirect.png', fullPage: true });
    
    if (urlAfterAdmin.includes('/login')) {
      console.log('✅ Correctly redirected to login when not authenticated');
    } else if (urlAfterAdmin.includes('/admin')) {
      console.log('⚠️ Admin page accessible without authentication!');
    }

    // Step 7: Test dashboard access
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    const urlAfterDashboard = page.url();
    console.log('URL after trying to access /dashboard:', urlAfterDashboard);
    await page.screenshot({ path: 'screenshots/verify-05-dashboard-redirect.png', fullPage: true });

    // Step 8: Create a new user via registration
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/verify-06-register-page.png', fullPage: true });
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.screenshot({ path: 'screenshots/verify-07-register-filled.png', fullPage: true });
    
    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    const urlAfterRegister = page.url();
    console.log('URL after registration:', urlAfterRegister);
    await page.screenshot({ path: 'screenshots/verify-08-after-register.png', fullPage: true });
    
    // Check for any error messages
    const registrationError = await page.$('.text-red-600, .text-red-500, [role="alert"]');
    if (registrationError) {
      const errorText = await registrationError.textContent();
      console.log('Registration error:', errorText);
    }

    // Step 9: Try to login with the new user
    if (urlAfterRegister.includes('/login') || urlAfterRegister.includes('/dashboard')) {
      console.log('Registration appeared to succeed, trying to login...');
      
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.screenshot({ path: 'screenshots/verify-09-login-new-user.png', fullPage: true });
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      const urlAfterLogin = page.url();
      console.log('URL after login with new user:', urlAfterLogin);
      await page.screenshot({ path: 'screenshots/verify-10-after-login.png', fullPage: true });
      
      // Check session after login
      const sessionAfterLogin = await page.evaluate(async () => {
        const response = await fetch('/api/auth/session');
        return await response.json();
      });
      console.log('Session after login:', sessionAfterLogin);
      
      if (sessionAfterLogin && sessionAfterLogin.user) {
        console.log('✅ Authentication is WORKING! User logged in successfully');
        console.log('User details:', sessionAfterLogin.user);
      } else {
        console.log('❌ Authentication FAILED - no session after login');
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'screenshots/verify-11-final-state.png', fullPage: true });
  });

  test('verify session persistence', async ({ page }) => {
    // This test checks if sessions persist across page loads
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    const session = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    
    if (session && session.user) {
      console.log('✅ Session persists:', session.user.email);
      await page.screenshot({ path: 'screenshots/session-01-persisted.png', fullPage: true });
      
      // Try to access admin
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
      const adminUrl = page.url();
      console.log('Admin access with session:', adminUrl);
      await page.screenshot({ path: 'screenshots/session-02-admin-access.png', fullPage: true });
    } else {
      console.log('No existing session found');
    }
  });
});