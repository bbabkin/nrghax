const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  const users = [
    {
      email: 'admin@test.com',
      password: 'test123',
      name: 'Admin User',
      is_admin: true
    },
    {
      email: 'user@test.com',
      password: 'test123',
      name: 'Test User',
      is_admin: false
    }
  ];

  console.log('Creating test users...\n');

  for (const userData of users) {
    try {
      // Create user in auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  User ${userData.email} already exists`);

          // Update the existing user's password
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === userData.email);

          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: userData.password }
            );

            if (updateError) {
              console.log(`   ❌ Failed to update password: ${updateError.message}`);
            } else {
              console.log(`   ✅ Password updated successfully`);
            }
          }
          continue;
        }
        throw authError;
      }

      console.log(`✅ Created user: ${userData.email}`);

      // Update the profile to set admin status
      if (userData.is_admin && authUser?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', authUser.user.id);

        if (profileError) {
          console.log(`   ⚠️  Failed to set admin status: ${profileError.message}`);
        } else {
          console.log(`   ✅ Admin privileges granted`);
        }
      }

    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  users.forEach(user => {
    console.log(`\n${user.is_admin ? '👑 Admin' : '👤 User'}:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
  });

  console.log('\n✨ Setup complete! You can now sign in at http://localhost:3000/auth/signin');
}

createTestUsers();
