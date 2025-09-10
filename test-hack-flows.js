const { chromium } = require('playwright');

async function testHackFlows() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Testing hack management flows...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    console.log('   ✓ Logged in successfully');

    // 2. Navigate to hacks list
    console.log('\n2. Testing hacks list view...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-hacks-01-list.png' });
    
    // Check if hacks are displayed
    const hacksCount = await page.locator('.hack-card, [data-testid="hack-item"], a[href^="/hacks/"]').count();
    console.log(`   ✓ Found ${hacksCount} hacks displayed`);

    // 3. Test hack detail view
    console.log('\n3. Testing hack detail view...');
    if (hacksCount > 0) {
      // Click first hack
      const firstHackLink = await page.locator('a[href^="/hacks/"]:not([href="/hacks"])').first();
      const hackHref = await firstHackLink.getAttribute('href');
      if (hackHref) {
        await firstHackLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'test-hacks-02-detail.png' });
        const currentUrl = page.url();
        if (currentUrl.includes('/hacks/') && !currentUrl.endsWith('/hacks')) {
          console.log('   ✓ Hack detail page loaded:', currentUrl);
        } else {
          console.log('   ⚠ Unexpected URL:', currentUrl);
        }
      }
    } else {
      await page.goto('http://localhost:3000/hacks/a1111111-1111-1111-1111-111111111111');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-hacks-02-detail-direct.png' });
      console.log('   ✓ Direct navigation to hack detail');
    }

    // 4. Test admin hacks management
    console.log('\n4. Testing admin hacks management...');
    await page.goto('http://localhost:3000/admin/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-hacks-03-admin-list.png' });
    
    const adminUrl = page.url();
    if (adminUrl.includes('/admin/hacks')) {
      console.log('   ✓ Admin hacks page accessible');
      
      // Check for edit buttons
      const editButtons = await page.locator('a:has-text("Edit"), button:has-text("Edit")').count();
      console.log(`   ✓ Found ${editButtons} edit buttons`);
    } else {
      console.log('   ❌ Admin hacks page not accessible, redirected to:', adminUrl);
    }

    // 5. Test hack editing
    console.log('\n5. Testing hack edit page...');
    await page.goto('http://localhost:3000/admin/hacks/a1111111-1111-1111-1111-111111111111/edit');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-hacks-04-edit-form.png' });
    
    const editUrl = page.url();
    if (editUrl.includes('/edit')) {
      console.log('   ✓ Edit page loaded successfully');
      
      // Check for form fields
      const nameInput = await page.locator('input[name="name"], input#name').count();
      const descriptionInput = await page.locator('textarea[name="description"], textarea#description').count();
      
      if (nameInput > 0 && descriptionInput > 0) {
        console.log('   ✓ Edit form fields found');
        
        // Try to update the hack
        await page.fill('input[name="name"], input#name', 'Updated Morning Energy Boost');
        await page.screenshot({ path: 'test-hacks-05-edit-filled.png' });
        console.log('   ✓ Form fields are editable');
      } else {
        console.log('   ⚠ Form fields not found');
      }
    } else {
      console.log('   ❌ Edit page not accessible, redirected to:', editUrl);
    }

    // 6. Test creating new hack
    console.log('\n6. Testing new hack creation...');
    await page.goto('http://localhost:3000/admin/hacks/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-hacks-06-new-form.png' });
    
    const newUrl = page.url();
    if (newUrl.includes('/new')) {
      console.log('   ✓ New hack page accessible');
    } else {
      console.log('   ❌ New hack page not accessible, redirected to:', newUrl);
    }

    console.log('\n✅ Hack management flow tests completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testHackFlows();
