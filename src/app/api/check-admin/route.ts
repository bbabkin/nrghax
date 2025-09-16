import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({
      error: 'Not authenticated',
      details: 'Please log in first'
    }, { status: 401 });
  }

  // Get profile with admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({
      error: 'Profile fetch failed',
      details: profileError.message,
      hint: 'The profiles table might be missing or the schema might be outdated'
    }, { status: 500 });
  }

  // Get all admins count
  const { count: adminCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('is_admin', true);

  // Get total users count
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  return NextResponse.json({
    currentUser: {
      id: user.id,
      email: user.email,
      profileEmail: profile?.email,
      fullName: profile?.full_name,
      isAdmin: profile?.is_admin || false,
      createdAt: profile?.created_at
    },
    stats: {
      totalAdmins: adminCount || 0,
      totalUsers: totalUsers || 0,
      isFirstUser: totalUsers === 1
    },
    schema: {
      hasIsAdminColumn: profile && 'is_admin' in profile,
      profileExists: !!profile
    },
    recommendations: profile && !profile.is_admin ? [
      'User is NOT admin. To fix:',
      '1. Go to Supabase Dashboard > Table Editor > profiles',
      `2. Find user with ID: ${user.id}`,
      '3. Set is_admin to true',
      '4. Save changes'
    ] : profile?.is_admin ? ['User is already an admin ✅'] : ['Profile not found - schema might be outdated']
  });
}