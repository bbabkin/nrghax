const { createClient } = require('@supabase/supabase-js');

async function createAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Create admin user with Supabase Auth Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'bbabkin@gmail.com',
      password: 'password123',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Admin User'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('User already exists, updating profile...');

        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === 'bbabkin@gmail.com');

        if (existingUser) {
          // Update profile to ensure admin status
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', existingUser.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          } else {
            console.log('✅ Admin status updated for existing user');
          }
        }
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Admin user created:', authData.user.email);

      // Ensure profile has admin status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      } else {
        console.log('✅ Admin profile updated');
      }
    }

    // Verify the admin status
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'bbabkin@gmail.com');

    if (adminUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();

      console.log('\n📋 User details:');
      console.log('- ID:', adminUser.id);
      console.log('- Email:', adminUser.email);
      console.log('- Is Admin:', profile?.is_admin || false);
      console.log('- Profile exists:', !!profile);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdminUser();