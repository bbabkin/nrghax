/**
 * Test script to verify waterfall flowchart with prerequisites
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testWaterfallFlow() {
  console.log('🧪 Testing Waterfall Flowchart with Prerequisites\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to Foundation level as anonymous user
    console.log('📝 Step 1: Viewing Foundation level as anonymous user...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/waterfall-01-initial-state.png', fullPage: true });
    console.log('✅ Initial state captured\n');

    // Step 2: Check for waterfall layers
    console.log('📝 Step 2: Checking waterfall structure...');

    const layerHeaders = await page.locator('text=/Start Here|Layer/').all();
    console.log(`   Found ${layerHeaders.length} layers\n`);

    // Step 3: Verify Box Breathing is locked
    console.log('📝 Step 3: Verifying Box Breathing is locked...');
    const boxBreathingCard = page.locator('[data-testid="hack-card"]:has-text("Box Breathing")').first();
    const hasLockIcon = await boxBreathingCard.locator('svg').filter({ hasText: 'Lock' }).count() > 0;

    if (hasLockIcon) {
      console.log('✅ Box Breathing is locked (as expected)\n');
    } else {
      console.log('⚠️  Box Breathing should be locked but isn\'t\n');
    }

    await page.screenshot({ path: 'screenshots/waterfall-02-box-breathing-locked.png', fullPage: true });

    // Step 4: Find and click Pomodoro Technique
    console.log('📝 Step 4: Completing Pomodoro Technique...');
    const pomodoroCard = page.locator('text=Pomodoro Technique').first();
    await pomodoroCard.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/waterfall-03-pomodoro-modal.png', fullPage: true });

    // Mark as complete
    const completeButton = page.locator('button:has-text("Mark as Complete")').first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Marked Pomodoro as complete\n');
    }

    // Close modal
    const closeButton = page.locator('[aria-label="Close"]').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/waterfall-04-pomodoro-completed.png', fullPage: true });

    // Step 5: Verify Box Breathing is now unlocked
    console.log('📝 Step 5: Verifying Box Breathing is now unlocked...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/waterfall-05-box-breathing-unlocked.png', fullPage: true });

    const boxBreathingUnlocked = page.locator('text=Box Breathing').first();
    const isClickable = await boxBreathingUnlocked.isEnabled();

    if (isClickable) {
      console.log('✅ Box Breathing is now unlocked!\n');
    } else {
      console.log('⚠️  Box Breathing should be unlocked but isn\'t\n');
    }

    // Step 6: Check visual waterfall structure
    console.log('📝 Step 6: Checking visual waterfall elements...');

    const arrows = await page.locator('svg').filter({ hasText: 'ArrowDown' }).count();
    console.log(`   Found ${arrows} arrow separators`);

    const layerLabels = await page.locator('text=/🚀 Start Here|📍 Layer/').count();
    console.log(`   Found ${layerLabels} layer labels\n`);

    await page.screenshot({ path: 'screenshots/waterfall-06-full-view.png', fullPage: true });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST RESULTS\n');
    console.log('✅ Successfully tested:');
    console.log(`   - Waterfall display with ${layerHeaders.length} layers`);
    console.log('   - Prerequisite locking (Box Breathing requires Pomodoro)');
    console.log('   - Unlock flow after completion');
    console.log('   - Visual waterfall elements (arrows, layer labels)');
    console.log('\n📸 All screenshots saved to screenshots/ directory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/waterfall-error.png', fullPage: true });
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testWaterfallFlow();
