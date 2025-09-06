import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getHacks, 
  getHackById, 
  checkPrerequisitesCompleted,
  getUserCompletedHacks,
  getAllHacksForSelect 
} from './utils'

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { 
          user: { 
            id: 'test-user-id',
            email: 'test@example.com'
          } 
        },
        error: null
      }))
    },
    from: vi.fn((table: string) => {
      if (table === 'hacks') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: mockHacks,
              error: null
            })),
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockHacks[0],
                error: null
              }))
            }))
          }))
        }
      }
      if (table === 'user_hack_completions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({
                data: mockCompletions,
                error: null
              }))
            }))
          }))
        }
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }
    }),
    rpc: vi.fn((functionName: string) => {
      if (functionName === 'check_prerequisites_completed') {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
  }))
}))

const mockHacks = [
  {
    id: '1',
    name: 'Test Hack 1',
    description: 'Description 1',
    image_url: 'https://example.com/image1.jpg',
    content_type: 'content',
    content_body: 'Content 1',
    external_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    likes_count: 5,
    completion_count: 10,
    prerequisites: []
  },
  {
    id: '2', 
    name: 'Test Hack 2',
    description: 'Description 2',
    image_url: 'https://example.com/image2.jpg',
    content_type: 'link',
    content_body: null,
    external_link: 'https://example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    likes_count: 3,
    completion_count: 7,
    prerequisites: []
  }
]

const mockCompletions = [
  {
    id: '1',
    user_id: 'test-user-id',
    hack_id: '1',
    completed_at: new Date().toISOString(),
    hack: mockHacks[0]
  }
]

describe('Hacks Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHacks', () => {
    it('should fetch all hacks with user data', async () => {
      const hacks = await getHacks()
      
      expect(hacks).toBeDefined()
      expect(Array.isArray(hacks)).toBe(true)
      expect(hacks).toHaveLength(2)
      expect(hacks[0].name).toBe('Test Hack 1')
    })

    it('should include completion status for authenticated users', async () => {
      const hacks = await getHacks()
      
      expect(hacks[0]).toHaveProperty('likes_count')
      expect(hacks[0]).toHaveProperty('completion_count')
      // Note: The actual values depend on the mock implementation
    })
  })

  describe('getHackById', () => {
    it('should fetch a single hack by ID', async () => {
      const hack = await getHackById('1')
      
      expect(hack).toBeDefined()
      expect(hack?.id).toBe('1')
      expect(hack?.name).toBe('Test Hack 1')
      expect(hack?.content_type).toBe('content')
    })

    it('should return null for non-existent hack', async () => {
      vi.mocked(createClient).mockImplementationOnce(() => Promise.resolve({
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })) },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
            }))
          }))
        }))
      } as any))

      const hack = await getHackById('non-existent')
      expect(hack).toBeNull()
    })
  })

  describe('checkPrerequisitesCompleted', () => {
    it('should check if prerequisites are completed', async () => {
      const result = await checkPrerequisitesCompleted('test-user-id', 'hack-id')
      
      expect(result).toBe(true)
    })

    it('should return false when prerequisites are not met', async () => {
      vi.mocked(createClient).mockImplementationOnce(() => Promise.resolve({
        rpc: vi.fn(() => Promise.resolve({ data: false, error: null }))
      } as any))

      const result = await checkPrerequisitesCompleted('test-user-id', 'hack-id')
      expect(result).toBe(false)
    })
  })

  describe('getUserCompletedHacks', () => {
    it('should fetch user completed hacks', async () => {
      const completions = await getUserCompletedHacks('test-user-id')
      
      expect(completions).toBeDefined()
      expect(Array.isArray(completions)).toBe(true)
      expect(completions).toHaveLength(1)
      // The structure depends on the mock response
    })

    it('should return empty array when no completions', async () => {
      vi.mocked(createClient).mockImplementationOnce(() => Promise.resolve({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      } as any))

      const completions = await getUserCompletedHacks('test-user-id')
      expect(completions).toEqual([])
    })
  })

  describe('getAllHacksForSelect', () => {
    it('should fetch all hacks for selection dropdown', async () => {
      const hacks = await getAllHacksForSelect()
      
      expect(hacks).toBeDefined()
      expect(Array.isArray(hacks)).toBe(true)
      expect(hacks).toHaveLength(2)
      expect(hacks[0]).toHaveProperty('id')
      expect(hacks[0]).toHaveProperty('name')
    })

    it('should return empty array on error', async () => {
      vi.mocked(createClient).mockImplementationOnce(() => Promise.resolve({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      } as any))

      const hacks = await getAllHacksForSelect()
      expect(hacks).toEqual([])
    })
  })
})

// Fix the import statement
import { createClient } from '@/lib/supabase/server'