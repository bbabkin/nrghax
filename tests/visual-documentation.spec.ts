import { test, expect } from '@playwright/test';

test.describe('Visual Documentation of Admin System Current State', () => {
  
  test('should document current state of all admin-related pages', async ({ page }) => {
    console.log('=== VISUAL DOCUMENTATION: Admin System Current State ===');
    
    // Home Page
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-01-homepage.png', 
      fullPage: true 
    });
    console.log('✅ Homepage documented');
    
    // Login Page - Show current state
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-02-login-page.png', 
      fullPage: true 
    });
    
    // Fill form to show state
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('Admin123!@#');
      await page.screenshot({ 
        path: 'tests/screenshots/current/visual-doc-03-login-filled.png', 
        fullPage: true 
      });
      
      // Show what happens on submit (the bug)
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: 'tests/screenshots/current/visual-doc-04-login-submit-bug.png', 
        fullPage: true 
      });
      console.log('✅ Login form bug documented');
    }
    
    // Register Page
    await page.goto('http://localhost:3002/register');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-05-register-page.png', 
      fullPage: true 
    });
    console.log('✅ Register page documented');
    
    // Admin Direct Access (Should redirect to login)
    await page.goto('http://localhost:3002/admin');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-06-admin-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Admin redirect behavior documented');
    
    // Admin Users Direct Access  
    await page.goto('http://localhost:3002/admin/users');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-07-admin-users-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Admin users redirect behavior documented');
    
    // Access Denied Page (if it exists)
    await page.goto('http://localhost:3002/access-denied');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-08-access-denied.png', 
      fullPage: true 
    });
    console.log('✅ Access denied page documented');
    
    // Dashboard (should also redirect)
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-09-dashboard-redirect.png', 
      fullPage: true 
    });
    console.log('✅ Dashboard redirect behavior documented');
    
    // Mobile Views - Login
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3002/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-10-mobile-login.png', 
      fullPage: true 
    });
    console.log('✅ Mobile login view documented');
    
    // Mobile Views - Register  
    await page.goto('http://localhost:3002/register');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-11-mobile-register.png', 
      fullPage: true 
    });
    console.log('✅ Mobile register view documented');
    
    // Reset back to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('=== VISUAL DOCUMENTATION COMPLETE ===');
  });

  test('should test navigation elements visibility', async ({ page }) => {
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(3000);
    
    // Check what navigation elements exist
    const navElements = page.locator('nav a');
    const count = await navElements.count();
    console.log(`Found ${count} navigation links`);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await navElements.nth(i).textContent();
      const href = await navElements.nth(i).getAttribute('href');
      console.log(`Nav Link ${i + 1}: "${text}" -> ${href}`);
    }
    
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-12-navigation-analysis.png', 
      fullPage: true 
    });
  });

  test('should test API endpoints status', async ({ page, request }) => {
    console.log('=== API ENDPOINTS STATUS TEST ===');
    
    const endpoints = [
      { url: '/api/auth/session', name: 'Session API' },
      { url: '/api/admin/users', name: 'Admin Users API' },
      { url: '/api/auth/providers', name: 'Auth Providers API' },
      { url: '/api/auth/csrf', name: 'CSRF Token API' }
    ];
    
    const results: any[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`http://localhost:3002${endpoint.url}`);
        const status = response.status();
        const contentType = response.headers()['content-type'] || 'unknown';
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status,
          contentType,
          working: status >= 200 && status < 300
        });
        
        console.log(`${endpoint.name}: ${status} (${contentType})`);
      } catch (error) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          error: error.toString(),
          working: false
        });
        console.log(`${endpoint.name}: ERROR - ${error}`);
      }
    }
    
    // Save results to a JSON file for the report
    await page.evaluate((results) => {
      console.log('API Test Results:', JSON.stringify(results, null, 2));
    }, results);
    
    await page.goto('http://localhost:3002');
    await page.screenshot({ 
      path: 'tests/screenshots/current/visual-doc-13-api-test-complete.png', 
      fullPage: true 
    });
    
    console.log('=== API TESTING COMPLETE ===');
  });
});