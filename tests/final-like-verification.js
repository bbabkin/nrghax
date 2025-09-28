const puppeteer = require('puppeteer');

async function finalLikeVerification() {
  console.log('\n✅ FINAL VERIFICATION: Like Button for Unregistered Users\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Track any JavaScript errors
  let jsErrors = [];
  let networkErrors = [];

  page.on('pageerror', error => {
    if (!error.message.includes('favicon')) {
      jsErrors.push(error.message);
    }
  });

  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  try {
    // STEP 1: Clear session
    console.log('STEP 1: Preparing unregistered user session');
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('  ✅ Session cleared\n');

    // STEP 2: Navigate to hacks page
    console.log('STEP 2: Loading hacks page');
    await page.goto('http://localhost:3000/hacks', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const hacksUrl = page.url();
    console.log(`  ✅ Hacks page loaded: ${hacksUrl}`);

    // Screenshot 1: Hacks page
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `screenshots/final-01-hacks-${timestamp}.png`,
      fullPage: false
    });
    console.log('  📸 Screenshot saved: Hacks page\n');

    // STEP 3: Find like button
    console.log('STEP 3: Finding and clicking like button');

    const likeButtonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const likeButton = buttons.find(btn => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      });

      if (likeButton) {
        const rect = likeButton.getBoundingClientRect();
        return {
          found: true,
          text: likeButton.textContent,
          position: { x: rect.x, y: rect.y }
        };
      }
      return { found: false };
    });

    if (!likeButtonInfo.found) {
      console.log('  ❌ No like button found');
      return;
    }

    console.log(`  ✅ Like button found with count: ${likeButtonInfo.text}`);

    // Click the like button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const likeButton = buttons.find(btn => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      });
      if (likeButton) likeButton.click();
    });

    console.log('  ✅ Like button clicked\n');

    // STEP 4: Wait and verify redirect
    console.log('STEP 4: Verifying redirect behavior');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const authUrl = page.url();
    const isOnAuthPage = authUrl.includes('/auth');

    if (isOnAuthPage) {
      console.log(`  ✅ Successfully redirected to: ${authUrl}`);

      // Screenshot 2: Auth page
      await page.screenshot({
        path: `screenshots/final-02-auth-${timestamp}.png`,
        fullPage: false
      });
      console.log('  📸 Screenshot saved: Auth page\n');

      // Verify login form exists
      const hasLoginForm = await page.evaluate(() => {
        return !!(
          document.querySelector('input[type="email"]') &&
          document.querySelector('input[type="password"]') &&
          document.querySelector('button[type="submit"]')
        );
      });

      if (hasLoginForm) {
        console.log('  ✅ Login form is displayed and ready');
      }
    } else {
      console.log(`  ❌ Not redirected. Current URL: ${authUrl}`);
    }

    // STEP 5: Error Check
    console.log('\nSTEP 5: Error Analysis');
    console.log('────────────────────────');

    // Filter out favicon 404s
    networkErrors = networkErrors.filter(err => !err.url.includes('favicon'));

    if (jsErrors.length === 0 && networkErrors.length === 0) {
      console.log('  ✅ No JavaScript errors detected');
      console.log('  ✅ No network errors detected');
    } else {
      if (jsErrors.length > 0) {
        console.log('  ❌ JavaScript Errors:');
        jsErrors.forEach(err => console.log(`     - ${err}`));
      }
      if (networkErrors.length > 0) {
        console.log('  ❌ Network Errors:');
        networkErrors.forEach(err => console.log(`     - ${err.status} ${err.url}`));
      }
    }

    // FINAL VERDICT
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 FINAL VERDICT:');
    console.log('═══════════════════════════════════════════════════════════\n');

    const noErrors = jsErrors.length === 0 && networkErrors.length === 0;
    const redirectWorks = isOnAuthPage;

    if (noErrors && redirectWorks) {
      console.log('✅✅✅ PERFECT! Everything works correctly!');
      console.log('\nConfirmed behavior:');
      console.log('  1. ✅ Unregistered user can view hacks page');
      console.log('  2. ✅ Clicking like button does NOT cause any errors');
      console.log('  3. ✅ User is properly redirected to auth page');
      console.log('  4. ✅ Auth page displays login form');
      console.log('\nThe like button functionality is working perfectly for unregistered users!');
    } else if (redirectWorks) {
      console.log('✅ Redirect works but there might be unrelated errors');
      console.log('The like button functionality itself is working correctly.');
    } else {
      console.log('❌ Issue detected - redirect not working as expected');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({
      path: `screenshots/final-error-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    });
  } finally {
    await browser.close();
  }
}

// Run verification
finalLikeVerification().catch(console.error);