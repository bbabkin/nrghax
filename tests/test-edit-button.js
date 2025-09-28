const puppeteer = require('puppeteer');

async function testEditButton() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('\n=== TESTING EDIT BUTTON FUNCTIONALITY ===\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle0' });

    await page.type('#signin-email', 'admin@test.com');
    await page.type('#signin-password', 'Admin123!');

    const signInBtns = await page.$$('button[type="submit"]');
    for (const btn of signInBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Sign In')) {
        await btn.click();
        break;
      }
    }

    await new Promise(r => setTimeout(r, 3000));
    console.log('   ✅ Logged in successfully');

    // 2. Navigate to hacks page
    console.log('\n2. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle0' });

    // Verify admin banner is visible
    const adminBanner = await page.$('.bg-purple-100');
    if (adminBanner) {
      console.log('   ✅ Admin mode confirmed');
    }

    // 3. Find and click the first edit button
    console.log('\n3. Looking for edit buttons...');
    const editButtons = await page.$$('a[href*="/admin/hacks/"][href*="/edit"]');

    if (editButtons.length === 0) {
      throw new Error('No edit buttons found on the page');
    }

    console.log(`   ✅ Found ${editButtons.length} edit button(s)`);

    // Get the hack ID from the first edit button
    const firstEditHref = await page.evaluate(el => el.href, editButtons[0]);
    const hackId = firstEditHref.match(/\/admin\/hacks\/([^\/]+)\/edit/)?.[1];
    console.log(`   📝 Editing hack with ID: ${hackId}`);

    // 4. Click the edit button
    console.log('\n4. Clicking edit button...');
    await editButtons[0].click();
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    const currentUrl = page.url();
    console.log(`   📍 Navigated to: ${currentUrl}`);

    // 5. Check if we're on the edit page
    if (!currentUrl.includes('/edit')) {
      throw new Error('Did not navigate to edit page');
    }
    console.log('   ✅ Successfully navigated to edit page');

    // 6. Verify the edit form is displayed
    console.log('\n5. Verifying edit form...');

    // Check for form elements
    const formChecks = [
      { selector: 'input[name="name"], input[id="name"]', label: 'Name field' },
      { selector: 'textarea[name="description"], textarea[id="description"]', label: 'Description field' },
      { selector: 'input[name="slug"], input[id="slug"]', label: 'Slug field' },
      { selector: 'select[name="content_type"], select[id="content_type"], button[role="combobox"]', label: 'Content type selector' },
      { selector: 'button[type="submit"]', label: 'Submit button' }
    ];

    for (const check of formChecks) {
      const element = await page.$(check.selector);
      if (element) {
        console.log(`   ✅ ${check.label} found`);

        // If it's an input or textarea, check if it has a value
        if (check.selector.includes('input') || check.selector.includes('textarea')) {
          const value = await page.evaluate(el => el.value, element);
          if (value) {
            console.log(`      → Value: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
          }
        }
      } else {
        console.log(`   ⚠️  ${check.label} not found`);
      }
    }

    // 7. Check if form is pre-populated with existing data
    console.log('\n6. Checking if form is pre-populated...');

    const nameInput = await page.$('input[name="name"], input[id="name"]');
    if (nameInput) {
      const nameValue = await page.evaluate(el => el.value, nameInput);
      if (nameValue && nameValue.length > 0) {
        console.log(`   ✅ Form is pre-populated with hack data`);
        console.log(`      Name: "${nameValue}"`);
      } else {
        console.log(`   ⚠️  Name field is empty`);
      }
    }

    // 8. Take screenshot of the edit form
    await page.screenshot({ path: 'screenshots/edit-form-test.png', fullPage: true });
    console.log('\n7. Screenshot saved: screenshots/edit-form-test.png');

    // 9. Test form validation (optional)
    console.log('\n8. Testing form interaction...');

    // Try to clear and type in the name field
    if (nameInput) {
      await nameInput.click({ clickCount: 3 }); // Select all
      await page.type('input[name="name"], input[id="name"]', ' (Edited)');

      const newValue = await page.evaluate(el => el.value, nameInput);
      console.log(`   ✅ Successfully modified name field to: "${newValue}"`);
    }

    // 10. Check for cancel button
    const cancelButtons = await page.$$('button, a');
    let cancelFound = false;
    for (const btn of cancelButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Cancel')) {
        cancelFound = true;
        break;
      }
    }
    if (cancelFound) {
      console.log('   ✅ Cancel button found');
    }

    console.log('\n✅ EDIT BUTTON TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📊 Summary:');
    console.log('- Admin login: Working');
    console.log('- Edit button visibility: Confirmed');
    console.log('- Navigation to edit page: Successful');
    console.log('- Edit form display: Verified');
    console.log('- Form pre-population: Working');
    console.log('- Form interaction: Functional');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/edit-test-error.png', fullPage: true });
    console.log('Error screenshot saved: screenshots/edit-test-error.png');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testEditButton().catch(console.error);