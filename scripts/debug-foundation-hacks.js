/**
 * Debug script to check Foundation level hack data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugFoundationHacks() {
  console.log('🔍 Debugging Foundation Level Hacks\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Get Foundation level
    console.log('1. Fetching Foundation level...');
    const { data: level, error: levelError } = await supabase
      .from('levels')
      .select('*')
      .eq('slug', 'foundation')
      .single();

    if (levelError) {
      console.error('❌ Error fetching level:', levelError);
      return;
    }

    console.log('✅ Found Foundation level:');
    console.log(`   - ID: ${level.id}`);
    console.log(`   - Name: ${level.name}`);
    console.log(`   - Icon: ${level.icon}\n`);

    // Get hacks for Foundation level
    console.log('2. Fetching hacks for Foundation level...');
    const { data: hacks, error: hacksError } = await supabase
      .from('hacks')
      .select('*')
      .eq('level_id', level.id)
      .order('position', { ascending: true });

    if (hacksError) {
      console.error('❌ Error fetching hacks:', hacksError);
      return;
    }

    console.log(`✅ Found ${hacks.length} hacks in Foundation level:\n`);

    // Display each hack
    hacks.forEach((hack, index) => {
      console.log(`   ${index + 1}. ${hack.name} (${hack.slug})`);
      console.log(`      - Icon: ${hack.icon || '❓'}`);
      console.log(`      - Required: ${hack.is_required ? 'Yes' : 'No'}`);
      console.log(`      - Position: ${hack.position}`);
      console.log(`      - ID: ${hack.id}`);
    });

    // Get prerequisites for these hacks
    console.log('\n3. Fetching prerequisites for Foundation hacks...');
    const hackIds = hacks.map(h => h.id);
    const { data: prerequisites, error: prereqError } = await supabase
      .from('hack_prerequisites')
      .select('*')
      .in('hack_id', hackIds);

    if (prereqError) {
      console.error('❌ Error fetching prerequisites:', prereqError);
      return;
    }

    console.log(`✅ Found ${prerequisites.length} prerequisite relationships:\n`);

    // Map prerequisites
    const prereqMap = {};
    prerequisites.forEach(p => {
      if (!prereqMap[p.hack_id]) {
        prereqMap[p.hack_id] = [];
      }
      prereqMap[p.hack_id].push(p.prerequisite_hack_id);
    });

    // Identify entry points (hacks with no prerequisites)
    console.log('4. Analyzing hack prerequisites:\n');
    const entryPoints = [];
    const lockedHacks = [];

    hacks.forEach(hack => {
      const prereqs = prereqMap[hack.id] || [];
      if (prereqs.length === 0) {
        entryPoints.push(hack);
        console.log(`   ✅ ${hack.name}: NO prerequisites (ENTRY POINT)`);
      } else {
        lockedHacks.push(hack);
        console.log(`   🔒 ${hack.name}: ${prereqs.length} prerequisite(s)`);
        // Find prerequisite names
        prereqs.forEach(prereqId => {
          const prereqHack = hacks.find(h => h.id === prereqId);
          if (prereqHack) {
            console.log(`      → Requires: ${prereqHack.name}`);
          } else {
            console.log(`      → Requires: hack ID ${prereqId} (not in Foundation level)`);
          }
        });
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY:\n');
    console.log(`   Total hacks: ${hacks.length}`);
    console.log(`   Entry points (unlocked): ${entryPoints.length}`);
    console.log(`   Locked hacks: ${lockedHacks.length}\n`);

    if (entryPoints.length === 0) {
      console.log('⚠️ WARNING: No entry points found!');
      console.log('   All hacks have prerequisites, creating a circular dependency.');
      console.log('   This needs to be fixed in the database migrations.\n');
    } else {
      console.log('✅ Entry point hacks (should be unlocked):');
      entryPoints.forEach(hack => {
        console.log(`   - ${hack.name} (${hack.slug})`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugFoundationHacks();