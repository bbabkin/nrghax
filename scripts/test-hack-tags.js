const { chromium } = require('playwright');

async function testHackTags() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing hack tag management...\n');

    // Login
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in\n');

    // Create some tags first
    console.log('2. Creating tags...');
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    
    const tagNames = ['Beginner', 'Advanced', 'Web Security', 'Cryptography'];
    
    for (const tagName of tagNames) {
      try {
        const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
        if (await createButton.count() > 0) {
          await createButton.click();
          await page.waitForTimeout(500);
          
          const nameInput = await page.locator('input[name="name"], input[placeholder*="name"]').first();
          if (await nameInput.count() > 0) {
            await nameInput.fill(tagName);
            
            const submitButton = await page.locator('button[type="submit"]').first();
            await submitButton.click();
            await page.waitForTimeout(1000);
            console.log(`   ✓ Created tag: ${tagName}`);
          }
        }
      } catch (e) {
        console.log(`   ⚠ Could not create tag: ${tagName}`);
      }
    }
    console.log('');

    // Navigate to hack edit page
    console.log('3. Opening hack edit form...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    // Click edit on first hack
    const editButton = await page.locator('a:has-text("Edit"), button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      const editUrl = await editButton.getAttribute('href');
      await editButton.click();
      
      // Wait for navigation to edit page
      await page.waitForURL('**/edit', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      console.log(`   ✓ Opened edit form\n`);
      
      // Check for tag selector
      console.log('4. Checking tag selector...');
      await page.screenshot({ path: 'hack-tags-01-edit-form.png' });
      
      // Scroll down to see if tags section is below
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'hack-tags-02-scrolled.png' });
      
      const tagSection = await page.locator('text=/tag/i').first();
      if (await tagSection.count() > 0) {
        console.log('   ✓ Tag section found');
        
        // Try to select some tags using force click
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        console.log(`   ✓ Found ${checkboxes.length} tag checkboxes`);
        
        if (checkboxes.length > 0) {
          // Force click first two checkboxes
          for (let i = 0; i < Math.min(2, checkboxes.length); i++) {
            await checkboxes[i].click({ force: true });
            console.log(`   ✓ Selected tag ${i + 1}`);
            await page.waitForTimeout(200);
          }
          
          await page.screenshot({ path: 'hack-tags-02-tags-selected.png' });
          
          // Save the form
          console.log('\n5. Saving hack with tags...');
          const saveButton = await page.locator('button:has-text("Update"), button:has-text("Save")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            console.log('   ✓ Form submitted');
            
            // Wait for redirect or success
            await page.waitForTimeout(3000);
            
            const currentUrl = page.url();
            if (currentUrl.includes('/admin/hacks') && !currentUrl.includes('/edit')) {
              console.log('   ✓ Hack updated with tags');
              await page.screenshot({ path: 'hack-tags-03-after-save.png' });
            }
          }
        }
      } else {
        console.log('   ⚠ Tag section not found in edit form');
      }
    } else {
      // Create a new hack instead
      console.log('   No existing hacks, creating new one...');
      await page.goto('http://localhost:3000/admin/hacks/new');
      await page.waitForLoadState('networkidle');
      
      // Fill basic fields
      await page.fill('input[name="name"]', 'Test Hack with Tags');
      await page.fill('textarea[name="description"]', 'Testing tag functionality');
      
      // Check for tag selector
      const tagSection = await page.locator('text=/tag/i').first();
      if (await tagSection.count() > 0) {
        console.log('   ✓ Tag section found in new hack form');
        
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        if (checkboxes.length > 0) {
          await checkboxes[0].check();
          console.log('   ✓ Selected tags');
        }
      }
      
      await page.screenshot({ path: 'hack-tags-new-form.png' });
    }

    console.log('\n✅ Hack tag management test completed!');
    console.log('\nScreenshots saved:');
    console.log('  - hack-tags-*.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'hack-tags-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testHackTags().catch(console.error);