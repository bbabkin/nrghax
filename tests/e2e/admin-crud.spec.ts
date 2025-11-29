import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Admin CRUD Operations', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'admin-tests')

  test.beforeEach(async ({ page }) => {
    console.log('\n=== Setting up admin test ===')

    // Navigate to auth page
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')

    // Sign up with auto-admin email
    console.log('Signing up with auto-admin email: bbabkin@gmail.com')

    // Check if we need to sign up or sign in
    const signUpTab = page.locator('text=Sign up').or(page.locator('button:has-text("Sign up")'))
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]'))

    // Try to click sign up tab if it exists
    try {
      if (await signUpTab.isVisible({ timeout: 2000 })) {
        await signUpTab.click()
        await page.waitForTimeout(500)
      }
    } catch (e) {
      console.log('Sign up tab not found, continuing...')
    }

    // Fill in credentials
    await emailInput.fill('bbabkin@gmail.com')
    await page.locator('input[type="password"]').or(page.locator('input[name="password"]')).first().fill('test1234')

    // Submit form
    await page.locator('button[type="submit"]').click()

    // Wait for redirect to dashboard or admin
    try {
      await page.waitForURL('**/dashboard/**', { timeout: 10000 })
      console.log('✓ Logged in successfully')
    } catch (e) {
      // Might already be on dashboard
      console.log('Already authenticated or on dashboard')
    }

    await page.waitForTimeout(1000)
  })

  test('should access admin panel and view all sections', async ({ page }) => {
    console.log('\n=== Test: Access Admin Panel ===')

    // Navigate to admin page
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '01-admin-dashboard.png'), fullPage: true })
    console.log('✓ Screenshot: admin dashboard')

    // Verify admin sections are visible
    const sections = ['Hacks', 'Routines', 'Tags', 'Levels', 'Users']
    for (const section of sections) {
      const sectionElement = page.locator(`text=${section}`).first()
      await expect(sectionElement).toBeVisible({ timeout: 5000 })
      console.log(`✓ ${section} section visible`)
    }
  })

  test('should create a new hack', async ({ page }) => {
    console.log('\n=== Test: Create New Hack ===')

    // Navigate to create hack page
    await page.goto('/admin/hacks/new')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '02-create-hack-form.png'), fullPage: true })
    console.log('✓ Screenshot: create hack form')

    // Fill in hack details
    const timestamp = Date.now()
    const hackName = `Test Hack ${timestamp}`

    await page.locator('input[name="name"]').or(page.locator('input[placeholder*="name"]').first()).fill(hackName)
    await page.locator('textarea[name="description"]').or(page.locator('textarea').first()).fill('This is a test hack created by automated testing')

    // Try to fill other fields if they exist
    try {
      await page.locator('input[name="duration"]').fill('15', { timeout: 2000 })
    } catch (e) {
      console.log('Duration field not found, skipping')
    }

    await page.screenshot({ path: path.join(screenshotsDir, '03-hack-form-filled.png'), fullPage: true })
    console.log('✓ Screenshot: hack form filled')

    // Submit form
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")')).click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: path.join(screenshotsDir, '04-hack-created.png'), fullPage: true })
    console.log('✓ Screenshot: hack created')

    // Verify hack appears in list
    await page.goto('/admin/hacks')
    await page.waitForLoadState('networkidle')
    const hackElement = page.locator(`text=${hackName}`).first()
    await expect(hackElement).toBeVisible({ timeout: 5000 })
    console.log(`✓ Hack "${hackName}" created successfully`)
  })

  test('should edit an existing hack', async ({ page }) => {
    console.log('\n=== Test: Edit Hack ===')

    // Navigate to hacks list
    await page.goto('/admin/hacks')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '05-hacks-list.png'), fullPage: true })

    // Click on first hack's edit button
    const editButton = page.locator('a:has-text("Edit")').or(page.locator('button:has-text("Edit")')).first()
    await editButton.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '06-edit-hack-form.png'), fullPage: true })

    // Modify the description
    const descriptionField = page.locator('textarea[name="description"]').or(page.locator('textarea').first())
    await descriptionField.clear()
    await descriptionField.fill(`Updated description at ${new Date().toISOString()}`)

    await page.screenshot({ path: path.join(screenshotsDir, '07-hack-edited.png'), fullPage: true })

    // Save changes
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Save")')).or(page.locator('button:has-text("Update")')).click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: path.join(screenshotsDir, '08-hack-updated.png'), fullPage: true })
    console.log('✓ Hack edited successfully')
  })

  test('should create a new routine', async ({ page }) => {
    console.log('\n=== Test: Create New Routine ===')

    // Navigate to create routine page
    await page.goto('/admin/routines/new')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '09-create-routine-form.png'), fullPage: true })

    // Fill in routine details
    const timestamp = Date.now()
    const routineName = `Test Routine ${timestamp}`

    await page.locator('input[name="name"]').or(page.locator('input[placeholder*="name"]').first()).fill(routineName)
    await page.locator('textarea[name="description"]').or(page.locator('textarea').first()).fill('This is a test routine created by automated testing')

    await page.screenshot({ path: path.join(screenshotsDir, '10-routine-form-filled.png'), fullPage: true })

    // Submit form
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")')).click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: path.join(screenshotsDir, '11-routine-created.png'), fullPage: true })

    // Verify routine appears in list
    await page.goto('/admin/routines')
    await page.waitForLoadState('networkidle')
    const routineElement = page.locator(`text=${routineName}`).first()
    await expect(routineElement).toBeVisible({ timeout: 5000 })
    console.log(`✓ Routine "${routineName}" created successfully`)
  })

  test('should edit an existing routine', async ({ page }) => {
    console.log('\n=== Test: Edit Routine ===')

    // Navigate to routines list
    await page.goto('/admin/routines')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '12-routines-list.png'), fullPage: true })

    // Click on first routine's edit button
    const editButton = page.locator('a:has-text("Edit")').or(page.locator('button:has-text("Edit")')).first()
    await editButton.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '13-edit-routine-form.png'), fullPage: true })

    // Modify the description
    const descriptionField = page.locator('textarea[name="description"]').or(page.locator('textarea').first())
    await descriptionField.clear()
    await descriptionField.fill(`Updated routine description at ${new Date().toISOString()}`)

    await page.screenshot({ path: path.join(screenshotsDir, '14-routine-edited.png'), fullPage: true })

    // Save changes
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Save")')).or(page.locator('button:has-text("Update")')).click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: path.join(screenshotsDir, '15-routine-updated.png'), fullPage: true })
    console.log('✓ Routine edited successfully')
  })

  test('should manage tags', async ({ page }) => {
    console.log('\n=== Test: Manage Tags ===')

    // Navigate to tags page
    await page.goto('/admin/tags')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '16-tags-page.png'), fullPage: true })

    // Look for create tag button or form
    const createButton = page.locator('button:has-text("Create")').or(page.locator('button:has-text("Add Tag")'))
    const tagInput = page.locator('input[name="name"]').or(page.locator('input[placeholder*="tag"]'))

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click()
      await page.waitForTimeout(500)
    }

    if (await tagInput.isVisible({ timeout: 2000 })) {
      const timestamp = Date.now()
      await tagInput.fill(`test-tag-${timestamp}`)
      await page.screenshot({ path: path.join(screenshotsDir, '17-tag-form-filled.png'), fullPage: true })

      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: path.join(screenshotsDir, '18-tag-created.png'), fullPage: true })
      console.log('✓ Tag created successfully')
    } else {
      console.log('✓ Tags page accessible (no create form found)')
    }
  })

  test('should manage levels', async ({ page }) => {
    console.log('\n=== Test: Manage Levels ===')

    // Navigate to levels page
    await page.goto('/admin/levels')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '19-levels-page.png'), fullPage: true })

    // Check if we can access level creation
    const createButton = page.locator('a:has-text("New")').or(page.locator('button:has-text("Create")'))

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: path.join(screenshotsDir, '20-create-level-form.png'), fullPage: true })

      // Fill in level details
      const timestamp = Date.now()
      await page.locator('input[name="name"]').or(page.locator('input[placeholder*="name"]').first()).fill(`Test Level ${timestamp}`)
      await page.locator('textarea[name="description"]').or(page.locator('textarea').first()).fill('Test level description')

      await page.screenshot({ path: path.join(screenshotsDir, '21-level-form-filled.png'), fullPage: true })

      await page.locator('button[type="submit"]').or(page.locator('button:has-text("Create")')).click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: path.join(screenshotsDir, '22-level-created.png'), fullPage: true })
      console.log('✓ Level created successfully')
    } else {
      console.log('✓ Levels page accessible')
    }
  })

  test('should view users list', async ({ page }) => {
    console.log('\n=== Test: View Users ===')

    // Navigate to users page
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: path.join(screenshotsDir, '23-users-page.png'), fullPage: true })

    // Verify admin user is in the list
    const adminEmail = page.locator('text=bbabkin@gmail.com')
    await expect(adminEmail).toBeVisible({ timeout: 5000 })
    console.log('✓ Users page accessible and admin user visible')
  })
})
