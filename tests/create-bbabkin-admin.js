const { createClient } = require('@supabase/supabase-js');

async function createBbabkinAdmin() {
  const supabaseUrl = 'http://localhost:54321';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const adminEmail = 'bbabkin@gmail.com';
  const adminPassword = 'Password123!';

  try {
    console.log('Creating bbabkin@gmail.com as admin...');

    // Check if user exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === adminEmail);

    if (existingUser) {
      console.log('User already exists, updating to admin...');

      // Update profile to admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', existingUser.id);

      if (!profileError) {
        console.log('✅ Updated to admin');
      }
    } else {
      // Create new admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: 'B Babkin'
        }
      });

      if (authError) {
        throw authError;
      }

      console.log('✅ User created:', authData.user.email);

      // Ensure profile exists with admin status
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: adminEmail,
          name: 'B Babkin',
          is_admin: true
        }, {
          onConflict: 'id'
        });

      if (!profileError) {
        console.log('✅ Admin profile created');
      }
    }

    // Verify the setup
    const user = existingUser || users.find(u => u.email === adminEmail);
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', adminEmail)
        .single();

      console.log('\n📋 Admin User Ready:');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('Is Admin:', profile?.is_admin);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createBbabkinAdmin().catch(console.error);