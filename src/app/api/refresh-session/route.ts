import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST() {
  const supabase = await createClient()

  try {
    // Force a session refresh
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()

    if (sessionError) {
      return NextResponse.json({
        error: 'Failed to refresh session',
        details: sessionError.message
      }, { status: 400 })
    }

    if (!session?.user) {
      return NextResponse.json({
        error: 'No active session'
      }, { status: 401 })
    }

    // Get updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    // Revalidate all pages to ensure fresh data
    revalidatePath('/', 'layout')

    return NextResponse.json({
      success: true,
      user: session.user,
      profile: profile,
      profileError: profileError?.message
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: String(error)
    }, { status: 500 })
  }
}