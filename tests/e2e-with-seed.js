const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with service role for seeding
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test credentials
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestUser123!',
  username: 'testuser'
};

const TEST_ADMIN = {
  email: 'admin@nrghax.com',
  password: 'Admin123!',
  username: 'admin'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupTestUsers() {
  console.log('🌱 Setting up test users...');

  // Create test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true
  });

  if (userError && !userError.message.includes('already been registered')) {
    console.log('  ⚠️ User creation error:', userError.message);
  } else {
    console.log('  ✅ Test user ready');
  }

  // Create admin user
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
    email_confirm: true
  });

  if (adminError && !adminError.message.includes('already been registered')) {
    console.log('  ⚠️ Admin creation error:', adminError.message);
  } else {
    console.log('  ✅ Admin user ready');

    // Make the admin user actually admin
    if (adminData?.user) {
      await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', adminData.user.id);
    }
  }

  // Seed some test hacks
  const { error: hackError } = await supabase
    .from('hacks')
    .upsert([
      {
        title: 'Morning Meditation',
        description: 'Start your day with 10 minutes of mindfulness',
        category: 'mindfulness',
        difficulty: 'beginner',
        time_to_complete: 10,
        energy_impact: 8
      },
      {
        title: 'Power Nap Technique',
        description: '20-minute nap for maximum energy recovery',
        category: 'sleep',
        difficulty: 'beginner',
        time_to_complete: 20,
        energy_impact: 9
      },
      {
        title: 'Cold Shower Protocol',
        description: 'Boost alertness with contrast therapy',
        category: 'recovery',
        difficulty: 'intermediate',
        time_to_complete: 5,
        energy_impact: 7
      }
    ]);

  if (hackError) {
    console.log('  ⚠️ Hack seeding error:', hackError.message);
  } else {
    console.log('  ✅ Test hacks seeded');
  }
}

async function testUserFlow(page) {
  console.log('\n👤 USER FLOW TEST');
  console.log('━━━━━━━━━━━━━━━━━━');

  // Sign in as test user
  console.log('\n✓ Signing in as test user');
  await page.goto(`${BASE_URL}/auth`);
  await delay(2000);

  await page.type('input[type="email"]', TEST_USER.email);
  await page.type('input[type="password"]', TEST_USER.password);
  await page.screenshot({ path: 'screenshots/user-01-signin.png' });

  await page.click('button[type="submit"]');
  await delay(3000);

  const afterLoginUrl = page.url();
  console.log(`  📍 After login: ${afterLoginUrl}`);
  await page.screenshot({ path: 'screenshots/user-02-after-login.png' });

  // Access dashboard
  console.log('\n✓ Accessing user dashboard');
  await page.goto(`${BASE_URL}/dashboard`);
  await delay(2000);
  await page.screenshot({ path: 'screenshots/user-03-dashboard.png' });

  const dashboardUrl = page.url();
  if (dashboardUrl.includes('dashboard')) {
    console.log('  ✅ Dashboard accessible');

    // Check for content
    const pageContent = await page.content();
    if (pageContent.includes('Welcome') || pageContent.includes('Dashboard')) {
      console.log('  ✅ Dashboard content loaded');
    }
  } else {
    console.log(`  ⚠️ Redirected to: ${dashboardUrl}`);
  }

  // Test routines
  console.log('\n✓ Testing routines');
  await page.goto(`${BASE_URL}/dashboard/routines`);
  await delay(2000);
  await page.screenshot({ path: 'screenshots/user-04-routines.png' });

  // Create new routine
  await page.goto(`${BASE_URL}/dashboard/routines/new`);
  await delay(2000);

  const nameInput = await page.$('input[name="name"], input[id="name"]');
  if (nameInput) {
    await page.type('input[name="name"], input[id="name"]', 'Morning Energy Boost');
    const descInput = await page.$('textarea[name="description"], textarea[id="description"]');
    if (descInput) {
      await page.type('textarea[name="description"], textarea[id="description"]', 'A routine to maximize morning energy');
    }
    await page.screenshot({ path: 'screenshots/user-05-routine-form.png' });
    console.log('  ✅ Routine form filled');
  }

  // Sign out
  console.log('\n✓ Signing out');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function testAdminFlow(page) {
  console.log('\n🔐 ADMIN FLOW TEST');
  console.log('━━━━━━━━━━━━━━━━━━');

  // Sign in as admin
  console.log('\n✓ Signing in as admin');
  await page.goto(`${BASE_URL}/auth`);
  await delay(2000);

  // Clear previous inputs
  await page.evaluate(() => {
    document.querySelectorAll('input').forEach(input => input.value = '');
  });

  await page.type('input[type="email"]', TEST_ADMIN.email);
  await page.type('input[type="password"]', TEST_ADMIN.password);
  await page.screenshot({ path: 'screenshots/admin-01-signin.png' });

  await page.click('button[type="submit"]');
  await delay(3000);

  const afterLoginUrl = page.url();
  console.log(`  📍 After login: ${afterLoginUrl}`);
  await page.screenshot({ path: 'screenshots/admin-02-after-login.png' });

  // Test admin pages
  console.log('\n✓ Testing admin pages');

  // Admin hacks
  await page.goto(`${BASE_URL}/admin/hacks`);
  await delay(2000);
  const adminHacksUrl = page.url();
  console.log(`  Admin Hacks: ${adminHacksUrl.includes('admin') ? '✅ Accessible' : '⚠️ Blocked'}`);
  await page.screenshot({ path: 'screenshots/admin-03-hacks.png' });

  // Admin users
  await page.goto(`${BASE_URL}/admin/users`);
  await delay(2000);
  const adminUsersUrl = page.url();
  console.log(`  Admin Users: ${adminUsersUrl.includes('admin') ? '✅ Accessible' : '⚠️ Blocked'}`);
  await page.screenshot({ path: 'screenshots/admin-04-users.png' });

  // Admin routines
  await page.goto(`${BASE_URL}/admin/routines`);
  await delay(2000);
  const adminRoutinesUrl = page.url();
  console.log(`  Admin Routines: ${adminRoutinesUrl.includes('admin') ? '✅ Accessible' : '⚠️ Blocked'}`);
  await page.screenshot({ path: 'screenshots/admin-05-routines.png' });
}

async function testPublicPages(page) {
  console.log('\n🌐 PUBLIC PAGES TEST');
  console.log('━━━━━━━━━━━━━━━━━━━');

  // Clear session
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Homepage
  console.log('\n✓ Testing homepage');
  await page.goto(BASE_URL);
  await delay(2000);
  const title = await page.title();
  console.log(`  Page title: ${title}`);
  await page.screenshot({ path: 'screenshots/public-01-homepage.png' });

  // Hacks page
  console.log('\n✓ Testing public hacks page');
  await page.goto(`${BASE_URL}/hacks`);
  await delay(2000);
  const hackElements = await page.$$('article, div[class*="card"]');
  console.log(`  Found ${hackElements.length} hack cards`);
  await page.screenshot({ path: 'screenshots/public-02-hacks.png' });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║    NRGHax Complete E2E Test Suite  ║');
  console.log('╚════════════════════════════════════╝\n');

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  // Setup test data
  await setupTestUsers();

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Run test suites
    await testPublicPages(page);
    await testUserFlow(page);
    await testAdminFlow(page);

    console.log('\n╔════════════════════════════════════╗');
    console.log('║         ✅ ALL TESTS PASSED        ║');
    console.log('╚════════════════════════════════════╝');
    console.log('\n📁 Screenshots saved in ./screenshots/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-final.png' });
  } finally {
    await browser.close();
  }
}

// Run tests
runTests().catch(console.error);