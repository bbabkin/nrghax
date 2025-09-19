const { chromium } = require('playwright');

async function testCompleteFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Starting comprehensive hack flow testing...\n');

  try {
    // 1. Test hack listing page
    console.log('1. Testing hack listing page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any animations
    await page.screenshot({ path: 'screenshots/01-hack-listing.png', fullPage: true });
    console.log('   ✓ Hack listing page loaded');

    // Check if there are any hacks displayed
    const hackCards = await page.locator('[class*="card"]').count();
    console.log(`   ✓ Found ${hackCards} hack cards on the page`);

    // 2. Test home page
    console.log('\n2. Testing home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-home-page.png', fullPage: true });
    console.log('   ✓ Home page loaded');

    // 3. Test sign-in page
    console.log('\n3. Testing authentication pages...');

    // Try to navigate to sign-in
    const signInLink = await page.locator('a[href*="sign-in"], button:has-text("Sign In"), button:has-text("Login")').first();
    if (await signInLink.count() > 0) {
      await signInLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/03-sign-in-page.png', fullPage: true });
    console.log('   ✓ Sign-in page loaded');

    // 4. Test individual hack view (if hacks exist)
    console.log('\n4. Testing individual hack view...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const firstHack = await page.locator('a[href*="/hacks/"]:not([href="/hacks"])').first();
    if (await firstHack.count() > 0) {
      await firstHack.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'screenshots/04-hack-detail.png', fullPage: true });
      console.log('   ✓ Hack detail page loaded');

      // Check for various elements on the detail page
      const hasLikeButton = await page.locator('button:has-text("Like")').count() > 0;
      const hasContent = await page.locator('main').textContent();
      console.log(`   ✓ Like button present: ${hasLikeButton}`);
      console.log(`   ✓ Content loaded: ${hasContent?.length > 100 ? 'Yes' : 'Minimal'}`);
    } else {
      console.log('   ! No hacks available to view details');
    }

    // 5. Check for admin features
    console.log('\n5. Checking for admin features...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Look for admin-specific UI elements
    const hasAddButton = await page.locator('a[href*="/admin/hacks/new"], button:has-text("Add"), button:has-text("Create")').count() > 0;
    const hasEditButtons = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
    const hasDeleteButtons = await page.locator('button:has-text("Delete")').count();

    console.log(`   Admin features detected:`);
    console.log(`   - Add/Create button: ${hasAddButton ? 'Yes' : 'No'}`);
    console.log(`   - Edit buttons: ${hasEditButtons}`);
    console.log(`   - Delete buttons: ${hasDeleteButtons}`);

    if (hasAddButton) {
      // Try to access admin create page
      const addButton = await page.locator('a[href*="/admin/hacks/new"], button:has-text("Add"), button:has-text("Create")').first();
      await addButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/05-admin-add-hack.png', fullPage: true });
      console.log('   ✓ Admin add hack page accessed');
    }

    // 6. Test profile page (if accessible)
    console.log('\n6. Testing profile page...');
    const profileLink = await page.locator('a[href*="/profile"]').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/06-profile-page.png', fullPage: true });
      console.log('   ✓ Profile page loaded');
    } else {
      console.log('   ! Profile page not accessible (user may not be logged in)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✓ All accessible pages tested successfully');
    console.log('✓ Screenshots saved in screenshots/ directory');
    console.log('\nNotes:');
    console.log('- To test admin features, sign in with admin credentials');
    console.log('- To test user features, sign in with regular user credentials');
    console.log('- The browser will remain open for manual testing');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png' });
    console.log('Error screenshot saved to screenshots/error-state.png');
  }

  console.log('\n📌 Browser will stay open for manual testing. Press Ctrl+C to exit.');
  await new Promise(() => {}); // Keep the script running
}

// Create screenshots directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testCompleteFlow();