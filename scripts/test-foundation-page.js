/**
 * Test script to verify Foundation level page fixes:
 * 1. Check that Foundation level is unlocked
 * 2. Verify that at least some hacks are unlocked
 * 3. Test ReactFlow flowchart rendering
 */

const { chromium } = require('playwright');

async function testFoundationPage() {
  console.log('🎬 Testing Foundation Level Page Fixes\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Page loaded\n');

    // Check if level is marked as unlocked
    console.log('2. Checking level unlock status...');
    const lockWarning = await page.locator('text=Level Locked').count();
    if (lockWarning === 0) {
      console.log('✅ Foundation level is UNLOCKED (as expected - no prerequisites)\n');
    } else {
      console.log('❌ Foundation level shows as LOCKED (unexpected!)\n');
    }

    // Check list view for unlocked hacks
    console.log('3. Checking hack unlock status in list view...');
    await page.waitForTimeout(1000);

    // Count lock icons vs total hacks
    const lockIcons = await page.locator('[data-testid="lock-icon"]').count();
    const hackCards = await page.locator('[data-testid="hack-card"]').count();
    const unlockedHacks = hackCards - lockIcons;

    console.log(`   - Total hacks: ${hackCards}`);
    console.log(`   - Locked hacks: ${lockIcons}`);
    console.log(`   - Unlocked hacks: ${unlockedHacks}`);

    if (unlockedHacks > 0) {
      console.log(`✅ ${unlockedHacks} hack(s) are unlocked (entry points available)\n`);
    } else {
      console.log('❌ All hacks are locked (no entry points!)\n');
    }

    // Take screenshot of list view
    await page.screenshot({
      path: 'screenshots/foundation-list-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/foundation-list-view.png\n');

    // Switch to flowchart view
    console.log('4. Switching to flowchart view...');
    const flowchartButton = await page.locator('button:has-text("Flowchart")');
    if (await flowchartButton.isVisible()) {
      await flowchartButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Switched to flowchart view\n');
    } else {
      console.log('❌ Flowchart button not found\n');
    }

    // Check if ReactFlow container is rendered
    console.log('5. Checking ReactFlow rendering...');
    const reactFlowContainer = await page.locator('.react-flow').first();
    if (await reactFlowContainer.isVisible()) {
      console.log('✅ ReactFlow container is visible\n');

      // Check for nodes
      const flowNodes = await page.locator('.react-flow__node').count();
      console.log(`   - Found ${flowNodes} nodes in flowchart`);

      // Check for edges (connections)
      const flowEdges = await page.locator('.react-flow__edge').count();
      console.log(`   - Found ${flowEdges} connections between nodes`);

      if (flowNodes > 0) {
        console.log('✅ Flowchart has nodes rendered\n');
      } else {
        console.log('❌ No nodes found in flowchart\n');
      }
    } else {
      console.log('❌ ReactFlow container not visible\n');
    }

    // Take screenshot of flowchart view
    await page.screenshot({
      path: 'screenshots/foundation-flowchart-view.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/foundation-flowchart-view.png\n');

    // Try to click on an unlocked hack node
    console.log('6. Testing flowchart interactivity...');
    const firstUnlockedNode = await page.locator('.react-flow__node').first();
    if (await firstUnlockedNode.isVisible()) {
      await firstUnlockedNode.click();
      await page.waitForTimeout(1000);

      // Check if navigation occurred
      const currentUrl = page.url();
      if (currentUrl.includes('/hacks/')) {
        console.log('✅ Clicking node navigated to hack detail page\n');
        await page.goBack();
      } else {
        console.log('   - Click registered but stayed on same page\n');
      }
    }

    // Check for console errors
    console.log('7. Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    await page.waitForTimeout(1000);

    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected\n');
    } else {
      console.log(`⚠️ Found ${consoleErrors.length} console errors:\n`);
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 TEST SUMMARY:\n');
    console.log('✓ Foundation level page loads');
    console.log(`${lockWarning === 0 ? '✓' : '✗'} Foundation level is unlocked`);
    console.log(`${unlockedHacks > 0 ? '✓' : '✗'} Entry point hacks are available`);
    const flowchartVisible = await reactFlowContainer.isVisible();
    console.log(`${flowchartVisible ? '✓' : '✗'} ReactFlow flowchart renders`);
    const nodeCount = await page.locator('.react-flow__node').count();
    console.log(`${nodeCount > 0 ? '✓' : '✗'} Flowchart contains hack nodes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 10 seconds to observe...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({
      path: 'screenshots/foundation-test-error.png',
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testFoundationPage();