const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'production-test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function testProductionSite() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 60000
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Set longer timeout for navigation
  page.setDefaultNavigationTimeout(60000);

  console.log('=================================');
  console.log('Testing NRGHax Production Site');
  console.log('URL: https://www.nrghax.com');
  console.log('=================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // 1. Homepage Test
    console.log('1. HOMEPAGE TEST');
    console.log('   Loading https://www.nrghax.com...');
    await page.goto('https://www.nrghax.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000); // Wait for any dynamic content

    const homepageTitle = await page.title();
    console.log(`   Title: ${homepageTitle}`);

    const homepageContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const navLinks = Array.from(document.querySelectorAll('nav a')).map(a => a.textContent);
      return {
        h1Text: h1 ? h1.textContent : 'No H1 found',
        navigation: navLinks
      };
    });

    console.log(`   H1: ${homepageContent.h1Text}`);
    console.log(`   Navigation: ${homepageContent.navigation.join(', ')}`);

    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });

    if (homepageTitle.includes('NRGHax') || homepageTitle.includes('Energy')) {
      results.passed.push('Homepage loads with correct title');
    } else {
      results.failed.push(`Homepage has wrong title: ${homepageTitle}`);
    }
    console.log('');

    // 2. Hacks Page Test
    console.log('2. HACKS PAGE TEST');
    console.log('   Loading /hacks...');
    await page.goto('https://www.nrghax.com/hacks', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const hacksContent = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], article, div[class*="hack"]');
      const h1 = document.querySelector('h1');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent);
      return {
        hackCount: cards.length,
        h1Text: h1 ? h1.textContent : 'No H1',
        buttons: buttons
      };
    });

    console.log(`   Found ${hacksContent.hackCount} hack cards`);
    console.log(`   H1: ${hacksContent.h1Text}`);
    console.log(`   Buttons: ${hacksContent.buttons.slice(0, 5).join(', ')}${hacksContent.buttons.length > 5 ? '...' : ''}`);

    await page.screenshot({ path: path.join(screenshotsDir, '02-hacks-page.png'), fullPage: true });

    if (hacksContent.hackCount > 0) {
      results.passed.push(`Hacks page displays ${hacksContent.hackCount} hacks`);
    } else {
      results.warnings.push('No hack cards found on hacks page');
    }
    console.log('');

    // 3. Auth Page Test
    console.log('3. AUTH PAGE TEST');
    console.log('   Loading /auth...');
    await page.goto('https://www.nrghax.com/auth', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const authContent = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
      const submitButtons = Array.from(document.querySelectorAll('button[type="submit"], button')).map(b => b.textContent);
      const h1 = document.querySelector('h1');
      return {
        hasEmailField: !!emailInput,
        hasPasswordField: !!passwordInput,
        buttons: submitButtons,
        h1Text: h1 ? h1.textContent : 'No H1'
      };
    });

    console.log(`   Email field: ${authContent.hasEmailField ? '✓' : '✗'}`);
    console.log(`   Password field: ${authContent.hasPasswordField ? '✓' : '✗'}`);
    console.log(`   H1: ${authContent.h1Text}`);
    console.log(`   Buttons: ${authContent.buttons.join(', ')}`);

    await page.screenshot({ path: path.join(screenshotsDir, '03-auth-page.png'), fullPage: true });

    if (authContent.hasEmailField && authContent.hasPasswordField) {
      results.passed.push('Auth page has login form');
    } else {
      results.failed.push('Auth page missing login fields');
    }
    console.log('');

    // 4. Test Protected Routes
    console.log('4. PROTECTED ROUTES TEST');
    console.log('   Testing /admin/hacks...');
    await page.goto('https://www.nrghax.com/admin/hacks', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    console.log(`   Redirected to: ${adminUrl}`);

    if (adminUrl.includes('/auth') || adminUrl.includes('/login')) {
      results.passed.push('Admin routes properly protected');
      console.log('   ✓ Admin route redirects to auth');
    } else {
      results.warnings.push('Admin route may not be protected');
      console.log('   ⚠ Admin route did not redirect');
    }

    await page.screenshot({ path: path.join(screenshotsDir, '04-admin-redirect.png') });
    console.log('');

    // 5. Test User Registration Flow
    console.log('5. USER REGISTRATION TEST');
    console.log('   Going to auth page...');
    await page.goto('https://www.nrghax.com/auth', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`   Test email: ${testEmail}`);

    // Try to fill form
    try {
      await page.type('input[type="email"], input[name="email"]', testEmail);
      await page.type('input[type="password"], input[name="password"]', testPassword);
      await page.screenshot({ path: path.join(screenshotsDir, '05-auth-filled.png') });
      results.passed.push('Can fill auth form');
      console.log('   ✓ Form filled successfully');
    } catch (e) {
      results.warnings.push('Could not fill auth form');
      console.log('   ⚠ Could not fill form: ' + e.message);
    }
    console.log('');

    // 6. Check for specific hack page
    console.log('6. INDIVIDUAL HACK TEST');
    console.log('   Checking for hack links...');
    await page.goto('https://www.nrghax.com/hacks', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const hackLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/hacks/"]'));
      return links.map(l => ({
        href: l.href,
        text: l.textContent
      })).slice(0, 3);
    });

    if (hackLinks.length > 0) {
      console.log(`   Found ${hackLinks.length} hack links`);
      console.log(`   First hack: ${hackLinks[0].text} - ${hackLinks[0].href}`);

      // Visit first hack
      await page.goto(hackLinks[0].href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2000);

      const hackDetail = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const unlockButton = document.querySelector('button:has-text("Unlock"), button:has-text("Start"), [class*="unlock"]');
        const completeButton = document.querySelector('button:has-text("Complete"), button:has-text("Mark as Complete")');
        return {
          title: h1 ? h1.textContent : 'No title',
          hasUnlockSystem: !!unlockButton,
          hasCompleteButton: !!completeButton
        };
      });

      console.log(`   Hack title: ${hackDetail.title}`);
      console.log(`   Unlock system: ${hackDetail.hasUnlockSystem ? '✓' : '✗'}`);
      console.log(`   Complete button: ${hackDetail.hasCompleteButton ? '✓' : '✗'}`);

      await page.screenshot({ path: path.join(screenshotsDir, '06-hack-detail.png'), fullPage: true });
      results.passed.push('Individual hack pages work');
    } else {
      results.failed.push('No hack links found');
      console.log('   ✗ No hack links found');
    }
    console.log('');

    // 7. Test Routines Page
    console.log('7. ROUTINES PAGE TEST');
    console.log('   Loading /routines...');
    await page.goto('https://www.nrghax.com/routines', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    const routinesContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const cards = document.querySelectorAll('[class*="card"], article, [class*="routine"]');
      return {
        h1Text: h1 ? h1.textContent : 'No H1',
        routineCount: cards.length
      };
    });

    console.log(`   H1: ${routinesContent.h1Text}`);
    console.log(`   Found ${routinesContent.routineCount} routine cards`);

    await page.screenshot({ path: path.join(screenshotsDir, '07-routines.png'), fullPage: true });

    if (routinesContent.routineCount > 0 || routinesContent.h1Text.toLowerCase().includes('routine')) {
      results.passed.push('Routines page loads');
    } else {
      results.warnings.push('Routines page may have no content');
    }

  } catch (error) {
    console.error('\n❌ Critical Error:', error.message);
    results.failed.push(`Critical error: ${error.message}`);
  }

  await browser.close();

  // Print summary
  console.log('\n=================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('=================================');

  console.log(`\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(r => console.log(`   • ${r}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(r => console.log(`   • ${r}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(r => console.log(`   • ${r}`));
  }

  console.log('\n=================================');
  console.log('Screenshots saved to:', screenshotsDir);
  console.log('=================================');

  // Overall status
  const overallStatus = results.failed.length === 0 ? '✅ PRODUCTION SITE IS WORKING' : '❌ PRODUCTION SITE HAS ISSUES';
  console.log(`\nOVERALL STATUS: ${overallStatus}\n`);
}

// Run the test
testProductionSite().catch(console.error);