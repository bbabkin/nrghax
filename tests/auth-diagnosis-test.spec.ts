import { test, expect } from '@playwright/test';

test.describe('Authentication Diagnosis', () => {
  
  test('should diagnose authentication system step by step', async ({ page, context }) => {
    console.log('=== Starting Authentication Diagnosis ===');
    
    // Step 1: Check the home page
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-01-home.png', fullPage: true });
    console.log('✅ Home page loaded');
    
    // Step 2: Go to login page
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-02-login-form.png', fullPage: true });
    
    // Check if login form elements are present with correct names
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log('✅ Login form elements found');
    
    // Step 3: Fill and submit form manually
    await emailInput.fill('admin@test.com');
    await passwordInput.fill('Admin123!@#');
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-03-form-filled.png', fullPage: true });
    console.log('✅ Form filled with credentials');
    
    // Step 4: Click submit and observe what happens
    console.log('Clicking submit button...');
    await submitButton.click();
    
    // Wait for either redirect or error message
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    console.log('URL after form submission:', currentUrl);
    
    // Check for error messages
    const errorMessage = page.locator('[role="alert"], .error, .text-red-600, .text-red-700');
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.first().textContent();
      console.log('❌ Error message found:', errorText);
    } else {
      console.log('✅ No error messages visible');
    }
    
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-04-after-submit.png', fullPage: true });
    
    // Step 5: Check cookies to see if session was created
    const cookies = await context.cookies();
    console.log('Cookies after login attempt:');
    cookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });
    
    // Step 6: Test session endpoint directly
    const sessionResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    console.log('Session API response:', sessionResponse);
    
    // Step 7: Try manual login via API
    const loginResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/signin/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'Admin123!@#',
            csrfToken: '' // Would need to get this properly
          }),
          credentials: 'include'
        });
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    console.log('Manual API login response:', loginResponse);
    
    // Step 8: Check if user exists in database by calling admin API
    const adminUsersResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/users', {
          credentials: 'include'
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.toString() };
      }
    });
    console.log('Admin users API response:', adminUsersResponse);
    
    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-05-final.png', fullPage: true });
  });

  test('should test direct admin access with manual session', async ({ page }) => {
    // Try to access admin area directly
    await page.goto('http://localhost:3002/admin');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Admin access redirect URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Correctly redirected to login when not authenticated');
    } else {
      console.log('❌ Not redirected to login - authentication might be bypassed');
    }
    
    await page.screenshot({ path: 'tests/screenshots/current/auth-diag-06-admin-access.png', fullPage: true });
  });

  test('should check seeded users in database', async ({ page, request }) => {
    // Test if we can access the users API to see if seeded data exists
    try {
      const response = await request.get('http://localhost:3002/api/admin/users');
      const data = await response.json();
      
      console.log('Admin users API status:', response.status());
      console.log('Admin users API data:', JSON.stringify(data, null, 2));
      
      if (response.status() === 200 && data.users) {
        const adminUser = data.users.find((u: any) => u.email === 'admin@test.com');
        const user1 = data.users.find((u: any) => u.email === 'user1@test.com');
        const user2 = data.users.find((u: any) => u.email === 'user2@test.com');
        
        console.log('Seeded users check:');
        console.log('  - admin@test.com:', adminUser ? '✅ Found' : '❌ Missing');
        console.log('  - user1@test.com:', user1 ? '✅ Found' : '❌ Missing');
        console.log('  - user2@test.com:', user2 ? '✅ Found' : '❌ Missing');
      }
    } catch (error) {
      console.log('Error checking seeded users:', error);
    }
  });
});