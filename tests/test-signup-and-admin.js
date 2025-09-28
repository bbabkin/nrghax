const puppeteer = require('puppeteer');

async function testSignupAndAdmin() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const timestamp = Date.now();
  const testEmail = `admin-test-${timestamp}@example.com`;

  try {
    console.log('\n1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Click Sign Up tab
    console.log('2. Clicking Sign Up tab...');
    const signUpTab = await page.$$('button[role="tab"]');
    for (const tab of signUpTab) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Sign Up')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Fill signup form
    console.log('3. Filling signup form...');
    await page.type('#signup-name', 'Test Admin');
    await page.type('#signup-email', testEmail);
    await page.type('#signup-password', 'password123456');

    // Take screenshot before signup
    await page.screenshot({ path: 'screenshots/signup-form-filled.png', fullPage: true });

    // Submit form
    console.log('4. Submitting signup form...');
    const submitBtns = await page.$$('button[type="submit"]');
    for (const btn of submitBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Sign Up')) {
        await btn.click();
        break;
      }
    }

    // Wait for either success message or navigation
    await new Promise(r => setTimeout(r, 3000));

    // Take screenshot after signup
    await page.screenshot({ path: 'screenshots/signup-result.png', fullPage: true });

    // Check current URL
    const currentUrl = page.url();
    console.log('5. Current URL after signup:', currentUrl);

    // Now sign in with the new user
    if (currentUrl.includes('/auth')) {
      console.log('\n6. Signing in with the new user...');
      const signInTabs = await page.$$('button[role="tab"]');
      for (const tab of signInTabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text && text.includes('Sign In')) {
          await tab.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 500));

      await page.type('#signin-email', testEmail);
      await page.type('#signin-password', 'password123456');

      const signInBtns = await page.$$('button[type="submit"]');
      for (const btn of signInBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Sign In')) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 3000));
    }

    // Check if we're logged in by going to hacks page
    console.log('\n7. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForSelector('h1', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'screenshots/hacks-page-logged-in.png', fullPage: true });

    // Check server debug info
    const serverDebug = await page.$('.text-xs.text-gray-500');
    if (serverDebug) {
      const serverText = await page.evaluate(el => el.textContent, serverDebug);
      console.log('8. Server user info:', serverText);
    }

    // Check client debug info
    const clientDebug = await page.$('.fixed.bottom-20.left-4');
    if (clientDebug) {
      const clientText = await page.evaluate(el => el.textContent, clientDebug);
      console.log('9. Client user info:', clientText);
    }

    console.log('\n✅ Test completed - Created user:', testEmail);
    console.log('Note: To make this user admin, update the database directly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testSignupAndAdmin().catch(console.error);