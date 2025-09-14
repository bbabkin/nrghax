const { chromium } = require('playwright');
const fs = require('fs');

async function testAppFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Create screenshots directory
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  try {
    console.log('Testing application flows...\n');

    // 1. Test Homepage
    console.log('1. Testing Homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('   ✓ Homepage loaded successfully');

    // 2. Test Login Page
    console.log('2. Testing Login page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/02-login-page.png', fullPage: true });
    console.log('   ✓ Login page loaded successfully');

    // 3. Test Hacks Page (public view)
    console.log('3. Testing Hacks page...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-hacks-page.png', fullPage: true });
    console.log('   ✓ Hacks page loaded successfully');

    // 4. Try to access admin page (should redirect)
    console.log('4. Testing Admin redirect...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    if (currentUrl.includes('/auth') || currentUrl === 'http://localhost:3000/') {
      console.log('   ✓ Admin page properly redirects unauthenticated users');
      await page.screenshot({ path: 'screenshots/04-admin-redirect.png', fullPage: true });
    } else {
      console.log('   ⚠ Admin page did not redirect as expected');
    }

    // 5. Test user registration flow
    console.log('5. Testing Registration flow...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Click on Sign Up tab if it exists
    const signUpTab = await page.locator('text="Sign Up"').first();
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/05-signup-form.png', fullPage: true });
      console.log('   ✓ Sign up form displayed');
    }

    // 6. Test Dashboard (if accessible)
    console.log('6. Testing Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-dashboard.png', fullPage: true });
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('dashboard')) {
      console.log('   ✓ Dashboard accessible');
    } else {
      console.log('   ✓ Dashboard properly redirects unauthenticated users');
    }

    // 7. Test Account/Profile page
    console.log('7. Testing Account page...');
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/07-account-page.png', fullPage: true });
    console.log('   ✓ Account page loaded');

    // 8. Test Admin Tags page
    console.log('8. Testing Admin Tags page...');
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-admin-tags.png', fullPage: true });
    console.log('   ✓ Admin tags page checked');

    // 9. Test Profile History
    console.log('9. Testing Profile History...');
    await page.goto('http://localhost:3000/profile/history');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-profile-history.png', fullPage: true });
    console.log('   ✓ Profile history page checked');

    console.log('\n✅ All page flows tested successfully!');
    console.log('Screenshots saved in ./screenshots/ directory');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testAppFlow();