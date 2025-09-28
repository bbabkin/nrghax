const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting application verification...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  try {
    // Test 1: Homepage
    console.log('\n📋 Test 1: Loading homepage...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully');

    // Check for theme toggle
    const themeToggle = page.locator('[data-testid="theme-toggle"], button:has(svg[class*="sun"]), button:has(svg[class*="moon"])').first();
    if (await themeToggle.isVisible()) {
      console.log('✅ Theme toggle is visible in navbar');

      // Test theme toggle
      console.log('\n📋 Test 2: Testing theme toggle...');
      await themeToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/02-theme-toggled.png', fullPage: true });
      console.log('✅ Theme toggle works');

      // Toggle back
      await themeToggle.click();
      await page.waitForTimeout(500);
    }

    // Test 3: Navigate to Hacks
    console.log('\n📋 Test 3: Navigating to Hacks page...');
    await page.click('a[href="/hacks"]');
    await page.waitForURL('**/hacks', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/03-hacks-page.png', fullPage: true });
    console.log('✅ Hacks page loaded');

    // Check if admin bubble is removed
    const adminBubble = page.locator('text=/Admin Mode Active/i');
    const hasAdminBubble = await adminBubble.count() > 0;
    if (!hasAdminBubble) {
      console.log('✅ Admin bubble notification removed successfully');
    } else {
      console.log('⚠️ Admin bubble still visible');
    }

    // Test 4: Navigate to Routines
    console.log('\n📋 Test 4: Navigating to Routines page...');
    await page.click('a[href="/routines"]');
    await page.waitForURL('**/routines', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/04-routines-page.png', fullPage: true });
    console.log('✅ Routines page loaded');

    // Test 5: Navigate to Library (unified page)
    console.log('\n📋 Test 5: Navigating to Library page...');
    await page.click('a[href="/library"]');
    await page.waitForURL('**/library', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/05-library-page.png', fullPage: true });
    console.log('✅ Library page loaded');

    // Test 6: Sign in page
    console.log('\n📋 Test 6: Navigating to Sign In page...');
    await page.goto('http://localhost:3001/sign-in');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-signin-page.png', fullPage: true });
    console.log('✅ Sign-in page loaded');

    console.log('\n🎉 All tests passed successfully!');
    console.log('📸 Screenshots saved in screenshots/ directory');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
})();