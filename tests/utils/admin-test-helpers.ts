/**
 * Mock data generators and test utilities for Admin User Management
 * Provides functions to generate random test data and helper utilities
 */

import type { 
  AdminUser, 
  AuditLog, 
  UserRole, 
  AccountStatus, 
  AuditAction,
  UserFilters,
  PaginationParams 
} from '@/types/admin'

/**
 * Configuration for data generation
 */
const DATA_GENERATION_CONFIG = {
  domains: ['example.com', 'testdomain.org', 'company.com', 'demo.net'],
  firstNames: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Anna', 'Robert', 'Lisa'],
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Wilson'],
  authProviders: ['email', 'google', 'credentials'] as const,
  ipAddresses: [
    '192.168.1.100', '10.0.1.25', '172.16.0.50', '127.0.0.1',
    '203.0.113.15', '198.51.100.42', '8.8.8.8', '1.1.1.1'
  ],
  auditReasons: [
    'Policy violation',
    'User request',
    'Routine maintenance',
    'Security concern',
    'Data compliance',
    'System cleanup',
    'Performance review',
    'Account verification'
  ]
}

/**
 * Utility function to get random item from array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Utility function to generate random string
 */
function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Utility function to generate random date within a range
 */
function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime()
  const end = endDate.getTime()
  return new Date(start + Math.random() * (end - start))
}

/**
 * Generate a random mock user with optional overrides
 */
export function generateMockUser(overrides: Partial<AdminUser> = {}): AdminUser {
  const firstName = randomItem(DATA_GENERATION_CONFIG.firstNames)
  const lastName = randomItem(DATA_GENERATION_CONFIG.lastNames)
  const domain = randomItem(DATA_GENERATION_CONFIG.domains)
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
  
  const createdAt = randomDate(new Date('2023-01-01'), new Date('2024-01-28'))
  const updatedAt = randomDate(createdAt, new Date('2024-01-28'))
  const hasLoggedIn = Math.random() > 0.1 // 90% chance of having logged in
  const isEmailVerified = Math.random() > 0.15 // 85% chance of email verification
  const loginCount = hasLoggedIn ? Math.floor(Math.random() * 200) : 0
  
  const baseUser: AdminUser = {
    id: `user-${randomString(12)}`,
    email,
    name: Math.random() > 0.05 ? `${firstName} ${lastName}` : null, // 95% have names
    image: Math.random() > 0.3 ? `https://via.placeholder.com/150/${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}/FFFFFF?text=${firstName[0]}${lastName[0]}` : null,
    role: randomItem(['user', 'admin', 'super_admin'] as UserRole[]),
    status: randomItem(['active', 'deactivated'] as AccountStatus[]),
    emailVerified: isEmailVerified ? randomDate(createdAt, updatedAt) : null,
    createdAt,
    updatedAt,
    lastLogin: hasLoggedIn ? randomDate(createdAt, new Date('2024-01-28')) : null,
    loginCount,
    authProvider: randomItem(DATA_GENERATION_CONFIG.authProviders)
  }

  return { ...baseUser, ...overrides }
}

/**
 * Generate a random mock audit log entry with optional overrides
 */
export function generateMockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  const actions: AuditAction[] = ['view', 'edit', 'soft_delete', 'hard_delete', 'create', 'role_change']
  const action = randomItem(actions)
  const adminEmail = `admin.${randomString(6)}@${randomItem(DATA_GENERATION_CONFIG.domains)}`
  const hasTarget = Math.random() > 0.2 // 80% of actions have a target user
  const targetEmail = hasTarget ? `user.${randomString(6)}@${randomItem(DATA_GENERATION_CONFIG.domains)}` : null

  let changes = null
  if (action === 'edit' || action === 'role_change') {
    changes = {
      field: action === 'role_change' ? 'role' : randomItem(['role', 'status']),
      oldValue: randomItem(['user', 'admin', 'active', 'deactivated']),
      newValue: randomItem(['user', 'admin', 'super_admin', 'active', 'deactivated']),
      reason: randomItem(DATA_GENERATION_CONFIG.auditReasons),
      timestamp: new Date()
    }
  } else if (action === 'soft_delete') {
    changes = {
      action: 'soft_delete',
      reason: randomItem(DATA_GENERATION_CONFIG.auditReasons),
      deletedData: {
        name: `${randomItem(DATA_GENERATION_CONFIG.firstNames)} ${randomItem(DATA_GENERATION_CONFIG.lastNames)}`,
        role: randomItem(['user', 'admin']),
        status: 'active',
        loginCount: Math.floor(Math.random() * 100)
      },
      retentionPeriod: '90 days',
      timestamp: new Date()
    }
  } else if (action === 'hard_delete') {
    changes = {
      action: 'hard_delete',
      reason: randomItem(['GDPR compliance', 'Security threat', 'Legal requirement']),
      dataWiped: {
        personalData: true,
        userContent: true,
        loginHistory: true,
        auditTrail: false
      },
      timestamp: new Date()
    }
  }

  const baseLog: AuditLog = {
    id: `audit-${randomString(12)}`,
    adminId: `admin-${randomString(12)}`,
    adminEmail,
    action,
    targetUserId: hasTarget ? `user-${randomString(12)}` : null,
    targetUserEmail: targetEmail,
    changes,
    ipAddress: randomItem(DATA_GENERATION_CONFIG.ipAddresses),
    createdAt: randomDate(new Date('2024-01-01'), new Date('2024-01-28'))
  }

  return { ...baseLog, ...overrides }
}

/**
 * Generate a list of mock users with optional filters
 */
export function generateUserList(count: number, filters: Partial<UserFilters> = {}): AdminUser[] {
  const users = Array.from({ length: count }, () => generateMockUser())

  // Apply filters to generated users
  if (filters.role && filters.role !== 'all') {
    users.forEach(user => { user.role = filters.role as UserRole })
  }
  
  if (filters.status && filters.status !== 'all') {
    users.forEach(user => { user.status = filters.status as AccountStatus })
  }

  if (filters.search) {
    return users.filter(user => 
      user.email.toLowerCase().includes(filters.search!.toLowerCase()) ||
      user.name?.toLowerCase().includes(filters.search!.toLowerCase())
    )
  }

  if (filters.dateFrom || filters.dateTo) {
    return users.filter(user => {
      if (filters.dateFrom && user.createdAt < filters.dateFrom) return false
      if (filters.dateTo && user.createdAt > filters.dateTo) return false
      return true
    })
  }

  return users
}

/**
 * Generate a list of mock audit logs
 */
export function generateAuditLogList(count: number, options: {
  adminId?: string
  targetUserId?: string
  action?: AuditAction
  dateRange?: { start: Date; end: Date }
} = {}): AuditLog[] {
  return Array.from({ length: count }, () => {
    const overrides: Partial<AuditLog> = {}
    
    if (options.adminId) {
      overrides.adminId = options.adminId
    }
    
    if (options.targetUserId) {
      overrides.targetUserId = options.targetUserId
    }
    
    if (options.action) {
      overrides.action = options.action
    }
    
    if (options.dateRange) {
      overrides.createdAt = randomDate(options.dateRange.start, options.dateRange.end)
    }
    
    return generateMockAuditLog(overrides)
  })
}

/**
 * Create test users in the system (for E2E tests)
 * This would typically integrate with your actual test database setup
 */
export async function createTestUsers(count: number): Promise<AdminUser[]> {
  // In a real implementation, this would make API calls or database insertions
  // For now, we'll return generated mock data
  console.log(`Creating ${count} test users for E2E testing`)
  
  const users = generateUserList(count)
  
  // TODO: Implement actual user creation via API
  // await Promise.all(users.map(user => createUser(user)))
  
  return users
}

/**
 * Clean up test data after tests complete
 * This should remove any test users created during testing
 */
export async function cleanupTestData(userIds?: string[]): Promise<void> {
  console.log('Cleaning up test data...')
  
  if (userIds && userIds.length > 0) {
    console.log(`Removing ${userIds.length} specific test users`)
    // TODO: Implement actual cleanup via API
    // await Promise.all(userIds.map(id => deleteUser(id)))
  } else {
    console.log('Performing general test data cleanup')
    // TODO: Implement cleanup of all test users
    // This might involve finding users with test email patterns
    // and removing them from the database
  }
  
  console.log('Test data cleanup completed')
}

/**
 * Generate realistic test data scenarios
 */
export const testDataScenarios = {
  /**
   * Create a balanced dataset with realistic role distribution
   */
  balanced(count: number = 100): AdminUser[] {
    const userCount = Math.floor(count * 0.8) // 80% regular users
    const adminCount = Math.floor(count * 0.15) // 15% admins
    const superAdminCount = count - userCount - adminCount // 5% super admins
    
    return [
      ...generateUserList(userCount, { role: 'user' }),
      ...generateUserList(adminCount, { role: 'admin' }),
      ...generateUserList(superAdminCount, { role: 'super_admin' })
    ]
  },

  /**
   * Create users with various edge cases
   */
  edgeCases(): AdminUser[] {
    return [
      // User without name
      generateMockUser({ name: null }),
      // User without image
      generateMockUser({ image: null }),
      // User who never logged in
      generateMockUser({ lastLogin: null, loginCount: 0 }),
      // Unverified email
      generateMockUser({ emailVerified: null }),
      // Very long email
      generateMockUser({ 
        email: 'very.long.email.address.that.tests.ui.boundaries@example-domain-with-long-name.com' 
      }),
      // Recently created user
      generateMockUser({ 
        createdAt: new Date(), 
        updatedAt: new Date(),
        lastLogin: null,
        loginCount: 0
      }),
      // Highly active user
      generateMockUser({ 
        loginCount: 1000,
        lastLogin: new Date()
      })
    ]
  },

  /**
   * Create users for pagination testing
   */
  pagination(totalCount: number = 50): {
    allUsers: AdminUser[]
    pages: AdminUser[][]
    pageSize: number
  } {
    const pageSize = 10
    const allUsers = generateUserList(totalCount)
    const pages = []
    
    for (let i = 0; i < allUsers.length; i += pageSize) {
      pages.push(allUsers.slice(i, i + pageSize))
    }
    
    return { allUsers, pages, pageSize }
  },

  /**
   * Create audit logs for testing various scenarios
   */
  auditLogs: {
    userActivity(userId: string, count: number = 20): AuditLog[] {
      return generateAuditLogList(count, { targetUserId: userId })
    },

    adminActivity(adminId: string, count: number = 30): AuditLog[] {
      return generateAuditLogList(count, { adminId })
    },

    recentActivity(hours: number = 24): AuditLog[] {
      const start = new Date()
      start.setHours(start.getHours() - hours)
      return generateAuditLogList(15, { 
        dateRange: { start, end: new Date() }
      })
    },

    roleChanges(count: number = 10): AuditLog[] {
      return generateAuditLogList(count, { action: 'role_change' })
    },

    deletions(count: number = 5): AuditLog[] {
      return [
        ...generateAuditLogList(count, { action: 'soft_delete' }),
        ...generateAuditLogList(2, { action: 'hard_delete' })
      ]
    }
  }
}

/**
 * Utility functions for test assertions and validations
 */
export const testUtils = {
  /**
   * Validate user object structure
   */
  isValidUser(user: any): user is AdminUser {
    return (
      user &&
      typeof user.id === 'string' &&
      typeof user.email === 'string' &&
      (user.name === null || typeof user.name === 'string') &&
      (user.image === null || typeof user.image === 'string') &&
      ['user', 'admin', 'super_admin'].includes(user.role) &&
      ['active', 'deactivated'].includes(user.status) &&
      (user.emailVerified === null || user.emailVerified instanceof Date) &&
      user.createdAt instanceof Date &&
      user.updatedAt instanceof Date &&
      (user.lastLogin === null || user.lastLogin instanceof Date) &&
      (typeof user.loginCount === 'number' && user.loginCount >= 0) &&
      ['email', 'google', 'credentials'].includes(user.authProvider)
    )
  },

  /**
   * Validate audit log object structure
   */
  isValidAuditLog(log: any): log is AuditLog {
    return (
      log &&
      typeof log.id === 'string' &&
      typeof log.adminId === 'string' &&
      typeof log.adminEmail === 'string' &&
      ['view', 'edit', 'soft_delete', 'hard_delete', 'create', 'role_change'].includes(log.action) &&
      (log.targetUserId === null || typeof log.targetUserId === 'string') &&
      (log.targetUserEmail === null || typeof log.targetUserEmail === 'string') &&
      (log.ipAddress === null || typeof log.ipAddress === 'string') &&
      log.createdAt instanceof Date
    )
  },

  /**
   * Create a sorted user list for testing sort functionality
   */
  sortUsers(users: AdminUser[], sortBy: 'name' | 'email' | 'createdAt' | 'lastLogin', order: 'asc' | 'desc' = 'asc'): AdminUser[] {
    return [...users].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'lastLogin':
          aValue = a.lastLogin?.getTime() || 0
          bValue = b.lastLogin?.getTime() || 0
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1
      if (aValue > bValue) return order === 'asc' ? 1 : -1
      return 0
    })
  },

  /**
   * Filter users based on search criteria
   */
  searchUsers(users: AdminUser[], searchTerm: string): AdminUser[] {
    const term = searchTerm.toLowerCase()
    return users.filter(user =>
      user.email.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term)
    )
  },

  /**
   * Paginate an array of items
   */
  paginate<T>(items: T[], page: number, limit: number): T[] {
    const startIndex = (page - 1) * limit
    return items.slice(startIndex, startIndex + limit)
  }
}

/**
 * Database state management for tests
 */
export class TestDataManager {
  private createdUserIds: string[] = []
  private createdAuditLogIds: string[] = []

  /**
   * Track a user created during testing
   */
  trackUser(userId: string): void {
    this.createdUserIds.push(userId)
  }

  /**
   * Track an audit log created during testing
   */
  trackAuditLog(auditLogId: string): void {
    this.createdAuditLogIds.push(auditLogId)
  }

  /**
   * Get all tracked user IDs
   */
  getTrackedUserIds(): string[] {
    return [...this.createdUserIds]
  }

  /**
   * Get all tracked audit log IDs
   */
  getTrackedAuditLogIds(): string[] {
    return [...this.createdAuditLogIds]
  }

  /**
   * Clean up all tracked data
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.createdUserIds.length} users and ${this.createdAuditLogIds.length} audit logs`)
    
    // TODO: Implement actual cleanup
    // await cleanupTestData(this.createdUserIds)
    
    this.createdUserIds = []
    this.createdAuditLogIds = []
  }

  /**
   * Reset tracking without cleanup
   */
  reset(): void {
    this.createdUserIds = []
    this.createdAuditLogIds = []
  }
}

/**
 * Global test data manager instance
 */
export const testDataManager = new TestDataManager()