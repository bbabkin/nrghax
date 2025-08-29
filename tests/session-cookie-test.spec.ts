import { test, expect } from '@playwright/test';

test.describe('Session Cookie Investigation', () => {
  test.use({
    ignoreHTTPSErrors: true,
  });

  test('check session cookies and client state', async ({ page, context }) => {
    // First, let's directly check if session exists via API
    console.log('📍 Step 1: Testing session API with curl first');
    
    // Navigate to home page
    await page.goto('https://localhost:3002');
    await page.screenshot({ path: 'test-results/cookie-01-home.png' });
    
    // Check cookies
    const cookies = await context.cookies();
    console.log('\n🍪 All cookies found:');
    cookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      console.log(`    Domain: ${cookie.domain}, Path: ${cookie.path}, Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}`);
    });
    
    // Look specifically for session token
    const sessionCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('authjs.session-token')
    );
    
    if (sessionCookie) {
      console.log('\n✅ Found session cookie:', sessionCookie.name);
    } else {
      console.log('\n❌ No session cookie found!');
    }
    
    // Test session API from browser
    console.log('\n📍 Step 2: Testing /api/auth/session from browser context');
    const sessionData = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      return {
        status: response.status,
        data,
        cookies: document.cookie
      };
    });
    
    console.log('\nSession API Response:');
    console.log('  Status:', sessionData.status);
    console.log('  Data:', JSON.stringify(sessionData.data, null, 2));
    console.log('  Document cookies:', sessionData.cookies);
    
    // Navigate to dashboard
    console.log('\n📍 Step 3: Navigating to dashboard');
    await page.goto('https://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    console.log('  Final URL:', dashboardUrl);
    await page.screenshot({ path: 'test-results/cookie-02-dashboard.png' });
    
    // Navigate to admin
    console.log('\n📍 Step 4: Navigating to admin');
    await page.goto('https://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    const adminUrl = page.url();
    console.log('  Final URL:', adminUrl);
    await page.screenshot({ path: 'test-results/cookie-03-admin.png' });
    
    // Check React component state
    console.log('\n📍 Step 5: Checking React component session state');
    const componentState = await page.evaluate(() => {
      // Look for session data in React DevTools or window
      return {
        hasNextAuthInWindow: typeof (window as any).__NEXTAUTH !== 'undefined',
        nextAuthData: (window as any).__NEXTAUTH,
      };
    });
    console.log('  Component state:', JSON.stringify(componentState, null, 2));
    
    // Summary
    console.log('\n=== INVESTIGATION SUMMARY ===');
    console.log('Session cookie exists:', !!sessionCookie);
    console.log('Session API returns data:', sessionData.status === 200 && sessionData.data !== null);
    console.log('Can access dashboard:', !dashboardUrl.includes('/login'));
    console.log('Can access admin:', !adminUrl.includes('/login'));
  });
});