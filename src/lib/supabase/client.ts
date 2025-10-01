import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  // Support both new publishable key and legacy anon key formats
  // New format: sb_publishable_xxx (recommended)
  // Legacy format: eyJxxx... JWT token
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Runtime validation: Ensure we're not using a secret key in the browser
  if (typeof window !== 'undefined' && supabaseKey?.startsWith('sb_secret_')) {
    throw new Error(
      'Forbidden: Secret API key detected in browser context. ' +
      'Use NEXT_PUBLIC_SUPABASE_ANON_KEY with a publishable key (sb_publishable_) or anon key instead.'
    )
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}