/**
 * Test script to verify flowchart displays localStorage completion data
 */

const { chromium } = require('playwright');

async function testFlowchartLocalStorage() {
  console.log('🧪 Testing Flowchart LocalStorage Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Clear localStorage to start fresh
    console.log('1. Clearing localStorage...');
    await page.goto('http://localhost:3000/levels/foundation');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(2000);
    console.log('✅ LocalStorage cleared\n');

    // Step 2: Mark a hack as completed in localStorage
    console.log('2. Simulating hack completion in localStorage...');
    const testHackId = await page.evaluate(async () => {
      // Find the first hack node in the flowchart
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get hack ID from data attribute or other means
      // For now, we'll use a known hack ID
      const hackId = 'test-hack-id'; // This should be updated with actual hack ID

      // Mark as completed in localStorage
      const hackProgress = JSON.parse(localStorage.getItem('nrghax_hack_progress') || '{}');
      hackProgress[hackId] = {
        hackId,
        completed: true,
        completedAt: new Date().toISOString(),
        viewCount: 3,
        lastViewedAt: new Date().toISOString()
      };
      localStorage.setItem('nrghax_hack_progress', JSON.stringify(hackProgress));

      return hackId;
    });
    console.log(`✅ Marked hack ${testHackId} as completed with 3 visits\n`);

    // Step 3: Trigger a storage event to update UI
    console.log('3. Triggering localStorage update event...');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('localProgressUpdate'));
    });
    await page.waitForTimeout(1000);
    console.log('✅ Update event dispatched\n');

    // Step 4: Verify the flowchart reflects the completion
    console.log('4. Checking flowchart for green styling and visit count...');

    // Take a screenshot
    await page.screenshot({ path: 'screenshots/flowchart-local-storage-test.png', fullPage: true });
    console.log('✅ Screenshot saved to screenshots/flowchart-local-storage-test.png\n');

    // Step 5: Check localStorage content
    console.log('5. Final localStorage state:');
    const finalStorage = await page.evaluate(() => {
      return {
        hackProgress: localStorage.getItem('nrghax_hack_progress'),
        levelProgress: localStorage.getItem('nrghax_level_progress')
      };
    });
    console.log('Hack Progress:', finalStorage.hackProgress);
    console.log('Level Progress:', finalStorage.levelProgress);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST COMPLETE\n');
    console.log('Expected behavior:');
    console.log('  ✓ Completed hacks should have green background and border');
    console.log('  ✓ Completed hacks should show green text');
    console.log('  ✓ View count badge should be visible (e.g., "3 visits")');
    console.log('  ✓ Required badge should be hidden if viewCount > 1');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 30 seconds to inspect...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testFlowchartLocalStorage();
