import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function createAdmin() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const email = 'admin@example.com';
  const password = 'admin123';

  console.log('Creating admin user...');

  // Create user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log('User already exists, attempting to reset password...');

      // Reset password for existing user
      const { data: resetData, error: resetError } = await supabase.auth.admin.updateUserById(
        authData?.user?.id || '',
        { password }
      );

      if (resetError) {
        console.error('Error resetting password:', resetError);
      } else {
        console.log('✅ Password reset successfully');
      }
    } else {
      console.error('Error creating user:', authError);
      return;
    }
  } else {
    console.log('✅ Admin user created successfully');
  }

  console.log('\n📧 Admin Credentials:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  console.log('\n🔗 Access the app at: http://localhost:3000');
}

createAdmin().then(() => process.exit(0));