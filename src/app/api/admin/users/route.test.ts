/**
 * TDD API Tests for GET /api/admin/users endpoint
 * Phase 1.3 - RED PHASE: These tests will fail initially as the API doesn't exist yet
 * 
 * Tests comprehensive user management functionality including:
 * - User list retrieval with pagination
 * - Search functionality (name/email)
 * - Role and status filtering
 * - Sorting capabilities
 * - Authorization checks
 * - Error handling
 */

import { NextRequest } from 'next/server'
import { GET } from './route'
import { sampleAdminUsers, usersByRole, usersByStatus, searchTestData, paginationTestData } from '../../../../../tests/fixtures/admin-users-data'
import { testUsers } from '../../../../../tests/fixtures/admin-users-data'
import type { AdminUser, UserRole, AccountStatus, PaginatedResponse } from '@/types/admin'

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

describe('GET /api/admin/users - User List Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock Supabase data before each test
    const { mockSupabaseAdmin } = require('../../../../../tests/mocks/supabase-admin')
    mockSupabaseAdmin.__resetMockData()
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      // Mock unauthenticated request
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Authentication required'
      })
    })

    it('should require admin role', async () => {
      // Mock authenticated regular user
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.regularUser.id,
          email: testUsers.regularUser.email,
          role: 'user'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        success: false,
        error: 'Admin access required'
      })
    })

    it('should allow admin access', async () => {
      // Mock authenticated admin user
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
    })

    it('should allow super admin access', async () => {
      // Mock authenticated super admin user
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.superAdmin.id,
          email: testUsers.superAdmin.email,
          role: 'super_admin'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
    })
  })

  describe('Basic User List Retrieval', () => {
    beforeEach(() => {
      // Mock authenticated admin for all tests in this group
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should return paginated user list with default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number)
      })
      
      // Verify structure of returned users
      expect(data.data.data.length).toBeGreaterThan(0)
      data.data.data.forEach((user: AdminUser) => {
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
        expect(user).toHaveProperty('status')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
      })
    })

    it('should return correct total count', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.total).toBe(sampleAdminUsers.length)
      expect(data.data.totalPages).toBe(Math.ceil(sampleAdminUsers.length / 10))
    })

    it('should include all required user fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      const user = data.data.data[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('name')
      expect(user).toHaveProperty('image')
      expect(user).toHaveProperty('role')
      expect(user).toHaveProperty('status')
      expect(user).toHaveProperty('emailVerified')
      expect(user).toHaveProperty('createdAt')
      expect(user).toHaveProperty('updatedAt')
      expect(user).toHaveProperty('lastLogin')
      expect(user).toHaveProperty('loginCount')
      expect(user).toHaveProperty('authProvider')
    })
  })

  describe('Pagination Functionality', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should handle custom page and limit parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=2&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.page).toBe(2)
      expect(data.data.limit).toBe(5)
      expect(data.data.data.length).toBeLessThanOrEqual(5)
    })

    it('should handle first page correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=3')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(3)
      expect(data.data.data.length).toBeLessThanOrEqual(3)
    })

    it('should handle empty page results', async () => {
      // Request a page that exceeds total pages
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=999&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data).toEqual([])
      expect(data.data.page).toBe(999)
    })

    it('should validate page parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=0&limit=-5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid pagination parameters')
    })

    it('should enforce maximum limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?limit=1000')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Limit cannot exceed')
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should search users by email', async () => {
      const searchTerm = 'admin'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${searchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      // Verify all returned users match search criteria
      data.data.data.forEach((user: AdminUser) => {
        const matchesEmail = user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesName = user.name?.toLowerCase().includes(searchTerm.toLowerCase())
        expect(matchesEmail || matchesName).toBe(true)
      })
    })

    it('should search users by name', async () => {
      const searchTerm = 'john'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${searchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Verify search results contain users with matching names
      const hasMatchingName = data.data.data.some((user: AdminUser) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      expect(hasMatchingName).toBe(true)
    })

    it('should handle search with no results', async () => {
      const searchTerm = 'nonexistent'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${searchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data).toEqual([])
      expect(data.data.total).toBe(0)
    })

    it('should handle empty search parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?search=')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should return all users when search is empty
      expect(data.data.total).toBe(sampleAdminUsers.length)
    })

    it('should perform case-insensitive search', async () => {
      const searchTerm = 'ADMIN'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${searchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
    })

    it('should search by partial email domain', async () => {
      const searchTerm = '@example.com'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${searchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.email).toContain(searchTerm)
      })
    })
  })

  describe('Role Filtering', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should filter users by super_admin role', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=super_admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.role).toBe('super_admin')
      })
    })

    it('should filter users by admin role', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.role).toBe('admin')
      })
    })

    it('should filter users by user role', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=user')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.role).toBe('user')
      })
    })

    it('should return all users when role is "all"', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=all')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(sampleAdminUsers.length)
    })

    it('should handle invalid role filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=invalid_role')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid role filter')
    })
  })

  describe('Status Filtering', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should filter users by active status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?status=active')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.data.length).toBeGreaterThan(0)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.status).toBe('active')
      })
    })

    it('should filter users by deactivated status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?status=deactivated')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.status).toBe('deactivated')
      })
    })

    it('should return all users when status is "all"', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?status=all')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.total).toBe(sampleAdminUsers.length)
    })

    it('should handle invalid status filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?status=invalid_status')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid status filter')
    })
  })

  describe('Sorting Functionality', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should sort users by name ascending', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=name&sortOrder=asc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Verify sorting order
      for (let i = 1; i < data.data.data.length; i++) {
        const prevName = data.data.data[i - 1].name || ''
        const currName = data.data.data[i].name || ''
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0)
      }
    })

    it('should sort users by email descending', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=email&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Verify sorting order
      for (let i = 1; i < data.data.data.length; i++) {
        const prevEmail = data.data.data[i - 1].email
        const currEmail = data.data.data[i].email
        expect(prevEmail.localeCompare(currEmail)).toBeGreaterThanOrEqual(0)
      }
    })

    it('should sort users by createdAt descending (default)', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=createdAt&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Verify sorting order
      for (let i = 1; i < data.data.data.length; i++) {
        const prevDate = new Date(data.data.data[i - 1].createdAt).getTime()
        const currDate = new Date(data.data.data[i].createdAt).getTime()
        expect(prevDate).toBeGreaterThanOrEqual(currDate)
      }
    })

    it('should sort users by lastLogin with null handling', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=lastLogin&sortOrder=desc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Users with null lastLogin should appear at the end when sorting desc
      const usersWithNullLogin = data.data.data.filter((user: AdminUser) => !user.lastLogin)
      if (usersWithNullLogin.length > 0) {
        const lastIndex = data.data.data.length - 1
        expect(data.data.data[lastIndex].lastLogin).toBeFalsy()
      }
    })

    it('should handle invalid sort field', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortBy=invalidField')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid sort field')
    })

    it('should handle invalid sort order', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?sortOrder=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid sort order')
    })
  })

  describe('Combined Filters', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should combine search and role filter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?search=admin&role=admin')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.role).toBe('admin')
        const matchesSearch = user.email.toLowerCase().includes('admin') || 
                             user.name?.toLowerCase().includes('admin')
        expect(matchesSearch).toBe(true)
      })
    })

    it('should combine role and status filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=user&status=active')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      data.data.data.forEach((user: AdminUser) => {
        expect(user.role).toBe('user')
        expect(user.status).toBe('active')
      })
    })

    it('should combine all filters with pagination and sorting', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?search=user&role=user&status=active&page=1&limit=5&sortBy=email&sortOrder=asc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.page).toBe(1)
      expect(data.data.limit).toBe(5)
      expect(data.data.data.length).toBeLessThanOrEqual(5)
      
      data.data.data.forEach((user: AdminUser, index: number) => {
        expect(user.role).toBe('user')
        expect(user.status).toBe('active')
        
        // Verify email sorting
        if (index > 0) {
          expect(user.email.localeCompare(data.data.data[index - 1].email)).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should handle malformed query parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=abc&limit=xyz')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid pagination parameters')
    })

    it('should handle special characters in search', async () => {
      const searchTerm = 'user@test.com'
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${encodeURIComponent(searchTerm)}`)
      const response = await GET(request)

      expect(response.status).toBe(200)
      // Should not crash with special characters
    })

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)
      const request = new NextRequest(`http://localhost:3000/api/admin/users?search=${longSearchTerm}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Search term too long')
    })

    it('should handle concurrent requests properly', async () => {
      const requests = Array(5).fill(null).map(() => 
        GET(new NextRequest('http://localhost:3000/api/admin/users'))
      )
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Database Error Handling', () => {
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
      // Simulate database connection error
      const { mockScenarios } = require('../../../../../tests/mocks/supabase-admin')
      mockScenarios.simulateConnectionError()

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database connection error')
    })

    it('should handle permission denied errors', async () => {
      // Simulate permission denied error
      const { mockScenarios } = require('../../../../../tests/mocks/supabase-admin')
      mockScenarios.simulatePermissionDenied()

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Insufficient permissions')
    })

    it('should handle unexpected database errors gracefully', async () => {
      // Mock unexpected error
      const { mockSupabaseAdmin } = require('../../../../../tests/mocks/supabase-admin')
      const originalRpc = mockSupabaseAdmin.rpc
      mockSupabaseAdmin.rpc = jest.fn().mockRejectedValue(new Error('Unexpected database error'))

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')

      // Restore original function
      mockSupabaseAdmin.rpc = originalRpc
    })
  })

  describe('Response Format Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should return consistent response format for success', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('data')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('page')
      expect(data.data).toHaveProperty('limit')
      expect(data.data).toHaveProperty('totalPages')
    })

    it('should return consistent response format for errors', async () => {
      // Mock unauthenticated request
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(data).not.toHaveProperty('data')
    })

    it('should include proper HTTP headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await GET(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('Rate Limiting (if implemented)', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          role: 'admin'
        }
      })
    })

    it('should handle rate limiting gracefully', async () => {
      // This test would be implemented once rate limiting is added
      // For now, just verify the endpoint handles multiple requests
      
      const requests = Array(10).fill(null).map(() => 
        GET(new NextRequest('http://localhost:3000/api/admin/users'))
      )
      
      const responses = await Promise.all(requests)
      
      // All requests should succeed (no rate limiting implemented yet)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })
    })
  })
})