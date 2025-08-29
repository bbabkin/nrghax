/**
 * Test fixtures for Admin User Management feature
 * Provides mock data for various user scenarios and edge cases
 */

import type { AdminUser, UserRole, AccountStatus } from '@/types/admin'

/**
 * Base sample users with different roles, statuses, and auth providers
 * These fixtures represent realistic user data for testing
 */
export const sampleAdminUsers: AdminUser[] = [
  // Super Admin Users
  {
    id: 'super-admin-1',
    email: 'super.admin@example.com',
    name: 'Super Administrator',
    image: 'https://via.placeholder.com/150/0000FF/808080?text=SA',
    role: 'super_admin',
    status: 'active',
    emailVerified: new Date('2024-01-01T08:00:00Z'),
    createdAt: new Date('2024-01-01T08:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    lastLogin: new Date('2024-01-28T14:22:00Z'),
    loginCount: 245,
    authProvider: 'email'
  },
  {
    id: 'super-admin-2',
    email: 'jane.superadmin@company.com',
    name: 'Jane Super Admin',
    image: 'https://via.placeholder.com/150/008000/FFFFFF?text=JS',
    role: 'super_admin',
    status: 'active',
    emailVerified: new Date('2024-01-02T09:15:00Z'),
    createdAt: new Date('2024-01-02T09:15:00Z'),
    updatedAt: new Date('2024-01-20T16:45:00Z'),
    lastLogin: new Date('2024-01-27T11:30:00Z'),
    loginCount: 180,
    authProvider: 'google'
  },

  // Regular Admin Users
  {
    id: 'admin-1',
    email: 'admin.user@example.com',
    name: 'Admin User',
    image: 'https://via.placeholder.com/150/FFA500/FFFFFF?text=AU',
    role: 'admin',
    status: 'active',
    emailVerified: new Date('2024-01-03T10:00:00Z'),
    createdAt: new Date('2024-01-03T10:00:00Z'),
    updatedAt: new Date('2024-01-25T14:20:00Z'),
    lastLogin: new Date('2024-01-28T09:15:00Z'),
    loginCount: 156,
    authProvider: 'email'
  },
  {
    id: 'admin-2',
    email: 'sarah.admin@company.com',
    name: 'Sarah Admin',
    image: 'https://via.placeholder.com/150/800080/FFFFFF?text=SA',
    role: 'admin',
    status: 'active',
    emailVerified: new Date('2024-01-05T12:30:00Z'),
    createdAt: new Date('2024-01-05T12:30:00Z'),
    updatedAt: new Date('2024-01-26T08:45:00Z'),
    lastLogin: new Date('2024-01-27T16:20:00Z'),
    loginCount: 98,
    authProvider: 'google'
  },
  {
    id: 'admin-deactivated',
    email: 'former.admin@example.com',
    name: 'Former Admin',
    image: 'https://via.placeholder.com/150/808080/FFFFFF?text=FA',
    role: 'admin',
    status: 'deactivated',
    emailVerified: new Date('2024-01-01T08:00:00Z'),
    createdAt: new Date('2024-01-01T08:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    lastLogin: new Date('2024-01-15T10:00:00Z'),
    loginCount: 45,
    authProvider: 'email'
  },

  // Regular Users
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    image: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=JD',
    role: 'user',
    status: 'active',
    emailVerified: new Date('2024-01-10T14:20:00Z'),
    createdAt: new Date('2024-01-10T14:20:00Z'),
    updatedAt: new Date('2024-01-28T12:15:00Z'),
    lastLogin: new Date('2024-01-28T12:15:00Z'),
    loginCount: 42,
    authProvider: 'email'
  },
  {
    id: 'user-2',
    email: 'alice.smith@example.com',
    name: 'Alice Smith',
    image: 'https://via.placeholder.com/150/DC143C/FFFFFF?text=AS',
    role: 'user',
    status: 'active',
    emailVerified: new Date('2024-01-12T16:30:00Z'),
    createdAt: new Date('2024-01-12T16:30:00Z'),
    updatedAt: new Date('2024-01-27T20:10:00Z'),
    lastLogin: new Date('2024-01-27T20:10:00Z'),
    loginCount: 28,
    authProvider: 'google'
  },
  {
    id: 'user-deactivated',
    email: 'suspended.user@example.com',
    name: 'Suspended User',
    image: 'https://via.placeholder.com/150/696969/FFFFFF?text=SU',
    role: 'user',
    status: 'deactivated',
    emailVerified: new Date('2024-01-08T11:00:00Z'),
    createdAt: new Date('2024-01-08T11:00:00Z'),
    updatedAt: new Date('2024-01-20T09:30:00Z'),
    lastLogin: new Date('2024-01-18T15:45:00Z'),
    loginCount: 15,
    authProvider: 'email'
  },

  // Edge Case Users
  {
    id: 'user-no-name',
    email: 'noname@example.com',
    name: null,
    image: null,
    role: 'user',
    status: 'active',
    emailVerified: new Date('2024-01-15T13:45:00Z'),
    createdAt: new Date('2024-01-15T13:45:00Z'),
    updatedAt: new Date('2024-01-15T13:45:00Z'),
    lastLogin: new Date('2024-01-25T10:20:00Z'),
    loginCount: 8,
    authProvider: 'email'
  },
  {
    id: 'user-never-logged-in',
    email: 'never.logged.in@example.com',
    name: 'Never Logged In User',
    image: null,
    role: 'user',
    status: 'active',
    emailVerified: new Date('2024-01-20T16:00:00Z'),
    createdAt: new Date('2024-01-20T16:00:00Z'),
    updatedAt: new Date('2024-01-20T16:00:00Z'),
    lastLogin: null,
    loginCount: 0,
    authProvider: 'email'
  },
  {
    id: 'user-unverified-email',
    email: 'unverified@example.com',
    name: 'Unverified User',
    image: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=UU',
    role: 'user',
    status: 'active',
    emailVerified: null,
    createdAt: new Date('2024-01-25T11:30:00Z'),
    updatedAt: new Date('2024-01-25T11:30:00Z'),
    lastLogin: new Date('2024-01-26T14:15:00Z'),
    loginCount: 3,
    authProvider: 'email'
  },
  {
    id: 'user-long-email',
    email: 'very.long.email.address.that.tests.ui.boundaries@example-domain-with-long-name.com',
    name: 'User With Very Long Email Address For UI Testing',
    image: 'https://via.placeholder.com/150/20B2AA/FFFFFF?text=LE',
    role: 'user',
    status: 'active',
    emailVerified: new Date('2024-01-18T09:20:00Z'),
    createdAt: new Date('2024-01-18T09:20:00Z'),
    updatedAt: new Date('2024-01-28T07:40:00Z'),
    lastLogin: new Date('2024-01-28T07:40:00Z'),
    loginCount: 22,
    authProvider: 'google'
  }
]

/**
 * Filtered user data sets for specific test scenarios
 */
export const usersByRole = {
  superAdmins: sampleAdminUsers.filter(user => user.role === 'super_admin'),
  admins: sampleAdminUsers.filter(user => user.role === 'admin'),
  regularUsers: sampleAdminUsers.filter(user => user.role === 'user')
}

export const usersByStatus = {
  active: sampleAdminUsers.filter(user => user.status === 'active'),
  deactivated: sampleAdminUsers.filter(user => user.status === 'deactivated')
}

export const usersByAuthProvider = {
  email: sampleAdminUsers.filter(user => user.authProvider === 'email'),
  google: sampleAdminUsers.filter(user => user.authProvider === 'google'),
  credentials: sampleAdminUsers.filter(user => user.authProvider === 'credentials')
}

/**
 * Edge case user collections for testing boundary conditions
 */
export const edgeCaseUsers = {
  noName: sampleAdminUsers.filter(user => !user.name),
  noImage: sampleAdminUsers.filter(user => !user.image),
  neverLoggedIn: sampleAdminUsers.filter(user => !user.lastLogin || user.loginCount === 0),
  unverifiedEmail: sampleAdminUsers.filter(user => !user.emailVerified),
  longEmail: sampleAdminUsers.filter(user => user.email.length > 50),
  highLoginCount: sampleAdminUsers.filter(user => user.loginCount && user.loginCount > 100),
  recentUsers: sampleAdminUsers.filter(user => 
    user.createdAt > new Date('2024-01-20T00:00:00Z')
  )
}

/**
 * Test data for pagination and sorting scenarios
 */
export const paginationTestData = {
  page1: sampleAdminUsers.slice(0, 5),
  page2: sampleAdminUsers.slice(5, 10),
  page3: sampleAdminUsers.slice(10),
  sortedByNameAsc: [...sampleAdminUsers].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  ),
  sortedByEmailDesc: [...sampleAdminUsers].sort((a, b) => 
    b.email.localeCompare(a.email)
  ),
  sortedByCreatedAtDesc: [...sampleAdminUsers].sort((a, b) => 
    b.createdAt.getTime() - a.createdAt.getTime()
  ),
  sortedByLastLoginDesc: [...sampleAdminUsers].sort((a, b) => {
    if (!a.lastLogin && !b.lastLogin) return 0
    if (!a.lastLogin) return 1
    if (!b.lastLogin) return -1
    return b.lastLogin.getTime() - a.lastLogin.getTime()
  })
}

/**
 * User data for testing search functionality
 */
export const searchTestData = {
  searchByEmail: {
    query: 'admin',
    expected: sampleAdminUsers.filter(user => 
      user.email.toLowerCase().includes('admin')
    )
  },
  searchByName: {
    query: 'john',
    expected: sampleAdminUsers.filter(user => 
      user.name?.toLowerCase().includes('john')
    )
  },
  searchByPartialEmail: {
    query: '@example.com',
    expected: sampleAdminUsers.filter(user => 
      user.email.includes('@example.com')
    )
  },
  noResults: {
    query: 'nonexistent',
    expected: []
  }
}

/**
 * Default user for testing user creation scenarios
 */
export const defaultNewUser: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'> = {
  email: 'new.user@example.com',
  name: 'New Test User',
  image: null,
  role: 'user',
  status: 'active',
  emailVerified: null,
  lastLogin: null,
  loginCount: 0,
  authProvider: 'email'
}

/**
 * Invalid user data for testing validation
 */
export const invalidUserData = {
  invalidEmail: {
    ...defaultNewUser,
    email: 'invalid-email-format'
  },
  emptyEmail: {
    ...defaultNewUser,
    email: ''
  },
  invalidRole: {
    ...defaultNewUser,
    role: 'invalid_role' as UserRole
  },
  invalidStatus: {
    ...defaultNewUser,
    status: 'invalid_status' as AccountStatus
  },
  futureDate: {
    ...defaultNewUser,
    createdAt: new Date('2025-12-31T23:59:59Z'),
    updatedAt: new Date('2025-12-31T23:59:59Z')
  }
}

/**
 * User update scenarios for testing edit functionality
 */
export const userUpdateScenarios = {
  roleChange: {
    before: sampleAdminUsers[5], // regular user
    updates: { role: 'admin' as UserRole },
    expected: { ...sampleAdminUsers[5], role: 'admin' as UserRole }
  },
  statusChange: {
    before: sampleAdminUsers[6], // active user
    updates: { status: 'deactivated' as AccountStatus },
    expected: { ...sampleAdminUsers[6], status: 'deactivated' as AccountStatus }
  },
  roleAndStatusChange: {
    before: sampleAdminUsers[7], // deactivated user
    updates: { role: 'admin' as UserRole, status: 'active' as AccountStatus },
    expected: { 
      ...sampleAdminUsers[7], 
      role: 'admin' as UserRole, 
      status: 'active' as AccountStatus 
    }
  }
}

/**
 * Export individual users for specific test scenarios
 */
export const testUsers = {
  superAdmin: sampleAdminUsers[0],
  admin: sampleAdminUsers[2],
  regularUser: sampleAdminUsers[5],
  deactivatedUser: sampleAdminUsers[7],
  userWithoutName: sampleAdminUsers[8],
  userNeverLoggedIn: sampleAdminUsers[9],
  unverifiedUser: sampleAdminUsers[10],
  userWithLongEmail: sampleAdminUsers[11]
} as const