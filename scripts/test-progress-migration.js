/**
 * Test script for anonymous user progress migration
 * Tests that progress saved in localStorage gets migrated to database when user signs in
 */

const { chromium } = require('playwright');

async function testProgressMigration() {
  console.log('🧪 Testing Anonymous User Progress Migration\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // ===== PHASE 1: Anonymous User Creates Progress =====
    console.log('📝 Phase 1: Creating progress as anonymous user...\n');

    // Navigate to a level page
    console.log('1. Navigating to Foundation level...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    // Open a hack with checklist
    console.log('2. Opening first hack...');
    const hackCard = page.locator('[data-testid="hack-card"]').first();
    if (await hackCard.count() === 0) {
      // Fallback: try clicking any clickable card
      await page.locator('.cursor-pointer').first().click();
    } else {
      await hackCard.click();
    }
    await page.waitForTimeout(2000);
    console.log('✅ Hack opened\n');

    // Check some checklist items
    console.log('3. Completing checklist items...');
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      console.log(`   Found ${checkboxCount} checklist items`);

      // Check first 2 items
      const itemsToCheck = Math.min(2, checkboxCount);
      for (let i = 0; i < itemsToCheck; i++) {
        await checkboxes.nth(i).click();
        await page.waitForTimeout(500);
        console.log(`   ✅ Checked item ${i + 1}`);
      }
    } else {
      console.log('   ⚠️  No checklist items found');
    }
    console.log('');

    // Close modal
    console.log('4. Closing modal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('✅ Modal closed\n');

    // Verify localStorage has data
    console.log('5. Verifying localStorage has progress...');
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hack_checks_') || key.startsWith('nrghax_'))) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    console.log('   localStorage contents:');
    Object.entries(localStorageData).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    console.log('');

    if (Object.keys(localStorageData).length === 0) {
      console.log('   ⚠️  No progress found in localStorage!');
      console.log('   This might indicate an issue with the checklist localStorage saving.\n');
    } else {
      console.log('   ✅ Progress saved in localStorage\n');
    }

    // Take screenshot of anonymous state
    await page.screenshot({
      path: 'screenshots/migration-test-1-anonymous-progress.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: migration-test-1-anonymous-progress.png\n');

    // ===== PHASE 2: User Signs In =====
    console.log('📝 Phase 2: Signing in with test account...\n');

    // Navigate to sign in page
    console.log('6. Navigating to sign in page...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Sign in page loaded\n');

    // Fill in credentials
    console.log('7. Filling in credentials...');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'test123');
    console.log('✅ Credentials filled\n');

    // Submit form
    console.log('8. Submitting sign in form...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // Wait for sign in and migration
    console.log('✅ Signed in\n');

    // ===== PHASE 3: Verify Migration =====
    console.log('📝 Phase 3: Verifying progress migration...\n');

    // Check if localStorage was cleared
    console.log('9. Checking if localStorage was cleared...');
    const postMigrationStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hack_checks_') || key.startsWith('nrghax_'))) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    if (Object.keys(postMigrationStorage).length === 0) {
      console.log('   ✅ localStorage cleared after migration\n');
    } else {
      console.log('   ⚠️  localStorage still has data:');
      Object.entries(postMigrationStorage).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });
      console.log('');
    }

    // Navigate back to the level page
    console.log('10. Navigating back to Foundation level...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    // Open the same hack again
    console.log('11. Opening hack again to verify progress...');
    const hackCardAgain = page.locator('[data-testid="hack-card"]').first();
    if (await hackCardAgain.count() === 0) {
      await page.locator('.cursor-pointer').first().click();
    } else {
      await hackCardAgain.click();
    }
    await page.waitForTimeout(2000);
    console.log('✅ Hack opened\n');

    // Check if checklist items are still checked
    console.log('12. Verifying checklist items are still checked...');
    const checkedBoxes = page.locator('input[type="checkbox"]:checked');
    const checkedCount = await checkedBoxes.count();

    if (checkedCount > 0) {
      console.log(`   ✅ Found ${checkedCount} checked items - Migration successful!\n`);
    } else {
      console.log('   ❌ No checked items found - Migration may have failed\n');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'screenshots/migration-test-2-after-signin.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: migration-test-2-after-signin.png\n');

    // ===== SUMMARY =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 TEST SUMMARY:\n');
    console.log(`✓ Anonymous progress created: ${Object.keys(localStorageData).length > 0 ? 'Yes' : 'No'}`);
    console.log(`✓ localStorage cleared after signin: ${Object.keys(postMigrationStorage).length === 0 ? 'Yes' : 'No'}`);
    console.log(`✓ Progress preserved after signin: ${checkedCount > 0 ? 'Yes' : 'No'}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (Object.keys(localStorageData).length > 0 &&
        Object.keys(postMigrationStorage).length === 0 &&
        checkedCount > 0) {
      console.log('🎉 ALL TESTS PASSED! Migration working correctly.\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the screenshots and console output.\n');
    }

    // Keep browser open for manual inspection
    console.log('⏳ Keeping browser open for 30 seconds for manual inspection...');
    console.log('Press Ctrl+C to close early.\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);

    await page.screenshot({
      path: 'screenshots/migration-test-error.png',
      fullPage: true
    }).catch(() => {});

  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testProgressMigration();
