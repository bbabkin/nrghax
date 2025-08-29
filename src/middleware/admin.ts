import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createAuditLog, AuditAction, AuditLogEntry } from '@/lib/admin/audit';

// Admin-only routes that require admin privileges
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin'
];

// Check if the path requires admin access
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

// Admin middleware for route protection
export async function adminMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip if not an admin route
  if (!isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get the user token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET! 
    });

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      
      // Log unauthorized access attempt
      await createAuditLog({
        userId: 'anonymous',
        userEmail: 'anonymous',
        action: AuditAction.UNAUTHORIZED_ACCESS,
        details: {
          attemptedResource: pathname,
          method: request.method,
          reason: 'No authentication token',
          redirected: true
        },
        severity: 'warning'
      }, request);

      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    const userRole = token.role as string;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAdmin) {
      // Log unauthorized access attempt
      await createAuditLog({
        userId: token.sub as string,
        userEmail: token.email as string,
        action: AuditAction.UNAUTHORIZED_ACCESS,
        details: {
          attemptedResource: pathname,
          method: request.method,
          userRole,
          requiredRole: 'admin',
          reason: 'Insufficient privileges'
        },
        severity: 'critical'
      }, request);

      // For API routes, return 403 JSON response
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            message: 'You do not have permission to access this resource.' 
          },
          { status: 403 }
        );
      }

      // For page routes, redirect to access denied page
      const accessDeniedUrl = new URL('/access-denied', request.url);
      accessDeniedUrl.searchParams.set('reason', 'admin_required');
      return NextResponse.redirect(accessDeniedUrl);
    }

    // User is authenticated and has admin role, allow access
    // Log successful admin access for audit trail
    await createAuditLog({
      userId: token.sub as string,
      userEmail: token.email as string,
      action: AuditAction.ADMIN_LOGIN,
      details: {
        accessedResource: pathname,
        method: request.method,
        userRole,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    }, request);

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-admin-id', token.sub as string);
    response.headers.set('x-admin-email', token.email as string);
    response.headers.set('x-admin-role', userRole);

    return response;

  } catch (error) {
    console.error('Admin middleware error:', error);
    
    // Log the error
    try {
      await createAuditLog({
        userId: 'system',
        userEmail: 'system',
        action: AuditAction.DATABASE_ERROR,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'admin_middleware_check',
          pathname,
          method: request.method
        },
        severity: 'critical'
      }, request);
    } catch (auditError) {
      console.error('Failed to log middleware error:', auditError);
    }

    // Return 500 error for API routes
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { 
          error: 'Internal Server Error', 
          message: 'Authentication check failed.' 
        },
        { status: 500 }
      );
    }

    // Redirect to error page for regular routes
    const errorUrl = new URL('/error', request.url);
    errorUrl.searchParams.set('code', '500');
    return NextResponse.redirect(errorUrl);
  }
}

// Utility function to check admin permissions in API routes
export async function checkAdminPermission(request: NextRequest): Promise<{
  isAuthorized: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
}> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET! 
    });

    if (!token) {
      return {
        isAuthorized: false,
        error: 'No authentication token'
      };
    }

    const userRole = token.role as string;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    if (!isAdmin) {
      return {
        isAuthorized: false,
        error: 'Insufficient privileges'
      };
    }

    return {
      isAuthorized: true,
      user: {
        id: token.sub as string,
        email: token.email as string,
        role: userRole
      }
    };
  } catch (error) {
    return {
      isAuthorized: false,
      error: 'Authentication check failed'
    };
  }
}

// Rate limiting for admin operations
const adminActionCounts = new Map<string, { count: number; resetTime: number }>();

export function checkAdminRateLimit(adminId: string, maxActions = 100, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const userActions = adminActionCounts.get(adminId);

  if (!userActions || now > userActions.resetTime) {
    // Reset or initialize counter
    adminActionCounts.set(adminId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userActions.count >= maxActions) {
    return false; // Rate limit exceeded
  }

  userActions.count++;
  return true;
}

// Clean up expired rate limit entries (should be called periodically)
export function cleanupRateLimitCounters(): void {
  const now = Date.now();
  Array.from(adminActionCounts.entries()).forEach(([adminId, actions]) => {
    if (now > actions.resetTime) {
      adminActionCounts.delete(adminId);
    }
  });
}