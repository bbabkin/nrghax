const puppeteer = require('puppeteer');

async function verifyLikeNoError() {
  console.log('\n🔍 Verifying Like Button - No Error Test\n');
  console.log('══════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });

  try {
    // Step 1: Clear session to ensure we're unregistered
    console.log('1. Ensuring clean browser session (unregistered user)...');
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 2: Navigate to hacks page
    console.log('\n2. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('   ✅ Hacks page loaded');
    console.log('   Current URL:', page.url());

    // Take screenshot of hacks page
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `screenshots/verify-01-hacks-page-${timestamp}.png`,
      fullPage: false
    });
    console.log('   📸 Screenshot: Hacks page before clicking');

    // Step 3: Find and hover over a hack card
    console.log('\n3. Finding hack cards with like buttons...');

    // Get all like buttons
    const likeButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => {
          const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
          const hasSvg = btn.innerHTML.includes('svg');
          const hasNumber = /\d+/.test(btn.textContent);
          return hasFlexClass && hasSvg && hasNumber;
        })
        .map((btn, index) => ({
          index,
          text: btn.textContent,
          className: btn.className
        }));
    });

    console.log(`   Found ${likeButtons.length} like buttons`);

    if (likeButtons.length === 0) {
      console.log('   ❌ No like buttons found');
      return;
    }

    // Step 4: Click the first like button
    console.log('\n4. Clicking the first like button...');
    console.log('   Button text:', likeButtons[0].text);

    // Click using evaluate to ensure we get the right button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const likeButton = buttons.find(btn => {
        const hasFlexClass = btn.className.includes('flex') && btn.className.includes('items-center');
        const hasSvg = btn.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(btn.textContent);
        return hasFlexClass && hasSvg && hasNumber;
      });
      if (likeButton) {
        likeButton.click();
      }
    });

    console.log('   ✅ Like button clicked');

    // Step 5: Wait for navigation/response
    console.log('\n5. Waiting for response...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newUrl = page.url();
    console.log('   New URL:', newUrl);

    // Take screenshot after clicking
    await page.screenshot({
      path: `screenshots/verify-02-after-click-${timestamp}.png`,
      fullPage: false
    });
    console.log('   📸 Screenshot: After clicking like button');

    // Step 6: Verify results
    console.log('\n6. VERIFICATION RESULTS:');
    console.log('════════════════════════');

    // Check for errors
    if (errors.length === 0) {
      console.log('✅ NO ERRORS DETECTED - The like button works without errors!');
    } else {
      console.log('❌ ERRORS FOUND:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    // Check redirect
    if (newUrl.includes('/auth')) {
      console.log('✅ REDIRECT SUCCESSFUL - User was redirected to auth page');

      // Verify auth page elements
      const hasLoginForm = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        const submitButton = document.querySelector('button[type="submit"]');
        return !!(emailInput && passwordInput && submitButton);
      });

      if (hasLoginForm) {
        console.log('✅ AUTH PAGE READY - Login form is displayed');
        await page.screenshot({
          path: `screenshots/verify-03-auth-page-${timestamp}.png`,
          fullPage: false
        });
        console.log('   📸 Screenshot: Auth page with login form');
      }
    } else {
      console.log('⚠️ NOT REDIRECTED - Still on:', newUrl);

      // Check for any error messages on the page
      const pageContent = await page.evaluate(() => document.body.textContent);
      if (pageContent.includes('error') || pageContent.includes('Error')) {
        console.log('⚠️ Error text found on page');
      }
      if (pageContent.includes('Authentication required')) {
        console.log('⚠️ Authentication message found (might be a toast)');
      }
    }

    // Final summary
    console.log('\n════════════════════════════════════════════');
    console.log('FINAL RESULT:');
    if (errors.length === 0 && newUrl.includes('/auth')) {
      console.log('✅✅✅ PERFECT! No errors and proper redirect to auth page.');
      console.log('The like button functionality is working correctly for unregistered users.');
    } else if (errors.length === 0) {
      console.log('✅ No errors occurred, but redirect might not be working');
    } else {
      console.log('❌ Errors were detected - like button may have issues');
    }
    console.log('════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({
      path: `screenshots/verify-error-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    });
  } finally {
    await browser.close();
  }
}

// Run the verification
verifyLikeNoError().catch(console.error);