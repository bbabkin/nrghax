#!/usr/bin/env node

/**
 * Script to create test users in local Supabase
 * Run with: node scripts/create-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');

// Local Supabase URL and service role key
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Local service role key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('Creating test users...\n');

  // Test users to create
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'admin123',
      name: 'Admin User',
      username: 'admin',
      isAdmin: true,
      onboarded: true
    },
    {
      email: 'user@test.com',
      password: 'user123',
      name: 'Test User',
      username: 'testuser',
      isAdmin: false,
      onboarded: true
    },
    {
      email: 'newuser@test.com',
      password: 'newuser123',
      name: 'New User',
      username: 'newuser',
      isAdmin: false,
      onboarded: false
    }
  ];

  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      });

      if (authError) {
        if (authError.message?.includes('already been registered')) {
          console.log(`✓ User ${user.email} already exists`);

          // Update the profile to ensure correct settings
          const { data: existingUser } = await supabase.auth.admin.getUserByEmail(user.email);
          if (existingUser?.user) {
            await supabase
              .from('profiles')
              .update({
                name: user.name,
                is_admin: user.isAdmin,
                onboarded: user.onboarded
              })
              .eq('id', existingUser.user.id);
            console.log(`  Updated profile settings for ${user.email}`);
          }
        } else {
          console.error(`✗ Error creating ${user.email}:`, authError.message);
        }
        continue;
      }

      if (authData?.user) {
        // Create or update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: user.email,
            name: user.name,
            is_admin: user.isAdmin,
            onboarded: user.onboarded
          });

        if (profileError) {
          console.error(`✗ Error creating profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✓ Created user ${user.email} (Password: ${user.password})`);
        }

        // Add some default tags to the regular user
        if (user.email === 'user@test.com') {
          // Get beginner and energy tags
          const { data: tags } = await supabase
            .from('tags')
            .select('id')
            .in('slug', ['beginner', 'energy'])
            .limit(2);

          if (tags && tags.length > 0) {
            for (const tag of tags) {
              await supabase
                .from('user_tags')
                .upsert({
                  user_id: authData.user.id,
                  tag_id: tag.id,
                  source: 'default'
                });
            }
            console.log(`  Added default tags to ${user.email}`);
          }
        }
      }
    } catch (error) {
      console.error(`✗ Unexpected error for ${user.email}:`, error.message);
    }
  }

  console.log('\n===========================================');
  console.log('Test Users Summary:');
  console.log('===========================================');
  console.log('1. Admin User');
  console.log('   Email: admin@test.com');
  console.log('   Password: admin123');
  console.log('   Status: Admin, Onboarded\n');
  console.log('2. Regular User');
  console.log('   Email: user@test.com');
  console.log('   Password: user123');
  console.log('   Status: Regular user, Onboarded\n');
  console.log('3. New User');
  console.log('   Email: newuser@test.com');
  console.log('   Password: newuser123');
  console.log('   Status: New user, needs onboarding\n');
  console.log('You can now test the different user flows!');
  console.log('===========================================');
}

createTestUsers().catch(console.error);