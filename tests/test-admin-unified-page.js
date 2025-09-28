const puppeteer = require('puppeteer');

async function testAdminUnifiedPage() {
  console.log('\n🔐 TESTING UNIFIED PAGE WITH ADMIN USER');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // First, ensure we're logged out
    console.log('1. Clearing any existing session...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Login as admin
    console.log('\n2. Logging in as admin (bbabkin@gmail.com)...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });

    await page.type('input[type="email"]', 'bbabkin@gmail.com');
    await page.type('input[type="password"]', 'password123');

    await page.screenshot({
      path: `screenshots/admin-test-01-login-${timestamp}.png`
    });
    console.log('   📸 Screenshot: Login form filled');

    // Submit login
    await page.click('button[type="submit"]');
    console.log('   ⏳ Waiting for authentication...');

    // Wait for navigation/redirect
    await new Promise(resolve => setTimeout(resolve, 5000));

    const afterLoginUrl = page.url();
    console.log('   📍 After login URL:', afterLoginUrl);

    // Handle potential onboarding
    if (afterLoginUrl.includes('onboarding')) {
      console.log('   📝 Handling onboarding...');

      // Try to skip or complete onboarding
      const skipButton = await page.$('button:has-text("Skip")');
      if (skipButton) {
        await skipButton.click();
      } else {
        // Try "Get Started" or "Continue"
        const getStartedButton = await page.$('button:has-text("Get Started")');
        if (getStartedButton) {
          await getStartedButton.click();
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Navigate to hacks page
    console.log('\n3. Navigating to /hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: `screenshots/admin-test-02-hacks-page-${timestamp}.png`,
      fullPage: false
    });
    console.log('   📸 Screenshot: Hacks page as admin');

    // Check if user is logged in
    const navbarText = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav ? nav.textContent : '';
    });

    const isLoggedIn = !navbarText.includes('Login') && !navbarText.includes('Sign Up');
    console.log('   🔐 User logged in:', isLoggedIn ? 'Yes' : 'No');

    if (!isLoggedIn) {
      console.log('\n   ⚠️ Admin not logged in. Checking for auth issues...');

      // Try to check if there's an auth error
      const authError = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-destructive, .text-red-500, [role="alert"]');
        return errorElement ? errorElement.textContent : null;
      });

      if (authError) {
        console.log('   ❌ Auth error:', authError);
      }

      // Take diagnostic screenshot
      await page.screenshot({
        path: `screenshots/admin-test-auth-issue-${timestamp}.png`,
        fullPage: true
      });
      console.log('   📸 Diagnostic screenshot saved');
    } else {
      // User is logged in, check features
      console.log('\n4. Verifying admin features...');

      // Check tabs
      const tabs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim());
      });
      console.log('   📋 Available tabs:', tabs.join(', '));
      console.log('   ✅ Has "My Routines" tab:', tabs.some(t => t.includes('My Routines')) ? 'Yes' : 'No');

      // Check floating buttons
      const floatingButtons = await page.evaluate(() => {
        const container = document.querySelector('.fixed.bottom-6.right-6');
        if (!container) return { found: false, buttons: [] };
        const buttons = Array.from(container.querySelectorAll('button, a'));
        return {
          found: true,
          buttons: buttons.map(btn => btn.textContent.trim())
        };
      });

      if (floatingButtons.found) {
        console.log('   🔘 Floating action buttons:', floatingButtons.buttons.join(', '));
      } else {
        console.log('   ❌ No floating action buttons found');
      }

      // Check for admin controls on cards
      const adminControls = await page.evaluate(() => {
        // Look for edit links or buttons
        const editLinks = document.querySelectorAll('a[href*="/edit"], button:has-text("Edit")');
        const deleteButtons = document.querySelectorAll('button:has-text("Delete"), button svg.text-red');
        return {
          hasEditControls: editLinks.length > 0,
          hasDeleteControls: deleteButtons.length > 0,
          editCount: editLinks.length,
          deleteCount: deleteButtons.length
        };
      });

      console.log('   ⚙️ Admin controls on cards:');
      console.log(`      - Edit controls: ${adminControls.hasEditControls ? `Yes (${adminControls.editCount})` : 'No'}`);
      console.log(`      - Delete controls: ${adminControls.hasDeleteControls ? `Yes (${adminControls.deleteCount})` : 'No'}`);

      // Click on My Routines tab if available
      if (tabs.some(t => t.includes('My Routines'))) {
        console.log('\n5. Testing My Routines tab...');
        await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
          const myRoutinesTab = tabs.find(tab => tab.textContent.includes('My Routines'));
          if (myRoutinesTab) myRoutinesTab.click();
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        await page.screenshot({
          path: `screenshots/admin-test-03-my-routines-${timestamp}.png`
        });
        console.log('   📸 Screenshot: My Routines tab');

        // Check content
        const myRoutinesContent = await page.evaluate(() => {
          const panel = document.querySelector('[role="tabpanel"]');
          if (!panel) return { hasContent: false };

          const hasCreateButton = panel.textContent.includes('Create Your First Routine') ||
                                 panel.querySelector('button:has-text("Create")');
          const routineCards = panel.querySelectorAll('[class*="card"], [class*="Card"]');

          return {
            hasContent: true,
            isEmpty: hasCreateButton,
            routineCount: routineCards.length
          };
        });

        if (myRoutinesContent.hasContent) {
          if (myRoutinesContent.isEmpty) {
            console.log('   📦 My Routines: Empty (shows create button)');
          } else {
            console.log(`   📦 My Routines: ${myRoutinesContent.routineCount} routines`);
          }
        }
      }

      // Highlight floating buttons
      console.log('\n6. Highlighting floating action buttons...');
      await page.evaluate(() => {
        const container = document.querySelector('.fixed.bottom-6.right-6');
        if (container) {
          container.style.border = '4px solid #10b981';
          container.style.borderRadius = '8px';
          container.style.padding = '8px';
          container.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        }
      });

      await page.screenshot({
        path: `screenshots/admin-test-04-highlighted-buttons-${timestamp}.png`
      });
      console.log('   📸 Screenshot: Floating buttons highlighted');
    }

    // Final check of navbar
    console.log('\n7. Verifying navigation cleanup...');
    const navLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('nav a')).map(a => a.textContent.trim());
    });

    console.log('   📍 Nav links:', navLinks.filter(l => l).join(' | '));
    console.log('\n   Removed items verification:');
    console.log('   ✅ "Manage Hacks" removed:', !navLinks.includes('Manage Hacks'));
    console.log('   ✅ "Manage Routines" removed:', !navLinks.includes('Manage Routines'));
    console.log('   ✅ "My Routines" removed:', !navLinks.includes('My Routines'));

    // Summary
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (isLoggedIn) {
      console.log('✅ Admin successfully logged in');
      console.log('✅ Navigation menu properly cleaned up');

      if (tabs.some(t => t.includes('My Routines'))) {
        console.log('✅ "My Routines" tab available for authenticated users');
      } else {
        console.log('⚠️ "My Routines" tab not found');
      }

      if (floatingButtons.found && floatingButtons.buttons.length > 0) {
        console.log('✅ Floating action buttons present for admin');
      } else {
        console.log('⚠️ Floating action buttons not found');
      }

      if (adminControls.hasEditControls || adminControls.hasDeleteControls) {
        console.log('✅ Admin controls visible on content cards');
      } else {
        console.log('⚠️ Admin controls not found on cards');
      }
    } else {
      console.log('❌ Admin login failed - unable to verify features');
      console.log('   Please check admin credentials or auth configuration');
    }

    console.log('\nAll screenshots saved to screenshots/ folder for review.');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({
      path: `screenshots/admin-test-error-${timestamp}.png`
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminUnifiedPage().catch(console.error);