import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { adminMiddleware } from './admin'

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

// Mock NextResponse
const mockRedirect = jest.fn()
const mockNext = jest.fn()
const mockJson = jest.fn()

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string) => mockRedirect(url),
    next: () => mockNext(),
    json: (data: any, options?: any) => mockJson(data, options),
  },
}))

describe('Admin Middleware', () => {
  let mockRequest: Partial<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock request
    mockRequest = {
      nextUrl: {
        pathname: '/admin',
        origin: 'http://localhost:3002',
      },
      url: 'http://localhost:3002/admin',
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'test-agent',
      }),
    }
  })

  describe('Authentication Protection', () => {
    it('should redirect unauthenticated users to login with proper redirect URL', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: null,
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/login?redirect=%2Fadmin%2Fusers', mockRequest.url)
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 401 for unauthenticated API requests to admin endpoints', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: null,
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 }
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should include proper security headers in 401 response', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: null,
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        expect.objectContaining({
          status: 401,
          headers: expect.objectContaining({
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
          }),
        })
      )
    })
  })

  describe('Role-Based Authorization', () => {
    it('should block regular users from accessing admin routes', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=access_denied', mockRequest.url)
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should return 403 for regular users accessing admin API endpoints', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        { 
          error: 'Insufficient permissions',
          code: 'ADMIN_ACCESS_REQUIRED',
          message: 'This resource requires administrator privileges',
        },
        { status: 403 }
      )
    })

    it('should allow admin users to access admin routes', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should allow super_admin users to access admin routes', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'superadmin-123',
            email: 'superadmin@example.com',
            role: 'super_admin',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockRedirect).not.toHaveBeenCalled()
      expect(mockJson).not.toHaveBeenCalled()
    })

    it('should handle malformed or missing role gracefully', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            // No role field
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL('/dashboard?error=access_denied', mockRequest.url)
      )
    })
  })

  describe('Security Headers and CORS', () => {
    it('should add proper security headers for admin routes', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act
      const response = await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(response.headers).toMatchObject({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': expect.stringContaining("default-src 'self'"),
      })
    })

    it('should handle CORS for admin API endpoints', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockRequest.method = 'OPTIONS'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act
      const response = await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(response.headers).toMatchObject({
        'Access-Control-Allow-Origin': 'http://localhost:3002',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      })
    })

    it('should reject requests with suspicious origins', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockRequest.headers = new Headers({
        'origin': 'https://malicious-site.com',
        'x-forwarded-for': '127.0.0.1',
      })
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Origin not allowed' },
        { status: 403 }
      )
    })
  })

  describe('Route Pattern Matching', () => {
    it('should protect all /admin/* routes', async () => {
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/users/123',
        '/admin/dashboard',
        '/admin/settings',
        '/admin/audit-logs',
      ]

      for (const route of adminRoutes) {
        // Arrange
        mockRequest.nextUrl!.pathname = route
        mockAuth.mockImplementation((req) => ({
          ...req,
          auth: null,
        }))

        // Act
        await adminMiddleware(mockRequest as NextRequest)

        // Assert
        expect(mockRedirect).toHaveBeenCalledWith(
          new URL(`/login?redirect=${encodeURIComponent(route)}`, mockRequest.url)
        )
      }
    })

    it('should protect all /api/admin/* routes', async () => {
      const adminApiRoutes = [
        '/api/admin/users',
        '/api/admin/users/123',
        '/api/admin/audit-logs',
        '/api/admin/settings',
      ]

      for (const route of adminApiRoutes) {
        // Reset mocks
        jest.clearAllMocks()
        
        // Arrange
        mockRequest.nextUrl!.pathname = route
        mockAuth.mockImplementation((req) => ({
          ...req,
          auth: null,
        }))

        // Act
        await adminMiddleware(mockRequest as NextRequest)

        // Assert
        expect(mockJson).toHaveBeenCalledWith(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    })

    it('should not interfere with non-admin routes', async () => {
      const publicRoutes = [
        '/dashboard',
        '/profile',
        '/api/auth/session',
        '/api/user/profile',
        '/',
        '/login',
      ]

      for (const route of publicRoutes) {
        // Reset mocks
        jest.clearAllMocks()
        
        // Arrange
        mockRequest.nextUrl!.pathname = route

        // Act
        await adminMiddleware(mockRequest as NextRequest)

        // Assert - Should call next() without any redirects or errors
        expect(mockNext).toHaveBeenCalled()
        expect(mockRedirect).not.toHaveBeenCalled()
        expect(mockJson).not.toHaveBeenCalled()
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle auth service failures gracefully', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation(() => {
        throw new Error('Auth service unavailable')
      })

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      )
    })

    it('should log security violations for audit purposes', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user',
          },
        },
      }))

      // Act
      await adminMiddleware(mockRequest as NextRequest)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Security violation: User user-123 (user@example.com) attempted to access /admin/users'
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle requests with no user agent', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockRequest.headers = new Headers({
        'x-forwarded-for': '127.0.0.1',
        // No user-agent header
      })
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act
      const response = await adminMiddleware(mockRequest as NextRequest)

      // Assert - Should still work but log the suspicious request
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Suspicious request: No user agent from IP 127.0.0.1'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should implement rate limiting for admin endpoints', async () => {
      // Arrange - Simulate multiple rapid requests from same IP
      mockRequest.nextUrl!.pathname = '/api/admin/users'
      mockRequest.headers = new Headers({
        'x-forwarded-for': '192.168.1.100',
      })
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      }))

      // Act - Simulate 20 requests in quick succession
      for (let i = 0; i < 20; i++) {
        await adminMiddleware(mockRequest as NextRequest)
      }

      // Assert - Should eventually rate limit
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Too many requests' },
        { status: 429 }
      )
    })

    it('should track failed authentication attempts', async () => {
      // Arrange
      mockRequest.nextUrl!.pathname = '/admin/users'
      mockAuth.mockImplementation((req) => ({
        ...req,
        auth: null,
      }))

      // Act - Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await adminMiddleware(mockRequest as NextRequest)
      }

      // Assert - Should eventually block the IP
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'IP blocked due to repeated unauthorized access attempts' },
        { status: 429 }
      )
    })
  })
})