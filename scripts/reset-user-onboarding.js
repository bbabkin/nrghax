const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role
const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function resetUserOnboarding() {
  const userId = '22222222-2222-2222-2222-222222222222'; // user@test.com

  console.log('🔄 Resetting onboarding for user@test.com...\n');

  try {
    // Delete onboarding-sourced tags
    const { error: deleteTagsError } = await supabase
      .from('user_tags')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'onboarding');

    if (deleteTagsError) throw deleteTagsError;
    console.log('✓ Removed onboarding tags');

    // Delete onboarding responses
    const { error: deleteResponsesError } = await supabase
      .from('onboarding_responses')
      .delete()
      .eq('user_id', userId);

    if (deleteResponsesError) throw deleteResponsesError;
    console.log('✓ Removed onboarding responses');

    // Check remaining tags
    const { data: remainingTags } = await supabase
      .from('user_tags')
      .select(`
        *,
        tags (name, tag_type)
      `)
      .eq('user_id', userId);

    console.log('\n📌 Remaining tags for user@test.com:');
    if (remainingTags && remainingTags.length > 0) {
      remainingTags.forEach(ut => {
        console.log(`  - ${ut.tags.name} (source: ${ut.source})`);
      });
    } else {
      console.log('  No tags remaining');
    }

    console.log('\n✅ User is ready for fresh onboarding!');
    console.log('Visit http://localhost:3000/auth and login with:');
    console.log('  Email: user@test.com');
    console.log('  Password: test123');
    console.log('\nYou should be redirected to /onboarding');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetUserOnboarding();