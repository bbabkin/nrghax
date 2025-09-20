#!/usr/bin/env node

/**
 * Setup environment variables for Vercel deployment
 * Maps POSTGRES_URL to DATABASE_URL if needed
 */

console.log('Setting up environment variables...');

// If POSTGRES_URL exists but DATABASE_URL doesn't, use POSTGRES_URL
if (process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
  console.log('✓ Using POSTGRES_URL for database connection');
} else if (process.env.DATABASE_URL) {
  console.log('✓ Using DATABASE_URL for database connection');
} else {
  console.error('⚠️ Warning: No database URL found. Set either POSTGRES_URL or DATABASE_URL');
  console.error('Deployment may fail if database is required.');
}

// Log which environment variables are set (without showing values)
const envVars = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

console.log('\nEnvironment variables status:');
envVars.forEach(key => {
  if (process.env[key]) {
    console.log(`  ✓ ${key} is set`);
  } else {
    console.log(`  ✗ ${key} is not set`);
  }
});

console.log('\nEnvironment setup complete.\n');