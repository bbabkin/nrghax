/**
 * Supabase client mocks for Admin User Management testing
 * Provides mock implementations for all Supabase operations used in admin features
 */

import type { 
  AdminUser, 
  AuditLog, 
  UserFilters, 
  PaginationParams, 
  PaginatedResponse,
  UserEditRequest,
  DeleteUserRequest,
  AdminApiResponse 
} from '@/types/admin'
import { sampleAdminUsers } from '../fixtures/admin-users-data'
import { sampleAuditLogs } from '../fixtures/admin-audit-data'

/**
 * Mock response structure for Supabase queries
 */
interface MockSupabaseResponse<T> {
  data: T | null
  error: Error | null
  count?: number | null
  status: number
  statusText: string
}

/**
 * Mock error types that match Supabase errors
 */
export class MockSupabaseError extends Error {
  code: string
  hint?: string
  details?: string

  constructor(message: string, code: string, hint?: string, details?: string) {
    super(message)
    this.name = 'MockSupabaseError'
    this.code = code
    this.hint = hint
    this.details = details
  }
}

/**
 * Common Supabase error codes for testing
 */
export const SUPABASE_ERROR_CODES = {
  PERMISSION_DENIED: 'PGRST116',
  ROW_LEVEL_SECURITY: 'PGRST204',
  NOT_FOUND: 'PGRST116',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
  INVALID_INPUT: '22P02',
  CONNECTION_ERROR: 'PGRST001',
  AUTH_REQUIRED: '401',
  FORBIDDEN: '403'
} as const

/**
 * Mock data store to simulate database state during tests
 */
class MockDataStore {
  private users: AdminUser[] = [...sampleAdminUsers]
  private auditLogs: AuditLog[] = [...sampleAuditLogs]
  private deletedUsers: AdminUser[] = []

  // Reset methods for test cleanup
  resetUsers(): void {
    this.users = [...sampleAdminUsers]
    this.deletedUsers = []
  }

  resetAuditLogs(): void {
    this.auditLogs = [...sampleAuditLogs]
  }

  resetAll(): void {
    this.resetUsers()
    this.resetAuditLogs()
  }

  // User operations
  getUsers(): AdminUser[] {
    return [...this.users]
  }

  getUserById(id: string): AdminUser | undefined {
    return this.users.find(user => user.id === id)
  }

  getUserByEmail(email: string): AdminUser | undefined {
    return this.users.find(user => user.email === email)
  }

  addUser(user: AdminUser): AdminUser {
    this.users.push(user)
    return user
  }

  updateUser(id: string, updates: Partial<AdminUser>): AdminUser | null {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    }
    return this.users[userIndex]
  }

  softDeleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return false

    const user = this.users.splice(userIndex, 1)[0]
    this.deletedUsers.push({
      ...user,
      status: 'deactivated',
      updatedAt: new Date()
    })
    return true
  }

  hardDeleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1)
      return true
    }

    const deletedIndex = this.deletedUsers.findIndex(user => user.id === id)
    if (deletedIndex !== -1) {
      this.deletedUsers.splice(deletedIndex, 1)
      return true
    }

    return false
  }

  // Audit log operations
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs]
  }

  addAuditLog(auditLog: AuditLog): AuditLog {
    this.auditLogs.unshift(auditLog) // Add to beginning (most recent first)
    return auditLog
  }

  getAuditLogsForUser(userId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.targetUserId === userId)
  }

  getAuditLogsByAdmin(adminId: string): AuditLog[] {
    return this.auditLogs.filter(log => log.adminId === adminId)
  }
}

// Global mock data store instance
const mockDataStore = new MockDataStore()

/**
 * Mock Supabase client for admin user operations
 */
export const mockSupabaseAdmin = {
  // Reset mock data to initial state
  __resetMockData: () => {
    mockDataStore.resetAll()
  },

  // Get current mock data (for assertions in tests)
  __getMockData: () => ({
    users: mockDataStore.getUsers(),
    auditLogs: mockDataStore.getAuditLogs(),
    deletedUsers: mockDataStore['deletedUsers'] // Access private property for testing
  }),

  /**
   * Mock user queries
   */
  from: (table: string) => {
    if (table === 'user_profiles' || table === 'users') {
      return {
        select: (columns?: string) => ({
          // Get all users with optional filtering, pagination, and sorting
          eq: (column: string, value: any) => ({
            single: async (): Promise<MockSupabaseResponse<AdminUser>> => {
              const users = mockDataStore.getUsers()
              const user = column === 'id' 
                ? users.find(u => u.id === value)
                : users.find(u => (u as any)[column] === value)

              return {
                data: user || null,
                error: user ? null : new MockSupabaseError('User not found', SUPABASE_ERROR_CODES.NOT_FOUND),
                status: user ? 200 : 404,
                statusText: user ? 'OK' : 'Not Found'
              }
            }
          }),

          // Filter by column value
          filter: (column: string, operator: string, value: any) => ({
            async order(column: string, options?: { ascending?: boolean }): Promise<MockSupabaseResponse<AdminUser[]>> {
              let users = mockDataStore.getUsers()

              // Apply filter
              if (operator === 'eq') {
                users = users.filter(user => (user as any)[column] === value)
              } else if (operator === 'ilike') {
                users = users.filter(user => 
                  String((user as any)[column]).toLowerCase().includes(String(value).toLowerCase())
                )
              } else if (operator === 'gte') {
                users = users.filter(user => (user as any)[column] >= value)
              } else if (operator === 'lte') {
                users = users.filter(user => (user as any)[column] <= value)
              }

              // Apply sorting
              const ascending = options?.ascending !== false
              users.sort((a, b) => {
                const aValue = (a as any)[column]
                const bValue = (b as any)[column]
                
                if (aValue < bValue) return ascending ? -1 : 1
                if (aValue > bValue) return ascending ? 1 : -1
                return 0
              })

              return {
                data: users,
                error: null,
                count: users.length,
                status: 200,
                statusText: 'OK'
              }
            }
          }),

          // Range for pagination
          range: (start: number, end: number) => ({
            async order(column: string, options?: { ascending?: boolean }): Promise<MockSupabaseResponse<AdminUser[]>> {
              let users = mockDataStore.getUsers()

              // Apply sorting
              const ascending = options?.ascending !== false
              users.sort((a, b) => {
                const aValue = (a as any)[column]
                const bValue = (b as any)[column]
                
                if (aValue < bValue) return ascending ? -1 : 1
                if (aValue > bValue) return ascending ? 1 : -1
                return 0
              })

              // Apply pagination
              const paginatedUsers = users.slice(start, end + 1)

              return {
                data: paginatedUsers,
                error: null,
                count: users.length,
                status: 200,
                statusText: 'OK'
              }
            }
          }),

          // Default select all
          async order(column: string, options?: { ascending?: boolean }): Promise<MockSupabaseResponse<AdminUser[]>> {
            const users = mockDataStore.getUsers()
            const ascending = options?.ascending !== false

            const sortedUsers = [...users].sort((a, b) => {
              const aValue = (a as any)[column]
              const bValue = (b as any)[column]
              
              if (aValue < bValue) return ascending ? -1 : 1
              if (aValue > bValue) return ascending ? 1 : -1
              return 0
            })

            return {
              data: sortedUsers,
              error: null,
              count: sortedUsers.length,
              status: 200,
              statusText: 'OK'
            }
          }
        }),

        // Insert new user
        insert: (userData: Partial<AdminUser>) => ({
          select: () => ({
            single: async (): Promise<MockSupabaseResponse<AdminUser>> => {
              const newUser: AdminUser = {
                id: `mock-${Date.now()}`,
                email: userData.email!,
                name: userData.name || null,
                image: userData.image || null,
                role: userData.role || 'user',
                status: userData.status || 'active',
                emailVerified: userData.emailVerified || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastLogin: null,
                loginCount: 0,
                authProvider: userData.authProvider || 'email'
              }

              // Check for duplicate email
              const existingUser = mockDataStore.getUserByEmail(newUser.email)
              if (existingUser) {
                return {
                  data: null,
                  error: new MockSupabaseError('Email already exists', SUPABASE_ERROR_CODES.UNIQUE_VIOLATION),
                  status: 409,
                  statusText: 'Conflict'
                }
              }

              const addedUser = mockDataStore.addUser(newUser)
              return {
                data: addedUser,
                error: null,
                status: 201,
                statusText: 'Created'
              }
            }
          })
        }),

        // Update user
        update: (updates: Partial<AdminUser>) => ({
          eq: (column: string, value: any) => ({
            select: () => ({
              single: async (): Promise<MockSupabaseResponse<AdminUser>> => {
                const updatedUser = mockDataStore.updateUser(value, updates)
                
                if (!updatedUser) {
                  return {
                    data: null,
                    error: new MockSupabaseError('User not found', SUPABASE_ERROR_CODES.NOT_FOUND),
                    status: 404,
                    statusText: 'Not Found'
                  }
                }

                return {
                  data: updatedUser,
                  error: null,
                  status: 200,
                  statusText: 'OK'
                }
              }
            })
          })
        }),

        // Delete user
        delete: () => ({
          eq: (column: string, value: any) => ({
            async single(): Promise<MockSupabaseResponse<null>> {
              const success = mockDataStore.hardDeleteUser(value)
              
              if (!success) {
                return {
                  data: null,
                  error: new MockSupabaseError('User not found', SUPABASE_ERROR_CODES.NOT_FOUND),
                  status: 404,
                  statusText: 'Not Found'
                }
              }

              return {
                data: null,
                error: null,
                status: 204,
                statusText: 'No Content'
              }
            }
          })
        })
      }
    }

    if (table === 'audit_logs') {
      return {
        select: (columns?: string) => ({
          // Get audit logs with filtering and pagination
          eq: (column: string, value: any) => ({
            order: (orderColumn: string, options?: { ascending?: boolean }) => ({
              range: (start: number, end: number) => ({
                async single(): Promise<MockSupabaseResponse<AuditLog[]>> {
                  let logs = mockDataStore.getAuditLogs()
                  
                  // Apply filter
                  logs = logs.filter(log => (log as any)[column] === value)

                  // Apply sorting
                  const ascending = options?.ascending !== false
                  logs.sort((a, b) => {
                    const aValue = (a as any)[orderColumn]
                    const bValue = (b as any)[orderColumn]
                    
                    if (aValue < bValue) return ascending ? -1 : 1
                    if (aValue > bValue) return ascending ? 1 : -1
                    return 0
                  })

                  // Apply pagination
                  const paginatedLogs = logs.slice(start, end + 1)

                  return {
                    data: paginatedLogs,
                    error: null,
                    count: logs.length,
                    status: 200,
                    statusText: 'OK'
                  }
                }
              })
            })
          }),

          // Default order for all audit logs
          order: (column: string, options?: { ascending?: boolean }) => ({
            range: (start: number, end: number) => ({
              async single(): Promise<MockSupabaseResponse<AuditLog[]>> {
                const logs = mockDataStore.getAuditLogs()
                const ascending = options?.ascending !== false

                const sortedLogs = [...logs].sort((a, b) => {
                  const aValue = (a as any)[column]
                  const bValue = (b as any)[column]
                  
                  if (aValue < bValue) return ascending ? -1 : 1
                  if (aValue > bValue) return ascending ? 1 : -1
                  return 0
                })

                const paginatedLogs = sortedLogs.slice(start, end + 1)

                return {
                  data: paginatedLogs,
                  error: null,
                  count: logs.length,
                  status: 200,
                  statusText: 'OK'
                }
              }
            })
          })
        }),

        // Insert audit log
        insert: (auditData: Partial<AuditLog>) => ({
          async single(): Promise<MockSupabaseResponse<AuditLog>> {
            const newAuditLog: AuditLog = {
              id: `audit-${Date.now()}`,
              adminId: auditData.adminId!,
              adminEmail: auditData.adminEmail!,
              action: auditData.action!,
              targetUserId: auditData.targetUserId || null,
              targetUserEmail: auditData.targetUserEmail || null,
              changes: auditData.changes || null,
              ipAddress: auditData.ipAddress || null,
              createdAt: new Date()
            }

            const addedLog = mockDataStore.addAuditLog(newAuditLog)
            return {
              data: addedLog,
              error: null,
              status: 201,
              statusText: 'Created'
            }
          }
        })
      }
    }

    // Default fallback for unknown tables
    return {
      select: () => ({
        async single(): Promise<MockSupabaseResponse<any>> {
          return {
            data: null,
            error: new MockSupabaseError('Table not found', SUPABASE_ERROR_CODES.NOT_FOUND),
            status: 404,
            statusText: 'Not Found'
          }
        }
      })
    }
  },

  /**
   * Mock RPC (Remote Procedure Call) functions
   */
  rpc: (functionName: string, params?: Record<string, any>) => {
    if (functionName === 'get_users_with_filters') {
      return {
        async single(): Promise<MockSupabaseResponse<PaginatedResponse<AdminUser>>> {
          const { 
            search = '', 
            role_filter = 'all',
            status_filter = 'all',
            date_from,
            date_to,
            page = 1,
            limit = 10,
            sort_by = 'createdAt',
            sort_order = 'desc'
          } = params || {}

          let users = mockDataStore.getUsers()

          // Apply search filter
          if (search) {
            users = users.filter(user =>
              user.email.toLowerCase().includes(search.toLowerCase()) ||
              user.name?.toLowerCase().includes(search.toLowerCase())
            )
          }

          // Apply role filter
          if (role_filter !== 'all') {
            users = users.filter(user => user.role === role_filter)
          }

          // Apply status filter
          if (status_filter !== 'all') {
            users = users.filter(user => user.status === status_filter)
          }

          // Apply date filters
          if (date_from) {
            users = users.filter(user => user.createdAt >= new Date(date_from))
          }
          if (date_to) {
            users = users.filter(user => user.createdAt <= new Date(date_to))
          }

          // Apply sorting
          users.sort((a, b) => {
            const aValue = (a as any)[sort_by]
            const bValue = (b as any)[sort_by]
            const ascending = sort_order === 'asc'
            
            if (aValue < bValue) return ascending ? -1 : 1
            if (aValue > bValue) return ascending ? 1 : -1
            return 0
          })

          // Apply pagination
          const totalUsers = users.length
          const totalPages = Math.ceil(totalUsers / limit)
          const startIndex = (page - 1) * limit
          const paginatedUsers = users.slice(startIndex, startIndex + limit)

          const response: PaginatedResponse<AdminUser> = {
            data: paginatedUsers,
            total: totalUsers,
            page,
            limit,
            totalPages
          }

          return {
            data: response,
            error: null,
            status: 200,
            statusText: 'OK'
          }
        }
      }
    }

    if (functionName === 'soft_delete_user') {
      return {
        async single(): Promise<MockSupabaseResponse<{ success: boolean }>> {
          const { user_id, admin_id, reason } = params || {}
          
          if (!user_id) {
            return {
              data: null,
              error: new MockSupabaseError('User ID required', SUPABASE_ERROR_CODES.INVALID_INPUT),
              status: 400,
              statusText: 'Bad Request'
            }
          }

          const success = mockDataStore.softDeleteUser(user_id)
          
          if (success) {
            // Also create audit log
            mockDataStore.addAuditLog({
              id: `audit-${Date.now()}`,
              adminId: admin_id,
              adminEmail: 'mock@example.com',
              action: 'soft_delete',
              targetUserId: user_id,
              targetUserEmail: 'mock@example.com',
              changes: { reason },
              ipAddress: '127.0.0.1',
              createdAt: new Date()
            })
          }

          return {
            data: { success },
            error: success ? null : new MockSupabaseError('User not found', SUPABASE_ERROR_CODES.NOT_FOUND),
            status: success ? 200 : 404,
            statusText: success ? 'OK' : 'Not Found'
          }
        }
      }
    }

    // Default RPC response
    return {
      async single(): Promise<MockSupabaseResponse<any>> {
        return {
          data: { success: true },
          error: null,
          status: 200,
          statusText: 'OK'
        }
      }
    }
  },

  /**
   * Mock storage operations (for user avatars, etc.)
   */
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File): Promise<MockSupabaseResponse<{ path: string }>> => {
        // Mock successful upload
        return {
          data: { path: `${bucket}/${path}` },
          error: null,
          status: 200,
          statusText: 'OK'
        }
      },

      remove: async (paths: string[]): Promise<MockSupabaseResponse<{ paths: string[] }>> => {
        // Mock successful removal
        return {
          data: { paths },
          error: null,
          status: 200,
          statusText: 'OK'
        }
      },

      getPublicUrl: (path: string) => ({
        data: {
          publicUrl: `https://mock-supabase.com/storage/v1/object/public/${bucket}/${path}`
        }
      })
    })
  }
}

/**
 * Helper functions for setting up specific test scenarios
 */
export const mockScenarios = {
  /**
   * Simulate database connection error
   */
  simulateConnectionError(): void {
    const originalFrom = mockSupabaseAdmin.from
    mockSupabaseAdmin.from = () => ({
      select: () => ({
        async single(): Promise<MockSupabaseResponse<any>> {
          return {
            data: null,
            error: new MockSupabaseError('Connection error', SUPABASE_ERROR_CODES.CONNECTION_ERROR),
            status: 500,
            statusText: 'Internal Server Error'
          }
        }
      })
    })
    
    // Restore after 5 seconds (for testing)
    setTimeout(() => {
      mockSupabaseAdmin.from = originalFrom
    }, 5000)
  },

  /**
   * Simulate permission denied error
   */
  simulatePermissionDenied(): void {
    const originalFrom = mockSupabaseAdmin.from
    mockSupabaseAdmin.from = () => ({
      select: () => ({
        async single(): Promise<MockSupabaseResponse<any>> {
          return {
            data: null,
            error: new MockSupabaseError('Permission denied', SUPABASE_ERROR_CODES.PERMISSION_DENIED),
            status: 403,
            statusText: 'Forbidden'
          }
        }
      })
    })
    
    // Restore after test
    setTimeout(() => {
      mockSupabaseAdmin.from = originalFrom
    }, 1000)
  },

  /**
   * Add custom users to mock data store
   */
  addCustomUsers(users: AdminUser[]): void {
    users.forEach(user => mockDataStore.addUser(user))
  },

  /**
   * Clear all mock data
   */
  clearAllData(): void {
    mockDataStore.resetAll()
  }
}

/**
 * Export the mock for use in tests
 */
export default mockSupabaseAdmin