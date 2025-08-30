import { NextRequest } from 'next/server';
import { supabaseAuthMiddleware } from '@/middleware/supabase-auth';

// Middleware using Supabase Auth
export async function middleware(request: NextRequest) {
  return await supabaseAuthMiddleware(request);
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    // Admin routes (pages and API)
    '/admin/:path*',
    '/api/admin/:path*',
    
    // Dashboard routes  
    '/dashboard/:path*',
    
    // Auth routes (prevent authenticated users from accessing)
    '/login',
    '/register',
  ],
};