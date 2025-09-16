const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const PRODUCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PRODUCTION_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(PRODUCTION_URL, PRODUCTION_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function diagnoseAdmin() {
  console.log('\n=== Diagnosing Admin Access in Production ===\n');

  // 1. Check all users and their profiles
  console.log('1. Auth Users and Profiles:');
  const { data: authUsers } = await supabase.auth.admin.listUsers();

  for (const user of authUsers.users) {
    console.log(`\n  User: ${user.email} (${user.id})`);
    console.log(`    Created: ${user.created_at}`);

    // Check profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.log(`    ❌ Profile error: ${error.message}`);
    } else if (profile) {
      console.log(`    ✅ Profile exists:`);
      console.log(`       - is_admin: ${profile.is_admin}`);
      console.log(`       - email: ${profile.email}`);
      console.log(`       - full_name: ${profile.full_name}`);
    } else {
      console.log(`    ❌ No profile found`);
    }
  }

  // 2. Check who should be admin (first user)
  console.log('\n2. First User Check:');
  const sortedUsers = authUsers.users.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (sortedUsers.length > 0) {
    const firstUser = sortedUsers[0];
    console.log(`  First user: ${firstUser.email}`);

    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', firstUser.id)
      .single();

    console.log(`  is_admin: ${firstProfile?.is_admin}`);

    if (!firstProfile?.is_admin) {
      console.log('\n  ⚠️  First user is not admin! Fixing...');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', firstUser.id);

      if (updateError) {
        console.log(`  ❌ Failed to update: ${updateError.message}`);
      } else {
        console.log(`  ✅ Fixed! First user is now admin`);
      }
    }
  }

  // 3. Test profile query as anon user (simulating app query)
  console.log('\n3. Testing Profile Query (as app would):');
  const anonClient = createClient(
    PRODUCTION_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  // Test if we can read profiles at all
  const { data: testProfiles, error: testError } = await anonClient
    .from('profiles')
    .select('id, email, is_admin')
    .limit(1);

  if (testError) {
    console.log(`  ❌ Cannot read profiles: ${testError.message}`);
    console.log('     This is the issue - RLS policies are blocking profile reads!');
  } else {
    console.log(`  ✅ Can read profiles`);
  }

  // 4. Check the specific admin emails from env
  console.log('\n4. Checking ADMIN_EMAILS from .env.production:');
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
  console.log(`  Admin emails: ${adminEmails.join(', ')}`);

  for (const email of adminEmails) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('email', email)
      .single();

    console.log(`  ${email}: is_admin = ${profile?.is_admin || 'no profile'}`);
  }

  console.log('\n=== Recommendations ===');
  console.log('If profiles cannot be read, the issue is RLS policies.');
  console.log('The middleware needs to read profiles to check is_admin.');
}

diagnoseAdmin().catch(console.error);