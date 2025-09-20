import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHack, updateHack, deleteHack, toggleLike, markHackVisited, HackFormData } from './actions'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  default: {
    userHack: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}))

describe('Hack Server Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      rpc: vi.fn(() => mockSupabase),
      auth: {
        getUser: vi.fn()
      }
    }

    // Set up the mock to return our mockSupabase
    const { createClient } = await import('@/lib/supabase/server')
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('createHack', () => {
    const validFormData: HackFormData = {
      name: 'Test Hack',
      description: 'Test Description',
      image_url: 'https://example.com/image.jpg',
      content_type: 'content',
      content_body: 'Test content',
      prerequisite_ids: []
    }

    it('should create a hack successfully for admin user', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-123' } },
        error: null
      })
      
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      // Mock hack creation
      mockSupabase.select = vi.fn(() => mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-hack-id', ...validFormData },
        error: null
      })

      await createHack(validFormData)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        name: validFormData.name,
        description: validFormData.description,
        image_url: validFormData.image_url,
        image_path: null,
        content_type: validFormData.content_type,
        content_body: validFormData.content_body,
        external_link: undefined
      })
      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks')
      expect(redirect).toHaveBeenCalledWith('/admin/hacks')
    })

    it('should throw error for non-admin user', async () => {
      // Mock non-admin user
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      })

      await expect(createHack(validFormData)).rejects.toThrow('Unauthorized: Admin access required')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('should validate content is required for content type', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      const invalidData = { ...validFormData, content_body: null }
      await expect(createHack(invalidData)).rejects.toThrow('Content is required for content type')
    })

    it('should validate link is required for link type', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      const invalidData: HackFormData = {
        ...validFormData,
        content_type: 'link',
        content_body: null,
        external_link: null
      }
      await expect(createHack(invalidData)).rejects.toThrow('External link is required for link type')
    })

    it('should handle prerequisites correctly', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      // Mock hack creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-hack-id' },
        error: null
      })

      // Mock circular dependency check
      mockSupabase.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      // Mock prerequisites insertion
      mockSupabase.insert.mockImplementation(() => ({
        data: null,
        error: null
      }))

      const dataWithPrereqs = {
        ...validFormData,
        prerequisite_ids: ['prereq-1', 'prereq-2']
      }

      await createHack(dataWithPrereqs)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_circular_dependency', {
        p_hack_id: 'new-hack-id',
        p_prerequisite_id: 'prereq-1'
      })
      expect(mockSupabase.rpc).toHaveBeenCalledWith('check_circular_dependency', {
        p_hack_id: 'new-hack-id',
        p_prerequisite_id: 'prereq-2'
      })
    })

    it('should prevent circular dependencies', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      // Mock hack creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'new-hack-id' },
        error: null
      })

      // Mock circular dependency detected
      mockSupabase.rpc.mockResolvedValue({
        data: true, // Circular dependency exists
        error: null
      })

      // Mock delete
      mockSupabase.eq.mockReturnValue({
        data: null,
        error: null
      })

      const dataWithPrereqs = {
        ...validFormData,
        prerequisite_ids: ['prereq-1']
      }

      await expect(createHack(dataWithPrereqs)).rejects.toThrow('Cannot add prerequisite: would create circular dependency')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })
  })

  describe('updateHack', () => {
    const hackId = 'test-hack-id'
    const updateData: HackFormData = {
      name: 'Updated Hack',
      description: 'Updated Description',
      image_url: 'https://example.com/updated.jpg',
      content_type: 'content',
      content_body: 'Updated content',
      prerequisite_ids: []
    }

    it('should update a hack successfully for admin user', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      // Mock hack update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: hackId, ...updateData },
        error: null
      })

      // Mock prerequisites operations
      mockSupabase.eq.mockReturnValue({
        data: null,
        error: null
      })

      await updateHack(hackId, updateData)

      expect(mockSupabase.update).toHaveBeenCalledWith({
        name: updateData.name,
        description: updateData.description,
        image_url: updateData.image_url,
        image_path: null,
        content_type: updateData.content_type,
        content_body: updateData.content_body,
        external_link: undefined
      })
      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks')
      expect(revalidatePath).toHaveBeenCalledWith(`/admin/hacks/${hackId}/edit`)
      expect(redirect).toHaveBeenCalledWith('/admin/hacks')
    })

    it('should throw error for non-admin user', async () => {
      // Mock non-admin user
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      })

      await expect(updateHack(hackId, updateData)).rejects.toThrow('Unauthorized: Admin access required')
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteHack', () => {
    const hackId = 'test-hack-id'

    it('should delete a hack successfully for admin user', async () => {
      // Mock admin check
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: true },
        error: null
      })

      // Mock hack deletion
      mockSupabase.eq.mockReturnValue({
        data: null,
        error: null
      })

      await deleteHack(hackId)

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', hackId)
      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks')
      expect(redirect).toHaveBeenCalledWith('/admin/hacks')
    })

    it('should throw error for non-admin user', async () => {
      // Mock non-admin user
      mockSupabase.single.mockResolvedValueOnce({
        data: { is_admin: false },
        error: null
      })

      await expect(deleteHack(hackId)).rejects.toThrow('Unauthorized: Admin access required')
      expect(mockSupabase.delete).not.toHaveBeenCalled()
    })
  })

  describe('toggleLike', () => {
    const hackId = 'test-hack-id'
    const userId = 'test-user-id'

    it('should add a like when not already liked', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock checking existing like (not found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      })

      // Mock insert like
      mockSupabase.insert.mockResolvedValue({
        data: { hack_id: hackId, user_id: userId },
        error: null
      })

      await toggleLike(hackId)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        hack_id: hackId,
        user_id: userId
      })
      expect(revalidatePath).toHaveBeenCalledWith(`/hacks/${hackId}`)
    })

    it.skip('should remove a like when already liked', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock checking existing like (found)
      mockSupabase.single.mockResolvedValueOnce({
        data: { hack_id: hackId, user_id: userId },
        error: null
      })

      // Mock delete like
      mockSupabase.eq.mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))

      await toggleLike(hackId)

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith(`/hacks/${hackId}`)
    })

    it('should throw error if user is not authenticated', async () => {
      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(toggleLike(hackId)).rejects.toThrow('Must be logged in to like hacks')
    })
  })

  describe.skip('toggleCompletion', () => {
    const hackId = 'test-hack-id'
    const userId = 'test-user-id'

    it('should mark hack as completed when not completed', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock checking existing completion (not found)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      })

      // Mock insert completion
      mockSupabase.insert.mockResolvedValue({
        data: { hack_id: hackId, user_id: userId },
        error: null
      })

      await toggleCompletion(hackId)

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        hack_id: hackId,
        user_id: userId
      })
      expect(revalidatePath).toHaveBeenCalledWith(`/hacks/${hackId}`)
      expect(revalidatePath).toHaveBeenCalledWith('/profile/history')
    })

    it('should unmark hack as completed when already completed', async () => {
      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock checking existing completion (found)
      mockSupabase.single.mockResolvedValueOnce({
        data: { hack_id: hackId, user_id: userId },
        error: null
      })

      // Mock delete completion
      mockSupabase.eq.mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))

      await toggleCompletion(hackId)

      expect(mockSupabase.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith(`/hacks/${hackId}`)
      expect(revalidatePath).toHaveBeenCalledWith('/profile/history')
    })

    it('should throw error if user is not authenticated', async () => {
      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(toggleCompletion(hackId)).rejects.toThrow('User not authenticated')
    })
  })

  describe('markHackVisited', () => {
    const hackId = 'test-hack-id'
    const userId = 'test-user-id'

    beforeEach(() => {
      // Reset Prisma mocks
      const prisma = require('@/lib/db').default
      vi.clearAllMocks()
    })

    it('should create new interaction when user views hack for first time', async () => {
      const prisma = require('@/lib/db').default

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock no existing interaction
      prisma.userHack.findUnique.mockResolvedValue(null)

      // Mock successful creation
      prisma.userHack.create.mockResolvedValue({
        id: 'interaction-123',
        userId,
        hackId,
        status: 'visited',
        completedAt: new Date()
      })

      await markHackVisited(hackId)

      expect(prisma.userHack.findUnique).toHaveBeenCalledWith({
        where: {
          userId_hackId: {
            userId,
            hackId
          }
        }
      })

      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: {
          userId,
          hackId,
          status: 'visited',
          completedAt: expect.any(Date)
        }
      })

      expect(revalidatePath).toHaveBeenCalledWith('/hacks')
      expect(revalidatePath).toHaveBeenCalledWith(`/hacks/${hackId}`)
      expect(revalidatePath).toHaveBeenCalledWith('/profile')
    })

    it('should update existing interaction to completed if not already completed', async () => {
      const prisma = require('@/lib/db').default

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock existing interaction that is not completed
      const existingInteraction = {
        id: 'interaction-123',
        userId,
        hackId,
        status: 'liked',
        completedAt: null
      }

      prisma.userHack.findUnique.mockResolvedValue(existingInteraction)

      // Mock successful update
      prisma.userHack.update.mockResolvedValue({
        ...existingInteraction,
        status: 'visited',
        completedAt: new Date()
      })

      await markHackVisited(hackId)

      expect(prisma.userHack.update).toHaveBeenCalledWith({
        where: {
          id: existingInteraction.id
        },
        data: {
          status: 'visited',
          completedAt: expect.any(Date)
        }
      })

      expect(prisma.userHack.create).not.toHaveBeenCalled()
    })

    it('should not update if already marked as completed', async () => {
      const prisma = require('@/lib/db').default

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock existing completed interaction
      const existingInteraction = {
        id: 'interaction-123',
        userId,
        hackId,
        status: 'visited',
        completedAt: new Date()
      }

      prisma.userHack.findUnique.mockResolvedValue(existingInteraction)

      await markHackVisited(hackId)

      expect(prisma.userHack.update).not.toHaveBeenCalled()
      expect(prisma.userHack.create).not.toHaveBeenCalled()
    })

    it('should throw error if user is not authenticated', async () => {
      // Mock no user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(markHackViewed(hackId)).rejects.toThrow('Must be logged in to track viewed hacks')

      const prisma = require('@/lib/db').default
      expect(prisma.userHack.findUnique).not.toHaveBeenCalled()
      expect(prisma.userHack.create).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const prisma = require('@/lib/db').default

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Mock database error
      prisma.userHack.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(markHackViewed(hackId)).rejects.toThrow('Failed to mark as viewed: Database connection failed')
    })

    it('should never use "viewed" status, always "completed"', async () => {
      const prisma = require('@/lib/db').default

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })

      // Test new interaction
      prisma.userHack.findUnique.mockResolvedValue(null)
      prisma.userHack.create.mockResolvedValue({ id: 'new-interaction' })

      await markHackVisited(hackId)

      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'completed' // NOT 'viewed'
        })
      })

      // Reset mocks
      vi.clearAllMocks()

      // Test update interaction
      prisma.userHack.findUnique.mockResolvedValue({
        id: 'existing-interaction',
        status: 'liked'
      })
      prisma.userHack.update.mockResolvedValue({ id: 'existing-interaction' })

      await markHackVisited(hackId)

      expect(prisma.userHack.update).toHaveBeenCalledWith({
        where: expect.any(Object),
        data: expect.objectContaining({
          status: 'completed' // NOT 'viewed'
        })
      })
    })
  })
})