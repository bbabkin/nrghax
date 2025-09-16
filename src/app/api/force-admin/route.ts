import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' });
  }

  // Force create/update profile as admin
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      is_admin: true,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({
      error: 'Failed to update profile',
      details: error.message,
      hint: error.hint
    });
  }

  return NextResponse.json({
    success: true,
    message: 'You are now admin!',
    profile: data,
    next_steps: [
      '1. Sign out',
      '2. Sign back in',
      '3. You should see admin links in navigation',
      '4. Try accessing /admin/users'
    ]
  });
}