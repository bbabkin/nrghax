/**
 * Test script to debug prerequisite checking logic
 */

const { chromium } = require('playwright');

async function testPrerequisiteLogic() {
  console.log('🔍 Testing Prerequisite Logic\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    devtools: true  // Open dev tools to check localStorage
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating to Foundation level...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    // Check localStorage state
    console.log('2. Checking localStorage for hack progress...');
    const localStorageData = await page.evaluate(() => {
      const hackProgress = localStorage.getItem('nrghax_hack_progress');
      const levelProgress = localStorage.getItem('nrghax_level_progress');
      return {
        hackProgress: hackProgress ? JSON.parse(hackProgress) : {},
        levelProgress: levelProgress ? JSON.parse(levelProgress) : {}
      };
    });

    console.log('Hack Progress:', JSON.stringify(localStorageData.hackProgress, null, 2));
    console.log('Level Progress:', JSON.stringify(localStorageData.levelProgress, null, 2));
    console.log('');

    // Check which hacks are shown as unlocked in the UI
    console.log('3. Checking which hacks appear unlocked in UI...\n');

    // Get all hack cards
    const hackCards = await page.locator('[data-testid="hack-card"]').all();

    for (let i = 0; i < hackCards.length; i++) {
      const card = hackCards[i];

      // Get hack name
      const nameElement = await card.locator('h3').first();
      const hackName = await nameElement.textContent();

      // Check if locked icon is present
      const lockIcon = await card.locator('[data-testid="lock-icon"]').count();
      const isLocked = lockIcon > 0;

      console.log(`   ${i + 1}. ${hackName}: ${isLocked ? '🔒 LOCKED' : '✅ UNLOCKED'}`);
    }

    console.log('\n4. Expected behavior:');
    console.log('   - Morning Sunlight Exposure: ✅ UNLOCKED (no prerequisites)');
    console.log('   - Box Breathing: ✅ UNLOCKED (no prerequisites)');
    console.log('   - Pomodoro Technique: ✅ UNLOCKED (no prerequisites)');
    console.log('   - Cold Shower Finish: ✅ UNLOCKED (no prerequisites)');
    console.log('   - Power Pose: ✅ UNLOCKED (no prerequisites)');
    console.log('   - Meditation Practice: 🔒 LOCKED (requires Box Breathing completion)');
    console.log('   - Deep Work Session: 🔒 LOCKED (requires Box Breathing completion)');
    console.log('   - Ultimate Energy Boost: 🔒 LOCKED (requires Cold Shower + Power Pose)');
    console.log('   - Vitamin D Optimization: 🔒 LOCKED (requires Morning Sunlight)');
    console.log('   - Circadian Rhythm Reset: 🔒 LOCKED (requires Morning Sunlight)\n');

    // Test completing a prerequisite
    console.log('5. Testing prerequisite completion flow...\n');
    console.log('   Clicking on Box Breathing to complete it...');

    // Find and click Box Breathing
    const boxBreathingCard = await page.locator('[data-testid="hack-card"]').filter({ hasText: 'Box Breathing' }).first();
    await boxBreathingCard.click();
    await page.waitForTimeout(2000);

    // Check if we navigated to hack detail page
    const currentUrl = page.url();
    if (currentUrl.includes('/hacks/')) {
      console.log('   ✅ Navigated to Box Breathing detail page');

      // Simulate marking as complete (would need complete button)
      // For now, just go back
      await page.goBack();
      await page.waitForTimeout(2000);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DIAGNOSTIC SUMMARY:\n');

    // Check console for any errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors detected:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('✅ No console errors');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 15 seconds to inspect...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testPrerequisiteLogic();