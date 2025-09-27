const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser_${Date.now()}`
};

const TEST_ADMIN = {
  email: 'admin@nrghax.com',
  password: 'admin123',
  username: 'admin'
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
  console.log(`📸 Screenshot saved: ${name}_${timestamp}.png`);
}

async function testHomePage(page) {
  console.log('\n🧪 Testing Home Page...');

  await page.goto(BASE_URL);
  await delay(2000);
  await takeScreenshot(page, '01-homepage');

  // Click on Login button
  const loginButton = await page.$('a:has-text("Login"), button:has-text("Login")');
  if (loginButton) {
    console.log('✅ Found Login button');
  }

  // Click on Sign Up button
  const signupButton = await page.$('a:has-text("Sign Up"), button:has-text("Sign Up")');
  if (signupButton) {
    console.log('✅ Found Sign Up button');
  }
}

async function testAuthFlow(page) {
  console.log('\n🧪 Testing Auth Page...');

  // Navigate to auth page
  await page.goto(`${BASE_URL}/auth`);
  await delay(2000);
  await takeScreenshot(page, '02-auth-page');

  // Check for auth form elements
  const emailInput = await page.$('input[type="email"], input[placeholder*="email" i]');
  const passwordInput = await page.$('input[type="password"]');

  if (emailInput && passwordInput) {
    console.log('✅ Auth form found');

    // Try signup
    await page.type('input[type="email"], input[placeholder*="email" i]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);

    await takeScreenshot(page, '03-auth-filled');

    // Look for signup/signin toggle or submit
    const signupButton = await page.$('button:has-text("Sign Up"), button:has-text("Create Account")');
    if (signupButton) {
      await signupButton.click();
    } else {
      // Try submitting the form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
    }

    await delay(3000);
    await takeScreenshot(page, '04-after-auth');

    const currentUrl = page.url();
    console.log(`After auth, redirected to: ${currentUrl}`);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/onboarding')) {
      console.log('✅ Auth successful');
      return true;
    }
  } else {
    console.log('⚠️ Auth form not found');
  }

  return false;
}

async function testDashboard(page) {
  console.log('\n🧪 Testing Dashboard...');

  await page.goto(`${BASE_URL}/dashboard`);
  await delay(2000);
  await takeScreenshot(page, '05-dashboard');

  const pageContent = await page.content();
  if (pageContent.includes('Dashboard') || pageContent.includes('Welcome')) {
    console.log('✅ Dashboard loaded');
  }
}

async function testHacksPage(page) {
  console.log('\n🧪 Testing Hacks Page...');

  await page.goto(`${BASE_URL}/hacks`);
  await delay(2000);
  await takeScreenshot(page, '06-hacks-page');

  const hackElements = await page.$$('article, .hack-card, [class*="hack"]');
  console.log(`Found ${hackElements.length} hack elements`);

  if (hackElements.length > 0) {
    console.log('✅ Hacks displayed');
  }
}

async function testRoutinesPage(page) {
  console.log('\n🧪 Testing Routines Page...');

  await page.goto(`${BASE_URL}/routines`);
  await delay(2000);
  await takeScreenshot(page, '07-routines-page');

  // Check for new routine button
  const newRoutineButton = await page.$('a[href*="/routines/new"], button:has-text("Create"), button:has-text("New")');
  if (newRoutineButton) {
    console.log('✅ New routine button found');
    await newRoutineButton.click();
    await delay(2000);
    await takeScreenshot(page, '08-new-routine-form');
  }
}

async function testUserRoutineCreation(page) {
  console.log('\n🧪 Testing User Routine Creation...');

  await page.goto(`${BASE_URL}/dashboard/routines/new`);
  await delay(2000);
  await takeScreenshot(page, '09-dashboard-routine-new');

  // Try to fill the form
  const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
  const descInput = await page.$('textarea[name="description"], input[name="description"]');

  if (nameInput) {
    await page.type('input[name="name"], input[placeholder*="name" i]', 'Test Morning Routine');
    console.log('✅ Filled routine name');
  }

  if (descInput) {
    await page.type('textarea[name="description"], input[name="description"]', 'A test routine for E2E testing');
    console.log('✅ Filled routine description');
  }

  await takeScreenshot(page, '10-routine-form-filled');

  const submitButton = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
  if (submitButton) {
    await submitButton.click();
    await delay(3000);
    await takeScreenshot(page, '11-routine-created');
    console.log('✅ Routine form submitted');
  }
}

async function testAdminAccess(page) {
  console.log('\n🧪 Testing Admin Access...');

  // First, sign out
  await page.goto(`${BASE_URL}/auth`);
  await delay(1000);

  // Sign in as admin
  await page.type('input[type="email"], input[placeholder*="email" i]', TEST_ADMIN.email);
  await page.type('input[type="password"]', TEST_ADMIN.password);

  await takeScreenshot(page, '12-admin-login');

  const signinButton = await page.$('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
  if (signinButton) {
    await signinButton.click();
    await delay(3000);
  }

  // Try to access admin pages
  await page.goto(`${BASE_URL}/admin/hacks`);
  await delay(2000);
  await takeScreenshot(page, '13-admin-hacks');

  await page.goto(`${BASE_URL}/admin/users`);
  await delay(2000);
  await takeScreenshot(page, '14-admin-users');

  await page.goto(`${BASE_URL}/admin/routines`);
  await delay(2000);
  await takeScreenshot(page, '15-admin-routines');

  const currentUrl = page.url();
  if (currentUrl.includes('/admin')) {
    console.log('✅ Admin access granted');
  } else {
    console.log('⚠️ Admin access denied or redirected');
  }
}

async function runTests() {
  console.log('🚀 Starting E2E Tests for NRGHax');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('═══════════════════════════════════\n');

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

  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  try {
    // Test public pages first
    await testHomePage(page);
    await testHacksPage(page);
    await testRoutinesPage(page);

    // Test authentication
    const authSuccess = await testAuthFlow(page);

    if (authSuccess) {
      // Test authenticated user features
      await testDashboard(page);
      await testUserRoutineCreation(page);
    }

    // Test admin features
    await testAdminAccess(page);

    console.log('\n═══════════════════════════════════');
    console.log('✅ E2E tests completed!');
    console.log(`Screenshots saved in: ./screenshots/`);
    console.log('═══════════════════════════════════');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(console.error);