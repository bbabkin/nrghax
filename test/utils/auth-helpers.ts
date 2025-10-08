import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface TestUser {
  id: string
  email: string
  password: string
  isAdmin?: boolean
  name?: string
}

/**
 * Create a test user with Supabase Auth
 */
export async function createTestUser(
  supabase: SupabaseClient<Database>,
  user: Omit<TestUser, 'id'>
): Promise<TestUser> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        name: user.name || user.email.split('@')[0]
      }
    }
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Failed to create user')

  // Update profile if admin
  if (user.isAdmin) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', authData.user.id)

    if (profileError) throw profileError
  }

  return {
    ...user,
    id: authData.user.id
  }
}

/**
 * Sign in a test user
 */
export async function signInTestUser(
  supabase: SupabaseClient<Database>,
  email: string,
  password: string
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

/**
 * Sign out current user
 */
export async function signOutTestUser(supabase: SupabaseClient<Database>) {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Clean up test user
 */
export async function cleanupTestUser(
  adminClient: SupabaseClient<Database>,
  userId: string
) {
  // Delete user data in correct order (respecting foreign key constraints)

  // Delete comments and likes
  await adminClient.from('comment_likes').delete().eq('user_id', userId)
  await adminClient.from('comments').delete().eq('user_id', userId)

  // Delete hack interactions
  await adminClient.from('hack_likes').delete().eq('user_id', userId)
  await adminClient.from('hack_completions').delete().eq('user_id', userId)
  await adminClient.from('user_hack_progress').delete().eq('user_id', userId)

  // Delete routine data
  await adminClient.from('routine_sessions').delete().eq('user_id', userId)
  await adminClient.from('user_routines').delete().eq('user_id', userId)
  const { data: userRoutines } = await adminClient
    .from('routines')
    .select('id')
    .eq('created_by', userId)

  if (userRoutines) {
    for (const routine of userRoutines) {
      await adminClient.from('routine_hacks').delete().eq('routine_id', routine.id)
      await adminClient.from('routine_tags').delete().eq('routine_id', routine.id)
    }
  }
  await adminClient.from('routines').delete().eq('created_by', userId)

  // Delete profile
  await adminClient.from('profiles').delete().eq('id', userId)

  // Delete auth user
  await adminClient.auth.admin.deleteUser(userId)
}

/**
 * Get current user from session
 */
export async function getCurrentUser(supabase: SupabaseClient<Database>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Create multiple test users
 */
export async function createTestUsers(
  supabase: SupabaseClient<Database>,
  users: Omit<TestUser, 'id'>[]
): Promise<TestUser[]> {
  const createdUsers: TestUser[] = []

  for (const user of users) {
    const created = await createTestUser(supabase, user)
    createdUsers.push(created)
  }

  return createdUsers
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}@test.com`
}