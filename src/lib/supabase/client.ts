/**
 * Supabase client configuration for browser usage
 * This client is used in client-side components and browser environments
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

// Client for use in Client Components (browser)
export const createSupabaseClient = () =>
  createClientComponentClient<Database>();

// Direct client for specific use cases
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Configure 30-day session duration (2592000 seconds)
      storageKey: 'supabase.auth.token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-auth-starter',
      },
    },
  }
);

// Export singleton client instance for reuse
export default createSupabaseClient;