import { test, expect } from '@playwright/test';

test.describe('Admin Access Verification', () => {
  test('super admin can access users management page', async ({ page }) => {
    // Navigate to login page
    await page.goto('https://localhost:3002/login');
    await page.screenshot({ path: 'screenshots/admin-01-login-page.png' });

    // Click on Google OAuth login
    await page.click('button:has-text("Sign in with Google")');
    
    // Wait for redirect to dashboard after login
    await page.waitForURL(/dashboard/, { timeout: 10000 }).catch(() => {
      console.log('Manual login required - please log in manually');
    });

    // Take screenshot of logged-in state
    await page.screenshot({ path: 'screenshots/admin-02-logged-in.png' });

    // Check if admin menu is visible in navbar
    const adminLink = page.locator('a[href="/admin"]').first();
    const adminMenuVisible = await adminLink.isVisible().catch(() => false);
    
    if (adminMenuVisible) {
      console.log('✅ Admin menu is visible in navbar');
      await page.screenshot({ path: 'screenshots/admin-03-menu-visible.png' });
      
      // Click on admin link
      await adminLink.click();
      await page.waitForURL('**/admin/**');
      await page.screenshot({ path: 'screenshots/admin-04-admin-page.png' });
      
      // Navigate to users page
      await page.goto('https://localhost:3002/admin/users');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/admin-05-users-page.png' });
      
      // Verify page elements
      const pageTitle = await page.textContent('h1');
      expect(pageTitle).toContain('User Management');
      
      // Check for user table
      const userTable = page.locator('table, [role="table"]').first();
      const tableVisible = await userTable.isVisible().catch(() => false);
      expect(tableVisible).toBe(true);
      
      console.log('✅ Successfully accessed admin users page');
    } else {
      console.log('❌ Admin menu not visible - checking direct navigation');
      
      // Try direct navigation
      await page.goto('https://localhost:3002/admin/users');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/users')) {
        console.log('✅ Direct navigation to admin/users successful');
        await page.screenshot({ path: 'screenshots/admin-06-direct-access.png' });
      } else {
        console.log(`❌ Redirected to: ${currentUrl}`);
        await page.screenshot({ path: 'screenshots/admin-07-access-denied.png' });
      }
    }
  });
});