import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'
import prisma from '@/lib/db'

export async function ensureProfileSync(userId: string, email: string, metadata?: any) {
  try {
    await prisma.profile.upsert({
      where: { id: userId },
      update: {
        email: email,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: email,
        fullName: metadata?.full_name || metadata?.name,
        avatarUrl: metadata?.avatar_url,
        isAdmin: false,
      }
    })
    return true
  } catch (error) {
    console.error('Profile sync in middleware failed:', error)
    return false
  }
}

export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Middleware can't set cookies
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Ensure profile exists (non-blocking)
  ensureProfileSync(user.id, user.email!, user.user_metadata).catch(console.error)

  // Get profile data
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      isAdmin: true,
      fullName: true,
      avatarUrl: true,
    }
  })

  return {
    ...user,
    isAdmin: profile?.isAdmin || false,
    fullName: profile?.fullName || user.user_metadata?.full_name,
    avatarUrl: profile?.avatarUrl || user.user_metadata?.avatar_url,
  }
}