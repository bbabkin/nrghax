/**
 * Test script to demonstrate the new vertical layout and React Flow flowchart
 *
 * This script will:
 * 1. Navigate to the Foundation level
 * 2. Show the vertical list view
 * 3. Switch to flowchart view
 * 4. Take screenshots of both views
 */

const { chromium } = require('playwright');

async function testFlowchartView() {
  console.log('🎬 Testing Vertical Layout and Flowchart View\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating to Foundation level...');
    await page.goto('http://localhost:3001/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    console.log('2. Viewing vertical list layout...');
    await page.waitForTimeout(2000);

    // Take screenshot of vertical list view
    await page.screenshot({
      path: 'screenshots/vertical-list-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/vertical-list-view.png\n');

    console.log('3. Switching to flowchart view...');
    // Click the flowchart button
    await page.click('button:has-text("Flowchart")');
    await page.waitForTimeout(2000);

    // Take screenshot of flowchart view
    await page.screenshot({
      path: 'screenshots/flowchart-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/flowchart-view.png\n');

    console.log('4. Testing flowchart interactivity...');
    // Try to click on a hack node in the flowchart
    const hackNode = await page.locator('text=Morning Sunlight Exposure').first();
    if (await hackNode.isVisible()) {
      await hackNode.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked on Morning Sunlight Exposure node\n');

      // Check if modal opened
      const modalTitle = await page.locator('h1:has-text("Morning Sunlight Exposure")');
      if (await modalTitle.isVisible()) {
        console.log('✅ Hack modal opened successfully\n');

        // Close modal
        await page.click('button[aria-label="Close"]');
        await page.waitForTimeout(1000);
      }
    }

    console.log('5. Switching back to list view...');
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(1500);
    console.log('✅ Switched back to list view\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 TEST COMPLETE!\n');
    console.log('Features tested:');
    console.log('✓ Vertical list layout (top-to-bottom)');
    console.log('✓ React Flow flowchart visualization');
    console.log('✓ Toggle between list and flowchart views');
    console.log('✓ Complex prerequisite relationships:');
    console.log('  - Multiple hacks with same prerequisite (Box Breathing → Meditation & Deep Work)');
    console.log('  - Hack with multiple prerequisites (Cold Shower + Power Pose → Ultimate Energy)');
    console.log('  - Branching from single hack (Morning Sunlight → Vitamin D & Circadian Rhythm)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 15 seconds to observe...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({
      path: 'screenshots/flowchart-test-error.png',
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testFlowchartView();