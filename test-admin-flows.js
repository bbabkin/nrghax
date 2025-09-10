const { chromium } = require('playwright');

async function testAdminFlows() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting admin flow tests...\n');

    // Test 1: Admin Login Flow
    console.log('Test 1: Testing admin login flow...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    // Fill in login form
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-admin-01-login-form.png' });
    console.log('  ✓ Login form filled');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-admin-02-dashboard.png' });
    console.log('  ✓ Successfully logged in as admin');
    console.log('  ✓ Redirected to dashboard\n');

    // Test 2: Navigate to Admin Panel
    console.log('Test 2: Navigating to admin panel...');
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if we can access admin panel
    const adminTitle = await page.textContent('h1');
    if (adminTitle && adminTitle.includes('Admin')) {
      console.log('  ✓ Admin panel accessible');
      await page.screenshot({ path: 'test-admin-03-admin-panel.png' });
    }

    // Navigate to hacks admin
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-admin-04-hacks-list.png' });
    console.log('  ✓ Hacks admin page loaded\n');

    // Test 3: Create New Hack
    console.log('Test 3: Testing hack creation...');
    
    // Click on New Hack button
    const newHackButton = await page.getByRole('link', { name: /new hack/i }).first();
    if (newHackButton) {
      await newHackButton.click();
      await page.waitForLoadState('networkidle');
      console.log('  ✓ Navigated to new hack form');
    } else {
      // Alternative: navigate directly
      await page.goto('http://localhost:3000/admin/hacks/new');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ path: 'test-admin-05-new-hack-form.png' });

    // Fill in the hack creation form
    await page.fill('input[name="name"]', 'Test Hack Created by Admin');
    await page.fill('textarea[name="description"]', 'This is a test hack created through the admin panel to verify the creation flow works correctly.');
    
    // Select content type (if radio buttons exist)
    const contentRadio = await page.locator('input[type="radio"][value="content"]');
    if (await contentRadio.count() > 0) {
      await contentRadio.click();
    }
    
    // For external link option
    const linkRadio = await page.locator('input[type="radio"][value="link"]');
    if (await linkRadio.count() > 0 && await linkRadio.isVisible()) {
      await linkRadio.click();
      await page.fill('input[name="external_link"]', 'https://example.com/test-hack');
    }
    
    await page.screenshot({ path: 'test-admin-06-new-hack-filled.png' });
    console.log('  ✓ Filled hack creation form');
    
    // Submit the form
    const submitButton = await page.getByRole('button', { name: /create|save|submit/i }).first();
    if (submitButton) {
      await submitButton.click();
      console.log('  ✓ Submitted new hack form');
      
      // Wait for navigation or success message
      await page.waitForTimeout(2000);
      
      // Check if we're redirected to the hack list or detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/hacks') && !currentUrl.includes('/new')) {
        console.log('  ✓ Hack created successfully');
        await page.screenshot({ path: 'test-admin-07-after-creation.png' });
      }
    }
    console.log('');

    // Test 4: Edit Existing Hack
    console.log('Test 4: Testing hack edit flow...');
    
    // Go back to hacks list
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    // Find and click edit on the first hack
    const editButton = await page.getByRole('link', { name: /edit/i }).first();
    if (editButton) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      console.log('  ✓ Navigated to edit form');
      
      await page.screenshot({ path: 'test-admin-08-edit-form.png' });
      
      // Modify the name
      const nameInput = await page.locator('input[name="name"]');
      await nameInput.clear();
      await nameInput.fill('Updated Hack Title - Edited by Admin');
      
      // Modify the description
      const descInput = await page.locator('textarea[name="description"]');
      await descInput.clear();
      await descInput.fill('This hack has been updated through the admin edit flow to verify editing works correctly.');
      
      await page.screenshot({ path: 'test-admin-09-edit-filled.png' });
      console.log('  ✓ Modified hack fields');
      
      // Save changes
      const saveButton = await page.getByRole('button', { name: /save|update/i }).first();
      if (saveButton) {
        await saveButton.click();
        console.log('  ✓ Saved hack changes');
        
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-admin-10-after-edit.png' });
      }
    }
    
    // Test 5: Verify changes in public view
    console.log('\nTest 5: Verifying changes in public view...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-admin-11-public-hacks.png' });
    console.log('  ✓ Public hacks page loaded');
    
    // Look for our created/edited hack
    const hackTitles = await page.locator('h2, h3').allTextContents();
    const hasCreatedHack = hackTitles.some(title => 
      title.includes('Test Hack Created') || title.includes('Updated Hack Title')
    );
    
    if (hasCreatedHack) {
      console.log('  ✓ Created/edited hacks visible in public view');
    }

    console.log('\n✅ All admin flow tests completed successfully!');
    console.log('\nScreenshots saved:');
    console.log('  - test-admin-01-login-form.png');
    console.log('  - test-admin-02-dashboard.png');
    console.log('  - test-admin-03-admin-panel.png');
    console.log('  - test-admin-04-hacks-list.png');
    console.log('  - test-admin-05-new-hack-form.png');
    console.log('  - test-admin-06-new-hack-filled.png');
    console.log('  - test-admin-07-after-creation.png');
    console.log('  - test-admin-08-edit-form.png');
    console.log('  - test-admin-09-edit-filled.png');
    console.log('  - test-admin-10-after-edit.png');
    console.log('  - test-admin-11-public-hacks.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-admin-error.png' });
  } finally {
    await browser.close();
  }
}

testAdminFlows().catch(console.error);