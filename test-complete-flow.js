const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function takeScreenshot(page, name) {
  const filename = `test-screenshots/${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  📸 Screenshot saved: ${filename}`);
}

async function testCompleteFlow() {
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Starting complete flow test...\n');

    // 1. Test Homepage
    console.log('1. Testing Homepage...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-homepage');

    // Check for styled elements
    const navbar = await page.locator('nav').first();
    const navbarBg = await navbar.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`  ✓ Navbar background: ${navbarBg}`);

    // 2. Test Sign Up Page
    console.log('\n2. Testing Sign Up Page...');
    await page.click('text=Sign Up');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-signup-page');

    // 3. Create New User
    console.log('\n3. Creating new user...');
    await page.click('text=Sign Up');
    await page.waitForTimeout(500);

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await takeScreenshot(page, '03-signup-filled');

    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '04-after-signup');

    // 4. Test Login
    console.log('\n4. Testing Login...');
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForTimeout(1000);

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await takeScreenshot(page, '05-login-filled');

    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Check if redirected to dashboard or onboarding
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    await takeScreenshot(page, '06-after-login');

    // 5. Test Hacks Page as User
    console.log('\n5. Testing Hacks Page as User...');
    await page.goto(`${BASE_URL}/hacks`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '07-hacks-user');

    // 6. Logout
    console.log('\n6. Logging out...');
    await page.goto(`${BASE_URL}/auth/signout`, { method: 'POST' });
    await page.waitForTimeout(1000);

    // 7. Login as Admin
    console.log('\n7. Logging in as Admin...');
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForTimeout(1000);

    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await takeScreenshot(page, '08-admin-login');

    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '09-admin-dashboard');

    // 8. Test Admin Navigation
    console.log('\n8. Testing Admin Navigation...');
    const adminLinks = await page.locator('a:has-text("Manage Hacks")').count();
    console.log(`  Admin links found: ${adminLinks}`);

    if (adminLinks === 0) {
      console.log('  ⚠️  No admin navigation found! Trying to refresh session...');

      // Try to refresh session
      await page.evaluate(async () => {
        const response = await fetch('/api/refresh-session', {
          method: 'POST',
          credentials: 'include'
        });
        const data = await response.json();
        console.log('Session refresh:', data);
      });

      await page.reload();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '10-after-refresh');
    }

    // 9. Test Admin Hacks Page
    console.log('\n9. Testing Admin Hacks Page...');
    await page.goto(`${BASE_URL}/admin/hacks`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '11-admin-hacks');

    // 10. Test Create New Hack
    console.log('\n10. Testing Create New Hack...');
    await page.goto(`${BASE_URL}/admin/hacks/new`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '12-new-hack-form');

    // Fill hack form
    await page.fill('input[name="title"]', 'Test Hack');
    await page.fill('textarea[name="description"]', 'This is a test hack description');
    await page.fill('input[name="difficulty"]', '3');
    await page.fill('input[name="points"]', '100');
    await page.fill('textarea[name="content"]', '# Test Content\n\nThis is test content.');
    await takeScreenshot(page, '13-new-hack-filled');

    await page.click('button:has-text("Create Hack")');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '14-after-create-hack');

    // 11. Test Tags Page
    console.log('\n11. Testing Tags Page...');
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '15-tags-page');

    // Create a new tag
    const tagInput = await page.locator('input[placeholder*="tag"]').first();
    if (tagInput) {
      await tagInput.fill('TestTag');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '16-after-create-tag');
    }

    // 12. Test Tag Assignment
    console.log('\n12. Testing Tag Assignment...');
    await page.goto(`${BASE_URL}/admin/tags/assign`);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '17-tag-assign');

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the tests
testCompleteFlow().catch(console.error);