import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Auth routes that authenticated users should not access
const AUTH_ROUTES = ['/login', '/register'];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Get the session token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET! 
    });

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (token && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Allow the request to continue
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // On error, allow the request to continue
    return NextResponse.next();
  }
}