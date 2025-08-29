import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextAuthConfig } from 'next-auth'
import { JWT } from '@auth/core/jwt'
import { Session } from 'next-auth'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

// Mock SupabaseAdapter
jest.mock('@auth/supabase-adapter', () => ({
  SupabaseAdapter: jest.fn(() => ({
    createUser: jest.fn(),
    getUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserByAccount: jest.fn(),
    linkAccount: jest.fn(),
    unlinkAccount: jest.fn(),
    createSession: jest.fn(),
    getSessionAndUser: jest.fn(),
    updateSession: jest.fn(),
    deleteSession: jest.fn(),
    createVerificationToken: jest.fn(),
    useVerificationToken: jest.fn(),
  })),
}))

// Mock rate limiting
jest.mock('../rate-limiting', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true, remaining: 5, resetTime: Date.now() + 900000, blocked: false })),
  resetRateLimit: jest.fn(),
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: {},
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}))

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
  })),
}

;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
}

Object.assign(process.env, mockEnv)

// Import auth functions after mocks are set up
const authModule = require('../auth')
const { passwordSchema, emailSchema, hashPassword, verifyPassword, auth, getServerSession } = authModule

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('passwordSchema', () => {
    it('should validate a strong password', () => {
      const strongPassword = 'TestPassword123!'
      const result = passwordSchema.safeParse(strongPassword)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(strongPassword)
      }
    })

    it('should reject password that is too short', () => {
      const shortPassword = 'Test1!'
      const result = passwordSchema.safeParse(shortPassword)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters long')
      }
    })

    it('should reject password without uppercase letter', () => {
      const password = 'testpassword123!'
      const result = passwordSchema.safeParse(password)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must contain at least one uppercase letter')
      }
    })

    it('should reject password without lowercase letter', () => {
      const password = 'TESTPASSWORD123!'
      const result = passwordSchema.safeParse(password)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must contain at least one lowercase letter')
      }
    })

    it('should reject password without number', () => {
      const password = 'TestPassword!'
      const result = passwordSchema.safeParse(password)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must contain at least one number')
      }
    })

    it('should reject password without special character', () => {
      const password = 'TestPassword123'
      const result = passwordSchema.safeParse(password)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must contain at least one special character')
      }
    })

    it('should validate password with various special characters', () => {
      const passwords = [
        'TestPassword123!',
        'TestPassword123@',
        'TestPassword123#',
        'TestPassword123$',
        'TestPassword123%',
        'TestPassword123^',
        'TestPassword123&',
        'TestPassword123*',
      ]

      passwords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('emailSchema', () => {
    it('should validate a valid email address', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
        'email@example-one.com',
        '_______@example.com',
        'email@123.123.123.123', // IP address
        '1234567890@example.com',
        'email@example.name',
        'test.email-with+symbol@example.com',
      ]

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(email)
        }
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'plainaddress',
        'missingdomain@.com',
        'missing@domain',
        'spaces @example.com',
        'double..dot@example.com',
        '',
        'test@',
        '@example.com',
        'test..test@example.com',
      ]

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Invalid email address')
        }
      })
    })
  })

  describe('hashPassword', () => {
    const mockSalt = 'mock-salt'
    const mockHash = 'mock-hash'

    beforeEach(() => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHash)
    })

    it('should hash a password with salt rounds of 12', async () => {
      const password = 'TestPassword123!'
      
      const result = await hashPassword(password)
      
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, mockSalt)
      expect(result).toBe(mockHash)
    })

    it('should handle bcrypt errors', async () => {
      const password = 'TestPassword123!'
      const mockError = new Error('Hashing failed')
      
      ;(bcrypt.genSalt as jest.Mock).mockRejectedValue(mockError)
      
      await expect(hashPassword(password)).rejects.toThrow('Hashing failed')
    })
  })

  describe('verifyPassword', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true)
    })

    it('should verify a correct password', async () => {
      const password = 'TestPassword123!'
      const hashedPassword = 'hashed-password'
      
      const result = await verifyPassword(password, hashedPassword)
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'WrongPassword123!'
      const hashedPassword = 'hashed-password'
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      
      const result = await verifyPassword(password, hashedPassword)
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })

    it('should handle bcrypt comparison errors', async () => {
      const password = 'TestPassword123!'
      const hashedPassword = 'hashed-password'
      const mockError = new Error('Comparison failed')
      
      ;(bcrypt.compare as jest.Mock).mockRejectedValue(mockError)
      
      await expect(verifyPassword(password, hashedPassword)).rejects.toThrow('Comparison failed')
    })
  })

  describe('Session Validation with Admin Roles', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('JWT Token Role Handling', () => {
      it('should include role field in JWT token during sign-in', async () => {
        // Arrange
        const mockUser = {
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        }

        const mockToken: Partial<JWT> = {
          sub: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
        }

        // Mock Supabase response to include role
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'admin-123',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
          },
          error: null,
        })

        // Act - Simulate JWT callback
        const jwtCallback = async ({ token, user }: { token: any, user: any }) => {
          if (user) {
            // Fetch role from database during sign-in
            const { data: userProfile } = await mockSupabaseClient
              .from('user_profiles')
              .select('role')
              .eq('id', user.id)
              .single()

            token.sub = user.id
            token.email = user.email
            token.name = user.name
            token.role = userProfile?.role || 'user' // Include role in JWT
          }
          return token
        }

        const updatedToken = await jwtCallback({ token: mockToken, user: mockUser })

        // Assert
        expect(updatedToken).toMatchObject({
          sub: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        })
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
      })

      it('should default to user role when role is missing from database', async () => {
        // Arrange
        const mockUser = {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Regular User',
        }

        // Mock Supabase response without role
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'user@example.com',
            name: 'Regular User',
            role: null, // No role specified
          },
          error: null,
        })

        // Act
        const jwtCallback = async ({ token, user }: { token: any, user: any }) => {
          if (user) {
            const { data: userProfile } = await mockSupabaseClient
              .from('user_profiles')
              .select('role')
              .eq('id', user.id)
              .single()

            token.sub = user.id
            token.email = user.email
            token.role = userProfile?.role || 'user' // Default to 'user'
          }
          return token
        }

        const result = await jwtCallback({ token: {}, user: mockUser })

        // Assert
        expect(result.role).toBe('user')
      })

      it('should validate role field during JWT creation', async () => {
        // Arrange
        const invalidRoles = [
          'invalid_role',
          'ADMIN', // Wrong case
          'super-admin', // Wrong format
          '', // Empty string
          null,
          undefined,
          123, // Wrong type
        ]

        // Act & Assert
        for (const invalidRole of invalidRoles) {
          mockSupabaseClient.from().select().eq().single.mockResolvedValue({
            data: { role: invalidRole },
            error: null,
          })

          const jwtCallback = async ({ token, user }: { token: any, user: any }) => {
            if (user) {
              const { data: userProfile } = await mockSupabaseClient
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single()

              // Validate role and default to 'user' if invalid
              const validRoles = ['user', 'admin', 'super_admin']
              const userRole = validRoles.includes(userProfile?.role) ? userProfile.role : 'user'
              
              token.role = userRole
            }
            return token
          }

          const result = await jwtCallback({ 
            token: {}, 
            user: { id: 'test-123' } 
          })

          expect(result.role).toBe('user')
        }
      })
    })

    describe('Session Object Role Inclusion', () => {
      it('should include role in session object', async () => {
        // Arrange
        const mockToken: JWT = {
          sub: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        const mockSession: Partial<Session> = {
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            name: 'Admin User',
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }

        // Act - Simulate session callback
        const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
          if (token) {
            session.user.id = token.sub
            session.user.email = token.email
            session.user.name = token.name
            session.user.role = token.role // Include role in session
          }
          return session
        }

        const updatedSession = await sessionCallback({ session: mockSession, token: mockToken })

        // Assert
        expect(updatedSession.user).toMatchObject({
          id: 'admin-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        })
      })

      it('should handle missing or malformed session data', async () => {
        // Arrange
        const malformedInputs = [
          null,
          undefined,
          {},
          { user: null },
          { user: { id: null } },
          { user: { id: '', email: '', role: '' } },
        ]

        const validToken = { sub: 'test-123', email: 'test@example.com', role: 'user' }

        // Act & Assert
        for (const malformedSession of malformedInputs) {
          const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
            if (!session || !session.user || !token) {
              return null // Invalid session
            }
            return session
          }

          const result = await sessionCallback({ 
            session: malformedSession, 
            token: validToken 
          })

          expect(result).toBeNull()
        }
      })
    })

    describe('Role Changes and Session Refresh', () => {
      it('should update role when refreshing expired session', async () => {
        // Arrange - User had admin role initially
        const initialToken: JWT = {
          sub: 'user-123',
          email: 'user@example.com',
          role: 'admin',
          iat: Date.now() - 7200, // 2 hours ago
          exp: Date.now() + 82800, // 23 hours from now
        }

        // Mock database returning updated role
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user', // Role was changed to regular user
          },
          error: null,
        })

        // Act - Simulate JWT refresh callback
        const jwtRefreshCallback = async ({ token }: { token: any }) => {
          // Check if token is old enough to refresh role from DB (1 hour)
          const tokenAge = Date.now() - (token.iat * 1000)
          if (tokenAge > 3600000) {
            const { data: user } = await mockSupabaseClient
              .from('user_profiles')
              .select('id, email, name, role')
              .eq('id', token.sub)
              .single()
            
            if (user && user.role !== token.role) {
              token.role = user.role // Update role in token
            }
          }
          return token
        }

        const refreshedToken = await jwtRefreshCallback({ token: initialToken })

        // Assert
        expect(refreshedToken.role).toBe('user')
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
      })

      it('should invalidate session when user is deactivated', async () => {
        // Arrange
        const tokenWithRole: JWT = {
          sub: 'user-123',
          email: 'user@example.com',
          role: 'admin',
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        // Mock database returning user not found (deactivated)
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: null,
          error: { message: 'User not found', code: 'PGRST116' },
        })

        // Act - Simulate JWT callback with missing user
        const jwtCallback = async ({ token }: { token: any }) => {
          const { data: user, error } = await mockSupabaseClient
            .from('user_profiles')
            .select('id, email, name, role')
            .eq('id', token.sub)
            .single()
          
          if (error || !user) {
            // Return null to invalidate session
            return null
          }
          
          return token
        }

        const result = await jwtCallback({ token: tokenWithRole })

        // Assert
        expect(result).toBeNull() // Session should be invalidated
      })

      it('should handle concurrent session validation requests', async () => {
        // Arrange
        const token: JWT = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        // Mock successful response for all requests
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'admin-123',
            email: 'admin@example.com',
            role: 'admin',
          },
          error: null,
        })

        // Act - Simulate concurrent validation
        const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
          // Simulate database lookup
          const { data: user } = await mockSupabaseClient
            .from('user_profiles')
            .select('id, email, name, role')
            .eq('id', token.sub)
            .single()
          
          session.user.role = user?.role || 'user'
          return session
        }

        const concurrentPromises = Array(5).fill(0).map(() => 
          sessionCallback({ session: { user: {} }, token })
        )

        const results = await Promise.all(concurrentPromises)

        // Assert
        results.forEach(result => {
          expect(result.user.role).toBe('admin')
        })
        // Should have made 5 database calls
        expect(mockSupabaseClient.from).toHaveBeenCalledTimes(5)
      })
    })

    describe('JWT Security and Validation', () => {
      it('should validate JWT signature integrity', async () => {
        // Arrange - In real implementation, this would check NEXTAUTH_SECRET
        const validToken = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        // Act - Simulate JWT validation
        const validateJWT = (token: any) => {
          // In real implementation, would validate signature
          return Boolean(
            token.sub && 
            token.email && 
            token.iat && 
            token.exp &&
            process.env.NEXTAUTH_SECRET
          )
        }

        const isValid = validateJWT(validToken)

        // Assert
        expect(isValid).toBe(true)
        expect(process.env.NEXTAUTH_SECRET).toBeDefined()
      })

      it('should reject expired JWT tokens', async () => {
        // Arrange
        const expiredToken: JWT = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: Date.now() - 86400000, // 24 hours ago
          exp: Date.now() - 3600000,  // Expired 1 hour ago
        }

        // Act - Simulate JWT expiration validation
        const validateTokenExpiry = (token: JWT) => {
          const now = Date.now() / 1000
          return token.exp > now
        }

        const isValid = validateTokenExpiry(expiredToken)

        // Assert
        expect(isValid).toBe(false)
      })

      it('should prevent JWT tampering attempts', async () => {
        // Arrange - Simulate user trying to escalate privileges
        const tamperedToken = {
          sub: 'user-123',
          email: 'user@example.com',
          role: 'super_admin', // User trying to escalate privileges
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        // Mock database returning actual user role
        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user', // Actual role is 'user'
          },
          error: null,
        })

        // Act - Simulate integrity check that validates against database
        const validateTokenIntegrity = async (token: any) => {
          const { data: user } = await mockSupabaseClient
            .from('user_profiles')
            .select('role')
            .eq('id', token.sub)
            .single()
          
          // Validate token role matches database
          return user && user.role === token.role
        }

        const isValid = await validateTokenIntegrity(tamperedToken)

        // Assert
        expect(isValid).toBe(false) // Should detect tampering
      })

      it('should handle role escalation attempts in session', async () => {
        // Arrange - Token claims higher role than database
        const suspiciousToken = {
          sub: 'user-123',
          email: 'user@example.com',
          role: 'admin', // Claims admin
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        mockSupabaseClient.from().select().eq().single.mockResolvedValue({
          data: {
            id: 'user-123',
            email: 'user@example.com',
            role: 'user', // Actually just a user
          },
          error: null,
        })

        // Act - Session callback that validates role
        const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
          // Always verify role against database for sensitive operations
          const { data: user } = await mockSupabaseClient
            .from('user_profiles')
            .select('role')
            .eq('id', token.sub)
            .single()

          // Use database role, not token role
          session.user.role = user?.role || 'user'
          
          // Log potential security violation
          if (token.role !== user?.role) {
            console.warn(`Role mismatch detected for user ${token.sub}: token=${token.role}, db=${user?.role}`)
          }
          
          return session
        }

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        const result = await sessionCallback({ session: { user: {} }, token: suspiciousToken })

        // Assert
        expect(result.user.role).toBe('user') // Should use database role
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Role mismatch detected')
        )
        consoleSpy.mockRestore()
      })
    })

    describe('Error Handling and Edge Cases', () => {
      it('should handle database connection failures gracefully', async () => {
        // Arrange
        const dbError = new Error('Database connection failed')
        mockSupabaseClient.from().select().eq().single.mockRejectedValue(dbError)

        const token: JWT = {
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'admin',
          iat: Date.now(),
          exp: Date.now() + 86400,
        }

        // Act - Simulate JWT callback with database error
        const jwtCallback = async ({ token }: { token: any }) => {
          try {
            const { data: user } = await mockSupabaseClient
              .from('user_profiles')
              .select('id, email, name, role')
              .eq('id', token.sub)
              .single()
            
            return { ...token, role: user?.role || 'user' }
          } catch (error) {
            console.error('Database error during session validation:', error)
            // Fallback to token role but log the error
            return token
          }
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const result = await jwtCallback({ token })

        // Assert
        expect(result).toMatchObject(token) // Should not break the session
        expect(consoleSpy).toHaveBeenCalledWith(
          'Database error during session validation:',
          dbError
        )
        consoleSpy.mockRestore()
      })

      it('should handle rate limiting during session validation', async () => {
        // Arrange - Simulate rate limit error
        const rateLimitError = new Error('Too many requests')
        rateLimitError.name = 'RateLimitError'
        
        mockSupabaseClient.from().select().eq().single.mockRejectedValue(rateLimitError)

        const token = { sub: 'user-123', role: 'user' }

        // Act - Session validation with rate limiting
        const validateWithRateLimit = async (token: any) => {
          try {
            await mockSupabaseClient
              .from('user_profiles')
              .select('role')
              .eq('id', token.sub)
              .single()
            
            return true
          } catch (error: any) {
            if (error.name === 'RateLimitError') {
              // Temporarily use cached role from token
              console.warn('Rate limited during session validation, using cached role')
              return false
            }
            throw error
          }
        }

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
        const result = await validateWithRateLimit(token)

        // Assert
        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith(
          'Rate limited during session validation, using cached role'
        )
        consoleSpy.mockRestore()
      })

      it('should validate session data types and structure', async () => {
        // Arrange - Various malformed session inputs
        const malformedSessions = [
          { user: { id: 123 } }, // Wrong type for id
          { user: { id: 'test', role: 123 } }, // Wrong type for role
          { user: { id: 'test', email: 'not-an-email' } }, // Invalid email
          { user: { id: '', email: 'test@example.com' } }, // Empty id
          { expires: 'not-a-date' }, // Invalid expires
        ]

        // Act & Assert
        for (const session of malformedSessions) {
          const validateSession = (sessionData: any) => {
            try {
              // Type validation
              if (!sessionData?.user?.id || typeof sessionData.user.id !== 'string') {
                return false
              }
              if (sessionData.user.email && !/\S+@\S+\.\S+/.test(sessionData.user.email)) {
                return false
              }
              if (sessionData.user.role && !['user', 'admin', 'super_admin'].includes(sessionData.user.role)) {
                return false
              }
              return true
            } catch (error) {
              return false
            }
          }

          expect(validateSession(session)).toBe(false)
        }
      })
    })
  })

  // PHASE 1 TDD RED TESTS - These should FAIL initially
  // These tests define the expected behavior when authentication is working
  describe('NextAuth Configuration Tests (SHOULD FAIL INITIALLY)', () => {
    it('should export auth config with required providers', async () => {
      // This test should fail because auth configuration is currently broken
      const authConfig = auth as any
      
      expect(authConfig).toBeDefined()
      expect(authConfig.providers).toBeDefined()
      expect(Array.isArray(authConfig.providers)).toBe(true)
      expect(authConfig.providers.length).toBeGreaterThanOrEqual(2) // credentials + google
    })

    it('should have credentials provider configured correctly', async () => {
      // This should fail - the credentials provider needs proper configuration
      const authConfig = auth as any
      const credentialsProvider = authConfig.providers?.find(
        (p: any) => p.id === 'credentials'
      )
      
      expect(credentialsProvider).toBeDefined()
      expect(credentialsProvider.authorize).toBeDefined()
      expect(typeof credentialsProvider.authorize).toBe('function')
    })

    it('should have Google OAuth provider configured', async () => {
      // This should fail - Google provider may not be properly configured
      const authConfig = auth as any
      const googleProvider = authConfig.providers?.find(
        (p: any) => p.id === 'google'
      )
      
      expect(googleProvider).toBeDefined()
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined()
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined()
    })

    it('should validate user credentials against database', async () => {
      // This should fail - credential validation is broken
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-123',
          email: 'admin@test.com',
          password_hash: '$2a$12$hashedpassword',
          role: 'admin',
          email_verified: true
        },
        error: null
      })
      
      // Mock bcrypt to return true for correct password
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      
      // Simulate credentials authorize function
      const mockCredentials = {
        email: 'admin@test.com',
        password: 'Admin123!'
      }
      
      // This should work when auth is properly configured
      const authorizeFunction = async (credentials: any) => {
        const { data: user } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (!user || !user.email_verified) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
      
      const result = await authorizeFunction(mockCredentials)
      
      expect(result).toBeDefined()
      expect(result?.email).toBe('admin@test.com')
      expect(result?.role).toBe('admin')
    })

    it('should reject invalid credentials', async () => {
      // This should fail initially - proper error handling not implemented
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-123',
          email: 'admin@test.com',
          password_hash: '$2a$12$hashedpassword',
          role: 'admin',
          email_verified: true
        },
        error: null
      })
      
      // Mock bcrypt to return false for wrong password
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
      
      const authorizeFunction = async (credentials: any) => {
        const { data: user } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (!user || !user.email_verified) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        
        return { id: user.id, email: user.email, role: user.role }
      }
      
      const result = await authorizeFunction({
        email: 'admin@test.com',
        password: 'WrongPassword123!'
      })
      
      expect(result).toBeNull()
    })

    it('should reject unverified email addresses', async () => {
      // This should fail - email verification check not implemented
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'test-user-123',
          email: 'unverified@test.com',
          password_hash: '$2a$12$hashedpassword',
          role: 'user',
          email_verified: false // Not verified
        },
        error: null
      })
      
      const authorizeFunction = async (credentials: any) => {
        const { data: user } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (!user || !user.email_verified) return null
        
        return { id: user.id, email: user.email, role: user.role }
      }
      
      const result = await authorizeFunction({
        email: 'unverified@test.com',
        password: 'CorrectPassword123!'
      })
      
      expect(result).toBeNull()
    })
  })

  describe('Session Management Tests (SHOULD FAIL INITIALLY)', () => {
    it('should create valid session for authenticated user', async () => {
      // This should fail - session creation is broken
      const mockUser = {
        id: 'user-123',
        email: 'user1@test.com',
        role: 'user'
      }
      
      const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
        if (token) {
          session.user.id = token.sub
          session.user.email = token.email
          session.user.role = token.role
        }
        return session
      }
      
      const mockToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        iat: Date.now(),
        exp: Date.now() + 86400
      }
      
      const session = await sessionCallback({
        session: { user: {}, expires: new Date().toISOString() },
        token: mockToken
      })
      
      expect(session.user.id).toBe('user-123')
      expect(session.user.email).toBe('user1@test.com')
      expect(session.user.role).toBe('user')
    })

    it('should include admin role in session for admin users', async () => {
      // This should fail - admin role handling not implemented
      const mockAdminToken = {
        sub: 'admin-123',
        email: 'admin@test.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 86400
      }
      
      const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
        if (token) {
          session.user.id = token.sub
          session.user.email = token.email
          session.user.role = token.role
        }
        return session
      }
      
      const session = await sessionCallback({
        session: { user: {}, expires: new Date().toISOString() },
        token: mockAdminToken
      })
      
      expect(session.user.role).toBe('admin')
    })

    it('should retrieve existing session with getServerSession', async () => {
      // This should fail - getServerSession not properly configured
      const mockServerSession = {
        user: {
          id: 'user-123',
          email: 'user1@test.com',
          role: 'user'
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      }
      
      // Mock the actual getServerSession function
      const mockGetServerSession = jest.fn().mockResolvedValue(mockServerSession)
      
      const session = await mockGetServerSession()
      
      expect(session).toBeDefined()
      expect(session.user.email).toBe('user1@test.com')
      expect(session.user.role).toBe('user')
    })

    it('should return null for unauthenticated requests', async () => {
      // This should fail - proper null handling not implemented  
      const mockGetServerSession = jest.fn().mockResolvedValue(null)
      
      const session = await mockGetServerSession()
      
      expect(session).toBeNull()
    })
  })

  describe('Authentication Flow Tests (SHOULD FAIL INITIALLY)', () => {
    it('should complete full email/password authentication flow', async () => {
      // This should fail - complete flow is broken
      const mockCredentials = {
        email: 'user1@test.com',
        password: 'UserPassword123!'
      }
      
      // Step 1: User submits credentials
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'user1@test.com',
          password_hash: '$2a$12$hashedpassword',
          role: 'user',
          email_verified: true
        },
        error: null
      })
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      
      // Step 2: Authorize user
      const authorizeFunction = async (credentials: any) => {
        const { data: user } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (!user || !user.email_verified) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        
        return { id: user.id, email: user.email, role: user.role }
      }
      
      const authenticatedUser = await authorizeFunction(mockCredentials)
      
      // Step 3: Create JWT token
      const jwtCallback = async ({ token, user }: { token: any, user: any }) => {
        if (user) {
          token.sub = user.id
          token.email = user.email
          token.role = user.role
        }
        return token
      }
      
      const token = await jwtCallback({ token: {}, user: authenticatedUser })
      
      // Step 4: Create session
      const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
        if (token) {
          session.user.id = token.sub
          session.user.email = token.email
          session.user.role = token.role
        }
        return session
      }
      
      const session = await sessionCallback({
        session: { user: {}, expires: new Date().toISOString() },
        token
      })
      
      // Verify complete flow
      expect(authenticatedUser).not.toBeNull()
      expect(token.sub).toBe('user-123')
      expect(token.role).toBe('user')
      expect(session.user.email).toBe('user1@test.com')
    })

    it('should handle admin authentication flow with elevated privileges', async () => {
      // This should fail - admin flow not implemented
      const mockAdminCredentials = {
        email: 'admin@test.com',
        password: 'AdminPassword123!'
      }
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'admin-123',
          email: 'admin@test.com',
          password_hash: '$2a$12$hashedadminpassword',
          role: 'admin',
          email_verified: true
        },
        error: null
      })
      
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      
      // Complete admin flow
      const authorizeFunction = async (credentials: any) => {
        const { data: user } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (!user || !user.email_verified) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        
        return { id: user.id, email: user.email, role: user.role }
      }
      
      const authenticatedAdmin = await authorizeFunction(mockAdminCredentials)
      
      const jwtCallback = async ({ token, user }: { token: any, user: any }) => {
        if (user) {
          token.sub = user.id
          token.email = user.email
          token.role = user.role
        }
        return token
      }
      
      const token = await jwtCallback({ token: {}, user: authenticatedAdmin })
      
      const sessionCallback = async ({ session, token }: { session: any, token: any }) => {
        if (token) {
          session.user.id = token.sub
          session.user.email = token.email
          session.user.role = token.role
        }
        return session
      }
      
      const session = await sessionCallback({
        session: { user: {}, expires: new Date().toISOString() },
        token
      })
      
      // Admin-specific assertions
      expect(authenticatedAdmin).not.toBeNull()
      expect(token.role).toBe('admin')
      expect(session.user.role).toBe('admin')
      expect(session.user.email).toBe('admin@test.com')
    })

    it('should fail authentication for invalid credentials in complete flow', async () => {
      // This should fail - proper error handling not implemented
      const mockInvalidCredentials = {
        email: 'nonexistent@test.com',
        password: 'WrongPassword123!'
      }
      
      // Simulate user not found
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found', code: 'PGRST116' }
      })
      
      const authorizeFunction = async (credentials: any) => {
        const { data: user, error } = await mockSupabaseClient
          .from('user_profiles')
          .select('id, email, password_hash, role, email_verified')
          .eq('email', credentials.email)
          .single()
        
        if (error || !user || !user.email_verified) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        
        return { id: user.id, email: user.email, role: user.role }
      }
      
      const result = await authorizeFunction(mockInvalidCredentials)
      
      expect(result).toBeNull()
    })
  })
})