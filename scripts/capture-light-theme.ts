import { chromium } from 'playwright';

const pages = [
  { path: '/', name: 'home' },
  { path: '/hacks', name: 'hacks' },
];

async function captureScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Set to light theme
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  });

  for (const { path, name } of pages) {
    console.log(`Capturing light theme: ${name}`);
    await page.goto(`http://localhost:3000${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for rendering
    await page.screenshot({
      path: `screenshots/light_${name}.png`,
      fullPage: true
    });
  }

  await browser.close();
  console.log('Screenshots captured!');
}

captureScreenshots().catch(console.error);
