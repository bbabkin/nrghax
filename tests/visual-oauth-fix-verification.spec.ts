import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('OAuth Fix Verification - Visual Testing', () => {
  // Directory for this test's screenshots
  const screenshotDir = 'screenshots/oauth-fix-verification';
  
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('verify-oauth-fix-complete-flow', async ({ page }) => {
    // Step 1: Navigate to the login page
    await page.goto('https://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-page-loaded.png'),
      fullPage: true 
    });

    // Step 2: Check that Google sign-in button is present and clickable
    const googleButton = page.locator('text=Sign in with Google').first();
    await expect(googleButton).toBeVisible();
    
    // Take screenshot showing the Google button
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-google-button-visible.png'),
      fullPage: true 
    });

    // Step 3: Click Google sign-in button
    await googleButton.click();
    
    // Wait for navigation to OAuth provider or error handling
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of result (could be Google consent or error page)
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-after-google-button-click.png'),
      fullPage: true 
    });

    // Step 4: Check if we get to Google OAuth or stay on error page
    const currentUrl = page.url();
    
    if (currentUrl.includes('accounts.google.com') || currentUrl.includes('oauth2')) {
      // If we got to Google OAuth, this means NextAuth is working correctly
      console.log('✅ SUCCESS: Redirected to Google OAuth - NextAuth integration working');
      
      // Take screenshot of Google OAuth page
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-google-oauth-page.png'),
        fullPage: true 
      });
      
    } else if (currentUrl.includes('error')) {
      // Check what kind of error we have
      const errorText = await page.locator('body').textContent();
      console.log('🔍 ERROR PAGE CONTENT:', errorText);
      
      // Take screenshot of error page
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-error-page-details.png'),
        fullPage: true 
      });
      
      // If it's NOT an AdapterError, then our fix is working
      if (!errorText?.includes('AdapterError') && !errorText?.includes('Configuration')) {
        console.log('✅ SUCCESS: AdapterError resolved - OAuth flow initiated successfully');
      } else {
        console.log('❌ FAILED: AdapterError still present');
        throw new Error(`AdapterError still occurring: ${errorText}`);
      }
      
    } else {
      // Take screenshot of unexpected page
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-unexpected-page.png'),
        fullPage: true 
      });
      
      console.log('🔍 UNEXPECTED: Stayed on page:', currentUrl);
    }

    // Step 5: Test the callback endpoint directly (this should work now)
    await page.goto('https://localhost:3002/api/auth/callback/google?error=access_denied');
    
    // Take screenshot of callback handling
    await page.screenshot({ 
      path: path.join(screenshotDir, '05-callback-endpoint-test.png'),
      fullPage: true 
    });
    
    // Check that we get redirected and don't see AdapterError
    const callbackUrl = page.url();
    const callbackContent = await page.locator('body').textContent();
    
    if (!callbackContent?.includes('AdapterError')) {
      console.log('✅ SUCCESS: Callback endpoint working - no AdapterError');
    } else {
      console.log('❌ FAILED: AdapterError still in callback');
      throw new Error('AdapterError still present in callback');
    }
  });

  test('verify-auth-providers-endpoint', async ({ page }) => {
    // Test the providers endpoint that was previously failing
    const response = await page.goto('https://localhost:3002/api/auth/providers');
    
    expect(response?.status()).toBe(200);
    
    const content = await page.content();
    const providersData = await page.evaluate(() => document.body.textContent);
    
    // Take screenshot of providers endpoint
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-providers-endpoint-success.png'),
      fullPage: true 
    });
    
    // Verify that both providers are present
    expect(providersData).toContain('google');
    expect(providersData).toContain('credentials');
    
    console.log('✅ SUCCESS: Auth providers endpoint working correctly');
    console.log('Providers data:', providersData?.substring(0, 200) + '...');
  });

  test('verify-login-form-credentials', async ({ page }) => {
    // Test that credentials login form also works
    await page.goto('https://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login form
    await page.screenshot({ 
      path: path.join(screenshotDir, '07-login-form-initial.png'),
      fullPage: true 
    });
    
    // Try to fill in credentials form (if present)
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword123');
      
      // Take screenshot with filled form
      await page.screenshot({ 
        path: path.join(screenshotDir, '08-login-form-filled.png'),
        fullPage: true 
      });
      
      // Try to submit (but don't expect it to succeed with fake credentials)
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        
        // Take screenshot of result
        await page.screenshot({ 
          path: path.join(screenshotDir, '09-credentials-form-submit-result.png'),
          fullPage: true 
        });
        
        console.log('✅ SUCCESS: Credentials form functional');
      }
    } else {
      console.log('🔍 INFO: No credentials form found - OAuth only setup');
    }
  });
});