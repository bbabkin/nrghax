import { test, expect } from '@playwright/test'

test.describe('Application Setup', () => {
  test('should load the application without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    
    // Check that the page loaded successfully
    await expect(page.locator('body')).toBeVisible()
    
    // Check that there are no critical console errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_INTERNET_DISCONNECTED')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/')
    
    // Check basic HTML structure
    await expect(page.locator('html[lang="en"]')).toBeVisible()
    await expect(page.locator('head')).toBeVisible()
    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('should load CSS and styles correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check that Tailwind CSS is loaded by testing a utility class
    const mainElement = page.locator('main')
    const computedStyle = await mainElement.evaluate((el) => {
      return window.getComputedStyle(el).minHeight
    })
    
    // min-h-screen should be applied
    expect(computedStyle).toBe('100vh')
  })
})