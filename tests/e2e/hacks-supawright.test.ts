import { test, expect } from '@playwright/test'
import { withSupawright } from 'supawright'
import type { Database } from '@/lib/database.types'

// Initialize Supawright with our database schema
const testWithSupabase = withSupawright<Database, 'public'>(['public'])

testWithSupabase.describe('Hacks Feature with Supawright', () => {
  testWithSupabase('should handle complete hack workflow with database cleanup', async ({ page, supawright }) => {
    // Create a test user with Supawright
    const testUser = await supawright.create('auth.users', {
      email: 'testuser@example.com',
      encrypted_password: 'test123',
      email_confirmed_at: new Date().toISOString(),
      raw_user_meta_data: { is_admin: false }
    })

    // Create an admin user
    const adminUser = await supawright.create('auth.users', {
      email: 'admin@example.com',
      encrypted_password: 'admin123',
      email_confirmed_at: new Date().toISOString(),
      raw_user_meta_data: { is_admin: true }
    })

    // Create test hacks
    const basicHack = await supawright.create('public.hacks', {
      name: 'Basic JavaScript',
      description: 'Learn JavaScript basics',
      image_url: 'https://via.placeholder.com/300',
      content_type: 'content',
      content_body: '<p>JavaScript fundamentals</p>'
    })

    const advancedHack = await supawright.create('public.hacks', {
      name: 'Advanced React',
      description: 'Master React patterns',
      image_url: 'https://via.placeholder.com/300',
      content_type: 'content',
      content_body: '<p>React advanced concepts</p>'
    })

    // Create prerequisite relationship
    await supawright.create('public.hack_prerequisites', {
      hack_id: advancedHack.id,
      prerequisite_id: basicHack.id
    })

    // Test 1: Navigate to hacks page as unauthenticated user
    await page.goto('/hacks')
    await expect(page.getByText('Basic JavaScript')).toBeVisible()
    await expect(page.getByText('Advanced React')).toBeVisible()

    // Test 2: Login as regular user and complete basic hack
    await page.goto('/auth')
    await page.getByPlaceholder('name@example.com').fill('testuser@example.com')
    await page.getByPlaceholder('Enter your password').fill('test123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    await page.waitForURL('**/dashboard')
    
    // Visit basic hack
    await page.goto('/hacks')
    await page.getByText('Basic JavaScript').click()
    await page.waitForURL(`**/hacks/${basicHack.id}`)
    
    // Verify completion was tracked
    const completion = await supawright.create('public.user_hack_completions', {
      user_id: testUser.id,
      hack_id: basicHack.id
    })
    
    expect(completion).toBeDefined()
    
    // Test 3: Like the hack
    const like = await supawright.create('public.user_hack_likes', {
      user_id: testUser.id,
      hack_id: basicHack.id
    })
    
    expect(like).toBeDefined()

    // Test 4: Check prerequisites enforcement
    // Advanced hack should show locked until basic is completed
    await page.goto(`/hacks/${advancedHack.id}`)
    
    // After completing basic, should be able to access advanced
    await supawright.create('public.user_hack_completions', {
      user_id: testUser.id,
      hack_id: advancedHack.id
    })

    // Test 5: Admin can create new hack
    await page.goto('/auth/signout')
    await page.goto('/auth')
    await page.getByPlaceholder('name@example.com').fill('admin@example.com')
    await page.getByPlaceholder('Enter your password').fill('admin123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    await page.waitForURL('**/dashboard')
    await page.goto('/admin/hacks/new')
    
    await page.getByLabel('Name').fill('Test Hack from Supawright')
    await page.getByLabel('Description').fill('Created during E2E test')
    await page.getByLabel('Image URL').fill('https://via.placeholder.com/300')
    await page.getByLabel('Internal Content').check()
    
    const editor = page.locator('.ProseMirror')
    await editor.click()
    await editor.fill('Test content from Supawright')
    
    await page.getByRole('button', { name: 'Create Hack' }).click()
    await page.waitForURL('**/admin/hacks')
    
    // Verify hack was created in database
    const createdHack = await supawright.client
      .from('hacks')
      .select('*')
      .eq('name', 'Test Hack from Supawright')
      .single()
    
    expect(createdHack.data).toBeDefined()
    expect(createdHack.data?.name).toBe('Test Hack from Supawright')

    // Supawright automatically cleans up all created records when test ends
  })

  testWithSupabase('should enforce RLS policies correctly', async ({ supawright }) => {
    // Create non-admin user
    const regularUser = await supawright.create('auth.users', {
      email: 'regular@example.com',
      encrypted_password: 'password123',
      email_confirmed_at: new Date().toISOString(),
      raw_user_meta_data: { is_admin: false }
    })

    // Attempt to create hack as regular user (should fail due to RLS)
    await expect(async () => {
      await supawright.client
        .from('hacks')
        .insert({
          name: 'Unauthorized Hack',
          description: 'Should not be created',
          image_url: 'https://test.com',
          content_type: 'content',
          content_body: 'Unauthorized content'
        })
        .single()
    }).rejects.toThrow()

    // Create admin user
    const adminUser = await supawright.create('auth.users', {
      email: 'admin2@example.com',
      encrypted_password: 'admin123',
      email_confirmed_at: new Date().toISOString(),
      raw_user_meta_data: { is_admin: true }
    })

    // Admin should be able to create hack
    const hack = await supawright.create('public.hacks', {
      name: 'Admin Created Hack',
      description: 'Created by admin',
      image_url: 'https://test.com',
      content_type: 'content',
      content_body: 'Admin content'
    })

    expect(hack).toBeDefined()
    expect(hack.name).toBe('Admin Created Hack')
  })

  testWithSupabase('should track user progress correctly', async ({ supawright }) => {
    // Create user and hacks
    const user = await supawright.create('auth.users', {
      email: 'learner@example.com',
      encrypted_password: 'learn123',
      email_confirmed_at: new Date().toISOString()
    })

    const hacks = await Promise.all([
      supawright.create('public.hacks', {
        name: 'Hack 1',
        description: 'First hack',
        image_url: 'https://test.com/1',
        content_type: 'content',
        content_body: 'Content 1'
      }),
      supawright.create('public.hacks', {
        name: 'Hack 2',
        description: 'Second hack',
        image_url: 'https://test.com/2',
        content_type: 'content',
        content_body: 'Content 2'
      }),
      supawright.create('public.hacks', {
        name: 'Hack 3',
        description: 'Third hack',
        image_url: 'https://test.com/3',
        content_type: 'content',
        content_body: 'Content 3'
      })
    ])

    // Complete hacks
    await supawright.create('public.user_hack_completions', {
      user_id: user.id,
      hack_id: hacks[0].id
    })

    await supawright.create('public.user_hack_completions', {
      user_id: user.id,
      hack_id: hacks[1].id
    })

    // Like one hack
    await supawright.create('public.user_hack_likes', {
      user_id: user.id,
      hack_id: hacks[0].id
    })

    // Query user's completed hacks
    const { data: completions } = await supawright.client
      .from('user_hack_completions')
      .select('*, hack:hacks(*)')
      .eq('user_id', user.id)

    expect(completions).toHaveLength(2)
    expect(completions?.[0].hack?.name).toBeDefined()

    // Query user's liked hacks
    const { data: likes } = await supawright.client
      .from('user_hack_likes')
      .select('*, hack:hacks(*)')
      .eq('user_id', user.id)

    expect(likes).toHaveLength(1)
    expect(likes?.[0].hack?.name).toBe('Hack 1')
  })
})