import { test, expect } from '@playwright/test'

test.describe('Password Reset Flow', () => {
  test.describe('Password Reset Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reset-password')
    })

    test('should display password reset request form', async ({ page }) => {
      // Check page elements
      await expect(page).toHaveTitle(/auth starter/i)
      await expect(page.locator('h1')).toContainText('Reset your password')
      await expect(page.locator('text=Enter your email address and we\'ll send you a link')).toBeVisible()
      
      // Check form elements
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toContainText('Send reset link')
      
      // Check navigation links
      await expect(page.locator('a[href="/login"]')).toContainText('Back to sign in')
    })

    test('should validate email format', async ({ page }) => {
      // Submit invalid email
      await page.locator('input[name="email"]').fill('invalid-email')
      await page.locator('button[type="submit"]').click()
      
      // Should show validation error
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
    })

    test('should require email field', async ({ page }) => {
      // Submit empty form
      await page.locator('button[type="submit"]').click()
      
      // Should show required error
      await expect(page.locator('text=Email is required')).toBeVisible()
    })

    test('should handle successful password reset request', async ({ page }) => {
      // Mock successful API response
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.'
          })
        })
      })
      
      // Fill and submit form
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show success message
      await expect(page.locator('text=Check your email')).toBeVisible()
      await expect(page.locator('text=If an account with this email exists')).toBeVisible()
      await expect(page.locator('button:has-text("Send another link")')).toBeVisible()
    })

    test('should handle non-existent email (security)', async ({ page }) => {
      // Mock API response (should be same for security)
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.'
          })
        })
      })
      
      // Submit non-existent email
      await page.locator('input[name="email"]').fill('nonexistent@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show same success message (for security)
      await expect(page.locator('text=If an account with this email exists')).toBeVisible()
    })

    test('should handle rate limiting', async ({ page }) => {
      // Mock rate limit response
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'TooManyRequests',
            message: 'Too many password reset requests. Please wait before trying again.'
          })
        })
      })
      
      // Submit form
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show rate limit message
      await expect(page.locator('text=Too many password reset requests')).toBeVisible()
    })

    test('should show loading state during request', async ({ page }) => {
      // Mock slow API response
      await page.route('/api/auth/reset-password', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Submit form and check loading state
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show loading state
      await expect(page.locator('text=Sending...')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
    })

    test('should allow sending another reset link', async ({ page }) => {
      // Mock successful response
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Complete initial request
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show success screen
      await expect(page.locator('text=Check your email')).toBeVisible()
      
      // Click send another link
      await page.locator('button:has-text("Send another link")').click()
      
      // Should return to form
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="email"]')).toHaveValue('user@example.com')
    })
  })

  test.describe('Password Reset Confirmation', () => {
    test('should display password reset form with valid token', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Check page elements
      await expect(page.locator('h1')).toContainText('Set new password')
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toContainText('Update password')
    })

    test('should show error for invalid token', async ({ page }) => {
      // Mock invalid token response
      await page.route('/api/auth/reset-password/confirm*', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'InvalidToken',
              message: 'Invalid or expired reset token'
            })
          })
        }
      })
      
      await page.goto('/reset-password/confirm?token=invalid-token')
      
      // Should show error message
      await expect(page.locator('text=Invalid or expired reset token')).toBeVisible()
      await expect(page.locator('a[href="/reset-password"]')).toContainText('Request new reset link')
    })

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Test weak password
      await page.locator('input[name="password"]').fill('weak')
      await page.locator('input[name="confirmPassword"]').click() // Trigger validation
      
      // Should show password requirements
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    })

    test('should validate password confirmation match', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Fill mismatched passwords
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('DifferentPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show mismatch error
      await expect(page.locator("text=Passwords don't match")).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=valid-token')
      
      const passwordInput = page.locator('input[name="password"]')
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]')
      
      // Initially hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      // Toggle password visibility
      await page.locator('button[aria-label*="Show password"]:nth-of-type(1)').click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Toggle confirm password visibility
      await page.locator('button[aria-label*="Show password"]:nth-of-type(2)').click()
      await expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    test('should handle successful password reset', async ({ page }) => {
      // Mock successful reset
      await page.route('/api/auth/reset-password/confirm', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Password has been successfully reset.'
          })
        })
      })
      
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Fill form with valid data
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show success message
      await expect(page.locator('text=Password reset successful')).toBeVisible()
      await expect(page.locator('a[href="/login"]')).toContainText('Sign in with new password')
    })

    test('should handle expired token during reset', async ({ page }) => {
      // Mock expired token error
      await page.route('/api/auth/reset-password/confirm', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'TokenExpired',
            message: 'Reset token has expired. Please request a new one.'
          })
        })
      })
      
      await page.goto('/reset-password/confirm?token=expired-token')
      
      // Fill and submit form
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show expired token error
      await expect(page.locator('text=Reset token has expired')).toBeVisible()
      await expect(page.locator('a[href="/reset-password"]')).toBeVisible()
    })

    test('should show loading state during password reset', async ({ page }) => {
      // Mock slow reset API
      await page.route('/api/auth/reset-password/confirm', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Submit form and check loading state
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show loading state
      await expect(page.locator('text=Updating password...')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
    })
  })

  test.describe('Password Reset Security', () => {
    test('should prevent password reset token reuse', async ({ page }) => {
      // Mock token already used error
      await page.route('/api/auth/reset-password/confirm', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'TokenAlreadyUsed',
            message: 'This reset token has already been used. Please request a new one.'
          })
        })
      })
      
      await page.goto('/reset-password/confirm?token=used-token')
      
      // Submit form
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show token reuse error
      await expect(page.locator('text=reset token has already been used')).toBeVisible()
    })

    test('should handle malformed reset tokens', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=malformed.token.here')
      
      // Should show invalid token message
      await expect(page.locator('text=Invalid reset link')).toBeVisible()
      await expect(page.locator('a[href="/reset-password"]')).toBeVisible()
    })

    test('should validate token format', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=')
      
      // Should show missing token message
      await expect(page.locator('text=Invalid reset link')).toBeVisible()
    })

    test('should handle CSRF protection', async ({ page }) => {
      await page.goto('/reset-password/confirm?token=valid-token')
      
      // Verify CSRF token is included in requests
      let csrfTokenFound = false
      await page.route('/api/auth/reset-password/confirm', async route => {
        const headers = route.request().headers()
        if (headers['x-csrf-token'] || headers['csrf-token']) {
          csrfTokenFound = true
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Submit form
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      expect(csrfTokenFound).toBeTruthy()
    })
  })

  test.describe('Password Reset Integration', () => {
    test('should complete full password reset flow', async ({ page }) => {
      // Step 1: Request password reset
      await page.goto('/reset-password')
      
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            resetToken: process.env.NODE_ENV === 'development' ? 'test-token' : undefined
          })
        })
      })
      
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('button[type="submit"]').click()
      
      // Should show success message
      await expect(page.locator('text=Check your email')).toBeVisible()
      
      // Step 2: Navigate to reset confirmation (simulating email click)
      await page.goto('/reset-password/confirm?token=test-token')
      
      await page.route('/api/auth/reset-password/confirm', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Complete password reset
      await page.locator('input[name="password"]').fill('NewPassword123!')
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!')
      await page.locator('button[type="submit"]').click()
      
      // Should show success
      await expect(page.locator('text=Password reset successful')).toBeVisible()
      
      // Step 3: Navigate to login
      await page.locator('a[href="/login"]').click()
      
      // Should be on login page
      await expect(page).toHaveURL('/login')
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible()
    })

    test('should handle password reset from login page', async ({ page }) => {
      await page.goto('/login')
      
      // Click forgot password link
      await page.locator('a[href="/reset-password"]').click()
      
      // Should navigate to reset password page
      await expect(page).toHaveURL('/reset-password')
      await expect(page.locator('h1:has-text("Reset your password")')).toBeVisible()
    })

    test('should maintain proper navigation flow', async ({ page }) => {
      await page.goto('/reset-password')
      
      // Click back to sign in
      await page.locator('a[href="/login"]').click()
      await expect(page).toHaveURL('/login')
      
      // Go back to reset password
      await page.locator('a[href="/reset-password"]').click()
      await expect(page).toHaveURL('/reset-password')
      
      // Navigation should work correctly
      expect(true).toBeTruthy()
    })
  })

  test.describe('Password Reset Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/reset-password')
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      await expect(page.locator('input[name="email"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('button[type="submit"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('a[href="/login"]')).toBeFocused()
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/reset-password')
      
      // Check form labels and ARIA attributes
      await expect(page.locator('label[for="email"]')).toBeVisible()
      
      const emailInput = page.locator('input[name="email"]')
      await expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      
      // Submit empty form to check error ARIA
      await page.locator('button[type="submit"]').click()
      
      const errorMessage = page.locator('text=Email is required')
      await expect(errorMessage).toHaveAttribute('role', 'alert')
    })

    test('should support form submission with Enter key', async ({ page }) => {
      await page.route('/api/auth/reset-password', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      await page.goto('/reset-password')
      
      // Fill form and press Enter
      await page.locator('input[name="email"]').fill('user@example.com')
      await page.locator('input[name="email"]').press('Enter')
      
      // Should submit form
      await expect(page.locator('text=Check your email')).toBeVisible()
    })
  })
})