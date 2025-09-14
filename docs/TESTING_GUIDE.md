# Comprehensive Testing Guide for Supabase + Next.js Application

## Overview

This guide documents the complete testing strategy for our application, incorporating best practices from Supabase's official documentation and community resources. We use a multi-layered testing approach covering database, integration, and end-to-end testing.

## Testing Stack

### Core Tools
- **Database Testing**: pgTAP (PostgreSQL Test Anything Protocol)
- **Integration Testing**: Vitest with real Supabase calls
- **E2E Testing**: Playwright + Supawright
- **Coverage**: Vitest Coverage with v8

### Key Principles
1. **No Mocking for Integration Tests**: Use real database calls for realistic testing
2. **Sequential Execution**: Run database tests with `--runInBand` to avoid conflicts
3. **Unique Identifiers**: Each test uses unique IDs to ensure independence
4. **Automatic Cleanup**: Supawright handles cleanup; pgTAP uses transactions

## 1. Database Testing with pgTAP

### Setup
Database tests are located in `supabase/tests/database/` and use pgTAP for testing schemas, RLS policies, and functions.

### Test Structure
```sql
begin;
select plan(N); -- Number of tests

-- Your tests here
SELECT has_table('public', 'hacks', 'hacks table should exist');
SELECT policies_are('public', 'hacks', ARRAY[...], 'RLS policies exist');

select * from finish();
rollback; -- Automatic cleanup
```

### Running Database Tests
```bash
# Run all database tests
npx supabase test db

# Run with debug output
npx supabase test db --debug
```

### Test Files
- `01_schema.test.sql` - Table and column existence
- `02_rls_policies.test.sql` - Row Level Security policies
- `03_functions.test.sql` - Database functions and triggers

### Helper Functions
We've created test helper functions in the `tests` schema:
- `tests.create_supabase_user(username)` - Create test user
- `tests.get_supabase_uid(username)` - Get user ID
- `tests.authenticate_as(username)` - Set authentication context
- `tests.clear_authentication()` - Clear authentication

## 2. Integration Testing

### Configuration
Integration tests use real Supabase connections without mocks.

```typescript
// tests/integration/auth.test.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const client = createClient(supabaseUrl, supabaseAnonKey)
```

### Best Practices
1. **Use Unique Identifiers**:
```typescript
const testRunId = uuidv4()
const email = `test-${testRunId}-user@example.com`
```

2. **Clean Up After Tests**:
```typescript
afterAll(async () => {
  for (const user of testUsers) {
    await serviceClient.auth.admin.deleteUser(user.id)
  }
})
```

3. **Test Real Flows**:
```typescript
// Actually create user, login, and verify session
const { data } = await client.auth.signUp({ email, password })
const { data: session } = await client.auth.getSession()
expect(session).toBeDefined()
```

### Running Integration Tests
```bash
# Run integration tests sequentially
npm test -- --runInBand

# Run specific test file
npm test tests/integration/auth.test.ts
```

## 3. E2E Testing with Supawright

### What is Supawright?
Supawright is a specialized E2E testing tool for Supabase that provides:
- Automatic cleanup of test data
- Foreign key constraint handling
- Recursive record deletion
- Direct database access in tests

### Setup
```typescript
import { withSupawright } from 'supawright'
import type { Database } from '@/lib/database.types'

const test = withSupawright<Database, 'public'>(['public'])
```

### Example Test
```typescript
test('complete user flow', async ({ page, supawright }) => {
  // Create test data
  const user = await supawright.create('auth.users', {
    email: 'test@example.com',
    encrypted_password: 'password'
  })
  
  const hack = await supawright.create('public.hacks', {
    name: 'Test Hack',
    description: 'Test'
  })
  
  // Test UI interactions
  await page.goto('/hacks')
  await expect(page.getByText('Test Hack')).toBeVisible()
  
  // Automatic cleanup when test ends
})
```

### Benefits
- No manual cleanup needed
- Handles complex relationships
- Direct database verification
- Parallel test execution

## 4. Testing RLS Policies

### Database Level (pgTAP)
```sql
-- Test anonymous access
SELECT tests.clear_authentication();
SELECT throws_ok(
  $$ INSERT INTO hacks (...) VALUES (...) $$,
  '42501',
  'new row violates row-level security policy',
  'Anonymous cannot create hacks'
);

-- Test authenticated access
SELECT tests.authenticate_as('admin_user');
SELECT lives_ok(
  $$ INSERT INTO hacks (...) VALUES (...) $$,
  'Admin can create hacks'
);
```

### Integration Level
```typescript
// Test with different user roles
const { error: anonError } = await anonClient
  .from('hacks')
  .insert({ ... })
  
expect(anonError).toBeDefined()

const { error: adminError } = await adminClient
  .from('hacks')
  .insert({ ... })
  
expect(adminError).toBeNull()
```

## 5. Testing Authentication Flows

### Key Patterns
1. **Test Real Authentication**:
```typescript
const { data, error } = await client.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
})
expect(data.session).toBeDefined()
```

2. **Mock Authentication for UI Tests**:
```typescript
// Use MSW to intercept auth endpoints
rest.get('/auth/v1/user', (req, res, ctx) => {
  return res(ctx.json({ user: mockUser }))
})
```

3. **Test Session Persistence**:
```typescript
// Login
await client.auth.signInWithPassword({ email, password })

// Verify session exists
const { data: { session } } = await client.auth.getSession()
expect(session).toBeDefined()

// Logout and verify
await client.auth.signOut()
const { data: { session: newSession } } = await client.auth.getSession()
expect(newSession).toBeNull()
```

## 6. Environment Setup

### Required Environment Variables
```bash
# .env.test.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Jest Configuration for Environment
```javascript
// jest.setup.js
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '.env.test.local') 
});
```

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Run database tests sequentially
    sequence: {
      hooks: 'list'
    }
  }
})
```

## 7. CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      
      - name: Start Supabase
        run: supabase start
        
      - name: Run Database Tests
        run: supabase test db
        
      - name: Run Integration Tests
        run: npm test -- --runInBand
        
      - name: Run E2E Tests
        run: npx playwright test
```

## 8. Common Issues and Solutions

### Issue: Tests fail due to parallel execution
**Solution**: Use `--runInBand` flag or configure sequential execution

### Issue: RLS policies block test operations
**Solution**: Use service role client for setup/teardown

### Issue: Test data conflicts
**Solution**: Use unique identifiers (UUIDs) for each test run

### Issue: Slow test execution
**Solution**: Use Supawright for automatic cleanup instead of manual deletion

### Issue: Environment variables not loading
**Solution**: Create custom setup file to load `.env.test.local`

## 9. Test Commands Reference

```bash
# Database tests
npx supabase test db                    # Run all database tests
npx supabase test db --debug            # With debug output

# Integration tests
npm test                                # Run all tests
npm test -- --runInBand                 # Sequential execution
npm test -- --coverage                  # With coverage report

# E2E tests
npx playwright test                      # Run all E2E tests
npx playwright test --ui                # With UI mode
npx playwright test --debug             # Debug mode
npx playwright test --headed            # Show browser

# Specific test suites
npm run test:unit                       # Unit tests only
npm run test:integration                # Integration tests only
npm run test:e2e                        # E2E tests only
npm run test:all                        # All test suites
```

## 10. Coverage Requirements

Target coverage thresholds (configured in `vitest.config.ts`):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Generate coverage report:
```bash
npm run test:coverage
```

## Best Practices Summary

1. **Database Tests**: Use pgTAP with transactions for automatic rollback
2. **Integration Tests**: Real database calls with unique identifiers
3. **E2E Tests**: Supawright for automatic cleanup and relationship handling
4. **Authentication**: Test real flows, avoid mocking in integration tests
5. **RLS Policies**: Test at database level with pgTAP and application level
6. **Sequential Execution**: Use for database operations to avoid conflicts
7. **Cleanup Strategy**: Automatic with Supawright, manual tracking for integration tests
8. **Environment Isolation**: Separate test database or schemas when possible

## Resources

- [Supabase Database Testing Guide](https://supabase.com/docs/guides/database/testing)
- [pgTAP Documentation](https://pgtap.org/)
- [Supawright GitHub](https://github.com/supawright/supawright)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

This testing strategy ensures comprehensive coverage while maintaining fast, reliable, and maintainable tests across all layers of the application.