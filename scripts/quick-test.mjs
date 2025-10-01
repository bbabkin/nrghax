import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotDir = './test-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function quickTest() {
  const browser = await chromium.launch({
    headless: true,
    timeout: 10000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Set shorter timeout
  page.setDefaultTimeout(10000);

  const pages = [
    { url: 'http://localhost:3000', name: '01-homepage' },
    { url: 'http://localhost:3000/hacks', name: '02-hacks' },
    { url: 'http://localhost:3000/dashboard', name: '03-dashboard' },
    { url: 'http://localhost:3000/admin/hacks', name: '04-admin' },
    { url: 'http://localhost:3000/profile/history', name: '05-history' }
  ];

  for (const { url, name } of pages) {
    try {
      console.log(`Testing ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000); // Give it time to render

      const screenshot = path.join(screenshotDir, `${name}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      console.log(`✅ Screenshot saved: ${screenshot}`);

      // Log page title and basic info
      const title = await page.title();
      console.log(`   Page title: ${title}`);

    } catch (error) {
      console.error(`❌ Failed to test ${url}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✨ Testing complete!');
  console.log(`📸 Screenshots saved in ${screenshotDir}`);
}

quickTest().catch(console.error);