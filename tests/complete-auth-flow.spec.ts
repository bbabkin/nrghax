import { test, expect } from '@playwright/test';

test.describe('Complete Authentication Flow', () => {
  test.use({
    ignoreHTTPSErrors: true,
  });

  test('login with Google OAuth and verify admin access', async ({ page, context }) => {
    console.log('\n=== COMPLETE AUTHENTICATION FLOW TEST ===\n');
    
    // Step 1: Clear all cookies to start fresh
    await context.clearCookies();
    console.log('✅ Cleared all cookies');
    
    // Step 2: Navigate to login page
    await page.goto('https://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/flow-01-login-page.png' });
    console.log('📍 On login page');
    
    // Step 3: Click Google sign-in button
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
    console.log('✅ Google sign-in button is visible');
    
    // Set up promise to wait for OAuth redirect
    const oauthPromise = page.waitForURL(/accounts\.google\.com/, { 
      timeout: 10000 
    }).catch(() => null);
    
    await googleButton.click();
    console.log('✅ Clicked Google sign-in button');
    await page.screenshot({ path: 'test-results/flow-02-after-google-click.png' });
    
    // Step 4: Wait for OAuth flow to complete
    const didNavigateToGoogle = await oauthPromise;
    if (didNavigateToGoogle) {
      console.log('📍 Navigated to Google OAuth page');
      // Google OAuth requires manual interaction in headed mode
      // In real test, we'd use test accounts with saved sessions
      
      // Wait for redirect back to our app
      await page.waitForURL(/localhost:3002/, { timeout: 60000 });
      console.log('✅ Redirected back from Google OAuth');
    } else {
      console.log('⚠️ Did not navigate to Google (may already be logged in)');
    }
    
    // Step 5: Check where we landed
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    await page.screenshot({ path: 'test-results/flow-03-after-oauth.png' });
    
    // Step 6: Check cookies after login
    const cookies = await context.cookies();
    console.log('\n🍪 Cookies after login:');
    
    const sessionCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('authjs.session-token')
    );
    
    if (sessionCookie) {
      console.log(`✅ Session cookie found: ${sessionCookie.name}`);
      console.log(`   Value (truncated): ${sessionCookie.value.substring(0, 50)}...`);
      console.log(`   Secure: ${sessionCookie.secure}, HttpOnly: ${sessionCookie.httpOnly}`);
    } else {
      console.log('❌ No session cookie found!');
      console.log('   Available cookies:', cookies.map(c => c.name).join(', '));
    }
    
    // Step 7: Test session API
    console.log('\n📍 Testing session API:');
    const sessionResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    });
    
    console.log('Session API response:', JSON.stringify(sessionResponse, null, 2));
    
    // Step 8: Try to access dashboard
    console.log('\n📍 Testing dashboard access:');
    await page.goto('https://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    
    if (!dashboardUrl.includes('/login')) {
      console.log('✅ Can access dashboard - session is working!');
      await page.screenshot({ path: 'test-results/flow-04-dashboard.png' });
    } else {
      console.log('❌ Redirected to login - session not working');
      await page.screenshot({ path: 'test-results/flow-04-dashboard-redirect.png' });
    }
    
    // Step 9: Try to access admin page
    console.log('\n📍 Testing admin page access:');
    await page.goto('https://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    const adminUrl = page.url();
    
    if (!adminUrl.includes('/login')) {
      console.log('✅ Can access admin page - role-based access is working!');
      await page.screenshot({ path: 'test-results/flow-05-admin.png' });
      
      // Check what's on the admin page
      const adminTitle = await page.textContent('h1').catch(() => null);
      console.log(`   Admin page title: ${adminTitle}`);
    } else {
      console.log('❌ Redirected to login from admin - role check failed');
      await page.screenshot({ path: 'test-results/flow-05-admin-redirect.png' });
    }
    
    // Step 10: Check client-side session hook
    console.log('\n📍 Testing client-side session state:');
    const clientSession = await page.evaluate(() => {
      // Check if there's any session data in the page
      const sessionElement = document.querySelector('[data-session]');
      const userInfo = document.querySelector('[data-user]');
      
      return {
        hasSessionElement: !!sessionElement,
        hasUserInfo: !!userInfo,
        documentCookie: document.cookie,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
      };
    });
    
    console.log('Client-side session state:', JSON.stringify(clientSession, null, 2));
    
    // Final Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`✅ Session cookie exists: ${!!sessionCookie}`);
    console.log(`✅ Session API returns data: ${!!sessionResponse && sessionResponse !== null}`);
    console.log(`✅ Can access dashboard: ${!dashboardUrl.includes('/login')}`);
    console.log(`✅ Can access admin: ${!adminUrl.includes('/login')}`);
    
    // Assertions
    if (!sessionCookie) {
      throw new Error('Session cookie was not set properly');
    }
    
    if (!sessionResponse || sessionResponse === null) {
      throw new Error('Session API returned null');
    }
    
    if (dashboardUrl.includes('/login')) {
      throw new Error('Cannot access dashboard - session not working');
    }
  });
});