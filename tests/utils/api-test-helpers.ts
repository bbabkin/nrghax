/**
 * Test utilities for Admin API endpoint testing
 * Provides helper functions for common API testing patterns
 */

import { NextRequest } from 'next/server'
import type { AdminUser, UserEditRequest, DeleteUserRequest, AuditLog } from '@/types/admin'

/**
 * Helper to create authenticated NextRequest objects
 */
export function createAuthenticatedRequest(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(url, requestInit)
}

/**
 * Helper to create mock route parameters
 */
export function createMockParams(id: string) {
  return { params: { id } }
}

/**
 * Helper to assert common API response structure
 */
export function assertApiResponse(response: Response, data: any) {
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(data).toHaveProperty('success')
  
  if (data.success) {
    expect(data).toHaveProperty('data')
  } else {
    expect(data).toHaveProperty('error')
  }
}

/**
 * Helper to assert paginated response structure
 */
export function assertPaginatedResponse(data: any) {
  expect(data.data).toHaveProperty('data')
  expect(data.data).toHaveProperty('total')
  expect(data.data).toHaveProperty('page')
  expect(data.data).toHaveProperty('limit')
  expect(data.data).toHaveProperty('totalPages')
  expect(Array.isArray(data.data.data)).toBe(true)
  expect(typeof data.data.total).toBe('number')
  expect(typeof data.data.page).toBe('number')
  expect(typeof data.data.limit).toBe('number')
  expect(typeof data.data.totalPages).toBe('number')
}

/**
 * Helper to assert user object structure
 */
export function assertUserStructure(user: any) {
  expect(user).toHaveProperty('id')
  expect(user).toHaveProperty('email')
  expect(user).toHaveProperty('role')
  expect(user).toHaveProperty('status')
  expect(user).toHaveProperty('createdAt')
  expect(user).toHaveProperty('updatedAt')
  
  expect(typeof user.id).toBe('string')
  expect(typeof user.email).toBe('string')
  expect(['user', 'admin', 'super_admin']).toContain(user.role)
  expect(['active', 'deactivated']).toContain(user.status)
  expect(user.createdAt).toBeTruthy()
  expect(user.updatedAt).toBeTruthy()
}

/**
 * Helper to assert audit log structure
 */
export function assertAuditLogStructure(log: any) {
  expect(log).toHaveProperty('id')
  expect(log).toHaveProperty('adminId')
  expect(log).toHaveProperty('adminEmail')
  expect(log).toHaveProperty('action')
  expect(log).toHaveProperty('createdAt')
  
  expect(typeof log.id).toBe('string')
  expect(typeof log.adminId).toBe('string')
  expect(typeof log.adminEmail).toBe('string')
  expect(['view', 'edit', 'create', 'soft_delete', 'hard_delete', 'role_change']).toContain(log.action)
  expect(log.createdAt).toBeTruthy()
}

/**
 * Helper to create user update payloads
 */
export const userUpdatePayloads = {
  promoteToAdmin: { role: 'admin' as const },
  demoteToUser: { role: 'user' as const },
  deactivateUser: { status: 'deactivated' as const },
  activateUser: { status: 'active' as const },
  promoteAndActivate: { 
    role: 'admin' as const, 
    status: 'active' as const 
  }
}

/**
 * Helper to create delete request payloads
 */
export const deleteRequestPayloads = {
  softDelete: {
    type: 'soft' as const,
    confirmation: true
  },
  hardDelete: {
    type: 'hard' as const,
    confirmation: true
  },
  unconfirmedDelete: {
    type: 'soft' as const,
    confirmation: false
  }
}

/**
 * Helper to create audit log payloads
 */
export const auditLogPayloads = {
  viewAction: (targetUserId: string, targetUserEmail: string) => ({
    action: 'view' as const,
    targetUserId,
    targetUserEmail,
    changes: null
  }),
  
  editAction: (targetUserId: string, targetUserEmail: string, field: string, oldValue: any, newValue: any) => ({
    action: 'edit' as const,
    targetUserId,
    targetUserEmail,
    changes: {
      field,
      oldValue,
      newValue,
      timestamp: new Date()
    }
  }),

  deleteAction: (targetUserId: string, targetUserEmail: string, reason: string) => ({
    action: 'soft_delete' as const,
    targetUserId,
    targetUserEmail,
    changes: {
      action: 'soft_delete',
      reason,
      retentionPeriod: '90 days',
      timestamp: new Date()
    }
  }),

  systemAction: (description: string) => ({
    action: 'view' as const,
    targetUserId: null,
    targetUserEmail: null,
    changes: {
      action: 'system_operation',
      description,
      timestamp: new Date()
    }
  })
}

/**
 * Helper to create URL query parameters
 */
export class ApiUrlBuilder {
  private baseUrl: string
  private params: URLSearchParams

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.params = new URLSearchParams()
  }

  search(query: string): this {
    this.params.set('search', query)
    return this
  }

  role(role: string): this {
    this.params.set('role', role)
    return this
  }

  status(status: string): this {
    this.params.set('status', status)
    return this
  }

  page(page: number): this {
    this.params.set('page', page.toString())
    return this
  }

  limit(limit: number): this {
    this.params.set('limit', limit.toString())
    return this
  }

  sortBy(field: string): this {
    this.params.set('sortBy', field)
    return this
  }

  sortOrder(order: 'asc' | 'desc'): this {
    this.params.set('sortOrder', order)
    return this
  }

  dateFrom(date: string): this {
    this.params.set('dateFrom', date)
    return this
  }

  dateTo(date: string): this {
    this.params.set('dateTo', date)
    return this
  }

  action(action: string): this {
    this.params.set('action', action)
    return this
  }

  adminId(id: string): this {
    this.params.set('adminId', id)
    return this
  }

  targetUserId(id: string): this {
    this.params.set('targetUserId', id)
    return this
  }

  ipAddress(ip: string): this {
    this.params.set('ipAddress', ip)
    return this
  }

  build(): string {
    const queryString = this.params.toString()
    return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl
  }
}

/**
 * Helper to simulate concurrent requests
 */
export async function simulateConcurrentRequests<T>(
  requestFactory: () => Promise<T>,
  count: number = 10
): Promise<T[]> {
  const promises = Array(count).fill(null).map(() => requestFactory())
  return Promise.all(promises)
}

/**
 * Helper to measure response time
 */
export async function measureResponseTime<T>(
  operation: () => Promise<T>
): Promise<{ result: T; responseTime: number }> {
  const startTime = Date.now()
  const result = await operation()
  const endTime = Date.now()
  const responseTime = endTime - startTime
  
  return { result, responseTime }
}

/**
 * Helper to assert response time performance
 */
export function assertResponseTime(responseTime: number, maxTime: number) {
  expect(responseTime).toBeLessThan(maxTime)
}

/**
 * Helper to assert error response format
 */
export function assertErrorResponse(data: any, expectedErrorMessage?: string) {
  expect(data).toHaveProperty('success', false)
  expect(data).toHaveProperty('error')
  expect(data).not.toHaveProperty('data')
  
  if (expectedErrorMessage) {
    expect(data.error).toContain(expectedErrorMessage)
  }
}

/**
 * Helper to assert success response format
 */
export function assertSuccessResponse(data: any, expectedMessage?: string) {
  expect(data).toHaveProperty('success', true)
  expect(data).toHaveProperty('data')
  
  if (expectedMessage) {
    expect(data).toHaveProperty('message')
    expect(data.message).toContain(expectedMessage)
  }
}

/**
 * Helper to simulate different user roles in tests
 */
export const mockUserSessions = {
  superAdmin: {
    user: {
      id: 'super-admin-1',
      email: 'super.admin@example.com',
      role: 'super_admin'
    }
  },
  
  admin: {
    user: {
      id: 'admin-1',
      email: 'admin.user@example.com',
      role: 'admin'
    }
  },
  
  regularUser: {
    user: {
      id: 'user-1',
      email: 'john.doe@example.com',
      role: 'user'
    }
  },
  
  unauthenticated: null
}

/**
 * Helper to create malicious input payloads for security testing
 */
export const maliciousInputs = {
  sqlInjection: "'; DROP TABLE users; --",
  xssScript: '<script>alert("xss")</script>',
  pathTraversal: '../../../etc/passwd',
  oversizedString: 'x'.repeat(10000),
  nullBytes: 'test\x00.txt',
  unicodeOverflow: '\uFFFF'.repeat(1000),
  nosqlInjection: '{"$ne": null}',
  commandInjection: '; rm -rf /',
  ldapInjection: '*)(uid=*',
  xmlBomb: '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;">]><lolz>&lol2;</lolz>'
}

/**
 * Helper to create various edge case inputs
 */
export const edgeCaseInputs = {
  emptyString: '',
  whitespace: '   ',
  specialCharacters: '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`',
  unicodeCharacters: '用户测试ñáéíóúüç',
  longEmail: 'very.long.email.address.that.exceeds.normal.limits@example-domain-with-very-long-name.com',
  malformedEmail: 'not-an-email',
  futureDate: new Date('2099-12-31').toISOString(),
  pastDate: new Date('1900-01-01').toISOString(),
  invalidDate: 'not-a-date',
  negativeNumbers: -1,
  largeNumbers: Number.MAX_SAFE_INTEGER,
  floatingNumbers: 3.14159,
  booleanStrings: 'true',
  nullString: 'null',
  undefinedString: 'undefined'
}

/**
 * Helper to validate pagination parameters
 */
export function assertValidPagination(data: any, expectedPage: number, expectedLimit: number) {
  expect(data.data.page).toBe(expectedPage)
  expect(data.data.limit).toBe(expectedLimit)
  expect(data.data.data.length).toBeLessThanOrEqual(expectedLimit)
  expect(data.data.total).toBeGreaterThanOrEqual(0)
  expect(data.data.totalPages).toBe(Math.ceil(data.data.total / expectedLimit))
}

/**
 * Helper to validate sorting
 */
export function assertSorting(
  items: any[], 
  field: string, 
  order: 'asc' | 'desc' = 'asc'
) {
  for (let i = 1; i < items.length; i++) {
    const prevValue = items[i - 1][field]
    const currValue = items[i][field]
    
    if (order === 'asc') {
      expect(prevValue <= currValue).toBe(true)
    } else {
      expect(prevValue >= currValue).toBe(true)
    }
  }
}

/**
 * Helper to validate filtering
 */
export function assertFiltering<T>(
  items: T[], 
  filter: (item: T) => boolean
) {
  items.forEach(item => {
    expect(filter(item)).toBe(true)
  })
}

/**
 * Helper to create performance test scenarios
 */
export const performanceScenarios = {
  lightLoad: { concurrency: 5, iterations: 10 },
  mediumLoad: { concurrency: 20, iterations: 50 },
  heavyLoad: { concurrency: 50, iterations: 100 },
  stressTest: { concurrency: 100, iterations: 200 }
}

/**
 * Helper to validate HTTP headers
 */
export function assertSecurityHeaders(response: Response) {
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
  expect(response.headers.get('X-Frame-Options')).toBe('DENY')
  expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
  expect(response.headers.get('Referrer-Policy')).toBeTruthy()
  expect(response.headers.get('Content-Type')).toContain('application/json')
}

/**
 * Helper to validate CORS headers
 */
export function assertCorsHeaders(response: Response, expectedOrigin?: string) {
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
  expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
  expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy()
  
  if (expectedOrigin) {
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(expectedOrigin)
  }
}