const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAvatarUpload() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });

  // Log network failures
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure());
  });

  try {
    console.log('Testing avatar upload functionality...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:3000/auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✓ Logged in successfully\n');

    // Step 2: Navigate to account/profile page
    console.log('2. Navigating to profile page...');
    await page.goto('http://localhost:3000/account');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the profile page
    const pageContent = await page.content();
    if (pageContent.includes('Profile Picture') || pageContent.includes('Upload')) {
      console.log('   ✓ Profile page loaded\n');
    }

    // Step 3: Use existing test image
    console.log('3. Using test image...');
    const testImagePath = path.join(__dirname, 'test-avatar.jpg');
    
    // Check if test image exists
    if (!fs.existsSync(testImagePath)) {
      console.log('   ❌ test-avatar.jpg not found');
      console.log('   Please create a test image first');
      return;
    }
    console.log('   ✓ Test image ready\n');

    // Step 4: Upload avatar
    console.log('4. Uploading avatar...');
    
    // Find the file input
    const fileInput = await page.locator('input[type="file"][accept*="image"]');
    
    if (await fileInput.count() > 0) {
      // Set up response listener for storage upload
      const uploadPromise = page.waitForResponse(
        response => response.url().includes('storage') || response.url().includes('avatar'),
        { timeout: 30000 }
      ).catch(() => null);
      
      // Upload the file
      await fileInput.setInputFiles(testImagePath);
      console.log('   ✓ File selected\n');
      
      // Wait for upload response
      console.log('5. Waiting for upload to complete...');
      const uploadResponse = await uploadPromise;
      
      if (uploadResponse) {
        console.log(`   Upload response: ${uploadResponse.status()} ${uploadResponse.statusText()}`);
        
        if (uploadResponse.status() >= 400) {
          const responseBody = await uploadResponse.text();
          console.log('   Error response:', responseBody);
        } else {
          console.log('   ✓ Upload successful!\n');
        }
      } else {
        console.log('   ⚠ No upload response detected\n');
      }
      
      // Wait a bit for any UI updates
      await page.waitForTimeout(3000);
      
      // Check if avatar appeared
      const avatarImg = await page.locator('img[alt="Avatar"]');
      if (await avatarImg.count() > 0) {
        const avatarSrc = await avatarImg.getAttribute('src');
        console.log('6. Avatar image detected:');
        console.log(`   URL: ${avatarSrc}\n`);
        console.log('✅ Avatar upload test completed successfully!');
      } else {
        console.log('   ⚠ Avatar image not found in UI\n');
        
        // Check for any error messages
        const errorElements = await page.locator('[role="alert"], .destructive, .error').all();
        for (const element of errorElements) {
          const text = await element.textContent();
          if (text) {
            console.log('   Error message found:', text);
          }
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: 'test-avatar-result.png' });
      console.log('\nScreenshot saved: test-avatar-result.png');
      
    } else {
      console.log('   ❌ File input not found on page');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test-avatar-error.png' });
  } finally {
    await page.waitForTimeout(2000); // Keep browser open briefly to see result
    await browser.close();
  }
}

testAvatarUpload().catch(console.error);