const { chromium } = require('playwright');

async function testTagToasts() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  try {
    console.log('Testing tag management with toast notifications...\n');

    // Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in\n');

    // Test 1: Create a tag and check for toast
    console.log('2. Testing tag creation with toast...');
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    
    // Fill in tag name
    const tagName = 'Toast Test ' + Date.now();
    await page.fill('input[placeholder*="Beginner"]', tagName);
    
    // Click create button and wait for toast
    await page.click('button:has-text("Create Tag")');
    
    // Wait for toast notification
    await page.waitForTimeout(1000);
    
    // Check for toast element
    const toastElement = await page.locator('[role="alert"], [data-toast], .toast').first();
    if (await toastElement.count() > 0) {
      const toastText = await toastElement.textContent();
      console.log('   ✓ Toast notification appeared:', toastText);
      await page.screenshot({ path: 'tag-toast-01-create.png' });
    } else {
      console.log('   ⚠ No toast notification found');
    }
    
    // Test 2: Assign tags to a hack
    console.log('\n3. Testing tag assignment with toast...');
    await page.goto('http://localhost:3000/admin/tags/assign');
    await page.waitForLoadState('networkidle');
    
    // Select a hack
    const hackElement = await page.locator('.cursor-pointer').first();
    if (await hackElement.count() > 0) {
      await hackElement.click();
      console.log('   ✓ Selected a hack');
      
      // Select some tags
      const tagCheckboxes = await page.locator('input[type="checkbox"]').all();
      if (tagCheckboxes.length > 0) {
        await tagCheckboxes[0].click({ force: true });
        console.log('   ✓ Selected a tag');
        
        // Click save/assign button
        const saveButton = await page.locator('button:has-text("Assign"), button:has-text("Save")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          console.log('   ✓ Clicked save button');
          
          // Wait for toast
          await page.waitForTimeout(1500);
          
          // Check for toast
          const assignToast = await page.locator('[role="alert"], [data-toast], .toast').first();
          if (await assignToast.count() > 0) {
            const toastText = await assignToast.textContent();
            console.log('   ✓ Toast notification appeared:', toastText);
            await page.screenshot({ path: 'tag-toast-02-assign.png' });
          } else {
            console.log('   ⚠ No toast notification found');
          }
        }
      }
    }
    
    // Test 3: Try to create duplicate tag (should show error toast)
    console.log('\n4. Testing error toast for duplicate tag...');
    await page.goto('http://localhost:3000/admin/tags');
    await page.waitForLoadState('networkidle');
    
    // Try to create a tag that already exists
    await page.fill('input[placeholder*="Beginner"]', 'Beginner');
    await page.click('button:has-text("Create Tag")');
    
    await page.waitForTimeout(1000);
    
    // Check for error toast
    const errorToast = await page.locator('[role="alert"], [data-toast], .toast').first();
    if (await errorToast.count() > 0) {
      const toastText = await errorToast.textContent();
      if (toastText.toLowerCase().includes('error') || toastText.toLowerCase().includes('exists')) {
        console.log('   ✓ Error toast appeared:', toastText);
        await page.screenshot({ path: 'tag-toast-03-error.png' });
      }
    }

    console.log('\n✅ Toast notification test completed!');
    
    // Log any console errors
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log('\n⚠ Console errors detected:');
      errors.forEach(e => console.log('  -', e.text));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'tag-toast-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testTagToasts().catch(console.error);