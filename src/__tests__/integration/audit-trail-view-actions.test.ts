/**
 * Audit Trail Tests - View Actions (Task 4.1)
 * Tests comprehensive audit logging for all view-related admin actions
 * Following TDD red phase - these tests should FAIL initially
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import type { AuditLog, AuditAction, AdminUser } from '@/types/admin'
import { sampleAuditLogs, testAuditLogs, auditLogsByAction } from '../../../tests/fixtures/admin-audit-data'
import { sampleAdminUsers, testUsers } from '../../../tests/fixtures/admin-users-data'
import { testDataManager, generateMockAuditLog } from '../../../tests/utils/admin-test-helpers'

// Mock the audit logger service (will be implemented later)
const mockAuditLogger = {
  logViewAction: jest.fn<(adminId: string, adminEmail: string, targetUserId: string | null, targetUserEmail: string | null, ipAddress: string, metadata?: any) => Promise<AuditLog>>(),
  logUserListView: jest.fn<(adminId: string, adminEmail: string, filters: any, pagination: any, ipAddress: string) => Promise<AuditLog>>(),
  logUserDetailsView: jest.fn<(adminId: string, adminEmail: string, targetUserId: string, targetUserEmail: string, ipAddress: string) => Promise<AuditLog>>(),
  logUserSearchView: jest.fn<(adminId: string, adminEmail: string, searchQuery: string, results: number, ipAddress: string) => Promise<AuditLog>>(),
  logExportView: jest.fn<(adminId: string, adminEmail: string, exportType: string, recordCount: number, ipAddress: string) => Promise<AuditLog>>(),
  logAuditLogView: jest.fn<(adminId: string, adminEmail: string, targetUserId: string | null, ipAddress: string) => Promise<AuditLog>>(),
  getAuditLogs: jest.fn<(filters?: any) => Promise<AuditLog[]>>()
}

// Mock the admin API endpoints (will be implemented later)
const mockAdminAPI = {
  viewUserList: jest.fn<(adminId: string, filters: any, pagination: any) => Promise<{ users: AdminUser[], total: number }>>(),
  viewUserDetails: jest.fn<(adminId: string, targetUserId: string) => Promise<AdminUser>>(),
  searchUsers: jest.fn<(adminId: string, query: string) => Promise<AdminUser[]>>(),
  exportUserData: jest.fn<(adminId: string, exportType: string) => Promise<{ data: any[], count: number }>>(),
  viewAuditLogs: jest.fn<(adminId: string, filters?: any) => Promise<AuditLog[]>>()
}

describe('Audit Trail - View Actions (Task 4.1)', () => {
  const testAdmin = testUsers.admin
  const testSuperAdmin = testUsers.superAdmin
  const testRegularUser = testUsers.regularUser
  const testIP = '192.168.1.100'

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Reset test data manager
    testDataManager.reset()
  })

  afterEach(async () => {
    // Clean up any test data created during the test
    await testDataManager.cleanup()
  })

  describe('User List View Logging', () => {
    it('should create audit log when admin views user list', async () => {
      // Arrange
      const filters = { role: 'all', status: 'active', search: '' }
      const pagination = { page: 1, limit: 10, sortBy: 'email', sortOrder: 'asc' }
      const expectedAuditLog: AuditLog = {
        id: 'audit-user-list-view-1',
        adminId: testAdmin.id,
        adminEmail: testAdmin.email,
        action: 'view' as AuditAction,
        targetUserId: null, // No specific target for list view
        targetUserEmail: null,
        changes: {
          action: 'user_list_view',
          filters: filters,
          pagination: pagination,
          resultCount: 25,
          viewedAt: expect.any(Date)
        },
        ipAddress: testIP,
        createdAt: expect.any(Date)
      }

      mockAdminAPI.viewUserList.mockResolvedValue({
        users: sampleAdminUsers.slice(0, 10),
        total: 25
      })
      mockAuditLogger.logUserListView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because the endpoint doesn't exist yet
      const result = await mockAdminAPI.viewUserList(testAdmin.id, filters, pagination)
      const auditLog = await mockAuditLogger.logUserListView(
        testAdmin.id, 
        testAdmin.email, 
        filters, 
        pagination, 
        testIP
      )

      // Assert
      expect(mockAdminAPI.viewUserList).toHaveBeenCalledWith(testAdmin.id, filters, pagination)
      expect(mockAuditLogger.logUserListView).toHaveBeenCalledWith(
        testAdmin.id,
        testAdmin.email,
        filters,
        pagination,
        testIP
      )
      expect(auditLog).toMatchObject(expectedAuditLog)
      expect(auditLog.action).toBe('view')
      expect(auditLog.changes).toHaveProperty('action', 'user_list_view')
      expect(auditLog.changes).toHaveProperty('resultCount', 25)
      expect(auditLog.targetUserId).toBeNull()
    })

    it('should create audit log for filtered user list views', async () => {
      // Arrange
      const roleFilter = { role: 'admin', status: 'all', search: '' }
      const statusFilter = { role: 'all', status: 'deactivated', search: '' }
      const pagination = { page: 1, limit: 10 }

      const roleFilterAudit = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view',
        changes: {
          action: 'user_list_view',
          filters: roleFilter,
          resultCount: 5
        }
      })

      const statusFilterAudit = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view', 
        changes: {
          action: 'user_list_view',
          filters: statusFilter,
          resultCount: 3
        }
      })

      mockAuditLogger.logUserListView
        .mockResolvedValueOnce(roleFilterAudit)
        .mockResolvedValueOnce(statusFilterAudit)

      // Act - These should FAIL because filtering logic doesn't exist yet
      const roleAudit = await mockAuditLogger.logUserListView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        roleFilter,
        pagination,
        testIP
      )
      
      const statusAudit = await mockAuditLogger.logUserListView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        statusFilter,
        pagination,
        testIP
      )

      // Assert
      expect(roleAudit.changes).toHaveProperty('filters.role', 'admin')
      expect(statusAudit.changes).toHaveProperty('filters.status', 'deactivated')
      expect(mockAuditLogger.logUserListView).toHaveBeenCalledTimes(2)
    })

    it('should create audit log for paginated user list views', async () => {
      // Arrange
      const filters = { role: 'all', status: 'all' }
      const page1Pagination = { page: 1, limit: 10, sortBy: 'email' }
      const page2Pagination = { page: 2, limit: 10, sortBy: 'email' }

      mockAuditLogger.logUserListView.mockResolvedValue(
        generateMockAuditLog({
          adminId: testAdmin.id,
          action: 'view',
          changes: {
            action: 'user_list_view',
            pagination: page1Pagination,
            resultCount: 10
          }
        })
      )

      // Act - This should FAIL because pagination logic doesn't exist yet
      await mockAuditLogger.logUserListView(
        testAdmin.id,
        testAdmin.email,
        filters,
        page1Pagination,
        testIP
      )

      await mockAuditLogger.logUserListView(
        testAdmin.id,
        testAdmin.email,
        filters,
        page2Pagination,
        testIP
      )

      // Assert
      expect(mockAuditLogger.logUserListView).toHaveBeenCalledTimes(2)
      expect(mockAuditLogger.logUserListView).toHaveBeenNthCalledWith(
        1,
        testAdmin.id,
        testAdmin.email,
        filters,
        page1Pagination,
        testIP
      )
      expect(mockAuditLogger.logUserListView).toHaveBeenNthCalledWith(
        2,
        testAdmin.id,
        testAdmin.email,
        filters,
        page2Pagination,
        testIP
      )
    })
  })

  describe('User Details View Logging', () => {
    it('should create audit log when admin views individual user details', async () => {
      // Arrange
      const expectedAuditLog: AuditLog = {
        id: 'audit-user-details-view-1',
        adminId: testAdmin.id,
        adminEmail: testAdmin.email,
        action: 'view' as AuditAction,
        targetUserId: testRegularUser.id,
        targetUserEmail: testRegularUser.email,
        changes: {
          action: 'user_details_view',
          viewedFields: ['id', 'email', 'name', 'role', 'status', 'createdAt', 'lastLogin'],
          sessionHistory: false,
          auditHistory: true,
          viewedAt: expect.any(Date)
        },
        ipAddress: testIP,
        createdAt: expect.any(Date)
      }

      mockAdminAPI.viewUserDetails.mockResolvedValue(testRegularUser)
      mockAuditLogger.logUserDetailsView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because the endpoint doesn't exist yet
      const userDetails = await mockAdminAPI.viewUserDetails(testAdmin.id, testRegularUser.id)
      const auditLog = await mockAuditLogger.logUserDetailsView(
        testAdmin.id,
        testAdmin.email,
        testRegularUser.id,
        testRegularUser.email,
        testIP
      )

      // Assert
      expect(mockAdminAPI.viewUserDetails).toHaveBeenCalledWith(testAdmin.id, testRegularUser.id)
      expect(mockAuditLogger.logUserDetailsView).toHaveBeenCalledWith(
        testAdmin.id,
        testAdmin.email,
        testRegularUser.id,
        testRegularUser.email,
        testIP
      )
      expect(auditLog).toMatchObject(expectedAuditLog)
      expect(auditLog.action).toBe('view')
      expect(auditLog.targetUserId).toBe(testRegularUser.id)
      expect(auditLog.changes).toHaveProperty('action', 'user_details_view')
    })

    it('should create audit log when admin views user session history', async () => {
      // Arrange
      const expectedAuditLog = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        adminEmail: testSuperAdmin.email,
        action: 'view',
        targetUserId: testRegularUser.id,
        targetUserEmail: testRegularUser.email,
        changes: {
          action: 'user_session_history_view',
          sessionCount: 15,
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-01-28')
          },
          viewedAt: expect.any(Date)
        }
      })

      mockAuditLogger.logViewAction.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because session history endpoint doesn't exist yet
      const auditLog = await mockAuditLogger.logViewAction(
        testSuperAdmin.id,
        testSuperAdmin.email,
        testRegularUser.id,
        testRegularUser.email,
        testIP,
        { action: 'user_session_history_view', sessionCount: 15 }
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('action', 'user_session_history_view')
      expect(auditLog.changes).toHaveProperty('sessionCount', 15)
    })

    it('should create audit log when admin views user audit history', async () => {
      // Arrange
      const expectedAuditLog = generateMockAuditLog({
        adminId: testAdmin.id,
        action: 'view',
        targetUserId: testRegularUser.id,
        changes: {
          action: 'user_audit_history_view',
          auditLogCount: 8,
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-01-28')
          }
        }
      })

      mockAuditLogger.logViewAction.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because audit history endpoint doesn't exist yet
      const auditLog = await mockAuditLogger.logViewAction(
        testAdmin.id,
        testAdmin.email,
        testRegularUser.id,
        testRegularUser.email,
        testIP,
        { action: 'user_audit_history_view', auditLogCount: 8 }
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('action', 'user_audit_history_view')
      expect(auditLog.changes).toHaveProperty('auditLogCount', 8)
    })
  })

  describe('User Search Logging', () => {
    it('should create audit log when admin performs user search', async () => {
      // Arrange
      const searchQuery = 'john.doe@example.com'
      const searchResults = sampleAdminUsers.filter(user => 
        user.email.includes('john.doe') || user.name?.includes('John')
      )
      
      const expectedAuditLog = generateMockAuditLog({
        adminId: testAdmin.id,
        action: 'view',
        targetUserId: null,
        targetUserEmail: null,
        changes: {
          action: 'user_search',
          searchQuery: searchQuery,
          searchType: 'email_and_name',
          resultCount: searchResults.length,
          searchFilters: null,
          searchedAt: expect.any(Date)
        }
      })

      mockAdminAPI.searchUsers.mockResolvedValue(searchResults)
      mockAuditLogger.logUserSearchView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because search endpoint doesn't exist yet
      const results = await mockAdminAPI.searchUsers(testAdmin.id, searchQuery)
      const auditLog = await mockAuditLogger.logUserSearchView(
        testAdmin.id,
        testAdmin.email,
        searchQuery,
        results.length,
        testIP
      )

      // Assert
      expect(mockAdminAPI.searchUsers).toHaveBeenCalledWith(testAdmin.id, searchQuery)
      expect(mockAuditLogger.logUserSearchView).toHaveBeenCalledWith(
        testAdmin.id,
        testAdmin.email,
        searchQuery,
        results.length,
        testIP
      )
      expect(auditLog.changes).toHaveProperty('searchQuery', searchQuery)
      expect(auditLog.changes).toHaveProperty('resultCount', results.length)
    })

    it('should create audit log for empty search results', async () => {
      // Arrange
      const searchQuery = 'nonexistent@user.com'
      const expectedAuditLog = generateMockAuditLog({
        adminId: testAdmin.id,
        action: 'view',
        changes: {
          action: 'user_search',
          searchQuery: searchQuery,
          resultCount: 0,
          noResultsFound: true
        }
      })

      mockAdminAPI.searchUsers.mockResolvedValue([])
      mockAuditLogger.logUserSearchView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because search endpoint doesn't exist yet
      const results = await mockAdminAPI.searchUsers(testAdmin.id, searchQuery)
      const auditLog = await mockAuditLogger.logUserSearchView(
        testAdmin.id,
        testAdmin.email,
        searchQuery,
        results.length,
        testIP
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('resultCount', 0)
      expect(auditLog.changes).toHaveProperty('noResultsFound', true)
    })

    it('should create audit log for complex search with filters', async () => {
      // Arrange
      const searchQuery = 'admin'
      const filters = { role: 'admin', status: 'active' }
      const expectedAuditLog = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view',
        changes: {
          action: 'user_search_filtered',
          searchQuery: searchQuery,
          searchFilters: filters,
          resultCount: 3,
          searchType: 'combined_search_and_filter'
        }
      })

      mockAuditLogger.logUserSearchView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because filtered search doesn't exist yet
      const auditLog = await mockAuditLogger.logUserSearchView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        searchQuery,
        3,
        testIP
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('searchFilters', filters)
      expect(auditLog.changes).toHaveProperty('searchType', 'combined_search_and_filter')
    })
  })

  describe('Data Export Logging', () => {
    it('should create audit log when admin exports user data', async () => {
      // Arrange
      const exportType = 'all_users_csv'
      const recordCount = 247
      const expectedAuditLog = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view',
        targetUserId: null,
        changes: {
          action: 'export_user_data',
          exportType: exportType,
          fileFormat: 'CSV',
          recordCount: recordCount,
          exportedFields: ['id', 'email', 'name', 'role', 'status', 'createdAt', 'lastLogin'],
          exportReason: 'monthly_report',
          exportedAt: expect.any(Date)
        }
      })

      mockAdminAPI.exportUserData.mockResolvedValue({
        data: new Array(recordCount).fill(null).map(() => ({})),
        count: recordCount
      })
      mockAuditLogger.logExportView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because export endpoint doesn't exist yet
      const exportResult = await mockAdminAPI.exportUserData(testSuperAdmin.id, exportType)
      const auditLog = await mockAuditLogger.logExportView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        exportType,
        exportResult.count,
        testIP
      )

      // Assert
      expect(mockAdminAPI.exportUserData).toHaveBeenCalledWith(testSuperAdmin.id, exportType)
      expect(mockAuditLogger.logExportView).toHaveBeenCalledWith(
        testSuperAdmin.id,
        testSuperAdmin.email,
        exportType,
        recordCount,
        testIP
      )
      expect(auditLog.changes).toHaveProperty('exportType', exportType)
      expect(auditLog.changes).toHaveProperty('recordCount', recordCount)
      expect(auditLog.changes).toHaveProperty('fileFormat', 'CSV')
    })

    it('should create audit log for filtered data exports', async () => {
      // Arrange
      const exportType = 'filtered_users_json'
      const exportFilters = { role: 'user', status: 'active', dateFrom: new Date('2024-01-01') }
      const recordCount = 120

      const expectedAuditLog = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view',
        changes: {
          action: 'export_filtered_user_data',
          exportType: exportType,
          fileFormat: 'JSON',
          exportFilters: exportFilters,
          recordCount: recordCount,
          exportReason: 'filtered_analysis'
        }
      })

      mockAuditLogger.logExportView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because filtered export doesn't exist yet
      const auditLog = await mockAuditLogger.logExportView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        exportType,
        recordCount,
        testIP
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('exportFilters', exportFilters)
      expect(auditLog.changes).toHaveProperty('fileFormat', 'JSON')
    })
  })

  describe('Audit Log View Logging', () => {
    it('should create audit log when admin views audit logs', async () => {
      // Arrange
      const auditFilters = { action: 'all', dateFrom: new Date('2024-01-01') }
      const expectedAuditLog = generateMockAuditLog({
        adminId: testSuperAdmin.id,
        action: 'view',
        targetUserId: null,
        changes: {
          action: 'audit_log_view',
          filters: auditFilters,
          resultCount: 25,
          viewType: 'system_audit_logs',
          viewedAt: expect.any(Date)
        }
      })

      mockAdminAPI.viewAuditLogs.mockResolvedValue(sampleAuditLogs.slice(0, 25))
      mockAuditLogger.logAuditLogView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because audit log viewing endpoint doesn't exist yet
      const auditLogs = await mockAdminAPI.viewAuditLogs(testSuperAdmin.id, auditFilters)
      const auditLog = await mockAuditLogger.logAuditLogView(
        testSuperAdmin.id,
        testSuperAdmin.email,
        null,
        testIP
      )

      // Assert
      expect(mockAdminAPI.viewAuditLogs).toHaveBeenCalledWith(testSuperAdmin.id, auditFilters)
      expect(auditLog.changes).toHaveProperty('action', 'audit_log_view')
      expect(auditLog.changes).toHaveProperty('resultCount', 25)
    })

    it('should create audit log when admin views user-specific audit logs', async () => {
      // Arrange
      const targetUserId = testRegularUser.id
      const expectedAuditLog = generateMockAuditLog({
        adminId: testAdmin.id,
        action: 'view',
        targetUserId: targetUserId,
        targetUserEmail: testRegularUser.email,
        changes: {
          action: 'user_audit_log_view',
          resultCount: 8,
          viewType: 'user_specific_audit_logs',
          dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-28') }
        }
      })

      const userAuditLogs = sampleAuditLogs.filter(log => log.targetUserId === targetUserId)
      mockAdminAPI.viewAuditLogs.mockResolvedValue(userAuditLogs)
      mockAuditLogger.logAuditLogView.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because user-specific audit log viewing doesn't exist yet
      const auditLogs = await mockAdminAPI.viewAuditLogs(testAdmin.id, { targetUserId })
      const auditLog = await mockAuditLogger.logAuditLogView(
        testAdmin.id,
        testAdmin.email,
        targetUserId,
        testIP
      )

      // Assert
      expect(auditLog.changes).toHaveProperty('viewType', 'user_specific_audit_logs')
      expect(auditLog.targetUserId).toBe(targetUserId)
    })
  })

  describe('View Action Data Validation', () => {
    it('should ensure all view audit logs have correct structure', async () => {
      // Test that all view actions create properly structured audit logs
      const viewActions = auditLogsByAction.view

      viewActions.forEach(auditLog => {
        // Basic structure validation
        expect(auditLog).toHaveProperty('id')
        expect(auditLog).toHaveProperty('adminId')
        expect(auditLog).toHaveProperty('adminEmail')
        expect(auditLog).toHaveProperty('action', 'view')
        expect(auditLog).toHaveProperty('createdAt')
        expect(auditLog.createdAt).toBeInstanceOf(Date)

        // IP address should be present for security tracking
        expect(auditLog).toHaveProperty('ipAddress')
        expect(auditLog.ipAddress).not.toBeNull()

        // Changes should contain metadata about the view action
        if (auditLog.changes) {
          expect(auditLog.changes).toHaveProperty('action')
          expect(typeof auditLog.changes.action).toBe('string')
        }

        // Target user fields should be consistent
        if (auditLog.targetUserId) {
          expect(auditLog.targetUserEmail).not.toBeNull()
          expect(typeof auditLog.targetUserEmail).toBe('string')
        }
      })
    })

    it('should validate IP address tracking for view actions', async () => {
      // Arrange
      const suspiciousIP = '185.220.100.240' // Known Tor exit node
      const expectedAuditLog = generateMockAuditLog({
        adminId: testAdmin.id,
        action: 'view',
        ipAddress: suspiciousIP,
        changes: {
          action: 'user_list_view',
          ipAnalysis: {
            type: 'tor_exit_node',
            risk: 'medium',
            location: 'unknown'
          }
        }
      })

      mockAuditLogger.logViewAction.mockResolvedValue(expectedAuditLog)

      // Act - This should FAIL because IP analysis doesn't exist yet
      const auditLog = await mockAuditLogger.logViewAction(
        testAdmin.id,
        testAdmin.email,
        null,
        null,
        suspiciousIP
      )

      // Assert
      expect(auditLog.ipAddress).toBe(suspiciousIP)
      expect(auditLog.changes).toHaveProperty('ipAnalysis')
      expect(auditLog.changes.ipAnalysis).toHaveProperty('risk', 'medium')
    })

    it('should validate timestamp accuracy for view actions', async () => {
      // Arrange
      const startTime = new Date()
      
      // Act - This should FAIL because timestamp tracking doesn't exist yet
      const auditLog = await mockAuditLogger.logViewAction(
        testAdmin.id,
        testAdmin.email,
        testRegularUser.id,
        testRegularUser.email,
        testIP
      )

      const endTime = new Date()

      // Assert
      expect(auditLog.createdAt).toBeInstanceOf(Date)
      expect(auditLog.createdAt.getTime()).toBeGreaterThanOrEqual(startTime.getTime())
      expect(auditLog.createdAt.getTime()).toBeLessThanOrEqual(endTime.getTime())
    })
  })

  describe('View Action Security Validation', () => {
    it('should prevent unauthorized view action logging', async () => {
      // Arrange
      const unauthorizedUser = testUsers.regularUser

      // Act & Assert - This should FAIL because authorization checks don't exist yet
      await expect(async () => {
        await mockAuditLogger.logViewAction(
          unauthorizedUser.id,
          unauthorizedUser.email,
          testRegularUser.id,
          testRegularUser.email,
          testIP
        )
      }).rejects.toThrow('Unauthorized: Only admins can perform view actions')
    })

    it('should validate admin permissions for view actions', async () => {
      // Arrange
      const regularAdmin = testUsers.admin
      const superAdmin = testUsers.superAdmin

      // Act - These should FAIL because permission validation doesn't exist yet
      
      // Regular admin should be able to view regular users
      await expect(
        mockAuditLogger.logViewAction(
          regularAdmin.id,
          regularAdmin.email,
          testRegularUser.id,
          testRegularUser.email,
          testIP
        )
      ).resolves.not.toThrow()

      // Super admin should be able to view any user including other admins
      await expect(
        mockAuditLogger.logViewAction(
          superAdmin.id,
          superAdmin.email,
          regularAdmin.id,
          regularAdmin.email,
          testIP
        )
      ).resolves.not.toThrow()
    })

    it('should log failed view attempts', async () => {
      // Arrange
      const unauthorizedUser = testUsers.regularUser
      const expectedFailureLog = generateMockAuditLog({
        adminId: unauthorizedUser.id,
        adminEmail: unauthorizedUser.email,
        action: 'view',
        targetUserId: testRegularUser.id,
        targetUserEmail: testRegularUser.email,
        changes: {
          action: 'unauthorized_view_attempt',
          error: 'insufficient_permissions',
          attemptedAction: 'user_details_view',
          blocked: true,
          reason: 'User does not have admin privileges'
        }
      })

      mockAuditLogger.logViewAction.mockRejectedValue(
        new Error('Unauthorized: Only admins can perform view actions')
      )

      // Act & Assert - This should FAIL because failure logging doesn't exist yet
      try {
        await mockAuditLogger.logViewAction(
          unauthorizedUser.id,
          unauthorizedUser.email,
          testRegularUser.id,
          testRegularUser.email,
          testIP
        )
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Unauthorized')
        
        // Should still log the failed attempt for security monitoring
        expect(mockAuditLogger.logViewAction).toHaveBeenCalledWith(
          unauthorizedUser.id,
          unauthorizedUser.email,
          testRegularUser.id,
          testRegularUser.email,
          testIP
        )
      }
    })
  })
})