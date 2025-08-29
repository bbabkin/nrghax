import { NextRequest } from 'next/server';
import { adminMiddleware } from '@/middleware/admin';
import { authMiddleware } from '@/middleware/auth';

// Combined middleware that handles different route types
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return await adminMiddleware(request);
  }

  // Handle auth routes (prevent authenticated users from accessing login/register)
  if (pathname === '/login' || pathname === '/register') {
    return await authMiddleware(request);
  }
  
  // Default: continue to the route
  return;
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    // Admin routes (pages and API)
    '/admin/:path*',
    '/api/admin/:path*',
    
    // Auth routes (prevent authenticated users from accessing)
    '/login',
    '/register',
  ],
};