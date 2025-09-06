import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: {}, session: {} }, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: { user: {}, session: {} }, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
  },
  from: vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  rpc: vi.fn(() => Promise.resolve({ data: true, error: null })),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'