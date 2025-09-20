/**
 * Environment configuration that handles both Vercel and standard deployments
 */

// Database URL - Vercel uses POSTGRES_URL, others use DATABASE_URL
export const DATABASE_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// For Vercel Postgres, we need to set DATABASE_URL for Prisma
if (process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// OAuth configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// App configuration
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';

// Ensure required environment variables are set
if (!DATABASE_URL) {
  console.warn('Warning: No database URL found. Set either POSTGRES_URL or DATABASE_URL');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Warning: Supabase configuration incomplete');
}