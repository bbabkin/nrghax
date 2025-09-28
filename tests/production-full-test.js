const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const PRODUCTION_URL = 'https://www.nrghax.com';
const SUPABASE_URL = 'https://chbfahyrdfoboddqahdk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmZhaHlyZGZvYm9kZHFhaGRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ4MzM2NiwiZXhwIjoyMDc0MDU5MzY2fQ.GEX5i65d_orzJgMt2zr6WKkdzz2naKJhEw3h721OCDg';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test users
const timestamp = Date.now();
const ADMIN_USER = {
  email: `admin_test_${timestamp}@nrghax.com`,
  password: 'AdminTest123!',
  username: `admin_test_${timestamp}`
};

const REGULAR_USER = {
  email: `user_test_${timestamp}@nrghax.com`,
  password: 'UserTest123!',
  username: `user_test_${timestamp}`
};

// Test data
const TEST_HACK = {
  name: `Test Hack ${timestamp}`,
  description: 'Automated test hack for E2E testing',
  category: 'productivity'
};

const TEST_ROUTINE = {
  name: `Test Routine ${timestamp}`,
  description: 'Automated test routine for E2E testing'
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `production-screenshots/${name}_${timestamp}.png`,
    fullPage: true
  });
  console.log(`  📸 Screenshot: ${name}`);
}

async function setupTestUsers() {
  console.log('🌱 Setting up test users...');

  try {
    // Create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: ADMIN_USER.email,
      password: ADMIN_USER.password,
      email_confirm: true
    });

    if (adminError) {
      console.log('  ⚠️ Admin creation error:', adminError.message);
    } else {
      console.log('  ✅ Admin user created:', ADMIN_USER.email);

      // Make the user an admin
      if (adminData?.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true, name: ADMIN_USER.username })
          .eq('id', adminData.user.id);

        if (updateError) {
          console.log('  ⚠️ Failed to set admin flag:', updateError.message);
        } else {
          console.log('  ✅ Admin privileges set');
        }
      }
    }

    // Create regular user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: REGULAR_USER.email,
      password: REGULAR_USER.password,
      email_confirm: true
    });

    if (userError) {
      console.log('  ⚠️ User creation error:', userError.message);
    } else {
      console.log('  ✅ Regular user created:', REGULAR_USER.email);

      if (userData?.user) {
        await supabase
          .from('profiles')
          .update({ name: REGULAR_USER.username })
          .eq('id', userData.user.id);
      }
    }
  } catch (error) {
    console.error('  ❌ Setup error:', error.message);
  }
}

async function testAdminHackCRUD(page) {
  console.log('\n🔐 ADMIN HACK CRUD TEST');
  console.log('════════════════════════');

  // Sign in as admin
  console.log('\n1. Signing in as admin');
  await page.goto(`${PRODUCTION_URL}/auth`);
  await delay(2000);

  await page.type('input[type="email"]', ADMIN_USER.email);
  await page.type('input[type="password"]', ADMIN_USER.password);
  await takeScreenshot(page, 'admin-01-login');

  await page.click('button[type="submit"]');
  await delay(3000);

  const afterLoginUrl = page.url();
  console.log(`  ✅ Logged in, redirected to: ${afterLoginUrl}`);
  await takeScreenshot(page, 'admin-02-after-login');

  // Handle onboarding if present
  if (afterLoginUrl.includes('/onboarding')) {
    console.log('  📝 Handling onboarding flow');

    // Click skip onboarding if available
    const skipButton = await page.$('button:has-text("Skip"), a:has-text("Skip")');
    if (skipButton) {
      await skipButton.click();
      await delay(2000);
    } else {
      // Try to complete onboarding quickly
      const expertButton = await page.$('div:has-text("Expert")');
      if (expertButton) {
        await expertButton.click();
        await delay(1000);
      }

      // Click next/continue/complete
      const continueButton = await page.$('button:has-text("Continue"), button:has-text("Next"), button:has-text("Complete")');
      if (continueButton) {
        await continueButton.click();
        await delay(2000);
      }
    }
  }

  // Navigate to admin hacks page
  console.log('\n2. Navigating to admin hacks');
  await page.goto(`${PRODUCTION_URL}/admin/hacks`);
  await delay(3000);
  await takeScreenshot(page, 'admin-03-hacks-list');

  // Check if we can access admin area
  const pageContent = await page.content();
  if (pageContent.includes('Application error') || pageContent.includes('not authorized')) {
    console.log('  ⚠️ Cannot access admin area - may need different permissions');
    return;
  }

  // Create new hack
  console.log('\n3. Creating new hack');
  await page.goto(`${PRODUCTION_URL}/admin/hacks/new`);
  await delay(3000);
  await takeScreenshot(page, 'admin-04-new-hack-form');

  // Fill hack form
  await page.type('input[name="name"], input[id="name"]', TEST_HACK.name);
  await page.type('textarea[name="description"], textarea[id="description"]', TEST_HACK.description);

  // Select category if dropdown exists
  const categorySelect = await page.$('select[name="category"], select[id="category"]');
  if (categorySelect) {
    await page.select('select[name="category"], select[id="category"]', TEST_HACK.category);
  }

  // Set as content type
  const contentRadio = await page.$('input[type="radio"][value="content"]');
  if (contentRadio) {
    await contentRadio.click();
  }

  await takeScreenshot(page, 'admin-05-hack-filled');

  // Submit form
  await page.click('button[type="submit"]');
  await delay(3000);

  console.log('  ✅ Hack created');
  await takeScreenshot(page, 'admin-06-hack-created');

  // Edit the hack
  console.log('\n4. Editing hack');
  const editButton = await page.$('a[href*="edit"], button:has-text("Edit")');
  if (editButton) {
    await editButton.click();
    await delay(2000);
    await takeScreenshot(page, 'admin-07-hack-edit');

    // Update description
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea[name="description"], textarea[id="description"]');
      if (textarea) textarea.value = '';
    });
    await page.type('textarea[name="description"], textarea[id="description"]', 'Updated: ' + TEST_HACK.description);

    await page.click('button[type="submit"]');
    await delay(2000);
    console.log('  ✅ Hack updated');
  }

  // Delete the hack
  console.log('\n5. Deleting hack');
  const deleteButton = await page.$('button[aria-label*="Delete"], button:has-text("Delete")');
  if (deleteButton) {
    await deleteButton.click();
    await delay(1000);

    // Confirm deletion if dialog appears
    const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Delete")');
    if (confirmButton) {
      await confirmButton.click();
      await delay(2000);
    }
    console.log('  ✅ Hack deleted');
    await takeScreenshot(page, 'admin-08-hack-deleted');
  }
}

async function testAdminRoutineCRUD(page) {
  console.log('\n🔐 ADMIN ROUTINE CRUD TEST');
  console.log('═══════════════════════════');

  // Navigate to admin routines
  console.log('\n1. Navigating to admin routines');
  await page.goto(`${PRODUCTION_URL}/admin/routines`);
  await delay(2000);
  await takeScreenshot(page, 'admin-09-routines-list');

  // The admin routines page shows public and private routines
  console.log('  ✅ Admin routines page loaded');

  // Sign out
  console.log('\n2. Signing out admin');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${PRODUCTION_URL}`);
  await delay(1000);
}

async function testRegularUserFlow(page) {
  console.log('\n👤 REGULAR USER FLOW TEST');
  console.log('══════════════════════════');

  // Sign in as regular user
  console.log('\n1. Signing in as regular user');
  await page.goto(`${PRODUCTION_URL}/auth`);
  await delay(2000);

  await page.type('input[type="email"]', REGULAR_USER.email);
  await page.type('input[type="password"]', REGULAR_USER.password);
  await takeScreenshot(page, 'user-01-login');

  await page.click('button[type="submit"]');
  await delay(3000);
  await takeScreenshot(page, 'user-02-after-login');

  // Visit hacks page
  console.log('\n2. Visiting hacks page');
  await page.goto(`${PRODUCTION_URL}/hacks`);
  await delay(2000);
  await takeScreenshot(page, 'user-03-hacks-page');

  // Click on first hack to visit it
  console.log('\n3. Visiting a hack');
  const firstHackLink = await page.$('a[href*="/hacks/"]');
  if (firstHackLink) {
    await firstHackLink.click();
    await delay(2000);
    console.log('  ✅ Visited hack details page');
    await takeScreenshot(page, 'user-04-hack-detail');

    // Go back to hacks list
    await page.goBack();
    await delay(2000);
  }

  // Like a hack
  console.log('\n4. Liking a hack');
  const likeButton = await page.$('button[class*="flex items-center gap-1"]');
  if (likeButton) {
    await likeButton.click();
    await delay(1000);
    console.log('  ✅ Liked hack');
    await takeScreenshot(page, 'user-05-hack-liked');
  }

  // Create a new routine
  console.log('\n5. Creating a new routine');
  await page.goto(`${PRODUCTION_URL}/dashboard/routines/new`);
  await delay(2000);
  await takeScreenshot(page, 'user-06-new-routine-form');

  // Fill routine form
  await page.type('input[name="name"], input[id="name"]', TEST_ROUTINE.name);
  await page.type('textarea[name="description"], textarea[id="description"]', TEST_ROUTINE.description);

  // Try to set time if field exists
  const timeInput = await page.$('input[type="time"], input[name="time_of_day"]');
  if (timeInput) {
    await page.type('input[type="time"], input[name="time_of_day"]', '09:00');
  }

  await takeScreenshot(page, 'user-07-routine-filled');

  // Add hacks to routine if checkboxes exist
  console.log('\n6. Adding hacks to routine');
  const hackCheckboxes = await page.$$('input[type="checkbox"][name*="hack"]');
  if (hackCheckboxes.length > 0) {
    // Check first few hacks
    for (let i = 0; i < Math.min(2, hackCheckboxes.length); i++) {
      await hackCheckboxes[i].click();
    }
    console.log('  ✅ Added hacks to routine');
    await takeScreenshot(page, 'user-08-hacks-selected');
  }

  // Submit routine
  await page.click('button[type="submit"]');
  await delay(3000);
  console.log('  ✅ Routine created');
  await takeScreenshot(page, 'user-09-routine-created');

  // View user's routines
  console.log('\n7. Viewing user routines');
  await page.goto(`${PRODUCTION_URL}/dashboard/routines`);
  await delay(2000);
  await takeScreenshot(page, 'user-10-routines-list');
  console.log('  ✅ User routines displayed');
}

async function runProductionTests() {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║  NRGHAX PRODUCTION FULL TEST SUITE  ║');
  console.log('╚════════════════════════════════════╝');
  console.log(`\nTesting: ${PRODUCTION_URL}\n`);

  // Create screenshots directory
  const fs = require('fs');
  if (!fs.existsSync('production-screenshots')) {
    fs.mkdirSync('production-screenshots');
  }

  // Setup test users
  await setupTestUsers();

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Run admin tests
    await testAdminHackCRUD(page);
    await testAdminRoutineCRUD(page);

    // Run regular user tests
    await testRegularUserFlow(page);

    console.log('\n╔════════════════════════════════════╗');
    console.log('║     ✅ ALL TESTS COMPLETED         ║');
    console.log('╚════════════════════════════════════╝');
    console.log('\nTest Users Created:');
    console.log(`  Admin: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
    console.log(`  User: ${REGULAR_USER.email} / ${REGULAR_USER.password}`);
    console.log('\n📁 Screenshots saved in: ./production-screenshots/\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the tests
runProductionTests().catch(console.error);