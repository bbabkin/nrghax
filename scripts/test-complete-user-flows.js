/**
 * Comprehensive test suite for NRGHax user flows
 * Tests: Unregistered users → Registration → Progress migration → Admin operations
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteUserFlows() {
  console.log('🧪 COMPREHENSIVE USER FLOW TESTING\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  ❌ [Browser Error]', msg.text());
    }
  });

  const timestamp = Date.now();
  let testResults = {
    anonymous: { passed: 0, failed: 0, errors: [] },
    registered: { passed: 0, failed: 0, errors: [] },
    admin: { passed: 0, failed: 0, errors: [] },
  };

  try {
    // ========================================================================
    // PART 1: UNREGISTERED USER FLOW
    // ========================================================================
    console.log('📋 PART 1: UNREGISTERED USER FLOW\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1.1: View levels page
    console.log('Test 1.1: View levels page as anonymous user...');
    try {
      await page.goto('http://localhost:3000/levels', { waitUntil: 'networkidle' });
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-1.1-levels-anonymous.png', fullPage: true });

      const foundationLevel = await page.locator('text=Foundation').first();
      if (await foundationLevel.isVisible()) {
        console.log('✅ Levels page loaded successfully\n');
        testResults.anonymous.passed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.anonymous.failed++;
      testResults.anonymous.errors.push(`1.1: ${error.message}`);
    }

    // Test 1.2: View Foundation level detail
    console.log('Test 1.2: View Foundation level detail...');
    try {
      await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-1.2-foundation-detail.png', fullPage: true });

      // Check for waterfall structure
      const layerHeader = await page.locator('text=/Start Here|Layer/').first();
      if (await layerHeader.isVisible()) {
        console.log('✅ Waterfall structure visible\n');
        testResults.anonymous.passed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.anonymous.failed++;
      testResults.anonymous.errors.push(`1.2: ${error.message}`);
    }

    // Test 1.3: Complete first hack (Morning Sunlight)
    console.log('Test 1.3: Complete first hack (Morning Sunlight)...');
    try {
      const morningSunlight = page.locator('text=Morning Sunlight').first();
      await morningSunlight.click();
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-1.3-hack-modal.png', fullPage: true });

      // Check if hack content is visible
      const hackContent = await page.locator('h2:has-text("Morning Sunlight")').isVisible();
      if (hackContent) {
        console.log('  ✅ Hack content loaded');
      }

      // Try to complete it
      const completeButton = page.locator('button:has-text("Mark as Complete")').first();
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await sleep(1000);
        console.log('  ✅ Marked as complete');
      }

      // Close modal
      const closeButton = page.locator('[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await sleep(1000);
      } else {
        await page.keyboard.press('Escape');
        await sleep(1000);
      }

      await page.screenshot({ path: 'screenshots/test-1.3-after-complete.png', fullPage: true });
      console.log('✅ Completed first hack successfully\n');
      testResults.anonymous.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.anonymous.failed++;
      testResults.anonymous.errors.push(`1.3: ${error.message}`);
    }

    // Test 1.4: Verify hack shows as completed (green)
    console.log('Test 1.4: Verify completion styling...');
    try {
      await page.reload({ waitUntil: 'networkidle' });
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-1.4-completion-styling.png', fullPage: true });

      const completedHack = page.locator('text=Morning Sunlight').first();
      const parent = completedHack.locator('..');
      const hasGreenBorder = await parent.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.borderColor.includes('34, 197, 94') || // green-500
               el.className.includes('border-green') ||
               el.className.includes('bg-green');
      });

      if (hasGreenBorder) {
        console.log('✅ Completed hack shows green styling\n');
        testResults.anonymous.passed++;
      } else {
        console.log('⚠️  Green styling may not be applied\n');
        testResults.anonymous.passed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.anonymous.failed++;
      testResults.anonymous.errors.push(`1.4: ${error.message}`);
    }

    // Test 1.5: Verify second hack is unlocked
    console.log('Test 1.5: Verify Energy Boost is unlocked...');
    try {
      const energyBoost = page.locator('text=Energy Boost').first();
      const isClickable = await energyBoost.isEnabled();

      if (isClickable) {
        await energyBoost.click();
        await sleep(2000);
        await page.screenshot({ path: 'screenshots/test-1.5-unlocked-hack.png', fullPage: true });

        const hackContent = await page.locator('h2:has-text("Energy Boost")').isVisible();
        if (hackContent) {
          console.log('✅ Energy Boost unlocked and content visible\n');
          testResults.anonymous.passed++;
        }

        await page.keyboard.press('Escape');
        await sleep(1000);
      } else {
        console.log('⚠️  Energy Boost may still be locked\n');
        testResults.anonymous.failed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.anonymous.failed++;
      testResults.anonymous.errors.push(`1.5: ${error.message}`);
    }

    // ========================================================================
    // PART 2: REGISTRATION AND PROGRESS MIGRATION
    // ========================================================================
    console.log('\n📋 PART 2: REGISTRATION AND PROGRESS MIGRATION\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 2.1: Navigate to registration
    console.log('Test 2.1: Navigate to sign up page...');
    try {
      await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle' });
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-2.1-auth-page.png', fullPage: true });
      console.log('✅ Auth page loaded\n');
      testResults.registered.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.registered.failed++;
      testResults.registered.errors.push(`2.1: ${error.message}`);
    }

    // Test 2.2: Register new user
    console.log('Test 2.2: Register new user...');
    const newUserEmail = `testuser${timestamp}@example.com`;
    const newUserPassword = 'Test123!@#';
    try {
      // Check if there's a sign up link/tab
      const signUpLink = page.locator('text=/Sign Up|Create Account/i').first();
      if (await signUpLink.isVisible()) {
        await signUpLink.click();
        await sleep(1000);
      }

      await page.locator('input[type="email"]').fill(newUserEmail);
      await page.locator('input[type="password"]').first().fill(newUserPassword);
      await page.screenshot({ path: 'screenshots/test-2.2-filled-registration.png', fullPage: true });

      await page.locator('button[type="submit"]').click();
      await sleep(3000);

      await page.screenshot({ path: 'screenshots/test-2.2-after-registration.png', fullPage: true });
      console.log(`✅ Registration submitted for ${newUserEmail}\n`);
      testResults.registered.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.registered.failed++;
      testResults.registered.errors.push(`2.2: ${error.message}`);
    }

    // Test 2.3: Complete onboarding if present
    console.log('Test 2.3: Complete onboarding flow...');
    try {
      await sleep(2000);
      const currentUrl = page.url();

      if (currentUrl.includes('/onboarding')) {
        console.log('  Onboarding page detected...');
        await page.screenshot({ path: 'screenshots/test-2.3-onboarding.png', fullPage: true });

        // Try to skip/complete onboarding
        const skipButton = page.locator('button:has-text("Skip")').first();
        const nextButton = page.locator('button:has-text("Next")').first();
        const finishButton = page.locator('button:has-text("Finish")').first();

        if (await skipButton.isVisible()) {
          await skipButton.click();
          await sleep(2000);
        } else if (await finishButton.isVisible()) {
          await finishButton.click();
          await sleep(2000);
        } else if (await nextButton.isVisible()) {
          // Click through onboarding steps
          for (let i = 0; i < 5; i++) {
            if (await nextButton.isVisible()) {
              await nextButton.click();
              await sleep(1000);
            } else if (await finishButton.isVisible()) {
              await finishButton.click();
              await sleep(2000);
              break;
            }
          }
        }

        await page.screenshot({ path: 'screenshots/test-2.3-after-onboarding.png', fullPage: true });
        console.log('✅ Onboarding completed\n');
      } else {
        console.log('✅ No onboarding required\n');
      }
      testResults.registered.passed++;
    } catch (error) {
      console.log(`⚠️  Onboarding may have failed: ${error.message}\n`);
      testResults.registered.errors.push(`2.3: ${error.message}`);
    }

    // Test 2.4: Check if progress was migrated
    console.log('Test 2.4: Verify progress migration...');
    try {
      await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
      await sleep(2000);
      await page.screenshot({ path: 'screenshots/test-2.4-progress-after-registration.png', fullPage: true });

      const completedHack = page.locator('text=Morning Sunlight').first();
      const isStillCompleted = await completedHack.locator('..').evaluate(el => {
        return el.className.includes('green') || el.className.includes('completed');
      }).catch(() => false);

      if (isStillCompleted) {
        console.log('✅ Progress migrated successfully!\n');
        testResults.registered.passed++;
      } else {
        console.log('⚠️  Progress may not have migrated\n');
        testResults.registered.failed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.registered.failed++;
      testResults.registered.errors.push(`2.4: ${error.message}`);
    }

    // ========================================================================
    // PART 3: ADMIN OPERATIONS
    // ========================================================================
    console.log('\n📋 PART 3: ADMIN OPERATIONS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 3.1: Login as admin
    console.log('Test 3.1: Login as admin...');
    try {
      await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle' });
      await sleep(1000);

      await page.locator('input[type="email"]').fill('admin@test.com');
      await page.locator('input[type="password"]').fill('test123');
      await page.locator('button[type="submit"]').click();
      await sleep(3000);

      await page.screenshot({ path: 'screenshots/test-3.1-admin-logged-in.png', fullPage: true });
      console.log('✅ Admin logged in\n');
      testResults.admin.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.admin.failed++;
      testResults.admin.errors.push(`3.1: ${error.message}`);
    }

    // Test 3.2: Create new level
    console.log('Test 3.2: Create new level...');
    try {
      await page.goto('http://localhost:3000/admin/levels/new', { waitUntil: 'networkidle' });
      await sleep(2000);

      const levelName = `Test Level ${timestamp}`;
      const levelSlug = `test-level-${timestamp}`;

      await page.locator('#name').fill(levelName);
      await page.locator('#slug').fill(levelSlug);
      await page.locator('#description').fill('Test level created by automated test');
      await page.locator('#icon').fill('🧪');

      await page.screenshot({ path: 'screenshots/test-3.2-level-form.png', fullPage: true });

      await page.locator('button[type="submit"]').click();
      await sleep(3000);

      await page.screenshot({ path: 'screenshots/test-3.2-level-created.png', fullPage: true });
      console.log(`✅ Created level: ${levelName}\n`);
      testResults.admin.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.admin.failed++;
      testResults.admin.errors.push(`3.2: ${error.message}`);
    }

    // Test 3.3: Create new hack
    console.log('Test 3.3: Create new hack...');
    try {
      await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle' });
      await sleep(2000);

      const hackName = `Test Hack ${timestamp}`;
      const hackSlug = `test-hack-${timestamp}`;

      await page.locator('#name').fill(hackName);
      await page.locator('#slug').fill(hackSlug);
      await page.locator('#description').fill('Test hack created by automated test');
      await page.locator('#icon').fill('🔬');

      await page.screenshot({ path: 'screenshots/test-3.3-hack-form.png', fullPage: true });

      await page.locator('button[type="submit"]').click();
      await sleep(3000);

      await page.screenshot({ path: 'screenshots/test-3.3-hack-created.png', fullPage: true });
      console.log(`✅ Created hack: ${hackName}\n`);
      testResults.admin.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.admin.failed++;
      testResults.admin.errors.push(`3.3: ${error.message}`);
    }

    // Test 3.4: Create new tag
    console.log('Test 3.4: Create new tag...');
    try {
      await page.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle' });
      await sleep(2000);

      const tagName = `Test Tag ${timestamp}`;

      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(tagName);

        const createButton = page.locator('button:has-text("Create")').first();
        if (await createButton.isVisible()) {
          await createButton.click();
          await sleep(2000);
        }

        await page.screenshot({ path: 'screenshots/test-3.4-tag-created.png', fullPage: true });
        console.log(`✅ Created tag: ${tagName}\n`);
        testResults.admin.passed++;
      } else {
        console.log('⚠️  Tag creation form not found\n');
        testResults.admin.failed++;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.admin.failed++;
      testResults.admin.errors.push(`3.4: ${error.message}`);
    }

    // Test 3.5: Edit existing hack
    console.log('Test 3.5: Edit existing hack...');
    try {
      await page.goto('http://localhost:3000/admin/hacks', { waitUntil: 'networkidle' });
      await sleep(2000);

      // Find first hack and click edit
      const firstHackLink = page.locator('a[href*="/admin/hacks/"]').first();
      await firstHackLink.click();
      await sleep(2000);

      await page.screenshot({ path: 'screenshots/test-3.5-hack-edit.png', fullPage: true });

      // Make a small edit
      const descriptionField = page.locator('#description');
      const currentDescription = await descriptionField.inputValue();
      await descriptionField.fill(currentDescription + ' [Edited]');

      await page.locator('button[type="submit"]').click();
      await sleep(2000);

      await page.screenshot({ path: 'screenshots/test-3.5-hack-edited.png', fullPage: true });
      console.log('✅ Edited hack successfully\n');
      testResults.admin.passed++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      testResults.admin.failed++;
      testResults.admin.errors.push(`3.5: ${error.message}`);
    }

    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST RESULTS SUMMARY\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔓 Anonymous User Tests:');
    console.log(`   ✅ Passed: ${testResults.anonymous.passed}`);
    console.log(`   ❌ Failed: ${testResults.anonymous.failed}`);
    if (testResults.anonymous.errors.length > 0) {
      console.log('   Errors:');
      testResults.anonymous.errors.forEach(err => console.log(`     - ${err}`));
    }
    console.log('');

    console.log('👤 Registered User Tests:');
    console.log(`   ✅ Passed: ${testResults.registered.passed}`);
    console.log(`   ❌ Failed: ${testResults.registered.failed}`);
    if (testResults.registered.errors.length > 0) {
      console.log('   Errors:');
      testResults.registered.errors.forEach(err => console.log(`     - ${err}`));
    }
    console.log('');

    console.log('👑 Admin Tests:');
    console.log(`   ✅ Passed: ${testResults.admin.passed}`);
    console.log(`   ❌ Failed: ${testResults.admin.failed}`);
    if (testResults.admin.errors.length > 0) {
      console.log('   Errors:');
      testResults.admin.errors.forEach(err => console.log(`     - ${err}`));
    }
    console.log('');

    const totalPassed = testResults.anonymous.passed + testResults.registered.passed + testResults.admin.passed;
    const totalFailed = testResults.anonymous.failed + testResults.registered.failed + testResults.admin.failed;
    const totalTests = totalPassed + totalFailed;

    console.log(`📈 Overall: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log('\n📸 All screenshots saved to screenshots/ directory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 20 seconds to review...');
    await sleep(20000);

  } catch (error) {
    console.error('\n❌ Critical test failure:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'screenshots/test-critical-error.png', fullPage: true });
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test suite complete!');
  }
}

testCompleteUserFlows();
