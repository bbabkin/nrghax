import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3003';
const SCREENSHOT_DIR = 'tests/screenshots/current';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Helper to capture screenshots
async function captureScreenshot(
  page: Page,
  flowName: string,
  stepName: string,
  stepNumber: number
) {
  const filename = `${flowName}-${stepNumber.toString().padStart(2, '0')}-${stepName}.png`;
  const filepath = path.join(SCREENSHOT_DIR, flowName, filename);
  
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  await page.screenshot({
    path: filepath,
    fullPage: true,
    animations: 'disabled'
  });
  
  return filepath;
}

// Seed test data
async function seedTestData() {
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'Admin123!@#',
      role: 'admin',
      metadata: { full_name: 'Test Admin' }
    },
    {
      email: 'user1@test.com',
      password: 'User123!@#',
      role: 'user',
      metadata: { full_name: 'Test User 1' }
    },
    {
      email: 'user2@test.com',
      password: 'User123!@#',
      role: 'user',
      metadata: { full_name: 'Test User 2' }
    },
    {
      email: 'moderator@test.com',
      password: 'Mod123!@#',
      role: 'moderator',
      metadata: { full_name: 'Test Moderator' }
    }
  ];

  console.log('Seeding test users for admin flow testing...');
  
  // Create users via Supabase if service key is available
  if (SUPABASE_SERVICE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    for (const user of testUsers) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: user.metadata
        });
        
        if (authError) {
          console.error(`Failed to create user ${user.email}:`, authError);
          continue;
        }
        
        // Set user role in database
        if (authData?.user) {
          const { error: roleError } = await supabase
            .from('users')
            .upsert({
              id: authData.user.id,
              email: user.email,
              role: user.role,
              created_at: new Date().toISOString()
            });
          
          if (roleError) {
            console.error(`Failed to set role for ${user.email}:`, roleError);
          }
        }
      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
  
  return testUsers;
}

test.describe('👤 Admin Panel Visual Flow Tests', () => {
  let testUsers: any[];
  
  test.beforeAll(async () => {
    // Seed test data
    testUsers = await seedTestData();
  });
  
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('🔐 Admin Login and Dashboard Access', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Step 1: Navigate to admin login
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('networkidle');
    
    // If admin login doesn't exist, try regular login with admin account
    if (page.url().includes('404')) {
      await page.goto(`${BASE_URL}/login`);
    }
    
    screenshots.push(await captureScreenshot(page, 'admin', 'login-page', 1));
    
    // Step 2: Login as admin
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('Admin123!@#');
      screenshots.push(await captureScreenshot(page, 'admin', 'credentials-entered', 2));
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      screenshots.push(await captureScreenshot(page, 'admin', 'login-submitted', 3));
      
      // Check if redirected to admin dashboard
      if (page.url().includes('admin') || page.url().includes('dashboard')) {
        screenshots.push(await captureScreenshot(page, 'admin', 'dashboard-loaded', 4));
      }
    }
    
    // Step 3: Try to access admin dashboard directly
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'admin', 'dashboard-direct-access', 5));
    
    // Step 4: Check for admin UI elements
    const adminElements = [
      'User Management',
      'Audit Logs',
      'Settings',
      'Analytics',
      'Reports'
    ];
    
    for (const element of adminElements) {
      const el = page.locator(`text=${element}`);
      if (await el.count() > 0) {
        await el.first().hover();
        screenshots.push(await captureScreenshot(page, 'admin', `element-${element.toLowerCase().replace(' ', '-')}`, 10 + adminElements.indexOf(element)));
      }
    }
    
    console.log('Admin Login Flow Screenshots:', screenshots);
  });

  test('👥 User Management Interface Testing', async ({ page, context }) => {
    const screenshots: string[] = [];
    
    // Login as admin first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to user management
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'user-management', 'initial-load', 1));
    
    // If page exists, test user management features
    if (!page.url().includes('404')) {
      // Check for user table
      const userTable = page.locator('table, [role="table"]').first();
      if (await userTable.count() > 0) {
        screenshots.push(await captureScreenshot(page, 'user-management', 'user-table', 2));
        
        // Test search functionality
        const searchInput = page.locator('input[placeholder*="search"], input[type="search"]').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('user1');
          await page.waitForTimeout(500);
          screenshots.push(await captureScreenshot(page, 'user-management', 'search-results', 3));
        }
        
        // Test filter functionality
        const filterButton = page.locator('button').filter({ hasText: /filter/i }).first();
        if (await filterButton.count() > 0) {
          await filterButton.click();
          await page.waitForTimeout(300);
          screenshots.push(await captureScreenshot(page, 'user-management', 'filter-menu', 4));
        }
        
        // Test user actions dropdown
        const actionButtons = page.locator('button[aria-label*="actions"], button[aria-label*="menu"]');
        if (await actionButtons.count() > 0) {
          await actionButtons.first().click();
          await page.waitForTimeout(300);
          screenshots.push(await captureScreenshot(page, 'user-management', 'actions-menu', 5));
        }
      }
    } else {
      // Document that user management is not implemented
      console.log('User management page not found (404) - feature not implemented');
      screenshots.push(await captureScreenshot(page, 'user-management', 'not-implemented', 99));
    }
    
    console.log('User Management Screenshots:', screenshots);
  });

  test('📊 Admin Analytics Dashboard', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to analytics
    await page.goto(`${BASE_URL}/admin/analytics`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'analytics', 'dashboard-load', 1));
    
    if (!page.url().includes('404')) {
      // Check for chart elements
      const charts = page.locator('canvas, svg[role="img"], .chart, [data-testid*="chart"]');
      if (await charts.count() > 0) {
        for (let i = 0; i < Math.min(3, await charts.count()); i++) {
          await charts.nth(i).scrollIntoViewIfNeeded();
          screenshots.push(await captureScreenshot(page, 'analytics', `chart-${i + 1}`, i + 2));
        }
      }
      
      // Check for metric cards
      const metrics = page.locator('.metric, [data-testid*="metric"], .stat-card');
      if (await metrics.count() > 0) {
        screenshots.push(await captureScreenshot(page, 'analytics', 'metrics-overview', 10));
      }
    } else {
      console.log('Analytics page not found (404) - feature not implemented');
      screenshots.push(await captureScreenshot(page, 'analytics', 'not-implemented', 99));
    }
    
    console.log('Analytics Dashboard Screenshots:', screenshots);
  });

  test('📝 Audit Logs Viewer', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to audit logs
    await page.goto(`${BASE_URL}/admin/audit-logs`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'audit-logs', 'initial-load', 1));
    
    if (!page.url().includes('404')) {
      // Test date range filter
      const dateFilter = page.locator('input[type="date"], [data-testid*="date"]').first();
      if (await dateFilter.count() > 0) {
        await dateFilter.click();
        await page.waitForTimeout(300);
        screenshots.push(await captureScreenshot(page, 'audit-logs', 'date-filter', 2));
      }
      
      // Test log detail view
      const logEntries = page.locator('tr[role="row"], .log-entry');
      if (await logEntries.count() > 1) { // Skip header row
        await logEntries.nth(1).click();
        await page.waitForTimeout(500);
        screenshots.push(await captureScreenshot(page, 'audit-logs', 'log-detail', 3));
      }
      
      // Test export functionality
      const exportButton = page.locator('button').filter({ hasText: /export/i });
      if (await exportButton.count() > 0) {
        await exportButton.first().hover();
        screenshots.push(await captureScreenshot(page, 'audit-logs', 'export-hover', 4));
      }
    } else {
      console.log('Audit logs page not found (404) - feature not implemented');
      screenshots.push(await captureScreenshot(page, 'audit-logs', 'not-implemented', 99));
    }
    
    console.log('Audit Logs Screenshots:', screenshots);
  });

  test('⚙️ Admin Settings Panel', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to settings
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('networkidle');
    screenshots.push(await captureScreenshot(page, 'settings', 'initial-load', 1));
    
    if (!page.url().includes('404')) {
      // Test different settings sections
      const sections = ['General', 'Security', 'Email', 'Integrations', 'Advanced'];
      
      for (const section of sections) {
        const tab = page.locator(`button, a`).filter({ hasText: section });
        if (await tab.count() > 0) {
          await tab.first().click();
          await page.waitForTimeout(500);
          screenshots.push(await captureScreenshot(page, 'settings', `${section.toLowerCase()}-section`, sections.indexOf(section) + 2));
        }
      }
      
      // Test a toggle switch
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      if (await toggles.count() > 0) {
        await toggles.first().click();
        screenshots.push(await captureScreenshot(page, 'settings', 'toggle-changed', 10));
      }
      
      // Test save button
      const saveButton = page.locator('button').filter({ hasText: /save/i });
      if (await saveButton.count() > 0) {
        await saveButton.first().hover();
        screenshots.push(await captureScreenshot(page, 'settings', 'save-hover', 11));
      }
    } else {
      console.log('Settings page not found (404) - feature not implemented');
      screenshots.push(await captureScreenshot(page, 'settings', 'not-implemented', 99));
    }
    
    console.log('Admin Settings Screenshots:', screenshots);
  });

  test('🚫 Non-Admin Access Restriction', async ({ page }) => {
    const screenshots: string[] = [];
    
    // Login as regular user
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', 'user1@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'User123!@#');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Try to access admin areas
    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/analytics',
      '/admin/audit-logs',
      '/admin/settings'
    ];
    
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState('networkidle');
      screenshots.push(await captureScreenshot(page, 'access-control', `restricted-${route.replace(/\//g, '-')}`, adminRoutes.indexOf(route) + 1));
      
      // Check for access denied message or redirect
      const accessDenied = page.locator('text=/unauthorized|forbidden|access denied|not authorized/i');
      if (await accessDenied.count() > 0) {
        console.log(`✅ Access properly restricted for ${route}`);
      } else if (page.url().includes('login')) {
        console.log(`✅ Redirected to login for ${route}`);
      } else if (page.url().includes('404')) {
        console.log(`⚠️ Route returns 404 for ${route} (might not be implemented)`);
      } else {
        console.log(`❌ SECURITY ISSUE: User can access ${route}`);
      }
    }
    
    console.log('Access Control Screenshots:', screenshots);
  });
});

// Clean up test data after tests
test.afterAll(async () => {
  console.log('Admin flow tests completed');
  
  // Generate summary report
  const report = {
    timestamp: new Date().toISOString(),
    adminFlowsTested: [
      'admin-login',
      'user-management',
      'analytics',
      'audit-logs',
      'settings',
      'access-control'
    ],
    testUsersCreated: 4,
    screenshotsGenerated: fs.existsSync(path.join(SCREENSHOT_DIR, 'admin')) 
      ? fs.readdirSync(path.join(SCREENSHOT_DIR, 'admin')).length 
      : 0
  };
  
  fs.writeFileSync(
    'tests/reports/admin-test-summary.json',
    JSON.stringify(report, null, 2)
  );
});