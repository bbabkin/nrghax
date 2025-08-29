/**
 * Authentication test helpers for Admin User Management
 * Provides utilities for authentication in unit tests, integration tests, and E2E tests
 */

import type { Page } from '@playwright/test'
import type { Session } from 'next-auth'
import type { UserRole } from '@/types/admin'
import { testUsers } from '../fixtures/admin-users-data'

/**
 * Mock session data for different user roles
 */
export const mockSessions = {
  superAdmin: {
    user: {
      id: testUsers.superAdmin.id,
      email: testUsers.superAdmin.email,
      name: testUsers.superAdmin.name,
      image: testUsers.superAdmin.image,
      role: 'super_admin' as UserRole,
      emailVerified: testUsers.superAdmin.emailVerified
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  } as Session,

  admin: {
    user: {
      id: testUsers.admin.id,
      email: testUsers.admin.email,
      name: testUsers.admin.name,
      image: testUsers.admin.image,
      role: 'admin' as UserRole,
      emailVerified: testUsers.admin.emailVerified
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } as Session,

  regularUser: {
    user: {
      id: testUsers.regularUser.id,
      email: testUsers.regularUser.email,
      name: testUsers.regularUser.name,
      image: testUsers.regularUser.image,
      role: 'user' as UserRole,
      emailVerified: testUsers.regularUser.emailVerified
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } as Session,

  deactivatedUser: {
    user: {
      id: testUsers.deactivatedUser.id,
      email: testUsers.deactivatedUser.email,
      name: testUsers.deactivatedUser.name,
      image: testUsers.deactivatedUser.image,
      role: 'admin' as UserRole,
      emailVerified: testUsers.deactivatedUser.emailVerified
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } as Session,

  unverifiedUser: {
    user: {
      id: testUsers.unverifiedUser.id,
      email: testUsers.unverifiedUser.email,
      name: testUsers.unverifiedUser.name,
      image: testUsers.unverifiedUser.image,
      role: 'user' as UserRole,
      emailVerified: null
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } as Session,

  expiredSession: {
    user: {
      id: testUsers.regularUser.id,
      email: testUsers.regularUser.email,
      name: testUsers.regularUser.name,
      image: testUsers.regularUser.image,
      role: 'user' as UserRole,
      emailVerified: testUsers.regularUser.emailVerified
    },
    expires: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
  } as Session
}

/**
 * Helper function to create a mock NextAuth session for any user role
 */
export function mockAuthSession(role: UserRole, overrides: Partial<Session> = {}): Session {
  const baseSession = mockSessions[role === 'super_admin' ? 'superAdmin' : role === 'admin' ? 'admin' : 'regularUser']
  
  return {
    ...baseSession,
    ...overrides,
    user: {
      ...baseSession.user,
      ...(overrides.user || {})
    }
  }
}

/**
 * Helper function to create a custom session with specific user data
 */
export function createMockSession(userData: {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: UserRole
  emailVerified?: Date | null
}, expiresInHours: number = 24): Session {
  return {
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name || null,
      image: userData.image || null,
      role: userData.role,
      emailVerified: userData.emailVerified || null
    },
    expires: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Playwright E2E Authentication Helpers
 */

/**
 * Login as admin user in Playwright tests
 */
export async function loginAsAdmin(page: Page, options: {
  email?: string
  password?: string
  baseURL?: string
  skipIfLoggedIn?: boolean
} = {}): Promise<void> {
  const {
    email = 'admin.user@example.com',
    password = 'AdminPassword123!',
    baseURL = 'https://localhost:3002',
    skipIfLoggedIn = true
  } = options

  // Check if already logged in
  if (skipIfLoggedIn) {
    try {
      await page.goto(`${baseURL}/admin/users`, { timeout: 5000 })
      // If we can access admin page without redirect, we're already logged in
      await page.waitForSelector('[data-testid="admin-users-table"]', { timeout: 2000 })
      console.log('Already logged in as admin, skipping login')
      return
    } catch {
      // Not logged in, continue with login process
    }
  }

  console.log(`Logging in as admin: ${email}`)

  // Navigate to login page
  await page.goto(`${baseURL}/login`)
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
  
  // Fill in credentials
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for successful login - should redirect to dashboard or admin area
  try {
    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
  } catch (error) {
    // If redirect doesn't happen, check for error messages
    const errorMessage = await page.textContent('[data-testid="login-error"]')
    throw new Error(`Login failed: ${errorMessage || 'Unknown error'}`)
  }
  
  console.log('Successfully logged in as admin')
}

/**
 * Login as regular user in Playwright tests
 */
export async function loginAsUser(page: Page, options: {
  email?: string
  password?: string
  baseURL?: string
  skipIfLoggedIn?: boolean
} = {}): Promise<void> {
  const {
    email = 'john.doe@example.com',
    password = 'UserPassword123!',
    baseURL = 'https://localhost:3002',
    skipIfLoggedIn = true
  } = options

  // Check if already logged in
  if (skipIfLoggedIn) {
    try {
      await page.goto(`${baseURL}/dashboard`, { timeout: 5000 })
      // If we can access dashboard without redirect, we're already logged in
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 2000 })
      console.log('Already logged in as user, skipping login')
      return
    } catch {
      // Not logged in, continue with login process
    }
  }

  console.log(`Logging in as user: ${email}`)

  // Navigate to login page
  await page.goto(`${baseURL}/login`)
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
  
  // Fill in credentials
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for successful login - should redirect to dashboard
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  } catch (error) {
    const errorMessage = await page.textContent('[data-testid="login-error"]')
    throw new Error(`Login failed: ${errorMessage || 'Unknown error'}`)
  }
  
  console.log('Successfully logged in as user')
}

/**
 * Login as super admin user in Playwright tests
 */
export async function loginAsSuperAdmin(page: Page, options: {
  email?: string
  password?: string
  baseURL?: string
  skipIfLoggedIn?: boolean
} = {}): Promise<void> {
  const {
    email = 'super.admin@example.com',
    password = 'SuperAdminPassword123!',
    baseURL = 'https://localhost:3002',
    skipIfLoggedIn = true
  } = options

  // Check if already logged in with proper permissions
  if (skipIfLoggedIn) {
    try {
      await page.goto(`${baseURL}/admin/users`, { timeout: 5000 })
      // Check if we have super admin permissions (can see all admin controls)
      await page.waitForSelector('[data-testid="admin-users-table"]', { timeout: 2000 })
      await page.waitForSelector('[data-testid="super-admin-controls"]', { timeout: 2000 })
      console.log('Already logged in as super admin, skipping login')
      return
    } catch {
      // Not logged in or insufficient permissions, continue with login process
    }
  }

  console.log(`Logging in as super admin: ${email}`)

  // Navigate to login page
  await page.goto(`${baseURL}/login`)
  
  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
  
  // Fill in credentials
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Wait for successful login - should redirect to admin area
  try {
    await page.waitForURL(/\/admin/, { timeout: 15000 })
  } catch (error) {
    const errorMessage = await page.textContent('[data-testid="login-error"]')
    throw new Error(`Super admin login failed: ${errorMessage || 'Unknown error'}`)
  }
  
  console.log('Successfully logged in as super admin')
}

/**
 * Login using Google OAuth (for testing OAuth flows)
 */
export async function loginWithGoogle(page: Page, options: {
  baseURL?: string
  mockGoogleAuth?: boolean
} = {}): Promise<void> {
  const {
    baseURL = 'https://localhost:3002',
    mockGoogleAuth = true
  } = options

  console.log('Attempting Google OAuth login')

  // Navigate to login page
  await page.goto(`${baseURL}/login`)
  
  // Wait for Google sign-in button
  await page.waitForSelector('[data-testid="google-signin-button"]', { timeout: 10000 })
  
  if (mockGoogleAuth) {
    // For testing, we might mock the Google OAuth flow
    // This would be configured in the test environment
    console.log('Using mocked Google OAuth flow')
    
    // Click Google sign-in button
    await page.click('[data-testid="google-signin-button"]')
    
    // In a real test, this would go through the actual OAuth flow
    // For mocked flow, we should be redirected directly to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  } else {
    // Real Google OAuth flow - this requires actual Google credentials
    // and is more complex to set up in automated testing
    console.log('Using real Google OAuth flow')
    
    await page.click('[data-testid="google-signin-button"]')
    
    // Wait for Google's authentication page
    await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 })
    
    // This would require additional steps to handle Google's auth flow
    // Implementation depends on your specific testing needs and setup
    throw new Error('Real Google OAuth testing not implemented - use mockGoogleAuth: true for testing')
  }
  
  console.log('Successfully logged in via Google OAuth')
}

/**
 * Logout from the application
 */
export async function logout(page: Page, baseURL: string = 'https://localhost:3002'): Promise<void> {
  console.log('Logging out')
  
  try {
    // Try to find and click logout button in user menu
    await page.click('[data-testid="user-menu-trigger"]')
    await page.waitForSelector('[data-testid="logout-button"]', { timeout: 3000 })
    await page.click('[data-testid="logout-button"]')
    
    // Wait for redirect to login page or home page
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 })
  } catch (error) {
    // If logout button not found, navigate to logout API directly
    console.log('Logout button not found, using API logout')
    await page.goto(`${baseURL}/api/auth/signout`)
    
    // Wait for signout confirmation or redirect
    try {
      await page.waitForSelector('form', { timeout: 5000 })
      await page.click('button[type="submit"]')
    } catch {
      // Already logged out or different logout flow
    }
    
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 })
  }
  
  console.log('Successfully logged out')
}

/**
 * Verify that access is denied (for testing authorization)
 */
export async function expectAccessDenied(page: Page, options: {
  expectedRedirectURL?: string
  expectedErrorMessage?: string
  timeout?: number
} = {}): Promise<void> {
  const {
    expectedRedirectURL = /\/(login|auth\/error)/,
    expectedErrorMessage,
    timeout = 10000
  } = options

  console.log('Verifying access is denied')

  try {
    // Check for redirect to login or error page
    await page.waitForURL(expectedRedirectURL, { timeout })
    console.log('Access denied: redirected to authentication page')
    return
  } catch {
    // If no redirect, check for error message on current page
  }

  if (expectedErrorMessage) {
    try {
      await page.waitForSelector(`text="${expectedErrorMessage}"`, { timeout })
      console.log('Access denied: error message displayed')
      return
    } catch {
      // Continue to check for other access denial indicators
    }
  }

  // Check for common access denial indicators
  const accessDenialSelectors = [
    '[data-testid="access-denied"]',
    '[data-testid="unauthorized"]',
    '[data-testid="permission-denied"]',
    'text="Access Denied"',
    'text="Unauthorized"',
    'text="Permission Denied"',
    'text="403"'
  ]

  let accessDenied = false
  for (const selector of accessDenialSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 })
      accessDenied = true
      break
    } catch {
      continue
    }
  }

  if (!accessDenied) {
    throw new Error('Expected access to be denied, but user appears to have access to the page')
  }

  console.log('Access denied: access denial indicator found on page')
}

/**
 * Wait for authentication state to be loaded
 */
export async function waitForAuthState(page: Page, timeout: number = 10000): Promise<void> {
  console.log('Waiting for authentication state to load')
  
  // Wait for either login form or authenticated content to appear
  try {
    await Promise.race([
      page.waitForSelector('[data-testid="login-form"]', { timeout }),
      page.waitForSelector('[data-testid="user-menu"]', { timeout }),
      page.waitForSelector('[data-testid="dashboard"]', { timeout })
    ])
    console.log('Authentication state loaded')
  } catch (error) {
    throw new Error(`Authentication state did not load within ${timeout}ms`)
  }
}

/**
 * Assert current user role based on UI elements
 */
export async function assertUserRole(page: Page, expectedRole: UserRole): Promise<void> {
  console.log(`Asserting user has role: ${expectedRole}`)
  
  switch (expectedRole) {
    case 'super_admin':
      // Super admins should see admin navigation and super admin specific controls
      await page.waitForSelector('[data-testid="admin-navigation"]', { timeout: 5000 })
      await page.waitForSelector('[data-testid="super-admin-controls"]', { timeout: 5000 })
      break
      
    case 'admin':
      // Admins should see admin navigation but not super admin controls
      await page.waitForSelector('[data-testid="admin-navigation"]', { timeout: 5000 })
      const superAdminControls = await page.locator('[data-testid="super-admin-controls"]').count()
      if (superAdminControls > 0) {
        throw new Error('Admin user should not see super admin controls')
      }
      break
      
    case 'user':
      // Regular users should not see admin navigation
      const adminNavigation = await page.locator('[data-testid="admin-navigation"]').count()
      if (adminNavigation > 0) {
        throw new Error('Regular user should not see admin navigation')
      }
      await page.waitForSelector('[data-testid="user-content"]', { timeout: 5000 })
      break
  }
  
  console.log(`Successfully verified user role: ${expectedRole}`)
}

/**
 * Test credentials for different environments
 */
export const testCredentials = {
  local: {
    superAdmin: {
      email: 'super.admin@localhost.test',
      password: 'TestSuperAdmin123!'
    },
    admin: {
      email: 'admin.user@localhost.test',
      password: 'TestAdmin123!'
    },
    user: {
      email: 'user@localhost.test',
      password: 'TestUser123!'
    }
  },
  development: {
    superAdmin: {
      email: 'dev.superadmin@example.com',
      password: 'DevSuperAdmin123!'
    },
    admin: {
      email: 'dev.admin@example.com',
      password: 'DevAdmin123!'
    },
    user: {
      email: 'dev.user@example.com',
      password: 'DevUser123!'
    }
  },
  staging: {
    superAdmin: {
      email: 'staging.superadmin@example.com',
      password: 'StagingSuperAdmin123!'
    },
    admin: {
      email: 'staging.admin@example.com',
      password: 'StagingAdmin123!'
    },
    user: {
      email: 'staging.user@example.com',
      password: 'StagingUser123!'
    }
  }
}

/**
 * Get test credentials based on environment
 */
export function getTestCredentials(environment: 'local' | 'development' | 'staging' = 'local') {
  return testCredentials[environment]
}