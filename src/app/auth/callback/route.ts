import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Check for OAuth error from provider
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('[OAuth Callback] Provider error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[OAuth Callback] Exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/auth?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    if (data?.session) {
      console.log('[OAuth Callback] Success - user:', data.user?.email)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code and no error - something went wrong
  console.error('[OAuth Callback] No code or error received')
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}