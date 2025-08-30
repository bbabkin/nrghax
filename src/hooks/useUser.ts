'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import type { UserRole } from '@/types/auth'

// Extended user type that matches NextAuth pattern
interface ExtendedUser {
  id: string
  email: string
  name?: string
  role: UserRole
  avatar_url?: string
}

interface UseUserReturn {
  user: ExtendedUser | null
  loading: boolean
}

/**
 * Hook to get current user information
 * Replaces NextAuth's useSession hook with similar API
 */
export function useUser(): UseUserReturn {
  const { user, profile, loading } = useAuth()
  
  // Transform Supabase user + profile into NextAuth-compatible format
  const transformedUser: ExtendedUser | null = user && profile ? {
    id: user.id,
    email: user.email || profile.email,
    name: profile.name || user.user_metadata?.name || user.user_metadata?.full_name || profile.email,
    role: profile.role,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
  } : null

  return {
    user: transformedUser,
    loading,
  }
}

/**
 * Hook for role-based access control
 */
export function useUserRole() {
  const { user, loading } = useUser()
  
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role || false
  }
  
  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin' || false
  }
  
  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin' || false
  }
  
  const canAccessAdmin = (): boolean => {
    return isAdmin()
  }
  
  const canManageUsers = (): boolean => {
    return isSuperAdmin()
  }
  
  return {
    user,
    loading,
    hasRole,
    isAdmin,
    isSuperAdmin,
    canAccessAdmin,
    canManageUsers,
    role: user?.role || 'user',
  }
}

// Default export for backward compatibility
export default useUser