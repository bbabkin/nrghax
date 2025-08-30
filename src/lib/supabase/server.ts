/**
 * Supabase client configuration for server-side usage
 * This client is used in Server Components, API routes, and middleware
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

// Server client for use in Server Components
export const createSupabaseServerClient = () =>
  createServerComponentClient<Database>({ cookies });

// Service role client for admin operations (use sparingly and carefully)
export const createSupabaseServiceClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-auth-starter-server',
        },
      },
    }
  );

// Admin client for backend operations that bypass RLS
export const createSupabaseAdminClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-auth-starter-admin',
        },
      },
    }
  );
};

// Export default server client
export default createSupabaseServerClient;