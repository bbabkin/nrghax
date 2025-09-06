# Task List: Admin Users View Feature

## Overview
Build a read-only admin interface that allows the first registered user (designated as admin) to view all registered users in the system. This feature integrates into the existing UI and establishes the foundation for future admin capabilities.

## Implementation Approach
- **Testing Strategy**: Mixed - Test-after for UI components, TDD for authorization logic
- **Priority Order**: Database schema first, then authorization, then UI
- **Key Dependencies**: Supabase (existing), no new packages required

## User Stories
1. **As an admin**, I want to view a list of all registered users so that I can understand who is using the platform
   - Acceptance: Can see users table with email, name, registration date
   - Acceptance: Page only accessible when logged in as admin

2. **As an admin**, I want to access admin features through the same interface as regular features
   - Acceptance: "Users" link appears in main navigation when admin
   - Acceptance: Consistent UI with rest of application

3. **As a regular user**, I should not see or have access to admin functionality
   - Acceptance: No "Users" link in navigation for non-admins
   - Acceptance: Direct URL access returns 403 or redirects

## Relevant Files
### Implementation Files
- `supabase/migrations/[timestamp]_add_admin_flag.sql` - Database migration for admin flag
- `src/lib/supabase/admin.ts` - Admin authorization utilities
- `src/app/admin/users/page.tsx` - Users list page
- `src/components/admin/users-table.tsx` - Users table component
- `src/components/navbar.tsx` - Update to show admin navigation
- `src/middleware.ts` - Update to protect admin routes

### Test Files
- `tests/e2e/admin-users.spec.ts` - End-to-end tests for admin access
- `src/lib/supabase/admin.test.ts` - Unit tests for admin utilities

### Configuration Files
- No new environment variables needed
- No new configuration files required

## Tasks

### Phase 1: Database Setup
- [ ] 1.1 Create database migration to add `is_admin` column to profiles table
  - [ ] 1.1.1 Add `is_admin` boolean column with default false
  - [ ] 1.1.2 Create SQL function to mark first user as admin
  - [ ] 1.1.3 Add trigger to set is_admin=true for first user registration
- [ ] 1.2 Update RLS policies for profiles table
  - [ ] 1.2.1 Create policy allowing admins to select all profiles
  - [ ] 1.2.2 Ensure regular users can only see their own profile
- [ ] 1.3 Test migration locally with `supabase db reset`

### Phase 2: Authorization Logic
- [ ] 2.1 Create admin utility functions in `src/lib/supabase/admin.ts`
  - [ ] 2.1.1 Implement `isUserAdmin()` function to check admin status
  - [ ] 2.1.2 Implement `getAllUsers()` function for admin use
  - [ ] 2.1.3 Add proper TypeScript types for admin operations
- [ ] 2.2 Update middleware for admin route protection
  - [ ] 2.2.1 Add `/admin/*` route check in middleware
  - [ ] 2.2.2 Implement redirect to home for non-admin users
  - [ ] 2.2.3 Test middleware with both admin and regular users

### Phase 3: UI Implementation
- [ ] 3.1 Create admin users page at `/admin/users`
  - [ ] 3.1.1 Create `src/app/admin/users/page.tsx`
  - [ ] 3.1.2 Implement server component to fetch users
  - [ ] 3.1.3 Handle loading and error states
- [ ] 3.2 Build users table component
  - [ ] 3.2.1 Create `src/components/admin/users-table.tsx`
  - [ ] 3.2.2 Display columns: email, display name, created at, last login
  - [ ] 3.2.3 Implement responsive design for mobile
  - [ ] 3.2.4 Add empty state for no users
- [ ] 3.3 Update navigation to show admin links
  - [ ] 3.3.1 Modify navbar to check if current user is admin
  - [ ] 3.3.2 Conditionally render "Users" link for admins only
  - [ ] 3.3.3 Style admin links consistently with existing nav

### Phase 4: Testing & Validation
- [ ] 4.1 Write e2e tests for admin functionality
  - [ ] 4.1.1 Test admin can access users page
  - [ ] 4.1.2 Test non-admin cannot see users link
  - [ ] 4.1.3 Test non-admin redirect when accessing /admin/users directly
- [ ] 4.2 Manual testing checklist
  - [ ] 4.2.1 Register first user and verify admin status
  - [ ] 4.2.2 Register second user and verify no admin access
  - [ ] 4.2.3 Test users table displays all registered users
  - [ ] 4.2.4 Verify responsive design on mobile
- [ ] 4.3 Performance testing
  - [ ] 4.3.1 Seed database with 100+ users
  - [ ] 4.3.2 Verify page load time under 2 seconds

### Phase 5: Polish & Edge Cases
- [ ] 5.1 Handle edge cases
  - [ ] 5.1.1 Add handling for empty users list
  - [ ] 5.1.2 Add error boundary for unexpected errors
  - [ ] 5.1.3 Implement graceful degradation if database is unavailable
- [ ] 5.2 UI refinements
  - [ ] 5.2.1 Add loading skeleton while fetching users
  - [ ] 5.2.2 Format dates consistently
  - [ ] 5.2.3 Add hover states and focus indicators
- [ ] 5.3 Code cleanup
  - [ ] 5.3.1 Remove console.logs and debug code
  - [ ] 5.3.2 Add JSDoc comments to utility functions
  - [ ] 5.3.3 Run linter and fix any issues

## Testing Notes

### When to Use TDD
- Admin authorization logic (critical security feature)
- Database query functions
- Middleware route protection

### When Testing After is Fine
- UI components (users table)
- Navigation updates
- Date formatting utilities

## Success Criteria
- ✅ First registered user automatically becomes admin
- ✅ Admin can log in and see "Users" in navigation
- ✅ Admin can view complete list of all users
- ✅ Non-admin users cannot see or access admin pages
- ✅ Page loads within 2 seconds for 1000 users
- ✅ No existing functionality is broken
- ✅ Mobile responsive design works correctly