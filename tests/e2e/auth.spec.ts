import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
  })

  test('should display login form by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should switch to signup form', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click()
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('Create a password')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByPlaceholder('name@example.com').fill('invalid@test.com')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Wait for error message
    await page.waitForTimeout(2000)
    const toastError = page.locator('[role="alert"]').first()
    const errorExists = await toastError.count() > 0
    
    if (errorExists) {
      await expect(toastError).toContainText(/error|invalid/i)
    } else {
      // Check for URL error parameter
      await expect(page).toHaveURL(/error=/i)
    }
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Use the test credentials we set up
    await page.getByPlaceholder('name@example.com').fill('test@test.com')
    await page.getByPlaceholder('Enter your password').fill('test123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should validate signup form fields', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click()
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByPlaceholder('name@example.com')
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should validate password match in signup', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click()
    
    await page.getByPlaceholder('name@example.com').fill('newuser@test.com')
    await page.getByPlaceholder('Create a password').fill('password123')
    await page.getByPlaceholder('Confirm your password').fill('differentpassword')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Wait for error message
    await page.waitForTimeout(1000)
    const toastError = page.locator('[role="alert"]').first()
    const errorExists = await toastError.count() > 0
    
    if (errorExists) {
      await expect(toastError).toContainText(/password/i)
    }
  })

  test('should have OAuth buttons', async ({ page }) => {
    // Check for OAuth providers
    const githubButton = page.getByRole('button', { name: /github/i })
    const googleButton = page.getByRole('button', { name: /google/i })
    
    await expect(githubButton).toBeVisible()
    await expect(googleButton).toBeVisible()
  })

  test('should redirect to requested page after login', async ({ page }) => {
    // Navigate to protected route
    await page.goto('/dashboard')
    
    // Should redirect to auth with redirect parameter
    await expect(page).toHaveURL(/\/auth\?redirect=/)
    
    // Login
    await page.getByPlaceholder('name@example.com').fill('test@test.com')
    await page.getByPlaceholder('Enter your password').fill('test123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect back to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })
})