/**
 * Helper function to get the Supabase secret key
 * Supports both new sb_secret_ format and legacy service_role key
 *
 * @returns The secret key or throws an error if not found
 */
export function getSupabaseSecretKey(): string {
  // Prefer new SUPABASE_SECRET_KEY if available
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      'Missing Supabase secret key. Please set SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY (legacy) environment variable.'
    );
  }

  return secretKey;
}

/**
 * Get the Supabase URL
 * @returns The Supabase URL or throws an error if not found
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  return url;
}

/**
 * Get the Supabase anon/public key
 * @returns The anon key or throws an error if not found
 */
export function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return anonKey;
}