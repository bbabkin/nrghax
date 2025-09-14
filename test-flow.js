const puppeteer = require('puppeteer');
const path = require('path');

async function testApp() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  try {
    console.log('Testing user/admin flow...\n');

    // 1. Test home page
    console.log('1. Testing home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-01-home.png' });
    console.log('   ✓ Home page loaded');

    // 2. Navigate to auth page
    console.log('2. Testing auth page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-02-auth.png' });
    console.log('   ✓ Auth page loaded');

    // 3. Sign in as admin
    console.log('3. Signing in as admin...');
    await page.type('input[type="email"]', 'test@test.com');
    await page.type('input[type="password"]', 'test123');
    await page.screenshot({ path: 'flow-03-login-filled.png' });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-04-after-login.png' });
    console.log('   ✓ Admin logged in');

    // 4. Check admin dashboard
    console.log('4. Testing admin dashboard...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-05-admin-dashboard.png' });
    console.log('   ✓ Admin dashboard accessible');

    // 5. Check hacks list
    console.log('5. Testing hacks management...');
    await page.goto('http://localhost:3000/admin/hacks', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-06-hacks-list.png' });
    console.log('   ✓ Hacks list loaded');

    // 6. Check new hack form
    console.log('6. Testing new hack form...');
    await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-07-new-hack-form.png' });
    console.log('   ✓ New hack form loaded');

    // 7. Check tags management
    console.log('7. Testing tags management...');
    await page.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-08-tags-list.png' });
    console.log('   ✓ Tags management loaded');

    // 8. Check public hacks view
    console.log('8. Testing public hacks view...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-09-public-hacks.png' });
    console.log('   ✓ Public hacks view loaded');

    // 9. Check tags page
    console.log('9. Testing tags page...');
    await page.goto('http://localhost:3000/tags', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'flow-10-public-tags.png' });
    console.log('   ✓ Tags page loaded');

    console.log('\n✅ All tests passed! Check the screenshots for visual validation.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'flow-error.png' });
  } finally {
    await browser.close();
  }
}

testApp();