# Task List: Admin User Management

## Test-Driven Development (TDD) Approach

### Why TDD for This Feature
TDD is highly recommended for the Admin User Management feature because:
1. **Security Critical**: Admin functions require rigorous testing to prevent unauthorized access
2. **Complex Business Logic**: Role verification, permission checks, and audit logging have intricate rules
3. **High Impact**: Errors in admin functions can compromise the entire system
4. **Clear Acceptance Criteria**: The PRD provides specific requirements that translate well to tests
5. **Data Integrity**: Delete operations and cascading effects need thorough testing

### TDD Workflow
1. **Red Phase**: Write failing tests for each user story and security requirement
2. **Green Phase**: Implement minimal code to make tests pass
3. **Refactor Phase**: Improve code quality, optimize queries, enhance security

## User Stories & Test Scenarios

### User Story 1: View User List
**As an admin**, I want to view a list of all users in the system so that I can monitor user activity and account status

#### Acceptance Criteria:
- Display users in a table with ID, name, email, role, status, registration date, last login
- Show maximum 20 users per page
- Only accessible to authenticated admins

#### Test Scenarios:
- **Happy Path**: Admin views user list
  - Given: Admin is authenticated and on dashboard
  - When: Admin clicks "Users" in navbar
  - Then: User management page displays with user table
  
- **Edge Case**: Empty user list
  - Given: No users exist in system (except admin)
  - When: Admin accesses users page
  - Then: Empty state message is shown
  
- **Error Case**: Non-admin access attempt
  - Given: Regular user is authenticated
  - When: User tries to access /admin/users
  - Then: Access denied error and redirect to dashboard

### User Story 2: Search and Filter Users
**As an admin**, I want to search and filter users by various criteria so that I can quickly find specific users

#### Acceptance Criteria:
- Search by name or email
- Filter by role (Admin/User)
- Filter by status (Active/Deactivated)
- Filters work in combination

#### Test Scenarios:
- **Happy Path**: Search by email
  - Given: Multiple users exist in system
  - When: Admin types email in search box
  - Then: Only matching users are displayed
  
- **Edge Case**: No search results
  - Given: Users exist in system
  - When: Admin searches for non-existent user
  - Then: "No users found" message appears
  
- **Error Case**: Invalid search input
  - Given: Admin is on users page
  - When: Admin enters SQL injection attempt
  - Then: Input is sanitized and safe search performed

### User Story 3: Edit User Role and Status
**As an admin**, I want to edit user roles and account status so that I can grant permissions and manage account access

#### Acceptance Criteria:
- Can change user role between admin and user
- Can activate/deactivate accounts
- Cannot edit other admin accounts
- Changes are logged in audit trail

#### Test Scenarios:
- **Happy Path**: Change user to admin
  - Given: Regular user exists
  - When: Admin changes role to admin
  - Then: User role updated and audit log created
  
- **Edge Case**: Edit own account
  - Given: Admin is viewing own profile
  - When: Admin tries to edit own role
  - Then: Edit buttons are disabled
  
- **Error Case**: Edit another admin
  - Given: Multiple admins exist
  - When: Admin tries to edit another admin
  - Then: Error message "Cannot modify other admin accounts"

### User Story 4: Deactivate User Account
**As an admin**, I want to deactivate user accounts so that I can temporarily suspend access without losing user data

#### Acceptance Criteria:
- Soft delete marks account as inactive
- User data is preserved
- Action is logged
- Deactivated users cannot login

#### Test Scenarios:
- **Happy Path**: Deactivate active user
  - Given: Active user exists
  - When: Admin clicks deactivate
  - Then: User status changes to deactivated
  
- **Edge Case**: Deactivate already inactive user
  - Given: User is already deactivated
  - When: Admin views user
  - Then: Deactivate button is disabled
  
- **Error Case**: Deactivate self
  - Given: Admin viewing own profile
  - When: Admin tries to deactivate self
  - Then: Error "Cannot deactivate your own account"

### User Story 5: Permanently Delete User
**As an admin**, I want to permanently delete user accounts so that I can comply with data removal requests

#### Acceptance Criteria:
- Hard delete removes user and all associated data
- Confirmation dialog required
- Cannot delete own account
- Cascade deletes all related data

#### Test Scenarios:
- **Happy Path**: Delete user with confirmation
  - Given: User selected for deletion
  - When: Admin confirms deletion
  - Then: User and all data removed from database
  
- **Edge Case**: Cancel deletion
  - Given: Delete dialog shown
  - When: Admin clicks cancel
  - Then: No changes made, user remains
  
- **Error Case**: Delete self attempt
  - Given: Admin on own profile
  - When: Admin clicks delete
  - Then: Error "Cannot delete your own account"

### User Story 6: View User Details
**As an admin**, I want to view detailed user information so that I can provide better support

#### Acceptance Criteria:
- Show full profile, creation date, last login, auth method
- Display login count and activity history
- Include email verification status

#### Test Scenarios:
- **Happy Path**: View user details
  - Given: User exists in system
  - When: Admin clicks "View" button
  - Then: Detailed user modal/page appears
  
- **Edge Case**: User with minimal data
  - Given: User registered but never logged in
  - When: Admin views details
  - Then: Shows "Never logged in" for last login

### User Story 7: Audit Trail Logging
**As an admin**, I want all my actions to be logged so that there's accountability in the system

#### Acceptance Criteria:
- Log all view/edit/delete actions
- Include timestamp, admin ID, target user, changes
- Logs are immutable
- Store in dedicated audit_logs table

#### Test Scenarios:
- **Happy Path**: Action logged correctly
  - Given: Admin performs any action
  - When: Action completes
  - Then: Audit log entry created with all details
  
- **Edge Case**: Failed action logging
  - Given: Database constraint prevents action
  - When: Admin action fails
  - Then: Failed attempt is still logged

### User Story 8: Regular User Access Control
**As a regular user**, I should not see or access admin features so that system security is maintained

#### Acceptance Criteria:
- No "Users" link in navbar for regular users
- /admin/* routes are protected
- API endpoints reject non-admin requests

#### Test Scenarios:
- **Happy Path**: Regular user navigation
  - Given: Regular user logged in
  - When: User views navbar
  - Then: No admin links visible
  
- **Error Case**: Direct URL access attempt
  - Given: Regular user authenticated
  - When: User navigates to /admin/users directly
  - Then: Access denied and redirected

### User Story 9: Assign Admin Role
**As the first admin**, I want to assign admin roles to other users so that I can delegate administrative tasks

#### Acceptance Criteria:
- First admin set via Supabase console
- Can promote users to admin role
- Changes take effect immediately
- Action is logged

#### Test Scenarios:
- **Happy Path**: Promote user to admin
  - Given: Regular user exists
  - When: Admin changes role to admin
  - Then: User gains admin privileges immediately
  
- **Edge Case**: Demote admin to user
  - Given: Multiple admins exist
  - When: Admin changes another admin to user role
  - Then: Error "Cannot modify other admin accounts"

## E2E Test Flows

### Critical User Journey 1: Complete User Management Flow
**Path**: Login → Navigate to Users → Search User → Edit Role → View Audit Log
**Test File**: `tests/e2e/admin/user-management-flow.spec.ts`
```typescript
test.describe('Admin User Management Flow', () => {
  test('should allow admin to manage users', async ({ page }) => {
    // Setup: Login as admin
    await loginAsAdmin(page);
    
    // Navigate to users page
    await page.click('text=Users');
    await expect(page).toHaveURL('/admin/users');
    
    // Search for specific user
    await page.fill('[data-testid="user-search"]', 'test@example.com');
    await page.waitForSelector('[data-testid="user-row"]');
    
    // Edit user role
    await page.click('[data-testid="edit-user-btn"]');
    await page.selectOption('[data-testid="role-select"]', 'admin');
    await page.click('[data-testid="save-changes"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Verify audit log entry created
    const auditLog = await getLatestAuditLog();
    expect(auditLog.action).toBe('edit');
    expect(auditLog.changes).toContain('role');
  });
});
```

### Critical User Journey 2: User Deletion with Confirmation
**Path**: Users Page → Select User → Delete → Confirm → Verify Removal
**Test File**: `tests/e2e/admin/user-deletion-flow.spec.ts`
```typescript
test.describe('User Deletion Flow', () => {
  test('should require confirmation before deleting user', async ({ page }) => {
    // Setup: Navigate to users page as admin
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Select user for deletion
    await page.click('[data-testid="user-row-1"] [data-testid="delete-btn"]');
    
    // Verify confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await expect(page.locator('text=This action cannot be undone')).toBeVisible();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify user removed from list
    await expect(page.locator('[data-testid="user-row-1"]')).not.toBeVisible();
    
    // Verify audit log
    const auditLog = await getLatestAuditLog();
    expect(auditLog.action).toBe('hard_delete');
  });
});
```

### Critical User Journey 3: Pagination and Sorting
**Path**: Users Page → Navigate Pages → Sort by Date → Filter by Role
**Test File**: `tests/e2e/admin/user-list-navigation.spec.ts`
```typescript
test.describe('User List Navigation', () => {
  test('should handle pagination and sorting', async ({ page }) => {
    // Setup: Create 25 test users
    await createTestUsers(25);
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    
    // Verify pagination (20 per page)
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(20);
    await expect(page.locator('[data-testid="page-info"]')).toContainText('1 of 2');
    
    // Navigate to page 2
    await page.click('[data-testid="next-page"]');
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(5);
    
    // Sort by registration date
    await page.click('[data-testid="sort-registration"]');
    await verifyUserOrder('desc');
    
    // Filter by admin role
    await page.selectOption('[data-testid="role-filter"]', 'admin');
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(2);
  });
});
```

## Relevant Files

### Test Files (Write First - TDD!)
- `src/components/admin/UserTable.test.tsx` - User table component tests (WRITE FIRST)
- `src/components/admin/UserFilters.test.tsx` - Search and filter component tests (WRITE FIRST)
- `src/components/admin/UserEditModal.test.tsx` - Edit modal tests (WRITE FIRST)
- `src/components/admin/UserDetailsModal.test.tsx` - Details view tests (WRITE FIRST)
- `src/app/api/admin/users/route.test.ts` - Users list API tests (WRITE FIRST)
- `src/app/api/admin/users/[id]/route.test.ts` - User operations API tests (WRITE FIRST)
- `src/app/api/admin/audit/route.test.ts` - Audit logging API tests (WRITE FIRST)
- `src/middleware/admin.test.ts` - Admin middleware tests (WRITE FIRST)
- `tests/e2e/admin/user-management-flow.spec.ts` - Complete flow E2E tests (WRITE FIRST)
- `tests/e2e/admin/user-deletion-flow.spec.ts` - Deletion flow E2E tests (WRITE FIRST)
- `tests/e2e/admin/user-list-navigation.spec.ts` - Navigation E2E tests (WRITE FIRST)
- `tests/integration/admin-auth.test.ts` - Admin authentication integration tests (WRITE FIRST)
- `tests/integration/audit-trail.test.ts` - Audit logging integration tests (WRITE FIRST)

### Implementation Files (Write After Tests)
- `src/components/admin/UserTable.tsx` - Main user table component
- `src/components/admin/UserFilters.tsx` - Search and filter controls
- `src/components/admin/UserEditModal.tsx` - Edit user modal
- `src/components/admin/UserDetailsModal.tsx` - User details view
- `src/components/admin/DeleteConfirmDialog.tsx` - Deletion confirmation
- `src/app/admin/users/page.tsx` - Admin users page
- `src/app/api/admin/users/route.ts` - Users list and search API
- `src/app/api/admin/users/[id]/route.ts` - Individual user operations
- `src/app/api/admin/audit/route.ts` - Audit log creation
- `src/middleware/admin.ts` - Admin route protection middleware
- `src/lib/admin/permissions.ts` - Permission checking utilities
- `src/lib/admin/audit.ts` - Audit logging utilities
- `src/types/admin.ts` - TypeScript types for admin features

### Test Support Files
- `tests/fixtures/admin-users-data.ts` - Mock user data for testing
- `tests/fixtures/admin-audit-data.ts` - Mock audit log data
- `tests/utils/admin-test-helpers.ts` - Admin testing utilities
- `tests/utils/auth-helpers.ts` - Authentication test helpers
- `tests/mocks/supabase-admin.ts` - Supabase admin mocks

### Database Files
- `supabase/migrations/xxx_add_role_to_users.sql` - Add role column migration
- `supabase/migrations/xxx_create_audit_logs.sql` - Create audit_logs table
- `supabase/migrations/xxx_add_admin_indexes.sql` - Performance indexes

## Testing Requirements

### Coverage Targets
- Minimum 80% code coverage overall
- 100% coverage for permission checks and authentication
- 100% coverage for audit logging functions
- All user stories must have corresponding tests
- All API endpoints must have integration tests
- Critical paths must have E2E tests

### Test Commands
```bash
# TDD Development (watch mode for active development)
npm test -- --watch

# Run all tests
npm test

# Run specific test file
npm test -- src/components/admin/UserTable.test.tsx

# Run with coverage report
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (for debugging)
npm run test:e2e -- --ui

# Run only admin tests
npm test -- --testPathPattern=admin
```

## Tasks

### Phase 0: Test Foundation & Database Setup
- [ ] 0.1 Create database migration for role column in users table
- [ ] 0.2 Create database migration for audit_logs table with indexes
- [ ] 0.3 Set up test fixtures for admin users and regular users
- [ ] 0.4 Create mock data generators for testing (users, audit logs)
- [ ] 0.5 Set up authentication test helpers (loginAsAdmin, loginAsUser)
- [ ] 0.6 Configure test environment variables for admin features
- [ ] 0.7 Create Supabase client mocks for admin operations
- [ ] 0.8 Update TypeScript types to include role in User type

### Phase 1: Red - Write Failing Tests

#### 1.0 Write Security & Authorization Tests
- [ ] 1.1 Write middleware tests for admin route protection
- [ ] 1.2 Write tests for permission checking utilities
- [ ] 1.3 Write tests for role verification on API endpoints
- [ ] 1.4 Write tests for unauthorized access attempts
- [ ] 1.5 Write tests for session validation with admin role

#### 2.0 Write User Management UI Component Tests
- [ ] 2.1 Write UserTable component tests (render, pagination, sorting)
- [ ] 2.2 Write UserFilters component tests (search, filter by role/status)
- [ ] 2.3 Write UserEditModal tests (role change, status change, validation)
- [ ] 2.4 Write UserDetailsModal tests (display all user info)
- [ ] 2.5 Write DeleteConfirmDialog tests (confirmation flow)
- [ ] 2.6 Write admin navigation tests (Users link visibility)

#### 3.0 Write API Endpoint Tests
- [ ] 3.1 Write GET /api/admin/users tests (list, pagination, search)
- [ ] 3.2 Write GET /api/admin/users/[id] tests (individual user fetch)
- [ ] 3.3 Write PUT /api/admin/users/[id] tests (edit role, status)
- [ ] 3.4 Write DELETE /api/admin/users/[id] tests (soft and hard delete)
- [ ] 3.5 Write POST /api/admin/audit tests (audit log creation)
- [ ] 3.6 Write API error handling tests (validation, auth failures)

#### 4.0 Write Audit Trail Tests
- [ ] 4.1 Write tests for audit log creation on view actions
- [ ] 4.2 Write tests for audit log creation on edit actions
- [ ] 4.3 Write tests for audit log creation on delete actions
- [ ] 4.4 Write tests for audit log data structure and immutability
- [ ] 4.5 Write tests for failed action logging

#### 5.0 Write E2E Tests for Complete Workflows
- [ ] 5.1 Write complete user management flow test
- [ ] 5.2 Write user deletion with confirmation test
- [ ] 5.3 Write pagination and sorting test
- [ ] 5.4 Write search and filter combination test
- [ ] 5.5 Write admin self-modification prevention test
- [ ] 5.6 Write non-admin access denial test

### Phase 2: Green - Implementation

#### 6.0 Implement Database Schema & Migrations
- [ ] 6.1 Run migration to add role column to users table
- [ ] 6.2 Run migration to create audit_logs table
- [ ] 6.3 Add database indexes for performance
- [ ] 6.4 Update Supabase RLS policies for admin access
- [ ] 6.5 Seed first admin user in database (manual via console)

#### 7.0 Implement Authentication & Authorization
- [ ] 7.1 Extend NextAuth session to include user role
- [ ] 7.2 Create admin middleware for route protection
- [ ] 7.3 Implement permission checking utilities
- [ ] 7.4 Add role verification to API routes
- [ ] 7.5 Update navigation to conditionally show admin links

#### 8.0 Build User Management UI Components
- [ ] 8.1 Create UserTable component with sorting
- [ ] 8.2 Implement pagination controls
- [ ] 8.3 Create UserFilters component (search, role, status)
- [ ] 8.4 Build UserEditModal with form validation
- [ ] 8.5 Create UserDetailsModal with all user info
- [ ] 8.6 Build DeleteConfirmDialog with warnings
- [ ] 8.7 Create admin users page layout
- [ ] 8.8 Add loading and error states

#### 9.0 Create API Endpoints for Admin Operations
- [ ] 9.1 Implement GET /api/admin/users (with pagination/search)
- [ ] 9.2 Implement GET /api/admin/users/[id]
- [ ] 9.3 Implement PUT /api/admin/users/[id] (edit operations)
- [ ] 9.4 Implement DELETE /api/admin/users/[id] (soft/hard delete)
- [ ] 9.5 Add input validation and sanitization
- [ ] 9.6 Implement rate limiting for admin endpoints

#### 10.0 Implement Audit Logging System
- [ ] 10.1 Create audit logging utility functions
- [ ] 10.2 Integrate audit logging into all admin operations
- [ ] 10.3 Implement audit log data structure
- [ ] 10.4 Add IP address capture (optional)
- [ ] 10.5 Ensure audit log immutability

### Phase 3: Refactor & Optimize

#### 11.0 Optimize Performance & Security
- [ ] 11.1 Optimize database queries with proper indexing
- [ ] 11.2 Implement query result caching where appropriate
- [ ] 11.3 Add request debouncing for search input
- [ ] 11.4 Enhance input sanitization against XSS/SQL injection
- [ ] 11.5 Review and strengthen authorization checks
- [ ] 11.6 Add rate limiting to prevent abuse
- [ ] 11.7 Optimize bundle size for admin components

#### 12.0 Finalize UI/UX & Accessibility
- [ ] 12.1 Ensure responsive design for mobile devices
- [ ] 12.2 Add proper ARIA labels and roles
- [ ] 12.3 Implement keyboard navigation support
- [ ] 12.4 Add loading skeletons for better UX
- [ ] 12.5 Create empty states with helpful messages
- [ ] 12.6 Add success/error toast notifications
- [ ] 12.7 Ensure consistent styling with existing dashboard
- [ ] 12.8 Test with screen readers for accessibility

### Phase 4: Documentation & Deployment
- [ ] 13.1 Update README with admin setup instructions
- [ ] 13.2 Document admin API endpoints
- [ ] 13.3 Create admin user guide
- [ ] 13.4 Update changelog with new features
- [ ] 13.5 Run final test suite with coverage report
- [ ] 13.6 Deploy to staging environment
- [ ] 13.7 Perform security audit
- [ ] 13.8 Deploy to production

## Notes

### Security Considerations
- Always verify admin role on both frontend and backend
- Never trust client-side role checks alone
- Sanitize all inputs to prevent injection attacks
- Log all admin actions for accountability
- Implement rate limiting to prevent abuse
- Use parameterized queries for database operations

### Performance Considerations
- Implement pagination server-side to handle large user bases
- Add database indexes on frequently queried fields
- Use debouncing on search input (300ms recommended)
- Cache user count for pagination
- Lazy load user details modal content

### Testing Tips
- Use `beforeEach` to set up clean test state
- Mock Supabase client for unit tests
- Use real database for integration tests (test database)
- Always clean up test data after each test
- Test both success and failure paths
- Verify audit logs are created correctly

### Common Pitfalls to Avoid
- Don't allow admins to modify their own role
- Don't allow admins to delete themselves
- Don't allow modification of other admin accounts
- Don't forget to cascade delete related data
- Don't expose sensitive user data in API responses
- Don't forget to validate all input data

---

*Generated from: prd-admin-user-management.md*
*TDD Approach: Write tests first, implement second, refactor third*
*Coverage Target: 80% minimum, 100% for security functions*