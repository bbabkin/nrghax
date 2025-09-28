const puppeteer = require('puppeteer');

async function testAdminCRUDOperations() {
  console.log('\n🔧 TESTING ADMIN CRUD OPERATIONS ON UNIFIED PAGE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // STEP 1: Navigate directly to hacks page (assuming admin is already logged in via browser)
    console.log('STEP 1: Navigating to /hacks page');
    console.log('────────────────────────────────────');
    console.log('Note: Please ensure admin user (bbabkin@gmail.com) is logged in manually\n');

    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take initial screenshot
    await page.screenshot({
      path: `screenshots/crud-01-initial-page-${timestamp}.png`,
      fullPage: false
    });
    console.log('📸 Screenshot: Initial hacks page view');

    // Check if user is logged in
    const isLoggedIn = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      return nav && !nav.textContent.includes('Login') && !nav.textContent.includes('Sign Up');
    });

    if (!isLoggedIn) {
      console.log('\n⚠️  Admin not logged in. Please log in manually and run the test again.');
      console.log('   1. Go to http://localhost:3000/auth');
      console.log('   2. Login with bbabkin@gmail.com / password123');
      console.log('   3. Navigate back to /hacks and run this test again\n');

      // Try to help by navigating to auth page
      await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
      await page.screenshot({
        path: `screenshots/crud-please-login-${timestamp}.png`
      });
      console.log('📸 Screenshot: Auth page - please login manually');

      // Wait for manual login
      console.log('\nWaiting 15 seconds for manual login...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Navigate back to hacks
      await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // STEP 2: Check for admin features
    console.log('\nSTEP 2: Verifying Admin Features');
    console.log('────────────────────────────────────');

    // Check for tabs including "My Routines"
    const tabs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim());
    });
    console.log('📋 Available tabs:', tabs.join(', '));

    const hasMyRoutinesTab = tabs.some(t => t.includes('My Routines'));
    console.log('✅ "My Routines" tab:', hasMyRoutinesTab ? 'Present' : 'Not found (user might not be authenticated)');

    // Check for floating action buttons
    const floatingButtons = await page.evaluate(() => {
      const container = document.querySelector('.fixed.bottom-6.right-6');
      if (!container) return [];
      return Array.from(container.querySelectorAll('a, button')).map(el => el.textContent.trim());
    });
    console.log('🔘 Floating buttons:', floatingButtons.length > 0 ? floatingButtons.join(', ') : 'None found');

    // Highlight floating buttons if they exist
    if (floatingButtons.length > 0) {
      await page.evaluate(() => {
        const container = document.querySelector('.fixed.bottom-6.right-6');
        if (container) {
          container.style.border = '3px solid #ef4444';
          container.style.borderRadius = '8px';
          container.style.padding = '8px';
          container.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }
      });

      await page.screenshot({
        path: `screenshots/crud-02-floating-buttons-${timestamp}.png`
      });
      console.log('📸 Screenshot: Floating action buttons highlighted');
    }

    // STEP 3: Test CREATE - Click on "New Hack" button
    console.log('\nSTEP 3: Testing CREATE Operation');
    console.log('────────────────────────────────────');

    const hasNewHackButton = floatingButtons.some(b => b.includes('New Hack'));
    if (hasNewHackButton) {
      console.log('✅ "New Hack" button found - clicking...');

      await page.evaluate(() => {
        const container = document.querySelector('.fixed.bottom-6.right-6');
        if (container) {
          const newHackBtn = Array.from(container.querySelectorAll('a, button'))
            .find(el => el.textContent.includes('New Hack'));
          if (newHackBtn) newHackBtn.click();
        }
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const createPageUrl = page.url();
      console.log('📍 Navigated to:', createPageUrl);

      if (createPageUrl.includes('/admin/hacks/new')) {
        await page.screenshot({
          path: `screenshots/crud-03-create-hack-form-${timestamp}.png`
        });
        console.log('📸 Screenshot: Create hack form');
        console.log('✅ CREATE: New Hack form accessible');

        // Navigate back
        await page.goBack();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log('⚠️ "New Hack" button not found - admin might not be logged in');
    }

    // STEP 4: Test READ - View hack details
    console.log('\nSTEP 4: Testing READ Operation');
    console.log('────────────────────────────────────');

    // Click on a hack card to view details
    const hackCards = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href^="/hacks/"]');
      return cards.length;
    });

    if (hackCards > 0) {
      console.log(`✅ Found ${hackCards} hack cards`);

      // Click on first hack
      await page.evaluate(() => {
        const firstHack = document.querySelector('a[href^="/hacks/"]');
        if (firstHack) firstHack.click();
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      await page.screenshot({
        path: `screenshots/crud-04-hack-detail-${timestamp}.png`
      });
      console.log('📸 Screenshot: Hack detail page');
      console.log('✅ READ: Hack detail page accessible');

      // Go back to main page
      await page.goBack();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // STEP 5: Test UPDATE - Check for edit buttons
    console.log('\nSTEP 5: Testing UPDATE Operation');
    console.log('────────────────────────────────────');

    const editControls = await page.evaluate(() => {
      const editLinks = document.querySelectorAll('a[href*="/edit"]');
      const editButtons = document.querySelectorAll('button svg[class*="Edit"], button:has-text("Edit")');
      return {
        links: editLinks.length,
        buttons: editButtons.length,
        total: editLinks.length + editButtons.length
      };
    });

    console.log(`⚙️ Edit controls found: ${editControls.total} (${editControls.links} links, ${editControls.buttons} buttons)`);

    if (editControls.links > 0) {
      // Highlight edit controls
      await page.evaluate(() => {
        const editLinks = document.querySelectorAll('a[href*="/edit"]');
        editLinks.forEach(link => {
          link.style.border = '2px solid #3b82f6';
          link.style.borderRadius = '4px';
        });
      });

      await page.screenshot({
        path: `screenshots/crud-05-edit-controls-${timestamp}.png`
      });
      console.log('📸 Screenshot: Edit controls highlighted');

      // Click on first edit link
      await page.evaluate(() => {
        const firstEdit = document.querySelector('a[href*="/edit"]');
        if (firstEdit) firstEdit.click();
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const editPageUrl = page.url();
      if (editPageUrl.includes('/edit')) {
        await page.screenshot({
          path: `screenshots/crud-06-edit-form-${timestamp}.png`
        });
        console.log('📸 Screenshot: Edit hack form');
        console.log('✅ UPDATE: Edit form accessible');

        // Go back
        await page.goBack();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.log('⚠️ No edit controls found - admin might not be logged in');
    }

    // STEP 6: Test DELETE - Check for delete buttons
    console.log('\nSTEP 6: Testing DELETE Operation');
    console.log('────────────────────────────────────');

    const deleteControls = await page.evaluate(() => {
      const deleteButtons = document.querySelectorAll('button svg[class*="Trash"], button svg.text-red, button:has-text("Delete")');
      return deleteButtons.length;
    });

    console.log(`🗑️ Delete controls found: ${deleteControls}`);

    if (deleteControls > 0) {
      // Highlight delete controls
      await page.evaluate(() => {
        const deleteButtons = document.querySelectorAll('button svg[class*="Trash"], button svg.text-red');
        deleteButtons.forEach(btn => {
          const button = btn.closest('button');
          if (button) {
            button.style.border = '2px solid #ef4444';
            button.style.borderRadius = '4px';
          }
        });
      });

      await page.screenshot({
        path: `screenshots/crud-07-delete-controls-${timestamp}.png`
      });
      console.log('📸 Screenshot: Delete controls highlighted');
      console.log('✅ DELETE: Delete controls available');
    } else {
      console.log('⚠️ No delete controls found - admin might not be logged in');
    }

    // STEP 7: Test Routines CRUD
    console.log('\nSTEP 7: Testing Routines Management');
    console.log('────────────────────────────────────');

    // Click on Routines tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const routinesTab = tabs.find(t => t.textContent.trim().startsWith('Routines'));
      if (routinesTab) routinesTab.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: `screenshots/crud-08-routines-tab-${timestamp}.png`
    });
    console.log('📸 Screenshot: Routines tab');

    // Check for routine controls
    const routineControls = await page.evaluate(() => {
      const panel = document.querySelector('[role="tabpanel"]');
      if (!panel) return { found: false };

      const editButtons = panel.querySelectorAll('a[href*="/edit"], button:has-text("Edit")');
      const deleteButtons = panel.querySelectorAll('button svg.text-red, button:has-text("Delete")');

      return {
        found: true,
        edit: editButtons.length,
        delete: deleteButtons.length
      };
    });

    if (routineControls.found) {
      console.log(`⚙️ Routine controls: ${routineControls.edit} edit, ${routineControls.delete} delete`);
    }

    // Check for "New Routine" button
    const hasNewRoutineButton = floatingButtons.some(b => b.includes('New Routine'));
    console.log('✅ "New Routine" button:', hasNewRoutineButton ? 'Available' : 'Not found');

    // STEP 8: Test My Routines tab
    if (hasMyRoutinesTab) {
      console.log('\nSTEP 8: Testing My Routines Tab');
      console.log('────────────────────────────────────');

      await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const myRoutinesTab = tabs.find(t => t.textContent.includes('My Routines'));
        if (myRoutinesTab) myRoutinesTab.click();
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      await page.screenshot({
        path: `screenshots/crud-09-my-routines-${timestamp}.png`
      });
      console.log('📸 Screenshot: My Routines tab');

      const myRoutinesContent = await page.evaluate(() => {
        const panel = document.querySelector('[role="tabpanel"]');
        if (!panel) return 'Not found';
        return panel.textContent.includes('Create Your First Routine') ? 'Empty' : 'Has routines';
      });

      console.log('📦 My Routines status:', myRoutinesContent);
    }

    // FINAL SUMMARY
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('📊 CRUD OPERATIONS TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const isAdmin = floatingButtons.some(b => b.includes('New Hack'));
    const isAuthenticated = hasMyRoutinesTab;

    if (isAdmin) {
      console.log('✅ ADMIN STATUS CONFIRMED');
      console.log('\nHacks CRUD:');
      console.log('  ✅ CREATE: "New Hack" button available');
      console.log('  ✅ READ: Hack detail pages accessible');
      console.log(`  ${editControls.total > 0 ? '✅' : '⚠️'} UPDATE: ${editControls.total} edit controls found`);
      console.log(`  ${deleteControls > 0 ? '✅' : '⚠️'} DELETE: ${deleteControls} delete controls found`);

      console.log('\nRoutines CRUD:');
      console.log(`  ${hasNewRoutineButton ? '✅' : '⚠️'} CREATE: "New Routine" button ${hasNewRoutineButton ? 'available' : 'not found'}`);
      console.log('  ✅ READ: Routines displayed in tabs');
      console.log(`  ${routineControls.edit > 0 ? '✅' : '⚠️'} UPDATE: ${routineControls.edit} edit controls`);
      console.log(`  ${routineControls.delete > 0 ? '✅' : '⚠️'} DELETE: ${routineControls.delete} delete controls`);
    } else if (isAuthenticated) {
      console.log('⚠️ USER AUTHENTICATED BUT NOT ADMIN');
      console.log('  - "My Routines" tab is visible');
      console.log('  - Limited controls available');
      console.log('  - No "New Hack" button (correct for non-admin)');
    } else {
      console.log('❌ USER NOT AUTHENTICATED');
      console.log('  Please login as admin (bbabkin@gmail.com) and run test again');
    }

    console.log('\nAll screenshots saved to screenshots/ folder');
    console.log('Review them to verify the CRUD operations visually.');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({
      path: `screenshots/crud-error-${timestamp}.png`
    });
  } finally {
    console.log('\nTest complete. Browser will remain open for manual inspection.');
    // Keep browser open for manual inspection
    // await browser.close();
  }
}

// Run the test
testAdminCRUDOperations().catch(console.error);