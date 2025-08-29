/**
 * @jest-environment node
 * 
 * Tests for AuditLogger service
 * These tests are in TDD RED PHASE - they will fail until implementation
 */

import { AuditLogger } from '../audit-logger'
import { createClient } from '@/lib/supabase/server'
import type { AuditLog, AuditAction } from '@/types/admin'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('AuditLogger', () => {
  let auditLogger: AuditLogger
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis()
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    
    auditLogger = new AuditLogger()
  })
  
  describe('Audit Log Creation', () => {
    describe('View Actions', () => {
      it('should create audit log for user profile view', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-1' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'view',
          adminUser,
          targetUser,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs')
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          admin_id: adminUser.id,
          admin_email: adminUser.email,
          action: 'view',
          target_user_id: targetUser.id,
          target_user_email: targetUser.email,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }))
      })
      
      it('should create audit log for user list view', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-2' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'view',
          adminUser,
          targetUser: null,
          metadata: {
            view_type: 'user_list',
            filters: { role: 'user', status: 'active' },
            page: 1,
            limit: 20
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'view',
          target_user_id: null,
          metadata: expect.objectContaining({
            view_type: 'user_list',
            filters: expect.any(Object)
          })
        }))
      })
      
      it('should create audit log for audit history view', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-3' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'view',
          adminUser,
          metadata: {
            view_type: 'audit_logs',
            date_range: { from: '2024-01-01', to: '2024-12-31' }
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'view',
          metadata: expect.objectContaining({
            view_type: 'audit_logs'
          })
        }))
      })
      
      it('should track session information for view actions', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const,
          sessionId: 'session-123'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-4' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'view',
          adminUser,
          sessionId: adminUser.sessionId,
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          session_id: 'session-123'
        }))
      })
      
      it('should handle bulk view operations', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        const userIds = ['user-1', 'user-2', 'user-3']
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-5' }, error: null })
        
        const result = await auditLogger.logBulkAction({
          action: 'view',
          adminUser,
          targetUserIds: userIds,
          metadata: {
            operation: 'bulk_profile_export'
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'view',
          metadata: expect.objectContaining({
            bulk_operation: true,
            user_count: 3,
            user_ids: userIds
          })
        }))
      })
    })
    
    describe('Edit Actions', () => {
      it('should create audit log for role change', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-6' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'edit',
          adminUser,
          targetUser,
          changes: {
            field: 'role',
            oldValue: 'user',
            newValue: 'admin'
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'edit',
          changes: expect.objectContaining({
            field: 'role',
            oldValue: 'user',
            newValue: 'admin'
          })
        }))
      })
      
      it('should create audit log for status change', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-7' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'edit',
          adminUser,
          targetUser,
          changes: {
            field: 'status',
            oldValue: 'active',
            newValue: 'deactivated',
            reason: 'Policy violation'
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          changes: expect.objectContaining({
            reason: 'Policy violation'
          })
        }))
      })
      
      it('should create audit log for multiple field changes', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-8' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'edit',
          adminUser,
          targetUser,
          changes: [
            { field: 'role', oldValue: 'user', newValue: 'admin' },
            { field: 'status', oldValue: 'active', newValue: 'active' },
            { field: 'email_verified', oldValue: false, newValue: true }
          ],
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          changes: expect.arrayContaining([
            expect.objectContaining({ field: 'role' }),
            expect.objectContaining({ field: 'status' }),
            expect.objectContaining({ field: 'email_verified' })
          ])
        }))
      })
      
      it('should track edit timestamps with microsecond precision', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-9' }, error: null })
        
        const beforeTime = Date.now()
        
        const result = await auditLogger.logAction({
          action: 'edit',
          adminUser,
          targetUser: { id: 'user-1', email: 'user@example.com' },
          changes: { field: 'status', oldValue: 'active', newValue: 'deactivated' },
          ipAddress: '192.168.1.1'
        })
        
        const afterTime = Date.now()
        
        expect(result.success).toBe(true)
        const insertCall = mockSupabase.insert.mock.calls[0][0]
        const timestamp = new Date(insertCall.created_at).getTime()
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
        expect(timestamp).toBeLessThanOrEqual(afterTime)
      })
      
      it('should include request context for edit actions', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-10' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'edit',
          adminUser,
          targetUser: { id: 'user-1', email: 'user@example.com' },
          changes: { field: 'role', oldValue: 'user', newValue: 'admin' },
          requestContext: {
            method: 'PUT',
            endpoint: '/api/admin/users/user-1',
            responseTime: 145,
            statusCode: 200
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          request_context: expect.objectContaining({
            method: 'PUT',
            endpoint: '/api/admin/users/user-1'
          })
        }))
      })
    })
    
    describe('Delete Actions', () => {
      it('should create audit log for soft delete', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-11' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'soft_delete',
          adminUser,
          targetUser,
          metadata: {
            reason: 'Account suspension',
            retention_period: '90 days',
            deleted_data_snapshot: targetUser
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'soft_delete',
          metadata: expect.objectContaining({
            reason: 'Account suspension',
            retention_period: '90 days',
            deleted_data_snapshot: expect.any(Object)
          })
        }))
      })
      
      it('should create audit log for hard delete', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com'
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-12' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'hard_delete',
          adminUser,
          targetUser,
          metadata: {
            reason: 'GDPR data removal request',
            compliance_ticket: 'GDPR-2024-001',
            permanently_deleted: true
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'hard_delete',
          metadata: expect.objectContaining({
            permanently_deleted: true,
            compliance_ticket: 'GDPR-2024-001'
          })
        }))
      })
      
      it('should store deleted user data for recovery purposes', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        const targetUser = {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          metadata: { subscription: 'pro' }
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-13' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'soft_delete',
          adminUser,
          targetUser,
          metadata: {
            deleted_data_backup: targetUser
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          metadata: expect.objectContaining({
            deleted_data_backup: expect.objectContaining({
              id: 'user-1',
              email: 'user@example.com',
              name: 'John Doe'
            })
          })
        }))
      })
      
      it('should handle cascade deletion logging', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-14' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'hard_delete',
          adminUser,
          targetUser: { id: 'user-1', email: 'user@example.com' },
          metadata: {
            cascade_deletions: {
              sessions: 5,
              oauth_accounts: 2,
              profile_data: 1,
              audit_logs: 150
            }
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          metadata: expect.objectContaining({
            cascade_deletions: expect.objectContaining({
              sessions: 5,
              oauth_accounts: 2
            })
          })
        }))
      })
      
      it('should require confirmation code for delete actions', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-15' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'soft_delete',
          adminUser,
          targetUser: { id: 'user-1', email: 'user@example.com' },
          metadata: {
            confirmation_code: 'DELETE-USER-1-2024',
            confirmed_at: new Date().toISOString()
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          metadata: expect.objectContaining({
            confirmation_code: 'DELETE-USER-1-2024'
          })
        }))
      })
    })
    
    describe('Other Administrative Actions', () => {
      it('should log role_change actions separately from edit', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-16' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'role_change',
          adminUser,
          targetUser: { id: 'user-1', email: 'user@example.com' },
          changes: {
            field: 'role',
            oldValue: 'user',
            newValue: 'admin'
          },
          metadata: {
            approval_required: true,
            approved_by: 'super-admin-2'
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'role_change',
          metadata: expect.objectContaining({
            approval_required: true
          })
        }))
      })
      
      it('should log create actions for new admin users', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-17' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'create',
          adminUser,
          targetUser: { id: 'new-admin-1', email: 'newadmin@example.com' },
          metadata: {
            created_role: 'admin',
            invitation_sent: true
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          action: 'create'
        }))
      })
      
      it('should log system actions without target user', async () => {
        const adminUser = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'super_admin' as const
        }
        
        mockSupabase.insert.mockResolvedValue({ data: { id: 'log-18' }, error: null })
        
        const result = await auditLogger.logAction({
          action: 'view',
          adminUser,
          targetUser: null,
          metadata: {
            system_action: 'export_all_users',
            record_count: 1500
          },
          ipAddress: '192.168.1.1'
        })
        
        expect(result.success).toBe(true)
        expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
          target_user_id: null,
          target_user_email: null
        }))
      })
    })
  })
  
  describe('Audit Log Data Structure and Immutability', () => {
    it('should enforce required fields in audit log structure', async () => {
      const invalidLog = {
        action: 'view'
        // Missing required fields
      }
      
      await expect(auditLogger.logAction(invalidLog as any)).rejects.toThrow('Missing required fields')
    })
    
    it('should validate action types against allowed values', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      const result = await auditLogger.logAction({
        action: 'invalid_action' as any,
        adminUser,
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid action type')
    })
    
    it('should generate unique IDs for each audit log entry', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'unique-id-1' }, error: null })
      
      const result1 = await auditLogger.logAction({
        action: 'view',
        adminUser,
        ipAddress: '192.168.1.1'
      })
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'unique-id-2' }, error: null })
      
      const result2 = await auditLogger.logAction({
        action: 'view',
        adminUser,
        ipAddress: '192.168.1.1'
      })
      
      expect(result1.data?.id).not.toBe(result2.data?.id)
    })
    
    it('should prevent modification of existing audit logs', async () => {
      const logId = 'existing-log-1'
      
      mockSupabase.eq.mockReturnThis()
      mockSupabase.update = jest.fn().mockResolvedValue({
        error: { message: 'Audit logs are immutable' }
      })
      
      const result = await auditLogger.updateLog(logId, { action: 'edit' })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('immutable')
    })
    
    it('should prevent deletion of audit logs', async () => {
      const logId = 'existing-log-1'
      
      mockSupabase.eq.mockReturnThis()
      mockSupabase.delete = jest.fn().mockResolvedValue({
        error: { message: 'Audit logs cannot be deleted' }
      })
      
      const result = await auditLogger.deleteLog(logId)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('cannot be deleted')
    })
    
    it('should include all required metadata fields', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-19' }, error: null })
      
      await auditLogger.logAction({
        action: 'view',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })
      
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        admin_id: expect.any(String),
        admin_email: expect.any(String),
        action: expect.any(String),
        created_at: expect.any(String),
        ip_address: expect.any(String),
        user_agent: expect.any(String)
      }))
    })
    
    it('should sanitize sensitive data from audit logs', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-20' }, error: null })
      
      const result = await auditLogger.logAction({
        action: 'edit',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        changes: {
          field: 'password',
          oldValue: 'oldPassword123',
          newValue: 'newPassword456'
        },
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        changes: expect.objectContaining({
          field: 'password',
          oldValue: '[REDACTED]',
          newValue: '[REDACTED]'
        })
      }))
    })
    
    it('should handle JSON serialization for complex metadata', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      const complexMetadata = {
        nested: {
          deeply: {
            nested: {
              value: 'test'
            }
          }
        },
        array: [1, 2, 3],
        date: new Date().toISOString(),
        null_value: null,
        undefined_value: undefined
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-21' }, error: null })
      
      const result = await auditLogger.logAction({
        action: 'view',
        adminUser,
        metadata: complexMetadata,
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({
          nested: expect.any(Object),
          array: expect.any(Array)
        })
      }))
    })
  })
  
  describe('Failed Action Logging', () => {
    it('should log failed view attempts', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-22' }, error: null })
      
      const result = await auditLogger.logFailedAction({
        action: 'view',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        error: 'Permission denied',
        errorCode: 'FORBIDDEN',
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'view',
        status: 'failed',
        error_message: 'Permission denied',
        error_code: 'FORBIDDEN'
      }))
    })
    
    it('should log failed edit attempts with validation errors', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-23' }, error: null })
      
      const result = await auditLogger.logFailedAction({
        action: 'edit',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        attemptedChanges: {
          field: 'role',
          oldValue: 'user',
          newValue: 'invalid_role'
        },
        error: 'Invalid role value',
        errorCode: 'VALIDATION_ERROR',
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        attempted_changes: expect.objectContaining({
          newValue: 'invalid_role'
        })
      }))
    })
    
    it('should log failed delete attempts', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-24' }, error: null })
      
      const result = await auditLogger.logFailedAction({
        action: 'soft_delete',
        adminUser,
        targetUser: { id: 'admin-2', email: 'admin2@example.com' },
        error: 'Cannot delete another admin',
        errorCode: 'PERMISSION_DENIED',
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'soft_delete',
        status: 'failed',
        error_message: 'Cannot delete another admin'
      }))
    })
    
    it('should log database connection failures', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      // First call fails with connection error
      mockSupabase.insert.mockRejectedValueOnce(new Error('Connection timeout'))
      
      // Retry succeeds
      mockSupabase.insert.mockResolvedValueOnce({ data: { id: 'log-25' }, error: null })
      
      const result = await auditLogger.logAction({
        action: 'view',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        ipAddress: '192.168.1.1'
      })
      
      // Should retry and succeed
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2)
    })
    
    it('should log rate limiting violations', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-26' }, error: null })
      
      const result = await auditLogger.logFailedAction({
        action: 'view',
        adminUser,
        error: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          requests_made: 101,
          limit: 100,
          window: '1 minute',
          retry_after: 60
        },
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        error_code: 'RATE_LIMIT_EXCEEDED',
        metadata: expect.objectContaining({
          requests_made: 101
        })
      }))
    })
    
    it('should log authentication failures', async () => {
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-27' }, error: null })
      
      const result = await auditLogger.logFailedAction({
        action: 'view',
        adminUser: null,
        error: 'Authentication required',
        errorCode: 'UNAUTHENTICATED',
        metadata: {
          attempted_endpoint: '/api/admin/users',
          auth_header_present: false
        },
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        admin_id: null,
        admin_email: null,
        status: 'failed',
        error_code: 'UNAUTHENTICATED'
      }))
    })
    
    it('should handle cascading audit log failures gracefully', async () => {
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      }
      
      // Simulate complete audit logging failure
      mockSupabase.insert.mockRejectedValue(new Error('Database unavailable'))
      
      const result = await auditLogger.logAction({
        action: 'edit',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        changes: { field: 'role', oldValue: 'user', newValue: 'admin' },
        ipAddress: '192.168.1.1'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create audit log')
      expect(result.fallbackLogged).toBe(true) // Should log to fallback system
    })
  })
  
  describe('Audit Log Retrieval and Querying', () => {
    it('should retrieve audit logs by admin ID', async () => {
      const mockLogs = [
        { id: 'log-1', admin_id: 'admin-1', action: 'view' },
        { id: 'log-2', admin_id: 'admin-1', action: 'edit' }
      ]
      
      mockSupabase.eq.mockReturnThis()
      mockSupabase.select.mockResolvedValue({ data: mockLogs, error: null })
      
      const result = await auditLogger.getLogsByAdmin('admin-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockSupabase.eq).toHaveBeenCalledWith('admin_id', 'admin-1')
    })
    
    it('should retrieve audit logs by target user', async () => {
      const mockLogs = [
        { id: 'log-1', target_user_id: 'user-1', action: 'view' },
        { id: 'log-2', target_user_id: 'user-1', action: 'edit' },
        { id: 'log-3', target_user_id: 'user-1', action: 'soft_delete' }
      ]
      
      mockSupabase.eq.mockReturnThis()
      mockSupabase.select.mockResolvedValue({ data: mockLogs, error: null })
      
      const result = await auditLogger.getLogsByTargetUser('user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(mockSupabase.eq).toHaveBeenCalledWith('target_user_id', 'user-1')
    })
    
    it('should retrieve audit logs by date range', async () => {
      const mockLogs = [
        { id: 'log-1', created_at: '2024-01-15T10:00:00Z' },
        { id: 'log-2', created_at: '2024-01-20T10:00:00Z' }
      ]
      
      mockSupabase.gte.mockReturnThis()
      mockSupabase.lte.mockReturnThis()
      mockSupabase.select.mockResolvedValue({ data: mockLogs, error: null })
      
      const result = await auditLogger.getLogsByDateRange(
        '2024-01-01T00:00:00Z',
        '2024-01-31T23:59:59Z'
      )
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00Z')
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-31T23:59:59Z')
    })
    
    it('should paginate audit log results', async () => {
      const mockLogs = Array(10).fill(null).map((_, i) => ({
        id: `log-${i}`,
        action: 'view'
      }))
      
      mockSupabase.range.mockReturnThis()
      mockSupabase.select.mockResolvedValue({ data: mockLogs, error: null })
      
      const result = await auditLogger.getLogs({
        page: 2,
        limit: 10
      })
      
      expect(result.success).toBe(true)
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19)
    })
  })
  
  describe('Compliance and Retention', () => {
    it('should not delete audit logs older than retention period', async () => {
      // Audit logs should be immutable, even past retention
      const result = await auditLogger.cleanupOldLogs(90) // 90 days retention
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Audit logs cannot be deleted')
    })
    
    it('should archive old audit logs instead of deleting', async () => {
      mockSupabase.update = jest.fn().mockReturnThis()
      mockSupabase.lte.mockReturnThis()
      mockSupabase.update.mockResolvedValue({ data: { count: 100 }, error: null })
      
      const result = await auditLogger.archiveOldLogs(365) // Archive after 1 year
      
      expect(result.success).toBe(true)
      expect(result.data?.archivedCount).toBe(100)
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        archived: true,
        archived_at: expect.any(String)
      }))
    })
    
    it('should export audit logs for compliance reporting', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'view', created_at: '2024-01-01T00:00:00Z' },
        { id: 'log-2', action: 'edit', created_at: '2024-01-02T00:00:00Z' }
      ]
      
      mockSupabase.select.mockResolvedValue({ data: mockLogs, error: null })
      
      const result = await auditLogger.exportForCompliance({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        format: 'csv'
      })
      
      expect(result.success).toBe(true)
      expect(result.data?.format).toBe('csv')
      expect(result.data?.recordCount).toBe(2)
      expect(result.data?.content).toContain('id,action,created_at')
    })
  })
})

// Additional edge cases and security tests
describe('AuditLogger Security', () => {
  let auditLogger: AuditLogger
  let mockSupabase: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis()
    }
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
    auditLogger = new AuditLogger()
  })
  
  it('should prevent SQL injection in audit log queries', async () => {
    const maliciousInput = "'; DROP TABLE audit_logs; --"
    
    mockSupabase.eq.mockReturnThis()
    mockSupabase.select.mockResolvedValue({ data: [], error: null })
    
    const result = await auditLogger.getLogsByAdmin(maliciousInput)
    
    expect(result.success).toBe(true)
    // Should properly escape the input
    expect(mockSupabase.eq).toHaveBeenCalledWith('admin_id', maliciousInput)
  })
  
  it('should validate IP addresses format', async () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin' as const
    }
    
    const result = await auditLogger.logAction({
      action: 'view',
      adminUser,
      ipAddress: 'not-an-ip'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid IP address format')
  })
  
  it('should handle concurrent audit log writes', async () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin' as const
    }
    
    mockSupabase.insert.mockResolvedValue({ data: { id: 'log-concurrent' }, error: null })
    
    const promises = Array(10).fill(null).map((_, i) => 
      auditLogger.logAction({
        action: 'view',
        adminUser,
        targetUser: { id: `user-${i}`, email: `user${i}@example.com` },
        ipAddress: '192.168.1.1'
      })
    )
    
    const results = await Promise.all(promises)
    
    expect(results.every(r => r.success)).toBe(true)
    expect(mockSupabase.insert).toHaveBeenCalledTimes(10)
  })
  
  it('should mask sensitive fields in audit logs', async () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin' as const
    }
    
    const sensitiveFields = ['password', 'ssn', 'credit_card', 'api_key']
    
    for (const field of sensitiveFields) {
      mockSupabase.insert.mockResolvedValue({ data: { id: 'log-sensitive' }, error: null })
      
      await auditLogger.logAction({
        action: 'edit',
        adminUser,
        targetUser: { id: 'user-1', email: 'user@example.com' },
        changes: {
          field,
          oldValue: 'sensitive-data-123',
          newValue: 'sensitive-data-456'
        },
        ipAddress: '192.168.1.1'
      })
      
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        changes: expect.objectContaining({
          field,
          oldValue: '[REDACTED]',
          newValue: '[REDACTED]'
        })
      }))
    }
  })
})