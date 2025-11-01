/**
 * Simplified admin levels test with better error handling and screenshots
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAdminLevels() {
  console.log('🧪 Testing Admin Levels Functionality\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Log all console messages
  page.on('console', msg => console.log('  [Browser]', msg.text()));

  const timestamp = Date.now();

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in as admin...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle' });
    await sleep(1000);

    await page.screenshot({ path: 'screenshots/01-auth-page.png', fullPage: true });

    await page.locator('input[type="email"]').fill('admin@test.com');
    await page.locator('input[type="password"]').fill('test123');

    await page.screenshot({ path: 'screenshots/02-filled-login.png', fullPage: true });

    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.includes('/auth'), { timeout: 10000 });
    await sleep(2000);

    console.log('✅ Logged in successfully');
    console.log(`   Current URL: ${page.url()}\n`);

    await page.screenshot({ path: 'screenshots/03-logged-in.png', fullPage: true });

    // Step 2: Navigate to admin/hacks/new
    console.log('📝 Step 2: Creating first hack...');
    await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({ path: 'screenshots/04-hack-form-page.png', fullPage: true });

    const hack1Name = `Test Hack Alpha ${timestamp}`;
    const hack1Slug = `test-hack-alpha-${timestamp}`;

    // Fill in hack details
    await page.locator('#name').fill(hack1Name);
    await page.locator('#slug').fill(hack1Slug);
    await page.locator('#description').fill('First test hack - no dependencies');
    await page.locator('#icon').fill('🎯');

    await page.screenshot({ path: 'screenshots/05-hack-form-filled.png', fullPage: true });

    // Submit
    await page.locator('button[type="submit"]').click();
    await sleep(3000);

    console.log(`✅ Created first hack: ${hack1Name}\n`);
    await page.screenshot({ path: 'screenshots/06-after-hack-created.png', fullPage: true });

    // Step 3: Create a level
    console.log('📝 Step 3: Creating test level...');
    await page.goto('http://localhost:3000/admin/levels/new', { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({ path: 'screenshots/07-level-form-page.png', fullPage: true });

    const levelName = `Test Level ${timestamp}`;
    const levelSlug = `test-level-${timestamp}`;

    await page.locator('#name').fill(levelName);
    await page.locator('#slug').fill(levelSlug);
    await page.locator('#description').fill('Test level for validation');
    await page.locator('#icon').fill('🏆');

    await page.screenshot({ path: 'screenshots/08-level-form-filled.png', fullPage: true });

    await page.locator('button[type="submit"]').click();
    await sleep(3000);

    console.log(`✅ Created level: ${levelName}\n`);
    await page.screenshot({ path: 'screenshots/09-after-level-created.png', fullPage: true });

    // Step 4: Create second hack with dependencies
    console.log('📝 Step 4: Creating second hack (with prerequisites)...');
    await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle' });
    await sleep(2000);

    const hack2Name = `Test Hack Beta ${timestamp}`;
    const hack2Slug = `test-hack-beta-${timestamp}`;

    await page.locator('#name').fill(hack2Name);
    await page.locator('#slug').fill(hack2Slug);
    await page.locator('#description').fill('Second hack - depends on first');
    await page.locator('#icon').fill('🎪');

    await page.screenshot({ path: 'screenshots/10-hack2-form-filled.png', fullPage: true });

    await page.locator('button[type="submit"]').click();
    await sleep(3000);

    console.log(`✅ Created second hack: ${hack2Name}\n`);
    await page.screenshot({ path: 'screenshots/11-after-hack2-created.png', fullPage: true });

    // Step 5: View levels page
    console.log('📝 Step 5: Viewing levels page...');
    await page.goto('http://localhost:3000/levels', { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({ path: 'screenshots/12-levels-page.png', fullPage: true });
    console.log('✅ Levels page loaded\n');

    // Step 6: View test level detail
    console.log('📝 Step 6: Viewing test level detail...');
    await page.goto(`http://localhost:3000/levels/${levelSlug}`, { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({ path: 'screenshots/13-test-level-detail.png', fullPage: true });
    console.log('✅ Level detail page loaded\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST RESULTS\n');
    console.log('✅ Successfully created:');
    console.log(`   - Level: ${levelName} (${levelSlug})`);
    console.log(`   - Hack 1: ${hack1Name}`);
    console.log(`   - Hack 2: ${hack2Name}`);
    console.log('\n📸 All screenshots saved to screenshots/ directory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 20 seconds...');
    await sleep(20000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    await page.screenshot({ path: 'screenshots/99-error.png', fullPage: true });
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testAdminLevels();
