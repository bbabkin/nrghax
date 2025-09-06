import { describe, it, expect, vi } from 'vitest'
import { createClient } from './client'

// Mock the Supabase createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(),
        single: vi.fn(),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}))

describe('Supabase Client', () => {
  it('should create a client instance', () => {
    const client = createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('should have auth methods', () => {
    const client = createClient()
    expect(typeof client.auth.getUser).toBe('function')
    expect(typeof client.auth.getSession).toBe('function')
    expect(typeof client.auth.signInWithPassword).toBe('function')
    expect(typeof client.auth.signUp).toBe('function')
    expect(typeof client.auth.signOut).toBe('function')
  })

  it('should have database methods', () => {
    const client = createClient()
    expect(typeof client.from).toBe('function')
    
    const tableRef = client.from('test_table')
    expect(tableRef).toBeDefined()
    expect(typeof tableRef.select).toBe('function')
    expect(typeof tableRef.insert).toBe('function')
    expect(typeof tableRef.update).toBe('function')
    expect(typeof tableRef.delete).toBe('function')
  })
})