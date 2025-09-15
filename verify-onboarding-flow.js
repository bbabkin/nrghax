const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function takeScreenshot(page, name) {
  const screenshotDir = path.join(__dirname, 'screenshots');
  await fs.mkdir(screenshotDir, { recursive: true });
  const filepath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
  return filepath;
}

async function verifyOnboardingFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('🚀 Starting onboarding flow verification...\n');

  try {
    // 1. Home page
    console.log('1. Navigating to home page...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '01-home-page');

    // 2. Click login
    console.log('2. Clicking login...');
    await page.click('text="Login"');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '02-auth-page');

    // 3. Login as admin
    console.log('3. Logging in as admin...');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await takeScreenshot(page, '03-admin-login-filled');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 4. Admin dashboard
    console.log('4. Admin dashboard...');
    await takeScreenshot(page, '04-admin-dashboard');

    // 5. Check navbar for admin options
    console.log('5. Checking admin navigation options...');
    // Expand mobile menu if needed
    const menuButton = await page.$('button[aria-label="Toggle menu"]');
    if (menuButton && await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, '05-admin-nav-expanded');

    // 6. Navigate to onboarding admin page
    console.log('6. Navigating to admin onboarding page...');
    await page.click('text="Onboarding"');
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '06-admin-onboarding-page');

    // 7. Click edit on a question
    console.log('7. Editing a question...');
    const editButtons = await page.$$('button:has([data-lucide="edit-2"])');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '07-admin-editing-question');
    }

    // 8. Sign out
    console.log('8. Signing out...');
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(2000);

    // 9. Sign up as new user
    console.log('9. Creating new user account...');
    await page.goto('http://localhost:3000/auth');
    await page.click('text="Need an account?"');
    await page.waitForTimeout(1000);

    const timestamp = Date.now();
    const testEmail = `user${timestamp}@example.com`;
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await takeScreenshot(page, '09-signup-filled');
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(3000);

    // 10. Should redirect to onboarding
    console.log('10. Onboarding flow - Question 1...');
    await takeScreenshot(page, '10-onboarding-question-1');

    // 11. Select an option (should auto-advance)
    console.log('11. Selecting beginner option (should auto-advance)...');
    await page.click('text="Beginner"');
    await page.waitForTimeout(500); // Wait for auto-advance
    await takeScreenshot(page, '11-auto-advanced-to-question-2');

    // 12. Question 2 - Multiple selection
    console.log('12. Question 2 - Selecting multiple interests...');
    await page.click('text="Web Security"');
    await page.click('text="Cryptography"');
    await takeScreenshot(page, '12-multiple-selection');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // 13. Continue through questions
    console.log('13. Question 3 - Goals...');
    await takeScreenshot(page, '13-question-3');
    await page.click('text="CTF Preparation"');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // 14. Question 4 - Time (should auto-advance)
    console.log('14. Question 4 - Time commitment (should auto-advance)...');
    await takeScreenshot(page, '14-question-4');
    await page.click('text="Regular"');
    await page.waitForTimeout(500);

    // 15. Question 5 - Difficulty (should auto-advance and complete)
    console.log('15. Question 5 - Difficulty preference...');
    await takeScreenshot(page, '15-question-5');
    await page.click('text="Start Easy"');
    await page.waitForTimeout(2000);

    // 16. Should be redirected to dashboard
    console.log('16. User dashboard after onboarding...');
    await takeScreenshot(page, '16-user-dashboard');

    // 17. Check skip functionality with another new user
    console.log('\n17. Testing skip functionality with new user...');
    await page.click('button:has-text("Sign Out")');
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:3000/auth');
    const timestamp2 = Date.now();
    const testEmail2 = `skipuser${timestamp2}@example.com`;
    await page.fill('input[name="email"]', testEmail2);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign Up")');
    await page.waitForTimeout(3000);

    // 18. Screenshot skip link
    console.log('18. Onboarding with skip link visible...');
    await takeScreenshot(page, '18-onboarding-with-skip-link');

    // 19. Click skip
    console.log('19. Clicking skip link...');
    await page.click('text="Skip onboarding questions"');
    await page.waitForTimeout(2000);

    // 20. Should be at dashboard
    console.log('20. Dashboard after skipping onboarding...');
    await takeScreenshot(page, '20-dashboard-after-skip');

    console.log('\n✅ Verification complete! Check the screenshots folder.');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

verifyOnboardingFlow().catch(console.error);