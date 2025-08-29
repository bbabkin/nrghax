/**
 * Test fixtures for Audit Log data
 * Provides mock audit log entries for various administrative actions
 */

import type { AuditLog, AuditAction } from '@/types/admin'
import { sampleAdminUsers, testUsers } from './admin-users-data'

/**
 * Sample audit log entries covering all audit actions and scenarios
 */
// Safely access test users with fallbacks to prevent undefined errors
const safeTestUsers = {
  superAdmin: { id: testUsers.superAdmin?.id || 'super-admin-id', email: testUsers.superAdmin?.email || 'super@admin.com' },
  admin: { id: testUsers.admin?.id || 'admin-id', email: testUsers.admin?.email || 'admin@example.com' },
  regularUser: { id: testUsers.regularUser?.id || 'regular-user-id', email: testUsers.regularUser?.email || 'user@example.com' },
  deactivatedUser: { id: testUsers.deactivatedUser?.id || 'deactivated-user-id', email: testUsers.deactivatedUser?.email || 'deactivated@example.com' },
  unverifiedUser: { id: testUsers.unverifiedUser?.id || 'unverified-user-id', email: testUsers.unverifiedUser?.email || 'unverified@example.com' },
  userWithoutName: { id: testUsers.userWithoutName?.id || 'no-name-user-id', email: testUsers.userWithoutName?.email || 'noname@example.com' },
  userNeverLoggedIn: { id: testUsers.userNeverLoggedIn?.id || 'never-logged-in-id', email: testUsers.userNeverLoggedIn?.email || 'neverloggedin@example.com' }
}

export const sampleAuditLogs: AuditLog[] = [
  // User View Actions
  {
    id: 'audit-1',
    adminId: safeTestUsers.superAdmin?.id || 'super-admin-id',
    adminEmail: safeTestUsers.superAdmin?.email || 'super@admin.com',
    action: 'view',
    targetUserId: safeTestUsers.regularUser?.id || 'regular-user-id',
    targetUserEmail: safeTestUsers.regularUser?.email || 'user@example.com',
    changes: null,
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-28T10:15:00Z')
  },
  {
    id: 'audit-2',
    adminId: safeTestUsers.admin.id,
    adminEmail: safeTestUsers.admin.email,
    action: 'view',
    targetUserId: safeTestUsers.userWithoutName.id,
    targetUserEmail: safeTestUsers.userWithoutName.email,
    changes: null,
    ipAddress: '10.0.1.25',
    createdAt: new Date('2024-01-28T09:30:00Z')
  },

  // User Edit Actions
  {
    id: 'audit-3',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'edit',
    targetUserId: safeTestUsers.regularUser.id,
    targetUserEmail: safeTestUsers.regularUser.email,
    changes: {
      field: 'role',
      oldValue: 'user',
      newValue: 'admin',
      timestamp: new Date('2024-01-27T14:20:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-27T14:20:00Z')
  },
  {
    id: 'audit-4',
    adminId: safeTestUsers.admin.id,
    adminEmail: safeTestUsers.admin.email,
    action: 'edit',
    targetUserId: safeTestUsers.deactivatedUser.id,
    targetUserEmail: safeTestUsers.deactivatedUser.email,
    changes: {
      field: 'status',
      oldValue: 'active',
      newValue: 'deactivated',
      reason: 'Policy violation - spam behavior',
      timestamp: new Date('2024-01-26T11:45:00Z')
    },
    ipAddress: '10.0.1.25',
    createdAt: new Date('2024-01-26T11:45:00Z')
  },
  {
    id: 'audit-5',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'edit',
    targetUserId: safeTestUsers.unverifiedUser.id,
    targetUserEmail: safeTestUsers.unverifiedUser.email,
    changes: {
      fields: ['role', 'status'],
      oldValues: { role: 'user', status: 'deactivated' },
      newValues: { role: 'admin', status: 'active' },
      reason: 'Promoted to admin after verification',
      timestamp: new Date('2024-01-25T16:30:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-25T16:30:00Z')
  },

  // Role Change Actions (specific action type)
  {
    id: 'audit-6',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'role_change',
    targetUserId: safeTestUsers.admin.id,
    targetUserEmail: safeTestUsers.admin.email,
    changes: {
      field: 'role',
      oldValue: 'user',
      newValue: 'admin',
      reason: 'Promoted for excellent performance',
      promotedBy: safeTestUsers.superAdmin.id,
      effectiveDate: new Date('2024-01-24T12:00:00Z'),
      timestamp: new Date('2024-01-24T12:00:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-24T12:00:00Z')
  },
  {
    id: 'audit-7',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'role_change',
    targetUserId: 'former-super-admin-id',
    targetUserEmail: 'former.super@example.com',
    changes: {
      field: 'role',
      oldValue: 'super_admin',
      newValue: 'admin',
      reason: 'Role restructure - reducing super admin count',
      demotedBy: safeTestUsers.superAdmin.id,
      effectiveDate: new Date('2024-01-23T15:00:00Z'),
      timestamp: new Date('2024-01-23T15:00:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-23T15:00:00Z')
  },

  // Soft Delete Actions
  {
    id: 'audit-8',
    adminId: safeTestUsers.admin.id,
    adminEmail: safeTestUsers.admin.email,
    action: 'soft_delete',
    targetUserId: 'deleted-user-1',
    targetUserEmail: 'deleted.user@example.com',
    changes: {
      action: 'soft_delete',
      reason: 'User requested account deletion',
      deletedData: {
        name: 'Deleted User',
        role: 'user',
        status: 'active',
        loginCount: 15
      },
      retentionPeriod: '90 days',
      timestamp: new Date('2024-01-22T13:15:00Z')
    },
    ipAddress: '10.0.1.25',
    createdAt: new Date('2024-01-22T13:15:00Z')
  },
  {
    id: 'audit-9',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'soft_delete',
    targetUserId: 'deleted-user-2',
    targetUserEmail: 'spam.user@example.com',
    changes: {
      action: 'soft_delete',
      reason: 'Terms of service violation - spam',
      violations: ['excessive_posting', 'spam_content', 'fake_accounts'],
      deletedData: {
        name: 'Spam User',
        role: 'user',
        status: 'active',
        loginCount: 3
      },
      retentionPeriod: '30 days',
      timestamp: new Date('2024-01-21T09:45:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-21T09:45:00Z')
  },

  // Hard Delete Actions
  {
    id: 'audit-10',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'hard_delete',
    targetUserId: 'permanently-deleted-user-1',
    targetUserEmail: 'permanently.deleted@example.com',
    changes: {
      action: 'hard_delete',
      reason: 'Legal compliance - GDPR right to be forgotten',
      originalDeleteDate: new Date('2024-01-01T10:00:00Z'),
      retentionExpired: true,
      dataWiped: {
        personalData: true,
        userContent: true,
        loginHistory: true,
        auditTrail: false // Keep audit trail for compliance
      },
      timestamp: new Date('2024-01-20T14:30:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-20T14:30:00Z')
  },
  {
    id: 'audit-11',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'hard_delete',
    targetUserId: 'security-threat-user',
    targetUserEmail: 'threat.user@malicious.com',
    changes: {
      action: 'hard_delete',
      reason: 'Security threat - immediate removal required',
      securityIncident: 'INC-2024-001',
      threatLevel: 'HIGH',
      immediateDelete: true,
      dataWiped: {
        personalData: true,
        userContent: true,
        loginHistory: true,
        auditTrail: false
      },
      timestamp: new Date('2024-01-19T16:20:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-19T16:20:00Z')
  },

  // User Creation Actions
  {
    id: 'audit-12',
    adminId: safeTestUsers.admin.id,
    adminEmail: safeTestUsers.admin.email,
    action: 'create',
    targetUserId: safeTestUsers.userNeverLoggedIn.id,
    targetUserEmail: safeTestUsers.userNeverLoggedIn.email,
    changes: {
      action: 'create',
      method: 'admin_created',
      userData: {
        name: 'Never Logged In User',
        email: safeTestUsers.userNeverLoggedIn.email,
        role: 'user',
        status: 'active',
        authProvider: 'email'
      },
      reason: 'Pre-created account for new employee',
      timestamp: new Date('2024-01-18T11:00:00Z')
    },
    ipAddress: '10.0.1.25',
    createdAt: new Date('2024-01-18T11:00:00Z')
  },

  // Bulk Actions
  {
    id: 'audit-13',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'edit',
    targetUserId: null,
    targetUserEmail: null,
    changes: {
      action: 'bulk_status_update',
      affectedUsers: ['user-bulk-1', 'user-bulk-2', 'user-bulk-3'],
      field: 'status',
      oldValue: 'active',
      newValue: 'deactivated',
      reason: 'Quarterly inactive user cleanup',
      criteria: 'No login for 180+ days',
      userCount: 3,
      timestamp: new Date('2024-01-17T08:30:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-17T08:30:00Z')
  },

  // System Actions (no target user)
  {
    id: 'audit-14',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'view',
    targetUserId: null,
    targetUserEmail: null,
    changes: {
      action: 'export_user_data',
      exportType: 'all_users',
      fileFormat: 'CSV',
      includeFields: ['id', 'email', 'name', 'role', 'status', 'createdAt'],
      recordCount: 1247,
      reason: 'Monthly user report generation',
      timestamp: new Date('2024-01-16T07:00:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2024-01-16T07:00:00Z')
  },

  // Historical entries for testing date ranges
  {
    id: 'audit-15',
    adminId: safeTestUsers.admin.id,
    adminEmail: safeTestUsers.admin.email,
    action: 'view',
    targetUserId: safeTestUsers.regularUser.id,
    targetUserEmail: safeTestUsers.regularUser.email,
    changes: null,
    ipAddress: '10.0.1.25',
    createdAt: new Date('2024-01-01T12:00:00Z')
  },
  {
    id: 'audit-16',
    adminId: safeTestUsers.superAdmin.id,
    adminEmail: safeTestUsers.superAdmin.email,
    action: 'edit',
    targetUserId: safeTestUsers.deactivatedUser.id,
    targetUserEmail: safeTestUsers.deactivatedUser.email,
    changes: {
      field: 'status',
      oldValue: 'deactivated',
      newValue: 'active',
      reason: 'Appeal approved - reactivating account',
      timestamp: new Date('2023-12-15T14:30:00Z')
    },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2023-12-15T14:30:00Z')
  }
]

/**
 * Audit logs filtered by action type for specific test scenarios
 */
export const auditLogsByAction = {
  view: sampleAuditLogs.filter(log => log.action === 'view'),
  edit: sampleAuditLogs.filter(log => log.action === 'edit'),
  create: sampleAuditLogs.filter(log => log.action === 'create'),
  soft_delete: sampleAuditLogs.filter(log => log.action === 'soft_delete'),
  hard_delete: sampleAuditLogs.filter(log => log.action === 'hard_delete'),
  role_change: sampleAuditLogs.filter(log => log.action === 'role_change')
}

/**
 * Audit logs filtered by admin performing the action
 */
export const auditLogsByAdmin = {
  superAdmin: sampleAuditLogs.filter(log => log.adminId === safeTestUsers.superAdmin.id),
  admin: sampleAuditLogs.filter(log => log.adminId === safeTestUsers.admin.id)
}

/**
 * Audit logs filtered by target user
 */
export const auditLogsByTargetUser = {
  regularUser: sampleAuditLogs.filter(log => log.targetUserId === safeTestUsers.regularUser.id),
  deactivatedUser: sampleAuditLogs.filter(log => log.targetUserId === safeTestUsers.deactivatedUser.id),
  systemActions: sampleAuditLogs.filter(log => !log.targetUserId)
}

/**
 * Audit logs for testing date range queries
 */
export const auditLogsByDateRange = {
  today: sampleAuditLogs.filter(log => 
    log.createdAt >= new Date('2024-01-28T00:00:00Z')
  ),
  thisWeek: sampleAuditLogs.filter(log => 
    log.createdAt >= new Date('2024-01-22T00:00:00Z')
  ),
  thisMonth: sampleAuditLogs.filter(log => 
    log.createdAt >= new Date('2024-01-01T00:00:00Z')
  ),
  lastMonth: sampleAuditLogs.filter(log => 
    log.createdAt >= new Date('2023-12-01T00:00:00Z') &&
    log.createdAt < new Date('2024-01-01T00:00:00Z')
  )
}

/**
 * Pagination test data for audit logs
 */
export const auditLogPaginationData = {
  page1: sampleAuditLogs.slice(0, 10),
  page2: sampleAuditLogs.slice(10),
  sortedByDateDesc: [...sampleAuditLogs].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  ),
  sortedByActionAsc: [...sampleAuditLogs].sort((a, b) => 
    a.action.localeCompare(b.action)
  ),
  sortedByAdminEmailAsc: [...sampleAuditLogs].sort((a, b) => 
    a.adminEmail.localeCompare(b.adminEmail)
  )
}

/**
 * Sample audit log for testing creation
 */
export const newAuditLogTemplate: Omit<AuditLog, 'id' | 'createdAt'> = {
  adminId: safeTestUsers.admin.id,
  adminEmail: safeTestUsers.admin.email,
  action: 'view',
  targetUserId: safeTestUsers.regularUser.id,
  targetUserEmail: safeTestUsers.regularUser.email,
  changes: null,
  ipAddress: '127.0.0.1'
}

/**
 * Different change object examples for testing various edit scenarios
 */
export const sampleChangeObjects = {
  simpleRoleChange: {
    field: 'role',
    oldValue: 'user',
    newValue: 'admin',
    timestamp: new Date()
  },
  simpleStatusChange: {
    field: 'status',
    oldValue: 'active',
    newValue: 'deactivated',
    reason: 'Policy violation',
    timestamp: new Date()
  },
  multipleFieldChange: {
    fields: ['role', 'status'],
    oldValues: { role: 'user', status: 'deactivated' },
    newValues: { role: 'admin', status: 'active' },
    reason: 'Account reactivation and promotion',
    timestamp: new Date()
  },
  deleteAction: {
    action: 'soft_delete',
    reason: 'User request',
    deletedData: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'user'
    },
    retentionPeriod: '90 days',
    timestamp: new Date()
  },
  bulkAction: {
    action: 'bulk_update',
    affectedUsers: ['user1', 'user2', 'user3'],
    field: 'status',
    oldValue: 'active',
    newValue: 'deactivated',
    reason: 'Cleanup inactive users',
    userCount: 3,
    timestamp: new Date()
  }
}

/**
 * IP addresses for testing geolocation and security scenarios
 */
export const testIPAddresses = {
  local: '127.0.0.1',
  privateNetwork: ['192.168.1.100', '10.0.1.25', '172.16.0.50'],
  publicAddresses: ['8.8.8.8', '1.1.1.1', '208.67.222.222'],
  suspicious: ['185.220.100.240', '89.248.165.146'], // Known Tor exit nodes for testing
  mobile: ['172.70.207.89', '104.16.132.229'], // Cloudflare mobile IPs for testing
  international: ['46.101.163.119', '139.59.188.226'] // International IPs for testing
}

/**
 * Export individual audit logs for specific test scenarios
 */
export const testAuditLogs = {
  viewAction: sampleAuditLogs[0],
  editAction: sampleAuditLogs[2],
  roleChangeAction: sampleAuditLogs[5],
  softDeleteAction: sampleAuditLogs[7],
  hardDeleteAction: sampleAuditLogs[9],
  createAction: sampleAuditLogs[11],
  bulkAction: sampleAuditLogs[12],
  systemAction: sampleAuditLogs[13]
} as const

/**
 * Helper function to get audit logs for a specific user
 */
export function getAuditLogsForUser(userId: string): AuditLog[] {
  return sampleAuditLogs.filter(log => log.targetUserId === userId)
}

/**
 * Helper function to get audit logs for a specific admin
 */
export function getAuditLogsByAdmin(adminId: string): AuditLog[] {
  return sampleAuditLogs.filter(log => log.adminId === adminId)
}

/**
 * Helper function to get audit logs within a date range
 */
export function getAuditLogsInDateRange(startDate: Date, endDate: Date): AuditLog[] {
  return sampleAuditLogs.filter(log => 
    log.createdAt >= startDate && log.createdAt <= endDate
  )
}

/**
 * Helper function to get audit logs by action type
 */
export function getAuditLogsByAction(action: AuditAction): AuditLog[] {
  return sampleAuditLogs.filter(log => log.action === action)
}