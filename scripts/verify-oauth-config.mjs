#!/usr/bin/env node

/**
 * OAuth Configuration Verification Script
 * Run this to check if your OAuth environment variables are properly configured
 */

console.log('🔍 Verifying OAuth Configuration...\n');

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const optionalVars = {
  'GOOGLE_OAUTH_CLIENT_ID': process.env.GOOGLE_OAUTH_CLIENT_ID,
  'GOOGLE_OAUTH_CLIENT_SECRET': process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  'DISCORD_CLIENT_ID': process.env.DISCORD_CLIENT_ID,
  'DISCORD_CLIENT_SECRET': process.env.DISCORD_CLIENT_SECRET,
};

let hasErrors = false;

console.log('📋 Required Variables:');
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`  ❌ ${key}: MISSING`);
    hasErrors = true;
  } else {
    const preview = value.substring(0, 20) + '...';
    console.log(`  ✅ ${key}: ${preview}`);
  }
}

console.log('\n🔐 OAuth Provider Variables:');
const googleConfigured = optionalVars.GOOGLE_OAUTH_CLIENT_ID && optionalVars.GOOGLE_OAUTH_CLIENT_SECRET;
const discordConfigured = optionalVars.DISCORD_CLIENT_ID && optionalVars.DISCORD_CLIENT_SECRET;

if (googleConfigured) {
  console.log('  ✅ Google OAuth: Configured');
  console.log(`     Client ID: ${optionalVars.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 20)}...`);
} else {
  console.log('  ⚠️  Google OAuth: Not configured (optional)');
}

if (discordConfigured) {
  console.log('  ✅ Discord OAuth: Configured');
  console.log(`     Client ID: ${optionalVars.DISCORD_CLIENT_ID?.substring(0, 10)}...`);
} else {
  console.log('  ⚠️  Discord OAuth: Not configured (optional)');
}

console.log('\n🌐 URL Configuration:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  console.log(`  Site URL: ${supabaseUrl}`);

  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    console.log('  ℹ️  Using local Supabase (development)');
  } else {
    console.log('  ✅ Using production Supabase');
  }

  console.log(`\n  Expected OAuth callback URL for providers:`);
  const callbackUrl = supabaseUrl.replace('http://127.0.0.1:54321', supabaseUrl) + '/auth/v1/callback';
  console.log(`  ${callbackUrl}`);
}

console.log('\n📝 Next Steps:');
if (!googleConfigured && !discordConfigured) {
  console.log('  1. Configure at least one OAuth provider (Google or Discord)');
  console.log('  2. Add credentials to your .env.local file');
  console.log('  3. Enable the provider in Supabase Dashboard → Authentication → Providers');
}

if (supabaseUrl?.includes('localhost')) {
  console.log('  4. For production, update NEXT_PUBLIC_SUPABASE_URL to your production Supabase URL');
  console.log('  5. Update OAuth provider redirect URLs to use production Supabase URL');
}

console.log('\n📚 For detailed setup instructions, see:');
console.log('  - docs/OAUTH_TROUBLESHOOTING.md');
console.log('  - docs/SUPABASE_OAUTH_SETUP.md (if exists)');

if (hasErrors) {
  console.log('\n❌ Configuration incomplete. Fix the errors above and try again.');
  process.exit(1);
} else {
  console.log('\n✅ Basic configuration looks good!');
  if (!googleConfigured && !discordConfigured) {
    console.log('⚠️  But no OAuth providers are configured.');
  }
}
