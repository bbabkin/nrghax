import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'crypto'

// Test user credentials
const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!'
  },
  user1: {
    email: 'user1@test.com',
    password: 'User123!'
  },
  user2: {
    email: 'user2@test.com',
    password: 'User123!'
  }
}

// Helper function to sign in
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/signin')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for navigation after successful login
  await page.waitForURL('/', { timeout: 10000 })
}

// Helper function to sign out
async function signOut(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]')

  // Click sign out
  await page.click('text=Sign out')

  // Wait for redirect to home
  await page.waitForURL('/')
}

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
  })

  test('Public user can browse hacks without signing in', async ({ page }) => {
    // Navigate to hacks page
    await page.click('text=Browse Hacks')
    await expect(page).toHaveURL('/hacks')

    // Should see hack cards
    await expect(page.locator('[data-testid="hack-card"]').first()).toBeVisible()

    // Click on a hack to view details
    await page.click('[data-testid="hack-card"]', { index: 0 })

    // Should see hack details
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="hack-content"]')).toBeVisible()

    // Should not see admin actions
    await expect(page.locator('text=Edit Hack')).not.toBeVisible()
  })

  test('User can sign up and complete onboarding', async ({ page }) => {
    const uniqueEmail = `test-${randomUUID()}@example.com`

    // Go to sign up page
    await page.goto('/signup')

    // Fill sign up form
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to home or profile after signup
    await page.waitForURL('/', { timeout: 10000 })

    // Should be signed in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('Regular user workflow: browse, like, complete hacks', async ({ page }) => {
    // Sign in as regular user
    await signIn(page, testUsers.user1.email, testUsers.user1.password)

    // Navigate to hacks
    await page.goto('/hacks')

    // Find and click on a hack
    const hackCard = page.locator('[data-testid="hack-card"]').first()
    const hackTitle = await hackCard.locator('h3').textContent()
    await hackCard.click()

    // Like the hack
    const likeButton = page.locator('[data-testid="like-button"]')
    await likeButton.click()

    // Check if like count increased
    await expect(likeButton).toContainText(/1|Liked/)

    // Mark hack as completed
    const completeButton = page.locator('[data-testid="complete-button"]')
    await completeButton.click()

    // Should show completion status
    await expect(completeButton).toContainText(/Completed|✓/)

    // Navigate to profile history
    await page.goto('/profile/history')

    // Should see the completed hack in history
    await expect(page.locator(`text=${hackTitle}`)).toBeVisible()
  })

  test('User can create and execute a routine', async ({ page }) => {
    // Sign in as regular user
    await signIn(page, testUsers.user1.email, testUsers.user1.password)

    // Navigate to routines
    await page.goto('/routines')

    // Create new routine
    await page.click('text=Create Routine')

    // Fill routine form
    const routineName = `Test Routine ${Date.now()}`
    await page.fill('input[name="name"]', routineName)
    await page.fill('textarea[name="description"]', 'A test routine for E2E testing')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to routine edit page
    await page.waitForURL(/\/routines\/.*\/edit/)

    // Add hacks to routine
    await page.click('text=Add Hacks')

    // Select first 3 hacks
    const hackCheckboxes = page.locator('[data-testid="hack-checkbox"]')
    for (let i = 0; i < 3 && i < await hackCheckboxes.count(); i++) {
      await hackCheckboxes.nth(i).click()
    }

    await page.click('text=Add Selected')

    // Start routine
    await page.click('text=Start Routine')

    // Should be on routine execution page
    await expect(page.locator('[data-testid="routine-player"]')).toBeVisible()

    // Navigate through hacks
    await page.click('[data-testid="next-hack"]')
    await page.click('[data-testid="next-hack"]')

    // Complete routine
    await page.click('[data-testid="complete-routine"]')

    // Should show completion message
    await expect(page.locator('text=/Routine completed|Congratulations/')).toBeVisible()
  })

  test('Admin can create and manage hacks', async ({ page }) => {
    // Sign in as admin
    await signIn(page, testUsers.admin.email, testUsers.admin.password)

    // Navigate to admin dashboard
    await page.goto('/admin/hacks')

    // Create new hack
    await page.click('text=Create Hack')

    // Fill hack form
    const hackName = `E2E Test Hack ${Date.now()}`
    await page.fill('input[name="name"]', hackName)
    await page.fill('textarea[name="description"]', 'E2E test hack description')
    await page.selectOption('select[name="difficulty"]', 'Intermediate')
    await page.fill('input[name="time_minutes"]', '15')
    await page.selectOption('select[name="category"]', 'productivity')

    // Add content
    await page.fill('textarea[name="content_body"]', '# Test Content\n\nThis is test content for E2E testing.')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to hacks list
    await page.waitForURL('/admin/hacks')

    // Verify hack was created
    await expect(page.locator(`text=${hackName}`)).toBeVisible()

    // Edit the hack
    await page.click(`[data-testid="edit-hack-${hackName}"]`)

    // Update description
    await page.fill('textarea[name="description"]', 'Updated E2E test description')
    await page.click('button[type="submit"]')

    // Should save and redirect
    await page.waitForURL('/admin/hacks')

    // Delete the hack
    await page.click(`[data-testid="delete-hack-${hackName}"]`)

    // Confirm deletion
    await page.click('text=Confirm Delete')

    // Hack should be removed from list
    await expect(page.locator(`text=${hackName}`)).not.toBeVisible()
  })

  test('Comments system works correctly', async ({ page }) => {
    // Sign in as user
    await signIn(page, testUsers.user1.email, testUsers.user1.password)

    // Navigate to a hack
    await page.goto('/hacks')
    await page.click('[data-testid="hack-card"]', { index: 0 })

    // Add a comment
    const commentText = `Test comment ${Date.now()}`
    await page.fill('[data-testid="comment-input"]', commentText)
    await page.click('[data-testid="submit-comment"]')

    // Comment should appear
    await expect(page.locator(`text=${commentText}`)).toBeVisible()

    // Edit the comment
    await page.click(`[data-testid="edit-comment-${commentText}"]`)
    await page.fill('[data-testid="comment-edit-input"]', `${commentText} (edited)`)
    await page.click('[data-testid="save-comment"]')

    // Should show edited comment
    await expect(page.locator(`text=${commentText} (edited)`)).toBeVisible()

    // Reply to comment
    await page.click(`[data-testid="reply-comment-${commentText}"]`)
    const replyText = 'This is a reply'
    await page.fill('[data-testid="reply-input"]', replyText)
    await page.click('[data-testid="submit-reply"]')

    // Reply should appear nested
    await expect(page.locator(`text=${replyText}`)).toBeVisible()

    // Delete the comment
    await page.click(`[data-testid="delete-comment-${commentText}"]`)
    await page.click('text=Confirm Delete')

    // Comment should be removed
    await expect(page.locator(`text=${commentText}`)).not.toBeVisible()
  })

  test('Video player functionality', async ({ page }) => {
    // Sign in as user
    await signIn(page, testUsers.user1.email, testUsers.user1.password)

    // Find a hack with video content
    await page.goto('/hacks')

    // Look for video hack indicator
    const videoHack = page.locator('[data-testid="video-hack"]').first()

    if (await videoHack.isVisible()) {
      await videoHack.click()

      // Video player should be visible
      await expect(page.locator('[data-testid="video-player"]')).toBeVisible()

      // Play button should exist
      await expect(page.locator('[data-testid="play-button"]')).toBeVisible()

      // Add timestamp comment
      await page.click('[data-testid="add-timestamp-comment"]')
      await page.fill('[data-testid="timestamp-comment-input"]', 'Great tip at this moment!')
      await page.click('[data-testid="submit-timestamp-comment"]')

      // Timestamp comment should appear
      await expect(page.locator('text=Great tip at this moment!')).toBeVisible()
    }
  })

  test('Mobile responsive design', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
    }

    // Navigate to home
    await page.goto('/')

    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')

    // Menu items should be visible
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    await expect(page.locator('text=Browse Hacks')).toBeVisible()
    await expect(page.locator('text=Routines')).toBeVisible()

    // Navigate to hacks
    await page.click('text=Browse Hacks')

    // Hack cards should be responsive
    const hackCard = page.locator('[data-testid="hack-card"]').first()
    const cardWidth = await hackCard.boundingBox()

    // Card should take most of viewport width on mobile
    expect(cardWidth?.width).toBeLessThan(400)
  })

  test('Search and filter functionality', async ({ page }) => {
    await page.goto('/hacks')

    // Search for hacks
    await page.fill('[data-testid="search-input"]', 'morning')
    await page.press('[data-testid="search-input"]', 'Enter')

    // Should show filtered results
    await expect(page.locator('[data-testid="hack-card"]')).toHaveCount(/.+/)

    // Clear search
    await page.fill('[data-testid="search-input"]', '')

    // Filter by category
    await page.selectOption('[data-testid="category-filter"]', 'productivity')

    // Should show filtered results
    await expect(page.locator('[data-testid="hack-card"]')).toHaveCount(/.+/)

    // Filter by difficulty
    await page.selectOption('[data-testid="difficulty-filter"]', 'Beginner')

    // Should show filtered results
    await expect(page.locator('[data-testid="hack-card"]')).toHaveCount(/.+/)
  })

  test('Profile management', async ({ page }) => {
    // Sign in as user
    await signIn(page, testUsers.user1.email, testUsers.user1.password)

    // Go to profile settings
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Profile Settings')

    // Update profile name
    await page.fill('input[name="name"]', 'Updated Test User')

    // Update bio
    await page.fill('textarea[name="bio"]', 'This is my updated bio for E2E testing')

    // Save changes
    await page.click('button[text="Save Changes"]')

    // Should show success message
    await expect(page.locator('text=/Profile updated|Changes saved/')).toBeVisible()

    // Verify changes persist
    await page.reload()
    await expect(page.locator('input[name="name"]')).toHaveValue('Updated Test User')
  })
})