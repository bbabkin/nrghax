import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddleware } from '@/lib/supabase/middleware'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/user',
]

// Define admin routes
const adminRoutes = [
  '/admin',
  '/api/admin',
]

// Define auth routes that should redirect authenticated users
const authRoutes = [
  '/login',
  '/register',
  '/reset-password',
]

// Define public API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth',
  '/api/health',
  '/_next',
  '/_vercel',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for static files and public paths
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp')
  ) {
    return NextResponse.next()
  }

  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Allow public API routes immediately
  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  try {
    // Create Supabase middleware
    const supabase = createSupabaseMiddleware(req)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const isLoggedIn = !error && !!user
    
    console.log(`Middleware: ${pathname}, Authenticated: ${isLoggedIn}, User: ${user?.email || 'none'}`)
    
    // Check route types
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    const isAdminRoute = adminRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    // Handle admin routes separately with role checking
    if (isAdminRoute && isLoggedIn && user) {
      try {
        // Get user profile to check role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        const userRole = (profile as any)?.role || 'user'
        const isAdmin = userRole === 'admin' || userRole === 'super_admin'
        
        if (!isAdmin) {
          // Not an admin - redirect to access denied or return 403 for API
          if (pathname.startsWith('/api/admin')) {
            return NextResponse.json(
              { error: 'Forbidden', message: 'Admin privileges required' },
              { status: 403 }
            )
          } else {
            const accessDeniedUrl = new URL('/access-denied', req.url)
            accessDeniedUrl.searchParams.set('reason', 'admin_required')
            return NextResponse.redirect(accessDeniedUrl)
          }
        }
        // Admin user - allow access
        const response = NextResponse.next()
        response.headers.set('x-user-role', userRole)
        return response
      } catch (roleError) {
        console.error('Error checking user role:', roleError)
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    
    // If user is trying to access auth pages while logged in, redirect to dashboard
    if (isAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // If user is trying to access protected routes while not logged in, redirect to login
    if ((isProtectedRoute || isAdminRoute) && !isLoggedIn) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      } else {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    
    // For other API routes that require auth, return 401 if not authenticated
    if (pathname.startsWith('/api/') && !isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On auth error, redirect to login for protected routes
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    ) || adminRoutes.some(route => 
      pathname.startsWith(route)
    )
    
    if (isProtectedRoute) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      } else {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }
    
    return NextResponse.next()
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}