const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Testing login after Supabase restart...\n');

    await page.goto('http://localhost:3000/auth');
    await page.waitForTimeout(1000);

    // Try to login
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');

    console.log('Submitting login form...');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Check for error or success
    const url = page.url();
    console.log('Current URL:', url);

    // Take screenshot
    await page.screenshot({ path: 'test-login-result.png' });

    // Check for error message
    const errorElement = await page.locator('text=error').first();
    if (await errorElement.count() > 0) {
      const errorText = await errorElement.textContent();
      console.log('❌ Login failed with error:', errorText);
    } else if (url.includes('dashboard') || url.includes('onboarding')) {
      console.log('✅ Login successful!');
    } else {
      console.log('⚠️  Login status unclear, check screenshot');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();