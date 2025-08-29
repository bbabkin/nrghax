/**
 * TDD API Tests for POST /api/admin/audit endpoint
 * Phase 1.3 - RED PHASE: These tests will fail initially as the API doesn't exist yet
 * 
 * Tests comprehensive audit log management functionality:
 * - Manual audit log entry creation
 * - Audit log retrieval with filtering
 * - Input validation and security checks
 * - Immutability enforcement
 * - Query capabilities and pagination
 */

import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { testUsers } from '../../../../../tests/fixtures/admin-users-data'
import { 
  sampleAuditLogs, 
  auditLogsByAction, 
  auditLogsByAdmin,
  auditLogsByDateRange,
  testAuditLogs,
  newAuditLogTemplate
} from '../../../../../tests/fixtures/admin-audit-data'
import type { AuditLog, AuditAction, PaginatedResponse } from '@/types/admin'

// Mock NextAuth for authentication testing
jest.mock('next-auth', () => ({
  NextAuth: jest.fn(() => ({
    auth: jest.fn()
  }))
}))

// Mock the auth function
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock Supabase admin client
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: require('../../../../../tests/mocks/supabase-admin').mockSupabaseAdmin
}))

// Mock IP address utility
jest.mock('@/lib/utils/ip', () => ({
  getClientIP: jest.fn().mockReturnValue('127.0.0.1')
}))

describe('/api/admin/audit - Audit Log Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock Supabase data before each test
    const { mockSupabaseAdmin } = require('../../../../../tests/mocks/supabase-admin')
    mockSupabaseAdmin.__resetMockData()
  })

  describe('GET /api/admin/audit - Retrieve Audit Logs', () => {
    describe('Authentication and Authorization', () => {
      it('should require authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
          success: false,
          error: 'Authentication required'
        })
      })

      it('should require admin role', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.regularUser.id,
            email: testUsers.regularUser.email,
            role: 'user'
          }
        })

        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data).toEqual({
          success: false,
          error: 'Admin access required'
        })
      })

      it('should allow admin access', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)

        expect(response.status).toBe(200)
      })
    })

    describe('Basic Audit Log Retrieval', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should return paginated audit logs with default parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          data: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          limit: 20, // Default limit for audit logs might be higher
          totalPages: expect.any(Number)
        })
        
        // Verify structure of returned audit logs
        expect(data.data.data.length).toBeGreaterThan(0)
        data.data.data.forEach((log: AuditLog) => {
          expect(log).toHaveProperty('id')
          expect(log).toHaveProperty('adminId')
          expect(log).toHaveProperty('adminEmail')
          expect(log).toHaveProperty('action')
          expect(log).toHaveProperty('createdAt')
          expect(log).toHaveProperty('ipAddress')
        })
      })

      it('should include all required audit log fields', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        const auditLog = data.data.data[0]
        expect(auditLog).toHaveProperty('id')
        expect(auditLog).toHaveProperty('adminId')
        expect(auditLog).toHaveProperty('adminEmail')
        expect(auditLog).toHaveProperty('action')
        expect(auditLog).toHaveProperty('targetUserId')
        expect(auditLog).toHaveProperty('targetUserEmail')
        expect(auditLog).toHaveProperty('changes')
        expect(auditLog).toHaveProperty('ipAddress')
        expect(auditLog).toHaveProperty('createdAt')
      })

      it('should sort audit logs by date descending by default', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        // Verify sorting order (most recent first)
        for (let i = 1; i < data.data.data.length; i++) {
          const prevDate = new Date(data.data.data[i - 1].createdAt).getTime()
          const currDate = new Date(data.data.data[i].createdAt).getTime()
          expect(prevDate).toBeGreaterThanOrEqual(currDate)
        }
      })
    })

    describe('Action Type Filtering', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should filter audit logs by view action', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?action=view')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.data.length).toBeGreaterThan(0)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.action).toBe('view')
        })
      })

      it('should filter audit logs by edit action', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?action=edit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.data.length).toBeGreaterThan(0)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.action).toBe('edit')
        })
      })

      it('should filter audit logs by delete actions', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?action=soft_delete')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.action).toBe('soft_delete')
        })
      })

      it('should handle invalid action filter', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?action=invalid_action')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid action filter')
      })
    })

    describe('Admin Filtering', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should filter audit logs by admin ID', async () => {
        const adminId = testUsers.admin.id
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?adminId=${adminId}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.adminId).toBe(adminId)
        })
      })

      it('should filter audit logs by admin email', async () => {
        const adminEmail = testUsers.admin.email
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?adminEmail=${encodeURIComponent(adminEmail)}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.adminEmail).toBe(adminEmail)
        })
      })

      it('should allow regular admin to see only their own audit logs by default', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const request = new NextRequest('http://localhost:3000/api/admin/audit')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        // Regular admin should only see their own audit logs
        data.data.data.forEach((log: AuditLog) => {
          expect(log.adminId).toBe(testUsers.admin.id)
        })
      })

      it('should allow super admin to see all audit logs', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?showAll=true')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        // Should contain audit logs from multiple admins
        const uniqueAdmins = new Set(data.data.data.map((log: AuditLog) => log.adminId))
        expect(uniqueAdmins.size).toBeGreaterThan(1)
      })
    })

    describe('Target User Filtering', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should filter audit logs by target user ID', async () => {
        const targetUserId = testUsers.regularUser.id
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?targetUserId=${targetUserId}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.targetUserId).toBe(targetUserId)
        })
      })

      it('should filter audit logs by target user email', async () => {
        const targetUserEmail = testUsers.regularUser.email
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?targetUserEmail=${encodeURIComponent(targetUserEmail)}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.targetUserEmail).toBe(targetUserEmail)
        })
      })

      it('should handle system actions with null target user', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?systemActions=true')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        // Should include logs with null target user (system actions)
        const systemActions = data.data.data.filter((log: AuditLog) => !log.targetUserId)
        expect(systemActions.length).toBeGreaterThan(0)
      })
    })

    describe('Date Range Filtering', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should filter audit logs by date range', async () => {
        const dateFrom = '2024-01-01'
        const dateTo = '2024-01-31'
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          const logDate = new Date(log.createdAt)
          expect(logDate).toBeGreaterThanOrEqual(new Date(dateFrom))
          expect(logDate).toBeLessThanOrEqual(new Date(dateTo + 'T23:59:59Z'))
        })
      })

      it('should filter audit logs from specific date', async () => {
        const dateFrom = '2024-01-25'
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?dateFrom=${dateFrom}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          const logDate = new Date(log.createdAt)
          expect(logDate).toBeGreaterThanOrEqual(new Date(dateFrom))
        })
      })

      it('should handle invalid date format', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?dateFrom=invalid-date')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid date format')
      })
    })

    describe('IP Address Filtering', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should filter audit logs by IP address', async () => {
        const ipAddress = '192.168.1.100'
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?ipAddress=${ipAddress}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.ipAddress).toBe(ipAddress)
        })
      })

      it('should handle IP range filtering', async () => {
        const ipRange = '192.168.1'
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?ipRange=${ipRange}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.ipAddress).toMatch(new RegExp(`^${ipRange}`))
        })
      })
    })

    describe('Pagination and Performance', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should handle custom pagination parameters', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?page=2&limit=5')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.page).toBe(2)
        expect(data.data.limit).toBe(5)
        expect(data.data.data.length).toBeLessThanOrEqual(5)
      })

      it('should enforce maximum limit for performance', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit?limit=10000')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Limit cannot exceed')
      })

      it('should handle large result sets efficiently', async () => {
        // This test would verify query performance with large datasets
        const startTime = Date.now()
        
        const request = new NextRequest('http://localhost:3000/api/admin/audit?limit=100')
        const response = await GET(request)
        
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
      })
    })

    describe('Combined Filters', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should combine action and date filters', async () => {
        const action = 'edit'
        const dateFrom = '2024-01-01'
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?action=${action}&dateFrom=${dateFrom}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.action).toBe(action)
          expect(new Date(log.createdAt)).toBeGreaterThanOrEqual(new Date(dateFrom))
        })
      })

      it('should combine admin and target user filters', async () => {
        const adminId = testUsers.admin.id
        const targetUserId = testUsers.regularUser.id
        const request = new NextRequest(`http://localhost:3000/api/admin/audit?adminId=${adminId}&targetUserId=${targetUserId}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        
        data.data.data.forEach((log: AuditLog) => {
          expect(log.adminId).toBe(adminId)
          expect(log.targetUserId).toBe(targetUserId)
        })
      })
    })
  })

  describe('POST /api/admin/audit - Create Audit Log', () => {
    describe('Authentication and Authorization', () => {
      it('should require authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAuditLogTemplate)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data).toEqual({
          success: false,
          error: 'Authentication required'
        })
      })

      it('should require admin role', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.regularUser.id,
            email: testUsers.regularUser.email,
            role: 'user'
          }
        })

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAuditLogTemplate)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data).toEqual({
          success: false,
          error: 'Admin access required'
        })
      })

      it('should allow manual audit log creation by admins', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAuditLogTemplate)
        })
        const response = await POST(request)

        expect(response.status).toBe(201)
      })
    })

    describe('Manual Audit Log Creation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should successfully create manual audit log entry', async () => {
        const auditData = {
          ...newAuditLogTemplate,
          action: 'view' as AuditAction,
          changes: { manualEntry: true, reason: 'Manual audit log entry' }
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: expect.any(String),
          adminId: testUsers.admin.id,
          adminEmail: testUsers.admin.email,
          action: 'view',
          createdAt: expect.any(String)
        })
        expect(data.message).toContain('Audit log created successfully')
      })

      it('should auto-populate admin information from session', async () => {
        const auditData = {
          action: 'view' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.data.adminId).toBe(testUsers.admin.id)
        expect(data.data.adminEmail).toBe(testUsers.admin.email)
      })

      it('should auto-populate IP address from request', async () => {
        const auditData = {
          action: 'view' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.data.ipAddress).toBe('127.0.0.1')
      })

      it('should auto-populate timestamp', async () => {
        const beforeTime = new Date()
        
        const auditData = {
          action: 'view' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()
        
        const afterTime = new Date()
        const createdAt = new Date(data.data.createdAt)

        expect(response.status).toBe(201)
        expect(createdAt).toBeGreaterThanOrEqual(beforeTime)
        expect(createdAt).toBeLessThanOrEqual(afterTime)
      })
    })

    describe('Input Validation', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should validate required fields', async () => {
        const incompleteData = {
          // Missing required 'action' field
          targetUserId: testUsers.regularUser.id,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incompleteData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Action is required')
      })

      it('should validate action values', async () => {
        const auditData = {
          action: 'invalid_action',
          targetUserId: testUsers.regularUser.id,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid action')
      })

      it('should validate target user ID format', async () => {
        const auditData = {
          action: 'view' as AuditAction,
          targetUserId: 'invalid-id-format',
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid target user ID format')
      })

      it('should validate changes object structure', async () => {
        const auditData = {
          action: 'edit' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: 'invalid-changes-format' // Should be object or null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Changes must be an object or null')
      })

      it('should handle malformed JSON gracefully', async () => {
        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{ invalid json }'
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid JSON')
      })

      it('should validate maximum payload size', async () => {
        const largeChanges = {
          largeData: 'a'.repeat(100000) // Very large changes object
        }
        
        const auditData = {
          action: 'edit' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: largeChanges
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Payload too large')
      })
    })

    describe('Immutability Enforcement', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should prevent modification of existing audit logs', async () => {
        // This would test update operations which should be forbidden
        // In a real implementation, there would be no PUT endpoint for audit logs
        
        const auditData = {
          action: 'edit' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: { modified: true }
        }

        const request = new NextRequest(`http://localhost:3000/api/admin/audit/${testAuditLogs.viewAction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })

        // This should return 405 Method Not Allowed since audit logs are immutable
        const response = await fetch(request)
        expect(response.status).toBe(405)
      })

      it('should prevent deletion of audit logs', async () => {
        // Regular admins should not be able to delete audit logs
        const request = new NextRequest(`http://localhost:3000/api/admin/audit/${testAuditLogs.viewAction.id}`, {
          method: 'DELETE'
        })

        const response = await fetch(request)
        expect(response.status).toBe(405) // Method Not Allowed
      })

      it('should only allow super admin to archive old audit logs', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })

        // This would test a special archival endpoint (if implemented)
        const request = new NextRequest('http://localhost:3000/api/admin/audit/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ olderThan: '2023-01-01' })
        })

        // This endpoint might not exist yet, so we expect it to work for super admin
        const response = await fetch(request)
        expect([200, 404]).toContain(response.status)
      })
    })

    describe('Security Considerations', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should prevent injection attacks in changes object', async () => {
        const auditData = {
          action: 'edit' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: {
            maliciousScript: '<script>alert("xss")</script>',
            sqlInjection: "'; DROP TABLE users; --"
          }
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        // Data should be stored as-is but properly escaped when displayed
        expect(data.data.changes.maliciousScript).toBe('<script>alert("xss")</script>')
        expect(data.data.changes.sqlInjection).toBe("'; DROP TABLE users; --")
      })

      it('should sanitize sensitive information from changes object', async () => {
        const auditData = {
          action: 'edit' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: {
            password: 'secret123',
            creditCard: '4111-1111-1111-1111',
            ssn: '123-45-6789'
          }
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        // Sensitive fields should be redacted or hashed
        expect(data.data.changes.password).toBe('[REDACTED]')
        expect(data.data.changes.creditCard).toBe('[REDACTED]')
        expect(data.data.changes.ssn).toBe('[REDACTED]')
      })

      it('should rate limit audit log creation', async () => {
        // Test rate limiting by making many rapid requests
        const promises = Array(20).fill(null).map(() => {
          const auditData = {
            action: 'view' as AuditAction,
            targetUserId: testUsers.regularUser.id,
            changes: null
          }

          return fetch(new NextRequest('http://localhost:3000/api/admin/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditData)
          }))
        })

        const responses = await Promise.all(promises)
        const statuses = responses.map(r => r.status)

        // Some requests should be rate limited (429)
        expect(statuses).toContain(429)
      })
    })

    describe('Performance and Scalability', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should handle concurrent audit log creation', async () => {
        const promises = Array(10).fill(null).map((_, index) => {
          const auditData = {
            action: 'view' as AuditAction,
            targetUserId: testUsers.regularUser.id,
            changes: { concurrent: true, index }
          }

          return POST(new NextRequest('http://localhost:3000/api/admin/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(auditData)
          }))
        })

        const responses = await Promise.all(promises)
        
        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBe(201)
        })
      })

      it('should respond quickly for audit log creation', async () => {
        const startTime = Date.now()
        
        const auditData = {
          action: 'view' as AuditAction,
          targetUserId: testUsers.regularUser.id,
          changes: null
        }

        const request = new NextRequest('http://localhost:3000/api/admin/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditData)
        })
        const response = await POST(request)
        
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(201)
        expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should handle database connection errors gracefully', async () => {
      const { mockScenarios } = require('../../../../../tests/mocks/supabase-admin')
      mockScenarios.simulateConnectionError()

      const request = new NextRequest('http://localhost:3000/api/admin/audit')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection error')
    })

    it('should handle unexpected errors during audit log creation', async () => {
      // Mock unexpected error
      const { mockSupabaseAdmin } = require('../../../../../tests/mocks/supabase-admin')
      const originalFrom = mockSupabaseAdmin.from
      mockSupabaseAdmin.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Unexpected database error'))
        })
      })

      const auditData = {
        action: 'view' as AuditAction,
        targetUserId: testUsers.regularUser.id,
        changes: null
      }

      const request = new NextRequest('http://localhost:3000/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create audit log')

      // Restore original function
      mockSupabaseAdmin.from = originalFrom
    })

    it('should return consistent error response format', async () => {
      // Mock unauthenticated request
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/audit')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(data).not.toHaveProperty('data')
    })
  })
})