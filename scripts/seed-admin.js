#!/usr/bin/env node

/**
 * Seed script to create admin users for development
 * Uses environment variables for credentials
 * Run with: npm run seed:admin
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY not found in environment');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin users configuration (for development only)
const adminUsers = [
  {
    email: 'admin@nrghax.com',
    password: 'AdminPass123!',
    name: 'Admin User'
  },
  {
    email: 'admin@test.com',
    password: 'Test123!',
    name: 'Test Admin'
  }
];

async function seedAdminUsers() {
  console.log('🌱 Seeding Admin Users (Development Only)\n');
  console.log('=' .repeat(50));

  for (const user of adminUsers) {
    console.log(`\nProcessing: ${user.email}`);

    try {
      // Create user via admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  User already exists`);

          // Update password for existing user
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users?.users?.find(u => u.email === user.email);

          if (existingUser) {
            await supabase.auth.admin.updateUserById(existingUser.id, {
              password: user.password
            });
            console.log(`  ✅ Password updated`);
          }
        } else {
          console.error(`  ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ User created successfully`);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Admin Seeding Complete!\n');
  console.log('📋 Development Admin Credentials:\n');

  adminUsers.forEach(user => {
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}\n`);
  });

  console.log('⚠️  Note: These are development credentials only.');
  console.log('    Never use these in production!');
}

// Only run in development
if (process.env.NODE_ENV === 'production') {
  console.error('❌ This script should not be run in production!');
  process.exit(1);
}

seedAdminUsers().catch(console.error);