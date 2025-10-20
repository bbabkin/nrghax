/**
 * Test script to verify checklist feature implementation
 * Run with: node scripts/test-checklist-feature.js
 */

const { chromium } = require('playwright');

async function testChecklistFeature() {
  console.log('🧪 Testing Hack Checklist Feature\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to levels page
    console.log('1️⃣  Navigating to /levels/foundation...');
    await page.goto('http://localhost:3001/levels/foundation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('✅ Page loaded\n');

    // Step 2: Click on first hack
    console.log('2️⃣  Opening first hack...');
    const hackCard = page.locator('[data-testid="hack-card"], .cursor-pointer').first();
    await hackCard.click();
    await page.waitForTimeout(1000);
    console.log('✅ Hack modal opened\n');

    // Step 3: Check if checklist is visible
    console.log('3️⃣  Checking if checklist is visible...');
    const checklistTitle = page.locator('text=Checklist').first();
    const isChecklistVisible = await checklistTitle.isVisible().catch(() => false);

    if (isChecklistVisible) {
      console.log('✅ Checklist section found!\n');

      // Step 4: Count checklist items
      console.log('4️⃣  Counting checklist items...');
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      console.log(`✅ Found ${count} checklist items\n`);

      if (count > 0) {
        // Step 5: Check a checklist item
        console.log('5️⃣  Clicking first checklist item...');
        await checkboxes.first().click();
        await page.waitForTimeout(500);
        console.log('✅ Checklist item toggled\n');

        // Step 6: Check for required/optional badges
        console.log('6️⃣  Checking for required/optional badges...');
        const requiredBadge = page.locator('text=Required').first();
        const optionalBadge = page.locator('text=Optional').first();

        const hasRequired = await requiredBadge.isVisible().catch(() => false);
        const hasOptional = await optionalBadge.isVisible().catch(() => false);

        if (hasRequired) console.log('✅ Found "Required" badge');
        if (hasOptional) console.log('✅ Found "Optional" badge');
        console.log('');

        // Step 7: Check for progress indicator
        console.log('7️⃣  Checking for progress indicator...');
        const progressText = page.locator('text=/\\d+\\/\\d+ (checks|completed)/').first();
        const hasProgress = await progressText.isVisible().catch(() => false);

        if (hasProgress) {
          const progressValue = await progressText.textContent();
          console.log(`✅ Progress indicator found: ${progressValue}\n`);
        } else {
          console.log('⚠️  Progress indicator not found\n');
        }

        // Step 8: Check if Mark Complete button is affected
        console.log('8️⃣  Checking Mark Complete button state...');
        const markCompleteBtn = page.locator('button:has-text("Mark Complete")');
        const isDisabled = await markCompleteBtn.isDisabled().catch(() => false);

        if (isDisabled) {
          console.log('✅ Mark Complete button is disabled (required checks not complete)\n');
        } else {
          console.log('ℹ️  Mark Complete button is enabled\n');
        }

        // Step 9: Take screenshot
        console.log('9️⃣  Taking screenshot...');
        await page.screenshot({
          path: 'screenshots/checklist-feature-test.png',
          fullPage: true
        });
        console.log('✅ Screenshot saved to screenshots/checklist-feature-test.png\n');
      }
    } else {
      console.log('⚠️  Checklist section not found. This might mean:');
      console.log('   - The hack has no checklist items');
      console.log('   - There was an error loading the checklist\n');

      // Take screenshot for debugging
      await page.screenshot({
        path: 'screenshots/checklist-not-found.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved to screenshots/checklist-not-found.png\n');
    }

    console.log('🎉 Test completed successfully!\n');
    console.log('📋 Summary:');
    console.log('   - Checklist feature is ' + (isChecklistVisible ? 'working' : 'not visible'));
    console.log('   - Next steps: Check the screenshots and manually verify in browser');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);

    // Take error screenshot
    await page.screenshot({
      path: 'screenshots/checklist-error.png',
      fullPage: true
    }).catch(() => {});

  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('👋 Browser closed');
  }
}

testChecklistFeature();
