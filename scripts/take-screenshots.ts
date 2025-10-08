import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const pages = [
  { url: '/', name: 'home' },
  { url: '/hacks', name: 'hacks' },
  { url: '/auth', name: 'auth' },
  { url: '/dashboard', name: 'dashboard' },
  { url: '/account', name: 'account' },
  { url: '/onboarding', name: 'onboarding' },
];

async function takeScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const pageInfo of pages) {
    console.log(`\n📸 Capturing ${pageInfo.name}...`);

    try {
      // Navigate to page
      await page.goto(`http://localhost:3000${pageInfo.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait a bit for any animations
      await page.waitForTimeout(1000);

      // Take screenshot in light mode
      console.log(`  📷 Light mode...`);
      await page.screenshot({
        path: path.join(screenshotsDir, `${pageInfo.name}-light.png`),
        fullPage: true,
      });

      // Switch to dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Take screenshot in dark mode
      console.log(`  🌙 Dark mode...`);
      await page.screenshot({
        path: path.join(screenshotsDir, `${pageInfo.name}-dark.png`),
        fullPage: true,
      });

      // Switch back to light mode for next page
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      console.log(`  ✅ Done`);
    } catch (error) {
      console.error(`  ❌ Error capturing ${pageInfo.name}:`, error);
    }
  }

  await browser.close();
  console.log(`\n✨ All screenshots saved to ${screenshotsDir}`);
}

takeScreenshots().catch(console.error);
