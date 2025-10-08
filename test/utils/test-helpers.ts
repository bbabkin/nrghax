import { vi } from 'vitest'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Wait for a specific duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate random string
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * Generate unique ID
 */
export function uniqueId(prefix: string = ''): string {
  const timestamp = Date.now()
  const random = randomString(6)
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`
}

/**
 * Mock successful Supabase response
 */
export function mockSuccessResponse<T>(data: T) {
  return Promise.resolve({ data, error: null })
}

/**
 * Mock Supabase error response
 */
export function mockErrorResponse(message: string, code?: string) {
  return Promise.resolve({
    data: null,
    error: { message, code: code || 'ERROR' }
  })
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient() {
  const mockClient: any = {
    from: vi.fn(() => mockClient),
    select: vi.fn(() => mockClient),
    insert: vi.fn(() => mockClient),
    update: vi.fn(() => mockClient),
    delete: vi.fn(() => mockClient),
    eq: vi.fn(() => mockClient),
    neq: vi.fn(() => mockClient),
    single: vi.fn(() => mockClient),
    order: vi.fn(() => mockClient),
    limit: vi.fn(() => mockClient),
    range: vi.fn(() => mockClient),
    ilike: vi.fn(() => mockClient),
    in: vi.fn(() => mockClient),
    is: vi.fn(() => mockClient),
    or: vi.fn(() => mockClient),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      admin: {
        deleteUser: vi.fn(),
        updateUserById: vi.fn()
      }
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(),
        download: vi.fn(),
        list: vi.fn()
      }))
    },
    rpc: vi.fn()
  }

  return mockClient
}

/**
 * Setup mock fetch for testing
 */
export function setupMockFetch() {
  const mockFetch = vi.fn()
  global.fetch = mockFetch as any
  return mockFetch
}

/**
 * Clean up all mocks
 */
export function cleanupMocks() {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

/**
 * Expect function to throw error
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
) {
  let error: Error | null = null

  try {
    await fn()
  } catch (e) {
    error = e as Error
  }

  expect(error).toBeTruthy()

  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error?.message).toContain(errorMessage)
    } else {
      expect(error?.message).toMatch(errorMessage)
    }
  }
}

/**
 * Create test fixtures
 */
export function createTestFixtures() {
  return {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: new Date().toISOString()
    },
    hack: {
      id: 'test-hack-id',
      name: 'Test Hack',
      slug: 'test-hack',
      description: 'Test hack description',
      content_type: 'content' as const,
      content_body: 'Test content',
      difficulty: 'Beginner' as const,
      time_minutes: 10,
      category: 'productivity' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    routine: {
      id: 'test-routine-id',
      name: 'Test Routine',
      slug: 'test-routine',
      description: 'Test routine description',
      created_by: 'test-user-id',
      is_public: true,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    comment: {
      id: 'test-comment-id',
      content: 'Test comment',
      entity_type: 'hack' as const,
      entity_id: 'test-hack-id',
      user_id: 'test-user-id',
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
}

/**
 * Assert that an object matches expected shape
 */
export function assertShape<T extends Record<string, any>>(
  actual: T,
  expected: Partial<T>
) {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual[key]).toEqual(value)
  }
}

/**
 * Create a test context with common utilities
 */
export function createTestContext() {
  const fixtures = createTestFixtures()
  const mockSupabase = createMockSupabaseClient()

  return {
    fixtures,
    mockSupabase,
    cleanup: () => cleanupMocks()
  }
}