import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: userError?.message
      }, { status: 401 })
    }

    // Get profile with admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Also check if we can read profiles at all
    const { data: allProfiles, error: readError } = await supabase
      .from('profiles')
      .select('id, email, is_admin')
      .limit(5)

    // Check session data
    const { data: { session } } = await supabase.auth.getSession()

    return NextResponse.json({
      auth_user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
      profile_error: profileError?.message || null,
      can_read_profiles: !readError,
      read_error: readError?.message || null,
      sample_profiles: allProfiles || [],
      session: {
        expires_at: session?.expires_at,
        user_metadata: session?.user?.user_metadata,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: String(error)
    }, { status: 500 })
  }
}