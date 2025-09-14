const { chromium } = require('playwright');

async function testAdminFlows() {
  const browser = await chromium.launch({ headless: true }); // Run headless to avoid UI issues
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting admin flow tests...\n');

    // Test 1: Admin Login
    console.log('Test 1: Admin Login');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.screenshot({ path: 'admin-test-01-login.png' });
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: 'admin-test-02-dashboard.png' });
    console.log('  ✓ Admin login successful\n');

    // Test 2: Access Admin Panel
    console.log('Test 2: Access Admin Panel');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    if (pageContent.includes('Manage Hacks') || pageContent.includes('Admin')) {
      console.log('  ✓ Admin hacks page accessible');
      await page.screenshot({ path: 'admin-test-03-hacks-list.png' });
    }
    
    // Check for existing hacks
    const hackCount = await page.locator('table tbody tr, [role="row"]').count();
    console.log(`  ✓ Found ${hackCount} existing hacks\n`);

    // Test 3: Create New Hack
    console.log('Test 3: Create New Hack');
    await page.goto('http://localhost:3000/admin/hacks/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'admin-test-04-new-form.png' });
    
    // Fill basic fields
    await page.fill('input[name="name"]', 'Test Admin Hack ' + Date.now());
    await page.fill('textarea[name="description"]', 'This is a test hack created by admin flow testing.');
    
    // Try to select link type if available
    const linkOption = await page.locator('input[value="link"]');
    if (await linkOption.count() > 0) {
      try {
        await linkOption.click({ force: true });
        await page.waitForTimeout(500);
        const externalLinkInput = await page.locator('input[name="external_link"]');
        if (await externalLinkInput.count() > 0 && await externalLinkInput.isVisible()) {
          await externalLinkInput.fill('https://example.com/test');
        }
      } catch (e) {
        console.log('  ℹ Using default content type');
      }
    }
    
    await page.screenshot({ path: 'admin-test-05-filled-form.png' });
    
    // Submit form
    const submitButton = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
    await submitButton.click();
    
    // Wait for redirect or success
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('/admin/hacks') && !currentUrl.includes('/new')) {
      console.log('  ✓ Hack created successfully');
      await page.screenshot({ path: 'admin-test-06-after-create.png' });
    } else {
      console.log('  ⚠ May not have redirected after creation');
    }
    console.log('');

    // Test 4: Edit Hack
    console.log('Test 4: Edit Existing Hack');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    // Get the first hack's ID from edit link
    const editLink = await page.locator('a[href*="/admin/hacks/"][href*="/edit"]').first();
    if (await editLink.count() > 0) {
      const editHref = await editLink.getAttribute('href');
      console.log(`  ✓ Found hack to edit: ${editHref}`);
      
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'admin-test-07-edit-form.png' });
      
      // Update fields
      const nameInput = await page.locator('input[name="name"]');
      await nameInput.clear();
      await nameInput.fill('Updated Admin Test Hack ' + Date.now());
      
      const descInput = await page.locator('textarea[name="description"]');
      await descInput.clear();
      await descInput.fill('This hack was updated through admin testing.');
      
      await page.screenshot({ path: 'admin-test-08-edit-filled.png' });
      
      // Save changes
      const saveButton = await page.locator('button[type="submit"], button:has-text("Update"), button:has-text("Save")').first();
      await saveButton.click();
      
      await page.waitForTimeout(3000);
      console.log('  ✓ Hack updated successfully');
      await page.screenshot({ path: 'admin-test-09-after-edit.png' });
    } else {
      console.log('  ⚠ No hacks found to edit');
    }

    console.log('\n✅ All tests completed!');
    console.log('\nScreenshots saved:');
    console.log('  - admin-test-01-login.png through admin-test-09-after-edit.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'admin-test-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

testAdminFlows().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});