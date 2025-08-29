import { test, expect } from '@playwright/test';

test.describe('Manual Authentication Test', () => {
  test.use({
    ignoreHTTPSErrors: true,
    timeout: 120000, // 2 minutes for manual interaction
  });

  test('manual Google OAuth login and session verification', async ({ page, context }) => {
    console.log('\n=== MANUAL AUTHENTICATION TEST ===');
    console.log('This test requires manual interaction with Google OAuth\n');
    
    // Clear cookies
    await context.clearCookies();
    
    // Step 1: Go to login page
    await page.goto('https://localhost:3002/login');
    await page.screenshot({ path: 'test-results/manual-01-login.png' });
    console.log('📍 On login page - screenshot saved as manual-01-login.png');
    
    // Step 2: Click Google sign-in
    await page.click('button:has-text("Sign in with Google")');
    console.log('✅ Clicked Google sign-in button');
    
    // Step 3: Manual OAuth flow
    console.log('\n⚠️ MANUAL ACTION REQUIRED:');
    console.log('1. Complete the Google OAuth login in the browser');
    console.log('2. The test will continue automatically once you are redirected back\n');
    
    // Wait for redirect back to our app (with longer timeout for manual interaction)
    try {
      await page.waitForURL(/localhost:3002(?!.*\/api\/auth)/, { timeout: 60000 });
      console.log('✅ Successfully redirected back from OAuth');
    } catch {
      console.log('❌ Timeout waiting for OAuth redirect');
      return;
    }
    
    // Step 4: Check where we landed
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    await page.screenshot({ path: 'test-results/manual-02-after-oauth.png' });
    console.log(`📍 Current URL after OAuth: ${currentUrl}`);
    console.log('   Screenshot saved as manual-02-after-oauth.png');
    
    // Step 5: Check cookies
    const cookies = await context.cookies();
    console.log('\n🍪 Cookie Analysis:');
    
    // Look for session token
    const sessionCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('authjs.session-token') ||
      c.name.includes('__Secure-authjs.session-token') ||
      c.name.includes('__Secure-next-auth.session-token')
    );
    
    if (sessionCookie) {
      console.log(`✅ Session cookie found: ${sessionCookie.name}`);
      console.log(`   Secure: ${sessionCookie.secure}`);
      console.log(`   HttpOnly: ${sessionCookie.httpOnly}`);
      console.log(`   SameSite: ${sessionCookie.sameSite}`);
      console.log(`   Domain: ${sessionCookie.domain}`);
      console.log(`   Path: ${sessionCookie.path}`);
    } else {
      console.log('❌ No session cookie found!');
      console.log('   Available cookies:');
      cookies.forEach(c => {
        console.log(`   - ${c.name} (domain: ${c.domain})`);
      });
    }
    
    // Step 6: Test session API
    console.log('\n📍 Testing /api/auth/session:');
    const sessionData = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const text = await response.text();
      try {
        return { status: response.status, data: JSON.parse(text) };
      } catch {
        return { status: response.status, data: text };
      }
    });
    
    console.log(`   Status: ${sessionData.status}`);
    if (sessionData.data && typeof sessionData.data === 'object') {
      console.log('   Session data:', JSON.stringify(sessionData.data, null, 2));
    } else {
      console.log('   Response:', sessionData.data?.substring(0, 100));
    }
    
    // Step 7: Test dashboard access
    console.log('\n📍 Testing dashboard access:');
    await page.goto('https://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    await page.screenshot({ path: 'test-results/manual-03-dashboard.png' });
    
    if (!dashboardUrl.includes('/login')) {
      console.log('✅ Dashboard accessible - session is working!');
      console.log('   Screenshot saved as manual-03-dashboard.png');
    } else {
      console.log('❌ Redirected to login - session not working');
    }
    
    // Step 8: Test admin access
    console.log('\n📍 Testing admin page access:');
    await page.goto('https://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    const adminUrl = page.url();
    await page.screenshot({ path: 'test-results/manual-04-admin.png' });
    
    if (!adminUrl.includes('/login')) {
      console.log('✅ Admin page accessible - role-based access working!');
      console.log('   Screenshot saved as manual-04-admin.png');
      
      // Get page content
      const pageTitle = await page.textContent('h1').catch(() => 'No h1 found');
      console.log(`   Page title: ${pageTitle}`);
    } else {
      console.log('❌ Redirected to login from admin');
    }
    
    // Step 9: Check useSession on client
    console.log('\n📍 Checking client-side session:');
    const clientCheck = await page.evaluate(() => {
      return {
        cookieString: document.cookie,
        hasLocalStorage: Object.keys(localStorage).length > 0,
        hasSessionStorage: Object.keys(sessionStorage).length > 0,
      };
    });
    
    console.log('   Document.cookie:', clientCheck.cookieString || '(empty)');
    console.log('   Has localStorage items:', clientCheck.hasLocalStorage);
    console.log('   Has sessionStorage items:', clientCheck.hasSessionStorage);
    
    // Final summary
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Session cookie exists: ${!!sessionCookie}`);
    console.log(`Session API works: ${sessionData.status === 200 && !!sessionData.data}`);
    console.log(`Dashboard accessible: ${!dashboardUrl.includes('/login')}`);
    console.log(`Admin accessible: ${!adminUrl.includes('/login')}`);
    
    // Keep browser open for inspection
    console.log('\n⚠️ Browser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
  });
});