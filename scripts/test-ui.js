#!/usr/bin/env node

/**
 * Script to test UI and capture screenshots
 * Using Puppeteer to verify UI fixes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('Starting UI testing...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // Test 1: Homepage
    console.log('1. Testing Homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });
    console.log('   ✓ Homepage captured');

    // Test 2: Auth page
    console.log('2. Testing Auth page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '02-auth-page.png'), fullPage: true });
    console.log('   ✓ Auth page captured');

    // Test 3: Dark mode toggle
    console.log('3. Testing Dark Mode...');
    // Try to find and click dark mode toggle
    try {
      await page.click('[aria-label*="theme"], [title*="theme"], button:has-text("🌙"), button:has-text("☀️")');
      await page.waitForTimeout(500); // Wait for theme transition
      await page.screenshot({ path: path.join(screenshotsDir, '03-dark-mode.png'), fullPage: true });
      console.log('   ✓ Dark mode captured');
    } catch (e) {
      console.log('   ⚠ Dark mode toggle not found or not working');
    }

    // Test 4: Hacks page (public view)
    console.log('4. Testing Hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotsDir, '04-hacks-page.png'), fullPage: true });
    console.log('   ✓ Hacks page captured');

    // Test 5: Sign in with test credentials
    console.log('5. Testing Admin Login...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });

    // Fill in login form
    await page.type('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.type('input[name="password"], input[type="password"]', 'admin123');
    await page.screenshot({ path: path.join(screenshotsDir, '05-login-filled.png') });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-after-login.png'), fullPage: true });

    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('onboarding')) {
      console.log('   ✓ Login successful - redirected to:', currentUrl);
    } else {
      console.log('   ⚠ Login might have failed - current URL:', currentUrl);
    }

    // Test 6: Try admin routes
    console.log('6. Testing Admin Routes...');

    // Try admin tags page
    try {
      await page.goto('http://localhost:3000/admin/tags', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(screenshotsDir, '07-admin-tags.png'), fullPage: true });

      // Check for theme issues
      const hasWhiteOnWhite = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        for (let el of elements) {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const color = style.color;
          if (bg === 'rgb(255, 255, 255)' && color === 'rgb(255, 255, 255)') {
            return true;
          }
        }
        return false;
      });

      if (hasWhiteOnWhite) {
        console.log('   ⚠ Found white text on white background issue!');
      } else {
        console.log('   ✓ Tags page theme looks good');
      }
    } catch (e) {
      console.log('   ⚠ Could not access admin tags page');
    }

    // Test 7: Check TipTap editor
    console.log('7. Testing TipTap Editor...');
    try {
      await page.goto('http://localhost:3000/admin/hacks/new', { waitUntil: 'networkidle2' });

      // Find TipTap editor
      const editorExists = await page.$('.ProseMirror');
      if (editorExists) {
        // Click in the editor
        await page.click('.ProseMirror');
        await page.type('.ProseMirror', 'Testing TipTap editor functionality');
        await page.screenshot({ path: path.join(screenshotsDir, '08-tiptap-editor.png'), fullPage: true });
        console.log('   ✓ TipTap editor is functional');
      } else {
        console.log('   ⚠ TipTap editor not found');
      }
    } catch (e) {
      console.log('   ⚠ Could not test TipTap editor:', e.message);
    }

    console.log('\n✅ UI Testing Complete!');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('\nSummary:');
    console.log('- Homepage: Working');
    console.log('- Auth page: Working');
    console.log('- Theme switching: Check screenshots');
    console.log('- Admin routes: Check screenshots');
    console.log('- TipTap editor: Check screenshots');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
captureScreenshots().catch(console.error);