import { test, expect } from '@playwright/test';

test.describe('Test Actual Login and Session', () => {
  const BASE_URL = 'https://localhost:3002';
  
  test('verify login state and session persistence', async ({ page }) => {
    // Accept self-signed certificate
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Step 1: Check current session via API
    console.log('=== CHECKING CURRENT SESSION ===');
    const initialSession = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    console.log('Initial session:', JSON.stringify(initialSession, null, 2));
    
    // Step 2: If not logged in, perform login
    if (!initialSession.user) {
      console.log('User not logged in, attempting Google OAuth...');
      
      await page.goto(`${BASE_URL}/login`);
      await page.screenshot({ path: 'screenshots/session-01-login-page.png' });
      
      // Click Google sign-in
      await page.click('text=Sign in with Google');
      
      // Handle Google OAuth (this will redirect to Google)
      // Since we can't automate Google's login, let's check if the user is already logged in via cookies
    }
    
    // Step 3: Check session after login attempt
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    const sessionAfter = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    console.log('Session after login attempt:', JSON.stringify(sessionAfter, null, 2));
    
    // Step 4: Check cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c => c.name.includes('auth') || c.name.includes('session'));
    console.log('Auth-related cookies:', authCookies.map(c => ({ 
      name: c.name, 
      value: c.value.substring(0, 50) + '...', 
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite 
    })));
    
    // Step 5: Try to access protected route
    console.log('=== TESTING PROTECTED ROUTE ACCESS ===');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    console.log('After navigating to /dashboard, URL is:', dashboardUrl);
    await page.screenshot({ path: 'screenshots/session-02-dashboard-attempt.png' });
    
    // Step 6: Check if we're logged in by looking for user info
    const userInfo = await page.locator('text=/Boris|bbabkin/i').count();
    console.log('User info visible on page:', userInfo > 0);
    
    // Step 7: Try admin route
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    const adminUrl = page.url();
    console.log('After navigating to /admin/users, URL is:', adminUrl);
    await page.screenshot({ path: 'screenshots/session-03-admin-attempt.png' });
    
    // Step 8: Final session check
    const finalSession = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session');
      return await response.json();
    });
    console.log('=== FINAL SESSION STATE ===');
    console.log(JSON.stringify(finalSession, null, 2));
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('User logged in:', !!finalSession.user);
    console.log('User email:', finalSession.user?.email || 'N/A');
    console.log('User role:', finalSession.user?.role || 'N/A');
    console.log('Can access dashboard:', !dashboardUrl.includes('login'));
    console.log('Can access admin:', !adminUrl.includes('login'));
  });
  
  test('test manual session check via curl', async ({ page }) => {
    // This test will use the existing session from the browser
    const cookies = await page.context().cookies(BASE_URL);
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    if (sessionCookie) {
      console.log('Found session cookie:', sessionCookie.name);
      console.log('Cookie value preview:', sessionCookie.value.substring(0, 50) + '...');
    } else {
      console.log('No session cookie found');
    }
  });
});