import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should display the home page correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check that the title is correct
    await expect(page).toHaveTitle(/Supabase Auth Starter/)
    
    // Check that the main heading is visible
    await expect(page.getByRole('heading', { name: 'Supabase Auth Starter' })).toBeVisible()
    
    // Check that the description text is present
    await expect(page.getByText('Next.js application with authentication ready for development')).toBeVisible()
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', 'Next.js application with Supabase authentication')
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    
    // Check that content is still visible on mobile
    await expect(page.getByRole('heading', { name: 'Supabase Auth Starter' })).toBeVisible()
  })
})