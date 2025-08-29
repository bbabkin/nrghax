import { test, expect } from '@playwright/test'

test.use({ 
  baseURL: 'http://localhost:3003',
  ignoreHTTPSErrors: true
})

test('basic flow verification and screenshots', async ({ page }) => {
  console.log('🔍 Testing basic flows...')
  
  try {
    // Test homepage
    await page.goto('/')
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true })
    console.log('✅ Homepage screenshot captured')
    
    // Test login page
    await page.goto('/login')
    await page.screenshot({ path: 'screenshots/login.png', fullPage: true })
    console.log('✅ Login page screenshot captured')
    
    // Test register page
    await page.goto('/register')
    await page.screenshot({ path: 'screenshots/register.png', fullPage: true })
    console.log('✅ Register page screenshot captured')
    
    // Test forgot password page
    await page.goto('/forgot-password')
    await page.screenshot({ path: 'screenshots/forgot-password.png', fullPage: true })
    console.log('✅ Forgot password page screenshot captured')
    
    // Test admin area (if exists)
    try {
      await page.goto('/admin')
      await page.screenshot({ path: 'screenshots/admin.png', fullPage: true })
      console.log('✅ Admin area screenshot captured')
    } catch (error) {
      console.log('ℹ️  Admin area not found or not accessible')
    }
    
    console.log('✅ All screenshots captured successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true })
    throw error
  }
})