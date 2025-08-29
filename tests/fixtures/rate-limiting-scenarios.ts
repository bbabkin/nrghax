/**
 * Test fixtures for rate limiting scenarios
 * Provides mock data and utilities for testing rate limiting functionality
 */

import type { AdminUser } from '@/types/admin'

/**
 * Rate limiting configuration for different endpoints
 */
export const rateLimitConfigs = {
  usersList: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests to user list endpoint'
  },
  
  userDetails: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Too many requests to user details endpoint'
  },
  
  userUpdate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many user update requests'
  },
  
  userDelete: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many user deletion requests'
  },
  
  auditLogs: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 150,
    message: 'Too many audit log requests'
  },
  
  auditCreate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many audit log creation requests'
  }
}

/**
 * Different user types with different rate limits
 */
export const userRateLimits = {
  superAdmin: {
    multiplier: 2.0, // Super admins get 2x rate limits
    description: 'Enhanced rate limits for super administrators'
  },
  
  admin: {
    multiplier: 1.5, // Regular admins get 1.5x rate limits
    description: 'Enhanced rate limits for administrators'
  },
  
  user: {
    multiplier: 1.0, // Regular users get base rate limits
    description: 'Base rate limits for regular users'
  }
}

/**
 * IP-based rate limiting scenarios
 */
export const ipRateLimitScenarios = {
  singleIP: {
    ip: '192.168.1.100',
    maxRequests: 1000,
    windowMs: 60 * 1000,
    description: 'Single IP address rate limiting'
  },
  
  subnet: {
    ipRange: '192.168.1.0/24',
    maxRequests: 5000,
    windowMs: 60 * 1000,
    description: 'Subnet-based rate limiting'
  },
  
  suspiciousIP: {
    ip: '185.220.100.240', // Known Tor exit node
    maxRequests: 10,
    windowMs: 60 * 1000,
    description: 'Aggressive rate limiting for suspicious IPs'
  },
  
  trustedIP: {
    ip: '10.0.0.1', // Internal network
    maxRequests: 10000,
    windowMs: 60 * 1000,
    description: 'Relaxed rate limiting for trusted IPs'
  }
}

/**
 * Progressive rate limiting scenarios
 */
export const progressiveRateLimits = {
  level1: {
    threshold: 50,
    windowMs: 60 * 1000,
    action: 'warning',
    description: 'First level - warning only'
  },
  
  level2: {
    threshold: 100,
    windowMs: 60 * 1000,
    action: 'throttle',
    delayMs: 1000,
    description: 'Second level - add delay to responses'
  },
  
  level3: {
    threshold: 200,
    windowMs: 60 * 1000,
    action: 'block',
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
    description: 'Third level - temporary block'
  },
  
  level4: {
    threshold: 500,
    windowMs: 60 * 1000,
    action: 'ban',
    banDurationMs: 60 * 60 * 1000, // 1 hour
    description: 'Fourth level - extended ban'
  }
}

/**
 * Rate limiting bypass scenarios (for testing)
 */
export const bypassScenarios = {
  apiKey: {
    header: 'X-API-Key',
    value: 'test-bypass-key-admin-api',
    description: 'API key bypass for automated systems'
  },
  
  serviceAccount: {
    header: 'X-Service-Account',
    value: 'admin-service',
    description: 'Service account bypass for internal services'
  },
  
  emergencyOverride: {
    header: 'X-Emergency-Override',
    value: 'emergency-admin-access',
    description: 'Emergency override for critical situations'
  }
}

/**
 * Mock rate limiter responses
 */
export interface RateLimitResponse {
  success: boolean
  error?: string
  retryAfter?: number
  remaining?: number
  resetTime?: number
  headers?: Record<string, string>
}

export const rateLimitResponses = {
  allowed: {
    success: true,
    remaining: 95,
    resetTime: Date.now() + 60000,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '95',
      'X-RateLimit-Reset': (Date.now() + 60000).toString()
    }
  } as RateLimitResponse,
  
  throttled: {
    success: false,
    error: 'Too many requests',
    retryAfter: 60,
    remaining: 0,
    resetTime: Date.now() + 60000,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': (Date.now() + 60000).toString(),
      'Retry-After': '60'
    }
  } as RateLimitResponse,
  
  progressiveThrottle: {
    success: false,
    error: 'Rate limit exceeded - progressive throttling active',
    retryAfter: 120,
    remaining: 0,
    resetTime: Date.now() + 120000,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': (Date.now() + 120000).toString(),
      'Retry-After': '120',
      'X-RateLimit-Policy': 'progressive'
    }
  } as RateLimitResponse,
  
  banned: {
    success: false,
    error: 'IP address temporarily banned due to excessive requests',
    retryAfter: 3600,
    remaining: 0,
    resetTime: Date.now() + 3600000,
    headers: {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': (Date.now() + 3600000).toString(),
      'Retry-After': '3600',
      'X-RateLimit-Policy': 'banned'
    }
  } as RateLimitResponse
}

/**
 * Rate limiting test scenarios for different attack patterns
 */
export const attackPatterns = {
  burst: {
    description: 'Sudden burst of requests',
    pattern: 'immediate',
    requestCount: 200,
    timeSpan: 1000, // 1 second
    expectedResponse: 'throttled'
  },
  
  sustained: {
    description: 'Sustained high rate of requests',
    pattern: 'consistent',
    requestCount: 300,
    timeSpan: 60000, // 1 minute
    expectedResponse: 'progressiveThrottle'
  },
  
  distributed: {
    description: 'Requests from multiple IPs',
    pattern: 'distributed',
    ipCount: 10,
    requestsPerIP: 50,
    timeSpan: 30000, // 30 seconds
    expectedResponse: 'allowed' // Each IP stays under limit
  },
  
  slowAndSteady: {
    description: 'Slow but persistent requests',
    pattern: 'gradual',
    requestCount: 500,
    timeSpan: 300000, // 5 minutes
    expectedResponse: 'banned'
  },
  
  reconnaissance: {
    description: 'Scanning different endpoints',
    pattern: 'scan',
    endpointCount: 20,
    requestsPerEndpoint: 10,
    timeSpan: 60000, // 1 minute
    expectedResponse: 'throttled'
  }
}

/**
 * Mock rate limiter implementation for testing
 */
export class MockRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private bannedKeys: Set<string> = new Set()
  private config: any
  
  constructor(config: any = rateLimitConfigs.usersList) {
    this.config = config
  }
  
  async checkLimit(key: string): Promise<RateLimitResponse> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Check if key is banned
    if (this.bannedKeys.has(key)) {
      return { ...rateLimitResponses.banned }
    }
    
    // Get existing requests for this key
    const existingRequests = this.requests.get(key) || []
    
    // Remove requests outside the window
    const validRequests = existingRequests.filter(time => time > windowStart)
    
    // Check if limit exceeded
    if (validRequests.length >= this.config.maxRequests) {
      // Implement progressive throttling
      if (validRequests.length > this.config.maxRequests * 2) {
        this.bannedKeys.add(key)
        setTimeout(() => this.bannedKeys.delete(key), 3600000) // 1 hour ban
        return { ...rateLimitResponses.banned }
      } else if (validRequests.length > this.config.maxRequests * 1.5) {
        return { ...rateLimitResponses.progressiveThrottle }
      }
      
      return { ...rateLimitResponses.throttled }
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)
    
    return {
      ...rateLimitResponses.allowed,
      remaining: this.config.maxRequests - validRequests.length
    }
  }
  
  reset(key?: string) {
    if (key) {
      this.requests.delete(key)
      this.bannedKeys.delete(key)
    } else {
      this.requests.clear()
      this.bannedKeys.clear()
    }
  }
  
  getBannedKeys(): string[] {
    return Array.from(this.bannedKeys)
  }
  
  getRequestCount(key: string): number {
    return this.requests.get(key)?.length || 0
  }
}

/**
 * Rate limiting test data generators
 */
export const rateLimitTestData = {
  /**
   * Generate test IPs for rate limiting scenarios
   */
  generateTestIPs(count: number = 10): string[] {
    const ips: string[] = []
    for (let i = 0; i < count; i++) {
      ips.push(`192.168.1.${100 + i}`)
    }
    return ips
  },
  
  /**
   * Generate test user agents for fingerprinting
   */
  generateUserAgents(): string[] {
    return [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      'curl/7.68.0',
      'PostmanRuntime/7.26.8',
      'python-requests/2.25.1',
      'Go-http-client/1.1'
    ]
  },
  
  /**
   * Generate request patterns for testing
   */
  generateRequestPattern(pattern: 'burst' | 'sustained' | 'gradual', count: number): number[] {
    const timestamps: number[] = []
    const now = Date.now()
    
    switch (pattern) {
      case 'burst':
        // All requests within 1 second
        for (let i = 0; i < count; i++) {
          timestamps.push(now + i * 10) // 10ms apart
        }
        break
        
      case 'sustained':
        // Evenly distributed over 1 minute
        const interval = 60000 / count
        for (let i = 0; i < count; i++) {
          timestamps.push(now + i * interval)
        }
        break
        
      case 'gradual':
        // Exponentially increasing frequency
        let currentTime = now
        for (let i = 0; i < count; i++) {
          timestamps.push(currentTime)
          currentTime += Math.max(100, 10000 / (i + 1)) // Decreasing intervals
        }
        break
    }
    
    return timestamps
  },
  
  /**
   * Generate fingerprints for device identification
   */
  generateFingerprints(count: number): Array<{
    ip: string
    userAgent: string
    acceptLanguage: string
    acceptEncoding: string
    fingerprint: string
  }> {
    const ips = this.generateTestIPs(count)
    const userAgents = this.generateUserAgents()
    const languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'es-ES,es;q=0.9', 'fr-FR,fr;q=0.9']
    const encodings = ['gzip, deflate, br', 'gzip, deflate', 'identity']
    
    return Array.from({ length: count }, (_, i) => {
      const ip = ips[i % ips.length]
      const userAgent = userAgents[i % userAgents.length]
      const acceptLanguage = languages[i % languages.length]
      const acceptEncoding = encodings[i % encodings.length]
      const fingerprint = Buffer.from(`${ip}-${userAgent}-${acceptLanguage}`).toString('base64')
      
      return {
        ip,
        userAgent,
        acceptLanguage,
        acceptEncoding,
        fingerprint
      }
    })
  }
}

/**
 * Rate limiting assertion helpers
 */
export const rateLimitAssertions = {
  /**
   * Assert that rate limit headers are present
   */
  assertRateLimitHeaders(response: Response) {
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy()
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy()
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy()
  },
  
  /**
   * Assert that rate limit is enforced
   */
  assertRateLimitEnforced(response: Response, expectedRetryAfter?: number) {
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    
    if (expectedRetryAfter) {
      expect(parseInt(response.headers.get('Retry-After')!)).toBe(expectedRetryAfter)
    }
  },
  
  /**
   * Assert progressive rate limiting behavior
   */
  assertProgressiveRateLimit(responses: Response[]) {
    let previousRetryAfter = 0
    
    responses.forEach((response, index) => {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '0')
        
        if (index > 0) {
          expect(retryAfter).toBeGreaterThanOrEqual(previousRetryAfter)
        }
        
        previousRetryAfter = retryAfter
      }
    })
  },
  
  /**
   * Assert that different users have independent rate limits
   */
  assertIndependentUserLimits(userResponses: Map<string, Response[]>) {
    userResponses.forEach((responses, userId) => {
      // Each user should have their own rate limit counter
      const rateLimitHeaders = responses.map(r => ({
        remaining: parseInt(r.headers.get('X-RateLimit-Remaining') || '0'),
        reset: parseInt(r.headers.get('X-RateLimit-Reset') || '0')
      }))
      
      // Remaining count should decrease for each user independently
      for (let i = 1; i < rateLimitHeaders.length; i++) {
        if (rateLimitHeaders[i].reset === rateLimitHeaders[i - 1].reset) {
          expect(rateLimitHeaders[i].remaining).toBeLessThanOrEqual(rateLimitHeaders[i - 1].remaining)
        }
      }
    })
  }
}

export default {
  rateLimitConfigs,
  userRateLimits,
  ipRateLimitScenarios,
  progressiveRateLimits,
  bypassScenarios,
  rateLimitResponses,
  attackPatterns,
  MockRateLimiter,
  rateLimitTestData,
  rateLimitAssertions
}