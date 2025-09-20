import { auth } from "@/src/auth"
import prisma from '@/lib/db'

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  isAdmin: boolean;
}

/**
 * Get the current user from Auth.js session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  // Get fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isAdmin: true,
    }
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isAdmin: user.isAdmin,
  }
}

/**
 * Check if user exists in database
 */
export async function verifyUserSync(userId: string): Promise<{
  inAuth: boolean;
  inProfile: boolean;
  synced: boolean;
}> {
  const session = await auth()
  const user = await prisma.user.findUnique({ where: { id: userId } })

  return {
    inAuth: session?.user?.id === userId,
    inProfile: !!user,
    synced: session?.user?.id === userId && !!user,
  }
}

/**
 * Helper to require authentication
 * Throws an error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}

/**
 * Helper to require admin role
 * Throws an error if user is not an admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()

  if (!user.isAdmin) {
    throw new Error("Admin access required")
  }

  return user
}