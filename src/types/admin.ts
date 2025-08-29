// Admin feature type definitions

export type UserRole = 'user' | 'admin' | 'super_admin'
export type AccountStatus = 'active' | 'deactivated'
export type AuditAction = 'view' | 'edit' | 'soft_delete' | 'hard_delete' | 'create' | 'role_change'

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: UserRole
  status: AccountStatus
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date | null
  loginCount?: number
  authProvider?: 'email' | 'google' | 'credentials'
}

export interface AuditLog {
  id: string
  adminId: string
  adminEmail: string
  action: AuditAction
  targetUserId?: string | null
  targetUserEmail?: string | null
  changes?: Record<string, any> | null
  ipAddress?: string | null
  createdAt: Date
}

export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: AccountStatus | 'all'
  dateFrom?: Date
  dateTo?: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserEditRequest {
  role?: UserRole
  status?: AccountStatus
}

export interface DeleteUserRequest {
  type: 'soft' | 'hard'
  confirmation: boolean
}

export interface AdminApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UserDetailsResponse extends AdminUser {
  accountHistory: AuditLog[]
  sessions?: Array<{
    id: string
    sessionToken: string
    expires: Date
    createdAt: Date
  }>
}

// Type guards
export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === 'admin' || user.role === 'super_admin'
}

export function isSuperAdmin(user: { role: UserRole }): boolean {
  return user.role === 'super_admin'
}

export function canEditUser(
  currentUser: { id: string; role: UserRole },
  targetUser: { id: string; role: UserRole }
): boolean {
  // Can't edit yourself
  if (currentUser.id === targetUser.id) {
    return false
  }
  
  // Super admins can edit anyone
  if (currentUser.role === 'super_admin') {
    return true
  }
  
  // Regular admins can only edit non-admin users
  if (currentUser.role === 'admin') {
    return targetUser.role === 'user'
  }
  
  return false
}

export function canDeleteUser(
  currentUser: { id: string; role: UserRole },
  targetUser: { id: string; role: UserRole }
): boolean {
  // Can't delete yourself
  if (currentUser.id === targetUser.id) {
    return false
  }
  
  // Same rules as edit for delete
  return canEditUser(currentUser, targetUser)
}