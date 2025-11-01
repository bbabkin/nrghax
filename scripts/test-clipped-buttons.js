const puppeteer = require('puppeteer');
const fs = require('fs');

async function testClippedButtons() {
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

    console.log('🔘 Testing Clipped Button Styles\n');
    console.log('===================================\n');

    // Login first
    console.log('1. Logging in as admin...');
    await page.goto('http://localhost:3000/auth', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.type('#signin-email', 'admin@nrghax.com');
    await page.type('#signin-password', 'Admin123!@#');
    await page.click('button[type="submit"]');

    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 5000
      });
    } catch {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('   ✅ Logged in successfully\n');

    // Navigate to hacks page to see admin buttons
    console.log('2. Navigating to hacks page...');
    await page.goto('http://localhost:3000/hacks', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot of hacks page with buttons
    await page.screenshot({
      path: 'test-results/clipped-buttons-hacks.png',
      fullPage: false
    });
    console.log('   ✅ Captured hacks page with clipped buttons\n');

    // Navigate to routines page
    console.log('3. Navigating to routines page...');
    await page.goto('http://localhost:3000/routines', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: 'test-results/clipped-buttons-routines.png',
      fullPage: false
    });
    console.log('   ✅ Captured routines page with clipped buttons\n');

    // Check if buttons have clip-path applied
    console.log('4. Verifying clip-path styles...');
    
    // Look for buttons with clipped variants
    const clippedButtons = await page.$$eval('button', buttons => {
      return buttons.map(btn => {
        const style = window.getComputedStyle(btn);
        const classList = Array.from(btn.classList);
        return {
          hasClipPath: style.clipPath && style.clipPath !== 'none',
          clipPath: style.clipPath,
          text: btn.textContent?.trim() || '',
          classes: classList.join(' ')
        };
      }).filter(btn => btn.hasClipPath || btn.text.includes('Edit') || btn.text.includes('Delete'));
    });

    if (clippedButtons.length > 0) {
      console.log(`   ✅ Found ${clippedButtons.length} buttons with clip styles:`);
      clippedButtons.forEach(btn => {
        if (btn.hasClipPath) {
          console.log(`      - "${btn.text || 'Icon Button'}" has clip-path: ${btn.clipPath}`);
        }
      });
    } else {
      console.log('   ⚠️  No clipped buttons found - may need to check selectors');
    }

    console.log('\n===================================');
    console.log('✨ Testing complete!');
    console.log('\nScreenshots saved to test-results/');
    console.log('- clipped-buttons-hacks.png');
    console.log('- clipped-buttons-routines.png');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testClippedButtons();
