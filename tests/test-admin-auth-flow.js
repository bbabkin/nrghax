const puppeteer = require('puppeteer');

async function testAdminAuth() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });

  try {
    console.log('\n1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('#signin-email', { timeout: 10000 });

    console.log('2. Logging in as admin (bbabkin@gmail.com)...');
    await page.type('#signin-email', 'bbabkin@gmail.com');
    await page.type('#signin-password', 'password123');

    // Take screenshot before login
    await page.screenshot({ path: 'screenshots/auth-before-login.png', fullPage: true });

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });

    console.log('3. Current URL after login:', page.url());

    // Take screenshot after login
    await page.screenshot({ path: 'screenshots/auth-after-login.png', fullPage: true });

    // Check if admin badge exists in navbar
    const adminBadge = await page.$('nav .bg-gradient-to-r.from-purple-600.to-pink-600');
    console.log('4. Admin badge in navbar:', adminBadge ? '✅ Found' : '❌ Not found');

    // Navigate to hacks page
    console.log('\n5. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Take screenshot of hacks page
    await page.screenshot({ path: 'screenshots/hacks-page-admin.png', fullPage: true });

    // Check for admin controls
    const floatingButtons = await page.$$('.fixed.bottom-6.right-6');
    console.log('6. Floating action buttons:', floatingButtons.length > 0 ? '✅ Found' : '❌ Not found');

    // Check for edit buttons on hack cards
    const editButtons = await page.$$('button:has-text("Edit")');
    console.log('7. Edit buttons on cards:', editButtons.length > 0 ? `✅ Found ${editButtons.length}` : '❌ Not found');

    // Check debug info
    const debugInfo = await page.$('.fixed.bottom-20.left-4');
    if (debugInfo) {
      const debugText = await page.evaluate(el => el.textContent, debugInfo);
      console.log('\n8. Debug info:', debugText);
    }

    // Check server debug info
    const serverDebug = await page.$('.text-xs.text-gray-500');
    if (serverDebug) {
      const serverText = await page.evaluate(el => el.textContent, serverDebug);
      console.log('9. Server debug:', serverText);
    }

    // Check localStorage for auth info
    const authInfo = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
      const authData = {};
      keys.forEach(key => {
        try {
          authData[key] = JSON.parse(localStorage[key]);
        } catch {
          authData[key] = localStorage[key];
        }
      });
      return authData;
    });
    console.log('\n10. Auth data in localStorage:', JSON.stringify(authInfo, null, 2).slice(0, 200) + '...');

    console.log('\n✅ Test completed - Check screenshots for visual confirmation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAdminAuth().catch(console.error);