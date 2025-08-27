import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { passwordSchema, emailSchema, hashPassword, verifyPassword } from '../auth'
import bcrypt from 'bcryptjs'

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
}

Object.assign(process.env, mockEnv)

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
})