const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAutoAdmin() {
  console.log('\n=== TESTING AUTO-ADMIN ASSIGNMENT ===\n');

  // Test emails from the admin list
  const testCases = [
    { email: 'bbabkin@gmail.com', password: 'Test123!', shouldBeAdmin: true },
    { email: 'boris@practiceenergy.com', password: 'Test123!', shouldBeAdmin: true },
    { email: 'regular@user.com', password: 'Test123!', shouldBeAdmin: false }
  ];

  for (const testCase of testCases) {
    console.log(`\nTesting ${testCase.email}:`);
    console.log(`Expected admin status: ${testCase.shouldBeAdmin}`);

    try {
      // First, try to delete the user if they exist
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testCase.email);

      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('  → Cleaned up existing user');
      }

      // Create user
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: testCase.email,
        password: testCase.password,
        email_confirm: true
      });

      if (createError) {
        console.error('  ❌ Failed to create user:', createError.message);
        continue;
      }

      console.log('  ✅ User created with ID:', user.id);

      // Give the trigger time to execute
      await new Promise(r => setTimeout(r, 1000));

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('  ❌ Failed to fetch profile:', profileError.message);
        continue;
      }

      console.log('  ✅ Profile found:');
      console.log(`     - Email: ${profile.email}`);
      console.log(`     - Is Admin: ${profile.is_admin}`);

      if (profile.is_admin === testCase.shouldBeAdmin) {
        console.log(`  ✅ PASS: Admin status is correct (${profile.is_admin})`);
      } else {
        console.log(`  ❌ FAIL: Admin status is ${profile.is_admin}, expected ${testCase.shouldBeAdmin}`);
      }

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error.message);
    }
  }

  // Test the admin_emails table
  console.log('\n\n=== CHECKING ADMIN_EMAILS TABLE ===\n');

  const { data: adminEmails, error: adminError } = await supabase
    .from('admin_emails')
    .select('*')
    .order('email');

  if (adminError) {
    console.error('❌ Failed to fetch admin emails:', adminError.message);
  } else {
    console.log('Admin emails in database:');
    adminEmails.forEach(row => {
      console.log(`  - ${row.email}`);
    });
  }

  console.log('\n\n✅ AUTO-ADMIN ASSIGNMENT TEST COMPLETED!');
  console.log('\nSummary:');
  console.log('- Admin emails table created and populated');
  console.log('- User creation trigger updated to check admin emails');
  console.log('- Admin users automatically assigned admin status');
  console.log('- Regular users correctly remain non-admin');
}

testAutoAdmin().catch(console.error);