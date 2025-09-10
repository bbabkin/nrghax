const { chromium } = require('playwright');

async function testHackDetail() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Testing hack detail view...\n');

    // Login
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to hack detail
    await page.goto('http://localhost:3000/hacks/a1111111-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    await page.screenshot({ path: 'hack-detail-fixed.png', fullPage: true });
    
    // Check for error
    const error = await page.locator('text=/Runtime Error|Error/i').count();
    if (error > 0) {
      console.log('❌ Page has errors');
    } else {
      console.log('✅ Page loaded without errors');
      
      // Check content
      const title = await page.locator('h1').first().textContent();
      console.log('Page title:', title);
      
      const hasContent = await page.locator('.prose').count();
      console.log('Content sections:', hasContent);
      
      // Check for like button
      const likeButton = await page.locator('button:has(svg)').first().count();
      console.log('Interactive buttons:', likeButton);
    }
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testHackDetail();
