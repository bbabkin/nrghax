const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Service role key not found. Add SUPABASE_SERVICE_ROLE_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAdmin() {
  console.log('Creating test admin user...\n');

  // Create admin user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating user:', authError);
    return;
  }

  console.log('✅ Admin user created:', authData.user.email);
  console.log('   ID:', authData.user.id);

  // Create profile with admin flag
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      email: 'admin@test.com',
      full_name: 'Test Admin',
      is_admin: true
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('✅ Admin profile created');

  // Also create a regular test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'user@test.com',
    password: 'user123',
    email_confirm: true
  });

  if (userError) {
    console.error('Error creating regular user:', userError);
  } else {
    console.log('\n✅ Regular user created:', userData.user.email);

    // Create regular user profile
    await supabase
      .from('profiles')
      .upsert({
        id: userData.user.id,
        email: 'user@test.com',
        full_name: 'Test User',
        is_admin: false
      });
  }

  console.log('\n🎉 Test accounts ready!');
  console.log('\nAdmin login:');
  console.log('  Email: admin@test.com');
  console.log('  Password: admin123');
  console.log('\nRegular user login:');
  console.log('  Email: user@test.com');
  console.log('  Password: user123');
}

createTestAdmin().catch(console.error);