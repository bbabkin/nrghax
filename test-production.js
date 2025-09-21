const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'production-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testProduction() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Testing NRGHax Production Site...\n');

  try {
    // 1. Test Homepage
    console.log('1. Testing Homepage...');
    await page.goto('https://www.nrghax.com', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });
    console.log('   ✓ Homepage loaded');

    // 2. Test Hacks Page (Public)
    console.log('\n2. Testing Hacks Page (Public View)...');
    await page.goto('https://www.nrghax.com/hacks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '02-hacks-public.png'), fullPage: true });

    // Check if hacks are displayed
    const hacksExist = await page.evaluate(() => {
      const hackCards = document.querySelectorAll('[class*="card"], [class*="hack"]');
      return hackCards.length;
    });
    console.log(`   ✓ Hacks page loaded with ${hacksExist} hack cards visible`);

    // 3. Test Auth Page
    console.log('\n3. Testing Auth/Login Page...');
    await page.goto('https://www.nrghax.com/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '03-auth-page.png'), fullPage: true });
    console.log('   ✓ Auth page loaded');

    // 4. Test User Registration/Login
    console.log('\n4. Testing User Registration...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Try to find email and password fields
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordField = await page.$('input[type="password"], input[name="password"], input[placeholder*="password" i]');

    if (emailField && passwordField) {
      await emailField.type(testEmail);
      await passwordField.type(testPassword);
      await page.screenshot({ path: path.join(screenshotsDir, '04-auth-filled.png') });
      console.log('   ✓ Auth form fields filled');
    } else {
      console.log('   ⚠ Could not find auth form fields');
    }

    // 5. Test Admin Check
    console.log('\n5. Testing Admin Route Access...');
    await page.goto('https://www.nrghax.com/admin/hacks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '05-admin-redirect.png') });

    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      console.log('   ✓ Admin route correctly redirects to auth when not logged in');
    } else {
      console.log('   ⚠ Admin route behavior unexpected: ' + currentUrl);
    }

    // 6. Test Individual Hack Page
    console.log('\n6. Testing Individual Hack Page...');
    await page.goto('https://www.nrghax.com/hacks', { waitUntil: 'networkidle2' });

    // Try to click on first hack
    const firstHackLink = await page.$('a[href*="/hacks/"]');
    if (firstHackLink) {
      const hackUrl = await page.evaluate(el => el.href, firstHackLink);
      await page.goto(hackUrl, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotsDir, '06-hack-detail.png'), fullPage: true });
      console.log('   ✓ Individual hack page loaded: ' + hackUrl);

      // Check for unlock button (indicates prerequisites system)
      const unlockButton = await page.$('button:has-text("Unlock"), button:has-text("Complete Prerequisites")');
      if (unlockButton) {
        console.log('   ✓ Prerequisites/Unlock system detected');
      }
    } else {
      console.log('   ⚠ No hack links found');
    }

    // 7. Test Profile/Account Page
    console.log('\n7. Testing Profile/Account Routes...');
    await page.goto('https://www.nrghax.com/account', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '07-account-page.png') });

    const accountUrl = page.url();
    if (accountUrl.includes('/auth')) {
      console.log('   ✓ Account page correctly redirects to auth when not logged in');
    } else {
      console.log('   ⚠ Account page accessible without auth');
    }

    // 8. Test Database Connection
    console.log('\n8. Testing Database Connection...');
    const response = await page.goto('https://www.nrghax.com/api/check-admin', {
      waitUntil: 'networkidle2'
    });

    if (response.status() === 401 || response.status() === 403) {
      console.log('   ✓ API endpoints are protected (401/403 when not authenticated)');
    } else {
      console.log(`   ⚠ API endpoint returned status: ${response.status()}`);
    }

    // 9. Check for console errors
    console.log('\n9. Checking for Console Errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('https://www.nrghax.com', { waitUntil: 'networkidle2' });

    if (consoleErrors.length === 0) {
      console.log('   ✓ No console errors detected');
    } else {
      console.log('   ⚠ Console errors found:');
      consoleErrors.forEach(err => console.log('     - ' + err));
    }

    // 10. Test Routines Page
    console.log('\n10. Testing Routines Page...');
    await page.goto('https://www.nrghax.com/routines', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '08-routines.png'), fullPage: true });
    console.log('   ✓ Routines page loaded');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
  }

  await browser.close();

  console.log('\n=================================');
  console.log('Production Testing Complete!');
  console.log('Screenshots saved to:', screenshotsDir);
  console.log('=================================');
}

// Run the test
testProduction().catch(console.error);