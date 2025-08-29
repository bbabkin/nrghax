# Task List: Authentication System Fixes

## Test-Driven Development (TDD) Approach

### Why TDD for This Feature
Authentication is the most security-critical component of the application. TDD ensures we have comprehensive test coverage for all authentication flows, prevents regression bugs, and validates security requirements are met. Given the current broken state, TDD will help us systematically rebuild confidence in the authentication system.

### TDD Workflow
1. **Red Phase**: Write failing tests for each authentication scenario
2. **Green Phase**: Fix NextAuth configuration and implement minimal code to make tests pass  
3. **Refactor Phase**: Optimize authentication flow and improve error handling

## User Stories & Test Scenarios

### User Story 1: User Authentication with Email/Password
**As a** registered user, **I want to** log in with my email and password, **so that** I can access protected areas of the application

#### Acceptance Criteria:
- Login form submits via NextAuth signIn function, not GET request
- Valid credentials create a session
- Invalid credentials show error message
- Session persists across page refreshes
- Logout clears the session

#### Test Scenarios:
- **Happy Path**: Successful login with valid credentials
  - Given: User is on login page with valid account (admin@test.com)
  - When: User enters correct email and password and submits
  - Then: User is redirected to dashboard with active session
  
- **Edge Case**: Login with unverified email
  - Given: User account exists but email is not verified
  - When: User attempts to log in
  - Then: Error message indicates email verification required
  
- **Error Case**: Login with invalid credentials
  - Given: User is on login page
  - When: User enters incorrect password
  - Then: Error message "Invalid credentials" is displayed

### User Story 2: Admin Role-Based Access
**As an** admin user, **I want to** access admin-only pages, **so that** I can manage users and view audit logs

#### Acceptance Criteria:
- Admin users see admin navigation links
- Admin dashboard is accessible to admin/super_admin roles only
- Non-admin users are redirected to access-denied page
- Admin API endpoints return JSON data for admin users

#### Test Scenarios:
- **Happy Path**: Admin accesses user management
  - Given: Admin user is logged in (admin@test.com)
  - When: Admin navigates to /admin/users
  - Then: User list loads with search and filter functionality
  
- **Edge Case**: Regular user attempts admin access
  - Given: Regular user is logged in (user1@test.com)
  - When: User navigates to /admin
  - Then: User is redirected to /access-denied
  
- **Error Case**: Unauthenticated admin API access
  - Given: No active session
  - When: GET request to /api/admin/users
  - Then: 401 Unauthorized response

### User Story 3: Authenticated Route Protection
**As an** authenticated user, **I want to** be redirected from auth pages, **so that** I don't see unnecessary login/register forms

#### Acceptance Criteria:
- Logged-in users cannot access /login or /register
- Automatic redirect to dashboard for authenticated users
- Navigation shows appropriate links based on auth state

#### Test Scenarios:
- **Happy Path**: Authenticated user redirected from login
  - Given: User has active session
  - When: User navigates to /login
  - Then: User is redirected to /dashboard
  
- **Edge Case**: Session expiry during navigation
  - Given: User session is about to expire
  - When: User navigates to protected route
  - Then: User is redirected to login with return URL preserved

## E2E Test Flows

### Critical User Journey 1: Complete Authentication Flow
**Path**: Home → Login → Dashboard → Admin → Logout → Home
**Test File**: `tests/e2e/auth/complete-auth-flow.spec.ts`
```typescript
test.describe('Complete Authentication Flow', () => {
  test('should handle full auth lifecycle', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'Admin123!@#');
    await page.click('[data-testid="login-button"]');
    
    // Verify dashboard access
    await expect(page).toHaveURL('/dashboard');
    
    // Verify admin link visible
    await expect(page.locator('text=Admin')).toBeVisible();
    
    // Navigate to admin
    await page.click('text=Admin');
    await expect(page).toHaveURL('/admin');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Log out');
    await expect(page).toHaveURL('/');
  });
});
```

### Critical User Journey 2: Admin User Management
**Path**: Login → Admin → Users → Search → Filter → View User
**Test File**: `tests/e2e/admin/user-management-complete.spec.ts`

## Relevant Files

### Test Files (Write First - TDD!)
- `src/lib/__tests__/auth.test.ts` - NextAuth configuration tests (WRITE FIRST)
- `src/components/__tests__/LoginForm.test.tsx` - Login form unit tests (UPDATE FIRST)
- `src/middleware/__tests__/auth.test.ts` - Auth middleware tests (WRITE FIRST)
- `tests/e2e/auth/complete-auth-flow.spec.ts` - Full auth E2E tests (WRITE FIRST)
- `tests/integration/auth-api.test.ts` - Auth API integration tests (WRITE FIRST)

### Implementation Files (Fix After Tests)
- `src/lib/auth.ts` - NextAuth configuration (FIX VENDOR CHUNKS)
- `src/components/LoginForm.tsx` - Login form component (FIX SUBMISSION)
- `src/app/api/auth/[...nextauth]/route.ts` - Auth API route (FIX MODULE ERRORS)
- `next.config.js` - Next.js configuration (CHECK WEBPACK CONFIG)

### Database Files
- `supabase/migrations/20250830000001_fix_audit_logs_details.sql` - Add missing column

### Test Support Files
- `tests/fixtures/auth-test-data.ts` - Test user credentials
- `tests/utils/auth-helpers.ts` - Auth testing utilities

## Testing Requirements

### Coverage Targets
- 100% coverage for authentication functions (security-critical)
- 90% coverage for middleware functions
- 80% coverage overall
- All authentication flows must have E2E tests

### Test Commands
```bash
# TDD Development (watch mode)
npm test -- --watch src/lib/__tests__/auth.test.ts

# Run all auth tests
npm test -- auth

# Run with coverage
npm test -- --coverage

# Run E2E auth tests
npm run test:e2e -- auth

# ⚠️ CRITICAL: OAuth Testing Commands
# For Email/Password testing (HTTP)
npm run dev -- --port 3002

# For Google OAuth testing (HTTPS REQUIRED)
npm run dev:https -- --port 3002
```

### ⚠️ CRITICAL OAuth Testing Requirements

**Google OAuth Security Compliance:**
- ✅ **Development**: Requires HTTPS (https://localhost:3002)
- ✅ **Production**: Requires valid SSL certificate  
- ❌ **HTTP**: Google will reject OAuth on http:// for security

**Testing Protocol:**
1. **Email/Password Auth**: Test with HTTP server (`npm run dev`)
2. **Google OAuth**: Test with HTTPS server (`npm run dev:https`)
3. **Complete Integration**: Test both flows on HTTPS

**Environment Configuration:**
- Development HTTPS: Update `NEXTAUTH_URL=https://localhost:3002`
- Production HTTPS: Ensure SSL certificate is valid
- Google Console: Callback URLs must match server protocol

## Tasks

### Phase 0: Immediate Fixes (Critical) ✅ COMPLETED
- [x] 0.1 Fix NextAuth vendor chunks issue ✅
  - [x] 0.1.1 Clear .next directory and node_modules
  - [x] 0.1.2 Reinstall dependencies with npm ci
  - [x] 0.1.3 Rebuild application
- [x] 0.2 Fix database schema ✅
  - [x] 0.2.1 Create migration to add details column to audit_logs
  - [x] 0.2.2 Run migration on local Supabase
  - [x] 0.2.3 Verify schema updates
- [x] 0.3 Verify environment variables ✅
  - [x] 0.3.1 Check NEXTAUTH_SECRET is set
  - [x] 0.3.2 Verify NEXTAUTH_URL matches dev server
  - [x] 0.3.3 Confirm Supabase credentials

### Phase 1: Red (Write Failing Tests) ✅ COMPLETED
- [x] 1.0 Write Authentication Unit Tests ✅
  - [x] 1.1 NextAuth configuration tests (should fail initially)
  - [x] 1.2 Session management tests (should fail)
  - [x] 1.3 Login form submission tests (should fail)
- [x] 2.0 Write Integration Tests ✅
  - [x] 2.1 Auth API endpoint tests (should fail)
  - [x] 2.2 Middleware protection tests (should fail)
  - [x] 2.3 Database session tests (should fail)
- [x] 3.0 Write E2E Tests ✅
  - [x] 3.1 Complete login flow test (should fail)
  - [x] 3.2 Admin access test (should fail)
  - [x] 3.3 Route protection test (should fail)

### Phase 2: Green (Implementation) ✅ COMPLETED
- [x] 4.0 Fix NextAuth Configuration ✅
  - [x] 4.1 Update auth.ts to fix module imports
  - [x] 4.2 Configure proper session strategy
  - [x] 4.3 Fix callback URLs
  - [x] 4.4 Make auth configuration tests pass
- [x] 5.0 Fix Login Form ✅
  - [x] 5.1 Ensure form uses NextAuth signIn
  - [x] 5.2 Prevent default form submission
  - [x] 5.3 Add proper error handling
  - [x] 5.4 Make login form tests pass
- [ ] 6.0 Fix Auth API Routes
  - [ ] 6.1 Resolve vendor chunk dependencies
  - [ ] 6.2 Fix session endpoint
  - [ ] 6.3 Fix CSRF endpoint
  - [ ] 6.4 Make API tests pass
- [ ] 7.0 Fix Middleware
  - [ ] 7.1 Update auth middleware for proper redirects
  - [ ] 7.2 Fix admin middleware role checking
  - [ ] 7.3 Make middleware tests pass

### Phase 3: Refactor (Improve)
- [ ] 8.0 Optimize Authentication Flow
  - [ ] 8.1 Add loading states during auth
  - [ ] 8.2 Improve error messages
  - [ ] 8.3 Add retry logic for failed requests
  - [ ] 8.4 Ensure all tests still pass
- [ ] 9.0 Enhance Security
  - [ ] 9.1 Add rate limiting to login attempts
  - [ ] 9.2 Implement CSRF protection
  - [ ] 9.3 Add security headers
  - [ ] 9.4 Verify security tests pass
- [ ] 10.0 Performance Optimization
  - [ ] 10.1 Optimize session checks
  - [ ] 10.2 Cache user roles
  - [ ] 10.3 Minimize auth redirects
  - [ ] 10.4 Run performance tests

### Phase 4: Verification
- [ ] 11.0 Complete System Testing
  - [ ] 11.1 Run full test suite
  - [ ] 11.2 Verify 100% auth coverage
  - [ ] 11.3 Test with all user roles
  - [ ] 11.4 Visual regression testing
- [ ] 12.0 Admin Functionality Testing
  - [ ] 12.1 Test admin dashboard access
  - [ ] 12.2 Test user management CRUD
  - [ ] 12.3 Test audit logging
  - [ ] 12.4 Test pagination and filtering
- [ ] 13.0 Documentation
  - [ ] 13.1 Update TESTING_SUMMARY_REPORT.md
  - [ ] 13.2 Document auth configuration
  - [ ] 13.3 Create troubleshooting guide

## Success Criteria

The authentication system will be considered fixed when:
1. ✅ All users can successfully log in with correct credentials
2. ✅ Login form submits via NextAuth, not GET requests
3. ✅ Sessions persist across page refreshes
4. ✅ Admin users can access admin pages
5. ✅ Regular users are blocked from admin areas
6. ✅ Authenticated users are redirected from login/register pages
7. ✅ All auth API endpoints return proper responses
8. ✅ Audit logging works without errors
9. ✅ Navigation shows correct links based on user role
10. ✅ All tests pass with >90% coverage

## Notes for Developers

### Common Issues and Solutions
1. **Vendor chunk errors**: Clear .next and reinstall dependencies
2. **Session not persisting**: Check NEXTAUTH_SECRET environment variable
3. **Login form GET submission**: Ensure e.preventDefault() in form handler
4. **Database errors**: Run latest migrations with `npx supabase db reset`

### Testing Order
1. Start with Phase 0 (immediate fixes) to unblock development
2. Write tests before fixing each component (TDD)
3. Fix one test at a time, don't try to fix everything at once
4. Run tests continuously during development
5. Commit after each passing test

### Resources
- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)