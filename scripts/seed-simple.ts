import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Simple test users
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    name: 'Test Admin',
    role: 'admin'
  },
  {
    email: 'user1@test.com', 
    password: 'User123!@#',
    name: 'Test User One',
    role: 'user'
  },
  {
    email: 'user2@test.com',
    password: 'User123!@#', 
    name: 'Test User Two',
    role: 'user'
  }
];

async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  for (const user of TEST_USERS) {
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
        console.error(`❌ Failed to create auth user ${user.email}:`, authError);
        continue;
      }
      
      if (authData?.user) {
        // Update role in users table
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: user.role,
            name: user.name
          })
          .eq('id', authData.user.id);
          
        if (updateError) {
          console.error(`❌ Failed to update role for ${user.email}:`, updateError);
        } else {
          console.log(`✅ Created ${user.role}: ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error);
    }
  }
  
  console.log('\n🔑 Test Credentials:');
  console.log('  Admin: admin@test.com / Admin123!@#');
  console.log('  User1: user1@test.com / User123!@#'); 
  console.log('  User2: user2@test.com / User123!@#');
}

seedUsers().then(() => {
  console.log('✨ Seeding complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});