#!/usr/bin/env node

/**
 * Test script for level progression system
 * Run: node scripts/test-level-progression.js
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLevelProgression() {
  console.log('\n🧪 Testing Level Progression System\n')
  console.log('=' .repeat(50))

  try {
    // 1. Get all levels
    console.log('\n📊 Fetching all levels...')
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('*')
      .order('position')

    if (levelsError) {
      throw new Error(`Failed to fetch levels: ${levelsError.message}`)
    }

    console.log(`✅ Found ${levels.length} levels:`)
    levels.forEach(level => {
      console.log(`   - ${level.icon || '📦'} ${level.name} (${level.slug})`)
    })

    // 2. Check level prerequisites
    console.log('\n🔗 Checking level prerequisites...')
    const { data: prerequisites, error: prereqError } = await supabase
      .from('level_prerequisites')
      .select(`
        level_id,
        prerequisite_level_id,
        levels!level_prerequisites_level_id_fkey(name, slug),
        prerequisite:levels!level_prerequisites_prerequisite_level_id_fkey(name, slug)
      `)

    if (prereqError) {
      throw new Error(`Failed to fetch prerequisites: ${prereqError.message}`)
    }

    if (prerequisites.length === 0) {
      console.log('   ⚠️  No prerequisites found')
    } else {
      console.log(`✅ Found ${prerequisites.length} prerequisite relationships:`)
      prerequisites.forEach(prereq => {
        const levelName = prereq.levels?.name || 'Unknown'
        const prereqName = prereq.prerequisite?.name || 'Unknown'
        console.log(`   - ${levelName} requires → ${prereqName}`)
      })
    }

    // 3. Find Foundation level (should have no prerequisites)
    console.log('\n🏛️  Checking Foundation level...')
    const foundationLevel = levels.find(l => l.slug === 'foundation')

    if (foundationLevel) {
      const foundationPrereqs = prerequisites.filter(p => p.level_id === foundationLevel.id)
      if (foundationPrereqs.length === 0) {
        console.log('✅ Foundation level has no prerequisites (always unlocked)')
      } else {
        console.log('❌ Foundation level has prerequisites (should have none!)')
      }
    } else {
      console.log('⚠️  Foundation level not found')
    }

    // 4. Check hacks in Foundation level
    console.log('\n🎯 Checking hacks in Foundation level...')
    if (foundationLevel) {
      const { data: foundationHacks, error: hacksError } = await supabase
        .from('hacks')
        .select('id, name, slug, is_required, icon')
        .eq('level_id', foundationLevel.id)
        .order('position')

      if (hacksError) {
        throw new Error(`Failed to fetch hacks: ${hacksError.message}`)
      }

      console.log(`✅ Found ${foundationHacks.length} hacks in Foundation:`)
      foundationHacks.forEach(hack => {
        const icon = hack.icon || '📌'
        const required = hack.is_required ? '(Required)' : '(Optional)'
        console.log(`   - ${icon} ${hack.name} ${required}`)
      })

      // 5. Check hack prerequisites
      console.log('\n🔒 Checking hack prerequisites...')
      const hackIds = foundationHacks.map(h => h.id)
      const { data: hackPrereqs, error: hackPrereqError } = await supabase
        .from('hack_prerequisites')
        .select('hack_id, prerequisite_hack_id')
        .in('hack_id', hackIds)

      if (!hackPrereqError) {
        if (hackPrereqs.length === 0) {
          console.log('✅ No hack prerequisites in Foundation (all hacks unlocked)')
        } else {
          console.log(`⚠️  Found ${hackPrereqs.length} hack prerequisites in Foundation`)
        }
      }
    }

    // 6. Verify level dependency chain
    console.log('\n🔄 Verifying level dependency chain...')
    console.log('   Expected progression:')
    console.log('   1. Foundation (no prerequisites)')
    console.log('   2. Direction, Movement, Confidence (require Foundation)')
    console.log('   3. Mastery (requires Direction, Movement, Confidence)')

    // Find each level
    const directionLevel = levels.find(l => l.slug === 'direction')
    const movementLevel = levels.find(l => l.slug === 'movement')
    const confidenceLevel = levels.find(l => l.slug === 'confidence')
    const masteryLevel = levels.find(l => l.slug === 'mastery')

    // Check Direction prerequisites
    if (directionLevel) {
      const dirPrereqs = prerequisites.filter(p => p.level_id === directionLevel.id)
      const requiresFoundation = dirPrereqs.some(p => p.prerequisite_level_id === foundationLevel?.id)
      console.log(`   ${requiresFoundation ? '✅' : '❌'} Direction requires Foundation`)
    }

    // Check Movement prerequisites
    if (movementLevel) {
      const movPrereqs = prerequisites.filter(p => p.level_id === movementLevel.id)
      const requiresFoundation = movPrereqs.some(p => p.prerequisite_level_id === foundationLevel?.id)
      console.log(`   ${requiresFoundation ? '✅' : '❌'} Movement requires Foundation`)
    }

    // Check Confidence prerequisites
    if (confidenceLevel) {
      const confPrereqs = prerequisites.filter(p => p.level_id === confidenceLevel.id)
      const requiresFoundation = confPrereqs.some(p => p.prerequisite_level_id === foundationLevel?.id)
      console.log(`   ${requiresFoundation ? '✅' : '❌'} Confidence requires Foundation`)
    }

    // Check Mastery prerequisites
    if (masteryLevel) {
      const mastPrereqs = prerequisites.filter(p => p.level_id === masteryLevel.id)
      const requiresDirection = mastPrereqs.some(p => p.prerequisite_level_id === directionLevel?.id)
      const requiresMovement = mastPrereqs.some(p => p.prerequisite_level_id === movementLevel?.id)
      const requiresConfidence = mastPrereqs.some(p => p.prerequisite_level_id === confidenceLevel?.id)

      console.log(`   ${requiresDirection ? '✅' : '❌'} Mastery requires Direction`)
      console.log(`   ${requiresMovement ? '✅' : '❌'} Mastery requires Movement`)
      console.log(`   ${requiresConfidence ? '✅' : '❌'} Mastery requires Confidence`)
    }

    console.log('\n' + '=' .repeat(50))
    console.log('✅ Level progression test complete!\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testLevelProgression()