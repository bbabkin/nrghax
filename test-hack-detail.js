const { chromium } = require('playwright');

async function testHackDetail() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Testing hack detail view specifically...\n');

    // 1. Login as admin
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
    console.log('   ✓ Logged in');

    // 2. Navigate directly to a hack detail page
    console.log('\n2. Navigating to hack detail page...');
    await page.goto('http://localhost:3000/hacks/a1111111-1111-1111-1111-111111111111');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    await page.screenshot({ path: 'hack-detail-view.png', fullPage: true });
    
    // Check page content
    const title = await page.textContent('h1');
    console.log('   Page title:', title);
    
    // Check for hack content
    const hasContent = await page.locator('.prose, [class*="content"], [dangerouslySetInnerHTML]').count();
    console.log('   Content sections found:', hasContent);
    
    // Check for like button
    const likeButton = await page.locator('button:has-text("Like"), button:has(svg)').count();
    console.log('   Like buttons found:', likeButton);
    
    // Check for completion status
    const completed = await page.locator('text=/complete/i').count();
    console.log('   Completion indicators:', completed);

    // Test completed
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testHackDetail();
