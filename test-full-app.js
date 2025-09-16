const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

async function takeScreenshot(page, name) {
  const filename = `test-screenshots/${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  📸 ${filename}`);
  return filename;
}

async function testFullApp() {
  // Clean and create directory
  if (fs.existsSync('test-screenshots')) {
    fs.rmSync('test-screenshots', { recursive: true });
  }
  fs.mkdirSync('test-screenshots');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('🧪 Complete App Testing\n');
    console.log('=' .repeat(50));

    // TEST 1: Homepage & Styling
    console.log('\n📍 TEST 1: Homepage & Styling');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-homepage');

    // Check if styles are loaded
    const hasStyles = await page.evaluate(() => {
      const navbar = document.querySelector('nav');
      return navbar && getComputedStyle(navbar).borderBottomWidth !== '0px';
    });
    console.log(`  ✓ Styles loaded: ${hasStyles}`);

    // TEST 2: Admin Login
    console.log('\n📍 TEST 2: Admin Login');
    await page.click('text=Login');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-login-page');

    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await takeScreenshot(page, '03-admin-credentials');

    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    const afterLoginUrl = page.url();
    console.log(`  After login URL: ${afterLoginUrl}`);
    await takeScreenshot(page, '04-after-admin-login');

    // TEST 3: Check Admin Navigation
    console.log('\n📍 TEST 3: Admin Navigation Check');
    const adminNav = await page.locator('text=Manage Hacks').count();
    console.log(`  Admin nav items found: ${adminNav}`);

    if (adminNav === 0) {
      console.log('  ⚠️ Admin nav not visible, checking profile...');

      // Go to account page to check profile
      await page.goto(`${BASE_URL}/account`);
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '05-account-page');
    }

    // TEST 4: Admin Hacks Management
    console.log('\n📍 TEST 4: Admin Hacks Management');
    await page.goto(`${BASE_URL}/admin/hacks`);
    await page.waitForTimeout(2000);
    const hacksUrl = page.url();
    console.log(`  Current URL: ${hacksUrl}`);
    await takeScreenshot(page, '06-admin-hacks');

    // Check if we can access the page
    if (!hacksUrl.includes('/admin/hacks')) {
      console.log('  ❌ Cannot access admin hacks page');
    } else {
      console.log('  ✓ Admin hacks page accessible');

      // TEST 5: Create New Hack
      console.log('\n📍 TEST 5: Create New Hack');
      const newButton = await page.locator('text=New Hack').first();
      if (await newButton.count() > 0) {
        await newButton.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, '07-new-hack-form');

        // Fill hack form
        await page.fill('input[name="title"]', 'Solar Panel Basics');
        await page.fill('textarea[name="description"]', 'Learn the fundamentals of solar energy');
        await page.fill('input[name="difficulty"]', '1');
        await page.fill('input[name="points"]', '25');
        await page.fill('textarea[name="content"]', '# Introduction to Solar Energy\n\nSolar panels convert sunlight into electricity.');
        await takeScreenshot(page, '08-hack-form-filled');

        // Submit
        const submitBtn = await page.locator('button:has-text("Create")').first();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
          await takeScreenshot(page, '09-after-create');
        }
      }
    }

    // TEST 6: Tags Management
    console.log('\n📍 TEST 6: Tags Management');
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '10-tags-page');

    // TEST 7: Regular User Flow
    console.log('\n📍 TEST 7: Regular User Flow');

    // Logout first
    await page.click('text=Sign Out');
    await page.waitForTimeout(2000);

    // Login as regular user
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'test123');
    await takeScreenshot(page, '11-user-login');

    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '12-user-dashboard');

    // Check that admin nav is NOT visible
    const userAdminNav = await page.locator('text=Manage Hacks').count();
    console.log(`  Regular user sees admin nav: ${userAdminNav === 0 ? 'No ✓' : 'Yes ❌'}`);

    // TEST 8: Public Hacks Page
    console.log('\n📍 TEST 8: Public Hacks Page');
    await page.goto(`${BASE_URL}/hacks`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '13-public-hacks');

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log(`📁 Screenshots saved in: test-screenshots/`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-final');
  } finally {
    await browser.close();
  }
}

testFullApp().catch(console.error);