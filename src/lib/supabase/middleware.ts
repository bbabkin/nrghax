import { createSupabaseClient } from '@/lib/supabase/client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

/**
 * Creates a Supabase client for use in middleware
 */
export function createSupabaseMiddleware(request: NextRequest) {
  // In middleware, we need to use the server client to access cookies
  return createSupabaseServerClient()
}