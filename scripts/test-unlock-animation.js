/**
 * Test script to demonstrate the unlock animation
 *
 * This script will:
 * 1. Navigate to the Foundation level
 * 2. Open Morning Sunlight Exposure hack
 * 3. Complete all required checklist items
 * 4. Mark the hack as complete
 * 5. Watch for the unlock animation on Box Breathing
 */

const { chromium } = require('playwright');

async function testUnlockAnimation() {
  console.log('🎬 Testing Unlock Animation\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating to Foundation level...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('✅ Page loaded\n');

    console.log('2. Opening Morning Sunlight Exposure...');
    await page.click('text=Morning Sunlight Exposure');
    await page.waitForTimeout(2000);
    console.log('✅ Hack modal opened\n');

    console.log('3. Completing checklist items...');
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    console.log(`   Found ${count} checklist items`);

    // Check all required items (first 3)
    for (let i = 0; i < Math.min(3, count); i++) {
      const checkbox = checkboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.click();
        await page.waitForTimeout(300);
        console.log(`   ✓ Checked item ${i + 1}`);
      }
    }
    console.log('✅ All required items completed\n');

    console.log('4. Marking hack as complete...');
    const completeButton = page.locator('button:has-text("Mark Complete")');
    await completeButton.click();
    console.log('✅ Clicked Mark Complete button\n');

    console.log('5. Waiting for modal to close and unlock animation...');
    await page.waitForTimeout(1000); // Wait for modal close + collapse animation
    console.log('✅ Modal closed\n');

    console.log('6. Looking for unlock animation on Box Breathing...');
    await page.waitForTimeout(500); // Additional time for unlock animation to start

    // Take screenshot of the unlock animation
    await page.screenshot({
      path: 'screenshots/unlock-animation.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/unlock-animation.png\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 TEST COMPLETE!\n');
    console.log('Expected behavior:');
    console.log('✓ Morning Sunlight hack should be marked complete');
    console.log('✓ Box Breathing should show unlock animation');
    console.log('✓ Blue pulsing border should appear');
    console.log('✓ "Unlocked!" badge should animate in and out');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 10 seconds to observe...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({
      path: 'screenshots/unlock-animation-error.png',
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testUnlockAnimation();
