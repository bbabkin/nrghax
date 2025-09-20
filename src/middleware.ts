import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple middleware that doesn't require Auth.js
// Auth checks will be done in the page components/route handlers
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow API routes and auth callbacks
  if (pathname.startsWith('/api/auth') || pathname === '/auth') {
    return NextResponse.next()
  }

  // For now, just pass through all requests
  // Auth checks are handled in individual pages
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}