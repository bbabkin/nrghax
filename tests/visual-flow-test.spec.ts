import { test, expect, Page } from '@playwright/test'

const APP_URL = 'http://localhost:3003'

test.use({ baseURL: 'http://localhost:3003' })

test.describe('Visual Flow Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies()
    await page.context().clearPermissions()
  })

  test('complete authentication flows visual verification', async ({ page }) => {
    // Test 1: Homepage and navigation
    console.log('📸 Testing homepage and navigation...')
    await page.goto(APP_URL)
    await page.screenshot({ path: 'screenshots/01-homepage.png' })
    
    // Test 2: Login page
    console.log('📸 Testing login page...')
    await page.click('text=Sign In')
    await page.waitForURL('**/login')
    await page.screenshot({ path: 'screenshots/02-login-page.png' })
    
    // Test 3: Registration page
    console.log('📸 Testing registration page...')
    await page.click('text=Create an account')
    await page.waitForURL('**/register')
    await page.screenshot({ path: 'screenshots/03-register-page.png' })
    
    // Test 4: Registration form interaction
    console.log('📸 Testing registration form...')
    await page.fill('#name', 'Test User')
    await page.fill('#email', 'test@example.com') 
    await page.fill('#password', 'TestPassword123!')
    await page.screenshot({ path: 'screenshots/04-register-filled.png' })
    
    // Test 5: Password strength indicator
    console.log('📸 Testing password strength...')
    await page.fill('#password', 'weak')
    await page.screenshot({ path: 'screenshots/05-password-weak.png' })
    await page.fill('#password', 'StrongPassword123!')
    await page.screenshot({ path: 'screenshots/06-password-strong.png' })
    
    // Test 6: Go back to login
    console.log('📸 Testing back to login...')
    await page.click('text=Already have an account?')
    await page.waitForURL('**/login')
    await page.screenshot({ path: 'screenshots/07-back-to-login.png' })
    
    // Test 7: Login form interaction
    console.log('📸 Testing login form...')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'TestPassword123!')
    await page.screenshot({ path: 'screenshots/08-login-filled.png' })
    
    // Test 8: Password reset flow
    console.log('📸 Testing password reset...')
    await page.click('text=Forgot your password?')
    await page.waitForURL('**/forgot-password')
    await page.screenshot({ path: 'screenshots/09-forgot-password.png' })
    
    await page.fill('#email', 'test@example.com')
    await page.screenshot({ path: 'screenshots/10-forgot-password-filled.png' })
    
    // Test 9: OAuth buttons (visual check only)
    console.log('📸 Testing OAuth UI...')
    await page.goto(`${APP_URL}/login`)
    await page.screenshot({ path: 'screenshots/11-oauth-buttons.png' })
    
    // Test 10: Mobile responsiveness
    console.log('📸 Testing mobile view...')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${APP_URL}/login`)
    await page.screenshot({ path: 'screenshots/12-mobile-login.png' })
    
    await page.goto(`${APP_URL}/register`)
    await page.screenshot({ path: 'screenshots/13-mobile-register.png' })
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('admin interface visual verification', async ({ page }) => {
    console.log('📸 Testing admin interface...')
    
    // Test admin areas (even if not fully functional, we want to see the UI)
    try {
      await page.goto(`${APP_URL}/admin`)
      await page.screenshot({ path: 'screenshots/14-admin-area.png' })
    } catch (error) {
      console.log('Admin area not accessible or doesn\'t exist yet')
      await page.screenshot({ path: 'screenshots/14-admin-error.png' })
    }
    
    // Test any admin components that might exist
    await page.goto(APP_URL)
    
    // Look for admin-related UI elements
    const adminElements = await page.$$('[data-testid*="admin"], [class*="admin"], text=Admin')
    if (adminElements.length > 0) {
      await page.screenshot({ path: 'screenshots/15-admin-ui-elements.png' })
    }
  })

  test('error states and edge cases', async ({ page }) => {
    console.log('📸 Testing error states...')
    
    // Test 404 page
    await page.goto(`${APP_URL}/nonexistent-page`)
    await page.screenshot({ path: 'screenshots/16-404-page.png' })
    
    // Test validation errors
    await page.goto(`${APP_URL}/login`)
    await page.click('button[type="submit"]')
    await page.screenshot({ path: 'screenshots/17-login-validation-errors.png' })
    
    await page.goto(`${APP_URL}/register`)
    await page.click('button[type="submit"]')
    await page.screenshot({ path: 'screenshots/18-register-validation-errors.png' })
    
    // Test invalid email format
    await page.fill('#email', 'invalid-email')
    await page.blur('#email')
    await page.screenshot({ path: 'screenshots/19-invalid-email.png' })
  })

  test('navigation and routing', async ({ page }) => {
    console.log('📸 Testing navigation and routing...')
    
    await page.goto(APP_URL)
    
    // Test navigation links
    const navLinks = ['Sign In', 'Features', 'About']
    for (let i = 0; i < navLinks.length; i++) {
      try {
        await page.click(`text=${navLinks[i]}`)
        await page.screenshot({ path: `screenshots/20-nav-${navLinks[i].toLowerCase().replace(' ', '-')}.png` })
      } catch (error) {
        console.log(`Navigation link "${navLinks[i]}" not found or not clickable`)
      }
    }
  })
})