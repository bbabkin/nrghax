import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  // Ensure environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client with service role key for server-side operations
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both new secret key format and legacy service role key
  // Prefer new SUPABASE_SECRET_KEY if available
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error('Missing Supabase admin environment variables. Please set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY')
  }

  // Log which key type is being used (without exposing the actual key)
  if (process.env.NODE_ENV === 'development') {
    const keyType = process.env.SUPABASE_SECRET_KEY ? 'sb_secret_' : 'legacy service_role'
    console.log(`[Supabase] Using ${keyType} key for admin client`)
  }

  return createServerClient<Database>(
    supabaseUrl,
    secretKey,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}