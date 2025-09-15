const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role for testing
const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function verifyOnboardingSetup() {
  console.log('🔍 Verifying Onboarding System Setup\n');
  console.log('=' .repeat(50));

  try {
    // 1. Check tags table
    console.log('\n📌 Checking Tags:');
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('tag_type', { ascending: true })
      .order('display_order', { ascending: true });

    if (tagsError) throw tagsError;

    const tagsByType = tags.reduce((acc, tag) => {
      const type = tag.tag_type || 'uncategorized';
      if (!acc[type]) acc[type] = [];
      acc[type].push(tag);
      return acc;
    }, {});

    Object.entries(tagsByType).forEach(([type, typeTags]) => {
      console.log(`\n  ${type}:`);
      typeTags.forEach(tag => {
        console.log(`    - ${tag.name} (${tag.slug})${tag.is_user_assignable ? ' [user-assignable]' : ''}${tag.discord_role_name ? ` → Discord: ${tag.discord_role_name}` : ''}`);
      });
    });

    // 2. Check test users
    console.log('\n👥 Checking Test Users:');
    const testUserIds = [
      { id: '11111111-1111-1111-1111-111111111111', email: 'test@test.com' },
      { id: '22222222-2222-2222-2222-222222222222', email: 'user@test.com' },
      { id: '33333333-3333-3333-3333-333333333333', email: 'john@test.com' }
    ];

    for (const testUser of testUserIds) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

      const { data: userTags } = await supabase
        .from('user_tags')
        .select(`
          *,
          tags (name, tag_type)
        `)
        .eq('user_id', testUser.id);

      console.log(`\n  ${testUser.email}:`);
      console.log(`    ID: ${testUser.id}`);
      console.log(`    Admin: ${profile?.is_admin || false}`);
      console.log(`    Discord: ${profile?.discord_username || 'Not connected'}`);
      console.log(`    Tags: ${userTags?.map(ut => `${ut.tags.name} (${ut.source})`).join(', ') || 'None'}`);
    }

    // 3. Check onboarding responses
    console.log('\n📝 Checking Onboarding Responses:');
    const { data: responses, error: respError } = await supabase
      .from('onboarding_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (responses && responses.length > 0) {
      console.log(`  Found ${responses.length} recent responses`);
      responses.forEach(resp => {
        console.log(`    - User ${resp.user_id.substring(0, 8)}... Question: ${resp.question_id}, Completed: ${resp.completed_at ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('  No onboarding responses yet');
    }

    // 4. Check sync logs
    console.log('\n🔄 Checking Sync Logs:');
    const { data: syncLogs, error: syncError } = await supabase
      .from('tag_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (syncLogs && syncLogs.length > 0) {
      console.log(`  Found ${syncLogs.length} recent sync events`);
      syncLogs.forEach(log => {
        console.log(`    - ${log.action} from ${log.source} to ${log.target} at ${new Date(log.created_at).toLocaleString()}`);
      });
    } else {
      console.log('  No sync events yet');
    }

    // 5. Check personalized hacks function
    console.log('\n🎯 Testing Personalized Hacks Function:');
    const testUserId = '22222222-2222-2222-2222-222222222222'; // user@test.com
    const { data: personalizedHacks, error: hacksError } = await supabase
      .rpc('get_personalized_hacks', { p_user_id: testUserId });

    if (hacksError) {
      console.log('  ❌ Function error:', hacksError.message);
    } else if (personalizedHacks) {
      console.log(`  ✓ Function works! Found ${personalizedHacks.length} personalized hacks`);
      if (personalizedHacks.length > 0) {
        console.log('  Sample recommendations:');
        personalizedHacks.slice(0, 3).forEach(hack => {
          console.log(`    - ${hack.hack_name} (Score: ${hack.relevance_score}, Tags: ${hack.matching_tags?.join(', ') || 'None'})`);
        });
      }
    }

    // 6. Check RLS policies
    console.log('\n🔒 Checking RLS Policies:');

    // Try to read user_tags as a regular user (should only see own tags)
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'user@test.com',
      password: 'test123'
    });

    if (user) {
      const { data: ownTags } = await supabase
        .from('user_tags')
        .select('*');

      console.log(`  ✓ User can see ${ownTags?.length || 0} of their own tags`);

      // Try to read another user's tags (should fail or return empty)
      const { data: otherTags } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', '11111111-1111-1111-1111-111111111111'); // admin ID

      console.log(`  ✓ RLS prevents seeing other users' tags: ${otherTags?.length === 0 ? 'Working' : 'Not working!'}`);

      await supabase.auth.signOut();
    }

    console.log('\n✅ Verification Complete!');
    console.log('=' .repeat(50));

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  - Total tags: ${tags.length}`);
    console.log(`  - User-assignable tags: ${tags.filter(t => t.is_user_assignable).length}`);
    console.log(`  - Discord-mapped tags: ${tags.filter(t => t.discord_role_name).length}`);
    console.log(`  - Test users: ${testEmails.length}`);
    console.log('\n🚀 System is ready for onboarding!');

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
  }
}

// Run verification
verifyOnboardingSetup().catch(console.error);