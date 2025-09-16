import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

export async function checkIsAdmin(request: NextRequest, userId: string): Promise<boolean> {
  // For admin checks, we need to use service role key to bypass RLS
  // or use the regular client but with proper session handling

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // We're not setting cookies in this check
        },
      },
    }
  )

  try {
    // This query will work because the user's session cookies are passed
    // and the RLS policy "Users can view own profile" allows it
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[Middleware] Error checking admin status:', error)
      return false
    }

    return profile?.is_admin === true
  } catch (error) {
    console.error('[Middleware] Exception checking admin:', error)
    return false
  }
}