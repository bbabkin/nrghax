import {
  isAdmin,
  isSuperAdmin,
  canEditUser,
  canDeleteUser,
  hasPermission,
  validateRoleHierarchy,
  checkResourceAccess,
  auditPermissionCheck,
} from './permissions'
import { UserRole, AdminUser } from '@/types/admin'

// Mock audit logging
jest.mock('./audit', () => ({
  logPermissionCheck: jest.fn(),
  logSecurityViolation: jest.fn(),
}))

describe('Permission Checking Utilities', () => {
  describe('isAdmin function', () => {
    it('should return true for admin role', () => {
      // Arrange
      const user = { role: 'admin' as UserRole }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(true)
    })

    it('should return true for super_admin role', () => {
      // Arrange
      const user = { role: 'super_admin' as UserRole }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(true)
    })

    it('should return false for user role', () => {
      // Arrange
      const user = { role: 'user' as UserRole }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for undefined role', () => {
      // Arrange
      const user = { role: undefined as any }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for null role', () => {
      // Arrange
      const user = { role: null as any }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(false)
    })

    it('should return false for invalid role string', () => {
      // Arrange
      const user = { role: 'invalid_role' as any }

      // Act
      const result = isAdmin(user)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('isSuperAdmin function', () => {
    it('should return true only for super_admin role', () => {
      // Arrange
      const superAdmin = { role: 'super_admin' as UserRole }
      const admin = { role: 'admin' as UserRole }
      const user = { role: 'user' as UserRole }

      // Act & Assert
      expect(isSuperAdmin(superAdmin)).toBe(true)
      expect(isSuperAdmin(admin)).toBe(false)
      expect(isSuperAdmin(user)).toBe(false)
    })

    it('should return false for malformed input', () => {
      // Arrange
      const invalidInputs = [
        { role: undefined },
        { role: null },
        { role: '' },
        { role: 'SUPER_ADMIN' }, // Wrong case
        {},
      ]

      // Act & Assert
      invalidInputs.forEach(input => {
        expect(isSuperAdmin(input as any)).toBe(false)
      })
    })
  })

  describe('canEditUser function', () => {
    it('should prevent self-editing', () => {
      // Arrange
      const currentUser = { id: 'user-123', role: 'admin' as UserRole }
      const targetUser = { id: 'user-123', role: 'user' as UserRole }

      // Act
      const result = canEditUser(currentUser, targetUser)

      // Assert
      expect(result).toBe(false)
    })

    it('should allow super_admin to edit anyone except themselves', () => {
      // Arrange
      const superAdmin = { id: 'super-123', role: 'super_admin' as UserRole }
      const testCases = [
        { id: 'user-123', role: 'user' as UserRole },
        { id: 'admin-123', role: 'admin' as UserRole },
        { id: 'other-super-123', role: 'super_admin' as UserRole },
      ]

      // Act & Assert
      testCases.forEach(targetUser => {
        expect(canEditUser(superAdmin, targetUser)).toBe(true)
      })
    })

    it('should allow admin to edit only regular users', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }

      // Act & Assert
      expect(canEditUser(admin, { id: 'user-123', role: 'user' as UserRole })).toBe(true)
      expect(canEditUser(admin, { id: 'other-admin-123', role: 'admin' as UserRole })).toBe(false)
      expect(canEditUser(admin, { id: 'super-123', role: 'super_admin' as UserRole })).toBe(false)
    })

    it('should prevent regular users from editing anyone', () => {
      // Arrange
      const user = { id: 'user-123', role: 'user' as UserRole }
      const targets = [
        { id: 'other-user-123', role: 'user' as UserRole },
        { id: 'admin-123', role: 'admin' as UserRole },
        { id: 'super-123', role: 'super_admin' as UserRole },
      ]

      // Act & Assert
      targets.forEach(target => {
        expect(canEditUser(user, target)).toBe(false)
      })
    })

    it('should handle malformed user objects gracefully', () => {
      // Arrange
      const validUser = { id: 'admin-123', role: 'admin' as UserRole }
      const malformedInputs = [
        { id: '', role: 'user' as UserRole },
        { id: 'user-123', role: undefined as any },
        { role: 'user' as UserRole }, // Missing id
        { id: 'user-123' }, // Missing role
        null,
        undefined,
      ]

      // Act & Assert
      malformedInputs.forEach(malformedUser => {
        expect(canEditUser(validUser, malformedUser as any)).toBe(false)
        expect(canEditUser(malformedUser as any, validUser)).toBe(false)
      })
    })
  })

  describe('canDeleteUser function', () => {
    it('should follow same rules as canEditUser for basic cases', () => {
      // Arrange
      const superAdmin = { id: 'super-123', role: 'super_admin' as UserRole }
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const user = { id: 'user-123', role: 'user' as UserRole }
      const targetUser = { id: 'target-123', role: 'user' as UserRole }

      // Act & Assert
      expect(canDeleteUser(superAdmin, targetUser)).toBe(canEditUser(superAdmin, targetUser))
      expect(canDeleteUser(admin, targetUser)).toBe(canEditUser(admin, targetUser))
      expect(canDeleteUser(user, targetUser)).toBe(canEditUser(user, targetUser))
    })

    it('should prevent deletion of users with active sessions', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const activeUser = { 
        id: 'user-123', 
        role: 'user' as UserRole,
        hasActiveSessions: true 
      }

      // Act
      const result = canDeleteUser(admin, activeUser as any)

      // Assert
      expect(result).toBe(false)
    })

    it('should require additional confirmation for permanent deletion', () => {
      // Arrange
      const superAdmin = { id: 'super-123', role: 'super_admin' as UserRole }
      const targetUser = { id: 'user-123', role: 'user' as UserRole }
      const options = { permanent: true }

      // Act
      const result = canDeleteUser(superAdmin, targetUser, options as any)

      // Assert
      // Should require explicit confirmation for permanent deletion
      expect(result).toBe(false) // Without confirmation
    })

    it('should allow soft deletion with proper permissions', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const targetUser = { id: 'user-123', role: 'user' as UserRole }
      const options = { permanent: false }

      // Act
      const result = canDeleteUser(admin, targetUser, options as any)

      // Assert
      expect(result).toBe(true)
    })
  })

  describe('hasPermission function (extended functionality)', () => {
    it('should check specific resource permissions', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const permissions = [
        'users.read',
        'users.edit', 
        'audit_logs.read',
        'settings.edit',
        'users.delete.soft',
      ]

      // Act & Assert
      permissions.forEach(permission => {
        const result = hasPermission(admin, permission)
        // Admin should have most permissions except sensitive ones
        if (permission.includes('delete') || permission.includes('settings.edit')) {
          expect(result).toBe(false) // Only super_admin should have these
        } else {
          expect(result).toBe(true)
        }
      })
    })

    it('should grant super_admin all permissions', () => {
      // Arrange
      const superAdmin = { id: 'super-123', role: 'super_admin' as UserRole }
      const allPermissions = [
        'users.read',
        'users.edit',
        'users.delete.soft',
        'users.delete.hard',
        'audit_logs.read',
        'settings.edit',
        'roles.change',
        'system.backup',
      ]

      // Act & Assert
      allPermissions.forEach(permission => {
        expect(hasPermission(superAdmin, permission)).toBe(true)
      })
    })

    it('should deny regular users all admin permissions', () => {
      // Arrange
      const user = { id: 'user-123', role: 'user' as UserRole }
      const adminPermissions = [
        'users.read',
        'users.edit',
        'audit_logs.read',
        'settings.edit',
      ]

      // Act & Assert
      adminPermissions.forEach(permission => {
        expect(hasPermission(user, permission)).toBe(false)
      })
    })
  })

  describe('validateRoleHierarchy function', () => {
    it('should validate role transitions are allowed', () => {
      // Arrange
      const validTransitions = [
        { from: 'user', to: 'admin', executor: 'super_admin' },
        { from: 'admin', to: 'user', executor: 'super_admin' },
        { from: 'user', to: 'user', executor: 'admin' }, // Status change
      ]

      const invalidTransitions = [
        { from: 'user', to: 'admin', executor: 'admin' }, // Can't promote to same level
        { from: 'admin', to: 'super_admin', executor: 'admin' }, // Can't promote above
        { from: 'super_admin', to: 'user', executor: 'admin' }, // Can't demote higher role
      ]

      // Act & Assert
      validTransitions.forEach(({ from, to, executor }) => {
        expect(validateRoleHierarchy(from as UserRole, to as UserRole, executor as UserRole)).toBe(true)
      })

      invalidTransitions.forEach(({ from, to, executor }) => {
        expect(validateRoleHierarchy(from as UserRole, to as UserRole, executor as UserRole)).toBe(false)
      })
    })

    it('should prevent role escalation attacks', () => {
      // Arrange - User trying to promote themselves
      const suspiciousAttempts = [
        { from: 'user', to: 'admin', executor: 'user' },
        { from: 'admin', to: 'super_admin', executor: 'admin' },
        { from: 'user', to: 'super_admin', executor: 'user' },
      ]

      // Act & Assert
      suspiciousAttempts.forEach(({ from, to, executor }) => {
        expect(validateRoleHierarchy(from as UserRole, to as UserRole, executor as UserRole)).toBe(false)
      })
    })
  })

  describe('checkResourceAccess function', () => {
    it('should validate access to specific user resources', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const resources = [
        { type: 'user', id: 'user-123', operation: 'read' },
        { type: 'user', id: 'user-123', operation: 'edit' },
        { type: 'user', id: 'admin-456', operation: 'read' },
        { type: 'user', id: 'admin-456', operation: 'edit' },
      ]

      // Act & Assert
      resources.forEach(resource => {
        const result = checkResourceAccess(admin, resource)
        
        if (resource.operation === 'read') {
          expect(result).toBe(true) // Admins can read all user data
        } else if (resource.operation === 'edit' && resource.id.includes('admin')) {
          expect(result).toBe(false) // Admins can't edit other admins
        } else {
          expect(result).toBe(true) // Admins can edit regular users
        }
      })
    })

    it('should validate access to audit logs', () => {
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole }
      const user = { id: 'user-123', role: 'user' as UserRole }
      const auditResource = { type: 'audit_log', id: 'log-123', operation: 'read' }

      // Act & Assert
      expect(checkResourceAccess(admin, auditResource)).toBe(true)
      expect(checkResourceAccess(user, auditResource)).toBe(false)
    })

    it('should handle resource ownership checks', () => {
      // Arrange
      const user = { id: 'user-123', role: 'user' as UserRole }
      const ownResource = { type: 'profile', id: 'user-123', operation: 'edit', owner: 'user-123' }
      const otherResource = { type: 'profile', id: 'user-456', operation: 'edit', owner: 'user-456' }

      // Act & Assert
      expect(checkResourceAccess(user, ownResource)).toBe(true) // Can edit own profile
      expect(checkResourceAccess(user, otherResource)).toBe(false) // Can't edit others
    })
  })

  describe('auditPermissionCheck function', () => {
    it('should log permission checks for security auditing', () => {
      const { logPermissionCheck } = require('./audit')
      
      // Arrange
      const admin = { id: 'admin-123', role: 'admin' as UserRole, email: 'admin@example.com' }
      const operation = { action: 'edit_user', targetId: 'user-456', resource: 'user' }
      const context = { ip: '192.168.1.1', userAgent: 'test-agent' }

      // Act
      auditPermissionCheck(admin, operation, true, context)

      // Assert
      expect(logPermissionCheck).toHaveBeenCalledWith({
        userId: 'admin-123',
        userEmail: 'admin@example.com',
        userRole: 'admin',
        operation: operation,
        allowed: true,
        context: context,
        timestamp: expect.any(Date),
      })
    })

    it('should log security violations when permissions are denied', () => {
      const { logSecurityViolation } = require('./audit')
      
      // Arrange
      const user = { id: 'user-123', role: 'user' as UserRole, email: 'user@example.com' }
      const operation = { action: 'delete_user', targetId: 'user-456', resource: 'user' }
      const context = { ip: '10.0.0.1', userAgent: 'malicious-script' }

      // Act
      auditPermissionCheck(user, operation, false, context)

      // Assert
      expect(logSecurityViolation).toHaveBeenCalledWith({
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'user',
        attemptedOperation: operation,
        context: context,
        timestamp: expect.any(Date),
        severity: 'HIGH', // Delete operations are high severity violations
      })
    })
  })

  describe('Edge Cases and Security Considerations', () => {
    it('should handle concurrent role changes during permission checks', () => {
      // Arrange - Simulate race condition where user role changes during check
      const user = { id: 'user-123', role: 'admin' as UserRole }
      const targetUser = { id: 'target-123', role: 'user' as UserRole }

      // Act - Check permission
      const initialResult = canEditUser(user, targetUser)
      
      // Simulate role change
      user.role = 'user'
      const subsequentResult = canEditUser(user, targetUser)

      // Assert
      expect(initialResult).toBe(true)
      expect(subsequentResult).toBe(false)
    })

    it('should prevent time-of-check-time-of-use (TOCTOU) attacks', () => {
      // Arrange
      const user = { id: 'user-123', role: 'admin' as UserRole }
      const operation = { action: 'edit_user', targetId: 'target-123', timestamp: Date.now() }

      // Act - Permission check with timestamp validation
      const result = hasPermission(user, 'users.edit', { 
        operation,
        maxAge: 5000, // 5 seconds
      })

      // Assert
      expect(result).toBe(true)

      // Simulate delayed execution (potential TOCTOU attack)
      setTimeout(() => {
        const delayedResult = hasPermission(user, 'users.edit', {
          operation,
          maxAge: 5000,
        })
        expect(delayedResult).toBe(false) // Should fail due to expired timestamp
      }, 6000)
    })

    it('should validate input sanitization', () => {
      // Arrange - Malicious input attempts
      const maliciousInputs = [
        { id: '<script>alert("xss")</script>', role: 'admin' as UserRole },
        { id: 'user-123; DROP TABLE users;--', role: 'admin' as UserRole },
        { id: 'user-123', role: 'admin" OR "1"="1' as any },
        { id: '../../../etc/passwd', role: 'admin' as UserRole },
      ]

      const validTarget = { id: 'user-123', role: 'user' as UserRole }

      // Act & Assert
      maliciousInputs.forEach(maliciousUser => {
        expect(() => canEditUser(maliciousUser, validTarget)).not.toThrow()
        expect(canEditUser(maliciousUser, validTarget)).toBe(false)
      })
    })

    it('should handle memory exhaustion attacks', () => {
      // Arrange - Simulate large role hierarchy check
      const deepRoleHierarchy = Array(10000).fill(0).map((_, i) => ({
        id: `user-${i}`,
        role: i % 3 === 0 ? 'admin' : 'user' as UserRole,
      }))

      const admin = { id: 'admin-test', role: 'admin' as UserRole }

      // Act - Should handle large datasets without memory issues
      const start = performance.now()
      const results = deepRoleHierarchy.map(user => canEditUser(admin, user))
      const end = performance.now()

      // Assert - Should complete within reasonable time (< 1 second)
      expect(end - start).toBeLessThan(1000)
      expect(results).toHaveLength(10000)
    })
  })
})