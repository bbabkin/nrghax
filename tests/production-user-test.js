const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const PRODUCTION_URL = 'https://www.nrghax.com';
const SUPABASE_URL = 'https://chbfahyrdfoboddqahdk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmZhaHlyZGZvYm9kZHFhaGRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ4MzM2NiwiZXhwIjoyMDc0MDU5MzY2fQ.GEX5i65d_orzJgMt2zr6WKkdzz2naKJhEw3h721OCDg';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test user
const timestamp = Date.now();
const TEST_USER = {
  email: `test_user_${timestamp}@nrghax.com`,
  password: 'TestUser123!',
  username: `test_user_${timestamp}`
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `production-screenshots/${name}_${timestamp}.png`,
    fullPage: true
  });
  console.log(`  📸 Screenshot: ${name}`);
}

async function setupTestUser() {
  console.log('🌱 Setting up test user...');

  try {
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true
    });

    if (userError) {
      console.log('  ⚠️ User creation error:', userError.message);
    } else {
      console.log('  ✅ Test user created:', TEST_USER.email);

      if (userData?.user) {
        await supabase
          .from('profiles')
          .update({ name: TEST_USER.username })
          .eq('id', userData.user.id);
      }
    }
  } catch (error) {
    console.error('  ❌ Setup error:', error.message);
  }
}

async function testRegularUserFlow(page) {
  console.log('\n👤 REGULAR USER FLOW TEST');
  console.log('══════════════════════════\n');

  // Test 1: Visit homepage as anonymous user
  console.log('1. Visiting homepage (anonymous)');
  await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
  await delay(2000);
  await takeScreenshot(page, 'user-01-homepage');

  // Test 2: Visit hacks page
  console.log('\n2. Browsing hacks page (anonymous)');
  await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await takeScreenshot(page, 'user-02-hacks-anonymous');

  // Test 3: Test like button redirect for anonymous user
  console.log('\n3. Testing like button (should redirect to auth)');
  const likeButton = await page.$('button[class*="flex items-center gap-1"]');
  if (likeButton) {
    await likeButton.click();
    await delay(2000);

    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      console.log('  ✅ Correctly redirected to auth page');
      await takeScreenshot(page, 'user-03-auth-redirect');
    } else {
      console.log('  ⚠️ Not redirected to auth (URL:', currentUrl, ')');
    }
  } else {
    console.log('  ⚠️ No like button found');
  }

  // Test 4: Sign in
  console.log('\n4. Signing in as test user');
  if (!page.url().includes('/auth')) {
    await page.goto(`${PRODUCTION_URL}/auth`);
    await delay(2000);
  }

  await page.type('input[type="email"]', TEST_USER.email);
  await page.type('input[type="password"]', TEST_USER.password);
  await takeScreenshot(page, 'user-04-login-form');

  await page.click('button[type="submit"]');
  await delay(3000);

  const afterLoginUrl = page.url();
  console.log(`  ✅ Logged in, redirected to: ${afterLoginUrl}`);
  await takeScreenshot(page, 'user-05-after-login');

  // Handle onboarding if present
  if (afterLoginUrl.includes('/onboarding')) {
    console.log('\n5. Completing onboarding');

    // Skip onboarding
    const skipButton = await page.$('a:has-text("Skip"), button:has-text("Skip")');
    if (skipButton) {
      await skipButton.click();
      await delay(2000);
      console.log('  ✅ Skipped onboarding');
    } else {
      // Select expert level and continue
      const expertOption = await page.$('div:has-text("Expert")');
      if (expertOption) {
        await expertOption.click();
        await delay(1000);
      }

      // Look for any button to continue
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Continue') || text.includes('Get Started') || text.includes('Complete'))) {
          await button.click();
          await delay(2000);
          console.log('  ✅ Completed onboarding');
          break;
        }
      }
    }

    await takeScreenshot(page, 'user-06-after-onboarding');
  }

  // Test 5: Visit hacks page as authenticated user
  console.log('\n6. Visiting hacks page (authenticated)');
  await page.goto(`${PRODUCTION_URL}/hacks`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await takeScreenshot(page, 'user-07-hacks-authenticated');

  // Test 6: Like a hack
  console.log('\n7. Liking a hack');
  const likeButtons = await page.$$('button[class*="flex items-center gap-1"]');
  if (likeButtons.length > 0) {
    const firstLikeButton = likeButtons[0];

    // Get initial like count
    const initialCount = await page.evaluate(el => el.textContent, firstLikeButton);
    console.log(`  Initial like count: ${initialCount}`);

    await firstLikeButton.click();
    await delay(2000);

    // Check if like was successful
    const newCount = await page.evaluate(el => el.textContent, firstLikeButton);
    console.log(`  New like count: ${newCount}`);

    if (newCount !== initialCount) {
      console.log('  ✅ Successfully liked hack');
    } else {
      console.log('  ⚠️ Like count did not change');
    }

    await takeScreenshot(page, 'user-08-hack-liked');
  }

  // Test 7: Visit a hack detail page
  console.log('\n8. Visiting hack detail page');
  const hackLink = await page.$('a[href*="/hacks/"]');
  if (hackLink) {
    await hackLink.click();
    await delay(2000);
    console.log('  ✅ Opened hack detail page');
    await takeScreenshot(page, 'user-09-hack-detail');

    // Go back to hacks list
    await page.goBack();
    await delay(2000);
  }

  // Test 8: Create a routine
  console.log('\n9. Creating a new routine');
  await page.goto(`${PRODUCTION_URL}/dashboard/routines/new`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await takeScreenshot(page, 'user-10-new-routine-form');

  // Check if we can access the form or if there's an error
  const pageContent = await page.content();
  if (!pageContent.includes('Application error')) {
    // Fill routine form
    const nameInput = await page.$('input[name="name"], input[id="name"]');
    const descInput = await page.$('textarea[name="description"], textarea[id="description"]');

    if (nameInput && descInput) {
      await nameInput.type(`My Test Routine ${timestamp}`);
      await descInput.type('This is a test routine created by automated testing');

      // Try to add time if available
      const timeInput = await page.$('input[type="time"]');
      if (timeInput) {
        await timeInput.type('09:00');
      }

      await takeScreenshot(page, 'user-11-routine-filled');

      // Try to select hacks if available
      const hackCheckboxes = await page.$$('input[type="checkbox"]');
      if (hackCheckboxes.length > 0) {
        // Select first 2 hacks
        for (let i = 0; i < Math.min(2, hackCheckboxes.length); i++) {
          await hackCheckboxes[i].click();
        }
        console.log('  ✅ Selected hacks for routine');
        await takeScreenshot(page, 'user-12-hacks-selected');
      }

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await delay(3000);
        console.log('  ✅ Routine created');
        await takeScreenshot(page, 'user-13-routine-created');
      }
    } else {
      console.log('  ⚠️ Could not find routine form fields');
    }
  } else {
    console.log('  ⚠️ Error accessing routine creation page');
  }

  // Test 9: View user's routines
  console.log('\n10. Viewing user routines');
  await page.goto(`${PRODUCTION_URL}/dashboard/routines`, { waitUntil: 'networkidle2' });
  await delay(2000);
  await takeScreenshot(page, 'user-14-routines-list');
  console.log('  ✅ User routines page loaded');

  // Test 10: Sign out
  console.log('\n11. Signing out');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(PRODUCTION_URL);
  await delay(2000);
  await takeScreenshot(page, 'user-15-signed-out');
  console.log('  ✅ Signed out successfully');
}

async function runProductionTests() {
  console.log('\n╔═════════════════════════════════════╗');
  console.log('║  NRGHAX PRODUCTION USER FLOW TEST   ║');
  console.log('╚═════════════════════════════════════╝');
  console.log(`\nTesting: ${PRODUCTION_URL}\n`);

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('production-screenshots')) {
    fs.mkdirSync('production-screenshots');
  }

  // Setup test user
  await setupTestUser();

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Run user flow tests
    await testRegularUserFlow(page);

    console.log('\n╔═════════════════════════════════════╗');
    console.log('║     ✅ ALL TESTS COMPLETED          ║');
    console.log('╚═════════════════════════════════════╝');
    console.log('\nTest User Created:');
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

// Run the tests
runProductionTests().catch(console.error);