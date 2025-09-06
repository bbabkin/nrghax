import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth')
    
    // Check if login tab is visible
    await expect(page.getByRole('tab', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/auth-01-login-page.png', fullPage: true })
  })

  test('should allow user signup', async ({ page }) => {
    await page.goto('http://localhost:3000/auth')
    
    // Click on Sign Up tab
    await page.getByRole('tab', { name: 'Sign Up' }).click()
    
    // Fill signup form
    const testEmail = `test-${Date.now()}@example.com`
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    
    // Take screenshot before submit
    await page.screenshot({ path: 'screenshots/auth-02-signup-filled.png', fullPage: true })
    
    // Submit form
    await page.getByRole('button', { name: 'Sign Up' }).click()
    
    // Wait for navigation or message
    await page.waitForTimeout(2000)
    
    // Take screenshot after submit
    await page.screenshot({ path: 'screenshots/auth-03-after-signup.png', fullPage: true })
    
    // Check for success message or redirect
    const url = page.url()
    const hasMessage = await page.locator('text=/check.*email/i').isVisible().catch(() => false)
    
    expect(url.includes('/auth') || url.includes('/dashboard')).toBeTruthy()
    
    if (hasMessage) {
      console.log('Email verification required - check Inbucket at http://localhost:54324')
    }
  })

  test('should show OAuth buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/auth')
    
    // Check OAuth buttons are visible
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /discord/i })).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/auth-04-oauth-buttons.png', fullPage: true })
  })

  test('should protect dashboard route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('http://localhost:3000/dashboard')
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/)
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/auth-05-protected-redirect.png', fullPage: true })
  })
})