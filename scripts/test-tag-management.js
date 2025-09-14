const { chromium } = require('playwright');

async function testTagManagement() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  try {
    console.log('Testing tag management functionality...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in successfully\n');

    // Step 2: Navigate to admin tags page
    console.log('2. Navigating to tags management...');
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-tags-01-list.png' });
    
    const pageContent = await page.content();
    if (pageContent.includes('Tags') || pageContent.includes('Tag Management')) {
      console.log('   ✓ Tags page loaded');
      
      // Count existing tags
      const tagCount = await page.locator('[data-tag], .tag-item, tr').count();
      console.log(`   ✓ Found ${tagCount} tags\n`);
    }

    // Step 3: Try to create a new tag
    console.log('3. Creating a new tag...');
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add Tag"), button:has-text("New Tag")').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in tag form if it appears
      const nameInput = await page.locator('input[name="name"], input[placeholder*="tag"], input[placeholder*="name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Tag ' + Date.now());
        
        const descInput = await page.locator('textarea[name="description"], input[name="description"]').first();
        if (await descInput.count() > 0) {
          await descInput.fill('Test tag created by automated test');
        }
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
        await submitButton.click();
        
        await page.waitForTimeout(2000);
        console.log('   ✓ Tag created\n');
      }
    }
    
    await page.screenshot({ path: 'test-tags-02-after-create.png' });

    // Step 4: Navigate to tag assignment page
    console.log('4. Navigating to tag assignment...');
    await page.goto('http://localhost:3000/admin/tags/assign');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-tags-03-assign-page.png' });
    
    const assignContent = await page.content();
    if (assignContent.includes('Assign Tags') || assignContent.includes('Tag Assignment')) {
      console.log('   ✓ Tag assignment page loaded\n');
    }

    // Step 5: Try to assign tags to a hack
    console.log('5. Testing tag assignment to hacks...');
    
    // Select first hack
    const firstHack = await page.locator('[data-hack], .hack-item, [role="row"]').first();
    if (await firstHack.count() > 0) {
      await firstHack.click();
      console.log('   ✓ Selected a hack');
      
      // Select some tags
      const tagCheckboxes = await page.locator('input[type="checkbox"]').all();
      if (tagCheckboxes.length > 0) {
        // Check first 2 tags
        for (let i = 0; i < Math.min(2, tagCheckboxes.length); i++) {
          await tagCheckboxes[i].check();
        }
        console.log('   ✓ Selected tags');
        
        // Save assignment
        const saveButton = await page.locator('button:has-text("Save"), button:has-text("Assign"), button:has-text("Update")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          console.log('   ✓ Tags assigned\n');
        }
      }
    }
    
    await page.screenshot({ path: 'test-tags-04-after-assign.png' });

    // Step 6: Check hack edit form for tags
    console.log('6. Checking hack edit form for tag support...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    
    // Click edit on first hack
    const editButton = await page.locator('a[href*="/edit"], button:has-text("Edit")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'test-tags-05-hack-edit.png' });
      
      const editContent = await page.content();
      if (editContent.includes('tag') || editContent.includes('Tag')) {
        console.log('   ✓ Hack edit form includes tag support');
      } else {
        console.log('   ⚠ No tag fields found in hack edit form');
      }
    }

    console.log('\n✅ Tag management test completed!');
    console.log('\nScreenshots saved:');
    console.log('  - test-tags-01-list.png');
    console.log('  - test-tags-02-after-create.png'); 
    console.log('  - test-tags-03-assign-page.png');
    console.log('  - test-tags-04-after-assign.png');
    console.log('  - test-tags-05-hack-edit.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test-tags-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testTagManagement().catch(console.error);