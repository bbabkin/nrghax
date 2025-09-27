const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimpleTests() {
  console.log('\n🚀 NRGHax E2E Test - Simple Flow\n');
  console.log('═══════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Test 1: Homepage
    console.log('1. Testing Homepage');
    await page.goto(BASE_URL);
    await delay(2000);
    const title = await page.title();
    console.log(`   ✅ Page title: ${title}`);
    await page.screenshot({ path: 'screenshots/test-01-homepage.png' });

    // Test 2: Click on "Get Started" or "Sign Up"
    console.log('\n2. Testing Navigation to Auth');
    const getStartedBtn = await page.$('.bg-purple-600, .bg-pink-600, button[class*="purple"], button[class*="pink"]');
    if (getStartedBtn) {
      await getStartedBtn.click();
      await delay(2000);
      console.log(`   ✅ Clicked Get Started button`);
    } else {
      // Try clicking Sign Up from header
      await page.goto(`${BASE_URL}/auth`);
      await delay(2000);
      console.log(`   ✅ Navigated to /auth directly`);
    }
    await page.screenshot({ path: 'screenshots/test-02-auth-page.png' });

    // Test 3: Fill auth form
    console.log('\n3. Testing Auth Form');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');

    if (emailInput && passwordInput) {
      const testEmail = `test_${Date.now()}@example.com`;
      await page.type('input[type="email"]', testEmail);
      await page.type('input[type="password"]', 'TestPassword123!');
      console.log(`   ✅ Filled auth form with: ${testEmail}`);
      await page.screenshot({ path: 'screenshots/test-03-auth-filled.png' });

      // Submit form
      await page.keyboard.press('Enter');
      await delay(3000);
      const newUrl = page.url();
      console.log(`   📍 After submit, URL: ${newUrl}`);
      await page.screenshot({ path: 'screenshots/test-04-after-auth.png' });
    } else {
      console.log('   ⚠️ Auth form not found');
    }

    // Test 4: Check Hacks page
    console.log('\n4. Testing Hacks Page');
    await page.goto(`${BASE_URL}/hacks`);
    await delay(2000);
    const hackElements = await page.$$('article, .card, div[class*="hack"]');
    console.log(`   ✅ Found ${hackElements.length} hack elements`);
    await page.screenshot({ path: 'screenshots/test-05-hacks.png' });

    // Test 5: Try Dashboard
    console.log('\n5. Testing Dashboard Access');
    await page.goto(`${BASE_URL}/dashboard`);
    await delay(2000);
    const dashboardUrl = page.url();
    if (dashboardUrl.includes('dashboard')) {
      console.log('   ✅ Dashboard accessible');
    } else {
      console.log(`   ⚠️ Redirected to: ${dashboardUrl}`);
    }
    await page.screenshot({ path: 'screenshots/test-06-dashboard.png' });

    // Test 6: Try Admin area
    console.log('\n6. Testing Admin Area');
    await page.goto(`${BASE_URL}/admin/hacks`);
    await delay(2000);
    const adminUrl = page.url();
    if (adminUrl.includes('admin')) {
      console.log('   ✅ Admin area accessible');
    } else {
      console.log(`   ⚠️ Redirected to: ${adminUrl}`);
    }
    await page.screenshot({ path: 'screenshots/test-07-admin.png' });

    console.log('\n═══════════════════════════════════');
    console.log('✅ All tests completed!');
    console.log('📁 Screenshots saved in ./screenshots/');
    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run tests
runSimpleTests().catch(console.error);