const { createClient } = require('@supabase/supabase-js');

async function makeUserAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const emails = ['admin@test.com', 'bbabkin@gmail.com'];

  for (const email of emails) {
    try {
      // Get user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === email);

      if (user) {
        // Update profile to be admin
        const { error } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id);

        if (error) {
          console.error(`Error updating ${email}:`, error.message);
        } else {
          console.log(`✅ ${email} is now admin`);

          // Verify
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          console.log(`   Profile: ID=${user.id}, is_admin=${profile?.is_admin}`);
        }
      } else {
        console.log(`❌ User ${email} not found`);
      }
    } catch (error) {
      console.error(`Error processing ${email}:`, error.message);
    }
  }
}

makeUserAdmin().catch(console.error);