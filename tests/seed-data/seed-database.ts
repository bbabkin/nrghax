import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('Please ensure you have a .env.local file with the service role key');
  process.exit(1);
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data definitions
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    role: 'admin',
    metadata: {
      full_name: 'Test Admin',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      department: 'Engineering',
      permissions: ['users.read', 'users.write', 'users.delete', 'settings.write']
    }
  },
  {
    email: 'john.doe@test.com',
    password: 'User123!@#',
    role: 'user',
    metadata: {
      full_name: 'John Doe',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      preferences: { theme: 'light', notifications: true }
    }
  },
  {
    email: 'jane.smith@test.com',
    password: 'User123!@#',
    role: 'user',
    metadata: {
      full_name: 'Jane Smith',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      preferences: { theme: 'dark', notifications: false }
    }
  },
  {
    email: 'moderator@test.com',
    password: 'Mod123!@#',
    role: 'moderator',
    metadata: {
      full_name: 'Mike Moderator',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
      department: 'Support',
      permissions: ['users.read', 'content.moderate']
    }
  },
  {
    email: 'inactive@test.com',
    password: 'Inactive123!@#',
    role: 'user',
    metadata: {
      full_name: 'Inactive User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=inactive',
      status: 'inactive'
    }
  },
  {
    email: 'premium@test.com',
    password: 'Premium123!@#',
    role: 'user',
    metadata: {
      full_name: 'Premium User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=premium',
      subscription: 'premium',
      subscription_expires: '2025-12-31'
    }
  }
];

// Audit log entries for testing
const AUDIT_LOG_ENTRIES = [
  {
    action: 'user.login',
    details: { ip: '192.168.1.1', user_agent: 'Chrome/120.0' },
    severity: 'info'
  },
  {
    action: 'user.password_reset',
    details: { method: 'email' },
    severity: 'warning'
  },
  {
    action: 'admin.user_deleted',
    details: { deleted_user_id: 'deleted-user-123' },
    severity: 'critical'
  },
  {
    action: 'user.profile_updated',
    details: { fields_updated: ['full_name', 'avatar_url'] },
    severity: 'info'
  },
  {
    action: 'security.failed_login',
    details: { ip: '10.0.0.1', attempts: 3 },
    severity: 'warning'
  },
  {
    action: 'admin.settings_changed',
    details: { setting: 'registration_enabled', old_value: true, new_value: false },
    severity: 'warning'
  }
];

async function cleanDatabase() {
  console.log('🧹 Cleaning existing test data...');
  
  try {
    // Delete test users (this will cascade to related tables)
    const testEmails = TEST_USERS.map(u => u.email);
    
    // Delete from auth.users (if accessible)
    const { error: authError } = await supabase.auth.admin.deleteUser('*');
    if (authError && !authError.message.includes('not found')) {
      console.warn('Could not clean auth users:', authError.message);
    }
    
    // Delete from public.users table
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .in('email', testEmails);
    
    if (usersError) {
      console.warn('Could not clean users table:', usersError.message);
    }
    
    // Clean audit logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .like('user_email', '%@test.com');
    
    if (auditError) {
      console.warn('Could not clean audit logs:', auditError.message);
    }
    
    console.log('✅ Database cleaned');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

async function seedUsers() {
  console.log('👥 Seeding test users...');
  
  const createdUsers = [];
  
  for (const user of TEST_USERS) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata
      });
      
      if (authError) {
        console.error(`❌ Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }
      
      if (authData?.user) {
        // Insert/update user in public.users table with role
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: user.email,
            role: user.role,
            full_name: user.metadata.full_name,
            avatar_url: user.metadata.avatar_url,
            metadata: user.metadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (userError) {
          console.error(`❌ Failed to create user record for ${user.email}:`, userError.message);
        } else {
          console.log(`✅ Created user: ${user.email} (${user.role})`);
          createdUsers.push({
            id: authData.user.id,
            email: user.email,
            role: user.role
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }
  
  return createdUsers;
}

async function seedAuditLogs(users: any[]) {
  console.log('📝 Seeding audit logs...');
  
  const logs = [];
  
  for (const entry of AUDIT_LOG_ENTRIES) {
    // Assign random user to each log entry
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    const log = {
      user_id: randomUser.id,
      user_email: randomUser.email,
      action: entry.action,
      details: entry.details,
      severity: entry.severity,
      ip_address: entry.details.ip || '127.0.0.1',
      user_agent: entry.details.user_agent || 'Test Agent',
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Random time in last 7 days
    };
    
    logs.push(log);
  }
  
  // Insert audit logs
  const { error } = await supabase
    .from('audit_logs')
    .insert(logs);
  
  if (error) {
    console.error('❌ Failed to seed audit logs:', error.message);
  } else {
    console.log(`✅ Created ${logs.length} audit log entries`);
  }
}

async function seedTestData() {
  console.log('🌱 Starting database seeding...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // Clean existing test data
    await cleanDatabase();
    
    // Seed users
    const users = await seedUsers();
    
    // Seed audit logs if audit_logs table exists
    if (users.length > 0) {
      await seedAuditLogs(users);
    }
    
    // Save credentials to file for easy reference
    const credentials = TEST_USERS.map(u => ({
      email: u.email,
      password: u.password,
      role: u.role
    }));
    
    fs.writeFileSync(
      'tests/seed-data/test-credentials.json',
      JSON.stringify(credentials, null, 2)
    );
    
    console.log('\n✨ Database seeding complete!');
    console.log('📄 Test credentials saved to: tests/seed-data/test-credentials.json');
    console.log('\n🔑 Quick Reference:');
    console.log('  Admin: admin@test.com / Admin123!@#');
    console.log('  User: john.doe@test.com / User123!@#');
    console.log('  Moderator: moderator@test.com / Mod123!@#');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Add reset function for CI/CD
export async function resetTestDatabase() {
  console.log('🔄 Resetting test database...');
  await cleanDatabase();
  await seedTestData();
}

// Run if executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'clean':
      cleanDatabase().then(() => {
        console.log('✅ Database cleaned');
        process.exit(0);
      });
      break;
    
    case 'reset':
      resetTestDatabase().then(() => {
        process.exit(0);
      });
      break;
    
    default:
      seedTestData().then(() => {
        process.exit(0);
      });
  }
}

export { seedTestData, cleanDatabase, TEST_USERS };