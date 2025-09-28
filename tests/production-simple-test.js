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
    console.log(`  📸 Screenshot saved: ${name}`);
  } catch (error) {
    console.log(`  ⚠️ Failed to save screenshot: ${error.message}`);
  }
}

async function runSimpleTest() {
  console.log('\n╔═════════════════════════════════════╗');
  console.log('║   NRGHAX PRODUCTION SIMPLE TEST     ║');
  console.log('╚═════════════════════════════════════╝');
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
    // Test 1: Homepage
    console.log('1. Testing Homepage');
    try {
      await page.goto(PRODUCTION_URL, { waitUntil: 'domcontentloaded' });
      await delay(3000);
      await takeScreenshot(page, 'test-01-homepage');
      console.log('  ✅ Homepage loaded');
    } catch (error) {
      console.log('  ❌ Homepage error:', error.message);
    }

    // Test 2: Hacks page
    console.log('\n2. Testing Hacks Page');
    try {
      await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'domcontentloaded' });
      await delay(3000);
      await takeScreenshot(page, 'test-02-hacks');

      // Check page content
      const pageTitle = await page.title();
      const hasContent = await page.$('h1, h2, h3');

      if (hasContent) {
        console.log('  ✅ Hacks page loaded');
      } else {
        console.log('  ⚠️ Hacks page loaded but may have no content');
      }
    } catch (error) {
      console.log('  ❌ Hacks page error:', error.message);
    }

    // Test 3: Like button redirect (as anonymous user)
    console.log('\n3. Testing Like Button Redirect');
    try {
      // Look for like buttons
      const likeButtons = await page.$$('button');
      let foundLikeButton = false;

      for (const button of likeButtons) {
        const buttonContent = await page.evaluate(el => el.innerHTML, button);
        if (buttonContent.includes('Heart') || buttonContent.includes('svg')) {
          foundLikeButton = true;
          console.log('  Found like button, clicking...');

          await button.click();
          await delay(3000);

          const currentUrl = page.url();
          if (currentUrl.includes('/auth')) {
            console.log('  ✅ Successfully redirected to auth page');
            await takeScreenshot(page, 'test-03-auth-redirect');
          } else {
            console.log(`  ⚠️ Not redirected to auth. Current URL: ${currentUrl}`);
            await takeScreenshot(page, 'test-03-after-like');
          }
          break;
        }
      }

      if (!foundLikeButton) {
        console.log('  ⚠️ No like button found on page');
      }
    } catch (error) {
      console.log('  ❌ Like button test error:', error.message);
    }

    // Test 4: Auth page
    console.log('\n4. Testing Auth Page');
    try {
      if (!page.url().includes('/auth')) {
        await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'domcontentloaded' });
        await delay(3000);
      }

      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');

      if (emailInput && passwordInput) {
        console.log('  ✅ Auth page loaded with login form');
        await takeScreenshot(page, 'test-04-auth-page');
      } else {
        console.log('  ⚠️ Auth page loaded but form not found');
      }
    } catch (error) {
      console.log('  ❌ Auth page error:', error.message);
    }

    // Test 5: Test routines page (public)
    console.log('\n5. Testing Routines Page');
    try {
      await page.goto(`${PRODUCTION_URL}/routines`, { waitUntil: 'domcontentloaded' });
      await delay(3000);
      await takeScreenshot(page, 'test-05-routines');
      console.log('  ✅ Routines page loaded');
    } catch (error) {
      console.log('  ❌ Routines page error:', error.message);
    }

    console.log('\n╔═════════════════════════════════════╗');
    console.log('║     ✅ TESTS COMPLETED              ║');
    console.log('╚═════════════════════════════════════╝');
    console.log('\n📁 Screenshots saved in: ./production-screenshots/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
runSimpleTest().catch(console.error);