import { test, expect } from '@playwright/test';

test.describe('Diagnostic Admin Testing', () => {
  
  test('should diagnose login page and form elements', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3002');
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-01-homepage.png', fullPage: true });
    
    // Navigate to login
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-02-login-page.png', fullPage: true });
    
    // Check for form elements
    const emailInput = page.locator('input[name="email"], input[type="email"], input#email');
    const passwordInput = page.locator('input[name="password"], input[type="password"], input#password');
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    console.log('Email input count:', await emailInput.count());
    console.log('Password input count:', await passwordInput.count());
    console.log('Submit button count:', await submitButton.count());
    
    // Try to fill form if elements exist
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('admin@test.com');
      console.log('✅ Email filled successfully');
    } else {
      console.log('❌ No email input found');
    }
    
    if (await passwordInput.count() > 0) {
      await passwordInput.first().fill('Admin123!@#');
      console.log('✅ Password filled successfully');
    } else {
      console.log('❌ No password input found');
    }
    
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-03-form-filled.png', fullPage: true });
    
    // Try to submit
    if (await submitButton.count() > 0) {
      console.log('✅ Submit button found, clicking...');
      await submitButton.first().click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'tests/screenshots/current/diagnostic-04-after-submit.png', fullPage: true });
      
      const currentUrl = page.url();
      console.log('Current URL after submit:', currentUrl);
    } else {
      console.log('❌ No submit button found');
    }
  });

  test('should check admin page directly', async ({ page }) => {
    await page.goto('http://localhost:3002/admin');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-05-admin-direct.png', fullPage: true });
    
    const currentUrl = page.url();
    console.log('Current URL when accessing /admin directly:', currentUrl);
    
    // Check what's on the page
    const pageTitle = await page.locator('h1, h2, title').first().textContent();
    console.log('Page title/heading:', pageTitle);
  });

  test('should check navigation elements', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    
    // Look for navigation elements
    const nav = page.locator('nav');
    const navCount = await nav.count();
    console.log('Navigation elements found:', navCount);
    
    if (navCount > 0) {
      const navLinks = page.locator('nav a');
      const linkCount = await navLinks.count();
      console.log('Navigation links found:', linkCount);
      
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const linkText = await navLinks.nth(i).textContent();
        const linkHref = await navLinks.nth(i).getAttribute('href');
        console.log(`Link ${i + 1}: "${linkText}" -> ${linkHref}`);
      }
    }
    
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-06-navigation.png', fullPage: true });
  });

  test('should test API endpoints directly', async ({ page, request }) => {
    // Test if API endpoints are accessible
    const endpoints = [
      '/api/admin/users',
      '/api/auth/session'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`http://localhost:3002${endpoint}`);
        console.log(`${endpoint}: ${response.status()} ${response.statusText()}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error}`);
      }
    }
    
    // Take a final screenshot
    await page.goto('http://localhost:3002');
    await page.screenshot({ path: 'tests/screenshots/current/diagnostic-07-final.png', fullPage: true });
  });
});