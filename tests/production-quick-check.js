const puppeteer = require('puppeteer');

const PRODUCTION_URL = 'https://nrghax.com';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function quickProductionCheck() {
  console.log('\n🚀 NRGHAX PRODUCTION QUICK CHECK');
  console.log('═══════════════════════════════════\n');

  const fs = require('fs');
  if (!fs.existsSync('production-screenshots')) {
    fs.mkdirSync('production-screenshots');
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // Homepage
    console.log('✓ Checking Homepage...');
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    await page.screenshot({
      path: 'production-screenshots/prod-01-homepage.png',
      fullPage: true
    });
    console.log('  📸 Homepage screenshot saved');

    // Auth page
    console.log('\n✓ Checking Auth Page...');
    await page.goto(`${PRODUCTION_URL}/auth`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    await page.screenshot({
      path: 'production-screenshots/prod-02-auth.png',
      fullPage: true
    });
    console.log('  📸 Auth page screenshot saved');

    // Try routines page
    console.log('\n✓ Checking Routines Page...');
    await page.goto(`${PRODUCTION_URL}/routines`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    await page.screenshot({
      path: 'production-screenshots/prod-03-routines.png',
      fullPage: true
    });
    console.log('  📸 Routines page screenshot saved');

    // Dashboard (should redirect to auth)
    console.log('\n✓ Checking Dashboard (Protected)...');
    await page.goto(`${PRODUCTION_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    const dashboardUrl = page.url();
    console.log(`  Dashboard URL: ${dashboardUrl}`);
    await page.screenshot({
      path: 'production-screenshots/prod-04-dashboard.png',
      fullPage: true
    });
    console.log('  📸 Dashboard screenshot saved');

    // Mobile view
    console.log('\n✓ Checking Mobile View...');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await delay(3000);
    await page.screenshot({
      path: 'production-screenshots/prod-05-mobile.png',
      fullPage: true
    });
    console.log('  📸 Mobile view screenshot saved');

    console.log('\n═══════════════════════════════════');
    console.log('✅ PRODUCTION CHECK COMPLETE');
    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({
      path: 'production-screenshots/prod-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

quickProductionCheck().catch(console.error);