const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdmin() {
  console.log('Checking admin status...\n');

  // Get the admin user
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users.users.find(u => u.email === 'admin@test.com');

  if (!adminUser) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('✅ Admin user found:');
  console.log('   ID:', adminUser.id);
  console.log('   Email:', adminUser.email);

  // Check profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', adminUser.id)
    .single();

  if (error) {
    console.log('\n❌ Profile error:', error.message);
  } else if (profile) {
    console.log('\n✅ Profile found:');
    console.log('   is_admin:', profile.is_admin);
    console.log('   email:', profile.email);
    console.log('   full_name:', profile.full_name);
  } else {
    console.log('\n❌ No profile found');
  }

  // Test middleware query
  console.log('\n🧪 Testing middleware query...');
  const { data: adminCheck, error: checkError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminUser.id)
    .single();

  if (checkError) {
    console.log('❌ Middleware query failed:', checkError.message);
  } else {
    console.log('✅ Middleware query result:', adminCheck);
  }

  // Test if we can read profiles as anon
  console.log('\n🧪 Testing anon access to profiles...');
  const anonClient = createClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data: anonProfiles, error: anonError } = await anonClient
    .from('profiles')
    .select('is_admin')
    .limit(1);

  if (anonError) {
    console.log('❌ Anon cannot read profiles:', anonError.message);
  } else {
    console.log('✅ Anon can read profiles');
  }
}

checkAdmin().catch(console.error);