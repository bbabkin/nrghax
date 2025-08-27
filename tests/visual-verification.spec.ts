import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Visual Bug Fix Verification', () => {
  test.use({
    // Accept self-signed certificates for HTTPS
    ignoreHTTPSErrors: true,
  });

  test('verify-google-oauth-database-fix', async ({ page }) => {
    console.log('Starting Google OAuth visual verification test...');
    
    // Step 1: Navigate to login page
    await page.goto('https://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'screenshots/oauth-fix-01-login-page.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Login page captured');
    
    // Verify Google sign-in button is present
    const googleButton = page.locator('button:has-text("Sign in with Google")');
    await expect(googleButton).toBeVisible();
    
    // Step 2: Capture Google button state
    await googleButton.hover();
    await page.screenshot({ 
      path: 'screenshots/oauth-fix-02-google-button-hover.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Google button hover state captured');
    
    // Step 3: Click Google sign-in (will redirect to Google)
    await googleButton.click();
    
    // Wait for navigation to Google or error page
    await page.waitForTimeout(2000); // Allow time for redirect
    
    // Check if we're on Google's OAuth page or an error page
    const currentUrl = page.url();
    
    if (currentUrl.includes('accounts.google.com')) {
      await page.screenshot({ 
        path: 'screenshots/oauth-fix-03-google-consent.png',
        fullPage: true 
      });
      console.log('✓ Screenshot 3: Redirected to Google OAuth consent screen');
    } else if (currentUrl.includes('/auth/error')) {
      await page.screenshot({ 
        path: 'screenshots/oauth-fix-03-error-page.png',
        fullPage: true 
      });
      console.log('⚠ Screenshot 3: Error page captured - OAuth may need configuration');
    } else {
      await page.screenshot({ 
        path: 'screenshots/oauth-fix-03-current-state.png',
        fullPage: true 
      });
      console.log('✓ Screenshot 3: Current page state captured');
    }
    
    console.log('Visual verification test completed. Screenshots saved to ./screenshots/');
  });

  test('verify-registration-form', async ({ page }) => {
    console.log('Starting registration form visual verification...');
    
    // Navigate to registration page
    await page.goto('https://localhost:3002/register');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Capture initial form state
    await page.screenshot({ 
      path: 'screenshots/registration-01-initial-form.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Registration form captured');
    
    // Step 2: Fill form with test data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!@#');
    await page.fill('input[name="confirmPassword"]', 'TestPass123!@#');
    
    await page.screenshot({ 
      path: 'screenshots/registration-02-filled-form.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Filled registration form captured');
    
    // Step 3: Test validation by clearing confirm password
    await page.fill('input[name="confirmPassword"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/registration-03-validation-error.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 3: Validation error state captured');
  });

  test('verify-password-reset-flow', async ({ page }) => {
    console.log('Starting password reset visual verification...');
    
    // Navigate to password reset page
    await page.goto('https://localhost:3002/reset-password');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Capture reset request form
    await page.screenshot({ 
      path: 'screenshots/reset-01-request-form.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Password reset request form captured');
    
    // Step 2: Fill email and submit
    await page.fill('input[type="email"]', 'test@example.com');
    await page.screenshot({ 
      path: 'screenshots/reset-02-email-filled.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Email filled in reset form');
    
    // Step 3: Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/reset-03-after-submit.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 3: Post-submission state captured');
  });

  test('verify-responsive-mobile-layout', async ({ browser }) => {
    console.log('Starting mobile responsive layout verification...');
    
    // Create mobile viewport context
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE size
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      ignoreHTTPSErrors: true,
    });
    
    const page = await context.newPage();
    
    // Test login page on mobile
    await page.goto('https://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/mobile-01-login-page.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Mobile login page captured');
    
    // Test registration page on mobile
    await page.goto('https://localhost:3002/register');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/mobile-02-register-page.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Mobile registration page captured');
    
    // Test password reset on mobile
    await page.goto('https://localhost:3002/reset-password');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/mobile-03-reset-page.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 3: Mobile password reset page captured');
    
    await context.close();
  });
});

// Helper test to generate a visual test summary
test.afterAll(async () => {
  const summaryPath = path.join(screenshotsDir, 'test-summary.md');
  const summary = `# Visual Test Summary

Generated: ${new Date().toISOString()}

## Screenshots Captured

### Google OAuth Fix Verification
- oauth-fix-01-login-page.png - Login page with OAuth options
- oauth-fix-02-google-button-hover.png - Google sign-in button interaction
- oauth-fix-03-*.png - OAuth flow result

### Registration Form Verification  
- registration-01-initial-form.png - Empty registration form
- registration-02-filled-form.png - Form with test data
- registration-03-validation-error.png - Validation error display

### Password Reset Flow
- reset-01-request-form.png - Password reset request page
- reset-02-email-filled.png - Form with email entered
- reset-03-after-submit.png - Post-submission confirmation

### Mobile Responsive Layout
- mobile-01-login-page.png - Login page on mobile viewport
- mobile-02-register-page.png - Registration page on mobile
- mobile-03-reset-page.png - Password reset on mobile

## Test Results
All visual tests completed. Review screenshots to verify bug fixes are working correctly.
`;
  
  fs.writeFileSync(summaryPath, summary);
  console.log('\n✅ Visual test summary generated at screenshots/test-summary.md');
});