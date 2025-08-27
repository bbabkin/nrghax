import { test, expect, Page } from '@playwright/test'

test.describe('User Registration Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the registration page before each test
    await page.goto('/register')
  })

  test('should display registration form correctly', async ({ page }) => {
    // Check page title and heading
    await expect(page).toHaveTitle(/auth starter/i)
    await expect(page.locator('h1')).toContainText('Create your account')
    
    // Check all form fields are present
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    
    // Check submit button
    await expect(page.locator('button[type="submit"]')).toContainText('Create account')
    
    // Check Google sign-up button
    await expect(page.locator('button:has-text("Sign up with Google")')).toBeVisible()
    
    // Check sign-in link
    await expect(page.locator('a[href="/login"]')).toContainText('Sign in')
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.locator('button[type="submit"]').click()
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    await expect(page.locator('text=Please confirm your password')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Fill invalid email
    await page.locator('input[name="email"]').fill('invalid-email')
    await page.locator('input[name="name"]').click() // Trigger blur
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should validate password strength', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    
    // Test weak password
    await passwordInput.fill('weak')
    await page.locator('input[name="name"]').click() // Trigger blur
    
    // Should show password requirements error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    
    // Test password without uppercase
    await passwordInput.fill('lowercase123')
    await expect(page.locator('text=Password must contain at least one lowercase letter, one uppercase letter, and one number')).toBeVisible()
    
    // Test strong password and check strength indicator
    await passwordInput.fill('StrongPassword123')
    await expect(page.locator('text=Strong')).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('DifferentPassword123')
    await page.locator('input[name="name"]').click() // Trigger blur
    
    // Check for password mismatch error
    await expect(page.locator("text=Passwords don't match")).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]')
    const passwordToggle = page.locator('button[aria-label="Show password"]')
    const confirmPasswordToggle = page.locator('button[aria-label="Show password confirmation"]')
    
    // Initially passwords should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    
    // Toggle password visibility
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(page.locator('button[aria-label="Hide password"]')).toBeVisible()
    
    // Toggle confirm password visibility
    await confirmPasswordToggle.click()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    await expect(page.locator('button[aria-label="Hide password confirmation"]')).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    
    // Test different password strengths
    await passwordInput.fill('weak')
    await expect(page.locator('text=Weak')).toBeVisible()
    
    await passwordInput.fill('Better123')
    await expect(page.locator('text=Medium')).toBeVisible()
    
    await passwordInput.fill('StrongPassword123')
    await expect(page.locator('text=Strong')).toBeVisible()
  })

  test('should handle successful registration', async ({ page }) => {
    // Mock the registration API to return success
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Registration successful'
        })
      })
    })
    
    // Fill the form with valid data
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')
    
    // Submit the form
    await page.locator('button[type="submit"]').click()
    
    // Should show success screen
    await expect(page.locator('h1:has-text("Check your email")')).toBeVisible()
    await expect(page.locator('text=We\'ve sent a verification link')).toBeVisible()
    await expect(page.locator('button:has-text("Back to registration")')).toBeVisible()
    await expect(page.locator('a:has-text("Already verified? Sign in")')).toBeVisible()
  })

  test('should handle registration errors', async ({ page }) => {
    // Mock the registration API to return error
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'UserAlreadyExists',
          message: 'An account with this email already exists'
        })
      })
    })
    
    // Fill the form with valid data
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('existing@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')
    
    // Submit the form
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=An account with this email already exists')).toBeVisible()
  })

  test('should show loading state during registration', async ({ page }) => {
    // Mock slow registration API
    await page.route('/api/auth/register', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    // Fill the form
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')
    
    // Submit the form and check loading state
    await page.locator('button[type="submit"]').click()
    
    // Should show loading state
    await expect(page.locator('text=Creating account...')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should return to registration form from success screen', async ({ page }) => {
    // Mock successful registration
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    // Complete registration
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')
    await page.locator('button[type="submit"]').click()
    
    // Should be on success screen
    await expect(page.locator('h1:has-text("Check your email")')).toBeVisible()
    
    // Click back to registration
    await page.locator('button:has-text("Back to registration")').click()
    
    // Should be back to registration form
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should handle Google sign up', async ({ page }) => {
    // Mock Google OAuth flow
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('signin/google')) {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/dashboard'
          }
        })
      } else {
        await route.continue()
      }
    })
    
    // Click Google sign up
    await page.locator('button:has-text("Sign up with Google")').click()
    
    // Should trigger OAuth flow (we can't test the actual OAuth, but we can test the button click)
    // In a real test, this would redirect to Google's OAuth page
  })

  test('should navigate to login page', async ({ page }) => {
    // Click sign in link
    await page.locator('a[href="/login"]').click()
    
    // Should navigate to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible()
  })

  test('should display terms and privacy links', async ({ page }) => {
    // Check terms and privacy links
    await expect(page.locator('a[href="/terms"]:has-text("Terms of Service")')).toBeVisible()
    await expect(page.locator('a[href="/privacy"]:has-text("Privacy Policy")')).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    // Basic accessibility checks
    
    // Check for proper labels
    await expect(page.locator('label[for="name"]')).toBeVisible()
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible()
    
    // Check for ARIA attributes
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toHaveAttribute('aria-describedby')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Should focus first input
    await expect(page.locator('input[name="name"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus email input
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus password input
    await expect(page.locator('input[name="password"]')).toBeFocused()
  })

  test('should handle form submission with Enter key', async ({ page }) => {
    // Mock the registration API
    await page.route('/api/auth/register', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })
    
    // Fill the form
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('TestPassword123')
    await page.locator('input[name="confirmPassword"]').fill('TestPassword123')
    
    // Focus on confirm password field and press Enter
    await page.locator('input[name="confirmPassword"]').focus()
    await page.keyboard.press('Enter')
    
    // Should submit the form
    await expect(page.locator('h1:has-text("Check your email")')).toBeVisible()
  })

  test('should clear errors when user corrects input', async ({ page }) => {
    // Submit empty form to generate errors
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Email is required')).toBeVisible()
    
    // Fill email field
    await page.locator('input[name="email"]').fill('valid@example.com')
    await page.locator('input[name="name"]').click() // Trigger blur
    
    // Error should be cleared
    await expect(page.locator('text=Email is required')).not.toBeVisible()
  })
})