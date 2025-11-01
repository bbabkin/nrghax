import { test } from '@playwright/test';

test('capture library and skills pages with color progression', async ({ page }) => {
  // Use the already running dev server
  const baseURL = 'http://localhost:3000';

  // Navigate to library page
  await page.goto(`${baseURL}/hacks`);
  await page.waitForTimeout(2000); // Wait for animations

  // Take screenshot of library page
  await page.screenshot({
    path: 'screenshots/updated/library-with-colors.png',
    fullPage: true
  });

  // Navigate to skills page
  await page.goto(`${baseURL}/levels`);
  await page.waitForTimeout(2000); // Wait for animations and skill tree to load

  // Take screenshot of skills page
  await page.screenshot({
    path: 'screenshots/updated/skills-with-colors.png',
    fullPage: true
  });

  console.log('Screenshots captured successfully!');
});