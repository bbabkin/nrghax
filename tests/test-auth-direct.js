const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing authentication directly with Supabase...\n');

  try {
    // Try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user@nrghax.com',
      password: 'User123!@#'
    });

    if (error) {
      console.error('❌ Authentication failed:', error.message);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile) {
      console.log('\nProfile:');
      console.log('- Onboarded:', profile.onboarded || false);
      console.log('- Is Admin:', profile.is_admin || false);
    }

    // Check user tags
    const { data: userTags, error: tagsError } = await supabase
      .from('user_tags')
      .select(`
        *,
        tag:tags(*)
      `)
      .eq('user_id', data.user.id);

    if (userTags && userTags.length > 0) {
      console.log('\nUser Tags:');
      userTags.forEach(ut => {
        console.log(`- ${ut.tag.name} (source: ${ut.source})`);
      });
    } else {
      console.log('\nNo tags assigned to user');
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testAuth();