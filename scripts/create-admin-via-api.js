#!/usr/bin/env node

/**
 * Create admin users via Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// For local development, use the default local service role key
const SERVICE_ROLE_KEY = process.env.LOCAL_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminUsers = [
  { email: 'admin@nrghax.com', password: 'AdminPass123!', name: 'Admin User' },
  { email: 'admin@test.com', password: 'Test123!', name: 'Test Admin' }
];

async function createAdmins() {
  console.log('Creating admin users via Supabase Admin API...\n');

  for (const user of adminUsers) {
    console.log(`Creating: ${user.email}`);

    // Create or update user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name
      }
    });

    if (error) {
      // If user exists, try to update password instead
      if (error.message.includes('already registered')) {
        console.log(`  - User exists, updating password...`);
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users?.find(u => u.email === user.email);

        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: user.password }
          );

          if (updateError) {
            console.error(`  ❌ Error updating password: ${updateError.message}`);
          } else {
            console.log(`  ✅ Updated password for ${existingUser.id}`);
          }
        }
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
    } else {
      console.log(`  ✅ Created user ${data.user.id}`);
    }
  }

  console.log('\n✅ Admin users created successfully!');
}

createAdmins().catch(console.error);
