#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
// Use the secret key from supabase status output
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestUser {
  email: string
  password: string
  name: string
  isAdmin: boolean
}

const testUsers: TestUser[] = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin User',
    isAdmin: true
  },
  {
    email: 'user1@test.com',
    password: 'User123!',
    name: 'John Doe',
    isAdmin: false
  },
  {
    email: 'user2@test.com',
    password: 'User123!',
    name: 'Jane Smith',
    isAdmin: false
  }
]

async function seedTestUsers() {
  console.log('🚀 Starting test user seeding...')
  console.log(`📍 Using Supabase URL: ${supabaseUrl}`)

  const createdUsers: any[] = []

  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some((u: any) => u.email === testUser.email)

      if (userExists) {
        console.log(`⚠️  User ${testUser.email} already exists, skipping...`)
        const existingUser = existingUsers?.users?.find((u: any) => u.email === testUser.email)
        if (existingUser) {
          createdUsers.push(existingUser)
        }
        continue
      }

      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          name: testUser.name
        }
      })

      if (authError) {
        console.error(`❌ Failed to create user ${testUser.email}:`, authError)
        continue
      }

      if (!authData.user) {
        console.error(`❌ No user data returned for ${testUser.email}`)
        continue
      }

      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: testUser.email,
          name: testUser.name,
          is_admin: testUser.isAdmin
        })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${testUser.email}:`, profileError)
        continue
      }

      console.log(`✅ Created ${testUser.isAdmin ? 'admin' : 'user'}: ${testUser.email}`)
      createdUsers.push(authData.user)
    } catch (error) {
      console.error(`❌ Error creating user ${testUser.email}:`, error)
    }
  }

  // Add sample data for the first regular user
  if (createdUsers.length > 0) {
    const regularUser = createdUsers.find(u => u.email === 'user1@test.com')
    if (regularUser) {
      await addSampleInteractions(regularUser.id)
    }

    const adminUser = createdUsers.find(u => u.email === 'admin@test.com')
    if (adminUser) {
      await createSampleRoutines(adminUser.id)
    }
  }

  console.log('\n📋 Test Users Summary:')
  console.log('========================')
  for (const user of testUsers) {
    console.log(`
${user.isAdmin ? '👑' : '👤'} ${user.name}
   Email: ${user.email}
   Password: ${user.password}
   Role: ${user.isAdmin ? 'Admin' : 'Regular User'}`)
  }

  console.log('\n✨ Test users created successfully!')
  console.log('\n🎯 Next steps:')
  console.log('1. Start your development server: npm run dev')
  console.log('2. Visit http://localhost:3000')
  console.log('3. Sign in with one of the test accounts above')
  console.log('4. Test the following flows:')
  console.log('   - Hack creation and editing (admin only)')
  console.log('   - Adding hacks to routines')
  console.log('   - Viewing and starting routines')
  console.log('   - Completing hacks and tracking progress')
  console.log('   - Commenting on hacks and routines')
  console.log('   - Viewing user history')
}

async function addSampleInteractions(userId: string) {
  console.log('\n📊 Adding sample interactions for user1...')

  try {
    // Get some existing hacks
    const { data: hacks } = await supabase
      .from('hacks')
      .select('id')
      .limit(5)

    if (hacks && hacks.length > 0) {
      // Like some hacks
      for (let i = 0; i < Math.min(3, hacks.length); i++) {
        await supabase
          .from('hack_likes')
          .upsert({
            hack_id: hacks[i].id,
            user_id: userId
          })
      }
      console.log('  ✅ Added hack likes')

      // Complete some hacks
      for (let i = 0; i < Math.min(2, hacks.length); i++) {
        await supabase
          .from('hack_completions')
          .upsert({
            hack_id: hacks[i].id,
            user_id: userId
          })
      }
      console.log('  ✅ Added hack completions')

      // Add a comment
      if (hacks[0]) {
        await supabase
          .from('comments')
          .insert({
            content: 'This hack really helped me improve my productivity!',
            entity_type: 'hack',
            entity_id: hacks[0].id,
            user_id: userId
          })
        console.log('  ✅ Added sample comment')
      }
    }

    // Create a personal routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        name: 'My Personal Morning Routine',
        slug: `personal-routine-${Date.now()}`,
        description: 'My customized morning routine for maximum productivity',
        created_by: userId,
        is_public: false,
        position: 0
      })
      .select()
      .single()

    if (routine && hacks && hacks.length > 0) {
      // Add hacks to the routine
      for (let i = 0; i < Math.min(3, hacks.length); i++) {
        await supabase
          .from('routine_hacks')
          .insert({
            routine_id: routine.id,
            hack_id: hacks[i].id,
            position: i
          })
      }
      console.log('  ✅ Created personal routine with hacks')
    }

    if (routineError) {
      console.error('  ⚠️  Failed to create personal routine:', routineError)
    }

  } catch (error) {
    console.error('  ⚠️  Error adding sample interactions:', error)
  }
}

async function createSampleRoutines(adminUserId: string) {
  console.log('\n📚 Creating sample routines by admin...')

  try {
    const routines = [
      {
        name: 'Ultimate Productivity Booster',
        slug: `productivity-booster-${Date.now()}`,
        description: 'A comprehensive routine to maximize your daily productivity',
        is_public: true
      },
      {
        name: 'Evening Wind-Down',
        slug: `evening-winddown-${Date.now()}`,
        description: 'Perfect routine to relax and prepare for a good night sleep',
        is_public: true
      },
      {
        name: 'Quick Energy Burst',
        slug: `energy-burst-${Date.now()}`,
        description: '5-minute routine to boost your energy levels instantly',
        is_public: true
      }
    ]

    // Get some hacks to add to routines
    const { data: hacks } = await supabase
      .from('hacks')
      .select('id')
      .limit(10)

    for (const [index, routineData] of routines.entries()) {
      const { data: routine, error } = await supabase
        .from('routines')
        .insert({
          ...routineData,
          created_by: adminUserId,
          position: index
        })
        .select()
        .single()

      if (routine && hacks && hacks.length > 0) {
        // Add 3-4 hacks to each routine
        const numHacks = 3 + Math.floor(Math.random() * 2)
        for (let i = 0; i < Math.min(numHacks, hacks.length); i++) {
          const hackIndex = (index * 3 + i) % hacks.length
          await supabase
            .from('routine_hacks')
            .insert({
              routine_id: routine.id,
              hack_id: hacks[hackIndex].id,
              position: i
            })
        }
      }

      if (error) {
        console.error(`  ⚠️  Failed to create routine ${routineData.name}:`, error)
      } else {
        console.log(`  ✅ Created public routine: ${routineData.name}`)
      }
    }

  } catch (error) {
    console.error('  ⚠️  Error creating sample routines:', error)
  }
}

// Run the seeding
seedTestUsers().catch(console.error)