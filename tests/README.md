# Admin User Management Test Infrastructure

This directory contains comprehensive testing infrastructure for the Admin User Management feature, designed to support Test-Driven Development (TDD) and ensure robust, reliable testing across all layers.

## Directory Structure

```
tests/
├── fixtures/              # Test data fixtures
│   ├── admin-users-data.ts    # Mock user data for various scenarios
│   └── admin-audit-data.ts    # Mock audit log data
├── utils/                 # Test utilities and helpers
│   ├── admin-test-helpers.ts  # Data generators and utilities
│   └── auth-helpers.ts        # Authentication test helpers
├── mocks/                 # Mock implementations
│   └── supabase-admin.ts      # Supabase client mocks
├── setup/                 # Global test configuration
│   ├── globalSetup.js         # Jest global setup
│   └── globalTeardown.js      # Jest global teardown
└── README.md             # This documentation
```

## Test Data Fixtures

### Admin Users Data (`fixtures/admin-users-data.ts`)

Provides comprehensive mock user data including:
- Sample users with different roles (user, admin, super_admin)
- Users with various statuses (active, deactivated) 
- Different auth providers (email, google, credentials)
- Edge cases (no name, no image, never logged in, unverified email)
- Filtered collections by role, status, auth provider
- Pagination and search test data

**Usage Examples:**
```typescript
import { sampleAdminUsers, testUsers, usersByRole } from 'tests/fixtures/admin-users-data'

// Get all sample users
const allUsers = sampleAdminUsers

// Get specific test users
const superAdmin = testUsers.superAdmin
const regularUser = testUsers.regularUser

// Get users by role
const admins = usersByRole.admins
const users = usersByRole.regularUsers

// Edge case users
const usersWithoutNames = edgeCaseUsers.noName
```

### Audit Log Data (`fixtures/admin-audit-data.ts`)

Provides mock audit log entries covering:
- All audit actions (view, edit, create, soft_delete, hard_delete, role_change)
- Different admin and target users
- Complex change objects for various scenarios
- Date range filtering data
- Pagination test data

**Usage Examples:**
```typescript
import { sampleAuditLogs, auditLogsByAction, testAuditLogs } from 'tests/fixtures/admin-audit-data'

// Get all audit logs
const allLogs = sampleAuditLogs

// Get logs by action type
const editActions = auditLogsByAction.edit
const viewActions = auditLogsByAction.view

// Get specific test logs
const roleChangeLog = testAuditLogs.roleChangeAction
const deleteLog = testAuditLogs.softDeleteAction
```

## Test Utilities

### Admin Test Helpers (`utils/admin-test-helpers.ts`)

Provides data generation and utility functions:
- `generateMockUser(overrides?)` - Create random user data
- `generateMockAuditLog(overrides?)` - Create random audit log entries
- `generateUserList(count, filters?)` - Generate filtered user lists
- `createTestUsers(count)` - Helper for E2E tests
- `cleanupTestData()` - Clean up test data after tests
- `testDataScenarios` - Pre-configured realistic test scenarios
- `testUtils` - Validation and utility functions

**Usage Examples:**
```typescript
import { 
  generateMockUser, 
  generateUserList, 
  testDataScenarios,
  testUtils,
  TestDataManager 
} from 'tests/utils/admin-test-helpers'

// Generate single user
const user = generateMockUser({ role: 'admin' })

// Generate user list
const users = generateUserList(10, { role: 'user', status: 'active' })

// Use pre-configured scenarios
const balancedData = testDataScenarios.balanced(100)
const edgeCases = testDataScenarios.edgeCases()

// Validate data
const isValid = testUtils.isValidUser(user)

// Manage test data
const dataManager = new TestDataManager()
dataManager.trackUser(user.id)
await dataManager.cleanup()
```

### Authentication Helpers (`utils/auth-helpers.ts`)

Provides authentication utilities for different test types:
- Mock NextAuth sessions for all user roles
- Playwright E2E authentication helpers
- Access denial testing utilities
- Role-based UI assertion helpers

**Usage Examples:**

**Unit/Integration Tests:**
```typescript
import { mockSessions, mockAuthSession } from 'tests/utils/auth-helpers'

// Use pre-defined sessions
const adminSession = mockSessions.admin
const userSession = mockSessions.regularUser

// Create custom session
const customSession = mockAuthSession('super_admin', {
  user: { name: 'Custom Admin' }
})
```

**Playwright E2E Tests:**
```typescript
import { 
  loginAsAdmin, 
  loginAsUser, 
  expectAccessDenied,
  assertUserRole 
} from 'tests/utils/auth-helpers'

test('admin can access user management', async ({ page }) => {
  await loginAsAdmin(page)
  await assertUserRole(page, 'admin')
  await page.goto('/admin/users')
  // Test admin functionality
})

test('regular user cannot access admin area', async ({ page }) => {
  await loginAsUser(page)
  await page.goto('/admin/users')
  await expectAccessDenied(page)
})
```

## Mock Implementations

### Supabase Admin Mocks (`mocks/supabase-admin.ts`)

Comprehensive mock implementation of Supabase client for admin operations:
- Mock user CRUD operations with realistic responses
- Mock audit log insertion and querying
- Mock RLS policy responses
- Mock error conditions (connection errors, permission denied, etc.)
- Mock storage operations
- Test scenario helpers

**Usage Examples:**
```typescript
import mockSupabaseAdmin, { mockScenarios } from 'tests/mocks/supabase-admin'

// Use in tests - automatically mocked via Jest setup
describe('User Management', () => {
  beforeEach(() => {
    // Mock data is reset automatically before each test
  })

  test('should fetch users', async () => {
    const response = await mockSupabaseAdmin
      .from('users')
      .select()
      .order('createdAt', { ascending: false })

    expect(response.data).toHaveLength(12) // Sample users count
  })

  test('should handle connection error', async () => {
    mockScenarios.simulateConnectionError()
    
    const response = await mockSupabaseAdmin
      .from('users')
      .select()
      .single()

    expect(response.error).toBeTruthy()
    expect(response.error.code).toBe('PGRST001')
  })
})
```

## Configuration Files

### Environment Configuration (`.env.test`)

Test-specific environment variables:
- Separate test database configuration
- Mock service configurations
- Test user credentials
- Disabled external services (email, rate limiting)

### Jest Configuration Updates

Enhanced Jest configuration includes:
- Path mappings for test utilities
- Admin-specific test patterns
- Global setup/teardown
- Mock configuration
- Coverage settings for admin files

## Usage Patterns

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { testUsers } from 'tests/fixtures/admin-users-data'
import { mockSessions } from 'tests/utils/auth-helpers'
import UserCard from '@/components/admin/UserCard'

describe('UserCard Component', () => {
  test('displays user information correctly', () => {
    const user = testUsers.regularUser
    
    render(<UserCard user={user} currentUserSession={mockSessions.admin} />)
    
    expect(screen.getByText(user.email)).toBeInTheDocument()
    expect(screen.getByText(user.name)).toBeInTheDocument()
  })

  test('shows admin controls for admin users', () => {
    const user = testUsers.regularUser
    
    render(<UserCard user={user} currentUserSession={mockSessions.superAdmin} />)
    
    expect(screen.getByText('Edit User')).toBeInTheDocument()
    expect(screen.getByText('Delete User')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
import { generateUserList } from 'tests/utils/admin-test-helpers'
import mockSupabaseAdmin from 'tests/mocks/supabase-admin'
import { getUsersWithFilters } from '@/lib/admin/users'

describe('User Management API', () => {
  test('should filter users by role', async () => {
    const result = await getUsersWithFilters({
      role_filter: 'admin',
      page: 1,
      limit: 10
    })

    expect(result.success).toBe(true)
    expect(result.data.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'admin' })
      ])
    )
  })
})
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin, generateUserList } from '@/tests/utils'

test('admin can manage users', async ({ page }) => {
  await loginAsAdmin(page)
  
  // Navigate to user management
  await page.goto('/admin/users')
  
  // Verify user list loads
  await expect(page.locator('[data-testid="admin-users-table"]')).toBeVisible()
  
  // Test user search
  await page.fill('[data-testid="user-search"]', 'john')
  await expect(page.locator('text=john.doe@example.com')).toBeVisible()
  
  // Test user editing
  await page.click('[data-testid="edit-user-button"]')
  await page.selectOption('[data-testid="user-role-select"]', 'admin')
  await page.click('[data-testid="save-changes-button"]')
  
  // Verify success message
  await expect(page.locator('text=User updated successfully')).toBeVisible()
})
```

## Best Practices

### 1. Test Data Management
- Use fixtures for consistent test data
- Generate random data for stress testing
- Clean up test data between tests
- Use realistic data that mirrors production

### 2. Mock Strategy
- Mock external dependencies (Supabase, NextAuth)
- Simulate error conditions
- Test edge cases and boundary conditions
- Keep mocks simple and focused

### 3. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Test both happy path and error scenarios
- Include accessibility testing

### 4. Authentication Testing
- Test all user roles and permissions
- Verify access control at UI and API levels
- Test session management
- Include OAuth flow testing

### 5. Performance Testing
- Test with large datasets
- Verify pagination and filtering performance
- Test database query optimization
- Include loading state testing

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- admin-users.test.ts
```

### Integration Tests
```bash
# Run integration tests only
npm test -- --testPathPattern=integration

# Run with verbose output
npm test -- --verbose
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test admin-user-management.spec.ts

# Run with UI mode
npx playwright test --ui
```

### Visual Testing
```bash
# Run visual verification tests
npx playwright test visual-verification.spec.ts

# Generate new screenshots
npx playwright test --update-snapshots
```

## Troubleshooting

### Common Issues

1. **Mock not working**: Ensure `MOCK_SUPABASE=true` in test environment
2. **Test data conflicts**: Verify test isolation and cleanup
3. **Authentication issues**: Check mock session configuration
4. **Path resolution errors**: Verify Jest module mapping configuration

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm test
```

This will show:
- Mock setup and teardown
- Test data generation
- API call simulation
- Error details

### Test Data Inspection

Access mock data during tests:
```typescript
const mockData = mockSupabaseAdmin.__getMockData()
console.log('Current users:', mockData.users)
console.log('Current audit logs:', mockData.auditLogs)
```

## Contributing

When adding new admin features:

1. **Add test fixtures** for new data types
2. **Update mock implementations** for new API endpoints  
3. **Create test utilities** for common operations
4. **Add E2E tests** for new user flows
5. **Update this documentation** with new patterns

### Test Data Guidelines

- Use realistic data that reflects production usage
- Include edge cases and boundary conditions
- Provide both individual items and collections
- Add helper functions for common scenarios
- Document expected usage patterns

### Mock Implementation Guidelines

- Match real API signatures and responses
- Include realistic error conditions
- Support all query patterns used by the application
- Provide test scenario helpers
- Reset state cleanly between tests