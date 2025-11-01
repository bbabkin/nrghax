const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Set viewport to match common screen size
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    // Screenshot 1: Hacks/Library page
    console.log('Navigating to /hacks page...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: 'screenshots/current/library-page.png', fullPage: true });
    console.log('Library page screenshot saved');

    // Screenshot 2: Levels/Skills page
    console.log('Navigating to /levels page...');
    await page.goto('http://localhost:3000/levels', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/current/skills-page.png', fullPage: true });
    console.log('Skills page screenshot saved');

    // Screenshot 3: Individual hack detail
    console.log('Looking for a hack to view...');
    await page.goto('http://localhost:3000/hacks', { waitUntil: 'networkidle' });

    // Click on the first hack card
    const firstHack = await page.locator('[href^="/hacks/"]').first();
    if (await firstHack.isVisible()) {
      await firstHack.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/current/hack-detail.png', fullPage: true });
      console.log('Hack detail screenshot saved');
    }

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);