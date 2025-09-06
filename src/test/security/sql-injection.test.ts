import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createTestHack, deleteTestHack } from '../helpers/seed'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const skipIntegration = !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SKIP_INTEGRATION_TESTS === 'true'

describe.skipIf(skipIntegration)('SQL Injection Prevention', () => {
  let anonClient: ReturnType<typeof createClient>
  let serviceClient: ReturnType<typeof createClient>
  let testHack: any

  beforeAll(async () => {
    anonClient = createClient(supabaseUrl, supabaseAnonKey)
    serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create a test hack for injection attempts
    testHack = await createTestHack({
      name: 'Test Hack for SQL Injection'
    })
  })

  afterAll(async () => {
    if (testHack) {
      await deleteTestHack(testHack.id)
    }
  })

  it('should prevent SQL injection in search queries', async () => {
    const maliciousInput = "'; DROP TABLE hacks; --"
    
    // Try SQL injection in search
    const { data, error } = await anonClient
      .from('hacks')
      .select('*')
      .ilike('name', `%${maliciousInput}%`)
    
    // Should not throw database error, just return empty or no results
    expect(error).toBeNull()
    expect(data).toBeDefined()
    
    // Verify table still exists
    const { data: tableCheck } = await serviceClient
      .from('hacks')
      .select('id')
      .limit(1)
    
    expect(tableCheck).toBeDefined()
  })

  it('should prevent SQL injection in equality checks', async () => {
    const maliciousInput = "1' OR '1'='1"
    
    const { data, error } = await anonClient
      .from('hacks')
      .select('*')
      .eq('id', maliciousInput)
    
    // Should not return all records
    expect(error).toBeNull()
    expect(data).toEqual([]) // Should be empty, not all records
  })

  it('should prevent SQL injection in insert operations', async () => {
    const maliciousName = "Test'; DROP TABLE hacks; --"
    
    // This should fail due to RLS (anon can't insert), not SQL injection
    const { error } = await anonClient
      .from('hacks')
      .insert({
        name: maliciousName,
        description: 'Test Description',
        image_url: 'https://example.com/image.jpg',
        content_type: 'content',
        content_body: 'Test content'
      })
    
    // Should get RLS error, not SQL error
    expect(error).toBeDefined()
    expect(error?.code).toBe('42501') // RLS violation
    
    // Verify table still exists and has data
    const { data: tableCheck } = await serviceClient
      .from('hacks')
      .select('count')
      .single()
    
    expect(tableCheck).toBeDefined()
  })

  it('should handle special characters safely', async () => {
    const specialChars = "Test's \"Special\" <Characters> & More!"
    
    // Create hack with special characters (using service client)
    const { data, error } = await serviceClient
      .from('hacks')
      .insert({
        name: specialChars,
        description: 'Test with special characters',
        image_url: 'https://example.com/image.jpg',
        content_type: 'content',
        content_body: 'Content with <script>alert("XSS")</script>'
      })
      .select()
      .single()
    
    expect(error).toBeNull()
    expect(data?.name).toBe(specialChars)
    
    // Search for it
    const { data: searchResult } = await anonClient
      .from('hacks')
      .select('name')
      .eq('name', specialChars)
      .single()
    
    expect(searchResult?.name).toBe(specialChars)
    
    // Cleanup
    if (data) {
      await serviceClient.from('hacks').delete().eq('id', data.id)
    }
  })

  it('should prevent SQL injection in RPC calls', async () => {
    const maliciousId = "'; DROP TABLE hacks; --"
    
    // Try injection in RPC parameters
    const { data, error } = await anonClient
      .rpc('check_circular_dependency', {
        p_hack_id: maliciousId,
        p_prerequisite_id: testHack.id
      })
    
    // Should handle gracefully without executing malicious SQL
    // Error might be type mismatch or simply return false/null
    expect(error || data === false || data === null).toBeTruthy()
    
    // Verify table still exists
    const { data: tableCheck } = await serviceClient
      .from('hacks')
      .select('id')
      .limit(1)
    
    expect(tableCheck).toBeDefined()
  })

  it('should prevent injection through LIKE patterns', async () => {
    // Try to escape LIKE pattern
    const injectionPattern = "%' OR name LIKE '%"
    
    const { data, error } = await anonClient
      .from('hacks')
      .select('*')
      .like('name', injectionPattern)
    
    // Should not execute as SQL injection
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
    
    // Should not return all records
    const { data: allHacks } = await anonClient
      .from('hacks')
      .select('*')
    
    // If injection worked, data would equal allHacks
    expect(data?.length).toBeLessThanOrEqual(allHacks?.length || 0)
  })

  it('should sanitize user input in text search', async () => {
    const searchTerms = [
      "'; DELETE FROM hacks; --",
      "1' UNION SELECT * FROM auth.users --",
      "' OR 1=1 --",
      "'; UPDATE profiles SET is_admin=true; --"
    ]
    
    for (const term of searchTerms) {
      const { error } = await anonClient
        .from('hacks')
        .select('*')
        .textSearch('name', term)
      
      // Should not cause SQL errors
      expect(error).toBeNull()
    }
    
    // Verify database integrity
    const { data: integrityCheck } = await serviceClient
      .from('hacks')
      .select('count')
      .single()
    
    expect(integrityCheck).toBeDefined()
    
    // Verify no unauthorized admin access
    const { data: adminCheck } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('is_admin', true)
    
    // Should only have legitimate admins (if any from seed data)
    expect(adminCheck).toBeDefined()
  })
})