# Task List: Migrate to Supabase Auth

## Test-Driven Development (TDD) Approach

### Why TDD for This Feature
This authentication migration is critical to the application's security and user experience. TDD is essential here because:
- Authentication is security-critical and must work correctly
- We're replacing a complex system that had persistent issues
- Clear test coverage will prevent regression of authentication bugs
- Tests will validate that all NextAuth functionality is properly replaced
- Admin access issues must be definitively resolved

### TDD Workflow
1. **Red Phase**: Write failing tests for each authentication scenario
2. **Green Phase**: Implement Supabase Auth to make tests pass
3. **Refactor Phase**: Clean up code and remove all NextAuth remnants

## User Stories & Test Scenarios

### User Story 1: Regular User Authentication
**As a** regular user, **I want to** sign up and log in using email/password or OAuth providers, **so that** I can access my account reliably

#### Acceptance Criteria:
- User can register with email and password
- User can login with valid credentials
- User can login with Google OAuth
- User can login with Discord OAuth
- Invalid credentials show error messages

#### Test Scenarios:
- **Happy Path - Email Registration**: 
  - Given: User is on registration page
  - When: User enters valid email and password
  - Then: User account is created and redirected to dashboard

- **Happy Path - Email Login**:
  - Given: User has existing account
  - When: User enters correct credentials
  - Then: User is logged in and redirected to dashboard

- **Happy Path - Google OAuth**:
  - Given: User is on login page
  - When: User clicks "Sign in with Google" and authorizes
  - Then: User is logged in and profile is created/updated

- **Edge Case - Duplicate Email**:
  - Given: Email already exists in system
  - When: User tries to register with same email
  - Then: Error message "Email already registered" is shown

- **Error Case - Invalid Credentials**:
  - Given: User is on login page
  - When: User enters wrong password
  - Then: Error message "Invalid email or password" is shown

### User Story 2: Session Persistence
**As a** regular user, **I want** my session to persist for a month, **so that** I don't have to log in frequently

#### Acceptance Criteria:
- Session persists for 30 days
- Session works across browser tabs
- Session survives page refresh
- Logout clears session completely

#### Test Scenarios:
- **Happy Path - Session Persistence**:
  - Given: User is logged in
  - When: User refreshes the page
  - Then: User remains logged in with same session

- **Happy Path - Multi-tab Session**:
  - Given: User is logged in in one tab
  - When: User opens app in new tab
  - Then: User is logged in automatically in new tab

- **Edge Case - Session Expiry**:
  - Given: User session is 30 days old
  - When: User tries to access protected route
  - Then: User is redirected to login page

- **Happy Path - Logout**:
  - Given: User is logged in
  - When: User clicks logout
  - Then: Session is cleared and user is redirected to home

### User Story 3: Admin Panel Access
**As an** admin user, **I want to** access the admin panel without redirect loops, **so that** I can manage the application

#### Acceptance Criteria:
- Admin users can access /admin routes
- No redirect loops occur
- Non-admin users are blocked
- Super_admin can access all admin features

#### Test Scenarios:
- **Happy Path - Admin Access**:
  - Given: User has admin role
  - When: User navigates to /admin
  - Then: Admin dashboard is displayed without redirects

- **Happy Path - Super Admin Access**:
  - Given: User has super_admin role
  - When: User navigates to /admin/users
  - Then: User management page is displayed

- **Error Case - Regular User Blocked**:
  - Given: User has regular user role
  - When: User tries to access /admin
  - Then: User is redirected to access-denied page

- **Edge Case - Direct URL Access**:
  - Given: Admin user is logged in
  - When: User directly enters /admin/users URL
  - Then: Page loads without redirect loop

### User Story 4: User Management Access
**As a** super_admin, **I want to** access all admin features including user management, **so that** I can perform administrative tasks

#### Acceptance Criteria:
- Super_admin can view all users
- Super_admin can edit user roles
- Super_admin can delete users
- Admin users cannot access user management

#### Test Scenarios:
- **Happy Path - View Users**:
  - Given: Super_admin is logged in
  - When: Navigates to /admin/users
  - Then: List of all users is displayed

- **Error Case - Admin Blocked from Users**:
  - Given: Regular admin is logged in
  - When: Tries to access /admin/users
  - Then: Access denied message is shown

### User Story 5: Developer Experience
**As a** developer, **I want** a simple authentication system, **so that** I can easily maintain and extend it

#### Acceptance Criteria:
- All NextAuth code is removed
- Supabase Auth hooks are easy to use
- Error messages are clear
- Auth state is easily accessible

#### Test Scenarios:
- **Happy Path - Get Current User**:
  - Given: Developer uses useUser() hook
  - When: User is logged in
  - Then: User object with role is returned

- **Happy Path - Protected API Route**:
  - Given: API route requires authentication
  - When: Authenticated request is made
  - Then: Request succeeds with user context

## E2E Test Flows

### Critical User Journey 1: Complete Registration Flow
**Path**: Home → Register → Email Verification → Dashboard
**Test File**: `tests/e2e/auth/registration-flow.spec.ts`
```typescript
test.describe('User Registration Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    
    // Click sign up
    await page.click('text=Sign up');
    
    // Fill registration form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123456!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user is logged in
    const userName = await page.textContent('[data-testid="user-name"]');
    expect(userName).toContain('test@example.com');
  });
});
```

### Critical User Journey 2: Admin Access Flow
**Path**: Login → Admin Dashboard → User Management
**Test File**: `tests/e2e/auth/admin-access-flow.spec.ts`
```typescript
test.describe('Admin Access Flow', () => {
  test('should allow admin to access admin panel without redirects', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    
    // Navigate to admin
    await page.click('text=Admin');
    
    // Verify no redirect loop
    await expect(page).toHaveURL('/admin');
    
    // Verify admin content loads
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Navigate to users (super_admin only)
    await page.click('text=User Management');
    await expect(page).toHaveURL('/admin/users');
  });
});
```

### Critical User Journey 3: OAuth Login Flow
**Path**: Home → Login → Google OAuth → Dashboard
**Test File**: `tests/e2e/auth/oauth-flow.spec.ts`
```typescript
test.describe('OAuth Login Flow', () => {
  test('should login with Google OAuth', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Click Google sign in
    await page.click('text=Sign in with Google');
    
    // Mock OAuth callback
    await page.waitForURL(/.*callback.*/);
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Verify session persists
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Relevant Files

### Test Files (Write First - TDD!)
- `src/lib/supabase/__tests__/auth.test.ts` - Auth utility tests (WRITE FIRST)
- `src/components/auth/__tests__/AuthForm.test.tsx` - Auth form component tests (WRITE FIRST)
- `src/middleware/__tests__/auth.test.ts` - Middleware tests (WRITE FIRST)
- `src/app/api/auth/__tests__/route.test.ts` - API route tests (WRITE FIRST)
- `tests/e2e/auth/registration-flow.spec.ts` - Registration E2E tests (WRITE FIRST)
- `tests/e2e/auth/login-flow.spec.ts` - Login E2E tests (WRITE FIRST)
- `tests/e2e/auth/admin-access-flow.spec.ts` - Admin access E2E tests (WRITE FIRST)
- `tests/e2e/auth/oauth-flow.spec.ts` - OAuth E2E tests (WRITE FIRST)
- `tests/integration/supabase-auth.test.ts` - Supabase integration tests (WRITE FIRST)

### Implementation Files (Write After Tests)
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/lib/supabase/server.ts` - Supabase server client
- `src/lib/supabase/auth.ts` - Auth utility functions
- `src/components/auth/AuthForm.tsx` - Supabase Auth UI component
- `src/components/auth/AuthProvider.tsx` - Auth context provider
- `src/middleware.ts` - Protected route middleware
- `src/app/login/page.tsx` - Login page with Supabase UI
- `src/app/register/page.tsx` - Registration page
- `src/app/api/auth/callback/route.ts` - OAuth callback handler

### Test Support Files
- `tests/fixtures/auth-users.ts` - Test user data with roles
- `tests/fixtures/supabase-mock.ts` - Supabase client mocks
- `tests/utils/auth-helpers.ts` - Auth testing utilities
- `tests/utils/db-seed.ts` - Database seeding for tests

### Files to Remove (During Refactor Phase)
- `src/lib/auth.ts` - NextAuth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/types/next-auth.d.ts` - NextAuth type definitions
- All NextAuth imports and usages

## Testing Requirements

### Coverage Targets
- Minimum 80% code coverage overall
- 100% coverage for authentication functions
- 100% coverage for protected route middleware
- All user stories must have passing tests

### Test Commands
```bash
# TDD Development (watch mode)
npm test -- --watch

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e

# Run specific test file in watch mode
npm test src/lib/supabase/__tests__/auth.test.ts -- --watch
```

## Tasks

### Phase 0: Test Foundation (Setup)
- [ ] 0.1 Create test user fixtures with different roles (user, admin, super_admin)
- [ ] 0.2 Set up Supabase test client mocks
- [ ] 0.3 Create auth testing utilities
- [ ] 0.4 Configure test environment variables
- [ ] 0.5 Set up database seeding for E2E tests

### Phase 1: Red (Write Failing Tests)

#### 1.0 Write Unit Tests
- [ ] 1.1 Write tests for Supabase client initialization
- [ ] 1.2 Write tests for auth utility functions (login, signup, logout)
- [ ] 1.3 Write tests for session management functions
- [ ] 1.4 Write tests for role verification functions
- [ ] 1.5 Write tests for auth form validation
- [ ] 1.6 Write tests for auth error handling

#### 2.0 Write Integration Tests
- [ ] 2.1 Write tests for protected route middleware
- [ ] 2.2 Write tests for OAuth callback handling
- [ ] 2.3 Write tests for session persistence
- [ ] 2.4 Write tests for role-based access control
- [ ] 2.5 Write tests for auth state synchronization

#### 3.0 Write E2E Tests
- [ ] 3.1 Write complete registration flow test
- [ ] 3.2 Write email/password login flow test
- [ ] 3.3 Write Google OAuth flow test
- [ ] 3.4 Write Discord OAuth flow test
- [ ] 3.5 Write admin access flow test (no redirects!)
- [ ] 3.6 Write super_admin user management test
- [ ] 3.7 Write logout flow test
- [ ] 3.8 Write session persistence test
- [ ] 3.9 Write password reset flow test

### Phase 2: Green (Implementation)

#### 4.0 Set Up Supabase Auth
- [ ] 4.1 Install Supabase Auth UI dependencies
- [ ] 4.2 Configure Supabase client for browser
- [ ] 4.3 Configure Supabase client for server
- [ ] 4.4 Set up auth utility functions
- [ ] 4.5 Configure 30-day session duration in Supabase

#### 5.0 Implement Authentication UI
- [ ] 5.1 Create AuthForm component with Supabase UI
- [ ] 5.2 Implement login page with pre-built UI
- [ ] 5.3 Implement registration page
- [ ] 5.4 Add password reset functionality
- [ ] 5.5 Implement auth error display
- [ ] 5.6 Add loading states

#### 6.0 Implement OAuth Providers
- [ ] 6.1 Configure Google OAuth in Supabase dashboard
- [ ] 6.2 Configure Discord OAuth in Supabase dashboard
- [ ] 6.3 Implement OAuth callback handler
- [ ] 6.4 Update redirect URLs for HTTP/HTTPS
- [ ] 6.5 Test OAuth flows end-to-end

#### 7.0 Implement Protected Routes
- [ ] 7.1 Create auth middleware for route protection
- [ ] 7.2 Protect /admin routes for admin/super_admin only
- [ ] 7.3 Protect /dashboard for authenticated users
- [ ] 7.4 Implement role checking in middleware
- [ ] 7.5 Add access-denied page
- [ ] 7.6 Ensure home page remains public

#### 8.0 Implement Session Management
- [ ] 8.1 Create AuthProvider context
- [ ] 8.2 Implement useUser hook
- [ ] 8.3 Add session refresh logic
- [ ] 8.4 Implement cross-tab session sync
- [ ] 8.5 Add logout functionality

#### 9.0 Fix Admin Panel Access
- [ ] 9.1 Update admin page authentication check
- [ ] 9.2 Verify role from Supabase profiles table
- [ ] 9.3 Remove redirect loops in admin routes
- [ ] 9.4 Test admin access thoroughly
- [ ] 9.5 Verify super_admin can access user management

#### 10.0 Database Setup
- [ ] 10.1 Create profiles table with role field
- [ ] 10.2 Set up database triggers for new users
- [ ] 10.3 Create migration to add roles
- [ ] 10.4 Seed test users with different roles
- [ ] 10.5 Clear existing user data

### Phase 3: Refactor (Cleanup & Optimization)

#### 11.0 Remove NextAuth
- [ ] 11.1 Remove next-auth from package.json
- [ ] 11.2 Remove @auth/supabase-adapter
- [ ] 11.3 Delete src/lib/auth.ts
- [ ] 11.4 Delete API route /api/auth/[...nextauth]
- [ ] 11.5 Remove NextAuth type definitions
- [ ] 11.6 Remove NEXTAUTH_URL and NEXTAUTH_SECRET from .env
- [ ] 11.7 Update all imports from NextAuth to Supabase

#### 12.0 Code Quality
- [ ] 12.1 Refactor auth utilities for clarity
- [ ] 12.2 Optimize auth state updates
- [ ] 12.3 Improve error messages
- [ ] 12.4 Add proper TypeScript types
- [ ] 12.5 Remove console.logs and debug code

#### 13.0 Performance Optimization
- [ ] 13.1 Optimize navbar auth state loading
- [ ] 13.2 Implement auth state caching
- [ ] 13.3 Reduce unnecessary auth checks
- [ ] 13.4 Add loading skeletons
- [ ] 13.5 Implement rate limiting for auth attempts

#### 14.0 Final Validation
- [ ] 14.1 Run all tests and ensure 80%+ coverage
- [ ] 14.2 Verify admin access works without redirects
- [ ] 14.3 Test OAuth on both HTTP and HTTPS
- [ ] 14.4 Verify session persists for 30 days
- [ ] 14.5 Confirm all NextAuth code is removed
- [ ] 14.6 Document auth usage for team

## Implementation Notes

### Critical Success Factors
1. **Admin access MUST work** - No redirect loops, proper role checking
2. **Sessions MUST persist** - 30-day duration, cross-tab sync
3. **OAuth MUST function** - Google and Discord on HTTP/HTTPS
4. **NextAuth MUST be removed** - Zero traces in codebase
5. **Tests MUST pass** - 80%+ coverage, all E2E flows work

### Common Pitfalls to Avoid
- Don't forget to configure OAuth redirect URLs in Supabase dashboard
- Ensure middleware runs on correct paths only
- Test admin access thoroughly before marking complete
- Verify session cookies are set correctly
- Check auth state updates in navbar immediately

### Development Order
1. Start with test setup and fixtures
2. Write all tests first (they should fail)
3. Implement Supabase Auth basics
4. Get simple login working
5. Add OAuth providers
6. Implement protected routes
7. Fix admin access completely
8. Clean up and remove NextAuth
9. Optimize performance
10. Run final validation