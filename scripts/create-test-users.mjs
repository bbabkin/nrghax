import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  // Test users to create
  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin',
      profile: {
        display_name: 'Admin User',
        bio: 'System administrator with full access',
        is_admin: true
      }
    },
    {
      email: 'john@example.com',
      password: 'User123!',
      role: 'user',
      profile: {
        display_name: 'John Doe',
        bio: 'Regular user interested in productivity hacks',
        is_admin: false
      }
    },
    {
      email: 'jane@example.com',
      password: 'User123!',
      role: 'user',
      profile: {
        display_name: 'Jane Smith',
        bio: 'Enthusiast of morning routines and energy hacks',
        is_admin: false
      }
    },
    {
      email: 'test@example.com',
      password: 'Test123!',
      role: 'user',
      profile: {
        display_name: 'Test User',
        bio: 'Test account for development',
        is_admin: false
      }
    }
  ];

  for (const userData of testUsers) {
    try {
      // Create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          display_name: userData.profile.display_name
        }
      });

      if (authError) {
        if (authError.message?.includes('already been registered')) {
          console.log(`ℹ️  User ${userData.email} already exists`);

          // Get existing user
          const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          if (!listError && users) {
            const existingUser = users.find(u => u.email === userData.email);
            if (existingUser) {
              // Update profile if needed
              const { error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                  display_name: userData.profile.display_name,
                  bio: userData.profile.bio,
                  is_admin: userData.profile.is_admin,
                  onboarded: true
                })
                .eq('id', existingUser.id);

              if (!updateError) {
                console.log(`   ✅ Updated profile for ${userData.email}`);
              }
            }
          }
        } else {
          console.error(`❌ Error creating ${userData.email}:`, authError.message);
        }
      } else if (authData?.user) {
        console.log(`✅ Created user: ${userData.email}`);

        // Update profile with additional data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            display_name: userData.profile.display_name,
            bio: userData.profile.bio,
            is_admin: userData.profile.is_admin,
            onboarded: true
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error(`   ❌ Error updating profile:`, profileError.message);
        } else {
          console.log(`   ✅ Profile updated (admin: ${userData.profile.is_admin})`);
        }

        // Add some hack progress for regular users
        if (!userData.profile.is_admin) {
          // Get some hacks
          const { data: hacks } = await supabaseAdmin
            .from('hacks')
            .select('id')
            .limit(3);

          if (hacks && hacks.length > 0) {
            for (const hack of hacks) {
              await supabaseAdmin
                .from('user_hacks')
                .insert({
                  user_id: authData.user.id,
                  hack_id: hack.id,
                  status: Math.random() > 0.5 ? 'active' : 'completed'
                })
                .select();
            }
            console.log(`   ✅ Added hack progress`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${userData.email}:`, error);
    }
  }

  console.log('\n📋 Test User Credentials:');
  console.log('========================');
  testUsers.forEach(user => {
    console.log(`${user.profile.display_name} (${user.role})`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  });

  console.log('🎯 URLs:');
  console.log('  Auth: http://localhost:3000/auth');
  console.log('  Dashboard: http://localhost:3000/dashboard');
  console.log('  Admin: http://localhost:3000/admin/users');
}

createTestUsers().catch(console.error);