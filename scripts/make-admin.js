const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function makeAdmin(email) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Making ${email} an admin...`);

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('email', email)
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Successfully updated user to admin:');
  console.log('  ID:', data.id);
  console.log('  Email:', data.email);
  console.log('  Name:', data.name);
  console.log('  Admin:', data.is_admin);
}

makeAdmin('bbabkin@gmail.com').then(() => process.exit(0));