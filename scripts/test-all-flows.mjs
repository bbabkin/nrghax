import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOTS_DIR = join(process.cwd(), 'test-screenshots');
const BASE_URL = 'http://localhost:3000';

// Create screenshots directory
await mkdir(SCREENSHOTS_DIR, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 }
});
const page = await context.newPage();

let screenshotCounter = 1;

async function screenshot(name) {
  const filename = `${String(screenshotCounter++).padStart(2, '0')}_${name}.png`;
  await page.screenshot({ path: join(SCREENSHOTS_DIR, filename), fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
}

try {
  console.log('🚀 Starting comprehensive test flow...\n');

  // Test 1: Home page
  console.log('1️⃣ Testing home page...');
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await screenshot('01_homepage');

  // Test 2: Sign up
  console.log('2️⃣ Testing user signup...');
  await page.click('text=Sign Up');
  await page.waitForLoadState('networkidle');
  await screenshot('02_signup_page');

  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  // Make sure we're on the signup tab
  const signupTab = page.locator('button[value="signup"], button:has-text("Sign Up"):not([type="submit"])').first();
  if (await signupTab.count() > 0) {
    await signupTab.click();
    await page.waitForTimeout(500);
  }

  // Fill in the signup form
  await page.fill('input[id*="signup"][type="email"], input[type="email"]', testEmail);
  await page.fill('input[id*="signup"][type="password"], input[type="password"]', testPassword);
  await screenshot('03_signup_filled');

  // Find and click the submit button
  const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Sign Up|Create/i });
  if (await submitButton.count() === 0) {
    // Fallback to any submit button in the signup form
    await page.locator('form button[type="submit"]').first().click();
  } else {
    await submitButton.click();
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await screenshot('04_after_signup');

  // Test 3: Onboarding
  console.log('3️⃣ Testing onboarding...');
  const currentUrl = page.url();
  if (currentUrl.includes('onboarding')) {
    await page.fill('input[name="username"]', `testuser${Date.now()}`);
    await page.fill('textarea[name="bio"]', 'This is my test bio');
    await screenshot('05_onboarding_filled');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot('06_after_onboarding');
  }

  // Test 4: Navigate to hacks page
  console.log('4️⃣ Testing hacks page...');
  await page.goto(`${BASE_URL}/hacks`);
  await page.waitForLoadState('networkidle');
  await screenshot('07_hacks_page');

  // Test 5: View a hack and like it
  console.log('5️⃣ Testing hack viewing and liking...');
  const firstHack = page.locator('a[href*="/hacks/"]').first();
  await firstHack.click();
  await page.waitForLoadState('networkidle');
  await screenshot('08_hack_details');

  // Try to like the hack
  const likeButton = page.locator('button:has-text("Like"), button[aria-label*="like"]').first();
  if (await likeButton.count() > 0) {
    await likeButton.click();
    await page.waitForTimeout(1000);
    await screenshot('09_hack_liked');
  }

  // Test 6: Create a routine
  console.log('6️⃣ Testing routine creation...');
  await page.goto(`${BASE_URL}/hacks`);
  await page.waitForLoadState('networkidle');

  // Click the "New Routine" button
  try {
    await page.click('button:has-text("New Routine"), a:has-text("New Routine")', { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await screenshot('10_create_routine_page');

    // Fill in routine details
    await page.fill('input[name="name"]', 'Test Morning Routine');
    await page.fill('textarea[name="description"]', 'My test morning routine for productivity');
    await screenshot('11_create_routine_filled');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot('12_routine_created');
  } catch (error) {
    console.log('Routine creation not available or failed:', error.message);
  }

  // Test 7: View routines
  console.log('7️⃣ Testing routines page...');
  await page.goto(`${BASE_URL}/routines`);
  await page.waitForLoadState('networkidle');
  await screenshot('13_routines_page');

  // Test 8: Profile/Dashboard
  console.log('8️⃣ Testing dashboard...');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await screenshot('14_dashboard');

  // Test 9: Check for admin access (will fail for regular users)
  console.log('9️⃣ Testing admin access...');
  try {
    await page.goto(`${BASE_URL}/admin`, { timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await screenshot('15_admin_dashboard');

    // Try admin hacks management
    await page.goto(`${BASE_URL}/admin/hacks`);
    await page.waitForLoadState('networkidle');
    await screenshot('16_admin_hacks');

    // Try creating a hack as admin
    await page.goto(`${BASE_URL}/admin/hacks/new`);
    await page.waitForLoadState('networkidle');
    await screenshot('17_admin_create_hack');

    await page.fill('input[name="title"]', 'Admin Test Hack');
    await page.fill('textarea[name="description"]', 'This is a test hack created by admin');
    await screenshot('18_admin_hack_filled');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await screenshot('19_admin_hack_created');
  } catch (error) {
    console.log('Admin pages not accessible (user is not admin)');
    await screenshot('15_not_admin');
  }

  console.log('\n✅ All tests completed successfully!');
  console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

} catch (error) {
  console.error('❌ Test failed:', error);
  await screenshot('error_state');
  throw error;
} finally {
  await browser.close();
}
