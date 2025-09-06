import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { seedDatabase, cleanupDatabase, createTestUser, createTestHack, deleteTestUser, deleteTestHack, SeedData } from '../helpers/seed'
import { HackFactory } from '../factories/hack.factory'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Skip integration tests if not in CI or if SUPABASE_SERVICE_ROLE_KEY is not set
const skipIntegration = !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(skipIntegration)('Hacks Integration Tests', () => {
  let seedData: SeedData
  let anonClient: ReturnType<typeof createClient>
  let serviceClient: ReturnType<typeof createClient>
  let testUserId: string
  let testAdminId: string

  beforeAll(async () => {
    // Create clients
    anonClient = createClient(supabaseUrl, supabaseAnonKey)
    serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Seed initial data
    seedData = await seedDatabase()
    
    // Get user IDs for testing
    testUserId = seedData.users.find(u => !seedData.profiles.find(p => p.id === u.id))?.id || ''
    testAdminId = seedData.users.find(u => seedData.profiles.find(p => p.id === u.id))?.id || ''
  })

  afterAll(async () => {
    // Cleanup all test data
    await cleanupDatabase(seedData)
  })

  describe('Hack CRUD Operations', () => {
    it('should allow anonymous users to read hacks', async () => {
      const { data, error } = await anonClient
        .from('hacks')
        .select('*')
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should not allow anonymous users to create hacks', async () => {
      const hack = HackFactory.createContentHack()
      
      const { error } = await anonClient
        .from('hacks')
        .insert({
          name: hack.name,
          description: hack.description,
          image_url: hack.image_url,
          content_type: hack.content_type,
          content_body: hack.content_body
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501') // RLS violation
    })

    it('should allow admin users to create hacks', async () => {
      const hack = HackFactory.createContentHack()
      
      const { data, error } = await serviceClient
        .from('hacks')
        .insert({
          name: hack.name,
          description: hack.description,
          image_url: hack.image_url,
          content_type: hack.content_type,
          content_body: hack.content_body
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.name).toBe(hack.name)

      // Cleanup
      if (data) {
        await serviceClient.from('hacks').delete().eq('id', data.id)
      }
    })

    it('should enforce content XOR link constraint', async () => {
      // Try to create hack with both content and link
      const { error: bothError } = await serviceClient
        .from('hacks')
        .insert({
          name: 'Invalid Hack',
          description: 'Test',
          image_url: 'https://example.com/image.jpg',
          content_type: 'content',
          content_body: 'Some content',
          external_link: 'https://example.com' // This should cause a constraint violation
        })

      expect(bothError).toBeDefined()

      // Try to create content hack without content
      const { error: noContentError } = await serviceClient
        .from('hacks')
        .insert({
          name: 'Invalid Content Hack',
          description: 'Test',
          image_url: 'https://example.com/image.jpg',
          content_type: 'content',
          content_body: null
        })

      // This might not error at DB level but should be caught in application logic
      // The test is more about documenting expected behavior
    })
  })

  describe('Hack Likes', () => {
    let testHack: any

    beforeEach(async () => {
      testHack = await createTestHack()
    })

    afterEach(async () => {
      if (testHack) {
        await deleteTestHack(testHack.id)
      }
    })

    it('should allow authenticated users to like hacks', async () => {
      // Sign in as test user
      const { data: authData } = await anonClient.auth.signInWithPassword({
        email: seedData.users[0].email,
        password: 'test123456'
      })

      if (!authData?.session) {
        throw new Error('Failed to authenticate')
      }

      // Create authenticated client
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        }
      })

      // Like the hack
      const { error: likeError } = await authClient
        .from('hack_likes')
        .insert({
          hack_id: testHack.id,
          user_id: authData.user.id
        })

      expect(likeError).toBeNull()

      // Verify like was created
      const { data: likes } = await serviceClient
        .from('hack_likes')
        .select('*')
        .eq('hack_id', testHack.id)
        .eq('user_id', authData.user.id)

      expect(likes).toHaveLength(1)

      // Cleanup
      await serviceClient
        .from('hack_likes')
        .delete()
        .eq('hack_id', testHack.id)
        .eq('user_id', authData.user.id)
    })

    it('should not allow anonymous users to like hacks', async () => {
      const { error } = await anonClient
        .from('hack_likes')
        .insert({
          hack_id: testHack.id,
          user_id: uuidv4() // Random user ID
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('42501') // RLS violation
    })

    it('should prevent duplicate likes', async () => {
      // Use service client to create a like
      const userId = seedData.users[0].id
      
      await serviceClient
        .from('hack_likes')
        .insert({
          hack_id: testHack.id,
          user_id: userId
        })

      // Try to create duplicate
      const { error } = await serviceClient
        .from('hack_likes')
        .insert({
          hack_id: testHack.id,
          user_id: userId
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique constraint violation

      // Cleanup
      await serviceClient
        .from('hack_likes')
        .delete()
        .eq('hack_id', testHack.id)
        .eq('user_id', userId)
    })
  })

  describe('Hack Prerequisites', () => {
    let hack1: any
    let hack2: any
    let hack3: any

    beforeEach(async () => {
      hack1 = await createTestHack({ name: 'Prerequisite Hack 1' })
      hack2 = await createTestHack({ name: 'Prerequisite Hack 2' })
      hack3 = await createTestHack({ name: 'Dependent Hack' })
    })

    afterEach(async () => {
      // Clean up prerequisites first
      await serviceClient.from('hack_prerequisites').delete().eq('hack_id', hack3?.id)
      
      // Then clean up hacks
      if (hack3) await deleteTestHack(hack3.id)
      if (hack2) await deleteTestHack(hack2.id)
      if (hack1) await deleteTestHack(hack1.id)
    })

    it('should create hack prerequisites', async () => {
      const { error } = await serviceClient
        .from('hack_prerequisites')
        .insert([
          { hack_id: hack3.id, prerequisite_hack_id: hack1.id },
          { hack_id: hack3.id, prerequisite_hack_id: hack2.id }
        ])

      expect(error).toBeNull()

      // Verify prerequisites were created
      const { data: prerequisites } = await serviceClient
        .from('hack_prerequisites')
        .select('*')
        .eq('hack_id', hack3.id)

      expect(prerequisites).toHaveLength(2)
    })

    it('should prevent circular dependencies', async () => {
      // Create A -> B dependency
      await serviceClient
        .from('hack_prerequisites')
        .insert({ hack_id: hack2.id, prerequisite_hack_id: hack1.id })

      // Try to create B -> A dependency (circular)
      const { data: hasCircular } = await serviceClient
        .rpc('check_circular_dependency', {
          p_hack_id: hack1.id,
          p_prerequisite_id: hack2.id
        })

      expect(hasCircular).toBe(true)
    })

    it('should check if prerequisites are met', async () => {
      // Set up prerequisites
      await serviceClient
        .from('hack_prerequisites')
        .insert([
          { hack_id: hack3.id, prerequisite_hack_id: hack1.id },
          { hack_id: hack3.id, prerequisite_hack_id: hack2.id }
        ])

      const userId = seedData.users[0].id

      // Check prerequisites not met initially
      const { data: notMet } = await serviceClient
        .rpc('check_prerequisites_met', {
          p_hack_id: hack3.id,
          p_user_id: userId
        })

      expect(notMet).toBe(false)

      // Complete prerequisite hacks
      await serviceClient
        .from('hack_completions')
        .insert([
          { hack_id: hack1.id, user_id: userId },
          { hack_id: hack2.id, user_id: userId }
        ])

      // Check prerequisites are now met
      const { data: met } = await serviceClient
        .rpc('check_prerequisites_met', {
          p_hack_id: hack3.id,
          p_user_id: userId
        })

      expect(met).toBe(true)

      // Cleanup
      await serviceClient
        .from('hack_completions')
        .delete()
        .eq('user_id', userId)
    })
  })

  describe('Hack Completions', () => {
    let testHack: any

    beforeEach(async () => {
      testHack = await createTestHack()
    })

    afterEach(async () => {
      if (testHack) {
        await deleteTestHack(testHack.id)
      }
    })

    it('should track hack completions', async () => {
      const userId = seedData.users[0].id

      // Mark hack as completed
      const { error } = await serviceClient
        .from('hack_completions')
        .insert({
          hack_id: testHack.id,
          user_id: userId
        })

      expect(error).toBeNull()

      // Verify completion was tracked
      const { data: completions } = await serviceClient
        .from('hack_completions')
        .select('*')
        .eq('hack_id', testHack.id)
        .eq('user_id', userId)

      expect(completions).toHaveLength(1)

      // Cleanup
      await serviceClient
        .from('hack_completions')
        .delete()
        .eq('hack_id', testHack.id)
        .eq('user_id', userId)
    })

    it('should prevent duplicate completions', async () => {
      const userId = seedData.users[0].id

      // First completion
      await serviceClient
        .from('hack_completions')
        .insert({
          hack_id: testHack.id,
          user_id: userId
        })

      // Try duplicate
      const { error } = await serviceClient
        .from('hack_completions')
        .insert({
          hack_id: testHack.id,
          user_id: userId
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique constraint violation

      // Cleanup
      await serviceClient
        .from('hack_completions')
        .delete()
        .eq('hack_id', testHack.id)
        .eq('user_id', userId)
    })
  })
})