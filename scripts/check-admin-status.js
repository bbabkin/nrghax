// Script to check admin status in production
// Run with: node scripts/check-admin-status.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.production.local');
  process.exit(1);
}

console.log('🔍 Checking admin status in production...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus() {
  try {
    // Get all users with their admin status
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No users found in the profiles table');
      return;
    }

    console.log(`\n📊 Found ${profiles.length} user(s):\n`);

    profiles.forEach((profile, index) => {
      const adminStatus = profile.is_admin ? '✅ ADMIN' : '❌ NOT ADMIN';
      const isFirst = index === 0 ? ' (First User)' : '';

      console.log(`${index + 1}. ${profile.email}${isFirst}`);
      console.log(`   Name: ${profile.full_name || 'Not set'}`);
      console.log(`   Status: ${adminStatus}`);
      console.log(`   Created: ${new Date(profile.created_at).toLocaleString()}`);
      console.log(`   ID: ${profile.id}`);
      console.log('');
    });

    // Check specifically for bbabkin@gmail.com
    const targetUser = profiles.find(p => p.email === 'bbabkin@gmail.com');
    if (targetUser) {
      console.log('🎯 Target user bbabkin@gmail.com:');
      console.log(`   Admin status: ${targetUser.is_admin ? '✅ YES' : '❌ NO'}`);

      if (!targetUser.is_admin) {
        console.log('\n⚠️  User is NOT admin. To fix this:');
        console.log('   1. Go to Supabase Dashboard > Table Editor > profiles');
        console.log('   2. Find bbabkin@gmail.com');
        console.log('   3. Set is_admin to true');
        console.log('   4. Save changes');
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkAdminStatus();