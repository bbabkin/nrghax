const { chromium } = require('playwright');

async function testNavbarTags() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing Tags link in navbar...\n');

    // Login as admin
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in as admin\n');

    // Check navbar for Tags link
    console.log('2. Checking navbar for Tags link...');
    await page.waitForTimeout(1000);
    
    // Screenshot navbar
    await page.screenshot({ path: 'navbar-tags-01-navbar.png' });
    
    // Look for Tags link in navbar
    const tagsLink = await page.locator('nav a:has-text("Tags")').first();
    
    if (await tagsLink.count() > 0) {
      console.log('   ✓ Tags link found in navbar');
      
      // Click the Tags link
      console.log('\n3. Clicking Tags link...');
      await tagsLink.click();
      
      // Wait for navigation
      await page.waitForURL('**/admin/tags', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      
      console.log('   ✓ Navigated to Tags page');
      
      // Screenshot the tags page
      await page.screenshot({ path: 'navbar-tags-02-tags-page.png' });
      
      // Verify we're on the tags page
      const pageContent = await page.content();
      if (pageContent.includes('Tag Management') || pageContent.includes('Tags')) {
        console.log('   ✓ Tags page loaded successfully');
      }
      
      // Check if we can navigate back using navbar
      console.log('\n4. Testing navigation back to Manage Hacks...');
      const manageHacksLink = await page.locator('nav a:has-text("Manage Hacks")').first();
      
      if (await manageHacksLink.count() > 0) {
        await manageHacksLink.click();
        await page.waitForURL('**/admin/hacks', { timeout: 10000 });
        console.log('   ✓ Successfully navigated to Manage Hacks');
      }
      
    } else {
      console.log('   ❌ Tags link not found in navbar');
      
      // Check if it's in mobile menu
      console.log('\n   Checking mobile menu...');
      const menuButton = await page.locator('button[aria-label="Toggle menu"]');
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        const mobileTagsLink = await page.locator('a:has-text("Tags")').first();
        if (await mobileTagsLink.count() > 0) {
          console.log('   ✓ Tags link found in mobile menu');
        }
      }
    }

    console.log('\n✅ Navbar Tags test completed!');
    console.log('\nScreenshots saved:');
    console.log('  - navbar-tags-01-navbar.png');
    console.log('  - navbar-tags-02-tags-page.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'navbar-tags-error.png' });
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testNavbarTags().catch(console.error);