import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testApp() {
  console.log('🔍 Testing NRGHax Application...\n');
  console.log('Supabase URL:', supabaseUrl);

  // Test 1: Check if we can connect to Supabase
  console.log('\n1. Testing Supabase Connection...');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('count');

    if (error) {
      console.error('❌ Error connecting to profiles table:', error);
    } else {
      console.log('✅ Connected to Supabase successfully');
      console.log(`   Found ${profiles?.length || 0} profiles`);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }

  // Test 2: Create a test user
  console.log('\n2. Creating Test User...');
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';

  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️  Test user already exists, attempting sign in...');

        // Try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signIn({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.error('❌ Error signing in:', signInError);
        } else {
          console.log('✅ Successfully signed in existing user');
        }
      } else {
        console.error('❌ Error creating user:', signUpError);
      }
    } else {
      console.log('✅ Test user created successfully:', signUpData.user?.email);
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
  }

  // Test 3: Create an admin user
  console.log('\n3. Creating Admin User...');
  const adminEmail = 'admin@example.com';
  const adminPassword = 'AdminPassword123!';

  try {
    const { data: adminSignUpData, error: adminSignUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
    });

    if (adminSignUpError) {
      if (adminSignUpError.message.includes('already registered')) {
        console.log('ℹ️  Admin user already exists');
      } else {
        console.error('❌ Error creating admin:', adminSignUpError);
      }
    } else {
      console.log('✅ Admin user created successfully:', adminSignUpData.user?.email);

      // Note: To make this user an admin, you'd need to update the profile
      // This requires service role key or manual database update
      console.log('   Note: Update is_admin flag in database for full admin access');
    }
  } catch (error) {
    console.error('❌ Admin creation error:', error);
  }

  // Test 4: Check public data access
  console.log('\n4. Testing Public Data Access...');
  try {
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('id, title, difficulty')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching hacks:', error);
    } else {
      console.log('✅ Successfully fetched public hacks:');
      if (hacks && hacks.length > 0) {
        hacks.forEach(hack => {
          console.log(`   - ${hack.title} (${hack.difficulty})`);
        });
      } else {
        console.log('   No hacks found in database');
      }
    }
  } catch (error) {
    console.error('❌ Data access error:', error);
  }

  console.log('\n✨ Test Summary:');
  console.log('- Dev server: http://localhost:3000');
  console.log('- Auth page: http://localhost:3000/auth');
  console.log('- Dashboard: http://localhost:3000/dashboard');
  console.log('- Admin panel: http://localhost:3000/admin/users');
  console.log('\nTest accounts:');
  console.log(`- User: ${testEmail} / ${testPassword}`);
  console.log(`- Admin: ${adminEmail} / ${adminPassword} (needs is_admin flag set)`);

  process.exit(0);
}

testApp().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});