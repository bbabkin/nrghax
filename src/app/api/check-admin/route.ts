import { getCurrentUser } from '@/lib/auth/supabase-user';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user) {
    return NextResponse.json({
      error: 'Not authenticated',
      details: 'Please log in first'
    }, { status: 401 });
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
      name: user.name,
      isAdmin: user.is_admin,
    },
    stats: {
      totalAdmins: adminCount || 0,
      totalUsers: totalUsers || 0,
      isFirstUser: totalUsers === 1
    },
    schema: {
      profileExists: true
    },
    recommendations: !user.is_admin ? [
      'User is NOT admin. To fix:',
      '1. Update user in database',
      `2. Set is_admin to true for user ID: ${user.id}`,
    ] : ['User is already an admin ✅']
  });
}