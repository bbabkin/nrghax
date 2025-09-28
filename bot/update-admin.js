#!/usr/bin/env node

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

async function updateUserToAdmin() {
  console.log('🔍 Searching for user with email containing "bbabkin"...');

  // First, find the user
  const { data: users, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .or('email.ilike.%bbabkin%,email.eq.bbabkin@gmail.com');

  if (findError) {
    console.error('❌ Error finding user:', findError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('❌ No user found with email containing "bbabkin"');
    process.exit(1);
  }

  console.log(`\n📋 Found ${users.length} user(s):`);
  users.forEach(u => {
    console.log(`   - ${u.email} (id: ${u.id})`);
    console.log(`     Current admin status: ${u.is_admin ? '✅ Admin' : '❌ Not admin'}`);
  });

  // Update users to be admin
  console.log('\n🔄 Updating admin status...');

  for (const user of users) {
    if (user.email && user.email.includes('bbabkin')) {
      if (user.is_admin) {
        console.log(`   ℹ️  ${user.email} is already an admin, skipping...`);
        continue;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error updating ${user.email}:`, error.message);
      } else {
        console.log(`   ✅ Successfully set ${user.email} as admin`);
        console.log(`      Updated user:`, data);
      }
    }
  }

  // Verify the update
  console.log('\n🔍 Verifying update...');
  const { data: verifyUsers, error: verifyError } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .or('email.ilike.%bbabkin%,email.eq.bbabkin@gmail.com');

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError.message);
  } else {
    console.log('📋 Final status:');
    verifyUsers.forEach(u => {
      console.log(`   - ${u.email}: ${u.is_admin ? '✅ Admin' : '❌ Not admin'}`);
    });
  }

  console.log('\n✨ Done!');
}

updateUserToAdmin().catch(console.error);