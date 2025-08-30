import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

/**
 * Auth middleware for Supabase authentication
 * Handles protected routes and role-based access control
 */
export async function supabaseAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  console.log('Supabase middleware checking path:', pathname)

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: response })

  let user = null
  let userProfile = null

  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()
    user = session?.user || null

    if (user) {
      // Get user profile with role information
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role, email, name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.log('Could not fetch user profile:', profileError.message)
      } else {
        userProfile = profile
      }
    }
  } catch (error) {
    console.log('Error in middleware auth check:', error)
  }

  console.log('Auth state:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    userRole: userProfile?.role 
  })

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      console.log('No user found, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin role
    const userRole = userProfile?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('User lacks admin role:', userRole)
      const accessDeniedUrl = new URL('/access-denied', request.url)
      accessDeniedUrl.searchParams.set('reason', 'admin_required')
      return NextResponse.redirect(accessDeniedUrl)
    }

    console.log('Admin access granted:', { email: user.email, role: userRole })
  }

  // Handle API admin routes
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = userProfile?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin privileges required' },
        { status: 403 }
      )
    }
  }

  // Handle dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Prevent authenticated users from accessing auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    console.log('Authenticated user accessing auth page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add user info to headers for downstream use
  if (user && userProfile) {
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
    response.headers.set('x-user-role', userProfile.role)
  }

  return response
}