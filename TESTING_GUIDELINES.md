# Testing Guidelines for NRGHax

## Why These Guidelines Exist

During development, our tests reported that the "like button for unregistered users" feature was working correctly. However, when manually tested in the browser, it was throwing 500 errors. This document outlines testing best practices to prevent such gaps.

## The Problem We Encountered

### What Went Wrong
- **Tests only covered list pages** (`/hacks`), not detail pages (`/hacks/[id]`)
- **Different code paths weren't tested**: List pages used client components, detail pages used server actions
- **Server-side errors weren't caught**: Tests didn't properly check for 500 errors from server actions

### Root Cause
The like button was implemented differently in two places:
1. **List Page** (`/hacks`): Client component with `router.push('/auth')` ✅ Working
2. **Detail Page** (`/hacks/[id]`): Server action throwing error ❌ Causing 500

## Testing Principles

### 1. Test All User Paths
```javascript
// BAD: Only testing one route
await page.goto('/hacks');
// click like button test

// GOOD: Test all routes where feature exists
const routesToTest = [
  '/hacks',           // List page
  '/hacks/some-id',   // Detail page
  '/routines',        // Other list page
  '/routines/some-id' // Other detail page
];

for (const route of routesToTest) {
  await page.goto(route);
  // test the feature
}
```

### 2. Monitor Network and Console Errors
```javascript
// Always track errors
const errors = [];
const networkErrors = [];

page.on('pageerror', error => {
  errors.push(error.message);
  console.log('❌ Page Error:', error.message);
});

page.on('response', response => {
  if (response.status() >= 400) {
    networkErrors.push({
      url: response.url(),
      status: response.status()
    });
  }
});
```

### 3. Test Both Implementation Types

When a feature can be implemented in different ways, test all variants:

#### Client Components vs Server Actions
```javascript
// Test client-side implementation
await page.evaluate(() => {
  // Click button that triggers client-side code
});

// Test server-side implementation
await page.click('form button'); // Forms often trigger server actions
await page.waitForResponse(response =>
  response.url().includes('/api/') && response.status() !== 200
);
```

### 4. Verify Error Handling
```javascript
// Don't just check if page redirects
// Also verify no errors occurred

// Check console errors
const consoleErrors = await page.evaluate(() =>
  window.consoleErrors || []
);

// Check network errors
const failed = responses.filter(r => r.status() >= 400);

// Assert no errors
expect(consoleErrors).toHaveLength(0);
expect(failed).toHaveLength(0);
```

## Test Structure Template

```javascript
async function testFeatureComprehensively(featureName) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // 1. Setup error tracking
  const errors = { console: [], network: [], javascript: [] };
  setupErrorTracking(page, errors);

  // 2. Test all routes
  const routes = await findAllRoutesWithFeature(featureName);

  for (const route of routes) {
    console.log(`Testing ${featureName} on ${route}`);

    // 3. Clear session for consistent state
    await clearSession(page);

    // 4. Navigate and wait for stability
    await page.goto(route, { waitUntil: 'networkidle2' });

    // 5. Test the feature
    await testFeature(page, featureName);

    // 6. Verify expected behavior
    await verifyBehavior(page, featureName);

    // 7. Check for errors
    assertNoErrors(errors);

    // 8. Take screenshot for documentation
    await page.screenshot({
      path: `screenshots/${featureName}-${route.replace(/\//g, '-')}.png`
    });
  }

  await browser.close();
}
```

## Critical Testing Checklist

### Before Claiming a Feature Works

- [ ] **Test on ALL pages** where the feature exists
- [ ] **Test with different user states** (logged in, logged out, admin)
- [ ] **Check browser console** for JavaScript errors
- [ ] **Check network tab** for failed requests (4xx, 5xx)
- [ ] **Test both happy path AND error cases**
- [ ] **Verify server logs** for server-side errors
- [ ] **Test with fresh session** (clear cookies/localStorage)
- [ ] **Take screenshots** as proof of working state

### Server Action Testing

Server actions require special attention:

```javascript
// Server actions can fail silently in tests
// Always check:

// 1. Dev server logs
await checkDevServerLogs();

// 2. Network responses
const responses = await page.waitForResponse(
  r => r.url().includes(actionUrl),
  { timeout: 5000 }
);
expect(response.status()).toBe(200);

// 3. Page doesn't show error state
const errorElement = await page.$('.error-message');
expect(errorElement).toBeNull();
```

## Common Pitfalls to Avoid

### 1. Testing Only the Happy Path
```javascript
// BAD
await clickLikeButton();
expect(page.url()).toContain('/auth');

// GOOD
await clickLikeButton();
expect(page.url()).toContain('/auth');
expect(await getConsoleErrors()).toHaveLength(0);
expect(await getNetworkErrors()).toHaveLength(0);
expect(await getServerLogs()).not.toContain('Error');
```

### 2. Not Testing Server Components
```javascript
// Server Components and Server Actions need different testing
// They can fail in ways client components don't

// For Server Components/Actions:
await page.goto(url);
await page.waitForSelector('[data-testid="content"]', {
  timeout: 10000 // Longer timeout for server rendering
});

// Check for error boundaries
const errorBoundary = await page.$('[data-error-boundary]');
expect(errorBoundary).toBeNull();
```

### 3. Ignoring Edge Cases
```javascript
// Always test:
- Empty states
- Loading states
- Error states
- Unauthorized access
- Network failures
- Race conditions
```

## Running Tests

### Development Testing
```bash
# Start services
supabase start
npm run dev

# Run tests
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests

# Run specific test
node tests/test-like-feature.js
```

### Production Testing
```bash
# Deploy first
npm run build
npm run preview

# Test against production build
NEXT_PUBLIC_APP_URL=http://localhost:3000 npm run test:e2e
```

## Debugging Failed Tests

### 1. Check All Logs
```bash
# Terminal 1: Dev server logs
npm run dev

# Terminal 2: Supabase logs
supabase status
docker logs supabase_db_nrghax

# Terminal 3: Run test with verbose output
DEBUG=* node tests/my-test.js
```

### 2. Use Screenshots
```javascript
// Take screenshots at each step
await page.screenshot({ path: 'step-1-before-click.png' });
await clickButton();
await page.screenshot({ path: 'step-2-after-click.png' });
```

### 3. Slow Down Execution
```javascript
// Add delays to see what's happening
await page.click('button');
await page.waitForTimeout(2000); // Wait 2 seconds
```

## Example: Complete Test for Like Button

```javascript
const puppeteer = require('puppeteer');

async function testLikeButtonComprehensive() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Track ALL errors
  const errors = [];
  page.on('pageerror', err => errors.push(err));
  page.on('response', res => {
    if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
  });

  // Test configuration
  const testCases = [
    {
      name: 'Hacks List Page',
      url: 'http://localhost:3000/hacks',
      selector: 'button[aria-label*="like"]'
    },
    {
      name: 'Hack Detail Page',
      url: 'http://localhost:3000/hacks/example-hack-id',
      selector: 'button[aria-label*="like"]'
    },
    {
      name: 'Routines List Page',
      url: 'http://localhost:3000/routines',
      selector: 'button[aria-label*="like"]'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\\nTesting: ${testCase.name}`);
    console.log('═══════════════════════════════════════');

    // Clear session
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to page
    await page.goto(testCase.url, { waitUntil: 'networkidle2' });

    // Find and click like button
    const button = await page.$(testCase.selector);
    if (!button) {
      console.log(`❌ No like button found on ${testCase.name}`);
      continue;
    }

    // Click and wait for response
    await button.click();
    await page.waitForTimeout(2000);

    // Verify redirect
    const currentUrl = page.url();
    const redirected = currentUrl.includes('/auth');

    // Check for errors
    const hasErrors = errors.length > 0;

    // Report results
    if (redirected && !hasErrors) {
      console.log(`✅ ${testCase.name}: Success - Redirected to auth, no errors`);
    } else if (redirected && hasErrors) {
      console.log(`⚠️ ${testCase.name}: Partial - Redirected but has errors:`);
      errors.forEach(e => console.log(`   - ${e}`));
    } else if (!redirected && !hasErrors) {
      console.log(`❌ ${testCase.name}: Failed - No redirect occurred`);
    } else {
      console.log(`❌ ${testCase.name}: Failed - Errors occurred:`);
      errors.forEach(e => console.log(`   - ${e}`));
    }

    // Clear errors for next test
    errors.length = 0;

    // Screenshot for evidence
    await page.screenshot({
      path: `screenshots/${testCase.name.replace(/\s+/g, '-').toLowerCase()}.png`
    });
  }

  await browser.close();

  console.log('\\n📊 Test Complete');
  console.log('Check screenshots/ folder for visual evidence');
}

// Run the test
testLikeButtonComprehensive().catch(console.error);
```

## Summary

The key lesson: **Never assume different implementations of the same feature behave identically.**

Always:
1. Test all pages/routes where a feature exists
2. Monitor for errors at multiple levels (console, network, server)
3. Test both client and server implementations
4. Verify with screenshots and manual testing
5. Check server logs for server-side errors

This comprehensive approach would have caught our server action error that the initial tests missed.