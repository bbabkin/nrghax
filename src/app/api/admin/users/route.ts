import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission, checkAdminRateLimit } from '@/middleware/admin';
import { createClient } from '@supabase/supabase-js';
import { createAuditLog, AuditAction } from '@/lib/admin/audit';
import { hasPermission, Permission } from '@/lib/admin/permissions';
import { z } from 'zod';

// Input validation schemas
const GetUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['all', 'user', 'moderator', 'admin', 'super_admin']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  sortBy: z.enum(['created_at', 'email', 'full_name', 'last_login']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['user', 'moderator', 'admin']).default('user'),
  sendWelcomeEmail: z.boolean().default(true)
});

// GET /api/admin/users - List users with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const auth = await checkAdminPermission(request);
    if (!auth.isAuthorized || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting
    if (!checkAdminRateLimit(auth.user.id, 60)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check specific permission
    if (!hasPermission(auth.user.role, Permission.VIEW_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = GetUsersQuerySchema.parse(queryParams);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
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
        email_verified
      `)
      .order(validatedQuery.sortBy, { ascending: validatedQuery.sortOrder === 'asc' });

    // Apply filters
    if (validatedQuery.search) {
      query = query.or(`email.ilike.%${validatedQuery.search}%,full_name.ilike.%${validatedQuery.search}%`);
    }

    if (validatedQuery.role !== 'all') {
      query = query.eq('role', validatedQuery.role);
    }

    if (validatedQuery.status !== 'all') {
      query = query.eq('status', validatedQuery.status);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPrevPage = validatedQuery.page > 1;

    // Create audit log
    await createAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: AuditAction.VIEW_USERS,
      details: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        search: validatedQuery.search,
        filters: {
          role: validatedQuery.role,
          status: validatedQuery.status
        },
        resultsCount: users?.length || 0,
        totalCount
      },
      severity: 'info'
    }, request);

    return NextResponse.json({
      users: users || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search: validatedQuery.search,
        role: validatedQuery.role,
        status: validatedQuery.status,
        sortBy: validatedQuery.sortBy,
        sortOrder: validatedQuery.sortOrder
      }
    });

  } catch (error) {
    console.error('GET /api/admin/users error:', error);

    // Log error
    try {
      const auth = await checkAdminPermission(request);
      if (auth.isAuthorized && auth.user) {
        await createAuditLog({
          userId: auth.user.id,
          userEmail: auth.user.email,
          action: AuditAction.DATABASE_ERROR,
          details: {
            operation: 'GET /api/admin/users',
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
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

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const auth = await checkAdminPermission(request);
    if (!auth.isAuthorized || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Rate limiting (stricter for create operations)
    if (!checkAdminRateLimit(auth.user.id, 10)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Check specific permission
    if (!hasPermission(auth.user.role, Permission.CREATE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateUserSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: !validatedData.sendWelcomeEmail, // Skip confirmation if welcome email is disabled
      user_metadata: {
        full_name: validatedData.fullName
      }
    });

    if (authError || !authUser.user) {
      throw authError || new Error('Failed to create auth user');
    }

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        role: validatedData.role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    // Create audit log
    await createAuditLog({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: AuditAction.CREATE_USER,
      targetUserId: authUser.user.id,
      details: {
        targetUserEmail: validatedData.email,
        targetUserName: validatedData.fullName,
        assignedRole: validatedData.role,
        welcomeEmailSent: validatedData.sendWelcomeEmail
      },
      severity: 'info'
    }, request);

    return NextResponse.json({
      user: userProfile,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/admin/users error:', error);

    // Log error
    try {
      const auth = await checkAdminPermission(request);
      if (auth.isAuthorized && auth.user) {
        await createAuditLog({
          userId: auth.user.id,
          userEmail: auth.user.email,
          action: AuditAction.CREATE_USER_FAILED,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            attemptedData: {
              // Don't log sensitive data like passwords
              email: (await request.json().catch(() => ({})))?.email
            }
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