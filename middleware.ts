import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/user',
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
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  
  console.log(`Middleware: ${pathname}, Authenticated: ${isLoggedIn}`)
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if it's an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if it's a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Allow public API routes
  if (isPublicApiRoute) {
    return NextResponse.next()
  }
  
  // If user is trying to access auth pages while logged in, redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  
  // If user is trying to access protected routes while not logged in, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/login?redirect=${redirectUrl}`, req.url))
  }
  
  // For protected API routes, return 401 if not authenticated
  if (pathname.startsWith('/api/') && !isPublicApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return NextResponse.next()
})

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