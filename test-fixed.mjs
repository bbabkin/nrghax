import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotDir = './test-screenshots-fixed';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testApp() {
  const browser = await chromium.launch({
    headless: true,
    timeout: 10000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const tests = [
    { name: 'Homepage', url: 'http://localhost:3000' },
    { name: 'Hacks Page', url: 'http://localhost:3000/hacks' },
    { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'Admin Page', url: 'http://localhost:3000/admin/hacks' },
    { name: 'Auth Page', url: 'http://localhost:3000/api/auth/signin' },
  ];

  console.log('Testing application after fixes...\n');

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      await page.goto(test.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1000);

      const screenshot = path.join(screenshotDir, `${test.name.toLowerCase().replace(/\s+/g, '-')}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });

      // Check for errors
      const pageContent = await page.content();
      const hasError = pageContent.includes('error') || pageContent.includes('Error');

      if (hasError && !test.url.includes('auth')) {
        console.log(`  ⚠️  Possible error detected`);
      } else {
        console.log(`  ✅ Page loaded successfully`);
      }

      // Get page title
      const title = await page.title();
      if (title) console.log(`     Title: ${title}`);

    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  await browser.close();
  console.log('\n✨ Testing complete!');
  console.log(`📸 Screenshots saved in ${screenshotDir}`);
}

testApp().catch(console.error);