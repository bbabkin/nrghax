/**
 * Interactive browser test for hack checklist feature
 * Opens browser for manual testing with automated navigation
 */

const { chromium } = require('playwright');

async function testChecklistInBrowser() {
  console.log('🚀 Starting Interactive Checklist Test\n');
  console.log('This will open a browser window for you to manually test the checklist feature.\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log('Step 1: Navigating to Foundation level...');
    await page.goto('http://localhost:3000/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded successfully\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 MANUAL TESTING INSTRUCTIONS:\n');
    console.log('1. Click on any hack card to open the modal');
    console.log('2. Look for the "Checklist" section');
    console.log('3. You should see:');
    console.log('   ✓ Progress bar');
    console.log('   ✓ X/Y checks completed counter');
    console.log('   ✓ Individual checklist items with checkboxes');
    console.log('   ✓ "Required" and "Optional" badges');
    console.log('   ✓ Rich HTML descriptions');
    console.log('4. Try checking/unchecking items');
    console.log('5. Notice the "Mark Complete" button:');
    console.log('   - Should be DISABLED if required checks aren\'t done');
    console.log('   - Should show AlertCircle icon when disabled');
    console.log('   - Should enable once all required checks are complete');
    console.log('6. Test on different hacks to see varied checklists\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Try to find and click the first hack automatically
    console.log('🤖 Attempting to auto-click the first hack...\n');

    await page.waitForTimeout(2000);

    // Try multiple selectors to find a hack card
    const hackSelectors = [
      'text=Morning Sunlight',
      '[role="button"]',
      '.cursor-pointer',
      'a[href*="/hacks/"]'
    ];

    let clicked = false;
    for (const selector of hackSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`Found element with selector: ${selector}`);
          await element.click();
          clicked = true;
          console.log('✅ Clicked on hack!\n');
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!clicked) {
      console.log('⚠️  Could not auto-click a hack. Please click one manually.\n');
    }

    await page.waitForTimeout(2000);

    // Check if checklist is visible
    const checklistVisible = await page.locator('text=Checklist').first().isVisible().catch(() => false);

    if (checklistVisible) {
      console.log('✅ CHECKLIST FOUND!\n');
      console.log('Checklist feature is working. You can now test interactively.\n');

      // Count checkboxes
      const checkboxCount = await page.locator('input[type="checkbox"]').count();
      console.log(`📊 Found ${checkboxCount} checklist items\n`);

      // Check for badges
      const hasRequired = await page.locator('text=Required').first().isVisible().catch(() => false);
      const hasOptional = await page.locator('text=Optional').first().isVisible().catch(() => false);

      console.log(`Badge Detection:`);
      console.log(`  - Required badge: ${hasRequired ? '✅ Found' : '❌ Not found'}`);
      console.log(`  - Optional badge: ${hasOptional ? '✅ Found' : '❌ Not found'}\n`);

    } else {
      console.log('⚠️  Checklist not immediately visible.');
      console.log('This could mean:');
      console.log('  - No modal is open yet (click a hack)');
      console.log('  - The hack has no checklist items');
      console.log('  - There might be an error\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🧪 TEST SCENARIOS TO TRY:\n');
    console.log('1. Complete all required checks → button should enable');
    console.log('2. Uncheck a required item → button should disable');
    console.log('3. Check only optional items → button stays disabled');
    console.log('4. Close modal and reopen → progress should persist');
    console.log('5. Try different hacks → see different checklists\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Browser will stay open for 5 minutes for testing...');
    console.log('Press Ctrl+C in the terminal to close early.\n');

    // Take a screenshot
    await page.screenshot({
      path: 'screenshots/checklist-interactive-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/checklist-interactive-test.png\n');

    // Keep browser open for 5 minutes
    await page.waitForTimeout(300000); // 5 minutes

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({
      path: 'screenshots/checklist-test-error.png',
      fullPage: true
    }).catch(() => {});

  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testChecklistInBrowser();
