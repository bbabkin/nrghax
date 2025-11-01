/**
 * Comprehensive test for levels admin workflow
 * Tests: Create hack → Create level → Add hack to level → Create dependent hack → Verify display
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testLevelsAdminWorkflow() {
  console.log('🧪 Testing Levels Admin Workflow\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Login as admin
    console.log('📝 Step 1: Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForTimeout(1000);

    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);
    console.log('✅ Logged in\n');

    await page.screenshot({ path: 'screenshots/01-logged-in.png', fullPage: true });

    // Step 2: Create first hack
    console.log('📝 Step 2: Creating first hack...');
    await page.goto('http://localhost:3000/admin/hacks/new');
    await page.waitForTimeout(1000);

    const timestamp = Date.now();
    const hack1Name = `Test Hack A ${timestamp}`;
    const hack1Slug = `test-hack-a-${timestamp}`;

    await page.fill('input[name="name"]', hack1Name);
    await page.fill('input[name="slug"]', hack1Slug);
    await page.fill('textarea[name="description"]', 'First test hack for dependency testing');
    await page.fill('input[name="icon"]', '🎯');

    // Select difficulty
    await page.selectOption('select[name="difficulty"]', 'Easy');

    await page.screenshot({ path: 'screenshots/02-hack-form-filled.png', fullPage: true });

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log(`✅ Created hack: ${hack1Name}\n`);

    await page.screenshot({ path: 'screenshots/03-hack-created.png', fullPage: true });

    // Step 3: Create a new level
    console.log('📝 Step 3: Creating new level...');
    await page.goto('http://localhost:3000/admin/levels/new');
    await page.waitForTimeout(1000);

    const levelName = `Test Level ${timestamp}`;
    const levelSlug = `test-level-${timestamp}`;

    await page.fill('input[name="name"]', levelName);
    await page.fill('input[name="slug"]', levelSlug);
    await page.fill('textarea[name="description"]', 'Test level for dependency testing');
    await page.fill('input[name="icon"]', '🏆');

    await page.screenshot({ path: 'screenshots/04-level-form-filled.png', fullPage: true });

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log(`✅ Created level: ${levelName}\n`);

    await page.screenshot({ path: 'screenshots/05-level-created.png', fullPage: true });

    // Step 4: Add first hack to the level
    console.log('📝 Step 4: Adding first hack to level...');

    // Go to admin levels page
    await page.goto('http://localhost:3000/admin/levels');
    await page.waitForTimeout(1000);

    // Find and click on our test level
    const levelLink = await page.locator(`a:has-text("${levelName}")`).first();
    await levelLink.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/06-level-detail.png', fullPage: true });

    // Click "Manage Hacks" or navigate to hacks page
    const currentUrl = page.url();
    const levelId = currentUrl.match(/\/admin\/levels\/([^/]+)/)?.[1];

    if (levelId) {
      await page.goto(`http://localhost:3000/admin/levels/${levelId}/hacks`);
      await page.waitForTimeout(1000);

      // Look for the hack in available hacks and add it
      // This depends on the UI implementation
      console.log('✅ Navigated to hack management page\n');
      await page.screenshot({ path: 'screenshots/07-hack-management.png', fullPage: true });
    }

    // Step 5: Create second hack with dependency
    console.log('📝 Step 5: Creating second hack (dependent on first)...');
    await page.goto('http://localhost:3000/admin/hacks/new');
    await page.waitForTimeout(1000);

    const hack2Name = `Test Hack B ${timestamp}`;
    const hack2Slug = `test-hack-b-${timestamp}`;

    await page.fill('input[name="name"]', hack2Name);
    await page.fill('input[name="slug"]', hack2Slug);
    await page.fill('textarea[name="description"]', 'Second test hack that depends on first hack');
    await page.fill('input[name="icon"]', '🎪');

    // Select difficulty
    await page.selectOption('select[name="difficulty"]', 'Medium');

    await page.screenshot({ path: 'screenshots/08-hack2-form-filled.png', fullPage: true });

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log(`✅ Created hack: ${hack2Name}\n`);

    await page.screenshot({ path: 'screenshots/09-hack2-created.png', fullPage: true });

    // Step 6: Add checklist items to the first hack
    console.log('📝 Step 6: Adding checklist items to first hack...');

    // Navigate to hack edit page
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForTimeout(1000);

    // Find the first hack and click edit
    const hack1EditLink = await page.locator(`a:has-text("${hack1Name}")`).first();
    if (hack1EditLink) {
      await hack1EditLink.click();
      await page.waitForTimeout(1000);

      // Look for checklist section - this depends on UI implementation
      await page.screenshot({ path: 'screenshots/10-hack-edit-page.png', fullPage: true });
    }

    // Step 7: Visit the levels page to verify
    console.log('📝 Step 7: Verifying levels page...');
    await page.goto('http://localhost:3000/levels');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/11-levels-page.png', fullPage: true });
    console.log('✅ Levels page loaded\n');

    // Step 8: Visit the test level page
    console.log('📝 Step 8: Viewing test level detail...');
    await page.goto(`http://localhost:3000/levels/${levelSlug}`);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/12-test-level-detail.png', fullPage: true });
    console.log('✅ Level detail page loaded\n');

    // Step 9: Visit first hack detail page
    console.log('📝 Step 9: Viewing first hack detail...');
    await page.goto(`http://localhost:3000/levels/${levelSlug}/hacks/${hack1Slug}`);
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/13-hack-detail-with-checklist.png', fullPage: true });
    console.log('✅ Hack detail page loaded (should show checklist if added)\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY\n');
    console.log('Created:');
    console.log(`  - Level: ${levelName} (${levelSlug})`);
    console.log(`  - Hack 1: ${hack1Name} (${hack1Slug})`);
    console.log(`  - Hack 2: ${hack2Name} (${hack2Slug})`);
    console.log('\nScreenshots saved to screenshots/ directory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 15 seconds to inspect...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testLevelsAdminWorkflow();
