import { test, expect, Page } from '@playwright/test';
import { seedTestData, cleanDatabase } from '../../seed-data/seed-database';

// Helper functions for admin testing
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'Admin123!@#');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  
  // Verify admin is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

async function loginAsUser(page: Page, email: string = 'john.doe@test.com', password: string = 'User123!@#') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('5.1 Complete User Management Flow', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  test('admin should complete full user management workflow', async ({ page }) => {
    // Step 1: Login as admin
    await loginAsAdmin(page);
    
    // Step 2: Navigate to users page
    await page.click('[data-testid="nav-users"], text=Users');
    await expect(page).toHaveURL('/admin/users');
    
    // Verify admin can see user management interface
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-filter"]')).toBeVisible();
    
    // Step 3: Search for specific user
    await page.fill('[data-testid="user-search"]', 'john.doe@test.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Verify search results
    const userRows = page.locator('[data-testid="user-row"]');
    await expect(userRows).toHaveCount(1);
    await expect(userRows.first()).toContainText('john.doe@test.com');
    await expect(userRows.first()).toContainText('John Doe');
    
    // Step 4: View user details
    await page.click('[data-testid="view-user-btn"]');
    await expect(page.locator('[data-testid="user-details-modal"]')).toBeVisible();
    
    // Verify user details are displayed
    await expect(page.locator('[data-testid="user-email"]')).toContainText('john.doe@test.com');
    await expect(page.locator('[data-testid="user-role"]')).toContainText('user');
    await expect(page.locator('[data-testid="user-status"]')).toContainText('active');
    await expect(page.locator('[data-testid="user-created"]')).toBeVisible();
    
    // Close details modal
    await page.click('[data-testid="close-modal"]');
    
    // Step 5: Edit user role
    await page.click('[data-testid="edit-user-btn"]');
    await expect(page.locator('[data-testid="edit-user-modal"]')).toBeVisible();
    
    // Change role from user to moderator
    await page.selectOption('[data-testid="role-select"]', 'moderator');
    await page.fill('[data-testid="edit-reason"]', 'Promoting user to moderator for better support');
    await page.click('[data-testid="save-changes"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User role updated successfully');
    
    // Step 6: Verify role change is reflected
    await expect(page.locator('[data-testid="user-row"]')).toContainText('moderator');
    
    // Step 7: Filter by role
    await page.selectOption('[data-testid="role-filter"]', 'moderator');
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(2); // Original moderator + newly promoted
    
    // Step 8: Clear search and view all users
    await page.fill('[data-testid="user-search"]', '');
    await page.selectOption('[data-testid="role-filter"]', 'all');
    
    // Verify all users are displayed
    const allUserRows = page.locator('[data-testid="user-row"]');
    await expect(allUserRows).toHaveCount.toBeGreaterThan(3);
    
    // Step 9: Test pagination (if more than 20 users)
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    if (await paginationInfo.isVisible()) {
      await page.click('[data-testid="next-page"]');
      await expect(page).toHaveURL(/page=2/);
      await page.click('[data-testid="prev-page"]');
      await expect(page).toHaveURL(/page=1/);
    }
    
    // Step 10: Sort by registration date
    await page.click('[data-testid="sort-created"]');
    
    // Verify sort order (newest first)
    const firstUserDate = await page.locator('[data-testid="user-row"]:first-child [data-testid="user-created"]').textContent();
    const secondUserDate = await page.locator('[data-testid="user-row"]:nth-child(2) [data-testid="user-created"]').textContent();
    
    // Dates should be in descending order
    expect(new Date(firstUserDate!).getTime()).toBeGreaterThanOrEqual(new Date(secondUserDate!).getTime());
  });

  test('admin should see audit trail after user management actions', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Perform user management action
    await page.goto('/admin/users');
    await page.fill('[data-testid="user-search"]', 'john.doe@test.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Edit user
    await page.click('[data-testid="edit-user-btn"]');
    await page.selectOption('[data-testid="role-select"]', 'moderator');
    await page.click('[data-testid="save-changes"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Navigate to audit logs
    await page.click('[data-testid="nav-audit"], text=Audit Logs');
    await expect(page).toHaveURL('/admin/audit');
    
    // Verify audit log entries exist
    await expect(page.locator('[data-testid="audit-entry"]').first()).toBeVisible();
    
    // Verify the edit action is logged
    const editEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'edit_user_role' });
    await expect(editEntry).toBeVisible();
    await expect(editEntry).toContainText('admin@test.com');
    await expect(editEntry).toContainText('john.doe@test.com');
  });
});

test.describe('5.2 User Deletion with Confirmation', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  test('admin should require confirmation before deleting user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Find user to delete
    await page.fill('[data-testid="user-search"]', 'user2@test.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Click delete button
    await page.click('[data-testid="delete-user-btn"]');
    
    // Verify confirmation dialog appears
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
    await expect(page.locator('[data-testid="user-email-confirm"]')).toContainText('user2@test.com');
    
    // Test cancel functionality
    await page.click('[data-testid="cancel-delete"]');
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).not.toBeVisible();
    
    // User should still be in the list
    await expect(page.locator('[data-testid="user-row"]')).toContainText('user2@test.com');
    
    // Try delete again and confirm
    await page.click('[data-testid="delete-user-btn"]');
    await expect(page.locator('[data-testid="delete-confirm-dialog"]')).toBeVisible();
    
    // Type confirmation and confirm deletion
    await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User deleted successfully');
    
    // Verify user is removed from list
    await expect(page.locator('[data-testid="user-row"]').filter({ hasText: 'user2@test.com' })).not.toBeVisible();
  });

  test('admin should not be able to delete own account', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Search for admin account
    await page.fill('[data-testid="user-search"]', 'admin@test.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Delete button should be disabled for own account
    const deleteBtn = page.locator('[data-testid="delete-user-btn"]');
    await expect(deleteBtn).toBeDisabled();
    
    // Verify tooltip or warning message
    await deleteBtn.hover();
    await expect(page.locator('[data-testid="tooltip"]')).toContainText('Cannot delete your own account');
  });

  test('admin should not be able to delete other admin accounts', async ({ page }) => {
    // First create another admin
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    await page.fill('[data-testid="user-search"]', 'john.doe@test.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Promote to admin first
    await page.click('[data-testid="edit-user-btn"]');
    await page.selectOption('[data-testid="role-select"]', 'admin');
    await page.click('[data-testid="save-changes"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Now try to delete the new admin
    const deleteBtn = page.locator('[data-testid="delete-user-btn"]');
    await expect(deleteBtn).toBeDisabled();
    
    // Verify tooltip
    await deleteBtn.hover();
    await expect(page.locator('[data-testid="tooltip"]')).toContainText('Cannot delete admin accounts');
  });
});

test.describe('5.3 Pagination and Sorting', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
    // Create 25 test users for pagination testing
    const users = [];
    for (let i = 1; i <= 25; i++) {
      users.push({
        email: `testuser${i}@example.com`,
        password: 'Test123!@#',
        role: i % 3 === 0 ? 'moderator' : 'user',
        metadata: {
          full_name: `Test User ${i}`,
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }
    await seedTestData(users);
  });

  test('admin should handle pagination and sorting correctly', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Verify pagination (20 per page default)
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(20);
    await expect(page.locator('[data-testid="pagination-info"]')).toContainText('1 of 2');
    
    // Navigate to page 2
    await page.click('[data-testid="next-page"]');
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount.toBeLessThanOrEqual(20);
    
    // Navigate back to page 1
    await page.click('[data-testid="prev-page"]');
    await expect(page).toHaveURL(/page=1/);
    
    // Test direct page navigation
    await page.click('[data-testid="page-2"]');
    await expect(page).toHaveURL(/page=2/);
    
    // Return to page 1 for sorting tests
    await page.click('[data-testid="page-1"]');
    
    // Test sorting by registration date (descending)
    await page.click('[data-testid="sort-created-desc"]');
    
    // Verify sort order - get first few users' dates
    const userDates = await page.locator('[data-testid="user-created"]').allTextContents();
    
    for (let i = 0; i < userDates.length - 1; i++) {
      const date1 = new Date(userDates[i]).getTime();
      const date2 = new Date(userDates[i + 1]).getTime();
      expect(date1).toBeGreaterThanOrEqual(date2);
    }
    
    // Test sorting by name (ascending)
    await page.click('[data-testid="sort-name-asc"]');
    
    const userNames = await page.locator('[data-testid="user-name"]').allTextContents();
    
    for (let i = 0; i < userNames.length - 1; i++) {
      expect(userNames[i].localeCompare(userNames[i + 1])).toBeLessThanOrEqual(0);
    }
    
    // Test sorting by email (ascending)
    await page.click('[data-testid="sort-email-asc"]');
    
    const userEmails = await page.locator('[data-testid="user-email"]').allTextContents();
    
    for (let i = 0; i < userEmails.length - 1; i++) {
      expect(userEmails[i].localeCompare(userEmails[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  test('pagination should persist with filters applied', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Apply role filter
    await page.selectOption('[data-testid="role-filter"]', 'moderator');
    
    // Check how many moderators we have
    const moderatorRows = page.locator('[data-testid="user-row"]');
    const count = await moderatorRows.count();
    
    if (count > 20) {
      // Should show pagination for moderators
      await expect(page.locator('[data-testid="next-page"]')).toBeVisible();
      
      // Navigate to page 2 with filter
      await page.click('[data-testid="next-page"]');
      await expect(page).toHaveURL(/page=2.*role=moderator/);
      
      // All users on page 2 should still be moderators
      const page2Rows = page.locator('[data-testid="user-row"]');
      for (let i = 0; i < await page2Rows.count(); i++) {
        await expect(page2Rows.nth(i)).toContainText('moderator');
      }
    }
  });
});