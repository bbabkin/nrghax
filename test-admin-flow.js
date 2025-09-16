const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

async function takeScreenshot(page, name) {
  const filename = `test-flow/${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  📸 ${filename}`);
}

async function testAdminFlow() {
  // Create directory
  if (!fs.existsSync('test-flow')) {
    fs.mkdirSync('test-flow');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('🧪 Testing Admin Flow\n');

    // 1. Homepage
    console.log('1. Homepage');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-homepage');

    // 2. Auth Page
    console.log('\n2. Auth Page');
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '02-auth');

    // 3. Admin Login
    console.log('\n3. Admin Login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await takeScreenshot(page, '03-login-filled');

    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '04-after-login');

    // Check current page
    const url = page.url();
    console.log(`  Current URL: ${url}`);

    // 4. Check for admin navigation
    console.log('\n4. Admin Navigation');
    const hasAdminNav = await page.locator('text=Manage Hacks').count() > 0;
    console.log(`  Admin nav visible: ${hasAdminNav}`);

    if (!hasAdminNav) {
      console.log('  Refreshing session...');
      await page.evaluate(async () => {
        const res = await fetch('/api/refresh-session', {
          method: 'POST',
          credentials: 'include'
        });
        return res.json();
      });
      await page.reload();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '05-after-refresh');
    }

    // 5. Admin Hacks Page
    console.log('\n5. Admin Hacks Page');
    await page.goto(`${BASE_URL}/admin/hacks`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-admin-hacks');

    // 6. New Hack Form
    console.log('\n6. New Hack Form');
    await page.goto(`${BASE_URL}/admin/hacks/new`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '07-new-hack');

    // 7. Fill and Create Hack
    console.log('\n7. Create Hack');
    await page.fill('input[name="title"]', 'Test Energy Hack');
    await page.fill('textarea[name="description"]', 'Learn about renewable energy sources');
    await page.fill('input[name="difficulty"]', '2');
    await page.fill('input[name="points"]', '50');
    await page.fill('textarea[name="content"]', '# Renewable Energy\n\nLearn about solar and wind power.');
    await takeScreenshot(page, '08-hack-filled');

    // Try to submit
    const submitButton = await page.locator('button:has-text("Create")').first();
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '09-after-create');
    }

    // 8. Tags Page
    console.log('\n8. Tags Page');
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '10-tags');

    // 9. Try to create a tag
    console.log('\n9. Create Tag');
    const tagInput = await page.locator('input[name="name"]').first();
    if (tagInput) {
      await tagInput.fill('Solar');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '11-tag-created');
    }

    // 10. User Management
    console.log('\n10. User Management');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '12-users');

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await takeScreenshot(page, 'error');
  } finally {
    await browser.close();
  }
}

testAdminFlow().catch(console.error);