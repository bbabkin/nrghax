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

async function verifySeedData() {
  console.log('🔍 Verifying Seeded Data...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('=====================================\n');

  // Check Tags
  console.log('📌 TAGS:');
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (tagsError) {
    console.error('Error fetching tags:', tagsError);
  } else {
    console.log(`Found ${tags.length} tags:`);
    tags.forEach(tag => {
      console.log(`  - ${tag.name} (${tag.category}) ${tag.color}`);
    });
  }

  // Check Hacks
  console.log('\n⚡ HACKS:');
  const { data: hacks, error: hacksError } = await supabase
    .from('hacks')
    .select('*')
    .order('name');

  if (hacksError) {
    console.error('Error fetching hacks:', hacksError);
  } else {
    console.log(`Found ${hacks.length} hacks:`);
    hacks.forEach(hack => {
      console.log(`  - ${hack.name}`);
      console.log(`    Category: ${hack.category || 'none'}`);
      console.log(`    Difficulty: ${hack.difficulty}`);
      console.log(`    Duration: ${hack.time_minutes} minutes`);
      console.log(`    Description: ${hack.description}`);
      console.log('');
    });
  }

  // Check Profiles
  console.log('\n👤 PROFILES:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`  - ${profile.display_name || profile.email || 'Unknown'}`);
      console.log(`    Admin: ${profile.is_admin}`);
      console.log(`    Bio: ${profile.bio || 'No bio'}`);
      console.log('');
    });
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('=====================================');
  console.log(`✅ Tags: ${tags?.length || 0}`);
  console.log(`✅ Hacks: ${hacks?.length || 0}`);
  console.log(`✅ Profiles: ${profiles?.length || 0}`);

  // Test public access to hacks
  console.log('\n🌐 PUBLIC ACCESS TEST:');
  const { data: publicHacks, error: publicError } = await supabase
    .from('hacks')
    .select('name, description, category')
    .limit(3);

  if (publicError) {
    console.error('❌ Cannot access hacks publicly:', publicError.message);
  } else {
    console.log('✅ Public access to hacks works!');
    console.log(`   Retrieved ${publicHacks.length} hacks without authentication`);
  }

  console.log('\n✨ Seed verification complete!');
  console.log('\n📝 To create users, use the auth page:');
  console.log('   http://localhost:3000/auth');
  console.log('\n   Or create them manually through Supabase Studio:');
  console.log('   http://localhost:54323');
}

verifySeedData().catch(console.error);