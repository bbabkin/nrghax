const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'http://127.0.0.1:54321';

// Test user credentials
const TEST_USER = {
  email: `testuser_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser_${Date.now()}`
};

const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
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

async function testUserSignupFlow(page) {
  console.log('\n🧪 Testing User Signup Flow...');

  // Navigate to signup page
  await page.goto(`${BASE_URL}/auth/signin`);
  await delay(1000);
  await takeScreenshot(page, '01-signin-page');

  // Click on sign up link
  const signupLink = await page.$('a[href*="signup"]');
  if (signupLink) {
    await signupLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  } else {
    await page.goto(`${BASE_URL}/auth/signup`);
  }

  await delay(1000);
  await takeScreenshot(page, '02-signup-page');

  // Fill signup form
  await page.type('input[name="email"]', TEST_USER.email);
  await page.type('input[name="password"]', TEST_USER.password);
  await page.type('input[name="username"]', TEST_USER.username);

  await takeScreenshot(page, '03-signup-filled');

  // Submit form
  await page.click('button[type="submit"]');
  await delay(3000);

  // Check for success or redirect
  const currentUrl = page.url();
  console.log(`After signup, redirected to: ${currentUrl}`);
  await takeScreenshot(page, '04-after-signup');

  if (currentUrl.includes('/dashboard') || currentUrl.includes('/onboarding')) {
    console.log('✅ Signup successful - redirected to dashboard/onboarding');
    return true;
  }

  return false;
}

async function testUserDashboard(page) {
  console.log('\n🧪 Testing User Dashboard...');

  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard`);
  await delay(2000);
  await takeScreenshot(page, '05-dashboard');

  // Check for key dashboard elements
  const dashboardTitle = await page.$('h1, h2');
  if (dashboardTitle) {
    const titleText = await page.evaluate(el => el.textContent, dashboardTitle);
    console.log(`Dashboard title: ${titleText}`);
  }

  // Look for hack cards or content
  const hackCards = await page.$$('[data-testid*="hack"], .hack-card, article');
  console.log(`Found ${hackCards.length} hack cards`);

  await takeScreenshot(page, '06-dashboard-content');
}

async function testHackCreation(page) {
  console.log('\n🧪 Testing Hack Creation...');

  // Navigate to hacks page
  await page.goto(`${BASE_URL}/dashboard/hacks`);
  await delay(2000);
  await takeScreenshot(page, '07-hacks-page');

  // Look for create/add button
  const createButton = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a[href*="new"]');
  if (createButton) {
    await createButton.click();
    await delay(2000);
    await takeScreenshot(page, '08-hack-create-form');

    // Fill hack form
    await page.type('input[name="title"]', 'Test Hack - E2E');
    await page.type('textarea[name="description"], input[name="description"]', 'This is a test hack created via E2E testing');

    // Select category if exists
    const categorySelect = await page.$('select[name="category"]');
    if (categorySelect) {
      await page.select('select[name="category"]', 'productivity');
    }

    // Add tags if field exists
    const tagsInput = await page.$('input[name="tags"]');
    if (tagsInput) {
      await page.type('input[name="tags"]', 'test, e2e, automation');
    }

    await takeScreenshot(page, '09-hack-form-filled');

    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await delay(3000);
      await takeScreenshot(page, '10-hack-created');
      console.log('✅ Hack creation form submitted');
    }
  } else {
    console.log('⚠️ Create hack button not found');
  }
}

async function testRoutineCreation(page) {
  console.log('\n🧪 Testing Routine Creation...');

  // Navigate to routines page
  await page.goto(`${BASE_URL}/dashboard/routines`);
  await delay(2000);
  await takeScreenshot(page, '11-routines-page');

  // Look for create button
  const createButton = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a[href*="new"]');
  if (createButton) {
    await createButton.click();
    await delay(2000);
    await takeScreenshot(page, '12-routine-create-form');

    // Fill routine form
    await page.type('input[name="name"]', 'Test Routine - E2E');
    await page.type('textarea[name="description"], input[name="description"]', 'Morning productivity routine for E2E testing');

    // Set time if field exists
    const timeInput = await page.$('input[type="time"], input[name="time_of_day"]');
    if (timeInput) {
      await page.type('input[type="time"], input[name="time_of_day"]', '08:00');
    }

    await takeScreenshot(page, '13-routine-form-filled');

    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await delay(3000);
      await takeScreenshot(page, '14-routine-created');
      console.log('✅ Routine creation form submitted');
    }
  } else {
    console.log('⚠️ Create routine button not found');
  }
}

async function testAdminLogin(page) {
  console.log('\n🧪 Testing Admin Login...');

  // Logout first if needed
  await page.goto(`${BASE_URL}/auth/signout`);
  await delay(1000);

  // Navigate to signin
  await page.goto(`${BASE_URL}/auth/signin`);
  await delay(1000);
  await takeScreenshot(page, '15-admin-signin');

  // Fill admin credentials
  await page.type('input[name="email"]', TEST_ADMIN.email);
  await page.type('input[name="password"]', TEST_ADMIN.password);

  await takeScreenshot(page, '16-admin-credentials');

  // Submit
  await page.click('button[type="submit"]');
  await delay(3000);

  const currentUrl = page.url();
  console.log(`After admin login, redirected to: ${currentUrl}`);
  await takeScreenshot(page, '17-admin-logged-in');

  return currentUrl.includes('/admin') || currentUrl.includes('/dashboard');
}

async function testAdminDashboard(page) {
  console.log('\n🧪 Testing Admin Dashboard...');

  // Navigate to admin area
  await page.goto(`${BASE_URL}/admin`);
  await delay(2000);
  await takeScreenshot(page, '18-admin-dashboard');

  // Check for admin features
  const adminTitle = await page.$('h1:has-text("Admin"), h2:has-text("Admin")');
  if (adminTitle) {
    console.log('✅ Admin dashboard loaded');
  }

  // Check for user management
  await page.goto(`${BASE_URL}/admin/users`);
  await delay(2000);
  await takeScreenshot(page, '19-admin-users');

  // Check for hack moderation
  await page.goto(`${BASE_URL}/admin/hacks`);
  await delay(2000);
  await takeScreenshot(page, '20-admin-hacks');
}

async function runTests() {
  console.log('🚀 Starting E2E Tests for NRGHax');
  console.log(`Testing against: ${BASE_URL}`);

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
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

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  try {
    // Test User Flows
    console.log('\n═══════════════════════════════════');
    console.log('📝 USER FLOW TESTS');
    console.log('═══════════════════════════════════');

    const signupSuccess = await testUserSignupFlow(page);
    if (signupSuccess) {
      await testUserDashboard(page);
      await testHackCreation(page);
      await testRoutineCreation(page);
    }

    // Test Admin Flows
    console.log('\n═══════════════════════════════════');
    console.log('🔐 ADMIN FLOW TESTS');
    console.log('═══════════════════════════════════');

    const adminLoginSuccess = await testAdminLogin(page);
    if (adminLoginSuccess) {
      await testAdminDashboard(page);
    }

    console.log('\n✅ All E2E tests completed!');
    console.log(`Screenshots saved in: ./screenshots/`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await takeScreenshot(page, 'error-state');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(console.error);