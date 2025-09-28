const puppeteer = require('puppeteer');

async function testUnregisteredLike() {
  console.log('\n🧪 Testing Unregistered User Like Button Redirect\n');
  console.log('══════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Step 1: Clear any existing session
    console.log('1. Clearing browser session...');
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Step 2: Navigate to hacks page as unregistered user
    console.log('2. Navigating to hacks page (unregistered)...');
    await page.goto('http://localhost:3000/hacks', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const initialUrl = page.url();
    console.log(`   Current URL: ${initialUrl}`);

    // Take screenshot of hacks page
    await page.screenshot({
      path: `screenshots/unregistered-01-hacks-page.png`
    });
    console.log('   📸 Screenshot: hacks page before clicking like');

    // Step 3: Find and click the like button
    console.log('\n3. Looking for like button...');

    // Find like buttons (looking for buttons with flex items-center gap-1 class pattern)
    const likeButtons = await page.$$('button');
    let likeButtonFound = false;
    let buttonIndex = 0;

    for (const button of likeButtons) {
      const buttonContent = await page.evaluate(el => {
        const hasFlexClass = el.className.includes('flex') && el.className.includes('items-center');
        const hasSvg = el.innerHTML.includes('svg');
        const hasNumber = /\d+/.test(el.textContent);

        return {
          isLikeButton: hasFlexClass && hasSvg && hasNumber,
          text: el.textContent,
          className: el.className,
          innerHTML: el.innerHTML.substring(0, 100)
        };
      }, button);

      if (buttonContent.isLikeButton) {
        console.log(`   ✅ Found like button #${buttonIndex + 1}`);
        console.log(`      Text: "${buttonContent.text}"`);
        console.log(`      Class: "${buttonContent.className}"`);

        // Click the like button
        console.log('   Clicking like button...');
        await button.click();
        likeButtonFound = true;
        break;
      }
      buttonIndex++;
    }

    if (!likeButtonFound) {
      console.log('   ❌ No like button found on page');
      console.log('   Checking if there are any hack cards...');

      const hackCards = await page.$$('[class*="card"]');
      console.log(`   Found ${hackCards.length} card elements`);

      if (hackCards.length === 0) {
        console.log('   ⚠️ No hack cards found - database might be empty');
      }
      return;
    }

    // Step 4: Wait for navigation and check if redirected to auth
    console.log('\n4. Waiting for redirect...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newUrl = page.url();
    console.log(`   New URL: ${newUrl}`);

    // Take screenshot after clicking
    await page.screenshot({
      path: `screenshots/unregistered-02-after-click.png`
    });

    // Step 5: Verify redirect
    console.log('\n5. Verifying redirect...');

    if (newUrl.includes('/auth')) {
      console.log('   ✅ SUCCESS: Redirected to auth page!');
      console.log(`      From: ${initialUrl}`);
      console.log(`      To: ${newUrl}`);

      // Verify auth page has login form
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');

      if (emailInput && passwordInput && submitButton) {
        console.log('   ✅ Auth page has login form ready');
        await page.screenshot({
          path: `screenshots/unregistered-03-auth-page.png`
        });
        console.log('   📸 Screenshot: auth page with login form');
      } else {
        console.log('   ⚠️ Auth page loaded but form elements not found');
      }
    } else {
      console.log('   ❌ FAILED: Not redirected to auth page');
      console.log(`      Expected URL to contain: /auth`);
      console.log(`      Actual URL: ${newUrl}`);

      // Check for any error messages or toasts
      const pageContent = await page.evaluate(() => document.body.textContent);
      if (pageContent.includes('sign in') || pageContent.includes('Sign in')) {
        console.log('   ⚠️ Found "sign in" text on page (might be a toast instead of redirect)');
      }
    }

    console.log('\n══════════════════════════════════════════════');
    console.log('Test Complete');
    console.log('══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({
      path: `screenshots/unregistered-error.png`
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testUnregisteredLike().catch(console.error);