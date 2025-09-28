const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBorisUser() {
  console.log('Creating boris@practiceenergy.com user...');

  // First, try to delete the user if they exist
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === 'boris@practiceenergy.com');

  if (existingUser) {
    // Delete existing user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error('Error deleting existing user:', deleteError.message);
    } else {
      console.log('✅ Deleted existing user');
    }

    // Wait a bit for deletion to complete
    await new Promise(r => setTimeout(r, 1000));
  }

  // Create user
  const { data: { user }, error } = await supabase.auth.admin.createUser({
    email: 'boris@practiceenergy.com',
    password: 'Test123!',
    email_confirm: true
  });

  if (error) {
    console.error('❌ Error creating user:', error.message);
    return;
  }

  console.log('✅ User created:', user.email);
  console.log('User ID:', user.id);

  // Wait for trigger to execute
  await new Promise(r => setTimeout(r, 2000));

  // Check profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Error fetching profile:', profileError.message);
    return;
  }

  console.log('✅ Profile created:');
  console.log('   Email:', profile.email);
  console.log('   Is Admin:', profile.is_admin);

  if (profile.is_admin) {
    console.log('\n🎉 SUCCESS! Boris is automatically an admin!');
  } else {
    console.log('\n⚠️  Note: Admin status not set. You may need to manually update.');
  }

  console.log('\n📋 User Created:');
  console.log('Email: boris@practiceenergy.com');
  console.log('Password: Test123!');
  console.log('Is Admin:', profile.is_admin);
  console.log('\nYou can now log in with these credentials!');
}

createBorisUser().catch(console.error);