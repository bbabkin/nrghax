const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'production-flow-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testProductionFlows() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultNavigationTimeout(30000);

  console.log('=================================');
  console.log('NRGHAX PRODUCTION TEST REPORT');
  console.log('URL: https://www.nrghax.com');
  console.log('=================================\n');

  const issues = [];
  const successes = [];

  try {
    // 1. TEST HOMEPAGE CONTENT
    console.log('1. HOMEPAGE CONTENT TEST');
    await page.goto('https://www.nrghax.com');
    await wait(2000);

    const homepageData = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const title = document.title;
      const hasNRGContent = document.body.innerText.includes('energy') ||
                           document.body.innerText.includes('Energy') ||
                           document.body.innerText.includes('NRG');
      return {
        h1Text: h1 ? h1.textContent : null,
        title: title,
        hasEnergyContent: hasNRGContent
      };
    });

    console.log(`   Title: ${homepageData.title}`);
    console.log(`   H1: ${homepageData.h1Text}`);

    if (homepageData.h1Text === 'Supabase Auth Starter') {
      issues.push('❌ Homepage shows generic template instead of NRGHax content');
      console.log('   ❌ Issue: Generic template showing');
    } else if (homepageData.hasEnergyContent) {
      successes.push('✅ Homepage shows energy/NRGHax content');
      console.log('   ✅ Homepage content is correct');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });

    // 2. TEST DATABASE CONTENT
    console.log('\n2. DATABASE CONTENT TEST');
    await page.goto('https://www.nrghax.com/hacks');
    await wait(2000);

    const hacksData = await page.evaluate(() => {
      const noContent = document.body.innerText.includes('No content available');
      const hackCards = document.querySelectorAll('article, [class*="card"], [class*="hack-item"]');
      return {
        hasNoContent: noContent,
        hackCount: hackCards.length
      };
    });

    console.log(`   Hack cards found: ${hacksData.hackCount}`);

    if (hacksData.hasNoContent || hacksData.hackCount === 0) {
      issues.push('❌ No hacks in production database');
      console.log('   ❌ Issue: Database has no hacks');
    } else {
      successes.push(`✅ Found ${hacksData.hackCount} hacks in database`);
      console.log(`   ✅ ${hacksData.hackCount} hacks found`);
    }

    await page.screenshot({ path: path.join(screenshotsDir, '02-hacks.png'), fullPage: true });

    // 3. TEST AUTHENTICATION SYSTEM
    console.log('\n3. AUTHENTICATION SYSTEM TEST');
    await page.goto('https://www.nrghax.com/auth');
    await wait(2000);

    const authData = await page.evaluate(() => {
      const emailField = document.querySelector('input[type="email"]');
      const passwordField = document.querySelector('input[type="password"]');
      const googleButton = document.querySelector('[class*="google"], button:has-text("Google")');
      const discordButton = document.querySelector('[class*="discord"], button:has-text("Discord")');
      return {
        hasEmailAuth: !!(emailField && passwordField),
        hasGoogleOAuth: !!googleButton,
        hasDiscordOAuth: !!discordButton
      };
    });

    console.log(`   Email/Password Auth: ${authData.hasEmailAuth ? '✅' : '❌'}`);
    console.log(`   Google OAuth: ${authData.hasGoogleOAuth ? '✅' : '❌'}`);
    console.log(`   Discord OAuth: ${authData.hasDiscordOAuth ? '✅' : '❌'}`);

    if (authData.hasEmailAuth) {
      successes.push('✅ Email/Password authentication available');
    } else {
      issues.push('❌ Email/Password authentication not working');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-auth.png'), fullPage: true });

    // 4. TEST ROUTE PROTECTION
    console.log('\n4. ROUTE PROTECTION TEST');
    await page.goto('https://www.nrghax.com/account');
    await wait(2000);

    const accountUrl = page.url();
    console.log(`   Account route redirected to: ${accountUrl}`);

    if (accountUrl.includes('/auth')) {
      successes.push('✅ Protected routes working (redirect to auth)');
      console.log('   ✅ Routes are protected');
    } else {
      issues.push('❌ Protected routes not redirecting properly');
      console.log('   ❌ Route protection may be broken');
    }

    // 5. TEST ADMIN ROUTES
    console.log('\n5. ADMIN ROUTE TEST');
    await page.goto('https://www.nrghax.com/admin/hacks');
    await wait(3000);

    const adminPageContent = await page.evaluate(() => {
      const hasError = document.body.innerText.includes('Application error') ||
                      document.body.innerText.includes('server-side exception');
      const currentUrl = window.location.href;
      return {
        hasError: hasError,
        url: currentUrl
      };
    });

    console.log(`   Admin page URL: ${adminPageContent.url}`);

    if (adminPageContent.hasError) {
      issues.push('❌ Admin page showing server error');
      console.log('   ❌ Server error on admin page');
    } else if (adminPageContent.url.includes('/auth')) {
      successes.push('✅ Admin routes protected');
      console.log('   ✅ Admin route redirects to auth');
    } else {
      console.log('   ⚠️  Admin page behavior unclear');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04-admin.png'), fullPage: true });

    // 6. TEST ROUTINES PAGE
    console.log('\n6. ROUTINES PAGE TEST');
    await page.goto('https://www.nrghax.com/routines');
    await wait(3000);

    const routinesContent = await page.evaluate(() => {
      const hasError = document.body.innerText.includes('Application error') ||
                      document.body.innerText.includes('server-side exception');
      return { hasError: hasError };
    });

    if (routinesContent.hasError) {
      issues.push('❌ Routines page showing server error');
      console.log('   ❌ Server error on routines page');
    } else {
      successes.push('✅ Routines page loads');
      console.log('   ✅ Routines page working');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '05-routines.png'), fullPage: true });

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    issues.push(`❌ Test execution error: ${error.message}`);
  }

  await browser.close();

  // FINAL REPORT
  console.log('\n=================================');
  console.log('PRODUCTION TEST SUMMARY');
  console.log('=================================');

  console.log('\n✅ WORKING FEATURES:');
  if (successes.length > 0) {
    successes.forEach(s => console.log(`   ${s}`));
  } else {
    console.log('   None detected');
  }

  console.log('\n❌ ISSUES FOUND:');
  if (issues.length > 0) {
    issues.forEach(i => console.log(`   ${i}`));
  } else {
    console.log('   None');
  }

  console.log('\n=================================');
  console.log('RECOMMENDATIONS:');
  console.log('=================================');

  if (issues.includes('❌ Homepage shows generic template instead of NRGHax content')) {
    console.log('1. Check if correct branch is deployed on Vercel');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Clear Vercel build cache and redeploy');
  }

  if (issues.includes('❌ No hacks in production database')) {
    console.log('1. Run seed script to populate production database');
    console.log('2. Create hacks manually through admin interface');
  }

  if (issues.some(i => i.includes('Server error'))) {
    console.log('1. Check Vercel function logs for errors');
    console.log('2. Verify all environment variables are set');
    console.log('3. Check database connection settings');
  }

  console.log('\nScreenshots saved to:', screenshotsDir);
  console.log('=================================\n');
}

// Run the test
testProductionFlows().catch(console.error);