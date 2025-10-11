import puppeteer from 'puppeteer';

async function testFlows() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // 1. Homepage
    console.log('📸 Testing homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-01-homepage.png', fullPage: true });
    console.log('✅ Homepage');

    // 2. Hacks page (All tab)
    console.log('📸 Testing hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-02-hacks-all.png', fullPage: true });
    console.log('✅ Hacks page (All)');

    // 3. Hacks page with Routines tab (navigate with query param)
    console.log('📸 Testing routines tab...');
    await page.goto('http://localhost:3000/hacks?tab=routines', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-03-routines-tab.png', fullPage: true });
    console.log('✅ Routines tab');

    // 4. Individual hack detail
    console.log('📸 Testing hack detail...');
    await page.goto('http://localhost:3000/hacks/morning-sunlight', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-04-hack-detail.png', fullPage: true });
    console.log('✅ Hack detail');

    // 5. Individual routine detail
    console.log('📸 Testing routine detail...');
    await page.goto('http://localhost:3000/routines/morning-energy-routine', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-05-routine-detail.png', fullPage: true });
    console.log('✅ Routine detail');

    // 6. Auth page
    console.log('📸 Testing auth page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-06-auth-page.png', fullPage: true });
    console.log('✅ Auth page');

    // 7. Login as admin
    console.log('🔐 Logging in as admin...');
    await page.evaluate(() => new Promise(r => setTimeout(r, 1000))); // Wait for form to be ready

    // Fill in email - use label association or placeholder
    const emailInput = await page.$('input[placeholder*="email"]') || await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.click();
      await emailInput.type('admin@example.com');
    }

    // Fill in password
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.click();
      await passwordInput.type('admin123');
    }

    // Take screenshot before clicking
    await page.screenshot({ path: '/tmp/screenshot-07a-login-filled.png', fullPage: true });

    // Click sign in button
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

    // Find all buttons and click the one with "Sign In" text
    const buttons = await page.$$('button');
    let clicked = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Sign In')) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
          button.click()
        ]);
        clicked = true;
        break;
      }
    }

    if (clicked) {
      await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));
    }

    await page.screenshot({ path: '/tmp/screenshot-07-after-login.png', fullPage: true });
    console.log('✅ Login attempted');

    // 8. Dashboard
    console.log('📸 Testing dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-08-dashboard.png', fullPage: true });
    console.log('✅ Dashboard');

    // 9. My Routines
    console.log('📸 Testing my routines...');
    await page.goto('http://localhost:3000/dashboard/routines', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-09-my-routines.png', fullPage: true });
    console.log('✅ My routines');

    // 10. Account page
    console.log('📸 Testing account page...');
    await page.goto('http://localhost:3000/account', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-10-account.png', fullPage: true });
    console.log('✅ Account page');

    // 11. Admin - Hacks management
    console.log('📸 Testing admin hacks...');
    await page.goto('http://localhost:3000/admin/hacks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-11-admin-hacks.png', fullPage: true });
    console.log('✅ Admin hacks');

    // 12. Admin - Users
    console.log('📸 Testing admin users...');
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-12-admin-users.png', fullPage: true });
    console.log('✅ Admin users');

    // 13. Admin - Tags
    console.log('📸 Testing admin tags...');
    await page.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-13-admin-tags.png', fullPage: true });
    console.log('✅ Admin tags');

    // 14. Create new hack form
    console.log('📸 Testing new hack form...');
    await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-14-new-hack-form.png', fullPage: true });
    console.log('✅ New hack form');

    // 15. Create new routine form
    console.log('📸 Testing new routine form...');
    await page.goto('http://localhost:3000/dashboard/routines/new', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: '/tmp/screenshot-15-new-routine-form.png', fullPage: true });
    console.log('✅ New routine form');

    console.log('\n✨ All tests completed successfully!');
    console.log('📁 Screenshots saved to /tmp/screenshot-*.png');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFlows().catch(console.error);
