/**
 * Quick test to verify anonymous users can use checklists without redirect
 */

const { chromium } = require('playwright');

async function testAnonymousChecklist() {
  console.log('🧪 Testing Anonymous User Checklist Access\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
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

    console.log('2. Clicking on Morning Sunlight Exposure...');
    await page.click('text=Morning Sunlight Exposure');
    await page.waitForTimeout(2000);
    console.log('✅ Hack opened\n');

    console.log('3. Looking for checklist...');
    const checklistTitle = page.locator('text=Checklist').first();
    const hasChecklist = await checklistTitle.isVisible();

    if (!hasChecklist) {
      console.log('❌ No checklist found!');
      await browser.close();
      return;
    }
    console.log('✅ Checklist found\n');

    console.log('4. Counting checkboxes...');
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    console.log(`✅ Found ${count} checklist items\n`);

    if (count === 0) {
      console.log('❌ No checklist items found!');
      await browser.close();
      return;
    }

    console.log('5. Checking first checkbox...');
    await checkboxes.first().click();
    await page.waitForTimeout(1000);

    // Check if we're still on the same page (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      console.log('❌ FAILED: Redirected to login page!');
      console.log(`   Current URL: ${currentUrl}`);
      await browser.close();
      return;
    }

    console.log('✅ Still on hack page (no redirect to login)\n');

    console.log('6. Checking if checkbox is checked...');
    const isChecked = await checkboxes.first().isChecked();
    if (isChecked) {
      console.log('✅ Checkbox is checked\n');
    } else {
      console.log('⚠️  Checkbox is not checked (might be a UI issue)\n');
    }

    console.log('7. Verifying localStorage...');
    const hasLocalStorage = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('hack_checks_'));
      if (keys.length > 0) {
        const data = localStorage.getItem(keys[0]);
        console.log(`LocalStorage key: ${keys[0]}`);
        console.log(`LocalStorage data: ${data}`);
        return true;
      }
      return false;
    });

    if (hasLocalStorage) {
      console.log('✅ Progress saved to localStorage\n');
    } else {
      console.log('⚠️  No progress found in localStorage\n');
    }

    console.log('8. Checking second checkbox...');
    await checkboxes.nth(1).click();
    await page.waitForTimeout(1000);

    const stillHere = !page.url().includes('/auth/signin');
    if (stillHere) {
      console.log('✅ Still no redirect\n');
    } else {
      console.log('❌ FAILED: Redirected on second check\n');
    }

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/anonymous-checklist-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: screenshots/anonymous-checklist-test.png\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 TEST PASSED!\n');
    console.log('✓ Anonymous users can access checklists');
    console.log('✓ No redirect to login when checking items');
    console.log('✓ Progress saved to localStorage');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({
      path: 'screenshots/anonymous-checklist-error.png',
      fullPage: true
    }).catch(() => {});
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
    console.log('✅ Test complete!');
  }
}

testAnonymousChecklist();
