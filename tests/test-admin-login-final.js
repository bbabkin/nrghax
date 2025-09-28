const puppeteer = require('puppeteer');

async function testAdminLogin() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const adminEmail = 'admin@test.com';
  const adminPassword = 'Admin123!';

  try {
    console.log('\n1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });

    // Sign in
    console.log('2. Signing in as admin...');
    await page.type('#signin-email', adminEmail);
    await page.type('#signin-password', adminPassword);

    // Submit form
    const signInBtns = await page.$$('button[type="submit"]');
    for (const btn of signInBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Sign In')) {
        await btn.click();
        break;
      }
    }

    // Wait for navigation or error
    await new Promise(r => setTimeout(r, 3000));

    // Check current URL
    const currentUrl = page.url();
    console.log('3. Current URL after login:', currentUrl);

    // Navigate to hacks page
    console.log('4. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle0' });

    await page.screenshot({ path: 'screenshots/admin-login-test.png', fullPage: true });

    // Check for admin controls
    console.log('\n5. Checking for admin indicators...');

    // Check navbar for admin badge
    const adminBadge = await page.evaluate(() => {
      const badges = document.querySelectorAll('.bg-gradient-to-r.from-purple-600.to-pink-600');
      return badges.length > 0;
    });
    console.log('   Admin badge in navbar:', adminBadge ? '✅ Found' : '❌ Not found');

    // Check for floating action buttons
    const floatingButtons = await page.evaluate(() => {
      const buttons = document.querySelector('.fixed.bottom-6.right-6');
      return buttons ? buttons.textContent : null;
    });
    console.log('   Floating action buttons:', floatingButtons ? `✅ Found: ${floatingButtons}` : '❌ Not found');

    // Check for edit/delete buttons on hack cards
    const editButtons = await page.evaluate(() => {
      return document.querySelectorAll('button').length;
    });
    console.log('   Total buttons on page:', editButtons);

    // Check server debug info
    const serverDebug = await page.evaluate(() => {
      const el = document.querySelector('.text-xs.text-gray-500');
      return el ? el.textContent : null;
    });
    console.log('   Server debug:', serverDebug);

    // Check client debug info
    const clientDebug = await page.evaluate(() => {
      const el = document.querySelector('.fixed.bottom-20.left-4');
      return el ? el.textContent : null;
    });
    console.log('   Client debug:', clientDebug);

    console.log('\n✅ Test completed - Check screenshot at screenshots/admin-login-test.png');

    // If admin controls aren't showing, we need to fix the auth issue
    if (!adminBadge && !floatingButtons) {
      console.log('\n⚠️  Admin controls not showing - Authentication issue detected');
      console.log('This indicates the server-side auth is not working properly.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/admin-login-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testAdminLogin().catch(console.error);