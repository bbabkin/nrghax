import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

/**
 * Check if the current user is an admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ?? false
}

/**
 * Get all users (admin only)
 * Returns null if the current user is not an admin
 */
export async function getAllUsers(): Promise<UserProfile[] | null> {
  const isAdmin = await isUserAdmin()
  
  if (!isAdmin) {
    return null
  }

  const supabase = await createClient()
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return null
  }

  return profiles as UserProfile[]
}

/**
 * Get a single user by ID (admin only)
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    return null
  }

  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return profile as UserProfile
}

/**
 * Delete a user (admin only)
 * This will cascade delete all related data due to foreign key constraints
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const isAdmin = await isUserAdmin()

  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const supabase = await createClient()

  // Get current user to prevent self-deletion
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id === userId) {
    throw new Error('Cannot delete your own account')
  }

  // Delete from profiles table (this will cascade to related tables)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user:', error)
    throw new Error('Failed to delete user')
  }

  return true
}