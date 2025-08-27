import { test, expect, Page } from '@playwright/test'

test.describe('Login/Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the login page before each test
    await page.goto('/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check page title and heading
    await expect(page).toHaveTitle(/auth starter/i)
    await expect(page.locator('h1')).toContainText('Welcome back')
    await expect(page.locator('text=Sign in to your account to continue')).toBeVisible()
    
    // Check all form fields are present
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Check submit button
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in')
    
    // Check Google sign-in button
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible()
    
    // Check forgot password link
    await expect(page.locator('a[href="/reset-password"]')).toContainText('Forgot your password?')
    
    // Check sign-up link
    await expect(page.locator('a[href="/register"]')).toContainText('Sign up')
  })

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.locator('button[type="submit"]').click()
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Fill invalid email
    await page.locator('input[name="email"]').fill('invalid-email')
    await page.locator('input[name="password"]').click() // Trigger blur
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should validate password length', async ({ page }) => {
    // Fill short password
    await page.locator('input[name="password"]').fill('123')
    await page.locator('input[name="email"]').click() // Trigger blur
    
    // Check for password validation error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const passwordToggle = page.locator('button[aria-label="Show password"]')
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Toggle password visibility
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(page.locator('button[aria-label="Hide password"]')).toBeVisible()
    
    // Toggle back to hidden
    await page.locator('button[aria-label="Hide password"]').click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await expect(page.locator('button[aria-label="Show password"]')).toBeVisible()
  })

  test('should handle successful login and redirect to dashboard', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            error: null,
            status: 200,
            url: 'http://localhost:3000/dashboard'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Fill the form with valid credentials
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    
    // Submit the form
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle login with custom redirect URL', async ({ page }) => {
    // Navigate to login with redirect parameter
    await page.goto('/login?redirect=/profile')
    
    // Mock successful login
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        })
      } else {
        await route.continue()
      }
    })
    
    // Fill and submit form
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to the custom URL
    await expect(page).toHaveURL('/profile')
  })

  test('should handle invalid credentials', async ({ page }) => {
    // Mock login failure
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: 'CredentialsSignin'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Fill the form with invalid credentials
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    
    // Submit the form
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should handle too many attempts error', async ({ page }) => {
    // Mock too many attempts error
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: 'TooManyAttempts'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Fill and submit form
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    await page.locator('button[type="submit"]').click()
    
    // Should show rate limit error
    await expect(page.locator('text=Too many login attempts')).toBeVisible()
  })

  test('should show loading state during login', async ({ page }) => {
    // Mock slow login API
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        })
      } else {
        await route.continue()
      }
    })
    
    // Fill the form
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    
    // Submit the form and check loading state
    await page.locator('button[type="submit"]').click()
    
    // Should show loading state
    await expect(page.locator('text=Signing in...')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should handle Google sign in', async ({ page }) => {
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
    
    // Click Google sign in
    await page.locator('button:has-text("Sign in with Google")').click()
    
    // Should trigger OAuth flow
    // In a real test, this would redirect to Google's OAuth page
  })

  test('should navigate to registration page', async ({ page }) => {
    // Click sign up link
    await page.locator('a[href="/register"]').click()
    
    // Should navigate to registration page
    await expect(page).toHaveURL('/register')
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible()
  })

  test('should navigate to password reset page', async ({ page }) => {
    // Click forgot password link
    await page.locator('a[href="/reset-password"]').click()
    
    // Should navigate to password reset page
    await expect(page).toHaveURL('/reset-password')
  })

  test('should clear error when user corrects input', async ({ page }) => {
    // Mock login failure first
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: 'CredentialsSignin'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Submit form with wrong credentials
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()
    
    // Should show error
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
    
    // Now mock successful login
    await page.route('**/api/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        })
      } else {
        await route.continue()
      }
    })
    
    // Correct password and resubmit
    await page.locator('input[name="password"]').fill('correctpassword')
    await page.locator('button[type="submit"]').click()
    
    // Error should be cleared
    await expect(page.locator('text=Invalid email or password')).not.toBeVisible()
  })
})

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated session
    await page.addInitScript(() => {
      // Mock session storage or cookies as needed
      window.sessionStorage.setItem('authenticated', 'true')
    })
    
    // Navigate to dashboard (authenticated area)
    await page.goto('/dashboard')
  })

  test('should display user menu when authenticated', async ({ page }) => {
    // Mock authenticated state
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-id',
              email: 'test@example.com',
              name: 'Test User'
            },
            expires: '2024-12-31'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Should show user menu
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Mock successful logout
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('signout')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'http://localhost:3000'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Click logout button (this would be in a dropdown or menu)
    await page.locator('button:has-text("Log out")').click()
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should show loading state during logout', async ({ page }) => {
    // Mock slow logout API
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('signout')) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'http://localhost:3000' })
        })
      } else {
        await route.continue()
      }
    })
    
    // Click logout and check loading state
    await page.locator('button:has-text("Log out")').click()
    
    // Should show loading state
    await expect(page.locator('text=Logging out...')).toBeVisible()
    await expect(page.locator('button:has-text("Logging out...")').isDisabled())
  })

  test('should handle logout from mobile menu', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mock logout
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('signout')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: 'http://localhost:3000' })
        })
      } else {
        await route.continue()
      }
    })
    
    // Open mobile menu
    await page.locator('button[aria-label="Toggle mobile menu"]').click()
    
    // Click logout in mobile menu
    await page.locator('button:has-text("Log out")').click()
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
  })

  test('should handle logout errors gracefully', async ({ page }) => {
    // Mock logout error
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('signout')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Logout failed' })
        })
      } else {
        await route.continue()
      }
    })
    
    // Spy on console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Try to logout
    await page.locator('button:has-text("Log out")').click()
    
    // Should log error but not crash the app
    await page.waitForTimeout(1000) // Wait for error to be logged
    expect(consoleErrors.some(error => error.includes('Logout failed'))).toBeTruthy()
  })
})

test.describe('Session Management', () => {
  test('should redirect to login when accessing protected route while unauthenticated', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Mock authenticated session
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user-id',
              email: 'test@example.com',
              name: 'Test User'
            },
            expires: '2024-12-31'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Go to dashboard
    await page.goto('/dashboard')
    
    // Should show authenticated content
    await expect(page.locator('text=Test User')).toBeVisible()
    
    // Refresh the page
    await page.reload()
    
    // Should still be authenticated
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should handle session expiry', async ({ page }) => {
    // First, mock valid session
    await page.route('**/api/auth/**', async route => {
      if (route.request().url().includes('session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(null) // Expired session
        })
      } else {
        await route.continue()
      }
    })
    
    // Try to access protected route with expired session
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Should focus email input
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus password input
    await expect(page.locator('input[name="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus password toggle
    await expect(page.locator('button[aria-label="Show password"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus forgot password link
    await expect(page.locator('a[href="/reset-password"]')).toBeFocused()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    // Check form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Check ARIA attributes
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'false')
    
    const passwordToggle = page.locator('button[aria-label="Show password"]')
    await expect(passwordToggle).toHaveAttribute('aria-label')
  })

  test('should announce form errors to screen readers', async ({ page }) => {
    // Submit empty form to generate errors
    await page.locator('button[type="submit"]').click()
    
    // Check that error messages have proper role
    const emailError = page.locator('text=Email is required')
    await expect(emailError).toHaveAttribute('role', 'alert')
    
    const passwordError = page.locator('text=Password is required')
    await expect(passwordError).toHaveAttribute('role', 'alert')
  })

  test('should support form submission with Enter key', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      })
    })
    
    // Fill form
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="password"]').fill('password123')
    
    // Submit with Enter key
    await page.locator('input[name="password"]').press('Enter')
    
    // Should submit the form
    await expect(page).toHaveURL('/dashboard')
  })
})