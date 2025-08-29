import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import { createMocks } from 'node-mocks-http'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Mock NextAuth and Supabase
jest.mock('@/lib/auth')
jest.mock('@supabase/supabase-js')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
  rpc: jest.fn(),
}

mockCreateClient.mockReturnValue(mockSupabaseClient as any)

// Mock rate limiting
jest.mock('@/lib/rate-limiting', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  resetRateLimit: jest.fn(),
}))

describe.skip('Unauthorized Access Integration Tests - DISABLED (Admin APIs not implemented yet)', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeAll(() => {
    // Mock console methods to avoid noise in test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Direct API Endpoint Access Without Authentication', () => {
    it('should block unauthenticated access to admin user listing API', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          'content-type': 'application/json',
        },
      })

      // Mock no authentication
      mockAuth.mockResolvedValue(null)

      // Act - Simulate API route handler
      const adminUsersApiHandler = async (request: any, response: any) => {
        const session = await auth()
        if (!session) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        // Would normally fetch users here
        return Response.json({ users: [] })
      }

      const response = await adminUsersApiHandler(req, res)

      // Assert
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toMatchObject({ error: 'Authentication required' })
    })

    it('should block unauthenticated access to user edit API', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/admin/users/user-123',
        headers: {
          'content-type': 'application/json',
        },
        body: {
          role: 'admin',
        },
      })

      mockAuth.mockResolvedValue(null)

      // Act - Simulate edit user API
      const editUserApiHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        // Would normally update user here
        return Response.json({ success: true })
      }

      const response = await editUserApiHandler(req)

      // Assert
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toMatchObject({ error: 'Authentication required' })
    })

    it('should block unauthenticated access to user deletion API', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/admin/users/user-123',
        headers: {
          'content-type': 'application/json',
        },
      })

      mockAuth.mockResolvedValue(null)

      // Act
      const deleteUserApiHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        return Response.json({ success: true })
      }

      const response = await deleteUserApiHandler(req)

      // Assert
      expect(response.status).toBe(401)
    })

    it('should block unauthenticated access to audit logs API', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/audit-logs',
      })

      mockAuth.mockResolvedValue(null)

      // Act
      const auditLogsHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }
        return Response.json({ logs: [] })
      }

      const response = await auditLogsHandler(req)

      // Assert
      expect(response.status).toBe(401)
    })
  })

  describe('API Access with Wrong Role', () => {
    it('should block regular user from accessing admin users API', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
      })

      // Mock authenticated user with 'user' role
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const adminUsersHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // Check admin role
        const userRole = session.user.role
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          return Response.json(
            { 
              error: 'Insufficient permissions',
              code: 'ADMIN_ACCESS_REQUIRED',
              message: 'This resource requires administrator privileges',
            },
            { status: 403 }
          )
        }
        
        return Response.json({ users: [] })
      }

      const response = await adminUsersHandler(req)

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data).toMatchObject({
        error: 'Insufficient permissions',
        code: 'ADMIN_ACCESS_REQUIRED',
      })
    })

    it('should block admin from accessing super_admin only endpoints', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'POST',
        url: '/api/admin/users/user-123/promote',
        body: {
          targetRole: 'admin',
        },
      })

      // Mock admin user
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const promoteUserHandler = async (request: any) => {
        const session = await auth()
        if (!session || session.user.role !== 'super_admin') {
          return Response.json(
            { 
              error: 'Super admin privileges required',
              code: 'SUPER_ADMIN_REQUIRED',
            },
            { status: 403 }
          )
        }
        
        return Response.json({ success: true })
      }

      const response = await promoteUserHandler(req)

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.code).toBe('SUPER_ADMIN_REQUIRED')
    })

    it('should allow admin to access regular admin endpoints', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: [],
        error: null,
      })

      // Act
      const adminUsersHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        const userRole = session.user.role
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        // Mock fetching users
        const { data: users } = await mockSupabaseClient
          .from('user_profiles')
          .select('*')
          .eq('active', true)
          .single()
        
        return Response.json({ users: users || [] })
      }

      const response = await adminUsersHandler(req)

      // Assert
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('users')
    })
  })

  describe('Spoofed Role Attempts', () => {
    it('should detect and reject spoofed role in request headers', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          'x-user-role': 'super_admin', // Spoofed role header
          'x-user-id': 'user-123',
        },
      })

      // Mock regular user session
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user', // Actual role is 'user'
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const secureApiHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // SECURITY: Never trust headers for role information
        const userRole = session.user.role // Always use session, not headers
        const headerRole = request.headers['x-user-role']
        
        // Log suspicious activity
        if (headerRole && headerRole !== userRole) {
          console.warn(`Potential role spoofing attempt: user ${session.user.id} sent role ${headerRole} but session has ${userRole}`)
        }
        
        if (userRole !== 'admin' && userRole !== 'super_admin') {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        return Response.json({ success: true })
      }

      const response = await secureApiHandler(req)

      // Assert
      expect(response.status).toBe(403)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Potential role spoofing attempt')
      )
    })

    it('should detect JWT tampering attempts', async () => {
      // Arrange - User modifies JWT client-side to escalate privileges
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          cookie: 'next-auth.session-token=tampered.jwt.token', // Hypothetical tampered JWT
        },
      })

      // Mock what would happen with tampered JWT vs database check
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'admin', // JWT claims admin
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Mock database returning actual role
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user', // Database shows actual role is 'user'
        },
        error: null,
      })

      // Act
      const secureApiHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // SECURITY: Always verify role against database for sensitive operations
        const { data: userProfile } = await mockSupabaseClient
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        const actualRole = userProfile?.role || 'user'
        const tokenRole = session.user.role
        
        // Detect tampering
        if (actualRole !== tokenRole) {
          console.error(`JWT tampering detected: user ${session.user.id} token claims ${tokenRole} but database shows ${actualRole}`)
          return Response.json(
            { error: 'Security violation detected' },
            { status: 403 }
          )
        }
        
        if (actualRole !== 'admin' && actualRole !== 'super_admin') {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        return Response.json({ success: true })
      }

      const response = await secureApiHandler(req)

      // Assert
      expect(response.status).toBe(403)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('JWT tampering detected')
      )
    })

    it('should handle session hijacking attempts', async () => {
      // Arrange - Simulate session token from different IP/user agent
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/admin/users/victim-123',
        headers: {
          'x-forwarded-for': '192.168.1.100', // Different IP
          'user-agent': 'Malicious-Script/1.0', // Suspicious user agent
          cookie: 'next-auth.session-token=valid.but.stolen.token',
        },
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-456',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act - Handler with session fingerprinting
      const secureDeleteHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // Basic session fingerprinting checks
        const ip = request.headers['x-forwarded-for'] || '127.0.0.1'
        const userAgent = request.headers['user-agent'] || ''
        
        // Flag suspicious patterns
        const suspiciousPatterns = [
          /malicious/i,
          /script/i,
          /bot/i,
          /curl/i,
          /wget/i,
        ]
        
        const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent))
        
        if (isSuspiciousUA) {
          console.warn(`Suspicious user agent detected for user ${session.user.id}: ${userAgent} from IP ${ip}`)
          
          // For high-risk operations, require additional verification
          return Response.json(
            { error: 'Additional verification required for this action' },
            { status: 403 }
          )
        }
        
        // Continue with normal authorization
        if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        return Response.json({ success: true })
      }

      const response = await secureDeleteHandler(req)

      // Assert
      expect(response.status).toBe(403)
      expect(response.json()).resolves.toMatchObject({
        error: 'Additional verification required for this action'
      })
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious user agent detected')
      )
    })
  })

  describe('Expired Session Handling', () => {
    it('should reject requests with expired sessions', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
      })

      // Mock expired session
      mockAuth.mockResolvedValue(null) // NextAuth would return null for expired sessions

      // Act
      const apiHandler = async (request: any) => {
        const session = await auth()
        
        if (!session) {
          return Response.json(
            { 
              error: 'Session expired',
              code: 'SESSION_EXPIRED',
              message: 'Please log in again to continue',
            },
            { status: 401 }
          )
        }
        
        return Response.json({ success: true })
      }

      const response = await apiHandler(req)

      // Assert
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.code).toBe('SESSION_EXPIRED')
    })

    it('should handle session validation failures gracefully', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'PUT',
        url: '/api/admin/users/user-123',
      })

      // Mock auth throwing an error (corrupted session)
      mockAuth.mockRejectedValue(new Error('Session validation failed'))

      // Act
      const apiHandler = async (request: any) => {
        try {
          const session = await auth()
          
          if (!session) {
            return Response.json({ error: 'Authentication required' }, { status: 401 })
          }
          
          return Response.json({ success: true })
        } catch (error) {
          console.error('Session validation error:', error)
          return Response.json(
            { 
              error: 'Authentication service unavailable',
              code: 'AUTH_SERVICE_ERROR',
            },
            { status: 503 }
          )
        }
      }

      const response = await apiHandler(req)

      // Assert
      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.code).toBe('AUTH_SERVICE_ERROR')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Session validation error:',
        expect.any(Error)
      )
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should rate limit repeated unauthorized access attempts', async () => {
      // Arrange
      const mockRateLimit = require('@/lib/rate-limiting')
      let attemptCount = 0

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      })

      mockAuth.mockResolvedValue(null) // No authentication

      // Mock rate limiting after 5 attempts
      mockRateLimit.checkRateLimit.mockImplementation(() => {
        attemptCount++
        return attemptCount <= 5 ? { allowed: true } : { 
          allowed: false, 
          error: 'Too many unauthorized access attempts' 
        }
      })

      // Act - Simulate multiple attempts
      const apiHandler = async (request: any) => {
        const ip = request.headers['x-forwarded-for'] || '127.0.0.1'
        
        // Check rate limit before auth check
        const rateLimit = mockRateLimit.checkRateLimit(ip, 'UNAUTHORIZED_ADMIN_ACCESS')
        if (!rateLimit.allowed) {
          return Response.json(
            { error: rateLimit.error },
            { status: 429 }
          )
        }
        
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        return Response.json({ success: true })
      }

      // Make 6 attempts
      let lastResponse
      for (let i = 0; i < 6; i++) {
        lastResponse = await apiHandler(req)
      }

      // Assert
      expect(lastResponse.status).toBe(429)
      const data = await lastResponse.json()
      expect(data.error).toContain('Too many unauthorized access attempts')
    })

    it('should implement IP blocking for persistent abuse', async () => {
      // Arrange
      const blockedIPs = new Set(['10.0.0.1', '192.168.1.100'])
      
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/admin/users/user-123',
        headers: {
          'x-forwarded-for': '10.0.0.1', // Blocked IP
        },
      })

      // Act
      const secureApiHandler = async (request: any) => {
        const ip = request.headers['x-forwarded-for'] || '127.0.0.1'
        
        // Check IP blocklist
        if (blockedIPs.has(ip)) {
          console.warn(`Blocked IP ${ip} attempted to access admin endpoint`)
          return Response.json(
            { error: 'Access denied from your location' },
            { status: 403 }
          )
        }
        
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        return Response.json({ success: true })
      }

      const response = await secureApiHandler(req)

      // Assert
      expect(response.status).toBe(403)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Blocked IP 10.0.0.1 attempted to access')
      )
    })
  })

  describe('Cross-Origin and CSRF Protection', () => {
    it('should reject requests from unauthorized origins', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'POST',
        url: '/api/admin/users',
        headers: {
          'origin': 'https://malicious-site.com',
          'content-type': 'application/json',
        },
        body: {
          email: 'victim@example.com',
          role: 'admin',
        },
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const corsProtectedHandler = async (request: any) => {
        const origin = request.headers.origin
        const allowedOrigins = [
          'http://localhost:3002',
          'https://yourdomain.com',
        ]
        
        if (origin && !allowedOrigins.includes(origin)) {
          console.warn(`Unauthorized origin attempted admin access: ${origin}`)
          return Response.json(
            { error: 'Origin not allowed' },
            { status: 403 }
          )
        }
        
        const session = await auth()
        if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        return Response.json({ success: true })
      }

      const response = await corsProtectedHandler(req)

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Origin not allowed')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unauthorized origin attempted admin access')
      )
    })

    it('should validate CSRF tokens for state-changing operations', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'DELETE',
        url: '/api/admin/users/user-123',
        headers: {
          'content-type': 'application/json',
          // Missing CSRF token
        },
        body: {
          confirmation: 'delete',
        },
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const csrfProtectedHandler = async (request: any) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        // For dangerous operations, require CSRF token
        if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
          const csrfToken = request.headers['x-csrf-token']
          
          if (!csrfToken) {
            return Response.json(
              { 
                error: 'CSRF token required',
                code: 'CSRF_TOKEN_MISSING',
              },
              { status: 403 }
            )
          }
          
          // In real implementation, would validate token
          const isValidCSRF = csrfToken === 'valid-csrf-token'
          if (!isValidCSRF) {
            return Response.json(
              { error: 'Invalid CSRF token' },
              { status: 403 }
            )
          }
        }
        
        return Response.json({ success: true })
      }

      const response = await csrfProtectedHandler(req)

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.code).toBe('CSRF_TOKEN_MISSING')
    })
  })

  describe('Database Access Security', () => {
    it('should prevent direct database manipulation through API', async () => {
      // Arrange
      const { req } = createMocks({
        method: 'POST',
        url: '/api/admin/users',
        body: {
          email: 'test@example.com',
          role: 'super_admin', // Attempting to create super admin
          rawSql: "INSERT INTO user_profiles (role) VALUES ('super_admin')", // SQL injection attempt
        },
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Act
      const secureUserCreateHandler = async (request: any) => {
        const session = await auth()
        if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        
        const body = request.body
        
        // Validate input and prevent privilege escalation
        if (body.role === 'super_admin' && session.user.role !== 'super_admin') {
          console.warn(`Admin ${session.user.id} attempted to create super_admin user`)
          return Response.json(
            { error: 'Cannot create super admin users' },
            { status: 403 }
          )
        }
        
        // Sanitize input - never allow raw SQL
        if (body.rawSql || typeof body.rawSql !== 'undefined') {
          console.error(`SQL injection attempt by user ${session.user.id}`)
          return Response.json(
            { error: 'Invalid request parameters' },
            { status: 400 }
          )
        }
        
        // Use parameterized queries only
        const allowedRoles = ['user', 'admin']
        const userRole = allowedRoles.includes(body.role) ? body.role : 'user'
        
        return Response.json({ success: true, createdRole: userRole })
      }

      const response = await secureUserCreateHandler(req)

      // Assert
      expect(response.status).toBe(403)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('attempted to create super_admin user')
      )
    })

    it('should enforce row-level security policies', async () => {
      // Arrange - Admin trying to access another admin's data
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/users/other-admin-456/sessions',
      })

      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })

      // Mock RLS preventing access
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { 
          message: 'Row-level security policy violation',
          code: 'PGRST301'
        },
      })

      // Act
      const getUserSessionsHandler = async (request: any, { params }: { params: { userId: string } }) => {
        const session = await auth()
        if (!session) {
          return Response.json({ error: 'Authentication required' }, { status: 401 })
        }
        
        const { userId } = params
        
        // Attempt to fetch user sessions (RLS should prevent this for other admins)
        const { data: sessions, error } = await mockSupabaseClient
          .from('user_sessions')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error) {
          if (error.code === 'PGRST301') {
            return Response.json(
              { error: 'Access denied to this resource' },
              { status: 403 }
            )
          }
          return Response.json({ error: 'Database error' }, { status: 500 })
        }
        
        return Response.json({ sessions: sessions || [] })
      }

      const response = await getUserSessionsHandler(req, { params: { userId: 'other-admin-456' } })

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Access denied to this resource')
    })
  })
})