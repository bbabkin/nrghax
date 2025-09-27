const puppeteer = require('puppeteer');

const LOCAL_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLikeAuthentication() {
  console.log('\n🧪 Testing Like Button Authentication');
  console.log('════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Test 1: Navigate to hacks page as unauthenticated user
    console.log('1. Navigate to hacks page (unauthenticated)');
    await page.goto(`${LOCAL_URL}/hacks`, { waitUntil: 'networkidle2' });
    await delay(3000);

    // Test 2: Try to click like button
    console.log('2. Attempting to click like button...');
    const likeButtons = await page.$$('button[class*="flex items-center gap-1"]');

    if (likeButtons.length > 0) {
      console.log(`   Found ${likeButtons.length} like buttons`);

      // Click the first like button
      await likeButtons[0].click();
      await delay(2000);

      // Check for toast message
      const toastContent = await page.$eval('body', body => body.textContent);

      if (toastContent.includes('Sign in required') || toastContent.includes('sign in to like')) {
        console.log('   ✅ Authentication prompt shown correctly');
      } else {
        // Check if we were redirected or if there's an error
        const currentUrl = page.url();
        if (currentUrl.includes('/auth')) {
          console.log('   ✅ Redirected to auth page');
        } else {
          console.log('   ⚠️ No authentication prompt detected');
        }
      }
    } else {
      console.log('   ⚠️ No like buttons found (might need to create hacks first)');
    }

    // Test 3: Check console for errors
    console.log('\n3. Checking for console errors...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await delay(1000);

    if (logs.length === 0) {
      console.log('   ✅ No console errors detected');
    } else {
      console.log('   ⚠️ Console errors found:');
      logs.forEach(log => console.log(`      - ${log}`));
    }

    console.log('\n════════════════════════════════════');
    console.log('✅ Test Complete\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLikeAuthentication().catch(console.error);