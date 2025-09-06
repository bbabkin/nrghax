/**
 * Integration tests for authentication flows
 * Following best practices from Supabase documentation:
 * - Uses real database calls instead of mocks
 * - Tests run sequentially to avoid conflicts
 * - Each test uses unique identifiers
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Use test environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create clients for testing
const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

describe('Authentication Integration Tests', () => {
  const testRunId = uuidv4()
  const testUsers: Array<{ id: string; email: string }> = []

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      await serviceClient.auth.admin.deleteUser(user.id)
    }
  })

  describe('User Registration', () => {
    it('should allow new users to sign up', async () => {
      const email = `test-${testRunId}-signup@example.com`
      const password = 'TestPassword123!'

      const { data, error } = await anonClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            test_run: testRunId
          }
        }
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.user?.email).toBe(email)

      if (data.user) {
        testUsers.push({ id: data.user.id, email })
      }
    })

    it('should prevent duplicate email registration', async () => {
      const email = `test-${testRunId}-duplicate@example.com`
      const password = 'TestPassword123!'

      // First registration
      const { data: firstUser } = await anonClient.auth.signUp({
        email,
        password
      })

      if (firstUser.user) {
        testUsers.push({ id: firstUser.user.id, email })
      }

      // Attempt duplicate registration
      const { data: secondUser, error } = await anonClient.auth.signUp({
        email,
        password
      })

      // Supabase returns a user but with identities empty for duplicates
      expect(secondUser.user).toBeDefined()
      expect(secondUser.user?.identities?.length).toBe(0)
    })
  })

  describe('User Login', () => {
    it('should allow users to login with correct credentials', async () => {
      const email = `test-${testRunId}-login@example.com`
      const password = 'TestPassword123!'

      // Create user first
      const { data: signupData } = await anonClient.auth.signUp({
        email,
        password
      })

      if (signupData.user) {
        testUsers.push({ id: signupData.user.id, email })
      }

      // Login
      const { data, error } = await anonClient.auth.signInWithPassword({
        email,
        password
      })

      expect(error).toBeNull()
      expect(data.user).toBeDefined()
      expect(data.session).toBeDefined()
      expect(data.user?.email).toBe(email)
    })

    it('should reject login with incorrect password', async () => {
      const email = `test-${testRunId}-wrongpass@example.com`
      const correctPassword = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'

      // Create user
      const { data: signupData } = await anonClient.auth.signUp({
        email,
        password: correctPassword
      })

      if (signupData.user) {
        testUsers.push({ id: signupData.user.id, email })
      }

      // Attempt login with wrong password
      const { data, error } = await anonClient.auth.signInWithPassword({
        email,
        password: wrongPassword
      })

      expect(error).toBeDefined()
      expect(error?.message).toContain('Invalid login credentials')
      expect(data.user).toBeNull()
      expect(data.session).toBeNull()
    })
  })

  describe('Admin User Privileges', () => {
    it('should correctly identify admin users', async () => {
      const email = `test-${testRunId}-admin@example.com`
      
      // Create admin user using service role
      const { data: adminUser, error } = await serviceClient.auth.admin.createUser({
        email,
        password: 'AdminPassword123!',
        email_confirm: true,
        user_metadata: {
          is_admin: true
        }
      })

      expect(error).toBeNull()
      expect(adminUser.user).toBeDefined()
      expect(adminUser.user?.user_metadata?.is_admin).toBe(true)

      if (adminUser.user) {
        testUsers.push({ id: adminUser.user.id, email })
      }
    })
  })

  describe('Session Management', () => {
    it('should maintain session after login', async () => {
      const email = `test-${testRunId}-session@example.com`
      const password = 'TestPassword123!'

      // Create and login user
      const { data: signupData } = await anonClient.auth.signUp({
        email,
        password
      })

      if (signupData.user) {
        testUsers.push({ id: signupData.user.id, email })
      }

      const { data: loginData } = await anonClient.auth.signInWithPassword({
        email,
        password
      })

      expect(loginData.session).toBeDefined()
      
      // Check session is valid
      const { data: { session } } = await anonClient.auth.getSession()
      expect(session).toBeDefined()
      expect(session?.user?.email).toBe(email)
    })

    it('should clear session on logout', async () => {
      const email = `test-${testRunId}-logout@example.com`
      const password = 'TestPassword123!'

      // Create and login user
      const { data: signupData } = await anonClient.auth.signUp({
        email,
        password
      })

      if (signupData.user) {
        testUsers.push({ id: signupData.user.id, email })
      }

      await anonClient.auth.signInWithPassword({
        email,
        password
      })

      // Logout
      const { error } = await anonClient.auth.signOut()
      expect(error).toBeNull()

      // Check session is cleared
      const { data: { session } } = await anonClient.auth.getSession()
      expect(session).toBeNull()
    })
  })
})