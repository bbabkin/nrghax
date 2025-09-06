import { test, expect } from '@playwright/test'

test('admin login and hack creation flow', async ({ page }) => {
  // 1. Navigate to auth page
  await page.goto('http://localhost:3000/auth')
  
  // 2. Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // 3. Login as admin (login tab is default)
  await page.locator('input[name="email"]').fill('test@test.com')
  await page.locator('input[name="password"]').fill('test123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  // 4. Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  console.log('✓ Admin logged in successfully')
  
  // 5. Navigate to admin hacks page
  await page.goto('http://localhost:3000/admin/hacks')
  await expect(page.locator('h1:has-text("Manage Hacks")')).toBeVisible()
  console.log('✓ Admin can access hack management')
  
  // 6. Create a new hack
  await page.click('button:has-text("Create New Hack")')
  await page.waitForURL('**/admin/hacks/new')
  
  await page.fill('input[id="name"]', 'Test Hack from E2E')
  await page.fill('textarea[id="description"]', 'This is an E2E test hack')
  await page.fill('input[id="image_url"]', 'https://via.placeholder.com/300')
  await page.check('input[value="content"]')
  
  // Fill rich text editor
  const editor = page.locator('.ProseMirror')
  await editor.click()
  await editor.type('This is test content from E2E test')
  
  await page.click('button:has-text("Create Hack")')
  
  // 7. Verify hack was created
  await page.waitForURL('**/admin/hacks')
  await expect(page.locator('text=Test Hack from E2E')).toBeVisible()
  console.log('✓ Hack created successfully')
  
  // 8. Navigate to public hacks page
  await page.goto('http://localhost:3000/hacks')
  await expect(page.locator('text=Test Hack from E2E')).toBeVisible()
  console.log('✓ Hack visible on public page')
  
  // 9. Click on the hack to view it
  await page.click('text=Test Hack from E2E')
  await page.waitForURL('**/hacks/**')
  await expect(page.locator('text=This is test content from E2E test')).toBeVisible()
  console.log('✓ Hack content displayed correctly')
  
  // 10. Like the hack
  await page.click('button:has-text("Like")')
  console.log('✓ Hack liked successfully')
  
  // 11. Check completion history
  await page.goto('http://localhost:3000/profile/history')
  await expect(page.locator('text=Test Hack from E2E')).toBeVisible()
  console.log('✓ Hack appears in completion history')
  
  console.log('\n✅ All admin flow tests passed!')
})

test('user authentication flow', async ({ page }) => {
  // Test non-admin access restriction
  await page.goto('http://localhost:3000/admin/hacks')
  await expect(page).toHaveURL(/\/auth/)
  console.log('✓ Non-authenticated users redirected to auth')
  
  // Test protected routes
  await page.goto('http://localhost:3000/dashboard')
  await expect(page).toHaveURL(/\/auth\?redirect=/)
  console.log('✓ Protected routes redirect with return URL')
  
  console.log('\n✅ User authentication tests passed!')
})