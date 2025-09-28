import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  // Ensure environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support new publishable key format with fallback to legacy anon key
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
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
  // Support multiple key formats with fallback
  // 1. Custom key (for Vercel integration override)
  // 2. New secret key format (sb_secret_)
  // 3. Legacy service role key (from Vercel integration)
  const secretKey = process.env.CUSTOM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !secretKey) {
    throw new Error('Missing Supabase admin environment variables. Please set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY')
  }

  // Log which key type is being used (without exposing the actual key)
  if (process.env.NODE_ENV === 'development') {
    const keyType = process.env.CUSTOM_SUPABASE_SERVICE_KEY ? 'custom service' : process.env.SUPABASE_SECRET_KEY ? 'sb_secret_' : 'legacy service_role'
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