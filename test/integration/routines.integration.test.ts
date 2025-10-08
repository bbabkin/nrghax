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
  createTestRoutine,
  addHackToRoutine,
  startRoutineSession,
  completeRoutineSession
} from '../utils/db-helpers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

describe('Routines Integration Tests', () => {
  let adminClient: SupabaseClient<Database>
  let userClient: SupabaseClient<Database>
  let user: any
  let testHacks: any[] = []
  let testRoutine: any

  beforeAll(async () => {
    // Initialize clients
    adminClient = createTestAdminClient()
    userClient = createTestClient()

    // Create test user
    user = await createTestUser(adminClient, {
      email: generateTestEmail('routine-user'),
      password: 'TestUser123!',
      name: 'Routine Test User',
      isAdmin: false
    })

    // Sign in as user
    await userClient.auth.signInWithPassword({
      email: user.email,
      password: user.password
    })

    // Create test hacks
    for (let i = 1; i <= 3; i++) {
      const hack = await createTestHack(adminClient, {
        name: `Routine Test Hack ${i}`,
        description: `Test hack ${i} for routine testing`,
        time_minutes: 5 * i,
        difficulty: i === 1 ? 'Beginner' : i === 2 ? 'Intermediate' : 'Advanced'
      })
      testHacks.push(hack)
    }
  })

  afterAll(async () => {
    // Cleanup routines
    if (testRoutine?.id) {
      await adminClient.from('routine_hacks').delete().eq('routine_id', testRoutine.id)
      await adminClient.from('routines').delete().eq('id', testRoutine.id)
    }

    // Cleanup hacks
    for (const hack of testHacks) {
      await adminClient.from('hacks').delete().eq('id', hack.id)
    }

    // Cleanup user
    if (user?.id) await cleanupTestUser(adminClient, user.id)
  })

  describe('Routine CRUD Operations', () => {
    it('should create a new routine', async () => {
      testRoutine = await createTestRoutine(userClient, user.id, {
        name: 'Integration Test Routine',
        description: 'A routine for integration testing',
        is_public: true
      })

      expect(testRoutine).toBeDefined()
      expect(testRoutine.id).toBeTruthy()
      expect(testRoutine.name).toBe('Integration Test Routine')
      expect(testRoutine.created_by).toBe(user.id)
    })

    it('should add hacks to routine', async () => {
      // Add all test hacks to routine
      for (let i = 0; i < testHacks.length; i++) {
        await addHackToRoutine(userClient, testRoutine.id, testHacks[i].id, i)
      }

      // Verify hacks were added
      const { data, error } = await userClient
        .from('routine_hacks')
        .select('*, hack:hacks(*)')
        .eq('routine_id', testRoutine.id)
        .order('position')

      expect(error).toBeNull()
      expect(data?.length).toBe(testHacks.length)
      expect(data?.[0].position).toBe(0)
      expect(data?.[0].hack?.name).toBe('Routine Test Hack 1')
    })

    it('should update routine details', async () => {
      const updatedData = {
        description: 'Updated routine description',
        is_public: false
      }

      const { data, error } = await userClient
        .from('routines')
        .update(updatedData)
        .eq('id', testRoutine.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.description).toBe(updatedData.description)
      expect(data?.is_public).toBe(false)
    })

    it('should reorder hacks in routine', async () => {
      // Get current hacks
      const { data: currentHacks } = await userClient
        .from('routine_hacks')
        .select('*')
        .eq('routine_id', testRoutine.id)
        .order('position')

      if (!currentHacks || currentHacks.length < 2) {
        throw new Error('Not enough hacks to test reordering')
      }

      // Swap first two hacks
      await userClient
        .from('routine_hacks')
        .update({ position: 1 })
        .eq('routine_id', testRoutine.id)
        .eq('hack_id', currentHacks[0].hack_id)

      await userClient
        .from('routine_hacks')
        .update({ position: 0 })
        .eq('routine_id', testRoutine.id)
        .eq('hack_id', currentHacks[1].hack_id)

      // Verify new order
      const { data: reorderedHacks } = await userClient
        .from('routine_hacks')
        .select('*')
        .eq('routine_id', testRoutine.id)
        .order('position')

      expect(reorderedHacks?.[0].hack_id).toBe(currentHacks[1].hack_id)
      expect(reorderedHacks?.[1].hack_id).toBe(currentHacks[0].hack_id)
    })

    it('should remove hack from routine', async () => {
      // Remove the last hack
      const hackToRemove = testHacks[testHacks.length - 1]

      const { error } = await userClient
        .from('routine_hacks')
        .delete()
        .eq('routine_id', testRoutine.id)
        .eq('hack_id', hackToRemove.id)

      expect(error).toBeNull()

      // Verify hack was removed
      const { data } = await userClient
        .from('routine_hacks')
        .select('*')
        .eq('routine_id', testRoutine.id)

      expect(data?.length).toBe(testHacks.length - 1)
      expect(data?.some(h => h.hack_id === hackToRemove.id)).toBe(false)
    })
  })

  describe('Routine Sessions', () => {
    let session: any

    it('should start a routine session', async () => {
      session = await startRoutineSession(userClient, testRoutine.id, user.id)

      expect(session).toBeDefined()
      expect(session.id).toBeTruthy()
      expect(session.routine_id).toBe(testRoutine.id)
      expect(session.user_id).toBe(user.id)
      expect(session.started_at).toBeTruthy()
      expect(session.completed_at).toBeNull()
    })

    it('should track session progress', async () => {
      // Complete some hacks in the session
      const completedHacks = testHacks.slice(0, 2).map(h => h.id)

      await completeRoutineSession(userClient, session.id, completedHacks)

      // Verify session was updated
      const { data, error } = await userClient
        .from('routine_sessions')
        .select('*')
        .eq('id', session.id)
        .single()

      expect(error).toBeNull()
      expect(data?.completed_at).toBeTruthy()
      expect(data?.hacks_completed).toBe(2)
      expect(data?.duration_minutes).toBeGreaterThan(0)
    })

    it('should list user routine sessions', async () => {
      const { data, error } = await userClient
        .from('routine_sessions')
        .select(`
          *,
          routine:routines(name)
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      expect(data?.length).toBeGreaterThan(0)
      expect(data?.[0].routine?.name).toBeTruthy()
    })
  })

  describe('Routine Visibility', () => {
    let privateRoutine: any
    let publicRoutine: any
    let otherUser: any

    beforeEach(async () => {
      // Create another user
      otherUser = await createTestUser(adminClient, {
        email: generateTestEmail('other'),
        password: 'OtherUser123!',
        name: 'Other User',
        isAdmin: false
      })

      // Create public and private routines
      publicRoutine = await createTestRoutine(userClient, user.id, {
        name: 'Public Test Routine',
        is_public: true
      })

      privateRoutine = await createTestRoutine(userClient, user.id, {
        name: 'Private Test Routine',
        is_public: false
      })
    })

    afterEach(async () => {
      // Cleanup
      if (publicRoutine?.id) {
        await adminClient.from('routines').delete().eq('id', publicRoutine.id)
      }
      if (privateRoutine?.id) {
        await adminClient.from('routines').delete().eq('id', privateRoutine.id)
      }
      if (otherUser?.id) {
        await cleanupTestUser(adminClient, otherUser.id)
      }
    })

    it('should show public routines to all users', async () => {
      // Create client for other user
      const otherClient = createTestClient()
      await otherClient.auth.signInWithPassword({
        email: otherUser.email,
        password: 'OtherUser123!'
      })

      // Try to fetch public routine
      const { data, error } = await otherClient
        .from('routines')
        .select('*')
        .eq('id', publicRoutine.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(publicRoutine.id)
    })

    it('should hide private routines from other users', async () => {
      // Create client for other user
      const otherClient = createTestClient()
      await otherClient.auth.signInWithPassword({
        email: otherUser.email,
        password: 'OtherUser123!'
      })

      // Try to fetch private routine
      const { data, error } = await otherClient
        .from('routines')
        .select('*')
        .eq('id', privateRoutine.id)
        .single()

      // Should not be able to see the private routine
      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('should allow owner to see their private routines', async () => {
      const { data, error } = await userClient
        .from('routines')
        .select('*')
        .eq('id', privateRoutine.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(privateRoutine.id)
    })
  })

  describe('User Routines', () => {
    it('should save routine to user library', async () => {
      const { error } = await userClient
        .from('user_routines')
        .insert({
          user_id: user.id,
          routine_id: testRoutine.id
        })

      expect(error).toBeNull()

      // Verify routine was saved
      const { data } = await userClient
        .from('user_routines')
        .select(`
          *,
          routine:routines(name)
        `)
        .eq('user_id', user.id)

      expect(data?.length).toBeGreaterThan(0)
      expect(data?.some(ur => ur.routine_id === testRoutine.id)).toBe(true)
    })

    it('should list user saved routines', async () => {
      const { data, error } = await userClient
        .from('user_routines')
        .select(`
          *,
          routine:routines(
            *,
            routine_hacks(count)
          )
        `)
        .eq('user_id', user.id)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})