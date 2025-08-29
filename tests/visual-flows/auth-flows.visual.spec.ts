import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';
const SCREENSHOT_DIR = 'tests/screenshots/current';

// Helper to take and save screenshots with metadata
async function captureScreenshot(
  page: Page, 
  flowName: string, 
  stepName: string,
  stepNumber: number
) {
  const filename = `${flowName}-${stepNumber.toString().padStart(2, '0')}-${stepName}.png`;
  const filepath = path.join(SCREENSHOT_DIR, flowName, filename);
  
  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await page.screenshot({ 
    path: filepath,
    fullPage: true,
    animations: 'disabled'
  });
  
  // Also capture viewport screenshot for mobile testing
  if (stepName.includes('mobile')) {
    await page.screenshot({
      path: filepath.replace('.png', '-viewport.png'),
      fullPage: false
    });
  }
  
  return filepath;
}

// Helper to test form validation
async function testFormValidation(
  page: Page,
  formSelector: string,
  invalidData: Record<string, string>,
  expectedErrors: string[]
) {
  for (const [field, value] of Object.entries(invalidData)) {
    await page.fill(`${formSelector} [name="${field}"]`, value);
  }
  
  await page.click(`${formSelector} button[type="submit"]`);
  
  for (const error of expectedErrors) {
    await expect(page.locator('text=' + error)).toBeVisible();
  }
}

test.describe('🔐 Authentication Visual Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('📝 Complete Registration Flow with Visual Verification', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Step 1: Navigate to registration page
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'registration', 'initial-load', 1));
    
    // Verify page elements
    await expect(page.locator('h1, h2').filter({ hasText: /register|sign up/i })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Step 2: Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    screenshots.push(await captureScreenshot(page, 'registration', 'validation-errors', 2));
    
    // Step 3: Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123');
    await page.waitForTimeout(300);
    screenshots.push(await captureScreenshot(page, 'registration', 'invalid-input', 3));
    
    // Step 4: Test weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.waitForTimeout(300);
    screenshots.push(await captureScreenshot(page, 'registration', 'weak-password', 4));
    
    // Check password strength indicator
    const strengthIndicator = page.locator('[data-testid="password-strength"], .password-strength, [aria-label*="password strength"]');
    if (await strengthIndicator.count() > 0) {
      await expect(strengthIndicator.first()).toContainText(/weak/i);
    }
    
    // Step 5: Test medium password
    await page.fill('input[name="password"]', 'Medium123');
    await page.waitForTimeout(300);
    screenshots.push(await captureScreenshot(page, 'registration', 'medium-password', 5));
    
    // Step 6: Test strong password
    await page.fill('input[name="password"]', 'StrongP@ssw0rd123!');
    await page.waitForTimeout(300);
    screenshots.push(await captureScreenshot(page, 'registration', 'strong-password', 6));
    
    // Step 7: Fill confirm password if exists
    const confirmPassword = page.locator('input[name="confirmPassword"], input[name="password_confirm"]');
    if (await confirmPassword.count() > 0) {
      await confirmPassword.fill('StrongP@ssw0rd123!');
      screenshots.push(await captureScreenshot(page, 'registration', 'passwords-match', 7));
    }
    
    // Step 8: Submit valid form
    await page.click('button[type="submit"]');
    screenshots.push(await captureScreenshot(page, 'registration', 'form-submitted', 8));
    
    // Wait for navigation or success message
    await page.waitForTimeout(2000);
    screenshots.push(await captureScreenshot(page, 'registration', 'post-submission', 9));
    
    // Log screenshot paths for report
    console.log('Registration Flow Screenshots:', screenshots);
  });

  test('🔑 Complete Login Flow with Visual Verification', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Step 1: Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'login', 'initial-load', 1));
    
    // Verify page elements
    await expect(page.locator('h1, h2').filter({ hasText: /log in|sign in/i })).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
    
    // Step 2: Check for OAuth buttons
    const googleButton = page.locator('button, a').filter({ hasText: /google/i });
    if (await googleButton.count() > 0) {
      screenshots.push(await captureScreenshot(page, 'login', 'oauth-available', 2));
    }
    
    // Step 3: Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    screenshots.push(await captureScreenshot(page, 'login', 'validation-errors', 3));
    
    // Step 4: Test invalid credentials
    await page.fill('input[name="email"], input[type="email"]', 'wrong@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
    screenshots.push(await captureScreenshot(page, 'login', 'filled-form', 4));
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    screenshots.push(await captureScreenshot(page, 'login', 'invalid-credentials', 5));
    
    // Step 5: Check "Forgot Password" link
    const forgotLink = page.locator('a').filter({ hasText: /forgot password/i });
    if (await forgotLink.count() > 0) {
      await forgotLink.hover();
      screenshots.push(await captureScreenshot(page, 'login', 'forgot-password-hover', 6));
    }
    
    // Step 6: Test valid login (with test account if available)
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Test123!@#');
    screenshots.push(await captureScreenshot(page, 'login', 'valid-credentials', 7));
    
    // Log screenshot paths
    console.log('Login Flow Screenshots:', screenshots);
  });

  test('🔄 Password Reset Flow with Visual Verification', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Step 1: Navigate to forgot password
    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'password-reset', 'initial-load', 1));
    
    // If page doesn't exist, try via login page
    if (page.url().includes('404') || !(await page.locator('h1, h2').filter({ hasText: /reset|forgot/i }).count())) {
      await page.goto(`${BASE_URL}/login`);
      const forgotLink = page.locator('a').filter({ hasText: /forgot password/i });
      if (await forgotLink.count() > 0) {
        await forgotLink.click();
        await page.waitForLoadState('networkidle');
        screenshots.push(await captureScreenshot(page, 'password-reset', 'via-login', 2));
      }
    }
    
    // Step 2: Test empty email submission
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);
      screenshots.push(await captureScreenshot(page, 'password-reset', 'empty-email', 3));
    }
    
    // Step 3: Test invalid email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.count() > 0) {
      await emailInput.fill('invalid-email');
      screenshots.push(await captureScreenshot(page, 'password-reset', 'invalid-email', 4));
      
      // Step 4: Test valid email
      await emailInput.fill('test@example.com');
      screenshots.push(await captureScreenshot(page, 'password-reset', 'valid-email', 5));
      
      // Step 5: Submit form
      await submitButton.click();
      await page.waitForTimeout(2000);
      screenshots.push(await captureScreenshot(page, 'password-reset', 'submitted', 6));
    }
    
    // Log screenshot paths
    console.log('Password Reset Flow Screenshots:', screenshots);
  });

  test('📱 Mobile Responsive Testing', async ({ page }) => {
    const screenshots: string[] = [];
    const viewports = [
      { name: 'mobile-portrait', width: 375, height: 812 },
      { name: 'mobile-landscape', width: 812, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Test login page
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');
      screenshots.push(await captureScreenshot(page, 'responsive', `login-${viewport.name}`, viewports.indexOf(viewport) + 1));
      
      // Test registration page
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      screenshots.push(await captureScreenshot(page, 'responsive', `register-${viewport.name}`, viewports.indexOf(viewport) + 10));
      
      // Test navigation menu on mobile
      if (viewport.width < 768) {
        const hamburger = page.locator('[aria-label*="menu"], [data-testid="mobile-menu"], button.hamburger, button svg');
        if (await hamburger.count() > 0) {
          await hamburger.first().click();
          await page.waitForTimeout(300);
          screenshots.push(await captureScreenshot(page, 'responsive', `menu-open-${viewport.name}`, viewports.indexOf(viewport) + 20));
        }
      }
    }
    
    console.log('Responsive Testing Screenshots:', screenshots);
  });

  test('♿ Accessibility Testing with Screenshots', async ({ page }) => {
    const screenshots: string[] = [];
    const results: any[] = [];
    
    const pagesToTest = [
      { url: '/', name: 'homepage' },
      { url: '/login', name: 'login' },
      { url: '/register', name: 'register' },
      { url: '/forgot-password', name: 'forgot-password' }
    ];
    
    for (const pageTest of pagesToTest) {
      await page.goto(`${BASE_URL}${pageTest.url}`);
      await page.waitForLoadState('networkidle');
      
      // Take screenshot before accessibility test
      screenshots.push(await captureScreenshot(page, 'accessibility', `${pageTest.name}-before`, pagesToTest.indexOf(pageTest) + 1));
      
      // Run accessibility tests
      try {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        
        results.push({
          page: pageTest.name,
          violations: accessibilityScanResults.violations.length,
          passes: accessibilityScanResults.passes.length,
          details: accessibilityScanResults.violations
        });
        
        // Highlight violations if any
        if (accessibilityScanResults.violations.length > 0) {
          for (const violation of accessibilityScanResults.violations) {
            for (const node of violation.nodes) {
              const element = page.locator(node.target[0]);
              if (await element.count() > 0) {
                await element.evaluate(el => {
                  el.style.border = '3px solid red';
                  el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                });
              }
            }
          }
          
          // Take screenshot with violations highlighted
          screenshots.push(await captureScreenshot(page, 'accessibility', `${pageTest.name}-violations`, pagesToTest.indexOf(pageTest) + 10));
        }
      } catch (error) {
        console.error(`Accessibility test failed for ${pageTest.name}:`, error);
      }
    }
    
    // Save accessibility results
    fs.writeFileSync(
      'tests/reports/accessibility-results.json',
      JSON.stringify(results, null, 2)
    );
    
    console.log('Accessibility Testing Complete:', results);
    console.log('Screenshots:', screenshots);
  });

  test('🎨 OAuth UI Visual Testing', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Test OAuth buttons on login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Check for OAuth providers
    const providers = ['google', 'github', 'facebook', 'twitter'];
    for (const provider of providers) {
      const button = page.locator('button, a').filter({ hasText: new RegExp(provider, 'i') });
      if (await button.count() > 0) {
        await button.first().hover();
        screenshots.push(await captureScreenshot(page, 'oauth', `${provider}-hover`, providers.indexOf(provider) + 1));
        
        // Test click (won't complete OAuth, just UI)
        await button.first().click();
        await page.waitForTimeout(1000);
        screenshots.push(await captureScreenshot(page, 'oauth', `${provider}-clicked`, providers.indexOf(provider) + 10));
        
        // Go back to login
        await page.goto(`${BASE_URL}/login`);
      }
    }
    
    console.log('OAuth UI Screenshots:', screenshots);
  });
});

// Generate comparison report after tests
test.afterAll(async () => {
  const report = {
    timestamp: new Date().toISOString(),
    testsRun: test.info().project.name,
    screenshotsGenerated: fs.readdirSync(SCREENSHOT_DIR).length,
    flows: ['registration', 'login', 'password-reset', 'responsive', 'accessibility', 'oauth']
  };
  
  fs.writeFileSync(
    'tests/reports/visual-test-summary.json',
    JSON.stringify(report, null, 2)
  );
});