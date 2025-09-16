import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  // Get auth user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // Get profile directly
  let profile = null;
  let profileError = null;
  if (user) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
    profileError = error;
  }

  // Try another query by email
  let profileByEmail = null;
  if (user?.email) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .single();
    profileByEmail = data;
  }

  // Get cookies
  const cookieStore = await cookies();
  const supabaseCookies = cookieStore.getAll().filter(c =>
    c.name.includes('supabase') || c.name.includes('auth')
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    auth: {
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      } : null,
      userError: userError?.message
    },
    session: {
      exists: !!session,
      expires_at: session?.expires_at,
      user_id: session?.user?.id,
      user_email: session?.user?.email
    },
    profile: {
      byId: profile ? {
        id: profile.id,
        email: profile.email,
        is_admin: profile.is_admin,
        onboarding_completed: profile.onboarding_completed
      } : null,
      byEmail: profileByEmail ? {
        id: profileByEmail.id,
        email: profileByEmail.email,
        is_admin: profileByEmail.is_admin
      } : null,
      error: profileError?.message
    },
    cookies: {
      count: supabaseCookies.length,
      names: supabaseCookies.map(c => c.name)
    },
    diagnosis: {
      authenticated: !!user,
      hasProfile: !!profile,
      isAdmin: profile?.is_admin === true,
      profileMatchesAuth: profile?.id === user?.id,
      issues: [
        !user && 'Not authenticated',
        user && !profile && 'Profile not found',
        profile && !profile.is_admin && 'is_admin is false',
        profile?.id !== user?.id && 'Profile ID mismatch'
      ].filter(Boolean)
    },
    nextSteps: !profile?.is_admin ? [
      '1. Clear all cookies for this domain',
      '2. Sign out completely',
      '3. Close browser',
      '4. Open new browser window',
      '5. Sign in fresh'
    ] : ['You are admin! If still blocked, check middleware.']
  });
}