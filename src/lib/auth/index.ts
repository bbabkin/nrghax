// Comprehensive Authentication System Index
// This file provides a single entry point for all authentication functionality

// Core NextAuth.js configuration and utilities
export {
  auth,
  signIn,
  signOut,
  handlers,
  passwordSchema,
  emailSchema,
  hashPassword,
  verifyPassword,
  getServerSession
} from '../auth'

// Session utilities and validation
export {
  getServerSession as getSession,
  getExtendedSession,
  requireAuth,
  requireExtendedAuth,
  hasPermission,
  requirePermission,
  getCurrentUserId,
  isResourceOwner,
  requireResourceOwnership,
  validateApiSession,
  createAuthErrorResponse,
  createForbiddenResponse,
  withAuth,
  withPermission,
  getUserForClient
} from '../session-utils'

// User registration, password reset, and change utilities
export {
  registerUser,
  generatePasswordResetToken,
  resetPassword,
  changePassword,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} from '../auth-utils'

// Email verification functionality
export {
  generateEmailVerificationToken,
  verifyEmail,
  isEmailVerified,
  resendVerificationEmail,
  emailVerificationRequestSchema,
  emailVerificationSchema
} from '../email-verification'

// Rate limiting utilities
export {
  checkRateLimit,
  resetRateLimit,
  withRateLimit,
  getRequestIdentifier,
  checkRateLimitWithWhitelist,
  isWhitelisted,
  RATE_LIMITS,
  rateLimitStores
} from '../rate-limiting'

// Type definitions
export type {
  RateLimitResult
} from '../rate-limiting'

export type {
  RegisterData,
  PasswordResetRequestData,
  PasswordResetData
} from '../auth-utils'

export type {
  EmailVerificationRequestData,
  EmailVerificationData
} from '../email-verification'

export type {
  ExtendedUser,
  ExtendedSession
} from '../session-utils'

// Authentication flow constants
export const AUTH_PAGES = {
  SIGN_IN: '/login',
  SIGN_UP: '/register',
  ERROR: '/auth/error',
  VERIFY_REQUEST: '/auth/verify-request',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
} as const

// API endpoints
export const AUTH_ENDPOINTS = {
  NEXTAUTH: '/api/auth',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',
  CHANGE_PASSWORD: '/api/auth/change-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  LOGOUT: '/api/auth/logout',
} as const

// Authentication error codes
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  OAUTH_ERROR: 'OAUTH_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const

// Success messages
export const AUTH_SUCCESS = {
  REGISTRATION_SUCCESS: 'Account created successfully. Please check your email for verification.',
  LOGIN_SUCCESS: 'Successfully logged in.',
  LOGOUT_SUCCESS: 'Successfully logged out.',
  PASSWORD_RESET_REQUEST: 'If an account with this email exists, a password reset link has been sent.',
  PASSWORD_RESET_SUCCESS: 'Password has been successfully reset.',
  PASSWORD_CHANGE_SUCCESS: 'Password has been successfully changed.',
  EMAIL_VERIFICATION_SUCCESS: 'Email has been successfully verified.',
  EMAIL_VERIFICATION_SENT: 'Verification email has been sent.',
} as const

// Utility functions for common authentication patterns

/**
 * Check if user is authenticated and redirect if not
 * Use this in client components
 */
export function useRequireAuth() {
  // This would typically use a hook like useSession from next-auth/react
  // Implementation depends on your client-side auth strategy
  console.warn('useRequireAuth should be implemented with client-side session checking')
}

/**
 * Get authentication status for client components
 * Use this for conditional rendering based on auth state
 */
export function useAuthStatus() {
  // This would typically use a hook like useSession from next-auth/react
  // Implementation depends on your client-side auth strategy
  console.warn('useAuthStatus should be implemented with client-side session checking')
}

/**
 * Common patterns for handling authentication errors
 */
export function getAuthErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    [AUTH_ERRORS.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
    [AUTH_ERRORS.USER_NOT_FOUND]: 'No account found with this email address.',
    [AUTH_ERRORS.USER_ALREADY_EXISTS]: 'An account with this email already exists.',
    [AUTH_ERRORS.INVALID_TOKEN]: 'Invalid or expired token. Please request a new one.',
    [AUTH_ERRORS.TOKEN_EXPIRED]: 'Token has expired. Please request a new one.',
    [AUTH_ERRORS.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
    [AUTH_ERRORS.RATE_LIMIT_EXCEEDED]: 'Too many attempts. Please try again later.',
    [AUTH_ERRORS.OAUTH_ERROR]: 'OAuth authentication failed. Please try again.',
    [AUTH_ERRORS.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [AUTH_ERRORS.INSUFFICIENT_PERMISSIONS]: 'You do not have permission to access this resource.',
  }

  return errorMessages[error] || 'An authentication error occurred. Please try again.'
}

/**
 * Validate password strength and return user-friendly feedback
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  
  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength = 'strong'
    } else {
      strength = 'medium'
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

/**
 * Generate secure random tokens for various authentication purposes
 */
export function generateSecureToken(length: number = 32): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Check if email domain is allowed (useful for organization restrictions)
 */
export function isEmailDomainAllowed(email: string, allowedDomains?: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true
  }
  
  const domain = email.split('@')[1]?.toLowerCase()
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain.toLowerCase()
  )
}

/**
 * Sanitize user input for display
 */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Format display name from user data
 */
export function formatDisplayName(user: { name?: string | null; email: string }): string {
  return user.name || user.email.split('@')[0] || 'User'
}

/**
 * Check if current time is within business hours (useful for additional security)
 */
export function isWithinBusinessHours(timezone: string = 'UTC'): boolean {
  const now = new Date()
  const hour = now.getUTCHours() // Simplified - would need proper timezone handling
  return hour >= 6 && hour <= 22 // 6 AM to 10 PM
}

/**
 * Generate verification URL for email links
 */
export function generateVerificationURL(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || 'http://localhost:3000'
  return `${base}/auth/verify-email?token=${encodeURIComponent(token)}`
}

/**
 * Generate password reset URL for email links
 */
export function generatePasswordResetURL(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.APP_URL || 'http://localhost:3000'
  return `${base}/reset-password?token=${encodeURIComponent(token)}`
}