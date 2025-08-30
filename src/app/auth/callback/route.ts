import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth callback handler for Supabase Auth
 * Handles the redirect from OAuth providers (Google, Discord)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('OAuth callback received:', { 
    code: !!code, 
    next, 
    origin: requestUrl.origin,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (code) {
    try {
      const supabase = createSupabaseServerClient()
      
      // Exchange the OAuth code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth code exchange error:', error)
        return NextResponse.redirect(new URL(`/auth/error?error=${error.message}`, requestUrl.origin))
      }

      console.log('OAuth code exchange successful:', { 
        user: !!data.user, 
        session: !!data.session,
        userEmail: data.user?.email 
      })

      // Check if user profile exists, create if not
      if (data.user) {
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .eq('id', data.user.id)
          .single()

        if (profileError || !existingProfile) {
          console.log('Creating user profile for OAuth user:', data.user.email)
          
          // Create user profile with default role
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email,
              role: 'user',
            } as any)

          if (insertError) {
            console.error('Error creating user profile:', insertError)
            // Continue anyway - profile creation failure shouldn't block login
          } else {
            console.log('User profile created successfully')
          }
        } else {
          console.log('Existing user profile found:', { role: (existingProfile as any)?.role })
        }
      }

      // Redirect to the intended destination
      const redirectUrl = next.startsWith('/') ? new URL(next, requestUrl.origin) : new URL('/', requestUrl.origin)
      console.log('Redirecting to:', redirectUrl.toString())
      
      return NextResponse.redirect(redirectUrl)
      
    } catch (error) {
      console.error('OAuth callback error:', error)
      return NextResponse.redirect(new URL(`/auth/error?error=OAuth callback failed`, requestUrl.origin))
    }
  } else {
    console.log('No OAuth code provided')
    return NextResponse.redirect(new URL('/auth/error?error=No code provided', requestUrl.origin))
  }
}

/**
 * Handle POST requests (not typically used for OAuth callbacks)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}