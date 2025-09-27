const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USER = {
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser_${Date.now()}`
};

const TEST_ADMIN = {
  email: 'admin@nrghax.com',
  password: 'admin123'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/${name}_${timestamp}.png`,
    fullPage: true
  });
  console.log(`  📸 Screenshot: ${name}`);
}

async function testPublicPages(page) {
  console.log('\n📄 PUBLIC PAGES TEST');
  console.log('━━━━━━━━━━━━━━━━━━━');

  // Homepage
  console.log('\n✓ Testing Homepage');
  await page.goto(BASE_URL);
  await delay(2000);
  await takeScreenshot(page, '01-homepage');

  const hasGetStarted = await page.$('button, a').then(async el => {
    if (el) {
      const text = await page.evaluate(e => e.textContent, el);
      return text.includes('Get Started');
    }
    return false;
  });
  console.log(`  ${hasGetStarted ? '✅' : '⚠️'} Get Started button found`);

  // Hacks page
  console.log('\n✓ Testing Hacks Page');
  await page.goto(`${BASE_URL}/hacks`);
  await delay(2000);
  await takeScreenshot(page, '02-hacks-page');
  const hackCards = await page.$$('article, div[class*="card"]');
  console.log(`  ✅ Found ${hackCards.length} hack items`);

  // Click on Login link
  console.log('\n✓ Testing Login Navigation');
  const loginLink = await page.$('a[href*="auth"], a:has-text("Login"), a:has-text("Sign In")');
  if (!loginLink) {
    // Try the header button
    await page.click('text=Login');
  }
  await delay(2000);
  await takeScreenshot(page, '03-login-page');
}

async function testUserSignup(page) {
  console.log('\n👤 USER SIGNUP TEST');
  console.log('━━━━━━━━━━━━━━━━━━━');

  // Navigate to auth page
  await page.goto(`${BASE_URL}/auth`);
  await delay(2000);

  // Fill signup form
  console.log('\n✓ Filling signup form');
  await page.type('input[type="email"]', TEST_USER.email);
  await page.type('input[type="password"]', TEST_USER.password);
  await takeScreenshot(page, '04-signup-filled');

  // Look for sign up button or toggle
  const signUpBtn = await page.$$eval('button', buttons =>
    buttons.find(btn => btn.textContent.toLowerCase().includes('sign up') ||
                        btn.textContent.toLowerCase().includes('create'))
  );

  if (signUpBtn) {
    await page.click('button:has-text("Sign Up")');
  } else {
    // Submit the form
    await page.keyboard.press('Enter');
  }

  await delay(3000);

  const currentUrl = page.url();
  console.log(`  📍 Redirected to: ${currentUrl}`);
  await takeScreenshot(page, '05-after-signup');

  if (currentUrl.includes('dashboard') || currentUrl.includes('onboarding')) {
    console.log('  ✅ Signup successful');
    return true;
  } else if (currentUrl.includes('auth')) {
    console.log('  ⚠️ Still on auth page - may need email verification');
    return false;
  }
  return false;
}

async function testUserDashboard(page) {
  console.log('\n🏠 USER DASHBOARD TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━');

  // Go to dashboard
  console.log('\n✓ Accessing Dashboard');
  await page.goto(`${BASE_URL}/dashboard`);
  await delay(2000);
  await takeScreenshot(page, '06-user-dashboard');

  const pageContent = await page.content();
  const hasDashboard = pageContent.toLowerCase().includes('dashboard');
  console.log(`  ${hasDashboard ? '✅' : '⚠️'} Dashboard loaded`);

  // Test Hacks section
  console.log('\n✓ Testing Hacks Management');
  const hacksLink = await page.$('a[href*="/hacks"], nav a:has-text("Hacks")');
  if (hacksLink) {
    await hacksLink.click();
    await delay(2000);
    await takeScreenshot(page, '07-user-hacks');
    console.log('  ✅ Hacks page accessible');
  }
}

async function testRoutineCreation(page) {
  console.log('\n📅 ROUTINE CREATION TEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━');

  // Navigate to routines
  console.log('\n✓ Navigating to Routines');
  await page.goto(`${BASE_URL}/dashboard/routines`);
  await delay(2000);
  await takeScreenshot(page, '08-routines-list');

  // Click new routine
  console.log('\n✓ Creating New Routine');
  await page.goto(`${BASE_URL}/dashboard/routines/new`);
  await delay(2000);
  await takeScreenshot(page, '09-new-routine-form');

  // Fill routine form
  const nameInput = await page.$('input[name="name"], input[id="name"]');
  const descInput = await page.$('textarea[name="description"], textarea[id="description"]');

  if (nameInput) {
    await page.type('input[name="name"], input[id="name"]', 'Morning Productivity Routine');
    console.log('  ✅ Name filled');
  }

  if (descInput) {
    await page.type('textarea[name="description"], textarea[id="description"]', 'E2E test routine for morning productivity boost');
    console.log('  ✅ Description filled');
  }

  await takeScreenshot(page, '10-routine-filled');

  // Submit
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await delay(3000);
    await takeScreenshot(page, '11-routine-created');
    console.log('  ✅ Routine submitted');
  }
}

async function testAdminFlow(page) {
  console.log('\n🔐 ADMIN FLOW TEST');
  console.log('━━━━━━━━━━━━━━━━━━');

  // Sign out first
  console.log('\n✓ Signing out current user');
  await page.goto(`${BASE_URL}/auth`);
  await delay(1000);

  // Sign in as admin
  console.log('\n✓ Signing in as Admin');
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.value = '');
  });

  await page.type('input[type="email"]', TEST_ADMIN.email);
  await page.type('input[type="password"]', TEST_ADMIN.password);
  await takeScreenshot(page, '12-admin-login');

  // Find and click sign in
  await page.keyboard.press('Enter');
  await delay(3000);

  // Test admin pages
  console.log('\n✓ Testing Admin Pages');

  // Admin Hacks
  await page.goto(`${BASE_URL}/admin/hacks`);
  await delay(2000);
  await takeScreenshot(page, '13-admin-hacks');
  const adminHacksUrl = page.url();
  console.log(`  ${adminHacksUrl.includes('admin') ? '✅' : '⚠️'} Admin hacks page ${adminHacksUrl.includes('admin') ? 'accessible' : 'blocked'}`);

  // Admin Users
  await page.goto(`${BASE_URL}/admin/users`);
  await delay(2000);
  await takeScreenshot(page, '14-admin-users');
  const adminUsersUrl = page.url();
  console.log(`  ${adminUsersUrl.includes('admin') ? '✅' : '⚠️'} Admin users page ${adminUsersUrl.includes('admin') ? 'accessible' : 'blocked'}`);

  // Admin Routines
  await page.goto(`${BASE_URL}/admin/routines`);
  await delay(2000);
  await takeScreenshot(page, '15-admin-routines');
  const adminRoutinesUrl = page.url();
  console.log(`  ${adminRoutinesUrl.includes('admin') ? '✅' : '⚠️'} Admin routines page ${adminRoutinesUrl.includes('admin') ? 'accessible' : 'blocked'}`);
}

async function runTests() {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║     NRGHax E2E Test Suite        ║');
  console.log('╚══════════════════════════════════╝');
  console.log(`\nTesting: ${BASE_URL}\n`);

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  // Suppress console errors for cleaner output
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Failed to load resource')) {
      // Ignore 404s for favicon etc
      return;
    }
    if (msg.type() === 'error') {
      console.log('  ⚠️ Browser error:', msg.text());
    }
  });

  try {
    // Run test suites
    await testPublicPages(page);

    const signupSuccess = await testUserSignup(page);
    if (signupSuccess) {
      await testUserDashboard(page);
      await testRoutineCreation(page);
    }

    await testAdminFlow(page);

    console.log('\n╔══════════════════════════════════╗');
    console.log('║        ✅ TESTS COMPLETED        ║');
    console.log('╚══════════════════════════════════╝');
    console.log(`\n📁 Screenshots saved in: ./screenshots/\n`);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    await takeScreenshot(page, 'error-final');
  } finally {
    await browser.close();
  }
}

// Run tests
runTests().catch(console.error);