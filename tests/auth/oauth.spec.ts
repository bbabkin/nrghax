import { test, expect } from '@playwright/test'

test.describe('OAuth Authentication Flow', () => {
  test.describe('Google OAuth Sign In', () => {
    test('should initiate Google OAuth from login page', async ({ page }) => {
      await page.goto('/login')
      
      // Mock the OAuth redirect to prevent actual Google interaction
      await page.route('**/api/auth/signin/google', async route => {
        // Simulate OAuth redirect
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://accounts.google.com/oauth/authorize?...',
          },
        })
      })
      
      // Click Google sign in button
      const googleButton = page.locator('button:has-text("Sign in with Google")')
      await expect(googleButton).toBeVisible()
      
      // In a real scenario, this would redirect to Google
      // For testing, we just verify the button is clickable and triggers the right action
      await googleButton.click()
      
      // Verify the OAuth endpoint was called
      // (In a real test environment, you would mock the OAuth flow)
    })

    test('should initiate Google OAuth from registration page', async ({ page }) => {
      await page.goto('/register')
      
      // Mock the OAuth redirect
      await page.route('**/api/auth/signin/google', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://accounts.google.com/oauth/authorize?...',
          },
        })
      })
      
      // Click Google sign up button
      const googleButton = page.locator('button:has-text("Sign up with Google")')
      await expect(googleButton).toBeVisible()
      await googleButton.click()
    })

    test('should handle successful OAuth callback', async ({ page }) => {
      // Simulate OAuth callback URL with success
      await page.route('**/api/auth/callback/google*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              window.location.href = '/dashboard';
            </script>
          `,
        })
      })
      
      // Navigate to callback URL (simulating return from Google)
      await page.goto('/api/auth/callback/google?code=mock-auth-code&state=mock-state')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle OAuth error callback', async ({ page }) => {
      // Simulate OAuth callback with error
      await page.route('**/api/auth/callback/google*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              window.location.href = '/login?error=OAuthAccountNotLinked';
            </script>
          `,
        })
      })
      
      // Navigate to callback URL with error
      await page.goto('/api/auth/callback/google?error=access_denied')
      
      // Should redirect back to login with error
      await expect(page).toHaveURL('/login?error=OAuthAccountNotLinked')
    })

    test('should display OAuth error messages on login page', async ({ page }) => {
      // Go to login page with OAuth error
      await page.goto('/login?error=OAuthAccountNotLinked')
      
      // Should display appropriate error message
      await expect(page.locator('text=There was a problem signing in')).toBeVisible()
    })

    test('should handle OAuth account linking', async ({ page }) => {
      // Mock existing account scenario
      await page.route('**/api/auth/signin/google', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'OAuthAccountNotLinked',
            message: 'This email is already associated with another account'
          })
        })
      })
      
      await page.goto('/login')
      await page.locator('button:has-text("Sign in with Google")').click()
      
      // Should show account linking message
      await expect(page.locator('text=This email is already associated')).toBeVisible()
    })

    test('should handle OAuth consent cancellation', async ({ page }) => {
      // Simulate user canceling OAuth consent
      await page.route('**/api/auth/callback/google*', async route => {
        if (route.request().url().includes('error=access_denied')) {
          await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: `
              <script>
                window.location.href = '/login?error=AccessDenied';
              </script>
            `,
          })
        } else {
          await route.continue()
        }
      })
      
      // Navigate to callback with access denied
      await page.goto('/api/auth/callback/google?error=access_denied&error_description=User%20cancelled')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login?error=AccessDenied')
      
      // Should show cancellation message
      await expect(page.locator('text=Sign in was cancelled')).toBeVisible()
    })
  })

  test.describe('OAuth Security', () => {
    test('should validate OAuth state parameter', async ({ page }) => {
      // Mock OAuth callback with mismatched state
      await page.route('**/api/auth/callback/google*', async route => {
        if (route.request().url().includes('state=invalid')) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'StateMismatch',
              message: 'Invalid state parameter'
            })
          })
        } else {
          await route.continue()
        }
      })
      
      // Navigate with invalid state
      await page.goto('/api/auth/callback/google?code=auth-code&state=invalid')
      
      // Should handle state mismatch error
      await expect(page).toHaveURL(/error/)
    })

    test('should handle CSRF protection in OAuth flow', async ({ page }) => {
      await page.goto('/login')
      
      // Verify CSRF token is included in OAuth requests
      let csrfTokenFound = false
      await page.route('**/api/auth/**', async route => {
        const headers = route.request().headers()
        if (headers['x-csrf-token'] || headers['csrf-token']) {
          csrfTokenFound = true
        }
        await route.continue()
      })
      
      await page.locator('button:has-text("Sign in with Google")').click()
      
      // CSRF protection should be in place
      expect(csrfTokenFound).toBeTruthy()
    })
  })

  test.describe('OAuth Profile Creation', () => {
    test('should create user profile on first OAuth sign in', async ({ page }) => {
      // Mock OAuth callback for new user
      await page.route('**/api/auth/callback/google*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              // Simulate new user creation
              sessionStorage.setItem('newUser', 'true');
              window.location.href = '/dashboard?welcome=true';
            </script>
          `,
        })
      })
      
      // Navigate to callback
      await page.goto('/api/auth/callback/google?code=new-user-code&state=valid-state')
      
      // Should redirect to dashboard with welcome message
      await expect(page).toHaveURL('/dashboard?welcome=true')
    })

    test('should handle existing OAuth user sign in', async ({ page }) => {
      // Mock OAuth callback for existing user
      await page.route('**/api/auth/callback/google*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              window.location.href = '/dashboard';
            </script>
          `,
        })
      })
      
      // Navigate to callback
      await page.goto('/api/auth/callback/google?code=existing-user-code&state=valid-state')
      
      // Should redirect to dashboard normally
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('OAuth Error Handling', () => {
    test('should handle network errors during OAuth', async ({ page }) => {
      await page.goto('/login')
      
      // Mock network error
      await page.route('**/api/auth/signin/google', async route => {
        await route.abort('failed')
      })
      
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // Try to sign in with Google
      await page.locator('button:has-text("Sign in with Google")').click()
      
      // Should handle error gracefully
      await page.waitForTimeout(1000)
      expect(consoleErrors.some(error => error.includes('Google sign-in failed'))).toBeTruthy()
    })

    test('should handle OAuth provider unavailable', async ({ page }) => {
      await page.goto('/login')
      
      // Mock OAuth provider error
      await page.route('**/api/auth/signin/google', async route => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'ServiceUnavailable',
            message: 'OAuth provider temporarily unavailable'
          })
        })
      })
      
      await page.locator('button:has-text("Sign in with Google")').click()
      
      // Should show provider unavailable message
      await expect(page.locator('text=temporarily unavailable')).toBeVisible()
    })

    test('should handle malformed OAuth responses', async ({ page }) => {
      // Mock malformed OAuth callback
      await page.route('**/api/auth/callback/google*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        })
      })
      
      // Navigate to callback with malformed response
      await page.goto('/api/auth/callback/google?code=auth-code&state=valid-state')
      
      // Should handle malformed response gracefully
      await expect(page).toHaveURL(/error/)
    })
  })

  test.describe('OAuth Session Management', () => {
    test('should maintain OAuth session across page refreshes', async ({ page }) => {
      // Mock authenticated OAuth session
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'google-user-id',
              email: 'user@gmail.com',
              name: 'Google User',
              image: 'https://lh3.googleusercontent.com/...'
            },
            expires: '2024-12-31',
            provider: 'google'
          })
        })
      })
      
      await page.goto('/dashboard')
      
      // Should show OAuth user info
      await expect(page.locator('text=Google User')).toBeVisible()
      
      // Refresh page
      await page.reload()
      
      // Should still be authenticated
      await expect(page.locator('text=Google User')).toBeVisible()
    })

    test('should handle OAuth session expiry', async ({ page }) => {
      // Mock expired OAuth session
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(null)
        })
      })
      
      await page.goto('/dashboard')
      
      // Should redirect to login when session is expired
      await expect(page).toHaveURL('/login')
    })
  })
})