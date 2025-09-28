import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export type AuthUser = {
  id: string
  email: string
  name?: string | null
  avatar_url?: string | null
  is_admin: boolean
}

/**
 * Get the current user from Supabase auth
 * Cached per request for performance
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get profile data from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatar_url,
    is_admin: profile.is_admin || false,
  }
})

/**
 * Check if user exists in database
 */
export async function verifyUserSync(userId: string): Promise<{
  inAuth: boolean
  inProfile: boolean
  synced: boolean
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  return {
    inAuth: user?.id === userId,
    inProfile: !!profile,
    synced: user?.id === userId && !!profile,
  }
}

/**
 * Helper to require authentication
 * Redirects to auth page if user is not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  return user
}

/**
 * Helper to require admin role
 * Throws an error if user is not an admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (!user.is_admin) {
    throw new Error('Admin access required')
  }

  return user
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: {
  name?: string
  avatar_url?: string
}): Promise<AuthUser | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error || !profile) {
    return null
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatar_url,
    is_admin: profile.is_admin || false,
  }
}