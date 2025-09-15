const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testOnboardingFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Starting onboarding flow test...\n');

    // 1. Visit homepage
    console.log('1. Visiting homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png') });
    console.log('   ✓ Homepage screenshot saved');

    // 2. Go to login page
    console.log('2. Navigating to login...');
    await page.click('text=Sign in');
    await page.waitForURL('**/auth**');
    await page.screenshot({ path: path.join(screenshotsDir, '02-login-page.png') });
    console.log('   ✓ Login page screenshot saved');

    // 3. Login as a new test user (user@test.com doesn't have onboarding tags)
    console.log('3. Logging in as user@test.com...');
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForTimeout(2000);

    // 4. Should redirect to onboarding for new users
    console.log('4. Checking for onboarding redirect...');
    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      console.log('   ✓ Redirected to onboarding as expected');
      await page.screenshot({ path: path.join(screenshotsDir, '03-onboarding-start.png') });
      console.log('   ✓ Onboarding page screenshot saved');

      // 5. Complete onboarding questionnaire
      console.log('5. Completing onboarding questionnaire...');

      // Question 1: Experience level
      await page.click('text=Beginner');
      await page.screenshot({ path: path.join(screenshotsDir, '04-question-1-experience.png') });
      await page.click('text=Next');
      await page.waitForTimeout(500);

      // Question 2: Interest areas (multiple choice)
      await page.click('text=Web Security');
      await page.click('text=Cryptography');
      await page.screenshot({ path: path.join(screenshotsDir, '05-question-2-interests.png') });
      await page.click('text=Next');
      await page.waitForTimeout(500);

      // Question 3: Learning goals
      await page.click('text=CTF Preparation');
      await page.click('text=Personal Interest');
      await page.screenshot({ path: path.join(screenshotsDir, '06-question-3-goals.png') });
      await page.click('text=Next');
      await page.waitForTimeout(500);

      // Question 4: Time commitment
      await page.click('text=Regular');
      await page.screenshot({ path: path.join(screenshotsDir, '07-question-4-time.png') });
      await page.click('text=Next');
      await page.waitForTimeout(500);

      // Question 5: Difficulty preference
      await page.click('text=Start Easy');
      await page.screenshot({ path: path.join(screenshotsDir, '08-question-5-difficulty.png') });
      await page.click('text=Complete');
      console.log('   ✓ Questionnaire completed');

      // Wait for dashboard redirect
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await page.waitForLoadState('networkidle');

    } else if (currentUrl.includes('/dashboard')) {
      console.log('   → User already completed onboarding, on dashboard');
    }

    // 6. Check personalized dashboard
    console.log('6. Checking personalized dashboard...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '09-dashboard-personalized.png'), fullPage: true });
    console.log('   ✓ Dashboard screenshot saved');

    // Check for user tags display
    const tagsVisible = await page.locator('.flex.flex-wrap.gap-2').first().isVisible();
    if (tagsVisible) {
      console.log('   ✓ User tags are displayed');
    }

    // Check for recommended challenges
    const recommendedSection = await page.locator('text=Recommended Challenges').isVisible();
    if (recommendedSection) {
      console.log('   ✓ Recommended challenges section present');
    }

    // 7. Visit profile tags page
    console.log('7. Visiting profile tags page...');
    await page.click('text=Manage Tags');
    await page.waitForURL('**/profile/tags**');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '10-profile-tags.png'), fullPage: true });
    console.log('   ✓ Profile tags page screenshot saved');

    // 8. Check sync button
    console.log('8. Testing Discord sync dialog...');
    const syncButton = page.locator('button:has-text("Sync with Discord")');
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '11-sync-dialog.png') });
      console.log('   ✓ Sync dialog screenshot saved');

      // Close dialog
      await page.keyboard.press('Escape');
    }

    // 9. Sign out and test admin flow
    console.log('9. Signing out...');
    await page.goto('http://localhost:3000/auth/signout');
    await page.waitForTimeout(1000);

    // 10. Login as admin
    console.log('10. Logging in as admin (test@test.com)...');
    await page.goto('http://localhost:3000/auth');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Admin should also go through onboarding or dashboard
    const adminUrl = page.url();
    if (adminUrl.includes('/dashboard')) {
      console.log('   ✓ Admin on dashboard');
      await page.screenshot({ path: path.join(screenshotsDir, '12-admin-dashboard.png'), fullPage: true });

      // Check admin tags (should show Expert, Mentor, Verified)
      const adminTags = await page.locator('.flex.flex-wrap.gap-2').first().isVisible();
      if (adminTags) {
        console.log('   ✓ Admin tags displayed');
      }
    }

    console.log('\n✅ All tests completed successfully!');
    console.log(`📸 Screenshots saved in: ${screenshotsDir}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error-state.png') });
  } finally {
    await browser.close();
  }
}

// Run the test
testOnboardingFlow().catch(console.error);