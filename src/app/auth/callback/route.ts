import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // JIT Sync: Ensure profile exists using Prisma
        try {
          await prisma.profile.upsert({
            where: { id: user.id },
            update: {
              email: user.email!,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name,
              avatarUrl: user.user_metadata?.avatar_url,
              updatedAt: new Date(),
            },
            create: {
              id: user.id,
              email: user.email!,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name,
              avatarUrl: user.user_metadata?.avatar_url,
              isAdmin: false,
            }
          })
          console.log('Profile synced for OAuth user:', user.email)
        } catch (profileError) {
          console.error('Failed to sync profile:', profileError)
          // Don't fail the auth flow, just log the error
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}