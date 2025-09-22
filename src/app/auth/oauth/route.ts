import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const provider = formData.get('provider') as string

  if (!provider || !['google', 'discord', 'github'].includes(provider)) {
    redirect('/auth?error=Invalid provider')
  }

  const supabase = await createClient()

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'discord' | 'github',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }

  redirect('/auth?error=Failed to initiate OAuth flow')
}