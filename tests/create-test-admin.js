const puppeteer = require('puppeteer');

async function createTestAdmin() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const testEmail = 'admin@test.com';
  const testPassword = 'Admin123!'; // Meets all requirements

  try {
    console.log('\n1. Navigating to auth page...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Click Sign Up tab
    console.log('2. Switching to Sign Up tab...');
    const signUpTabs = await page.$$('button[role="tab"]');
    for (const tab of signUpTabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Sign Up')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 500));

    // Fill signup form
    console.log('3. Creating admin user...');
    await page.type('#signup-name', 'Test Admin');
    await page.type('#signup-email', testEmail);
    await page.type('#signup-password', testPassword);

    // Submit form
    const submitBtns = await page.$$('button[type="submit"]');
    for (const btn of submitBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Sign Up')) {
        await btn.click();
        break;
      }
    }

    // Wait for response
    await new Promise(r => setTimeout(r, 3000));

    // Check if we need to sign in
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      console.log('4. Signing in...');
      const signInTabs = await page.$$('button[role="tab"]');
      for (const tab of signInTabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text && text.includes('Sign In')) {
          await tab.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 500));

      // Clear fields first
      await page.evaluate(() => {
        document.querySelector('#signin-email').value = '';
        document.querySelector('#signin-password').value = '';
      });

      await page.type('#signin-email', testEmail);
      await page.type('#signin-password', testPassword);

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

    // Navigate to hacks page to verify login
    console.log('5. Checking login status...');
    await page.goto('http://localhost:3000/hacks');
    await page.waitForSelector('h1', { timeout: 10000 });

    await page.screenshot({ path: 'screenshots/test-admin-logged-in.png', fullPage: true });

    // Check debug info
    const serverDebug = await page.$('.text-xs.text-gray-500');
    if (serverDebug) {
      const serverText = await page.evaluate(el => el.textContent, serverDebug);
      console.log('Server status:', serverText);
    }

    const clientDebug = await page.$('.fixed.bottom-20.left-4');
    if (clientDebug) {
      const clientText = await page.evaluate(el => el.textContent, clientDebug);
      console.log('Client status:', clientText);
    }

    console.log('\n✅ Created test user:', testEmail);
    console.log('Password:', testPassword);
    console.log('\nNow run: node tests/make-user-admin.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/error-creating-admin.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

createTestAdmin().catch(console.error);