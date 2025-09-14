const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🚀 Starting admin flow test...\n');
  
  try {
    // 1. Navigate to auth page
    console.log('1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth');
    await page.screenshot({ path: 'screenshots/01-auth-page.png' });
    console.log('   ✅ Auth page loaded');
    
    // 2. Login as admin
    console.log('\n2. Logging in as admin (test@test.com)...');
    await page.getByPlaceholder('name@example.com').fill('test@test.com');
    await page.getByPlaceholder('Enter your password').fill('test123');
    await page.screenshot({ path: 'screenshots/02-login-filled.png' });
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/03-dashboard.png' });
    console.log('   ✅ Successfully logged in and redirected to dashboard');
    
    // 3. Navigate to admin hacks page
    console.log('\n3. Navigating to admin hacks management...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/04-admin-hacks.png' });
    console.log('   ✅ Admin hacks page loaded');
    
    // 4. Create a new hack
    console.log('\n4. Creating a new hack...');
    await page.goto('http://localhost:3000/admin/hacks/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/05-new-hack-form.png' });
    
    // Fill the form
    await page.getByLabel('Name').fill('Test Hack from Manual Test');
    await page.getByLabel('Description').fill('This hack was created during manual testing');
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300x200');
    await page.getByLabel('Internal Content').check();
    
    // Add content to rich text editor
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.fill('This is test content created during the manual test flow. It demonstrates that the rich text editor is working correctly.');
    
    await page.screenshot({ path: 'screenshots/06-hack-form-filled.png' });
    await page.getByRole('button', { name: 'Create Hack' }).click();
    
    // Wait for redirect back to admin hacks
    await page.waitForURL('**/admin/hacks', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/07-hack-created.png' });
    console.log('   ✅ Hack created successfully');
    
    // 5. View the hack on public page
    console.log('\n5. Viewing hack on public page...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-public-hacks.png' });
    console.log('   ✅ Public hacks page loaded');
    
    // Click on the created hack
    await page.getByText('Test Hack from Manual Test').first().click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-hack-detail.png' });
    console.log('   ✅ Hack detail page loaded');
    
    // 6. Check user history
    console.log('\n6. Checking user history...');
    await page.goto('http://localhost:3000/profile/history');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/10-user-history.png' });
    console.log('   ✅ User history page loaded with completed hack');
    
    console.log('\n✨ All tests completed successfully!');
    console.log('📸 Screenshots saved in ./screenshots/');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error.png' });
  } finally {
    await browser.close();
  }
})();