#!/usr/bin/env node

/**
 * Test admin login functionality
 * Run with: node scripts/test-admin-login.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Use public anon key for testing login (not service role)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test credentials
const adminCredentials = [
  { email: 'admin@nrghax.com', password: 'AdminPass123!', name: 'Primary Admin' },
  { email: 'admin@test.com', password: 'Test123!', name: 'Test Admin' }
];

async function testLogin() {
  console.log('🔐 Testing Admin Authentication\n');
  console.log('=' .repeat(50));

  for (const creds of adminCredentials) {
    console.log(`\n📧 Testing: ${creds.email}`);
    console.log(`   Password: ${creds.password}`);

    try {
      // Test sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password
      });

      if (error) {
        console.error(`   ❌ Login failed: ${error.message}`);
      } else if (data.user) {
        console.log(`   ✅ Login successful!`);
        console.log(`   User ID: ${data.user.id}`);

        // Check admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, name')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          console.log(`   Name: ${profile.name}`);
          console.log(`   Admin: ${profile.is_admin ? '✅ Yes' : '❌ No'}`);
        }

        // Sign out for next test
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Testing Complete!\n');
  console.log('Admin Credentials for Development:\n');
  adminCredentials.forEach(cred => {
    console.log(`  ${cred.name}:`);
    console.log(`    Email: ${cred.email}`);
    console.log(`    Password: ${cred.password}\n`);
  });
  console.log('Login URL: http://localhost:3000/auth');
}

testLogin().catch(console.error);