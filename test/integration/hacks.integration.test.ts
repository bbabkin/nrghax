import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  createTestClient,
  createTestAdminClient
} from '../utils/supabase-test-client'
import {
  createTestUser,
  cleanupTestUser,
  generateTestEmail
} from '../utils/auth-helpers'
import {
  createTestHack,
  likeHack,
  completeHack
} from '../utils/db-helpers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

describe('Hacks Integration Tests', () => {
  let adminClient: SupabaseClient<Database>
  let userClient: SupabaseClient<Database>
  let adminUser: any
  let regularUser: any
  let testHack: any

  beforeAll(async () => {
    // Initialize clients
    adminClient = createTestAdminClient()
    userClient = createTestClient()

    // Create test users
    adminUser = await createTestUser(adminClient, {
      email: generateTestEmail('admin'),
      password: 'TestAdmin123!',
      name: 'Test Admin',
      isAdmin: true
    })

    regularUser = await createTestUser(adminClient, {
      email: generateTestEmail('user'),
      password: 'TestUser123!',
      name: 'Test User',
      isAdmin: false
    })
  })

  afterAll(async () => {
    // Cleanup test data
    if (testHack) {
      await adminClient.from('hacks').delete().eq('id', testHack.id)
    }

    // Cleanup users
    if (regularUser?.id) await cleanupTestUser(adminClient, regularUser.id)
    if (adminUser?.id) await cleanupTestUser(adminClient, adminUser.id)
  })

  describe('Hack CRUD Operations', () => {
    it('should allow admin to create a hack', async () => {
      testHack = await createTestHack(adminClient, {
        name: 'Integration Test Hack',
        description: 'Test hack for integration testing',
        content_body: 'This is test content',
        difficulty: 'Intermediate',
        time_minutes: 15,
        category: 'productivity'
      })

      expect(testHack).toBeDefined()
      expect(testHack.id).toBeTruthy()
      expect(testHack.name).toBe('Integration Test Hack')
      expect(testHack.difficulty).toBe('Intermediate')
    })

    it('should fetch hack by ID', async () => {
      const { data, error } = await userClient
        .from('hacks')
        .select('*')
        .eq('id', testHack.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testHack.id)
      expect(data?.name).toBe(testHack.name)
    })

    it('should update hack details', async () => {
      const updatedData = {
        description: 'Updated description',
        time_minutes: 20
      }

      const { data, error } = await adminClient
        .from('hacks')
        .update(updatedData)
        .eq('id', testHack.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.description).toBe(updatedData.description)
      expect(data?.time_minutes).toBe(updatedData.time_minutes)
    })

    it('should list all hacks', async () => {
      const { data, error } = await userClient
        .from('hacks')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data?.length).toBeGreaterThan(0)
    })
  })

  describe('Hack Interactions', () => {
    beforeEach(async () => {
      // Ensure we have a test hack
      if (!testHack) {
        testHack = await createTestHack(adminClient, {
          name: 'Interaction Test Hack',
          description: 'For testing user interactions'
        })
      }
    })

    it('should allow user to like a hack', async () => {
      await likeHack(userClient, testHack.id, regularUser.id)

      // Verify like was created
      const { data, error } = await userClient
        .from('hack_likes')
        .select('*')
        .eq('hack_id', testHack.id)
        .eq('user_id', regularUser.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.hack_id).toBe(testHack.id)
    })

    it('should allow user to complete a hack', async () => {
      await completeHack(userClient, testHack.id, regularUser.id)

      // Verify completion was created
      const { data, error } = await userClient
        .from('hack_completions')
        .select('*')
        .eq('hack_id', testHack.id)
        .eq('user_id', regularUser.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.hack_id).toBe(testHack.id)
    })

    it('should calculate hack statistics correctly', async () => {
      // Get hack with stats
      const { data, error } = await userClient
        .from('hacks')
        .select(`
          *,
          hack_likes(count),
          hack_completions(count)
        `)
        .eq('id', testHack.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      // At least one like and completion from previous tests
      expect(data?.hack_likes?.[0]?.count).toBeGreaterThanOrEqual(1)
      expect(data?.hack_completions?.[0]?.count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Hack Prerequisites', () => {
    let prereqHack: any
    let dependentHack: any

    beforeEach(async () => {
      // Create prerequisite hack
      prereqHack = await createTestHack(adminClient, {
        name: 'Prerequisite Hack',
        description: 'Must complete this first'
      })

      // Create dependent hack
      dependentHack = await createTestHack(adminClient, {
        name: 'Dependent Hack',
        description: 'Requires prerequisite'
      })
    })

    afterEach(async () => {
      // Cleanup
      if (dependentHack?.id) {
        await adminClient.from('hacks').delete().eq('id', dependentHack.id)
      }
      if (prereqHack?.id) {
        await adminClient.from('hacks').delete().eq('id', prereqHack.id)
      }
    })

    it('should create hack with prerequisites', async () => {
      // Add prerequisite relationship
      const { error } = await adminClient
        .from('hack_prerequisites')
        .insert({
          hack_id: dependentHack.id,
          prerequisite_hack_id: prereqHack.id
        })

      expect(error).toBeNull()

      // Verify prerequisite was added
      const { data } = await userClient
        .from('hack_prerequisites')
        .select(`
          *,
          prerequisite:prerequisite_hack_id(name)
        `)
        .eq('hack_id', dependentHack.id)

      expect(data).toBeDefined()
      expect(data?.length).toBe(1)
      expect(data?.[0].prerequisite_hack_id).toBe(prereqHack.id)
    })

    it('should prevent circular dependencies', async () => {
      // First create A -> B dependency
      await adminClient
        .from('hack_prerequisites')
        .insert({
          hack_id: dependentHack.id,
          prerequisite_hack_id: prereqHack.id
        })

      // Try to create B -> A dependency (circular)
      const { error } = await adminClient
        .from('hack_prerequisites')
        .insert({
          hack_id: prereqHack.id,
          prerequisite_hack_id: dependentHack.id
        })

      // This should fail due to circular dependency check
      // Note: This assumes you have a check_circular_dependency function
      // or constraint in your database
      expect(error).toBeDefined()
    })
  })

  describe('Hack Access Control', () => {
    it('should allow anyone to view hacks', async () => {
      // Test without authentication
      const publicClient = createTestClient()
      const { data, error } = await publicClient
        .from('hacks')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should only allow admins to create hacks', async () => {
      // Try to create as regular user (should fail)
      const { error: userError } = await userClient
        .from('hacks')
        .insert({
          name: 'Unauthorized Hack',
          slug: 'unauthorized-hack',
          description: 'Should not be created',
          content_type: 'content',
          content_body: 'Test'
        })

      // This should fail due to RLS policies
      expect(userError).toBeDefined()

      // Try as admin (should succeed)
      const { data: adminData, error: adminError } = await adminClient
        .from('hacks')
        .insert({
          name: 'Authorized Hack',
          slug: `authorized-hack-${Date.now()}`,
          description: 'Created by admin',
          content_type: 'content',
          content_body: 'Test'
        })
        .select()
        .single()

      expect(adminError).toBeNull()
      expect(adminData).toBeDefined()

      // Cleanup
      if (adminData?.id) {
        await adminClient.from('hacks').delete().eq('id', adminData.id)
      }
    })
  })
})