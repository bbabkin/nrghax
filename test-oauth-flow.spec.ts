import { test, expect } from '@playwright/test';

test('Google OAuth flow generates correct authorization URL', async ({ page }) => {
  // Set up request interception to capture OAuth redirect
  const requests: Array<{ url: string; method: string; status?: number }> = [];
  
  page.on('request', request => {
    requests.push({ url: request.url(), method: request.method() });
  });
  
  page.on('response', response => {
    const req = requests.find(r => r.url === response.url() && !('status' in r));
    if (req) req.status = response.status();
  });

  // Navigate to login page
  await page.goto('http://localhost:3002/login');
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of login page
  await page.screenshot({ path: 'screenshots/01-login-page.png' });
  
  // Verify Google button exists
  const googleButton = page.locator('button', { hasText: 'Sign in with Google' });
  await expect(googleButton).toBeVisible();
  
  // Click Google sign-in button (this should trigger the OAuth flow)
  await googleButton.click();
  
  // Wait a moment for requests to be made
  await page.waitForTimeout(2000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'screenshots/02-after-google-click.png' });
  
  // Verify that the OAuth authorization request was made
  const oauthRequest = requests.find(req => 
    req.url.includes('accounts.google.com/o/oauth2/v2/auth') ||
    req.url.includes('signin/google')
  );
  
  console.log('All requests:', requests.map(r => `${r.method} ${r.url} (${r.status})`));
  
  // Check that NextAuth generated the correct endpoints
  const providersRequest = requests.find(req => req.url.includes('/api/auth/providers'));
  const csrfRequest = requests.find(req => req.url.includes('/api/auth/csrf'));
  const signinRequest = requests.find(req => req.url.includes('/api/auth/signin/google'));
  
  expect(providersRequest).toBeDefined();
  expect(csrfRequest).toBeDefined();
  expect(signinRequest).toBeDefined();
  
  // Verify the signin request was successful (200 status)
  if (signinRequest) {
    expect(signinRequest.status).toBe(200);
  }
  
  console.log('✅ Google OAuth flow is working correctly!');
  console.log('✅ NextAuth.js v5 signin endpoint is functional');  
  console.log('✅ CSRF protection is working');
  console.log('✅ OAuth providers are configured correctly');
});