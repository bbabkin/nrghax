#!/usr/bin/env node

/**
 * Sign up admin users using the proper Supabase signup flow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminUsers = [
  { email: 'admin@nrghax.com', password: 'AdminPass123!', name: 'Admin User' },
  { email: 'admin@test.com', password: 'Test123!', name: 'Test Admin' }
];

async function signupAdmins() {
  console.log('🔐 Signing up admin users...\n');

  for (const user of adminUsers) {
    console.log(`Signing up: ${user.email}`);

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          name: user.name
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  ⚠️  User already exists`);
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
    } else if (data.user) {
      console.log(`  ✅ Signed up successfully!`);
      console.log(`     User ID: ${data.user.id}`);
    }
  }

  console.log('\n✅ Admin signup complete!');
  console.log('\nAdmin Credentials:');
  adminUsers.forEach(u => {
    console.log(`  ${u.email} / ${u.password}`);
  });
}

signupAdmins().catch(console.error);
