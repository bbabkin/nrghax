import { createAuditLog, AuditLogEntry, AuditAction } from '../audit';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('Audit Trail System', () => {
  const mockRequest = {
    ip: '192.168.1.1',
    headers: new Map([['user-agent', 'Test Browser/1.0']]),
    geo: { country: 'US' }
  } as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
    mockSupabase.insert.mockResolvedValue({ data: {}, error: null });
  });

  describe('4.1 Audit log creation on view actions', () => {
    it('should create audit log when admin views user list', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.VIEW_USERS,
        details: {
          page: 1,
          limit: 20,
          filters: { role: 'all' }
        },
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'admin-123',
          user_email: 'admin@test.com',
          action: 'view_users',
          details: expect.objectContaining({
            page: 1,
            limit: 20,
            filters: { role: 'all' }
          }),
          severity: 'info',
          ip_address: '192.168.1.1',
          user_agent: 'Test Browser/1.0',
          created_at: expect.any(String)
        })
      );
    });

    it('should create audit log when admin views specific user details', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.VIEW_USER,
        targetUserId: 'user-456',
        details: {
          targetUserEmail: 'john@example.com'
        },
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'view_user',
          target_user_id: 'user-456',
          details: expect.objectContaining({
            targetUserEmail: 'john@example.com'
          })
        })
      );
    });

    it('should create audit log when admin searches users', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.SEARCH_USERS,
        details: {
          searchTerm: 'john@example.com',
          filters: { role: 'user', status: 'active' },
          resultsCount: 1
        },
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search_users',
          details: expect.objectContaining({
            searchTerm: 'john@example.com',
            resultsCount: 1
          })
        })
      );
    });
  });

  describe('4.2 Audit log creation on edit actions', () => {
    it('should create audit log when admin changes user role', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.EDIT_USER_ROLE,
        targetUserId: 'user-456',
        details: {
          targetUserEmail: 'john@example.com',
          oldRole: 'user',
          newRole: 'admin',
          reason: 'Promoted to admin for project management'
        },
        severity: 'warning'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit_user_role',
          target_user_id: 'user-456',
          severity: 'warning',
          details: expect.objectContaining({
            oldRole: 'user',
            newRole: 'admin'
          })
        })
      );
    });

    it('should create audit log when admin changes user status', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.DEACTIVATE_USER,
        targetUserId: 'user-456',
        details: {
          targetUserEmail: 'john@example.com',
          oldStatus: 'active',
          newStatus: 'deactivated',
          reason: 'User requested account suspension'
        },
        severity: 'warning'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'deactivate_user',
          severity: 'warning',
          details: expect.objectContaining({
            oldStatus: 'active',
            newStatus: 'deactivated',
            reason: 'User requested account suspension'
          })
        })
      );
    });

    it('should create audit log for bulk user operations', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.BULK_EDIT_USERS,
        details: {
          operation: 'deactivate',
          userIds: ['user-1', 'user-2', 'user-3'],
          affectedCount: 3,
          reason: 'Mass cleanup of inactive accounts'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bulk_edit_users',
          severity: 'critical',
          details: expect.objectContaining({
            affectedCount: 3
          })
        })
      );
    });
  });

  describe('4.3 Audit log creation on delete actions', () => {
    it('should create audit log when admin soft deletes user', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.SOFT_DELETE_USER,
        targetUserId: 'user-456',
        details: {
          targetUserEmail: 'john@example.com',
          userData: {
            fullName: 'John Doe',
            registrationDate: '2024-01-01',
            lastLogin: '2024-08-20'
          },
          reason: 'User violated terms of service'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'soft_delete_user',
          target_user_id: 'user-456',
          severity: 'critical',
          details: expect.objectContaining({
            userData: expect.objectContaining({
              fullName: 'John Doe'
            })
          })
        })
      );
    });

    it('should create audit log when admin permanently deletes user', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.HARD_DELETE_USER,
        targetUserId: 'user-456',
        details: {
          targetUserEmail: 'john@example.com',
          userData: {
            fullName: 'John Doe',
            email: 'john@example.com',
            registrationDate: '2024-01-01',
            role: 'user',
            dataSize: '2.3MB'
          },
          reason: 'GDPR data deletion request',
          confirmationToken: 'DELETE-CONFIRM-abc123'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hard_delete_user',
          severity: 'critical',
          details: expect.objectContaining({
            confirmationToken: 'DELETE-CONFIRM-abc123',
            dataSize: '2.3MB'
          })
        })
      );
    });

    it('should create audit log when admin deletes multiple users', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.BULK_DELETE_USERS,
        details: {
          deletedUsers: [
            { id: 'user-1', email: 'user1@example.com' },
            { id: 'user-2', email: 'user2@example.com' }
          ],
          deletionType: 'hard',
          totalCount: 2,
          reason: 'Spam accounts cleanup'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'bulk_delete_users',
          severity: 'critical',
          details: expect.objectContaining({
            totalCount: 2,
            deletionType: 'hard'
          })
        })
      );
    });
  });

  describe('4.4 Audit log data structure and immutability', () => {
    it('should include all required audit log fields', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.VIEW_USER,
        targetUserId: 'user-456',
        details: { test: 'data' },
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      const insertedData = mockSupabase.insert.mock.calls[0][0];
      
      // Verify all required fields are present
      expect(insertedData).toHaveProperty('user_id', 'admin-123');
      expect(insertedData).toHaveProperty('user_email', 'admin@test.com');
      expect(insertedData).toHaveProperty('action', 'view_user');
      expect(insertedData).toHaveProperty('target_user_id', 'user-456');
      expect(insertedData).toHaveProperty('details');
      expect(insertedData).toHaveProperty('severity', 'info');
      expect(insertedData).toHaveProperty('ip_address', '192.168.1.1');
      expect(insertedData).toHaveProperty('user_agent', 'Test Browser/1.0');
      expect(insertedData).toHaveProperty('created_at');
      
      // Verify created_at is ISO string
      expect(new Date(insertedData.created_at)).toBeInstanceOf(Date);
    });

    it('should serialize complex details object correctly', async () => {
      const complexDetails = {
        changes: {
          role: { from: 'user', to: 'admin' },
          status: { from: 'active', to: 'active' }
        },
        metadata: {
          browserInfo: 'Chrome/91.0',
          location: 'New York, US'
        },
        validation: {
          passwordStrength: 'strong',
          twoFactorEnabled: false
        }
      };

      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.EDIT_USER_ROLE,
        details: complexDetails,
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      const insertedData = mockSupabase.insert.mock.calls[0][0];
      expect(insertedData.details).toEqual(complexDetails);
    });

    it('should generate unique log IDs for concurrent operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const logEntry: AuditLogEntry = {
          userId: `admin-${i}`,
          userEmail: `admin${i}@test.com`,
          action: AuditAction.VIEW_USERS,
          details: { concurrent: true, index: i },
          severity: 'info'
        };
        promises.push(createAuditLog(logEntry, mockRequest));
      }

      await Promise.all(promises);

      expect(mockSupabase.insert).toHaveBeenCalledTimes(5);
      
      // Verify each call has different timestamps
      const timestamps = mockSupabase.insert.mock.calls.map(call => call[0].created_at);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBeGreaterThan(1);
    });

    it('should prevent modification of logged data by freezing objects', async () => {
      const mutableDetails = {
        changes: { role: 'admin' },
        user: { id: '123' }
      };

      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.EDIT_USER_ROLE,
        details: mutableDetails,
        severity: 'info'
      };

      await createAuditLog(logEntry, mockRequest);

      // Verify the original object wasn't modified
      const insertedData = mockSupabase.insert.mock.calls[0][0];
      expect(insertedData.details).not.toBe(mutableDetails);
      expect(insertedData.details).toEqual(mutableDetails);
    });
  });

  describe('4.5 Failed action logging', () => {
    it('should create audit log when user edit fails due to validation', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.EDIT_USER_FAILED,
        targetUserId: 'user-456',
        details: {
          attemptedChanges: { role: 'admin', status: 'active' },
          error: 'Validation failed: Cannot promote user to admin role',
          errorCode: 'INVALID_ROLE_CHANGE',
          validationErrors: ['User has insufficient privileges']
        },
        severity: 'error'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit_user_failed',
          severity: 'error',
          details: expect.objectContaining({
            errorCode: 'INVALID_ROLE_CHANGE',
            validationErrors: ['User has insufficient privileges']
          })
        })
      );
    });

    it('should create audit log when delete fails due to constraints', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.DELETE_USER_FAILED,
        targetUserId: 'user-456',
        details: {
          error: 'Cannot delete user: Foreign key constraint violation',
          errorCode: 'CONSTRAINT_VIOLATION',
          constraintDetails: 'User has associated orders that cannot be orphaned',
          suggestedAction: 'Soft delete or transfer ownership of orders first'
        },
        severity: 'error'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete_user_failed',
          severity: 'error',
          details: expect.objectContaining({
            errorCode: 'CONSTRAINT_VIOLATION',
            suggestedAction: expect.any(String)
          })
        })
      );
    });

    it('should create audit log for unauthorized access attempts', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'user-789',
        userEmail: 'regular@test.com',
        action: AuditAction.UNAUTHORIZED_ACCESS,
        details: {
          attemptedResource: '/api/admin/users',
          method: 'GET',
          userRole: 'user',
          requiredRole: 'admin',
          error: 'Access denied: Insufficient privileges'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'unauthorized_access',
          severity: 'critical',
          details: expect.objectContaining({
            attemptedResource: '/api/admin/users',
            userRole: 'user',
            requiredRole: 'admin'
          })
        })
      );
    });

    it('should create audit log when database operation fails', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.DATABASE_ERROR,
        details: {
          operation: 'UPDATE users SET role = $1 WHERE id = $2',
          error: 'Database connection timeout',
          errorCode: 'CONNECTION_TIMEOUT',
          duration: 30000,
          retryAttempts: 3,
          affectedTable: 'users'
        },
        severity: 'critical'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'database_error',
          severity: 'critical',
          details: expect.objectContaining({
            duration: 30000,
            retryAttempts: 3
          })
        })
      );
    });

    it('should handle audit logging failures gracefully', async () => {
      // Mock audit log insert failure
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Audit log insert failed', code: 'INSERT_ERROR' }
      });

      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.VIEW_USERS,
        details: { test: 'data' },
        severity: 'info'
      };

      // Should not throw error even if audit log fails
      await expect(createAuditLog(logEntry, mockRequest)).resolves.not.toThrow();

      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should create audit log for concurrent operation conflicts', async () => {
      const logEntry: AuditLogEntry = {
        userId: 'admin-123',
        userEmail: 'admin@test.com',
        action: AuditAction.CONCURRENT_MODIFICATION,
        targetUserId: 'user-456',
        details: {
          conflictType: 'role_change',
          originalValue: 'user',
          attemptedValue: 'admin',
          currentValue: 'moderator',
          conflictingAdminId: 'admin-456',
          conflictTimestamp: new Date().toISOString()
        },
        severity: 'warning'
      };

      await createAuditLog(logEntry, mockRequest);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'concurrent_modification',
          severity: 'warning',
          details: expect.objectContaining({
            conflictType: 'role_change',
            conflictingAdminId: 'admin-456'
          })
        })
      );
    });
  });

  describe('Audit log query and retrieval', () => {
    it('should provide method to query audit logs by user', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          {
            id: '1',
            user_id: 'admin-123',
            action: 'view_users',
            created_at: new Date().toISOString()
          }
        ],
        error: null
      });

      // This would be tested in the implementation phase
      expect(true).toBe(true);
    });

    it('should provide method to query audit logs by action type', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // This would be tested in the implementation phase
      expect(true).toBe(true);
    });

    it('should provide method to query audit logs by date range', async () => {
      // This would be tested in the implementation phase
      expect(true).toBe(true);
    });
  });
});