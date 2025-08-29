import { test, expect, chromium } from '@playwright/test';

test.describe('Session Debug Investigation', () => {
  test('investigate client-server session mismatch', async () => {
    // Launch browser with devtools to see cookies
    const browser = await chromium.launch({
      headless: false,
      devtools: true
    });
    
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      recordVideo: {
        dir: 'test-results/videos',
        size: { width: 1920, height: 1080 }
      }
    });
    
    const page = await context.newPage();

    // Step 1: Check if already logged in by visiting dashboard
    console.log('📍 Step 1: Checking current session state');
    await page.goto('https://localhost:3002/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/01-dashboard-initial.png',
      fullPage: true 
    });

    // Check if we're on dashboard or redirected to login
    const currentUrl = page.url();
    console.log('Current URL after dashboard visit:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('❌ Redirected to login - session not recognized on client');
      
      // Login with Google OAuth
      console.log('📍 Step 2: Logging in with Google OAuth');
      await page.click('button:has-text("Sign in with Google")');
      await page.screenshot({ 
        path: 'test-results/02-google-signin-clicked.png' 
      });

      // Handle Google OAuth flow
      await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 }).catch(() => {
        console.log('Google OAuth page did not appear');
      });

      // After OAuth, we should be back on our site
      await page.waitForURL(/localhost:3002/, { timeout: 30000 });
      await page.screenshot({ 
        path: 'test-results/03-after-oauth.png',
        fullPage: true 
      });
    }

    // Step 3: Capture browser cookies
    console.log('📍 Step 3: Examining browser cookies');
    const cookies = await context.cookies();
    console.log('Browser cookies:', JSON.stringify(cookies, null, 2));
    
    // Take screenshot of current page
    await page.screenshot({ 
      path: 'test-results/04-current-state.png',
      fullPage: true 
    });

    // Step 4: Test session API directly from browser
    console.log('📍 Step 4: Testing /api/auth/session from browser');
    const sessionResponse = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      const data = await response.json();
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      };
    });
    console.log('Session API response:', JSON.stringify(sessionResponse, null, 2));

    // Step 5: Try to navigate to admin page
    console.log('📍 Step 5: Attempting to navigate to /admin');
    await page.goto('https://localhost:3002/admin');
    await page.waitForLoadState('networkidle');
    
    const adminUrl = page.url();
    console.log('URL after admin navigation:', adminUrl);
    
    await page.screenshot({ 
      path: 'test-results/05-admin-navigation.png',
      fullPage: true 
    });

    // Step 6: Check useSession hook behavior
    console.log('📍 Step 6: Testing useSession hook on client');
    const clientSession = await page.evaluate(() => {
      // Check if window has any session-related data
      const sessionData = {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        documentCookie: document.cookie
      };
      return sessionData;
    });
    console.log('Client storage data:', JSON.stringify(clientSession, null, 2));

    // Step 7: Capture network activity
    console.log('📍 Step 7: Monitoring network requests');
    
    // Set up network monitoring
    const networkLogs = [];
    page.on('request', request => {
      if (request.url().includes('/api/auth')) {
        networkLogs.push({
          type: 'request',
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/auth')) {
        networkLogs.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      }
    });

    // Reload page to capture network activity
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('Network logs:', JSON.stringify(networkLogs, null, 2));
    
    await page.screenshot({ 
      path: 'test-results/06-after-reload.png',
      fullPage: true 
    });

    // Step 8: Test client-side session fetch
    console.log('📍 Step 8: Testing NextAuth client-side session fetch');
    const nextAuthSession = await page.evaluate(async () => {
      try {
        // Try to get CSRF token first
        const csrfResponse = await fetch('/api/auth/csrf');
        const csrfData = await csrfResponse.json();
        
        // Then get session with CSRF token
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const sessionData = await sessionResponse.json();
        
        return {
          csrf: csrfData,
          session: sessionData,
          cookies: document.cookie
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('NextAuth client session:', JSON.stringify(nextAuthSession, null, 2));

    // Step 9: Check for JWT cookie specifically
    console.log('📍 Step 9: Looking for JWT session cookie');
    const jwtCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('authjs.session-token') ||
      c.name.includes('__Secure-authjs.session-token')
    );
    
    if (jwtCookie) {
      console.log('✅ Found JWT cookie:', jwtCookie.name);
      console.log('Cookie details:', JSON.stringify(jwtCookie, null, 2));
    } else {
      console.log('❌ No JWT session cookie found!');
      console.log('All cookies:', cookies.map(c => c.name));
    }

    // Final summary
    console.log('\n=== INVESTIGATION SUMMARY ===');
    console.log('Current URL:', page.url());
    console.log('Session cookie found:', !!jwtCookie);
    console.log('Session API returns data:', !!sessionResponse?.data);
    console.log('Can access admin:', !adminUrl.includes('/login'));

    await browser.close();
  });
});