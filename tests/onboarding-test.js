const { chromium } = require('playwright');

async function testOnboardingFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting onboarding flow test...');

    // 1. Go to login page
    await page.goto('http://localhost:3000/auth');
    await page.screenshot({ path: 'screenshots/01-login-page.png' });
    console.log('✅ Screenshot 1: Login page');

    // 2. Login with test user
    // The Sign In tab is already selected by default
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });

    // Fill login form
    await page.fill('input[type="email"]', 'user@nrghax.com');
    await page.fill('input[type="password"]', 'User123!@#');

    // Take screenshot before clicking Sign In
    await page.screenshot({ path: 'screenshots/01b-filled-form.png' });
    console.log('✅ Screenshot 1b: Filled login form');

    // Click sign in and wait for navigation
    await Promise.all([
      page.waitForURL(/\/onboarding|\/dashboard/, { timeout: 15000 }),
      page.click('button:has-text("Sign In")')
    ]);

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/02-after-login.png' });
    console.log('✅ Screenshot 2: After login (should be onboarding)');

    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Correctly redirected to onboarding');

      // 3. Fill out onboarding form
      // Experience level
      await page.waitForSelector('input[name="experience_level"]', { timeout: 5000 });
      await page.click('input[value="intermediate"]');
      await page.screenshot({ path: 'screenshots/03-experience-selected.png' });
      console.log('✅ Screenshot 3: Experience level selected');

      // Click next
      await page.click('button:has-text("Next")');

      // Interest areas (select multiple)
      await page.waitForSelector('input[name="interest_areas"]', { timeout: 5000 });
      await page.click('input[value="energy"]');
      await page.click('input[value="focus"]');
      await page.screenshot({ path: 'screenshots/04-interests-selected.png' });
      console.log('✅ Screenshot 4: Interest areas selected');

      // Click next
      await page.click('button:has-text("Next")');

      // Learning goals
      await page.waitForSelector('input[name="learning_goals"]', { timeout: 5000 });
      await page.click('input[value="improve_sleep"]');
      await page.screenshot({ path: 'screenshots/05-goals-selected.png' });
      console.log('✅ Screenshot 5: Learning goals selected');

      // Click next
      await page.click('button:has-text("Next")');

      // Time commitment
      await page.waitForSelector('input[name="time_commitment"]', { timeout: 5000 });
      await page.click('input[value="15-30"]');
      await page.screenshot({ path: 'screenshots/06-time-selected.png' });
      console.log('✅ Screenshot 6: Time commitment selected');

      // Click next
      await page.click('button:has-text("Next")');

      // Preferred difficulty
      await page.waitForSelector('input[name="preferred_difficulty"]', { timeout: 5000 });
      await page.click('input[value="medium"]');
      await page.screenshot({ path: 'screenshots/07-difficulty-selected.png' });
      console.log('✅ Screenshot 7: Difficulty selected');

      // Complete onboarding
      await page.click('button:has-text("Complete")');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.screenshot({ path: 'screenshots/08-dashboard-after-onboarding.png' });
      console.log('✅ Screenshot 8: Dashboard after completing onboarding');

      // Check if tags are displayed
      const tagsVisible = await page.locator('.badge, [class*="badge"]').count();
      if (tagsVisible > 0) {
        console.log(`✅ Tags are visible on dashboard: ${tagsVisible} tags found`);
      } else {
        console.log('⚠️ No tags visible on dashboard');
      }

      // 4. Refresh page to verify onboarding is not triggered again
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/09-dashboard-after-refresh.png' });
      console.log('✅ Screenshot 9: Dashboard after refresh (should stay on dashboard)');

      const refreshUrl = page.url();
      if (refreshUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS: Stayed on dashboard after refresh - onboarding loop fixed!');
      } else {
        console.log(`❌ FAILED: Redirected to ${refreshUrl} after refresh`);
      }

    } else if (currentUrl.includes('/dashboard')) {
      console.log('⚠️ User was already onboarded, went straight to dashboard');

      // Try to reset and test again
      console.log('Attempting to reset onboarding...');
      await page.goto('http://localhost:3000/onboarding');
      await page.screenshot({ path: 'screenshots/02-force-onboarding.png' });
    } else {
      console.log(`❌ Unexpected redirect to: ${currentUrl}`);
    }

    // 5. Check user tags in database via API or by going to profile page
    await page.goto('http://localhost:3000/profile/tags');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/10-profile-tags.png' });
    console.log('✅ Screenshot 10: Profile tags page');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

testOnboardingFlow().catch(console.error);