import { test, expect } from '@playwright/test'

test.describe('Modal Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/signin')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/library/**', { timeout: 10000 })
  })

  test('capture library modal', async ({ page }) => {
    await page.goto('http://localhost:3000/library')
    await page.waitForTimeout(2000)

    // Take before screenshot
    await page.screenshot({ path: 'library_before.png', fullPage: true })

    // Click first hack card
    const hackCard = page.locator('button[data-type="hack"]').first()
    await hackCard.click()
    await page.waitForTimeout(1000)

    // Take after screenshot
    await page.screenshot({ path: 'library_with_modal.png', fullPage: true })
    await page.screenshot({ path: 'library_viewport.png', fullPage: false })
  })

  test('capture skills modal', async ({ page }) => {
    await page.goto('http://localhost:3000/skills')
    await page.waitForTimeout(2000)

    // Take before screenshot
    await page.screenshot({ path: 'skills_before.png', fullPage: true })

    // Click first unlocked skill
    const skillCard = page.locator('button[data-hack-unlocked="true"]').first()
    await skillCard.click()
    await page.waitForTimeout(1000)

    // Take after screenshot
    await page.screenshot({ path: 'skills_with_modal.png', fullPage: true })
    await page.screenshot({ path: 'skills_viewport.png', fullPage: false })
  })
})