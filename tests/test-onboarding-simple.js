const { chromium } = require('playwright');

async function testOnboardingFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Starting onboarding flow test...\n');

    // 1. Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3000/auth');

    await page.fill('input[type="email"]', 'user@nrghax.com');
    await page.fill('input[type="password"]', 'User123!@#');

    // Click and handle navigation with a more relaxed approach
    await page.click('button:has-text("Sign In")');

    // Wait a bit for the navigation to start
    await page.waitForTimeout(2000);

    // Check where we ended up
    await page.waitForLoadState('networkidle');
    const afterLoginUrl = page.url();
    console.log(`After login URL: ${afterLoginUrl}`);

    await page.screenshot({ path: 'screenshots/02-after-login.png' });

    if (afterLoginUrl.includes('/onboarding')) {
      console.log('✅ Redirected to onboarding page\n');

      // 2. Complete onboarding
      console.log('Step 2: Completing onboarding...');

      // Wait for onboarding content to load
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/03-onboarding-start.png' });

      // Try to find and click through the onboarding steps
      // Check if there are radio buttons or checkboxes
      const hasRadios = await page.locator('input[type="radio"]').count() > 0;
      const hasCheckboxes = await page.locator('input[type="checkbox"]').count() > 0;

      if (hasRadios || hasCheckboxes) {
        console.log('Found onboarding form elements');

        // Select some options (generic approach)
        if (hasRadios) {
          const radios = await page.locator('input[type="radio"]').all();
          if (radios.length > 0) {
            await radios[0].click();
            console.log('Selected first radio option');
          }
        }

        // Look for Next/Continue button
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          console.log('Clicked Next button');
          await page.waitForTimeout(500);
        }
      }

      // Try to skip or complete onboarding
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Complete"), a:has-text("Skip")').first();
      if (await skipButton.isVisible()) {
        console.log('Found skip/complete button, clicking...');
        await skipButton.click();
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: 'screenshots/04-onboarding-action.png' });

      // 3. Check final location
      await page.waitForLoadState('networkidle');
      const finalUrl = page.url();
      console.log(`\nFinal URL: ${finalUrl}`);
      await page.screenshot({ path: 'screenshots/05-final-location.png' });

      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Successfully reached dashboard');

        // 4. Check for tags
        const badges = await page.locator('[class*="badge"], [class*="Badge"]').count();
        console.log(`Found ${badges} badge elements (potential tags)`);

        // 5. Test refresh behavior
        console.log('\nStep 3: Testing refresh behavior...');
        await page.reload();
        await page.waitForLoadState('networkidle');

        const afterRefreshUrl = page.url();
        await page.screenshot({ path: 'screenshots/06-after-refresh.png' });

        if (afterRefreshUrl.includes('/dashboard')) {
          console.log('✅ SUCCESS: Stayed on dashboard after refresh');
          console.log('✅ Onboarding loop issue appears to be fixed!');
        } else if (afterRefreshUrl.includes('/onboarding')) {
          console.log('❌ ISSUE: Redirected back to onboarding after refresh');
          console.log('❌ Onboarding loop issue still exists');
        }
      } else if (finalUrl.includes('/onboarding')) {
        console.log('⚠️ Still on onboarding page');
        console.log('May need to complete more steps or onboarding is stuck');
      }

    } else if (afterLoginUrl.includes('/dashboard')) {
      console.log('ℹ️ Went straight to dashboard (user already onboarded)');

      // Check tags
      const badges = await page.locator('[class*="badge"], [class*="Badge"]').count();
      console.log(`Found ${badges} badge elements (potential tags)`);

      await page.screenshot({ path: 'screenshots/03-dashboard-direct.png' });
    } else {
      console.log(`⚠️ Unexpected location: ${afterLoginUrl}`);
    }

    console.log('\n📸 Screenshots saved in screenshots/ directory');
    console.log('✅ Test completed');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

testOnboardingFlow().catch(console.error);