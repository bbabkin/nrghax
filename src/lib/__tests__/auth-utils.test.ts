import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { 
  registerUser,
  generatePasswordResetToken,
  resetPassword,
  changePassword,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} from '../auth-utils'
import * as authModule from '../auth'

// Mock the dependencies
jest.mock('../supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
}))

jest.mock('../auth', () => ({
  hashPassword: jest.fn(),
  passwordSchema: {
    parse: jest.fn()
  },
  emailSchema: {
    parse: jest.fn()
  }
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

// Mock crypto.randomUUID and crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((array) => {
      // Fill array with mock random values
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256
      }
      return array
    })
  }
})

const mockSupabaseAdmin = require('../supabase').supabaseAdmin
const mockHashPassword = authModule.hashPassword as jest.Mock
const mockPasswordSchema = authModule.passwordSchema as any
const mockEmailSchema = authModule.emailSchema as any

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        name: 'Test User'
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject when passwords do not match', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
        name: 'Test User'
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Passwords do not match')).toBe(true)
      }
    })

    it('should allow optional name field', () => {
      const dataWithoutName = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      }

      const result = registerSchema.safeParse(dataWithoutName)
      expect(result.success).toBe(true)
    })
  })

  describe('passwordResetRequestSchema', () => {
    it('should validate valid email for password reset', () => {
      const validData = { email: 'test@example.com' }
      const result = passwordResetRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = { email: 'invalid-email' }
      const result = passwordResetRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('passwordResetSchema', () => {
    it('should validate valid password reset data', () => {
      const validData = {
        token: 'valid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const result = passwordResetSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject when passwords do not match', () => {
      const invalidData = {
        token: 'valid-token',
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      }

      const result = passwordResetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Passwords do not match')).toBe(true)
      }
    })

    it('should reject empty token', () => {
      const invalidData = {
        token: '',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }

      const result = passwordResetSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('registerUser', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      name: 'Test User'
    }

    it('should successfully register a new user', async () => {
      // Mock schema validation
      const parseSpy = jest.spyOn(registerSchema, 'parse').mockReturnValue(validRegistrationData)
      
      // Mock user doesn't exist check
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      })

      // Mock password hashing
      mockHashPassword.mockResolvedValue('hashed-password')

      // Mock user creation
      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: {
          id: 'mock-uuid',
          email: 'test@example.com',
          name: 'Test User'
        },
        error: null
      })

      const result = await registerUser(validRegistrationData)

      expect(result.success).toBe(true)
      expect(result.user).toEqual({
        id: 'mock-uuid',
        email: 'test@example.com',
        name: 'Test User'
      })
      expect(parseSpy).toHaveBeenCalledWith(validRegistrationData)
      expect(mockHashPassword).toHaveBeenCalledWith('TestPassword123!')
    })

    it('should reject registration if user already exists', async () => {
      // Mock schema validation
      jest.spyOn(registerSchema, 'parse').mockReturnValue(validRegistrationData)
      
      // Mock existing user
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-user-id' },
        error: null
      })

      const result = await registerUser(validRegistrationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User with this email already exists')
    })

    it('should handle database error during user creation', async () => {
      // Mock schema validation
      jest.spyOn(registerSchema, 'parse').mockReturnValue(validRegistrationData)
      
      // Mock user doesn't exist
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Mock password hashing
      mockHashPassword.mockResolvedValue('hashed-password')

      // Mock user creation failure
      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      const result = await registerUser(validRegistrationData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Registration failed. Please try again.')
    })

    it('should handle validation errors', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' }
      
      // Mock validation error
      const validationError = new Error('Validation failed')
      validationError.name = 'ZodError'
      ;(validationError as any).errors = [{ message: 'Invalid email format', path: ['email'] }]
      
      jest.spyOn(registerSchema, 'parse').mockImplementation(() => {
        throw validationError
      })

      const result = await registerUser(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
      expect(result.fieldErrors).toEqual({ email: 'Invalid email format' })
    })
  })

  describe('generatePasswordResetToken', () => {
    beforeEach(() => {
      mockEmailSchema.parse = jest.fn(email => email.toLowerCase())
    })

    it('should generate password reset token for existing user', async () => {
      const email = 'test@example.com'
      
      // Mock user exists
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        error: null
      })

      // Mock token storage
      mockSupabaseAdmin.from().update().eq.mockResolvedValue({ error: null })

      const result = await generatePasswordResetToken(email)

      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with this email exists, a password reset link has been sent.')
      expect(mockEmailSchema.parse).toHaveBeenCalledWith(email.toLowerCase())
    })

    it('should return success message even for non-existent user (security)', async () => {
      const email = 'nonexistent@example.com'
      
      // Mock user doesn't exist
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      const result = await generatePasswordResetToken(email)

      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with this email exists, a password reset link has been sent.')
    })

    it('should handle database error when storing reset token', async () => {
      const email = 'test@example.com'
      
      // Mock user exists
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-id',
          email: 'test@example.com',
          name: 'Test User'
        },
        error: null
      })

      // Mock token storage failure
      mockSupabaseAdmin.from().update().eq.mockResolvedValue({
        error: new Error('Database error')
      })

      const result = await generatePasswordResetToken(email)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to generate password reset token.')
    })
  })

  describe('resetPassword', () => {
    const validResetData = {
      token: 'valid-token',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    }

    it('should successfully reset password with valid token', async () => {
      // Mock schema validation
      jest.spyOn(passwordResetSchema, 'parse').mockReturnValue(validResetData)
      
      // Mock user with valid token
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-id',
          email: 'test@example.com',
          reset_token_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        error: null
      })

      // Mock password hashing
      mockHashPassword.mockResolvedValue('new-hashed-password')

      // Mock password update
      mockSupabaseAdmin.from().update().eq.mockResolvedValue({ error: null })

      const result = await resetPassword(validResetData)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password has been successfully reset.')
      expect(mockHashPassword).toHaveBeenCalledWith('NewPassword123!')
    })

    it('should reject invalid or expired token', async () => {
      // Mock schema validation
      jest.spyOn(passwordResetSchema, 'parse').mockReturnValue(validResetData)
      
      // Mock no user found with token
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const result = await resetPassword(validResetData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired reset token.')
    })

    it('should reject expired token', async () => {
      // Mock schema validation
      jest.spyOn(passwordResetSchema, 'parse').mockReturnValue(validResetData)
      
      // Mock user with expired token
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-id',
          email: 'test@example.com',
          reset_token_expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() // Expired
        },
        error: null
      })

      const result = await resetPassword(validResetData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Reset token has expired.')
    })
  })

  describe('changePassword', () => {
    const bcrypt = require('bcryptjs')
    
    it('should successfully change password with correct current password', async () => {
      const userId = 'user-id'
      const currentPassword = 'OldPassword123!'
      const newPassword = 'NewPassword123!'

      // Mock password validation
      mockPasswordSchema.parse = jest.fn()

      // Mock user lookup
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          password_hash: 'old-hashed-password'
        },
        error: null
      })

      // Mock current password verification
      bcrypt.compare.mockResolvedValue(true)

      // Mock new password hashing
      mockHashPassword.mockResolvedValue('new-hashed-password')

      // Mock password update
      mockSupabaseAdmin.from().update().eq.mockResolvedValue({ error: null })

      const result = await changePassword(userId, currentPassword, newPassword)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Password has been successfully changed.')
      expect(mockPasswordSchema.parse).toHaveBeenCalledWith(newPassword)
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, 'old-hashed-password')
      expect(mockHashPassword).toHaveBeenCalledWith(newPassword)
    })

    it('should reject incorrect current password', async () => {
      const userId = 'user-id'
      const currentPassword = 'WrongPassword123!'
      const newPassword = 'NewPassword123!'

      // Mock password validation
      mockPasswordSchema.parse = jest.fn()

      // Mock user lookup
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          password_hash: 'old-hashed-password'
        },
        error: null
      })

      // Mock current password verification failure
      bcrypt.compare.mockResolvedValue(false)

      const result = await changePassword(userId, currentPassword, newPassword)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password is incorrect.')
    })

    it('should reject password change for OAuth accounts', async () => {
      const userId = 'user-id'
      const currentPassword = 'OldPassword123!'
      const newPassword = 'NewPassword123!'

      // Mock password validation
      mockPasswordSchema.parse = jest.fn()

      // Mock user with no password hash (OAuth account)
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: {
          password_hash: null
        },
        error: null
      })

      const result = await changePassword(userId, currentPassword, newPassword)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot change password for OAuth accounts.')
    })

    it('should handle user not found', async () => {
      const userId = 'non-existent-user'
      const currentPassword = 'OldPassword123!'
      const newPassword = 'NewPassword123!'

      // Mock password validation
      mockPasswordSchema.parse = jest.fn()

      // Mock user not found
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: new Error('User not found')
      })

      const result = await changePassword(userId, currentPassword, newPassword)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found.')
    })
  })
})