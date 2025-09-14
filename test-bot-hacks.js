// Test script to verify the bot can fetch hacks from Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testHackList() {
  console.log('🤖 Simulating Discord bot /hack list command\n');
  console.log('Fetching all hacks from Supabase...\n');

  try {
    // This is exactly what the bot does in hackRepository.getAllHacks()
    const { data, error } = await supabase
      .from('hacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching hacks:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 No hacks found in database');
      console.log('The bot would display: "No Hacks Available - Check back soon!"');
      return;
    }

    console.log(`✅ Found ${data.length} hack(s) in database!\n`);
    console.log('The bot would display these in Discord:\n');
    console.log('═══════════════════════════════════════════');

    data.forEach((hack, index) => {
      console.log(`\n📌 Hack ${index + 1}:`);
      console.log(`   ID: ${hack.id}`);
      console.log(`   Name: ${hack.name}`);
      console.log(`   Description: ${hack.description?.substring(0, 100)}...`);
      console.log(`   Type: ${hack.content_type}`);
      if (hack.external_link) {
        console.log(`   Link: ${hack.external_link}`);
      }
      console.log(`   Created: ${new Date(hack.created_at).toLocaleDateString()}`);
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('\n✨ In Discord, these would appear as interactive embeds');
    console.log('   with buttons for navigation and viewing details!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Also test if we have any test data
async function checkTestData() {
  console.log('\n\n📊 Checking for seeded test data...\n');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*');

  if (profiles && profiles.length > 0) {
    console.log(`✅ Found ${profiles.length} user profile(s)`);
    profiles.forEach(p => {
      console.log(`   - ${p.full_name || p.email || p.id}`);
    });
  }
}

testHackList().then(() => checkTestData());