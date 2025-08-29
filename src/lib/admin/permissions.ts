import { Session } from 'next-auth';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Permission types
export enum Permission {
  // User management permissions
  VIEW_USERS = 'users.view',
  EDIT_USERS = 'users.edit',
  DELETE_USERS = 'users.delete',
  CREATE_USERS = 'users.create',
  
  // Role management permissions
  MANAGE_ROLES = 'roles.manage',
  VIEW_ADMIN_USERS = 'admin.view',
  EDIT_ADMIN_USERS = 'admin.edit',
  
  // Audit and monitoring permissions
  VIEW_AUDIT_LOGS = 'audit.view',
  EXPORT_AUDIT_LOGS = 'audit.export',
  
  // System administration
  SYSTEM_SETTINGS = 'system.settings',
  BULK_OPERATIONS = 'bulk.operations'
}

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    // Super admin has all permissions
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.CREATE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_ADMIN_USERS,
    Permission.EDIT_ADMIN_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
    Permission.SYSTEM_SETTINGS,
    Permission.BULK_OPERATIONS
  ],
  admin: [
    // Regular admin permissions (cannot modify other admins)
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.CREATE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_AUDIT_LOGS,
    Permission.BULK_OPERATIONS
  ],
  moderator: [
    // Moderator has limited permissions
    Permission.VIEW_USERS,
    Permission.EDIT_USERS, // Limited to status changes only
    Permission.VIEW_AUDIT_LOGS
  ],
  user: [
    // Regular users have no admin permissions
  ]
};

// Business logic restrictions
export interface UserEditRestrictions {
  canEditRole: boolean;
  canEditStatus: boolean;
  canDelete: boolean;
  canViewDetails: boolean;
  canViewAuditLogs: boolean;
  restrictions: string[];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a user role
 */
export function getUserPermissions(userRole: string): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user can perform specific actions on another user
 */
export function getUserEditRestrictions(
  adminRole: string,
  adminId: string,
  targetUserId: string,
  targetUserRole: string
): UserEditRestrictions {
  const restrictions: string[] = [];
  let canEditRole = false;
  let canEditStatus = false;
  let canDelete = false;
  let canViewDetails = false;
  let canViewAuditLogs = false;

  // Self-modification restrictions
  if (adminId === targetUserId) {
    restrictions.push('Cannot modify your own account');
    return {
      canEditRole: false,
      canEditStatus: false,
      canDelete: false,
      canViewDetails: true, // Can view own details
      canViewAuditLogs: true, // Can view own audit logs
      restrictions
    };
  }

  // Role-based permissions
  const isAdmin = adminRole === 'admin' || adminRole === 'super_admin';
  const isSuperAdmin = adminRole === 'super_admin';
  const targetIsAdmin = targetUserRole === 'admin' || targetUserRole === 'super_admin';

  // View permissions
  if (hasPermission(adminRole, Permission.VIEW_USERS)) {
    canViewDetails = true;
  }

  if (hasPermission(adminRole, Permission.VIEW_AUDIT_LOGS)) {
    canViewAuditLogs = true;
  }

  // Edit permissions
  if (hasPermission(adminRole, Permission.EDIT_USERS)) {
    canEditStatus = true;

    // Role editing restrictions
    if (hasPermission(adminRole, Permission.MANAGE_ROLES)) {
      // Regular admins cannot edit other admins
      if (isAdmin && !targetIsAdmin) {
        canEditRole = true;
      } else if (isSuperAdmin) {
        // Super admin can edit anyone except other super admins
        if (targetUserRole !== 'super_admin') {
          canEditRole = true;
        } else {
          restrictions.push('Cannot modify other super admin accounts');
        }
      } else if (targetIsAdmin) {
        restrictions.push('Cannot modify admin accounts');
      }
    }

    // Status editing restrictions for admins
    if (targetIsAdmin && !isSuperAdmin) {
      canEditStatus = false;
      restrictions.push('Cannot deactivate admin accounts');
    }
  } else {
    restrictions.push('Insufficient permissions to edit users');
  }

  // Delete permissions
  if (hasPermission(adminRole, Permission.DELETE_USERS)) {
    // Cannot delete admins unless super admin
    if (targetIsAdmin && !isSuperAdmin) {
      restrictions.push('Cannot delete admin accounts');
    } else if (targetUserRole === 'super_admin') {
      restrictions.push('Cannot delete super admin accounts');
    } else {
      canDelete = true;
    }
  } else {
    restrictions.push('Insufficient permissions to delete users');
  }

  return {
    canEditRole,
    canEditStatus,
    canDelete,
    canViewDetails,
    canViewAuditLogs,
    restrictions
  };
}

/**
 * Validate bulk operation permissions
 */
export function validateBulkOperation(
  adminRole: string,
  operation: 'edit' | 'delete' | 'export',
  targetUserIds: string[],
  getUserRole: (id: string) => string
): { allowed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if user has bulk operation permission
  if (!hasPermission(adminRole, Permission.BULK_OPERATIONS)) {
    errors.push('Insufficient permissions for bulk operations');
    return { allowed: false, errors };
  }

  // Check individual permissions for each target user
  for (const userId of targetUserIds) {
    const targetRole = getUserRole(userId);
    const targetIsAdmin = targetRole === 'admin' || targetRole === 'super_admin';

    switch (operation) {
      case 'edit':
        if (targetIsAdmin && adminRole !== 'super_admin') {
          errors.push(`Cannot bulk edit admin user: ${userId}`);
        }
        break;
      
      case 'delete':
        if (targetIsAdmin) {
          errors.push(`Cannot bulk delete admin user: ${userId}`);
        }
        break;
      
      case 'export':
        // Export typically allowed for all users if user has permission
        break;
    }
  }

  return {
    allowed: errors.length === 0,
    errors
  };
}

/**
 * Check permissions from session object
 */
export function checkSessionPermission(
  session: Session | null,
  permission: Permission
): boolean {
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role || 'user';
  return hasPermission(userRole, permission);
}

/**
 * Check permissions from request token
 */
export async function checkRequestPermission(
  request: NextRequest,
  permission: Permission
): Promise<boolean> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET! 
    });

    if (!token) return false;

    const userRole = token.role as string || 'user';
    return hasPermission(userRole, permission);
  } catch (error) {
    console.error('Error checking request permission:', error);
    return false;
  }
}

/**
 * Get user's effective permissions (for UI display)
 */
export function getEffectivePermissions(userRole: string): {
  permissions: Permission[];
  restrictions: string[];
  capabilities: {
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canManageRoles: boolean;
    canViewAudits: boolean;
    canBulkOperations: boolean;
  };
} {
  const permissions = getUserPermissions(userRole);
  const restrictions: string[] = [];

  // Add role-specific restrictions
  if (userRole === 'admin') {
    restrictions.push('Cannot modify other admin accounts');
    restrictions.push('Cannot access super admin features');
  } else if (userRole === 'moderator') {
    restrictions.push('Can only change user status, not roles');
    restrictions.push('Cannot delete users permanently');
  }

  const capabilities = {
    canViewUsers: hasPermission(userRole, Permission.VIEW_USERS),
    canEditUsers: hasPermission(userRole, Permission.EDIT_USERS),
    canDeleteUsers: hasPermission(userRole, Permission.DELETE_USERS),
    canManageRoles: hasPermission(userRole, Permission.MANAGE_ROLES),
    canViewAudits: hasPermission(userRole, Permission.VIEW_AUDIT_LOGS),
    canBulkOperations: hasPermission(userRole, Permission.BULK_OPERATIONS)
  };

  return {
    permissions,
    restrictions,
    capabilities
  };
}

/**
 * Security validation for sensitive operations
 */
export function validateSensitiveOperation(
  adminRole: string,
  operation: string,
  additionalChecks?: Record<string, any>
): { isValid: boolean; reason?: string } {
  // Time-based restrictions (e.g., prevent operations outside business hours)
  const now = new Date();
  const hour = now.getHours();
  
  // Example: Prevent bulk deletes outside business hours (9 AM - 5 PM)
  if (operation === 'bulk_delete' && (hour < 9 || hour > 17)) {
    return {
      isValid: false,
      reason: 'Bulk delete operations are restricted outside business hours (9 AM - 5 PM)'
    };
  }

  // IP-based restrictions (if implemented)
  if (additionalChecks?.ipAddress && additionalChecks?.restrictedIPs) {
    const isRestrictedIP = additionalChecks.restrictedIPs.includes(additionalChecks.ipAddress);
    if (isRestrictedIP) {
      return {
        isValid: false,
        reason: 'Operation not allowed from this IP address'
      };
    }
  }

  // Role-based operation restrictions
  const sensitiveOperations = ['hard_delete', 'bulk_delete', 'role_promotion_to_admin'];
  if (sensitiveOperations.includes(operation) && adminRole !== 'super_admin') {
    return {
      isValid: false,
      reason: `${operation} requires super admin privileges`
    };
  }

  return { isValid: true };
}