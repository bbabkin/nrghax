import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission, checkAdminRateLimit } from '@/middleware/admin';
import { createClient } from '@supabase/supabase-js';
import { createAuditLog, AuditAction } from '@/lib/admin/audit';
import { hasPermission, Permission, getUserEditRestrictions } from '@/lib/admin/permissions';
import { z } from 'zod';

// Input validation schemas
const UpdateUserSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  fullName: z.string().min(1).optional(),
  reason: z.string().optional()
});

const DeleteUserSchema = z.object({
  type: z.enum(['soft', 'hard']).default('soft'),
  reason: z.string().min(1),
  confirmation: z.string().optional()
});

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const auth = await checkAdminPermission(request);
    if (!auth.isAuthorized || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting
    if (!checkAdminRateLimit(auth.user.id, 100)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check specific permission
    if (!hasPermission(auth.user.role, Permission.VIEW_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user details
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        created_at,
        updated_at,
        last_login,
        email_verified,
        metadata
      `)
      .eq('id', params.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check what actions the admin can perform on this user
    const restrictions = getUserEditRestrictions(
      auth.user.role,
      auth.user.id,
      user.id,
      user.role
    );

    // Create audit log
    await createAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: AuditAction.VIEW_USER,
      targetUserId: user.id,
      details: {
        targetUserEmail: user.email,
        viewedFields: Object.keys(user)
      },
      severity: 'info'
    }, request);

    return NextResponse.json({
      user,
      permissions: restrictions
    });

  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error);

    // Log error
    try {
      const auth = await checkAdminPermission(request);
      if (auth.isAuthorized && auth.user) {
        await createAuditLog({
          userId: auth.user.id,
          userEmail: auth.user.email,
          action: AuditAction.DATABASE_ERROR,
          details: {
            operation: `GET /api/admin/users/${params.id}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          severity: 'error'
        }, request);
      }
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const auth = await checkAdminPermission(request);
    if (!auth.isAuthorized || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting (stricter for edit operations)
    if (!checkAdminRateLimit(auth.user.id, 20)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check specific permission
    if (!hasPermission(auth.user.role, Permission.EDIT_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateUserSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check edit restrictions
    const restrictions = getUserEditRestrictions(
      auth.user.role,
      auth.user.id,
      currentUser.id,
      currentUser.role
    );

    // Validate specific changes against restrictions
    if (validatedData.role && !restrictions.canEditRole) {
      return NextResponse.json(
        { error: 'Cannot edit this user\'s role', restrictions: restrictions.restrictions },
        { status: 403 }
      );
    }

    if (validatedData.status && !restrictions.canEditStatus) {
      return NextResponse.json(
        { error: 'Cannot edit this user\'s status', restrictions: restrictions.restrictions },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.fullName) {
      updateData.full_name = validatedData.fullName;
    }

    if (validatedData.role) {
      updateData.role = validatedData.role;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Determine audit action based on changes
    let auditAction = AuditAction.EDIT_USER_STATUS;
    if (validatedData.role) {
      auditAction = AuditAction.EDIT_USER_ROLE;
    }

    // Create audit log
    await createAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: auditAction,
      targetUserId: currentUser.id,
      details: {
        targetUserEmail: currentUser.email,
        changes: {
          before: {
            role: currentUser.role,
            status: currentUser.status,
            fullName: currentUser.full_name
          },
          after: {
            role: updatedUser.role,
            status: updatedUser.status,
            fullName: updatedUser.full_name
          }
        },
        reason: validatedData.reason
      },
      severity: validatedData.role ? 'warning' : 'info'
    }, request);

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error);

    // Log error
    try {
      const auth = await checkAdminPermission(request);
      if (auth.isAuthorized && auth.user) {
        await createAuditLog({
          userId: auth.user.id,
          userEmail: auth.user.email,
          action: AuditAction.EDIT_USER_FAILED,
          targetUserId: params.id,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            attemptedChanges: await request.json().catch(() => ({}))
          },
          severity: 'error'
        }, request);
      }
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin permissions
    const auth = await checkAdminPermission(request);
    if (!auth.isAuthorized || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting (very strict for delete operations)
    if (!checkAdminRateLimit(auth.user.id, 5)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check specific permission
    if (!hasPermission(auth.user.role, Permission.DELETE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = DeleteUserSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check delete restrictions
    const restrictions = getUserEditRestrictions(
      auth.user.role,
      auth.user.id,
      currentUser.id,
      currentUser.role
    );

    if (!restrictions.canDelete) {
      return NextResponse.json(
        { error: 'Cannot delete this user', restrictions: restrictions.restrictions },
        { status: 403 }
      );
    }

    // For hard delete, require confirmation
    if (validatedData.type === 'hard' && validatedData.confirmation !== 'DELETE') {
      return NextResponse.json(
        { error: 'Hard delete requires confirmation. Send "DELETE" in confirmation field.' },
        { status: 400 }
      );
    }

    let auditAction: AuditAction;
    let message: string;

    if (validatedData.type === 'soft') {
      // Soft delete - just mark as inactive
      const { error: updateError } = await supabase
        .from('users')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (updateError) {
        throw updateError;
      }

      auditAction = AuditAction.SOFT_DELETE_USER;
      message = 'User deactivated successfully';
    } else {
      // Hard delete - remove from both auth and profile
      
      // Delete from users table first (will cascade)
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', params.id);

      if (profileError) {
        throw profileError;
      }

      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(params.id);
      
      if (authError) {
        console.error('Auth deletion error:', authError);
        // Profile is already deleted, but log the auth error
      }

      auditAction = AuditAction.HARD_DELETE_USER;
      message = 'User permanently deleted';
    }

    // Create audit log
    await createAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: auditAction,
      targetUserId: currentUser.id,
      details: {
        targetUserEmail: currentUser.email,
        deletionType: validatedData.type,
        reason: validatedData.reason,
        userData: {
          fullName: currentUser.full_name,
          role: currentUser.role,
          registrationDate: currentUser.created_at,
          lastLogin: currentUser.last_login
        }
      },
      severity: 'critical'
    }, request);

    return NextResponse.json({
      message,
      deletionType: validatedData.type
    });

  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);

    // Log error
    try {
      const auth = await checkAdminPermission(request);
      if (auth.isAuthorized && auth.user) {
        await createAuditLog({
          userId: auth.user.id,
          userEmail: auth.user.email,
          action: AuditAction.DELETE_USER_FAILED,
          targetUserId: params.id,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            attemptedOperation: await request.json().catch(() => ({}))
          },
          severity: 'error'
        }, request);
      }
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}