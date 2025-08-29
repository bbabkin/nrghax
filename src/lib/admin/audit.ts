import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Audit action types
export enum AuditAction {
  // View actions
  VIEW_USERS = 'view_users',
  VIEW_USER = 'view_user',
  SEARCH_USERS = 'search_users',
  
  // Edit actions
  CREATE_USER = 'create_user',
  EDIT_USER_ROLE = 'edit_user_role',
  EDIT_USER_STATUS = 'edit_user_status',
  DEACTIVATE_USER = 'deactivate_user',
  ACTIVATE_USER = 'activate_user',
  BULK_EDIT_USERS = 'bulk_edit_users',
  
  // Delete actions
  SOFT_DELETE_USER = 'soft_delete_user',
  HARD_DELETE_USER = 'hard_delete_user',
  BULK_DELETE_USERS = 'bulk_delete_users',
  
  // Failed actions
  CREATE_USER_FAILED = 'create_user_failed',
  EDIT_USER_FAILED = 'edit_user_failed',
  DELETE_USER_FAILED = 'delete_user_failed',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATABASE_ERROR = 'database_error',
  CONCURRENT_MODIFICATION = 'concurrent_modification',
  
  // System actions
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke'
}

// Audit log severity levels
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

// Audit log entry structure
export interface AuditLogEntry {
  userId: string;
  userEmail: string;
  action: AuditAction;
  targetUserId?: string;
  details: Record<string, any>;
  severity: AuditSeverity;
}

// Database audit log record
export interface AuditLogRecord {
  id?: string;
  user_id: string;
  user_email: string;
  action: string;
  target_user_id?: string;
  details: Record<string, any>;
  severity: AuditSeverity;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  entry: AuditLogEntry,
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract request metadata
    const ipAddress = request?.ip || 
      request?.headers.get('x-forwarded-for') ||
      request?.headers.get('x-real-ip') ||
      '127.0.0.1';
    
    const userAgent = request?.headers.get('user-agent') || 'Unknown';

    // Create immutable copy of details
    const detailsCopy = JSON.parse(JSON.stringify(entry.details));

    // Create audit log record
    const auditRecord: AuditLogRecord = {
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      ...(entry.targetUserId && { target_user_id: entry.targetUserId }),
      details: detailsCopy,
      severity: entry.severity,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    // Insert audit log (bypass RLS with service role)
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditRecord);

    if (error) {
      // Log audit failure but don't throw to prevent breaking main operation
      console.error('Audit log creation failed:', error);
    }
  } catch (error) {
    // Log error but don't throw to prevent breaking main operation
    console.error('Audit logging error:', error);
  }
}

/**
 * Query audit logs (for admin dashboard)
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  severity?: AuditSeverity;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options.action) {
    query = query.eq('action', options.action);
  }

  if (options.severity) {
    query = query.eq('severity', options.severity);
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  return query;
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(timeRange: '24h' | '7d' | '30d' = '7d') {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, severity')
    .gte('created_at', startDate.toISOString());

  if (error) {
    throw error;
  }

  // Process statistics
  const stats = {
    total: data?.length || 0,
    byAction: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    timeRange
  };

  data?.forEach(log => {
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
  });

  return stats;
}