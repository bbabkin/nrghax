const puppeteer = require('puppeteer');

const PRODUCTION_URL = 'https://www.nrghax.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `production-screenshots/${name}_${timestamp}.png`;

  try {
    await page.screenshot({
      path: filename,
      fullPage: true
    });
    console.log(`  📸 Screenshot: ${name}`);
  } catch (error) {
    console.log(`  ⚠️ Failed to save screenshot: ${error.message}`);
  }
}

async function testLikeButtonRedirect() {
  console.log('\n╔═════════════════════════════════════════╗');
  console.log('║   TESTING LIKE BUTTON AUTHENTICATION    ║');
  console.log('╚═════════════════════════════════════════╝');
  console.log(`\nTesting: ${PRODUCTION_URL}\n`);

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('production-screenshots')) {
    fs.mkdirSync('production-screenshots');
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  // Set longer timeout
  page.setDefaultNavigationTimeout(60000);

  try {
    // Step 1: Navigate to hacks page as anonymous user
    console.log('1. Navigate to hacks page (anonymous)');
    await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'like-test-01-hacks-page');

    // Step 2: Find and click the like button
    console.log('\n2. Looking for like button...');

    // More specific selector for the like button
    // Looking for button with flex items-center gap-1 class that contains a Heart SVG
    const likeButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        // Check if button contains heart icon and number
        if (button.className.includes('flex') &&
            button.className.includes('items-center') &&
            button.innerHTML.includes('svg') &&
            button.textContent.match(/\d+/)) {
          return {
            found: true,
            text: button.textContent,
            className: button.className
          };
        }
      }
      return { found: false };
    });

    if (likeButton.found) {
      console.log(`  ✅ Found like button (shows: ${likeButton.text})`);

      // Click the like button using a more specific approach
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.className.includes('flex') &&
              button.className.includes('items-center') &&
              button.innerHTML.includes('svg') &&
              button.textContent.match(/\d+/)) {
            button.click();
            break;
          }
        }
      });

      console.log('  Clicked like button');
      await delay(3000);

      // Check if we were redirected to auth
      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      if (currentUrl.includes('/auth')) {
        console.log('  ✅ SUCCESS: Redirected to auth page as expected!');
        await takeScreenshot(page, 'like-test-02-auth-redirect-success');

        // Verify auth page has login form
        const hasEmailInput = await page.$('input[type="email"]');
        const hasPasswordInput = await page.$('input[type="password"]');

        if (hasEmailInput && hasPasswordInput) {
          console.log('  ✅ Auth page has login form ready');
        }
      } else {
        console.log('  ❌ FAILED: Not redirected to auth page');
        console.log(`     Expected: ${PRODUCTION_URL}/auth`);
        console.log(`     Got: ${currentUrl}`);
        await takeScreenshot(page, 'like-test-02-no-redirect');

        // Check if there's any error message or toast
        const pageContent = await page.evaluate(() => document.body.textContent);
        if (pageContent.includes('sign in') || pageContent.includes('Sign in')) {
          console.log('  ⚠️ Found "sign in" text on page (might be a toast)');
        }
      }
    } else {
      console.log('  ❌ No like button found on page');
      console.log('  Checking page structure...');

      // Debug: Check what's on the page
      const hasHackCards = await page.$$('.card, [class*="card"]');
      const hasButtons = await page.$$('button');

      console.log(`  Found ${hasHackCards.length} card elements`);
      console.log(`  Found ${hasButtons.length} button elements`);

      if (hasHackCards.length === 0) {
        console.log('  ⚠️ No hack cards found - database might be empty');
      }
    }

    console.log('\n══════════════════════════════════════════');
    console.log('Test Complete');
    console.log('══════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await takeScreenshot(page, 'like-test-error');
  } finally {
    await browser.close();
  }
}

// Run the test
testLikeButtonRedirect().catch(console.error);