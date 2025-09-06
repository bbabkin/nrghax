import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const provider = String(formData.get('provider')) as 'google' | 'discord'
  
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${requestUrl.origin}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=Could not authenticate user`,
      {
        status: 301,
      }
    )
  }

  return NextResponse.redirect(data.url, {
    status: 301,
  })
}