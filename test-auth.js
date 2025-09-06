const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  // Test signup
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (signUpError) {
    console.error('Signup error:', signUpError);
  } else {
    console.log('✅ Signup successful:', signUpData.user?.email);
  }

  // Test login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (signInError) {
    console.error('Login error:', signInError);
  } else {
    console.log('✅ Login successful:', signInData.user?.email);
    console.log('Session:', signInData.session ? 'Active' : 'None');
  }
}

testAuth();
