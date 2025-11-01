const puppeteer = require('puppeteer');
const fs = require('fs');

async function testAuthAndLevels() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }

    console.log('🔐 Testing Authentication and Levels System\n');
    console.log('==========================================\n');

    // Test 1: Try accessing levels without auth (should redirect)
    console.log('1. Testing unauthenticated access...');
    await page.goto('http://localhost:3000/levels', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const currentUrl = page.url();
    if (currentUrl.includes('auth')) {
      console.log('   ✅ Correctly redirected to auth page\n');
    } else {
      console.log('   ❌ Did not redirect to auth (security issue!)\n');
    }

    // Test 2: Sign in with admin credentials
    console.log('2. Testing admin login...');
    await page.goto('http://localhost:3000/auth', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fill in email using the ID selector
    await page.type('#signin-email', 'admin@nrghax.com');

    // Fill in password using the ID selector
    await page.type('#signin-password', 'Admin123!@#');

    // Take screenshot before login
    await page.screenshot({
      path: 'test-results/01-login-form-filled.png',
      fullPage: false
    });

    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or timeout
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 5000
      });
    } catch {
      // Navigation might not happen if there's an error
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const afterLoginUrl = page.url();
    console.log(`   Current URL: ${afterLoginUrl}`);
    
    if (afterLoginUrl.includes('dashboard')) {
      console.log('   ✅ Successfully logged in and redirected to dashboard\n');
    } else if (!afterLoginUrl.includes('auth')) {
      console.log('   ✅ Successfully logged in\n');
    } else {
      console.log('   ⚠️  Still on auth page - checking for errors...\n');
    }

    await page.screenshot({
      path: 'test-results/02-after-login.png',
      fullPage: true
    });

    // Test 3: Navigate to levels page
    console.log('3. Testing levels page access...');
    await page.goto('http://localhost:3000/levels', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const levelsUrl = page.url();
    if (levelsUrl.includes('levels') && !levelsUrl.includes('auth')) {
      console.log('   ✅ Successfully accessed levels page');
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for level cards by looking for links to individual levels
      const levelCards = await page.$$('a[href^="/levels/"]');
      console.log(`   ✅ Found ${levelCards.length} level links\n`);

      await page.screenshot({
        path: 'test-results/03-levels-page.png',
        fullPage: true
      });
    } else {
      console.log(`   ❌ Could not access levels page (redirected to: ${levelsUrl})\n`);
    }

    // Test 4: Navigate to Foundation level
    console.log('4. Testing Foundation level page...');
    await page.goto('http://localhost:3000/levels/foundation', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const foundationUrl = page.url();
    if (foundationUrl.includes('levels/foundation')) {
      console.log('   ✅ Successfully accessed Foundation level');
      
      // Wait for content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for hack content
      const pageContent = await page.content();
      if (pageContent.includes('Required Hacks')) {
        console.log('   ✅ Found hack sections on page\n');
      }

      await page.screenshot({
        path: 'test-results/04-foundation-level.png',
        fullPage: true
      });
    } else {
      console.log(`   ❌ Could not access Foundation level (redirected to: ${foundationUrl})\n`);
    }

    // Test 5: Check navigation menu for Progression link
    console.log('5. Testing navigation menu...');
    const progressionNavLink = await page.$('a[href="/levels"]');
    if (progressionNavLink) {
      const linkText = await page.evaluate(el => el.textContent, progressionNavLink);
      if (linkText && linkText.includes('Progression')) {
        console.log('   ✅ Found Progression link in navigation\n');
      } else {
        console.log('   ⚠️  Found levels link but text is: ' + linkText + '\n');
      }
    } else {
      console.log('   ⚠️  Progression link not found in navigation\n');
    }

    console.log('==========================================');
    console.log('✨ Testing complete! Check test-results/ folder for screenshots\n');
    console.log('📋 Summary of Test Credentials:');
    console.log('================================');
    console.log('👑 Admin Account:');
    console.log('   Email: admin@nrghax.com');
    console.log('   Password: Admin123!@#');
    console.log('\n👤 Regular User Account:');
    console.log('   Email: user@nrghax.com');
    console.log('   Password: User123!@#');
    console.log('\n🔗 Access the app at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

testAuthAndLevels();
