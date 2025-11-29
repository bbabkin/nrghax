#!/usr/bin/env node

/**
 * Quick Admin Flow Test Script
 * Tests admin signup and basic functionality
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('\n🧪 NRGHax Admin Flow Test\n')
console.log('=' .repeat(50))

async function testAdminEmails() {
  console.log('\n📧 Step 1: Checking admin emails configuration...')

  const { data, error } = await supabase
    .from('admin_emails')
    .select('*')

  if (error) {
    console.error('❌ Error fetching admin emails:', error.message)
    return false
  }

  console.log(`✅ Found ${data.length} auto-admin emails:`)
  data.forEach(row => console.log(`   - ${row.email}`))

  return true
}

async function testExistingProfiles() {
  console.log('\n👥 Step 2: Checking existing user profiles...')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, is_admin, name')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error fetching profiles:', error.message)
    return false
  }

  console.log(`✅ Found ${data.length} user profiles:`)
  data.forEach(profile => {
    const adminBadge = profile.is_admin ? '🔐 ADMIN' : '👤 USER'
    console.log(`   ${adminBadge} ${profile.email} (${profile.name || 'no name'})`)
  })

  const adminCount = data.filter(p => p.is_admin).length
  console.log(`\n   Total admins: ${adminCount}/${data.length}`)

  return true
}

async function testHacks() {
  console.log('\n🎯 Step 3: Checking hacks...')

  const { data, error, count } = await supabase
    .from('hacks')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching hacks:', error.message)
    return false
  }

  console.log(`✅ Found ${count} total hacks, showing first ${data.length}:`)
  data.forEach(hack => {
    console.log(`   - ${hack.name} (Level: ${hack.level_id || 'none'})`)
  })

  return true
}

async function testRoutines() {
  console.log('\n📅 Step 4: Checking routines...')

  const { data, error, count } = await supabase
    .from('routines')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching routines:', error.message)
    return false
  }

  console.log(`✅ Found ${count} total routines, showing first ${data.length}:`)
  data.forEach(routine => {
    console.log(`   - ${routine.name}`)
  })

  return true
}

async function testTags() {
  console.log('\n🏷️  Step 5: Checking tags...')

  const { data, error, count } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching tags:', error.message)
    return false
  }

  console.log(`✅ Found ${count} total tags, showing first ${data.length}:`)
  data.forEach(tag => {
    console.log(`   - ${tag.name}`)
  })

  return true
}

async function testLevels() {
  console.log('\n📊 Step 6: Checking levels...')

  const { data, error, count } = await supabase
    .from('levels')
    .select('*', { count: 'exact', head: false })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching levels:', error.message)
    return false
  }

  console.log(`✅ Found ${count} total levels:`)
  data.forEach(level => {
    console.log(`   - ${level.name} (${level.slug})`)
  })

  return true
}

async function runTests() {
  const results = []

  results.push(await testAdminEmails())
  results.push(await testExistingProfiles())
  results.push(await testHacks())
  results.push(await testRoutines())
  results.push(await testTags())
  results.push(await testLevels())

  console.log('\n' + '='.repeat(50))
  console.log('\n📊 Test Summary:')
  const passed = results.filter(r => r).length
  const total = results.length

  if (passed === total) {
    console.log(`✅ All ${total} tests passed!`)
  } else {
    console.log(`⚠️  ${passed}/${total} tests passed`)
  }

  console.log('\n💡 Next steps:')
  console.log('   1. Open http://localhost:3000/auth in your browser')
  console.log('   2. Sign up with one of the auto-admin emails:')
  console.log('      - bbabkin@gmail.com')
  console.log('      - admin@test.com')
  console.log('   3. Use password: test1234')
  console.log('   4. After signup, navigate to http://localhost:3000/admin')
  console.log('   5. Test creating/editing hacks, routines, tags, and levels')
  console.log('\n')
}

runTests().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
