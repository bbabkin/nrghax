const puppeteer = require('puppeteer');

async function testNewLandingPage() {
  console.log('\n📸 Capturing New Landing Page\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Navigate to local dev server
    console.log('Opening landing page...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for animations to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take full page screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `screenshots/landing-page-${timestamp}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved: ${screenshotPath}`);

    // Take viewport screenshot (hero section)
    await page.screenshot({
      path: `screenshots/landing-hero-${timestamp}.png`,
      fullPage: false
    });

    console.log(`✅ Hero screenshot saved`);

    // Scroll to categories section
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: `screenshots/landing-categories-${timestamp}.png`,
      fullPage: false
    });

    console.log(`✅ Categories screenshot saved`);

    // Test mobile view
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: `screenshots/landing-mobile-${timestamp}.png`,
      fullPage: true
    });

    console.log(`✅ Mobile screenshot saved`);

    console.log('\n🎉 All screenshots captured successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testNewLandingPage();