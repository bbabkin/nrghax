const puppeteer = require('puppeteer');

async function testOnboardingFlow() {
  console.log('🚀 Starting onboarding flow test with Puppeteer...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // 1. Navigate to auth page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'screenshots/10-login-page.png' });

    // 2. Fill in login form
    console.log('🔑 Step 2: Logging in...');
    await page.type('input[type="email"]', 'user@nrghax.com');
    await page.type('input[type="password"]', 'User123!@#');
    await page.screenshot({ path: 'screenshots/11-login-filled.png' });

    // 3. Submit form and wait for navigation
    console.log('⏳ Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      page.click('button:first-of-type') // Click the Sign In button
    ]);

    // Give it a moment to process
    await page.waitForTimeout(2000);

    // 4. Check where we ended up
    const currentUrl = page.url();
    console.log(`📌 Current URL: ${currentUrl}`);
    await page.screenshot({ path: 'screenshots/12-after-login.png' });

    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Successfully redirected to onboarding!\n');

      // 5. Look at onboarding page structure
      console.log('🔍 Analyzing onboarding page...');

      // Check for skip button
      const skipButton = await page.$('a[href*="/dashboard"], button:not([type="submit"])');
      if (skipButton) {
        const skipText = await page.evaluate(el => el.textContent, skipButton);
        console.log(`Found skip option: "${skipText}"`);

        console.log('⏩ Skipping onboarding...');
        await skipButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);
      }

      // 6. Check final location
      const finalUrl = page.url();
      console.log(`\n📌 Final URL: ${finalUrl}`);
      await page.screenshot({ path: 'screenshots/13-final-location.png' });

      if (finalUrl.includes('/dashboard')) {
        console.log('✅ Reached dashboard successfully!\n');

        // 7. Test refresh to verify no loop
        console.log('🔄 Testing refresh behavior...');
        await page.reload({ waitUntil: 'networkidle2' });
        const afterRefreshUrl = page.url();
        await page.screenshot({ path: 'screenshots/14-after-refresh.png' });

        if (afterRefreshUrl.includes('/dashboard')) {
          console.log('✅ SUCCESS: Stayed on dashboard after refresh!');
          console.log('✅ Onboarding loop issue is FIXED!\n');
        } else {
          console.log(`❌ ISSUE: Redirected to ${afterRefreshUrl} after refresh`);
          console.log('❌ Onboarding loop issue persists\n');
        }

        // 8. Check for tags
        const tagElements = await page.$$eval('[class*="badge"], [class*="Badge"]', els => els.map(el => el.textContent));
        if (tagElements.length > 0) {
          console.log('🏷️ Tags found on dashboard:');
          tagElements.forEach(tag => console.log(`  - ${tag}`));
        } else {
          console.log('ℹ️ No tags visible (expected since onboarding was skipped)');
        }
      }

    } else if (currentUrl.includes('/dashboard')) {
      console.log('ℹ️ User was already onboarded, went straight to dashboard');
      await page.screenshot({ path: 'screenshots/13-dashboard-direct.png' });
    } else if (currentUrl.includes('/auth')) {
      console.log('⚠️ Still on auth page - login may have failed');

      // Check for error messages
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"], .error, .text-red-500');
        return Array.from(alerts).map(el => el.textContent).join(' ');
      });

      if (errorText) {
        console.log(`Error message: ${errorText}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('📸 Screenshots saved in screenshots/ directory');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: 'screenshots/error-state-puppeteer.png' });
    }
  } finally {
    await browser.close();
  }
}

// Now test the tag assignment function
async function verifyTagAssignment() {
  console.log('\n📊 Verifying tag assignment from onboarding...\n');

  const { createClient } = require('@supabase/supabase-js');
  require('dotenv').config({ path: '.env.local' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Sign in as test user
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'user@nrghax.com',
    password: 'User123!@#'
  });

  if (auth?.user) {
    // Simulate onboarding completion
    console.log('🎯 Simulating onboarding completion with answers...');

    const answers = {
      experience_level: 'intermediate',
      interest_areas: ['energy', 'focus'],
      learning_goals: ['productivity', 'better_habits'],
      time_commitment: '15-30',
      preferred_difficulty: 'medium'
    };

    // Import and call the assignment function
    const { assignTagsFromOnboarding } = require('../src/lib/tags/assignment.ts');
    await assignTagsFromOnboarding(auth.user.id, answers);

    // Check what tags were assigned
    const { data: userTags } = await supabase
      .from('user_tags')
      .select(`
        *,
        tag:tags(*)
      `)
      .eq('user_id', auth.user.id);

    if (userTags && userTags.length > 0) {
      console.log('\n✅ Tags successfully assigned:');
      userTags.forEach(ut => {
        console.log(`  - ${ut.tag.name} (${ut.tag.slug}) [source: ${ut.source}]`);
      });
    } else {
      console.log('❌ No tags were assigned');
    }

    // Check if onboarded flag was set
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', auth.user.id)
      .single();

    console.log(`\n📋 Profile onboarded status: ${profile?.onboarded ? '✅ Yes' : '❌ No'}`);

    await supabase.auth.signOut();
  }
}

// Run both tests
(async () => {
  await testOnboardingFlow();
  await verifyTagAssignment();
})().catch(console.error);