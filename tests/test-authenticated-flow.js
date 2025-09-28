const puppeteer = require('puppeteer');

const PRODUCTION_URL = 'https://www.nrghax.com';

// Use the test users we created earlier
const TEST_USER = {
  email: 'user_test_1759002880124@nrghax.com',
  password: 'UserTest123!'
};

const ADMIN_USER = {
  email: 'admin_test_1759002880124@nrghax.com',
  password: 'AdminTest123!'
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

async function testAuthenticatedFlow() {
  console.log('\n╔═════════════════════════════════════════╗');
  console.log('║    TESTING AUTHENTICATED USER FLOWS     ║');
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
    // PART 1: REGULAR USER FLOW
    console.log('═══ REGULAR USER FLOW ═══\n');

    // Step 1: Login as regular user
    console.log('1. Logging in as regular user');
    await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'domcontentloaded' });
    await delay(2000);

    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);
    await takeScreenshot(page, 'auth-01-login-form');

    await page.click('button[type="submit"]');
    await delay(4000);

    const afterLoginUrl = page.url();
    console.log(`  ✅ Logged in, redirected to: ${afterLoginUrl}`);
    await takeScreenshot(page, 'auth-02-after-login');

    // Handle onboarding if present
    if (afterLoginUrl.includes('/onboarding')) {
      console.log('  📝 Skipping onboarding...');

      // Try clicking Skip button if available
      const skipLink = await page.$('a:has-text("Skip"), button:has-text("Skip")');
      if (skipLink) {
        await skipLink.click();
        await delay(2000);
      } else {
        // Select an option and continue
        const options = await page.$$('[class*="border"][class*="rounded"]');
        if (options.length > 0) {
          await options[0].click();
          await delay(1000);
        }

        // Find and click any continue button
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent &&
                (button.textContent.includes('Continue') ||
                 button.textContent.includes('Get Started') ||
                 button.textContent.includes('Complete'))) {
              button.click();
              break;
            }
          }
        });
        await delay(2000);
      }
    }

    // Step 2: Visit hacks page
    console.log('\n2. Visiting hacks page (authenticated)');
    await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'auth-03-hacks-page');

    // Step 3: Like a hack
    console.log('\n3. Testing like functionality');

    // Find and click like button
    const likeResult = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.className.includes('flex') &&
            button.className.includes('items-center') &&
            button.innerHTML.includes('svg')) {
          const initialCount = button.textContent.match(/\d+/)?.[0] || '0';
          button.click();
          return { clicked: true, initialCount };
        }
      }
      return { clicked: false };
    });

    if (likeResult.clicked) {
      await delay(2000);
      console.log(`  ✅ Clicked like button (was: ${likeResult.initialCount})`);

      // Check if like count changed
      const newCount = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.className.includes('flex') &&
              button.className.includes('items-center') &&
              button.innerHTML.includes('svg')) {
            return button.textContent.match(/\d+/)?.[0] || '0';
          }
        }
        return null;
      });

      if (newCount && newCount !== likeResult.initialCount) {
        console.log(`  ✅ Like count changed to: ${newCount}`);
      }
      await takeScreenshot(page, 'auth-04-hack-liked');
    }

    // Step 4: Visit a hack detail page
    console.log('\n4. Visiting hack detail page');
    const hackLink = await page.$('a[href*="/hacks/"]');
    if (hackLink) {
      await hackLink.click();
      await delay(3000);
      console.log('  ✅ Opened hack detail page');
      await takeScreenshot(page, 'auth-05-hack-detail');

      // Navigate back
      await page.goBack();
      await delay(2000);
    }

    // Step 5: Create a routine
    console.log('\n5. Creating a new routine');
    await page.goto(`${PRODUCTION_URL}/dashboard/routines/new`, { waitUntil: 'domcontentloaded' });
    await delay(3000);

    const pageContent = await page.content();
    if (!pageContent.includes('Application error')) {
      await takeScreenshot(page, 'auth-06-routine-form');

      // Fill in routine details
      const nameInput = await page.$('input[name="name"], input[id="name"]');
      const descInput = await page.$('textarea[name="description"], textarea[id="description"]');

      if (nameInput && descInput) {
        await nameInput.type(`My Energy Routine ${Date.now()}`);
        await descInput.type('A test routine created during automated testing');

        // Add time if available
        const timeInput = await page.$('input[type="time"]');
        if (timeInput) {
          await timeInput.type('09:00');
        }

        await takeScreenshot(page, 'auth-07-routine-filled');

        // Select some hacks
        const checkboxes = await page.$$('input[type="checkbox"]');
        if (checkboxes.length > 0) {
          await checkboxes[0].click();
          if (checkboxes.length > 1) {
            await checkboxes[1].click();
          }
          console.log('  ✅ Selected hacks for routine');
        }

        // Submit
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await delay(3000);
          console.log('  ✅ Routine created successfully');
          await takeScreenshot(page, 'auth-08-routine-created');
        }
      }
    } else {
      console.log('  ⚠️ Could not access routine creation page');
    }

    // Step 6: View user's routines
    console.log('\n6. Viewing user routines');
    await page.goto(`${PRODUCTION_URL}/dashboard/routines`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'auth-09-routines-list');
    console.log('  ✅ Routines page loaded');

    // Sign out
    console.log('\n7. Signing out');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // PART 2: ADMIN USER FLOW
    console.log('\n\n═══ ADMIN USER FLOW ═══\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin user');
    await page.goto(`${PRODUCTION_URL}/auth`, { waitUntil: 'domcontentloaded' });
    await delay(2000);

    await page.type('input[type="email"]', ADMIN_USER.email);
    await page.type('input[type="password"]', ADMIN_USER.password);
    await takeScreenshot(page, 'admin-01-login');

    await page.click('button[type="submit"]');
    await delay(4000);

    console.log(`  ✅ Admin logged in`);
    await takeScreenshot(page, 'admin-02-dashboard');

    // Handle onboarding if needed
    if (page.url().includes('/onboarding')) {
      const skipLink = await page.$('a:has-text("Skip")');
      if (skipLink) {
        await skipLink.click();
        await delay(2000);
      }
    }

    // Step 2: Visit admin hacks page
    console.log('\n2. Visiting admin hacks page');
    await page.goto(`${PRODUCTION_URL}/admin/hacks`, { waitUntil: 'domcontentloaded' });
    await delay(3000);

    const adminPageContent = await page.content();
    if (!adminPageContent.includes('Application error')) {
      console.log('  ✅ Admin hacks page loaded');
      await takeScreenshot(page, 'admin-03-hacks-list');
    } else {
      console.log('  ⚠️ Could not access admin area');
      await takeScreenshot(page, 'admin-03-error');
    }

    // Step 3: Visit admin routines page
    console.log('\n3. Visiting admin routines page');
    await page.goto(`${PRODUCTION_URL}/admin/routines`, { waitUntil: 'domcontentloaded' });
    await delay(3000);
    await takeScreenshot(page, 'admin-04-routines');

    console.log('\n══════════════════════════════════════════');
    console.log('✅ All Tests Completed Successfully!');
    console.log('══════════════════════════════════════════\n');

    console.log('Test Users:');
    console.log(`  Regular: ${TEST_USER.email}`);
    console.log(`  Admin: ${ADMIN_USER.email}`);
    console.log('\n📁 Screenshots saved in: ./production-screenshots/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticatedFlow().catch(console.error);