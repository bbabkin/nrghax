import { auth } from "@/lib/auth"
import { getUserProfile } from "@/lib/supabase"
import { redirect } from "next/navigation"
import type { Session, User } from "next-auth"

// Extended user type with profile information
export interface ExtendedUser extends User {
  role: 'user' | 'admin' | 'super_admin' // Required for admin functionality
  profile?: {
    id: string
    email: string
    name?: string | null
    created_at: string
    updated_at: string
  } | null
}

// Extended session type
export interface ExtendedSession extends Session {
  user: ExtendedUser
}

/**
 * Get the current session on the server side
 * Returns null if no session exists
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const session = await auth()
    return session
  } catch (error) {
    console.error("Error getting server session:", error)
    return null
  }
}

/**
 * Get the current session with extended user profile information
 * Returns null if no session exists
 */
export async function getExtendedSession(): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return null
    }

    // Get user profile from database
    const profile = await getUserProfile(session.user.id)

    const extendedSession: ExtendedSession = {
      ...session,
      user: {
        ...session.user,
        role: (session.user as any).role || 'user', // Ensure role is present
        profile
      }
    }

    return extendedSession
  } catch (error) {
    console.error("Error getting extended session:", error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components and pages that require authentication
 */
export async function requireAuth(redirectTo?: string): Promise<Session> {
  const session = await getServerSession()
  
  if (!session) {
    const loginUrl = redirectTo 
      ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginUrl)
  }
  
  return session
}

/**
 * Require authentication with extended user profile
 * Use this when you need user profile information
 */
export async function requireExtendedAuth(redirectTo?: string): Promise<ExtendedSession> {
  const session = await getExtendedSession()
  
  if (!session) {
    const loginUrl = redirectTo 
      ? `/login?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginUrl)
  }
  
  return session
}

/**
 * Check if user has a specific role or permission
 * Extend this function based on your role-based access control needs
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const session = await getServerSession()
  
  if (!session) {
    return false
  }
  
  // For now, all authenticated users have basic permissions
  // You can extend this to check specific roles or permissions
  const basicPermissions = [
    'read:profile',
    'update:profile',
    'delete:account'
  ]
  
  if (basicPermissions.includes(permission)) {
    return true
  }
  
  // Check for admin permissions (example)
  if (session.user.email === 'admin@example.com') {
    const adminPermissions = [
      'read:all_users',
      'update:all_users',
      'delete:all_users'
    ]
    
    return adminPermissions.includes(permission)
  }
  
  return false
}

/**
 * Require specific permission - throws error if not authorized
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasAccess = await hasPermission(permission)
  
  if (!hasAccess) {
    throw new Error(`Insufficient permissions: ${permission}`)
  }
}

/**
 * Get current user ID from session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession()
  return session?.user?.id || null
}

/**
 * Check if current user is the owner of a resource
 * Useful for ensuring users can only access their own data
 */
export async function isResourceOwner(resourceUserId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId()
  return currentUserId === resourceUserId
}

/**
 * Require resource ownership - throws error if user doesn't own the resource
 */
export async function requireResourceOwnership(resourceUserId: string): Promise<void> {
  const isOwner = await isResourceOwner(resourceUserId)
  
  if (!isOwner) {
    throw new Error('Access denied: You can only access your own resources')
  }
}

/**
 * Session validation for API routes
 * Returns session or throws error for API endpoints
 */
export async function validateApiSession(): Promise<Session> {
  const session = await getServerSession()
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

/**
 * Create standardized API error responses for authentication failures
 */
export function createAuthErrorResponse(message: string = 'Unauthorized') {
  return Response.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * Create standardized API error responses for forbidden access
 */
export function createForbiddenResponse(message: string = 'Forbidden') {
  return Response.json(
    { error: message },
    { status: 403 }
  )
}

/**
 * Higher-order function to protect API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (session: Session, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const session = await validateApiSession()
      return handler(session, ...args)
    } catch (error) {
      console.error('API authentication error:', error)
      return createAuthErrorResponse()
    }
  }
}

/**
 * Higher-order function to protect API routes with permission checking
 */
export function withPermission<T extends any[]>(
  permission: string,
  handler: (session: Session, ...args: T) => Promise<Response>
) {
  return withAuth(async (session: Session, ...args: T) => {
    try {
      await requirePermission(permission)
      return handler(session, ...args)
    } catch (error) {
      console.error('API permission error:', error)
      return createForbiddenResponse(error instanceof Error ? error.message : 'Forbidden')
    }
  })
}

/**
 * Helper to safely get user information for client components
 * This should be used in server components and passed to client components as props
 */
export async function getUserForClient() {
  const session = await getServerSession()
  
  if (!session) {
    return null
  }
  
  // Return only safe user information for client
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  }
}