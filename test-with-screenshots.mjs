import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotDir = './test-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filename = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
}

async function testApplication() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // 1. Test Homepage
    console.log('\n🏠 Testing Homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01-homepage');

    // 2. Test Hacks Listing Page
    console.log('\n📚 Testing Hacks Listing...');
    await page.click('text=Explore Hacks');
    await page.waitForURL('**/hacks');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '02-hacks-listing');

    // 3. Test Individual Hack Page
    console.log('\n📖 Testing Individual Hack Page...');
    const firstHack = await page.locator('.grid > div').first();
    if (await firstHack.count() > 0) {
      await firstHack.click();
      await page.waitForLoadState('networkidle');
      await takeScreenshot(page, '03-hack-detail');

      // Test Like Button
      const likeButton = page.locator('button:has-text("Like")').first();
      if (await likeButton.count() > 0) {
        await likeButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Like button clicked');
      }

      // Check if "Mark as Viewed" button exists
      const viewButton = page.locator('button:has-text("Mark as Viewed")').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Mark as Viewed button clicked');
        await takeScreenshot(page, '04-hack-viewed');
      }

      await page.goBack();
    }

    // 4. Test Login Page
    console.log('\n🔐 Testing Login Page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05-login-page');

    // Check for Auth.js providers
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    const discordButton = page.locator('button:has-text("Sign in with Discord")');
    const emailInput = page.locator('input[name="email"]');

    console.log('Auth providers found:');
    if (await googleButton.count() > 0) console.log('  ✅ Google OAuth');
    if (await discordButton.count() > 0) console.log('  ✅ Discord OAuth');
    if (await emailInput.count() > 0) console.log('  ✅ Email/Magic Link');

    // 5. Test Admin Pages (will redirect if not logged in)
    console.log('\n👨‍💼 Testing Admin Routes...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '06-admin-hacks');

    // Check if we got redirected to login
    if (page.url().includes('/login')) {
      console.log('✅ Admin route correctly redirects to login when not authenticated');
    } else {
      console.log('⚠️  Admin page accessible without authentication');

      // If we're on admin page, test Create New Hack button
      const createButton = page.locator('text=Create New Hack');
      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        await takeScreenshot(page, '07-admin-create-hack');

        // Check form fields
        const nameInput = page.locator('input[name="name"]');
        const descInput = page.locator('textarea[name="description"]');
        const contentTypeSelect = page.locator('select[name="content_type"]');

        if (await nameInput.count() > 0) console.log('  ✅ Name field present');
        if (await descInput.count() > 0) console.log('  ✅ Description field present');
        if (await contentTypeSelect.count() > 0) console.log('  ✅ Content type selector present');
      }
    }

    // 6. Test Dashboard
    console.log('\n📊 Testing Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '08-dashboard');

    // 7. Test Profile History
    console.log('\n📜 Testing Profile History...');
    await page.goto('http://localhost:3000/profile/history');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '09-profile-history');

    // 8. Test Tags Page
    console.log('\n🏷️  Testing Tags...');
    await page.goto('http://localhost:3000/profile/tags');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '10-profile-tags');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Testing Complete!');
    console.log(`📸 ${fs.readdirSync(screenshotDir).length} screenshots saved in ${screenshotDir}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the tests
testApplication().catch(console.error);