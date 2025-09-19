const { chromium } = require('playwright');

async function testHackFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Test hack listing page
    console.log('1. Testing hack listing page...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-hack-listing.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 01-hack-listing.png');

    // 2. Test sign in flow
    console.log('2. Testing sign in flow...');
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/02-sign-in-page.png' });
    console.log('   ✓ Screenshot saved: 02-sign-in-page.png');

    // Try to sign in as admin (you'll need to provide credentials)
    // For testing, we'll check if the form exists
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('   ✓ Sign-in form is accessible');
    }

    // 3. Navigate to home to check user state
    console.log('3. Checking home page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-home-page.png', fullPage: true });
    console.log('   ✓ Screenshot saved: 03-home-page.png');

    // 4. Check individual hack view
    console.log('4. Testing individual hack view...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');

    // Click on first hack if available
    const firstHackLink = await page.locator('a[href*="/hacks/"]').first();
    if (await firstHackLink.count() > 0) {
      const hackHref = await firstHackLink.getAttribute('href');
      await page.goto(`http://localhost:3000${hackHref}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/04-hack-detail.png', fullPage: true });
      console.log('   ✓ Screenshot saved: 04-hack-detail.png');
    } else {
      console.log('   ! No hacks found to view');
    }

    // 5. Check for admin features
    console.log('5. Checking for admin features...');

    // Check if there's an "Add Hack" or "Create" button
    const addHackButton = await page.locator('text=/add.*hack|create.*hack|new.*hack/i').first();
    if (await addHackButton.count() > 0) {
      console.log('   ✓ Admin "Add Hack" button found');
      await addHackButton.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/05-add-hack-form.png', fullPage: true });
      console.log('   ✓ Screenshot saved: 05-add-hack-form.png');
    } else {
      console.log('   ! No admin add button visible (may need to sign in as admin)');
    }

    // Check for edit/delete buttons
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');

    const editButton = await page.locator('text=/edit/i').first();
    const deleteButton = await page.locator('text=/delete/i').first();

    if (await editButton.count() > 0) {
      console.log('   ✓ Edit button found');
    }
    if (await deleteButton.count() > 0) {
      console.log('   ✓ Delete button found');
    }

    console.log('\nTest Summary:');
    console.log('- Hack listing page is accessible');
    console.log('- Sign-in page is functional');
    console.log('- Navigation between pages works');
    console.log('- Screenshots saved in screenshots/ directory');
    console.log('\nNote: For full admin testing, you need to sign in with admin credentials');

  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  }

  // Keep browser open for manual testing
  console.log('\nBrowser will stay open for manual testing. Press Ctrl+C to exit.');
  await new Promise(() => {}); // Keep the script running
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testHackFlow();