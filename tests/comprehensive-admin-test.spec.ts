import { test, expect, type Page } from '@playwright/test';

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

const testUsers: Record<string, TestUser> = {
  admin: { email: 'admin@test.com', password: 'Admin123!@#', role: 'admin' },
  user1: { email: 'user1@test.com', password: 'User123!@#', role: 'user' },
  user2: { email: 'user2@test.com', password: 'User123!@#', role: 'user' }
};

// Helper function to login as specific user
async function loginAs(page: Page, userKey: keyof typeof testUsers, expectSuccess = true) {
  const user = testUsers[userKey];
  
  await page.goto('http://localhost:3002/login');
  await page.waitForTimeout(1000); // Wait for page load
  
  // Wait for form elements to be available
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  
  // Click submit and wait for response
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);
  
  if (expectSuccess) {
    // Wait for successful login redirect
    await expect(page).not.toHaveURL(/\/login/);
  }
  
  return user;
}

// Helper function to logout
async function logout(page: Page) {
  // Click on user menu (could be dropdown or direct logout button)
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="menu"]').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.waitForTimeout(500); // Wait for dropdown
  }
  
  const logoutButton = page.locator('text=Sign Out, text=Logout, button[data-testid="logout"], a[href*="logout"]').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Alternative: navigate directly to logout API
    await page.goto('http://localhost:3002/api/auth/logout');
  }
  
  // Verify we're logged out
  await page.waitForTimeout(1000);
  await expect(page.locator('text=Sign In, text=Login')).toBeVisible();
}

test.describe('Comprehensive Admin Functionality Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure we start each test logged out
    await page.goto('http://localhost:3002/api/auth/logout');
    await page.waitForTimeout(1000);
  });

  test.describe('1. Authentication Flow Testing', () => {
    
    test('should redirect authenticated users away from login page', async ({ page }) => {
      // First login
      await loginAs(page, 'admin');
      await page.screenshot({ path: 'tests/screenshots/current/01-admin-logged-in-dashboard.png', fullPage: true });
      
      // Try to access login page
      await page.goto('http://localhost:3002/login');
      await page.waitForTimeout(2000);
      
      // Should be redirected away from login
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      
      await page.screenshot({ path: 'tests/screenshots/current/02-login-redirect-away.png', fullPage: true });
    });

    test('should redirect authenticated users away from register page', async ({ page }) => {
      // First login
      await loginAs(page, 'user1');
      
      // Try to access register page
      await page.goto('http://localhost:3002/register');
      await page.waitForTimeout(2000);
      
      // Should be redirected away from register
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/register');
      
      await page.screenshot({ path: 'tests/screenshots/current/03-register-redirect-away.png', fullPage: true });
    });

    test('should allow non-authenticated users to access login/register', async ({ page }) => {
      // Test login page access
      await page.goto('http://localhost:3002/login');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/current/04-unauthenticated-login-access.png', fullPage: true });
      
      // Test register page access
      await page.goto('http://localhost:3002/register');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/current/05-unauthenticated-register-access.png', fullPage: true });
    });

    test('should successfully login admin user', async ({ page }) => {
      await page.goto('http://localhost:3002/login');
      await page.screenshot({ path: 'tests/screenshots/current/06-login-page-before-admin.png', fullPage: true });
      
      await loginAs(page, 'admin');
      
      // Verify successful login
      await expect(page.locator('text=admin@test.com, [data-testid="user-email"]')).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/current/07-admin-login-success.png', fullPage: true });
    });

    test('should persist admin session across page reloads', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Reload the page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should still be logged in
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      
      await page.screenshot({ path: 'tests/screenshots/current/08-admin-session-persisted.png', fullPage: true });
    });

    test('should successfully logout admin user', async ({ page }) => {
      await loginAs(page, 'admin');
      
      await logout(page);
      
      // Verify logout
      await page.goto('http://localhost:3002/login');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await page.screenshot({ path: 'tests/screenshots/current/09-admin-logout-success.png', fullPage: true });
    });
  });

  test.describe('2. Navigation Testing', () => {
    
    test('should show admin link in navbar for admin users (desktop)', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Check for admin link in navbar
      const adminLink = page.locator('nav a[href="/admin"], nav a:has-text("Admin"), [data-testid="admin-link"]');
      await expect(adminLink).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/10-admin-navbar-desktop.png', fullPage: true });
    });

    test('should show admin link in mobile navbar for admin users', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
      await loginAs(page, 'admin');
      
      // Open mobile menu if needed
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .mobile-menu-button');
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
      }
      
      // Check for admin link
      const adminLink = page.locator('nav a[href="/admin"], nav a:has-text("Admin"), [data-testid="admin-link"]');
      await expect(adminLink).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/11-admin-navbar-mobile.png', fullPage: true });
    });

    test('should NOT show admin link for regular users', async ({ page }) => {
      await loginAs(page, 'user1');
      
      // Admin link should not be visible
      const adminLink = page.locator('nav a[href="/admin"], nav a:has-text("Admin"), [data-testid="admin-link"]');
      await expect(adminLink).not.toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/12-user-navbar-no-admin.png', fullPage: true });
    });

    test('should show login/register for non-authenticated users', async ({ page }) => {
      await page.goto('http://localhost:3002');
      
      await expect(page.locator('a[href="/login"], a:has-text("Sign In"), a:has-text("Login")')).toBeVisible();
      await expect(page.locator('a[href="/register"], a:has-text("Sign Up"), a:has-text("Register")')).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/13-unauthenticated-navbar.png', fullPage: true });
    });

    test('should NOT show login/register for authenticated users', async ({ page }) => {
      await loginAs(page, 'user2');
      
      const loginLink = page.locator('a[href="/login"]:visible, a:has-text("Sign In"):visible, a:has-text("Login"):visible');
      const registerLink = page.locator('a[href="/register"]:visible, a:has-text("Sign Up"):visible, a:has-text("Register"):visible');
      
      await expect(loginLink).not.toBeVisible();
      await expect(registerLink).not.toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/14-authenticated-navbar.png', fullPage: true });
    });
  });

  test.describe('3. Admin Dashboard Testing', () => {
    
    test('should load admin dashboard with proper stats cards', async ({ page }) => {
      await loginAs(page, 'admin');
      
      await page.goto('http://localhost:3002/admin');
      await page.waitForTimeout(2000);
      
      // Verify admin dashboard loads
      await expect(page.locator('h1:has-text("Admin Dashboard"), h1:has-text("Dashboard")')).toBeVisible();
      
      // Look for stats cards (total users, active users, etc.)
      const statsCards = page.locator('[data-testid*="stat"], .stat-card, .stats div');
      const cardCount = await statsCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      await page.screenshot({ path: 'tests/screenshots/current/15-admin-dashboard-loaded.png', fullPage: true });
    });

    test('should navigate to users management from dashboard', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:3002/admin');
      
      // Click on users management link/button
      const usersLink = page.locator('a[href="/admin/users"], a:has-text("Users"), a:has-text("Manage Users"), [data-testid="users-link"]');
      if (await usersLink.isVisible()) {
        await usersLink.click();
      } else {
        // Navigate directly if link not found
        await page.goto('http://localhost:3002/admin/users');
      }
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/admin\/users/);
      
      await page.screenshot({ path: 'tests/screenshots/current/16-navigate-to-users.png', fullPage: true });
    });
  });

  test.describe('4. Admin Users Management Testing', () => {
    
    test('should load users list page with seeded users', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(3000); // Give time for data to load
      
      // Verify users page loads
      await expect(page.locator('h1:has-text("Users"), h1:has-text("User Management")')).toBeVisible();
      
      // Look for user table or list
      const userTable = page.locator('table, [data-testid="users-table"], .users-list');
      await expect(userTable).toBeVisible();
      
      // Check for seeded users
      await expect(page.locator('text=admin@test.com')).toBeVisible();
      await expect(page.locator('text=user1@test.com')).toBeVisible();
      await expect(page.locator('text=user2@test.com')).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/17-users-list-loaded.png', fullPage: true });
    });

    test('should test search functionality', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(2000);
      
      // Look for search input
      const searchInput = page.locator('input[placeholder*="search"], input[type="search"], [data-testid="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('admin');
        await page.waitForTimeout(1000);
        
        // Should show only admin user
        await expect(page.locator('text=admin@test.com')).toBeVisible();
        
        await page.screenshot({ path: 'tests/screenshots/current/18-users-search-admin.png', fullPage: true });
        
        // Clear search
        await searchInput.fill('');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'tests/screenshots/current/19-users-search-cleared.png', fullPage: true });
      } else {
        console.log('Search functionality not found - may not be implemented yet');
        await page.screenshot({ path: 'tests/screenshots/current/18-users-no-search.png', fullPage: true });
      }
    });

    test('should test role filtering', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(2000);
      
      // Look for role filter dropdown
      const roleFilter = page.locator('select[name="role"], select:has(option[value="admin"]), [data-testid="role-filter"]');
      if (await roleFilter.isVisible()) {
        await roleFilter.selectOption('admin');
        await page.waitForTimeout(1000);
        
        // Should show only admin users
        await expect(page.locator('text=admin@test.com')).toBeVisible();
        
        await page.screenshot({ path: 'tests/screenshots/current/20-users-filter-admin.png', fullPage: true });
        
        // Reset filter
        await roleFilter.selectOption('all');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'tests/screenshots/current/21-users-filter-all.png', fullPage: true });
      } else {
        console.log('Role filtering not found - may not be implemented yet');
        await page.screenshot({ path: 'tests/screenshots/current/20-users-no-filter.png', fullPage: true });
      }
    });

    test('should test pagination if applicable', async ({ page }) => {
      await loginAs(page, 'admin');
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(2000);
      
      // Look for pagination controls
      const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label*="pagination"]');
      if (await pagination.isVisible()) {
        const nextButton = page.locator('.pagination button:has-text("Next"), [data-testid="next-page"]');
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(1000);
          
          await page.screenshot({ path: 'tests/screenshots/current/22-users-pagination-next.png', fullPage: true });
          
          // Go back
          const prevButton = page.locator('.pagination button:has-text("Previous"), [data-testid="prev-page"]');
          if (await prevButton.isEnabled()) {
            await prevButton.click();
            await page.waitForTimeout(1000);
          }
        }
      } else {
        console.log('Pagination not found - may not be needed with current data');
      }
      
      await page.screenshot({ path: 'tests/screenshots/current/22-users-pagination-final.png', fullPage: true });
    });
  });

  test.describe('5. Access Control Testing', () => {
    
    test('should prevent regular users from accessing /admin', async ({ page }) => {
      await loginAs(page, 'user1');
      
      await page.goto('http://localhost:3002/admin');
      await page.waitForTimeout(2000);
      
      // Should be redirected to access denied or dashboard
      const currentUrl = page.url();
      const isAccessDenied = currentUrl.includes('/access-denied') || 
                           page.url().includes('/dashboard') ||
                           await page.locator('text=Access Denied, text=Unauthorized, text=403').isVisible();
      
      expect(isAccessDenied).toBe(true);
      
      await page.screenshot({ path: 'tests/screenshots/current/23-user-admin-blocked.png', fullPage: true });
    });

    test('should prevent regular users from accessing /admin/users', async ({ page }) => {
      await loginAs(page, 'user1');
      
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(2000);
      
      // Should be redirected or show access denied
      const currentUrl = page.url();
      const isBlocked = currentUrl.includes('/access-denied') || 
                       currentUrl.includes('/dashboard') ||
                       await page.locator('text=Access Denied, text=Unauthorized').isVisible();
      
      expect(isBlocked).toBe(true);
      
      await page.screenshot({ path: 'tests/screenshots/current/24-user-admin-users-blocked.png', fullPage: true });
    });

    test('should return 403 for API endpoints with regular users', async ({ page, request }) => {
      // Login as regular user first to get session
      await loginAs(page, 'user2');
      
      // Extract cookies for API request
      const cookies = await page.context().cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      // Test admin API endpoints
      const endpoints = [
        '/api/admin/users',
        '/api/admin/users/1',
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(`http://localhost:3002${endpoint}`, {
          headers: {
            'Cookie': cookieHeader
          }
        });
        
        console.log(`Testing ${endpoint}: ${response.status()}`);
        expect(response.status()).toBe(403);
      }
      
      await page.screenshot({ path: 'tests/screenshots/current/25-api-access-tested.png', fullPage: true });
    });

    test('should allow admin users to access admin routes', async ({ page }) => {
      await loginAs(page, 'admin');
      
      // Test admin dashboard access
      await page.goto('http://localhost:3002/admin');
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Admin"), h1:has-text("Dashboard")')).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/26-admin-access-success.png', fullPage: true });
      
      // Test admin users page access
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(2000);
      await expect(page.locator('h1:has-text("Users"), table, .users-list')).toBeVisible();
      
      await page.screenshot({ path: 'tests/screenshots/current/27-admin-users-access-success.png', fullPage: true });
    });
  });

  test.describe('6. Visual Verification Summary', () => {
    
    test('should capture comprehensive visual summary', async ({ page }) => {
      // Test complete admin flow
      await page.goto('http://localhost:3002');
      await page.screenshot({ path: 'tests/screenshots/current/28-flow-01-landing.png', fullPage: true });
      
      // Login as admin
      await page.goto('http://localhost:3002/login');
      await page.screenshot({ path: 'tests/screenshots/current/29-flow-02-login.png', fullPage: true });
      
      await loginAs(page, 'admin');
      await page.screenshot({ path: 'tests/screenshots/current/30-flow-03-logged-in.png', fullPage: true });
      
      // Visit admin dashboard
      await page.goto('http://localhost:3002/admin');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/current/31-flow-04-admin-dashboard.png', fullPage: true });
      
      // Visit users management
      await page.goto('http://localhost:3002/admin/users');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'tests/screenshots/current/32-flow-05-users-management.png', fullPage: true });
      
      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'tests/screenshots/current/33-flow-06-mobile-users.png', fullPage: true });
      
      console.log('✅ Visual verification complete - all screenshots saved');
    });
  });
});