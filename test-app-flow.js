const { chromium } = require('playwright');
const fs = require('fs');

async function testAppFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  try {
    console.log('1. Testing Homepage...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('   ✓ Homepage loaded');

    // Check if hacks link exists
    const hacksLink = await page.locator('a[href="/hacks"]').first();
    if (await hacksLink.isVisible()) {
      console.log('   ✓ Hacks link found');
    }

    console.log('\n2. Testing Hacks Page...');
    await page.goto('http://localhost:3001/hacks');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/02-hacks-page.png', fullPage: true });

    // Check for hacks content
    const pageContent = await page.content();
    if (pageContent.includes('Learn JavaScript') || pageContent.includes('Build Your First React')) {
      console.log('   ✓ Hacks content found!');
    } else if (pageContent.includes('Error') || pageContent.includes('error')) {
      console.log('   ✗ Error on hacks page');
    } else {
      console.log('   ⚠ No hacks visible (might be loading or permission issue)');
    }

    console.log('\n3. Testing Auth Page...');
    await page.goto('http://localhost:3001/auth');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/03-auth-page.png', fullPage: true });
    console.log('   ✓ Auth page loaded');

    console.log('\n4. Testing Login Flow...');
    // Fill in login form
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[id="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[id="password"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@test.com');
      await passwordInput.fill('test123');
      await page.screenshot({ path: 'screenshots/04-login-filled.png' });

      // Find and click submit button
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('   ✓ Login form submitted');

        // Wait for navigation or error
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/05-after-login.png', fullPage: true });

        const currentUrl = page.url();
        if (currentUrl.includes('dashboard') || currentUrl.includes('hacks')) {
          console.log('   ✓ Successfully logged in!');
        } else {
          console.log('   ⚠ Login completed but stayed on same page');
        }
      }
    } else {
      console.log('   ⚠ Login form not found');
    }

    console.log('\n5. Testing Dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/06-dashboard.png', fullPage: true });

    const dashboardContent = await page.content();
    if (dashboardContent.includes('Dashboard') || dashboardContent.includes('Welcome')) {
      console.log('   ✓ Dashboard loaded');
    }

    console.log('\n6. Testing Admin Login...');
    // Logout first if needed
    const profileButton = await page.locator('button[aria-label*="profile"], button:has-text("Profile"), [data-testid="profile-button"]').first();
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(500);

      const logoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Login as admin
    await page.goto('http://localhost:3001/auth');
    await page.waitForLoadState('networkidle');

    const adminEmailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const adminPasswordInput = await page.locator('input[type="password"], input[name="password"]').first();

    if (await adminEmailInput.isVisible()) {
      await adminEmailInput.fill('admin@test.com');
      await adminPasswordInput.fill('admin123');

      const adminSubmit = await page.locator('button[type="submit"], button:has-text("Sign in")').first();
      await adminSubmit.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/07-admin-login.png', fullPage: true });
      console.log('   ✓ Admin login attempted');
    }

    console.log('\n7. Testing Admin Panel...');
    await page.goto('http://localhost:3001/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-admin-panel.png', fullPage: true });

    const adminContent = await page.content();
    if (adminContent.includes('Admin') || adminContent.includes('Manage')) {
      console.log('   ✓ Admin panel accessible');
    } else if (adminContent.includes('unauthorized') || adminContent.includes('403')) {
      console.log('   ⚠ Admin panel blocked (permissions issue)');
    }

    console.log('\n8. Final Homepage Check...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-final-homepage.png', fullPage: true });
    console.log('   ✓ Final check complete');

  } catch (error) {
    console.error('Error during testing:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Testing complete! Screenshots saved in ./screenshots/');

    // List all screenshots
    const files = fs.readdirSync('screenshots');
    console.log('\nGenerated screenshots:');
    files.forEach(file => {
      if (file.endsWith('.png')) {
        console.log(`  - ${file}`);
      }
    });
  }
}

testAppFlow().catch(console.error);