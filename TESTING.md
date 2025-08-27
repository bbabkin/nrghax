# Testing Guide

This document provides comprehensive instructions for running, maintaining, and understanding the test suite for the Supabase Authentication Starter App.

## Overview

Our testing strategy follows the testing pyramid approach:
- **Unit Tests (70%)**: Test individual components and utilities in isolation
- **Integration Tests (20%)**: Test interactions between components and services
- **End-to-End Tests (10%)**: Test complete user workflows across the entire application

## Test Stack

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest with mocked APIs and services
- **E2E Tests**: Playwright for cross-browser testing
- **Coverage**: Jest coverage reports with 80% minimum threshold
- **Mocking**: Jest mocks + Mock Service Worker (MSW) for API mocking

## Quick Start

### Prerequisites

Ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Docker (for local Supabase)

### Running Tests

```bash
# Install dependencies
npm install

# Run all unit tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run comprehensive test analysis
node scripts/test-coverage.js
```

### Test Environment Setup

1. **Environment Variables**
   ```bash
   # Copy example environment file
   cp .env.example .env.local
   
   # Set test-specific environment variables
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=test-secret-key
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Local Supabase Setup**
   ```bash
   # Start local Supabase instance
   npx supabase start
   
   # Apply database migrations
   npx supabase db reset
   ```

3. **Development Server**
   ```bash
   # Start Next.js development server
   npm run dev
   ```

## Test Structure

### Unit Tests

Unit tests are located alongside their source files in `__tests__` directories:

```
src/
├── components/
│   ├── __tests__/
│   │   ├── LoginForm.test.tsx
│   │   ├── RegisterForm.test.tsx
│   │   ├── UserMenu.test.tsx
│   │   ├── Navbar.test.tsx
│   │   └── ProtectedRoute.test.tsx
│   └── ...
├── lib/
│   ├── __tests__/
│   │   ├── auth.test.ts
│   │   └── auth-utils.test.ts
│   └── ...
└── __tests__/
    └── integration/
        └── auth-flows.test.ts
```

### E2E Tests

E2E tests are in the `tests/` directory, organized by feature:

```
tests/
├── auth/
│   ├── registration.spec.ts
│   ├── login-logout.spec.ts
│   ├── oauth.spec.ts
│   └── password-reset.spec.ts
├── navigation.spec.ts
└── setup.spec.ts
```

### Test Configuration Files

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup and global mocks
- `playwright.config.ts` - Playwright E2E configuration

## Writing Tests

### Unit Test Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('next-auth/react')

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i)
    })
  })
})
```

### Integration Test Example

```typescript
describe('Authentication Flow Integration', () => {
  it('should handle complete registration process', async () => {
    // Mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, user: { id: '1', email: 'test@example.com' } })
    })

    // Test the integration
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    })

    expect(response.ok).toBe(true)
    const result = await response.json()
    expect(result.success).toBe(true)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Registration', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register')

    // Fill registration form
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Verify success
    await expect(page.locator('h1:has-text("Check your email")')).toBeVisible()
  })
})
```

## Testing Best Practices

### Unit Testing

1. **Test Structure**
   ```typescript
   describe('Component/Function Name', () => {
     describe('specific functionality', () => {
       it('should do something specific', () => {
         // Arrange
         // Act
         // Assert
       })
     })
   })
   ```

2. **Mock External Dependencies**
   ```typescript
   jest.mock('next/navigation')
   jest.mock('next-auth/react')
   jest.mock('../api/service')
   ```

3. **Test User Interactions**
   ```typescript
   const user = userEvent.setup()
   await user.click(button)
   await user.type(input, 'text')
   await user.keyboard('{Enter}')
   ```

4. **Test Accessibility**
   ```typescript
   expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
   expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'false')
   ```

### Integration Testing

1. **Mock API Calls**
   ```typescript
   global.fetch = jest.fn().mockResolvedValue({
     ok: true,
     json: async () => ({ success: true })
   })
   ```

2. **Test Error Scenarios**
   ```typescript
   global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
   ```

3. **Test State Management**
   ```typescript
   // Test how components interact with global state
   ```

### E2E Testing

1. **Page Object Model**
   ```typescript
   class LoginPage {
     constructor(private page: Page) {}
     
     async login(email: string, password: string) {
       await this.page.locator('input[name="email"]').fill(email)
       await this.page.locator('input[name="password"]').fill(password)
       await this.page.locator('button[type="submit"]').click()
     }
   }
   ```

2. **Mock External Services**
   ```typescript
   await page.route('/api/auth/**', async route => {
     await route.fulfill({
       status: 200,
       body: JSON.stringify({ success: true })
     })
   })
   ```

3. **Test Accessibility**
   ```typescript
   // Test keyboard navigation
   await page.keyboard.press('Tab')
   await expect(page.locator('input[name="email"]')).toBeFocused()
   ```

## Coverage Requirements

We maintain a minimum of **80% code coverage** across all metrics:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

### Viewing Coverage Reports

After running `npm run test:coverage`:

1. **Terminal Output**: Summary displayed in terminal
2. **HTML Report**: Open `coverage/lcov-report/index.html` in browser
3. **Detailed Analysis**: Run `node scripts/test-coverage.js`

### Improving Coverage

1. **Identify Uncovered Code**
   ```bash
   npm run test:coverage
   # Check coverage/lcov-report/index.html
   ```

2. **Add Missing Tests**
   - Focus on untested functions and components
   - Test error conditions and edge cases
   - Add integration tests for complex workflows

3. **Test Complex Logic**
   - Conditional statements (if/else)
   - Switch statements
   - Exception handling
   - Async operations

## Debugging Tests

### Unit Tests

1. **Debug in VS Code**
   - Set breakpoints in test files
   - Run Jest debug configuration
   - Use `debugger` statements

2. **Console Logging**
   ```typescript
   console.log('Debug info:', variable)
   screen.debug() // Prints DOM structure
   ```

3. **Query Debugging**
   ```typescript
   screen.logTestingPlaygroundURL() // Visual query builder
   ```

### E2E Tests

1. **Headed Mode**
   ```bash
   npm run test:e2e:headed
   ```

2. **Debug Mode**
   ```bash
   npx playwright test --debug
   ```

3. **Screenshots and Videos**
   ```typescript
   await page.screenshot({ path: 'debug.png' })
   ```

## Continuous Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test && npm run lint",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Tests Timeout**
   ```typescript
   // Increase timeout
   jest.setTimeout(30000)
   
   // Or in individual tests
   test('long running test', async () => {
     // ...
   }, 30000)
   ```

2. **Mock Issues**
   ```typescript
   // Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

3. **Async Testing**
   ```typescript
   // Use waitFor for async operations
   await waitFor(() => {
     expect(screen.getByText('Loading...')).not.toBeInTheDocument()
   })
   ```

4. **E2E Flaky Tests**
   ```typescript
   // Add explicit waits
   await page.waitForSelector('button[type="submit"]')
   await page.waitForLoadState('networkidle')
   ```

### Environment Issues

1. **Supabase Connection**
   ```bash
   # Check Supabase status
   npx supabase status
   
   # Reset if needed
   npx supabase db reset
   ```

2. **Port Conflicts**
   ```bash
   # Check what's running on port 3000
   lsof -i :3000
   ```

3. **Node Version**
   ```bash
   # Use correct Node version
   nvm use 18
   ```

## Test Data Management

### Test Fixtures

Create reusable test data:

```typescript
// test-fixtures.ts
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true
}

export const mockSession = {
  user: mockUser,
  expires: '2024-12-31'
}
```

### Database Seeding

```typescript
// For integration tests
beforeEach(async () => {
  await supabaseAdmin
    .from('user_profiles')
    .insert(testUserData)
})

afterEach(async () => {
  await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('email', 'test@example.com')
})
```

## Performance Testing

### Test Performance

```bash
# Run tests with timing
npm test -- --verbose

# Analyze slow tests
npm test -- --detectSlowTests
```

### E2E Performance

```typescript
test('page load performance', async ({ page }) => {
  const start = Date.now()
  await page.goto('/dashboard')
  const loadTime = Date.now() - start
  
  expect(loadTime).toBeLessThan(3000) // 3 seconds max
})
```

## Accessibility Testing

### Automated A11y Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('should be accessible', async ({ page }) => {
  await page.goto('/login')
  await injectAxe(page)
  await checkA11y(page)
})
```

### Manual A11y Testing

```typescript
test('keyboard navigation', async ({ page }) => {
  await page.goto('/login')
  
  await page.keyboard.press('Tab')
  await expect(page.locator('input[name="email"]')).toBeFocused()
  
  await page.keyboard.press('Tab')
  await expect(page.locator('input[name="password"]')).toBeFocused()
})
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

If you encounter issues with testing:

1. Check this documentation first
2. Review error messages carefully
3. Check test logs and coverage reports
4. Create an issue with reproduction steps

---

**Remember**: Good tests are investments in code quality and developer productivity. They should be maintainable, reliable, and provide confidence in your application's behavior.