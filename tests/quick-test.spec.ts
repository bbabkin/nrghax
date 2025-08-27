import { test } from '@playwright/test';

test.use({
  ignoreHTTPSErrors: true,
});

test('capture login page', async ({ page }) => {
  
  await page.goto('https://localhost:3002/login');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/current-login-page.png', fullPage: true });
  
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  console.log('Has Google button:', pageContent.includes('Sign in with Google'));
  console.log('Has form:', pageContent.includes('form'));
  console.log('Body text:', await page.locator('body').innerText());
});