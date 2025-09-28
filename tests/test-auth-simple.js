const puppeteer = require('puppeteer');

const PRODUCTION_URL = 'https://www.nrghax.com';

// Use the test users we created earlier
const TEST_USER = {
  email: 'user_test_1759002880124@nrghax.com',
  password: 'UserTest123!'
};

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

async function testSimpleAuth() {
  console.log('\n╔═════════════════════════════════════════╗');
  console.log('║      SIMPLE AUTHENTICATED TEST          ║');
  console.log('╚═════════════════════════════════════════╝');
  console.log(`\nTesting: ${PRODUCTION_URL}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    // Step 1: Login
    console.log('1. Logging in as test user');
    await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'domcontentloaded' });
    await delay(2000);

    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);
    await takeScreenshot(page, 'simple-01-login');

    await page.click('button[type="submit"]');
    await delay(5000);

    const afterLoginUrl = page.url();
    console.log(`  ✅ Logged in, redirected to: ${afterLoginUrl}`);
    await takeScreenshot(page, 'simple-02-after-login');

    // Handle onboarding if present
    if (afterLoginUrl.includes('/onboarding')) {
      console.log('  📝 Handling onboarding...');

      // Look for Skip link
      const skipLink = await page.$('a');
      const skipText = skipLink ? await page.evaluate(el => el.textContent, skipLink) : '';

      if (skipText && skipText.includes('Skip')) {
        await skipLink.click();
        await delay(2000);
        console.log('  ✅ Skipped onboarding');
      } else {
        // Click the first option
        const firstOption = await page.$('[class*="border"]');
        if (firstOption) {
          await firstOption.click();
          await delay(1000);
        }

        // Click any button to continue
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click();
          await delay(2000);
        }
      }
    }

    // Step 2: Visit hacks page
    console.log('\n2. Visiting hacks page (authenticated)');
    await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'simple-03-hacks');

    // Step 3: Test liking a hack
    console.log('\n3. Testing like functionality');

    // Find like button
    const buttons = await page.$$('button');
    let likeButtonFound = false;

    for (const button of buttons) {
      const buttonHtml = await page.evaluate(el => el.innerHTML, button);
      if (buttonHtml.includes('svg') && buttonHtml.includes('path')) {
        const initialText = await page.evaluate(el => el.textContent, button);
        console.log(`  Found like button with count: ${initialText}`);

        await button.click();
        await delay(2000);

        const newText = await page.evaluate(el => el.textContent, button);
        console.log(`  After click, count is: ${newText}`);

        if (newText !== initialText) {
          console.log('  ✅ Like functionality works!');
        } else {
          console.log('  ⚠️ Like count did not change');
        }

        await takeScreenshot(page, 'simple-04-after-like');
        likeButtonFound = true;
        break;
      }
    }

    if (!likeButtonFound) {
      console.log('  ⚠️ No like button found');
    }

    // Step 4: Visit routines
    console.log('\n4. Visiting dashboard routines');
    await page.goto(`${PRODUCTION_URL}/dashboard/routines`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'simple-05-routines');
    console.log('  ✅ Routines page loaded');

    console.log('\n══════════════════════════════════════════');
    console.log('✅ Test Completed Successfully!');
    console.log('══════════════════════════════════════════\n');

    console.log('Test User:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log('\n📁 Screenshots saved in: ./production-screenshots/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
testSimpleAuth().catch(console.error);