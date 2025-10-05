import { test, expect } from '@playwright/test'

test.describe('Admin Hack Management', () => {
  // Login as admin before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    // Fill login form
    await page.getByPlaceholder('name@example.com').fill('admin@test.com')
    await page.getByPlaceholder('Enter your password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(/\/(dashboard|hacks)/, { timeout: 10000 })
  })

  test('admin should access hack creation page', async ({ page }) => {
    await page.goto('/admin/hacks/new')
    await expect(page.getByRole('heading', { name: 'Create New Hack' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Hack/i })).toBeVisible()
  })

  test('admin should enable admin mode on hacks page', async ({ page }) => {
    await page.goto('/hacks')
    // Admin mode button should be visible for admin users
    const adminModeButton = page.getByRole('button', { name: /Admin Mode/i })
    await expect(adminModeButton).toBeVisible()

    // Click to enable admin mode
    await adminModeButton.click()

    // Should show admin mode instructions
    await expect(page.getByText('Admin Mode: Reorder Hacks')).toBeVisible()
    await expect(page.getByRole('button', { name: /Exit Admin Mode/i })).toBeVisible()
  })

  test('admin should create a new hack with content', async ({ page }) => {
    await page.goto('/admin/hacks/new')
    
    // Fill in the form
    await page.getByLabel('Name').fill('Test Learning Hack')
    await page.getByLabel('Description').fill('This is a test hack for learning')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    
    // Select content type
    await page.getByLabel('Internal Content').check()
    
    // Add content using the rich text editor
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.fill('This is the learning content for the hack.')
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Hack' }).click()

    // Should redirect to hacks page
    await page.waitForURL('**/hacks', { timeout: 10000 })

    // Verify the hack was created
    await expect(page.getByText('Test Learning Hack')).toBeVisible()
  })

  test('admin should create a hack with external link', async ({ page }) => {
    await page.goto('/admin/hacks/new')
    
    // Fill in the form
    await page.getByLabel('Name').fill('External Resource Hack')
    await page.getByLabel('Description').fill('Links to external learning resource')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    
    // Select link type
    await page.getByLabel('External Link').check()
    await page.getByLabel('External Link *').fill('https://example.com/learning')
    
    // Submit the form
    await page.getByRole('button', { name: 'Create Hack' }).click()

    // Should redirect to hacks page
    await page.waitForURL('**/hacks', { timeout: 10000 })

    // Verify the hack was created
    await expect(page.getByText('External Resource Hack')).toBeVisible()
  })

  test('admin should edit an existing hack', async ({ page }) => {
    // First create a hack
    await page.goto('/admin/hacks/new')
    await page.getByLabel('Name').fill('Hack to Edit')
    await page.getByLabel('Description').fill('Original description')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    await page.getByLabel('Internal Content').check()

    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.fill('Original content')

    await page.getByRole('button', { name: 'Create Hack' }).click()
    await page.waitForURL('**/hacks', { timeout: 10000 })

    // Get the hack link to find the ID
    const hackLink = page.locator('a').filter({ hasText: 'Hack to Edit' }).first()
    const href = await hackLink.getAttribute('href')
    const hackId = href?.split('/').pop()

    // Navigate to edit page
    await page.goto(`/admin/hacks/${hackId}/edit`)

    // Update the fields
    await page.getByLabel('Name').clear()
    await page.getByLabel('Name').fill('Updated Hack Name')
    await page.getByLabel('Description').clear()
    await page.getByLabel('Description').fill('Updated description')

    await page.getByRole('button', { name: 'Update Hack' }).click()

    // Should redirect back to hacks
    await page.waitForURL('**/hacks', { timeout: 10000 })

    // Verify the update
    await expect(page.getByText('Updated Hack Name')).toBeVisible()
  })

  test('admin should set prerequisites for a hack', async ({ page }) => {
    // Create first hack (prerequisite)
    await page.goto('/admin/hacks/new')
    await page.getByLabel('Name').fill('Basic Concepts')
    await page.getByLabel('Description').fill('Learn the basics first')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    await page.getByLabel('Internal Content').check()
    
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.fill('Basic content')
    
    await page.getByRole('button', { name: 'Create Hack' }).click()
    await page.waitForURL('**/hacks', { timeout: 10000 })
    
    // Create second hack with prerequisite
    await page.goto('/admin/hacks/new')
    await page.getByLabel('Name').fill('Advanced Topics')
    await page.getByLabel('Description').fill('Requires basic knowledge')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    await page.getByLabel('Internal Content').check()
    
    const editor2 = page.locator('.ProseMirror')
    await editor2.click()
    await editor2.fill('Advanced content')
    
    // Select prerequisite
    await page.getByRole('combobox').click()
    await page.getByText('Basic Concepts').click()
    
    await page.getByRole('button', { name: 'Create Hack' }).click()
    await page.waitForURL('**/hacks', { timeout: 10000 })
    
    // Verify both hacks exist
    await expect(page.getByText('Basic Concepts')).toBeVisible()
    await expect(page.getByText('Advanced Topics')).toBeVisible()
  })

  test('admin should delete a hack', async ({ page }) => {
    // Create a hack to delete
    await page.goto('/admin/hacks/new')
    await page.getByLabel('Name').fill('Hack to Delete')
    await page.getByLabel('Description').fill('This will be deleted')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    await page.getByLabel('Internal Content').check()
    
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.fill('Content to delete')
    
    await page.getByRole('button', { name: 'Create Hack' }).click()
    await page.waitForURL('**/hacks', { timeout: 10000 })
    
    // Edit the hack to access delete button
    await page.getByRole('button', { name: 'Edit' }).first().click()
    
    // Delete the hack
    await page.getByRole('button', { name: /Delete Hack/i }).click()
    
    // Should redirect to hacks
    await page.waitForURL('**/hacks', { timeout: 10000 })
    
    // Verify the hack was deleted
    await expect(page.getByText('Hack to Delete')).not.toBeVisible()
  })

  test('non-admin should not access admin pages', async ({ page, context }) => {
    // Logout first
    await page.goto('/signout', { waitUntil: 'networkidle' })

    // Try to access admin page without logging in
    await page.goto('/admin/hacks/new')

    // Should redirect to signin page
    await expect(page).toHaveURL(/\/signin/)

    // Try to access admin edit page
    await page.goto('/admin/hacks/test-id/edit')

    // Should redirect to signin page
    await expect(page).toHaveURL(/\/signin/)

    // Try to access admin page as non-admin user (would need a non-admin test user)
    // This test would require creating a non-admin user in the seed data
  })
})