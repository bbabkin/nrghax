import { NextRequest } from "next/server"

// In-memory rate limiting store (in production, use Redis or similar)
interface RateLimitAttempt {
  count: number
  lastAttempt: number
  blocked?: boolean
  blockUntil?: number
}

class RateLimitStore {
  private attempts = new Map<string, RateLimitAttempt>()
  
  get(key: string): RateLimitAttempt | undefined {
    return this.attempts.get(key)
  }
  
  set(key: string, value: RateLimitAttempt): void {
    this.attempts.set(key, value)
  }
  
  delete(key: string): boolean {
    return this.attempts.delete(key)
  }
  
  // Clean up old entries to prevent memory leaks
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now()
    const entries = Array.from(this.attempts.entries())
    for (const [key, attempt] of entries) {
      if (now - attempt.lastAttempt > maxAge) {
        this.attempts.delete(key)
      }
    }
  }
}

// Global rate limiting stores
const authStore = new RateLimitStore()
const registrationStore = new RateLimitStore()
const passwordResetStore = new RateLimitStore()
const emailVerificationStore = new RateLimitStore()
const generalStore = new RateLimitStore()

// Rate limiting configurations for different operations
export const RATE_LIMITS = {
  // Authentication attempts
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTRATION: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 minutes
  EMAIL_VERIFICATION: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  CHANGE_PASSWORD: { maxAttempts: 3, windowMs: 5 * 60 * 1000 }, // 3 attempts per 5 minutes
  
  // Progressive blocking for repeated violations
  PROGRESSIVE_BLOCK: { 
    firstBlock: 5 * 60 * 1000, // 5 minutes
    secondBlock: 30 * 60 * 1000, // 30 minutes
    thirdBlock: 2 * 60 * 60 * 1000, // 2 hours
    maxBlock: 24 * 60 * 60 * 1000, // 24 hours
  }
} as const

type RateLimitType = keyof typeof RATE_LIMITS

// Get the appropriate store for the rate limit type
function getStore(type: RateLimitType): RateLimitStore {
  switch (type) {
    case 'LOGIN':
      return authStore
    case 'REGISTRATION':
      return registrationStore
    case 'PASSWORD_RESET':
      return passwordResetStore
    case 'EMAIL_VERIFICATION':
      return emailVerificationStore
    default:
      return generalStore
  }
}

// Extract identifier from request (IP + optional user identifier)
export function getRequestIdentifier(request: NextRequest, userIdentifier?: string): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a more unique identifier by combining IP and user agent hash
  const baseIdentifier = `${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 8)}`
  
  return userIdentifier ? `${baseIdentifier}:${userIdentifier}` : baseIdentifier
}

// Main rate limiting function
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
  error?: string
}

export function checkRateLimit(
  identifier: string,
  type: RateLimitType,
  customConfig?: { maxAttempts?: number; windowMs?: number }
): RateLimitResult {
  const store = getStore(type)
  const baseConfig = type === 'PROGRESSIVE_BLOCK' ? { maxAttempts: 5, windowMs: 15 * 60 * 1000 } : RATE_LIMITS[type]
  const config = { ...baseConfig, ...customConfig }
  const now = Date.now()
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    store.cleanup()
  }
  
  const attempt = store.get(identifier)
  
  // Check if currently blocked
  if (attempt?.blocked && attempt.blockUntil && now < attempt.blockUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: attempt.blockUntil,
      blocked: true,
      blockUntil: attempt.blockUntil,
      error: 'Temporarily blocked due to excessive requests'
    }
  }
  
  // No previous attempts or window expired
  if (!attempt || (now - attempt.lastAttempt > config.windowMs!)) {
    store.set(identifier, { count: 1, lastAttempt: now })
    return {
      allowed: true,
      remaining: config.maxAttempts! - 1,
      resetTime: now + config.windowMs!,
      blocked: false
    }
  }
  
  // Within window - check if limit exceeded
  if (attempt.count >= config.maxAttempts!) {
    // Apply progressive blocking
    const violations = Math.floor(attempt.count / config.maxAttempts!)
    let blockDuration: number
    
    switch (violations) {
      case 1:
        blockDuration = RATE_LIMITS.PROGRESSIVE_BLOCK.firstBlock
        break
      case 2:
        blockDuration = RATE_LIMITS.PROGRESSIVE_BLOCK.secondBlock
        break
      case 3:
        blockDuration = RATE_LIMITS.PROGRESSIVE_BLOCK.thirdBlock
        break
      default:
        blockDuration = RATE_LIMITS.PROGRESSIVE_BLOCK.maxBlock
    }
    
    const blockUntil = now + blockDuration
    
    store.set(identifier, {
      ...attempt,
      count: attempt.count + 1,
      lastAttempt: now,
      blocked: true,
      blockUntil
    })
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: blockUntil,
      blocked: true,
      blockUntil,
      error: 'Rate limit exceeded. Access temporarily blocked.'
    }
  }
  
  // Within limits - increment count
  store.set(identifier, {
    ...attempt,
    count: attempt.count + 1,
    lastAttempt: now
  })
  
  return {
    allowed: true,
    remaining: config.maxAttempts! - attempt.count - 1,
    resetTime: attempt.lastAttempt + config.windowMs!,
    blocked: false
  }
}

// Reset rate limit on successful operation (like successful login)
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const store = getStore(type)
  store.delete(identifier)
}

// Higher-order function to add rate limiting to API routes
export function withRateLimit<T extends any[]>(
  type: RateLimitType,
  handler: (...args: T) => Promise<Response>,
  options?: {
    getUserIdentifier?: (...args: T) => string | undefined
    customConfig?: { maxAttempts?: number; windowMs?: number }
    onBlocked?: (result: RateLimitResult) => Response
  }
) {
  return async (...args: T): Promise<Response> => {
    // Extract request from arguments (assumes first argument is NextRequest)
    const request = args[0] as NextRequest
    
    // Get user identifier if provided
    const userIdentifier = options?.getUserIdentifier?.(...args)
    const identifier = getRequestIdentifier(request, userIdentifier)
    
    // Check rate limit
    const result = checkRateLimit(identifier, type, options?.customConfig)
    
    if (!result.allowed) {
      if (options?.onBlocked) {
        return options.onBlocked(result)
      }
      
      const status = result.blocked ? 429 : 429 // Too Many Requests
      return Response.json(
        {
          success: false,
          error: result.error || 'Rate limit exceeded. Please try again later.',
          rateLimitExceeded: true,
          resetTime: result.resetTime,
          blocked: result.blocked,
          blockUntil: result.blockUntil
        },
        {
          status,
          headers: {
            'X-RateLimit-Limit': (options?.customConfig?.maxAttempts || (RATE_LIMITS[type] as any).maxAttempts || 5).toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((result.blockUntil || result.resetTime - Date.now()) / 1000).toString(),
          }
        }
      )
    }
    
    // Add rate limit headers to successful responses
    try {
      const response = await handler(...args)
      
      // Add rate limit headers if response is successful
      response.headers.set('X-RateLimit-Limit', (options?.customConfig?.maxAttempts || (RATE_LIMITS[type] as any).maxAttempts || 5).toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
      
      return response
    } catch (error) {
      // Let the error bubble up
      throw error
    }
  }
}

// Utility to check if an IP is in a whitelist (for development/testing)
export function isWhitelisted(identifier: string): boolean {
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || []
  const ip = identifier.split(':')[0]
  return whitelistedIPs.includes(ip!) || (process.env.NODE_ENV === 'development' && ip === 'unknown')
}

// Enhanced rate limit check that considers whitelisting
export function checkRateLimitWithWhitelist(
  identifier: string,
  type: RateLimitType,
  customConfig?: { maxAttempts?: number; windowMs?: number }
): RateLimitResult {
  if (isWhitelisted(identifier)) {
    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60000,
      blocked: false
    }
  }
  
  return checkRateLimit(identifier, type, customConfig)
}

// Export stores for testing purposes
export const rateLimitStores = {
  auth: authStore,
  registration: registrationStore,
  passwordReset: passwordResetStore,
  emailVerification: emailVerificationStore,
  general: generalStore
}