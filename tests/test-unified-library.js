const puppeteer = require('puppeteer');

async function testUnifiedLibraryPage() {
  console.log('\n🧪 TESTING UNIFIED LIBRARY PAGE');
  console.log('Testing that admin controls and user routines are properly integrated');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // PART 1: Test as unauthenticated user
    console.log('PART 1: Testing as unauthenticated user');
    console.log('────────────────────────────────────────');

    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check tabs visible to unauthenticated users
    const unauthTabs = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      return tabs.map(tab => tab.textContent);
    });

    console.log('  Tabs visible:', unauthTabs.join(', '));

    // Check for floating action buttons (should not exist)
    const hasFloatingButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.fixed.bottom-6.right-6 button');
      return buttons.length > 0;
    });

    console.log('  Floating action buttons:', hasFloatingButtons ? '❌ Found (unexpected)' : '✅ None (correct)');

    // Take screenshot
    await page.screenshot({
      path: `screenshots/unified-01-unauth-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    });
    console.log('  📸 Screenshot saved: Unauthenticated view\n');

    // PART 2: Login as admin (bbabkin@gmail.com)
    console.log('PART 2: Testing as admin user');
    console.log('────────────────────────────────────────');

    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });

    // Login with admin credentials
    await page.type('input[type="email"]', 'bbabkin@gmail.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Navigate to library page
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check tabs visible to authenticated users
    const authTabs = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      return tabs.map(tab => tab.textContent);
    });

    console.log('  Tabs visible:', authTabs.join(', '));

    // Check for "My Routines" tab
    const hasMyRoutinesTab = authTabs.some(tab => tab.includes('My Routines'));
    console.log('  My Routines tab:', hasMyRoutinesTab ? '✅ Present' : '❌ Missing');

    // Check for floating action buttons
    const floatingButtons = await page.evaluate(() => {
      const container = document.querySelector('.fixed.bottom-6.right-6');
      if (!container) return [];
      const buttons = Array.from(container.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent);
    });

    console.log('  Floating action buttons:', floatingButtons.length > 0 ? floatingButtons.join(', ') : 'None');

    // Check for admin controls on hack cards
    const hasAdminControls = await page.evaluate(() => {
      const editButtons = document.querySelectorAll('a[href^="/admin/hacks/"][href$="/edit"]');
      return editButtons.length > 0;
    });

    console.log('  Admin controls on cards:', hasAdminControls ? '✅ Present' : '❌ Missing');

    // Take screenshot
    await page.screenshot({
      path: `screenshots/unified-02-admin-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
      fullPage: false
    });
    console.log('  📸 Screenshot saved: Admin view\n');

    // Click on My Routines tab if present
    if (hasMyRoutinesTab) {
      await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const myRoutinesTab = tabs.find(tab => tab.textContent.includes('My Routines'));
        if (myRoutinesTab) myRoutinesTab.click();
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check content in My Routines tab
      const myRoutinesContent = await page.evaluate(() => {
        const content = document.querySelector('[role="tabpanel"]');
        return content ? content.textContent : 'No content';
      });

      console.log('  My Routines content:', myRoutinesContent.includes('Create Your First Routine')
        ? 'Empty (shows create button)'
        : 'Has routines');

      await page.screenshot({
        path: `screenshots/unified-03-my-routines-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
      });
      console.log('  📸 Screenshot saved: My Routines tab\n');
    }

    // PART 3: Test navigation menu
    console.log('PART 3: Testing navigation menu');
    console.log('────────────────────────────────────────');

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a'));
      return links.map(link => ({
        text: link.textContent,
        href: link.href
      }));
    });

    console.log('  Navigation links:');
    navLinks.forEach(link => {
      console.log(`    - ${link.text}: ${link.href}`);
    });

    // Check that "Manage Hacks" and "My Routines" are NOT in nav
    const hasManageHacks = navLinks.some(link => link.text === 'Manage Hacks');
    const hasMyRoutinesNav = navLinks.some(link => link.text === 'My Routines');

    console.log('\n  Removed links verification:');
    console.log('    - "Manage Hacks" removed:', hasManageHacks ? '❌ Still present' : '✅ Removed');
    console.log('    - "My Routines" removed:', hasMyRoutinesNav ? '❌ Still present' : '✅ Removed');

    // Final verdict
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 FINAL VERDICT:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allTestsPassed =
      !hasManageHacks &&
      !hasMyRoutinesNav &&
      hasMyRoutinesTab &&
      floatingButtons.length > 0 &&
      hasAdminControls;

    if (allTestsPassed) {
      console.log('✅✅✅ SUCCESS! Unified library page works correctly!');
      console.log('\nConfirmed features:');
      console.log('  1. ✅ Navigation menu cleaned up (removed redundant links)');
      console.log('  2. ✅ My Routines tab integrated into main page');
      console.log('  3. ✅ Admin controls appear for admin users');
      console.log('  4. ✅ Floating action buttons for creating content');
      console.log('\nThe unified library page is working as expected!');
    } else {
      console.log('⚠️ Some features may need adjustment:');
      if (hasManageHacks || hasMyRoutinesNav) {
        console.log('  - Old navigation links still present');
      }
      if (!hasMyRoutinesTab) {
        console.log('  - My Routines tab not showing for authenticated users');
      }
      if (floatingButtons.length === 0) {
        console.log('  - Floating action buttons not showing for admin');
      }
      if (!hasAdminControls) {
        console.log('  - Admin controls not showing on cards');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({
      path: `screenshots/unified-error-${new Date().toISOString().replace(/[:.]/g, '-')}.png`
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testUnifiedLibraryPage().catch(console.error);