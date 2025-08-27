const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  const issues = [];
  
  console.log('🔍 Starting manual testing and screenshot capture...');
  
  try {
    // Test 1: Landing Page
    console.log('📸 Testing landing page...');
    await page.goto('http://localhost:3003/');
    await page.screenshot({ path: 'manual-screenshots/01-landing-page.png', fullPage: true });
    
    // Test 2: Navigate to Login
    console.log('📸 Testing login page...');
    await page.click('a[href="/login"]');
    await page.waitForLoadState();
    await page.screenshot({ path: 'manual-screenshots/02-login-page.png', fullPage: true });
    
    // Test 3: Login form validation
    console.log('📸 Testing login validation...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'manual-screenshots/03-login-validation-errors.png', fullPage: true });
    
    // Test 4: Navigate to Registration
    console.log('📸 Testing registration page...');
    await page.click('a[href="/register"]');
    await page.waitForLoadState();
    await page.screenshot({ path: 'manual-screenshots/04-registration-page.png', fullPage: true });
    
    // Test 5: Registration form validation
    console.log('📸 Testing registration validation...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'manual-screenshots/05-registration-validation-errors.png', fullPage: true });
    
    // Test 6: Password strength indicator
    console.log('📸 Testing password strength...');
    await page.fill('input[name="password"]', 'weak');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'manual-screenshots/06-weak-password.png', fullPage: true });
    
    await page.fill('input[name="password"]', 'StrongPassword123');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'manual-screenshots/07-strong-password.png', fullPage: true });
    
    // Test 7: Navigate to Password Reset
    console.log('📸 Testing password reset page...');
    await page.click('a[href="/login"]');
    await page.waitForLoadState();
    
    // Look for forgot password links - there might be multiple
    const forgotPasswordLinks = await page.locator('a[href="/reset-password"]').all();
    if (forgotPasswordLinks.length > 1) {
      issues.push({
        severity: 'HIGH',
        issue: 'Multiple "Forgot Password" links found',
        description: `Found ${forgotPasswordLinks.length} links to /reset-password. This causes test failures and user confusion.`,
        screenshot: 'manual-screenshots/02-login-page.png'
      });
    }
    
    await page.click('a[href="/reset-password"]');
    await page.waitForLoadState();
    await page.screenshot({ path: 'manual-screenshots/08-password-reset-page.png', fullPage: true });
    
    // Test 8: Try to access protected route
    console.log('📸 Testing protected route access...');
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState();
    await page.screenshot({ path: 'manual-screenshots/09-protected-route-redirect.png', fullPage: true });
    
    // Test 9: Mobile responsive test
    console.log('📸 Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3003/');
    await page.screenshot({ path: 'manual-screenshots/10-mobile-landing.png', fullPage: true });
    
    await page.goto('http://localhost:3003/login');
    await page.screenshot({ path: 'manual-screenshots/11-mobile-login.png', fullPage: true });
    
    await page.goto('http://localhost:3003/register');
    await page.screenshot({ path: 'manual-screenshots/12-mobile-registration.png', fullPage: true });
    
    // Test 10: Test actual form functionality with valid data
    console.log('📸 Testing form submission with valid data...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3003/register');
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123');
    
    await page.screenshot({ path: 'manual-screenshots/13-registration-filled.png', fullPage: true });
    
    // Try to submit (this might fail due to backend not being fully configured)
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'manual-screenshots/14-registration-submit-result.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    issues.push({
      severity: 'CRITICAL',
      issue: 'Testing Error',
      description: `Error occurred during manual testing: ${error.message}`,
      screenshot: null
    });
  }
  
  // Create screenshots directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('manual-screenshots')) {
    fs.mkdirSync('manual-screenshots');
  }
  
  console.log('✅ Manual testing completed!');
  console.log(`📁 Screenshots saved in: manual-screenshots/`);
  
  await browser.close();
  
  // Output initial issues found
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found during testing:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`   ${issue.description}`);
      if (issue.screenshot) {
        console.log(`   Screenshot: ${issue.screenshot}`);
      }
      console.log('');
    });
  }
})();