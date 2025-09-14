const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Testing login with test@test.com / test123...\n');

    // Go to auth page
    console.log('1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-login-01-auth-page.png' });

    // Fill login form
    console.log('2. Filling login form...');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.screenshot({ path: 'test-login-02-filled.png' });

    // Click sign in
    console.log('3. Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation or error
    console.log('4. Waiting for response...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    await page.screenshot({ path: 'test-login-03-after-signin.png' });

    // Check for toast messages
    const toasts = await page.locator('[role="alert"], .toast, [data-sonner-toast]').all();
    if (toasts.length > 0) {
      console.log('   Toast messages found:', toasts.length);
      for (const toast of toasts) {
        const text = await toast.textContent();
        console.log('   Toast:', text);
      }
    } else {
      console.log('   No toast messages found');
    }

    // Check if logged in by looking for dashboard or profile elements
    if (currentUrl.includes('dashboard') || currentUrl.includes('account')) {
      console.log('✅ Login successful! Redirected to:', currentUrl);
    } else if (currentUrl.includes('auth')) {
      console.log('❌ Login failed - still on auth page');
      
      // Check for error messages
      const errors = await page.locator('.error, .text-red-500, [role="alert"]').all();
      for (const error of errors) {
        const text = await error.textContent();
        console.log('   Error message:', text);
      }
    } else {
      console.log('⚠️  Redirected to:', currentUrl);
    }

    // Try to access dashboard
    console.log('\n5. Attempting to access dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    await page.screenshot({ path: 'test-login-04-dashboard.png' });
    
    if (dashboardUrl.includes('dashboard')) {
      console.log('✅ Dashboard accessible - user is authenticated');
    } else {
      console.log('❌ Dashboard not accessible - redirected to:', dashboardUrl);
    }

    // Check admin access
    console.log('\n6. Checking admin access...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    const adminUrl = page.url();
    await page.screenshot({ path: 'test-login-05-admin.png' });
    
    if (adminUrl.includes('admin')) {
      console.log('✅ Admin area accessible - user has admin privileges');
    } else {
      console.log('⚠️  Admin area not accessible - redirected to:', adminUrl);
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testLogin();
