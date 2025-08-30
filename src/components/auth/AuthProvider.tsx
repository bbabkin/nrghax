'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<any>
  signInWithDiscord: () => Promise<any>
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    const supabase = createSupabaseClient()

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (mounted) {
          setSession(currentSession)
          setUser(currentSession?.user || null)
          
          // Get user profile if authenticated
          if (currentSession?.user) {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single()
            
            if (mounted) {
              setProfile(userProfile || null)
            }
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setSession(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event)
      
      if (mounted) {
        setSession(newSession)
        
        if (newSession?.user) {
          setUser(newSession.user)
          // Get updated profile
          try {
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single()
            
            if (mounted) {
              setProfile(userProfile || null)
            }
          } catch (error) {
            console.error('Error fetching user profile:', error)
            if (mounted) {
              setProfile(null)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Refresh user profile data
  const refreshProfile = async () => {
    if (!user) return
    const supabase = createSupabaseClient()
    
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(userProfile || null)
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  // Role checking helpers
  const hasRole = (role: string): boolean => {
    return profile?.role === role || false
  }

  const isAdmin = (): boolean => {
    return profile?.role === 'admin' || profile?.role === 'super_admin' || false
  }

  const isSuperAdmin = (): boolean => {
    return profile?.role === 'super_admin' || false
  }

  // Enhanced auth methods with profile updates
  const enhancedSignIn = async (email: string, password: string) => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
    
    // State will be updated by the auth state change listener
    return { user: data.user, session: data.session }
  }

  const enhancedSignUp = async (email: string, password: string, userData?: { name?: string }) => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {},
      },
    })
    
    if (error) {
      throw error
    }
    
    // State will be updated by the auth state change listener
    return { user: data.user, session: data.session }
  }

  const enhancedSignOut = async () => {
    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
    
    // State will be cleared by the auth state change listener
  }

  const signInWithGoogle = async () => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  const signInWithDiscord = async () => {
    const supabase = createSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn: enhancedSignIn,
    signUp: enhancedSignUp,
    signOut: enhancedSignOut,
    signInWithGoogle: signInWithGoogle,
    signInWithDiscord: signInWithDiscord,
    hasRole,
    isAdmin,
    isSuperAdmin,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hook that matches NextAuth's useSession pattern
export function useUser() {
  const { user, profile, loading } = useAuth()
  
  return {
    user: user && profile ? {
      ...user,
      role: profile.role,
      name: profile.name || user.user_metadata?.name || user.email,
    } : null,
    loading,
  }
}