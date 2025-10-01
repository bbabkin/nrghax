import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  // Support new publishable key format with fallback to legacy anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Try new format first, then fall back to legacy
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  )
}