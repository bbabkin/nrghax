const { createClient } = require('@supabase/supabase-js');

async function setupAdminUser() {
  const supabaseUrl = 'http://localhost:54321';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const adminEmail = 'admin@test.com';
  const adminPassword = 'Admin123!';

  try {
    console.log('Creating admin user...');

    // Delete existing user if exists (cleanup)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === adminEmail);

    if (existingUser) {
      console.log('Deleting existing user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // Create new admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Test Admin'
      }
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ User created:', authData.user.email);
    console.log('User ID:', authData.user.id);

    // Ensure profile exists with admin status
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: adminEmail,
        name: 'Test Admin',
        is_admin: true
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile error:', profileError);
    } else {
      console.log('✅ Admin profile created');
    }

    // Verify the setup
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    console.log('\n📋 Admin User Created:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Is Admin:', profile?.is_admin);
    console.log('\nYou can now log in with these credentials!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupAdminUser().catch(console.error);