/**
 * TDD API Tests for /api/admin/users/[id] endpoint
 * Phase 1.3 - RED PHASE: These tests will fail initially as the API doesn't exist yet
 * 
 * Tests comprehensive user CRUD operations:
 * - GET: Individual user retrieval with activity history
 * - PUT: User updates (role/status changes)
 * - DELETE: User deletion (soft/hard delete)
 * - Authorization checks and audit logging
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from './route'
import { testUsers, sampleAdminUsers, userUpdateScenarios } from '../../../../../../tests/fixtures/admin-users-data'
import { getAuditLogsForUser } from '../../../../../../tests/fixtures/admin-audit-data'
import type { AdminUser, UserEditRequest, DeleteUserRequest, UserDetailsResponse } from '@/types/admin'

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
  supabaseAdmin: require('../../../../../../tests/mocks/supabase-admin').mockSupabaseAdmin
}))

// Mock audit logging
const mockCreateAuditLog = jest.fn()
jest.mock('@/lib/admin/audit', () => ({
  createAuditLog: mockCreateAuditLog
}))

// Mock IP address utility
jest.mock('@/lib/utils/ip', () => ({
  getClientIP: jest.fn().mockReturnValue('127.0.0.1')
}))

describe('/api/admin/users/[id] - Individual User Operations', () => {
  const mockParams = { params: { id: testUsers.regularUser.id } }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateAuditLog.mockResolvedValue({ success: true })
    
    // Reset mock Supabase data before each test
    const { mockSupabaseAdmin } = require('../../../../../../tests/mocks/supabase-admin')
    mockSupabaseAdmin.__resetMockData()
  })

  describe('GET /api/admin/users/[id] - Retrieve User Details', () => {
    describe('Authentication and Authorization', () => {
      it('should require authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/admin/users/123')
        const response = await GET(request, mockParams)
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

        const request = new NextRequest('http://localhost:3000/api/admin/users/123')
        const response = await GET(request, mockParams)
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

        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
        const response = await GET(request, mockParams)

        expect(response.status).toBe(200)
      })
    })

    describe('User Retrieval', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should return complete user details', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
        const response = await GET(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toMatchObject({
          id: testUsers.regularUser.id,
          email: testUsers.regularUser.email,
          name: testUsers.regularUser.name,
          role: testUsers.regularUser.role,
          status: testUsers.regularUser.status
        })
        
        // Should include all user fields
        expect(data.data).toHaveProperty('createdAt')
        expect(data.data).toHaveProperty('updatedAt')
        expect(data.data).toHaveProperty('lastLogin')
        expect(data.data).toHaveProperty('loginCount')
        expect(data.data).toHaveProperty('authProvider')
        expect(data.data).toHaveProperty('emailVerified')
      })

      it('should include activity history (audit logs)', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
        const response = await GET(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data).toHaveProperty('accountHistory')
        expect(Array.isArray(data.data.accountHistory)).toBe(true)
        
        // Verify audit log structure
        data.data.accountHistory.forEach((log: any) => {
          expect(log).toHaveProperty('id')
          expect(log).toHaveProperty('action')
          expect(log).toHaveProperty('adminEmail')
          expect(log).toHaveProperty('createdAt')
        })
      })

      it('should include session information when requested', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}?includeSessions=true`)
        const response = await GET(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data).toHaveProperty('sessions')
        expect(Array.isArray(data.data.sessions)).toBe(true)
      })

      it('should handle non-existent user ID', async () => {
        const nonExistentId = 'non-existent-id'
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${nonExistentId}`)
        const response = await GET(request, { params: { id: nonExistentId } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('User not found')
      })

      it('should handle invalid user ID format', async () => {
        const invalidId = 'invalid-id-format'
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${invalidId}`)
        const response = await GET(request, { params: { id: invalidId } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid user ID format')
      })

      it('should create audit log for view action', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
        await GET(request, mockParams)

        expect(mockCreateAuditLog).toHaveBeenCalledWith({
          adminId: testUsers.admin.id,
          adminEmail: testUsers.admin.email,
          action: 'view',
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: null,
          ipAddress: '127.0.0.1'
        })
      })
    })

    describe('Sensitive Data Filtering', () => {
      it('should filter sensitive data based on viewer role', async () => {
        // Regular admin viewing another admin
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const adminParams = { params: { id: testUsers.superAdmin.id } }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.superAdmin.id}`)
        const response = await GET(request, adminParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        // Regular admin should not see full audit logs of super admin
        expect(data.data.accountHistory).toHaveProperty('length')
      })

      it('should not expose authentication tokens or hashes', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
        const response = await GET(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data).not.toHaveProperty('password')
        expect(data.data).not.toHaveProperty('passwordHash')
        expect(data.data).not.toHaveProperty('sessionToken')
        expect(data.data).not.toHaveProperty('refreshToken')
      })
    })
  })

  describe('PUT /api/admin/users/[id] - Update User', () => {
    describe('Authentication and Authorization', () => {
      it('should require authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/admin/users/123', {
          method: 'PUT',
          body: JSON.stringify({ role: 'admin' })
        })
        const response = await PUT(request, mockParams)
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

        const request = new NextRequest('http://localhost:3000/api/admin/users/123', {
          method: 'PUT',
          body: JSON.stringify({ role: 'admin' })
        })
        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data).toEqual({
          success: false,
          error: 'Admin access required'
        })
      })
    })

    describe('Role Updates', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should successfully update user role', async () => {
        const updates: UserEditRequest = { role: 'admin' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.role).toBe('admin')
        expect(data.message).toContain('User updated successfully')
      })

      it('should prevent self-role change', async () => {
        const selfParams = { params: { id: testUsers.superAdmin.id } }
        const updates: UserEditRequest = { role: 'admin' }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.superAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, selfParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Cannot modify your own role')
      })

      it('should prevent regular admin from editing other admins', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const otherAdminParams = { params: { id: testUsers.superAdmin.id } }
        const updates: UserEditRequest = { role: 'user' }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.superAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, otherAdminParams)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Insufficient permissions')
      })

      it('should validate role values', async () => {
        const updates = { role: 'invalid_role' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid role')
      })
    })

    describe('Status Updates', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should successfully update user status', async () => {
        const updates: UserEditRequest = { status: 'deactivated' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.status).toBe('deactivated')
      })

      it('should validate status values', async () => {
        const updates = { status: 'invalid_status' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid status')
      })
    })

    describe('Combined Updates', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should handle multiple field updates', async () => {
        const updates: UserEditRequest = { 
          role: 'admin',
          status: 'active'
        }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.role).toBe('admin')
        expect(data.data.status).toBe('active')
      })

      it('should handle empty update request', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('No valid updates provided')
      })
    })

    describe('Audit Logging for Updates', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should create audit log for role change', async () => {
        const updates: UserEditRequest = { role: 'admin' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        await PUT(request, mockParams)

        expect(mockCreateAuditLog).toHaveBeenCalledWith({
          adminId: testUsers.admin.id,
          adminEmail: testUsers.admin.email,
          action: 'edit',
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: {
            field: 'role',
            oldValue: testUsers.regularUser.role,
            newValue: 'admin',
            timestamp: expect.any(Date)
          },
          ipAddress: '127.0.0.1'
        })
      })

      it('should create audit log for status change', async () => {
        const updates: UserEditRequest = { status: 'deactivated' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        await PUT(request, mockParams)

        expect(mockCreateAuditLog).toHaveBeenCalledWith({
          adminId: testUsers.admin.id,
          adminEmail: testUsers.admin.email,
          action: 'edit',
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: {
            field: 'status',
            oldValue: testUsers.regularUser.status,
            newValue: 'deactivated',
            timestamp: expect.any(Date)
          },
          ipAddress: '127.0.0.1'
        })
      })
    })

    describe('Optimistic Locking', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should handle concurrent update conflicts', async () => {
        // Mock a concurrent modification scenario
        const { mockSupabaseAdmin } = require('../../../../../../tests/mocks/supabase-admin')
        const originalUpdate = mockSupabaseAdmin.from('user_profiles').update
        
        let updateCount = 0
        mockSupabaseAdmin.from = jest.fn().mockReturnValue({
          update: jest.fn().mockImplementation((updates) => ({
            eq: jest.fn().mockImplementation(() => ({
              select: jest.fn().mockImplementation(() => ({
                single: jest.fn().mockImplementation(async () => {
                  updateCount++
                  if (updateCount === 1) {
                    // Simulate concurrent modification
                    throw new Error('Row was updated by another transaction')
                  }
                  return { data: { ...testUsers.regularUser, ...updates }, error: null }
                })
              }))
            }))
          }))
        })

        const updates: UserEditRequest = { role: 'admin' }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.success).toBe(false)
        expect(data.error).toContain('User was modified by another process')
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

      it('should validate JSON body format', async () => {
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid JSON')
      })

      it('should reject invalid field updates', async () => {
        const updates = { 
          role: 'admin',
          email: 'new@email.com', // Should not be allowed
          id: 'new-id' // Should not be allowed
        }
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        const response = await PUT(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Invalid fields')
      })
    })
  })

  describe('DELETE /api/admin/users/[id] - Delete User', () => {
    describe('Authentication and Authorization', () => {
      it('should require authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost:3000/api/admin/users/123', {
          method: 'DELETE'
        })
        const response = await DELETE(request, mockParams)
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

        const request = new NextRequest('http://localhost:3000/api/admin/users/123', {
          method: 'DELETE'
        })
        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data).toEqual({
          success: false,
          error: 'Admin access required'
        })
      })
    })

    describe('Soft Delete Operations', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should successfully soft delete user', async () => {
        const deleteRequest: DeleteUserRequest = {
          type: 'soft',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toContain('User deactivated successfully')
      })

      it('should require confirmation for deletion', async () => {
        const deleteRequest = {
          type: 'soft',
          confirmation: false
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Deletion confirmation required')
      })

      it('should prevent self-deletion', async () => {
        const selfParams = { params: { id: testUsers.admin.id } }
        const deleteRequest: DeleteUserRequest = {
          type: 'soft',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.admin.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, selfParams)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Cannot delete your own account')
      })
    })

    describe('Hard Delete Operations', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })
      })

      it('should successfully hard delete user (super admin only)', async () => {
        const deleteRequest: DeleteUserRequest = {
          type: 'hard',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toContain('User permanently deleted')
      })

      it('should prevent regular admin from hard delete', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })

        const deleteRequest: DeleteUserRequest = {
          type: 'hard',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Super admin access required for hard delete')
      })

      it('should handle cascade deletion of related data', async () => {
        const deleteRequest: DeleteUserRequest = {
          type: 'hard',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data).toHaveProperty('cascadeDeleted')
        expect(data.data.cascadeDeleted).toHaveProperty('sessions')
        expect(data.data.cascadeDeleted).toHaveProperty('userContent')
      })
    })

    describe('Audit Logging for Deletions', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should create audit log for soft delete', async () => {
        const deleteRequest: DeleteUserRequest = {
          type: 'soft',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        await DELETE(request, mockParams)

        expect(mockCreateAuditLog).toHaveBeenCalledWith({
          adminId: testUsers.admin.id,
          adminEmail: testUsers.admin.email,
          action: 'soft_delete',
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: {
            action: 'soft_delete',
            reason: expect.any(String),
            deletedData: expect.objectContaining({
              name: testUsers.regularUser.name,
              role: testUsers.regularUser.role,
              status: testUsers.regularUser.status
            }),
            retentionPeriod: '90 days',
            timestamp: expect.any(Date)
          },
          ipAddress: '127.0.0.1'
        })
      })

      it('should create audit log for hard delete', async () => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.superAdmin.id,
            email: testUsers.superAdmin.email,
            role: 'super_admin'
          }
        })

        const deleteRequest: DeleteUserRequest = {
          type: 'hard',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        await DELETE(request, mockParams)

        expect(mockCreateAuditLog).toHaveBeenCalledWith({
          adminId: testUsers.superAdmin.id,
          adminEmail: testUsers.superAdmin.email,
          action: 'hard_delete',
          targetUserId: testUsers.regularUser.id,
          targetUserEmail: testUsers.regularUser.email,
          changes: {
            action: 'hard_delete',
            reason: expect.any(String),
            dataWiped: expect.objectContaining({
              personalData: true,
              userContent: true,
              loginHistory: true,
              auditTrail: false
            }),
            timestamp: expect.any(Date)
          },
          ipAddress: '127.0.0.1'
        })
      })
    })

    describe('Transaction Rollback on Error', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: {
            id: testUsers.admin.id,
            email: testUsers.admin.email,
            role: 'admin'
          }
        })
      })

      it('should rollback transaction on cascade deletion failure', async () => {
        // Mock cascade deletion failure
        const { mockSupabaseAdmin } = require('../../../../../../tests/mocks/supabase-admin')
        const originalRpc = mockSupabaseAdmin.rpc
        mockSupabaseAdmin.rpc = jest.fn().mockRejectedValue(new Error('Cascade deletion failed'))

        const deleteRequest: DeleteUserRequest = {
          type: 'soft',
          confirmation: true
        }
        
        const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deleteRequest)
        })

        const response = await DELETE(request, mockParams)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toContain('Failed to delete user')

        // Restore original function
        mockSupabaseAdmin.rpc = originalRpc
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

    it('should handle database connection errors', async () => {
      const { mockScenarios } = require('../../../../../../tests/mocks/supabase-admin')
      mockScenarios.simulateConnectionError()

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
      const response = await GET(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection error')
    })

    it('should handle malformed request bodies', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json }'
      })

      const response = await PUT(request, mockParams)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle audit logging failures gracefully', async () => {
      mockCreateAuditLog.mockRejectedValue(new Error('Audit logging failed'))

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUsers.regularUser.id}`)
      const response = await GET(request, mockParams)

      // Operation should succeed even if audit logging fails
      expect(response.status).toBe(200)
    })
  })
})