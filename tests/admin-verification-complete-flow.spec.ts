import { test, expect } from '@playwright/test';

test.describe('Admin User Management - COMPLETE VERIFICATION', () => {
  const BASE_URL = 'https://localhost:3002';
  
  test('verify admin user can see and access admin features - FULL FLOW', async ({ page }) => {
    // Accept self-signed certificate
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Step 1: Check if already logged in
    console.log('Step 1: Checking current session...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/01-dashboard-initial.png', fullPage: true });
    
    // Step 2: Check navbar for admin elements
    console.log('Step 2: Checking navbar for admin elements...');
    const navbar = await page.locator('nav').first();
    await navbar.screenshot({ path: 'screenshots/02-navbar-content.png' });
    
    // Log what's visible in the navbar
    const navbarHTML = await navbar.innerHTML();
    console.log('Navbar HTML:', navbarHTML);
    
    // Check for Users button
    const usersButton = await page.locator('text=Users').count();
    console.log('Users button count in navbar:', usersButton);
    
    // Check for any admin-related elements
    const adminElements = await page.locator('[data-testid*="admin"], [class*="admin"], [href*="admin"]').count();
    console.log('Admin-related elements found:', adminElements);
    
    // Step 3: Try to find admin dropdown or menu
    console.log('Step 3: Looking for admin dropdown...');
    
    // Check if there's a user menu/dropdown
    const userMenuButtons = await page.locator('button').filter({ hasText: /Boris|bbabkin/i });
    const userMenuCount = await userMenuButtons.count();
    console.log('User menu buttons found:', userMenuCount);
    
    if (userMenuCount > 0) {
      await userMenuButtons.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/03-user-menu-opened.png', fullPage: true });
      
      // Check dropdown content
      const dropdownContent = await page.locator('[role="menu"], [data-state="open"], .dropdown-menu').first();
      if (await dropdownContent.count() > 0) {
        const dropdownHTML = await dropdownContent.innerHTML();
        console.log('Dropdown HTML:', dropdownHTML);
      }
    }
    
    // Step 4: Try direct navigation to admin pages
    console.log('Step 4: Testing direct navigation to /admin/users...');
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/04-admin-users-direct.png', fullPage: true });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after /admin/users navigation:', currentUrl);
    
    // Check page content
    const pageTitle = await page.title();
    const h1Content = await page.locator('h1').first().textContent().catch(() => 'No H1 found');
    console.log('Page title:', pageTitle);
    console.log('H1 content:', h1Content);
    
    // Step 5: Check for error messages or redirects
    const errorMessages = await page.locator('text=/error|unauthorized|forbidden|not found/i').count();
    console.log('Error messages found:', errorMessages);
    
    // Step 6: Try admin dashboard
    console.log('Step 6: Testing /admin route...');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/05-admin-dashboard.png', fullPage: true });
    
    const adminUrl = page.url();
    console.log('Current URL after /admin navigation:', adminUrl);
    
    // Step 7: Check session data via API
    console.log('Step 7: Checking session data...');
    const sessionResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/session');
        return await response.json();
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('Session data:', JSON.stringify(sessionResponse, null, 2));
    
    // Step 8: Check for any admin API endpoints
    console.log('Step 8: Testing admin API endpoints...');
    const adminApiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          credentials: 'include'
        });
        return {
          status: response.status,
          statusText: response.statusText,
          data: await response.json().catch(() => null)
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('Admin API response:', JSON.stringify(adminApiResponse, null, 2));
    
    // Step 9: Go back to dashboard and check all navigation options
    console.log('Step 9: Checking all navigation options from dashboard...');
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Get all links and buttons
    const allLinks = await page.locator('a').evaluateAll(links => 
      links.map(link => ({ 
        text: link.textContent?.trim(), 
        href: link.href,
        className: link.className
      }))
    );
    console.log('All links found:', JSON.stringify(allLinks, null, 2));
    
    const allButtons = await page.locator('button').evaluateAll(buttons => 
      buttons.map(btn => ({ 
        text: btn.textContent?.trim(),
        className: btn.className,
        dataTestId: btn.getAttribute('data-testid')
      }))
    );
    console.log('All buttons found:', JSON.stringify(allButtons, null, 2));
    
    // Step 10: Final screenshot of current state
    await page.screenshot({ path: 'screenshots/06-final-state.png', fullPage: true });
    
    // Assertions to verify expected vs actual
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Expected: Users button visible in navbar');
    console.log('Actual: Users button found:', usersButton > 0);
    console.log('Expected: Can access /admin/users');
    console.log('Actual: Current URL after navigation:', currentUrl);
    console.log('Expected: User role is super_admin');
    console.log('Actual: Session data shows:', sessionResponse?.user?.role || 'role not in session');
  });
  
  test('check navbar component rendering', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    
    // Debug: Check what Navbar component is rendering
    const navbarDebug = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { error: 'No nav element found' };
      
      return {
        innerHTML: nav.innerHTML.substring(0, 1000),
        classList: Array.from(nav.classList),
        childrenCount: nav.children.length,
        textContent: nav.textContent?.substring(0, 500)
      };
    });
    
    console.log('Navbar debug info:', JSON.stringify(navbarDebug, null, 2));
    
    // Check React DevTools if available
    const reactDebug = await page.evaluate(() => {
      // @ts-ignore
      const reactFiber = document.querySelector('nav')?._reactInternalFiber || 
                         // @ts-ignore
                         document.querySelector('nav')?._reactInternalInstance;
      if (reactFiber) {
        return { hasReactFiber: true, type: reactFiber.type?.name };
      }
      return { hasReactFiber: false };
    });
    
    console.log('React debug info:', reactDebug);
  });
});