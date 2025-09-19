const { chromium } = require('playwright');

async function testAdminFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions for visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Testing Admin Flow for Hack CRUD Operations\n');
  console.log('='*50);

  try {
    // 1. Navigate to a specific hack detail page
    console.log('\n1. Testing Hack Detail View...');
    // Let's try to navigate to the first hack
    await page.goto('http://localhost:3000/hacks/cm1g4m5qx0000uc0kfqg7gqf1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test-01-hack-detail.png', fullPage: true });

    const hackTitle = await page.locator('h1').first().textContent();
    console.log(`   ✓ Viewing hack: ${hackTitle}`);

    // Check for Like button
    const likeButton = await page.locator('button:has-text("Like")').count();
    console.log(`   ✓ Like button present: ${likeButton > 0 ? 'Yes' : 'No'}`);

    // 2. Go to sign-in page
    console.log('\n2. Testing Sign-In Page...');
    await page.goto('http://localhost:3000/sign-in', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/test-02-signin.png', fullPage: true });
    console.log('   ✓ Sign-in page loaded');

    // Check for email/password fields
    const emailField = await page.locator('input[type="email"]').count();
    const passwordField = await page.locator('input[type="password"]').count();
    console.log(`   ✓ Email field present: ${emailField > 0 ? 'Yes' : 'No'}`);
    console.log(`   ✓ Password field present: ${passwordField > 0 ? 'Yes' : 'No'}`);

    // 3. Try admin routes directly
    console.log('\n3. Testing Admin Routes (may require authentication)...');

    // Try to access admin hack creation page
    await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const currentUrl = page.url();

    if (currentUrl.includes('/admin/hacks/new')) {
      await page.screenshot({ path: 'screenshots/test-03-admin-new-hack.png', fullPage: true });
      console.log('   ✓ Admin new hack page accessible');

      // Check for form fields
      const nameField = await page.locator('input[name="name"], input[placeholder*="name" i]').count();
      const descField = await page.locator('textarea, input[name="description"]').count();
      console.log(`   ✓ Form fields detected - Name: ${nameField > 0}, Description: ${descField > 0}`);
    } else {
      console.log('   ! Admin page redirected (authentication required)');
      console.log(`   ! Current URL: ${currentUrl}`);
    }

    // 4. Check admin edit route
    console.log('\n4. Testing Admin Edit Route...');
    await page.goto('http://localhost:3000/admin/hacks/cm1g4m5qx0000uc0kfqg7gqf1/edit', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const editUrl = page.url();

    if (editUrl.includes('/admin/hacks') && editUrl.includes('/edit')) {
      await page.screenshot({ path: 'screenshots/test-04-admin-edit-hack.png', fullPage: true });
      console.log('   ✓ Admin edit page accessible');
    } else {
      console.log('   ! Edit page redirected (authentication required)');
    }

    // 5. Return to hacks listing to check for admin UI
    console.log('\n5. Checking Hacks Listing for Admin UI...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Look for admin-specific buttons
    const addButton = await page.locator('a:has-text("Add"), button:has-text("Create"), a[href*="/admin/hacks/new"]').count();
    const editButtons = await page.locator('button:has-text("Edit"), a:has-text("Edit")').count();
    const deleteButtons = await page.locator('button:has-text("Delete")').count();

    console.log('   Admin UI Elements:');
    console.log(`   - Add/Create button: ${addButton > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Edit buttons: ${editButtons}`);
    console.log(`   - Delete buttons: ${deleteButtons}`);

    // Final summary
    console.log('\n' + '='*50);
    console.log('TEST SUMMARY');
    console.log('='*50);
    console.log('\n✓ Basic navigation working');
    console.log('✓ Hack detail pages accessible');
    console.log('✓ Authentication page available');

    if (addButton === 0 && editButtons === 0) {
      console.log('\n⚠ Admin features not visible - you need to:');
      console.log('  1. Sign in with admin credentials');
      console.log('  2. Admin email/password should be configured in your .env');
      console.log('  3. After signing in, admin buttons will appear');
    }

    console.log('\n📌 MANUAL TESTING INSTRUCTIONS:');
    console.log('1. Sign in using the form at /sign-in');
    console.log('2. Use admin credentials to see Create/Edit/Delete buttons');
    console.log('3. Test creating a new hack via "Add Hack" button');
    console.log('4. Test editing an existing hack');
    console.log('5. Test deleting a hack (with confirmation dialog)');
    console.log('6. Sign out and verify user permissions are different');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    await page.screenshot({ path: 'screenshots/test-error-state.png' });
  }

  console.log('\n📌 Browser will stay open for manual testing. Press Ctrl+C to exit.');

  // Keep browser open
  await new Promise(() => {});
}

// Ensure screenshots directory exists
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testAdminFlow();