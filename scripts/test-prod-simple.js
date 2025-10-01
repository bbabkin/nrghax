const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'prod-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSite() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.setDefaultNavigationTimeout(30000);

  console.log('Testing NRGHax Production...\n');

  // 1. Homepage
  console.log('1. Homepage');
  await page.goto('https://www.nrghax.com');
  await wait(3000);
  await page.screenshot({ path: path.join(screenshotsDir, '01-homepage.png'), fullPage: true });
  const title = await page.title();
  console.log(`   Title: ${title}`);

  // 2. Hacks Page
  console.log('\n2. Hacks Page');
  await page.goto('https://www.nrghax.com/hacks');
  await wait(3000);
  await page.screenshot({ path: path.join(screenshotsDir, '02-hacks.png'), fullPage: true });

  // 3. Auth Page
  console.log('\n3. Auth Page');
  await page.goto('https://www.nrghax.com/auth');
  await wait(3000);
  await page.screenshot({ path: path.join(screenshotsDir, '03-auth.png'), fullPage: true });

  // 4. Admin (should redirect)
  console.log('\n4. Admin Page (should redirect to auth)');
  await page.goto('https://www.nrghax.com/admin/hacks');
  await wait(3000);
  const adminUrl = page.url();
  console.log(`   Current URL: ${adminUrl}`);
  await page.screenshot({ path: path.join(screenshotsDir, '04-admin.png'), fullPage: true });

  // 5. Account (should redirect)
  console.log('\n5. Account Page (should redirect to auth)');
  await page.goto('https://www.nrghax.com/account');
  await wait(3000);
  const accountUrl = page.url();
  console.log(`   Current URL: ${accountUrl}`);
  await page.screenshot({ path: path.join(screenshotsDir, '05-account.png'), fullPage: true });

  // 6. Routines
  console.log('\n6. Routines Page');
  await page.goto('https://www.nrghax.com/routines');
  await wait(3000);
  await page.screenshot({ path: path.join(screenshotsDir, '06-routines.png'), fullPage: true });

  await browser.close();
  console.log('\nDone! Check prod-screenshots/ folder');
}

testSite().catch(console.error);