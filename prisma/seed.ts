import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Check if we should create auth users (skip if using production DB)
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

// Use production Supabase if available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🌱 Starting seed...')

  let testUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // Default ID
  let adminUserId = 'b2c3d4e5-f6a7-8901-bcde-f23456789012' // Default ID

  if (!SKIP_AUTH) {
    // Try to create test user in Supabase Auth
    console.log('Creating test user in Supabase Auth...')
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@test.com',
        password: 'test123',
        email_confirm: true
      })

      if (authError && !authError.message.includes('already been registered')) {
        console.warn('Could not create auth user, using default ID:', authError.message)
      } else if (authUser?.user) {
        testUserId = authUser.user.id
        console.log(`  Auth user created/found with ID: ${testUserId}`)
      } else {
        // User already exists, get their ID
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const testUser = existingUser?.users?.find(u => u.email === 'test@test.com')
        if (testUser) {
          testUserId = testUser.id
          console.log(`  Existing auth user found with ID: ${testUserId}`)
        }
      }
    } catch (e) {
      console.warn('Skipping auth user creation, using default ID')
    }
  } else {
    console.log('Skipping auth user creation (SKIP_AUTH=true)')
  }

  // Create profile - DELETE existing first to ensure correct ID
  console.log('Creating profile...')
  await prisma.profile.deleteMany({
    where: { email: 'test@test.com' }
  })
  await prisma.profile.create({
    data: {
      id: testUserId,
      email: 'test@test.com',
      fullName: 'Test User',
      isAdmin: false
    }
  })

  // Create admin user
  if (!SKIP_AUTH) {
    console.log('Creating admin user in Supabase Auth...')
    try {
      const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'admin123',
        email_confirm: true
      })
      if (adminError && !adminError.message.includes('already been registered')) {
        console.warn('Could not create admin auth user:', adminError.message)
      } else if (adminUser?.user) {
        adminUserId = adminUser.user.id
        console.log(`  Admin auth user created/found with ID: ${adminUserId}`)
      } else {
        // Admin already exists, get their ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const adminAuthUser = existingUsers?.users?.find(u => u.email === 'admin@test.com')
        if (adminAuthUser) {
          adminUserId = adminAuthUser.id
          console.log(`  Existing admin auth user found with ID: ${adminUserId}`)
        }
      }
    } catch (e) {
      console.warn('Could not create admin auth user, using default ID')
    }
  }

  console.log('Creating admin profile...')
  await prisma.profile.deleteMany({
    where: { email: 'admin@test.com' }
  })
  await prisma.profile.create({
    data: {
      id: adminUserId,
      email: 'admin@test.com',
      fullName: 'Admin User',
      isAdmin: true
    }
  })

  // Create tags
  console.log('Creating tags...')
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: { name: 'JavaScript', category: 'language', color: '#f7df1e' }
    }),
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: { name: 'TypeScript', category: 'language', color: '#3178c6' }
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', category: 'framework', color: '#61dafb' }
    }),
    prisma.tag.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', category: 'runtime', color: '#339933' }
    }),
    prisma.tag.upsert({
      where: { name: 'Beginner' },
      update: {},
      create: { name: 'Beginner', category: 'level', color: '#4caf50' }
    }),
    prisma.tag.upsert({
      where: { name: 'Intermediate' },
      update: {},
      create: { name: 'Intermediate', category: 'level', color: '#ff9800' }
    }),
    prisma.tag.upsert({
      where: { name: 'Advanced' },
      update: {},
      create: { name: 'Advanced', category: 'level', color: '#f44336' }
    })
  ])

  // Create hacks
  console.log('Creating hacks...')

  // Helper to create or get hack
  async function upsertHack(data: any) {
    const existing = await prisma.hack.findFirst({
      where: { name: data.name }
    })
    if (existing) return existing
    return prisma.hack.create({ data })
  }

  const hacks = await Promise.all([
    upsertHack({
        name: 'Learn JavaScript Basics',
        slug: 'learn-javascript-basics',
        description: 'Master the fundamentals of JavaScript programming',
        contentType: 'content',
        contentBody: `# JavaScript Basics

## Variables
Learn about let, const, and var

## Functions
Understanding function declarations and expressions

## Arrays and Objects
Working with data structures`
    }),
    upsertHack({
        name: 'Build Your First React App',
        slug: 'build-your-first-react-app',
        description: 'Create a todo application with React and hooks',
        contentType: 'content',
        contentBody: `# React Todo App

## Setup
1. Create React App
2. Install dependencies

## Components
- TodoList
- TodoItem
- AddTodo

## State Management
Using useState and useEffect hooks`
    }),
    upsertHack({
        name: 'TypeScript Deep Dive',
        slug: 'typescript-deep-dive',
        description: 'Advanced TypeScript patterns and best practices',
        contentType: 'link',
        externalLink: 'https://basarat.gitbook.io/typescript/'
    }),
    upsertHack({
        name: 'Node.js REST API',
        slug: 'nodejs-rest-api',
        description: 'Build a RESTful API with Express and PostgreSQL',
        contentType: 'content',
        contentBody: `# Building a REST API

## Setup Express
\`\`\`javascript
const express = require('express')
const app = express()
\`\`\`

## Routes
- GET /users
- POST /users
- PUT /users/:id
- DELETE /users/:id

## Database Integration
Using Prisma ORM for PostgreSQL`
    }),
    upsertHack({
        name: 'CSS Grid Layout',
        slug: 'css-grid-layout',
        description: 'Master modern CSS Grid techniques',
        contentType: 'content',
        contentBody: `# CSS Grid Layout

## Grid Container
\`\`\`css
.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
}
\`\`\`

## Grid Items
Positioning and spanning cells`
    })
  ])

  // Add hack tags
  console.log('Adding hack tags...')
  await Promise.all([
    // JavaScript basics - JavaScript, Beginner
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[0].id, tagId: tags[0].id }},
      update: {},
      create: { hackId: hacks[0].id, tagId: tags[0].id }
    }),
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[0].id, tagId: tags[4].id }},
      update: {},
      create: { hackId: hacks[0].id, tagId: tags[4].id }
    }),
    // React app - React, Intermediate
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[1].id, tagId: tags[2].id }},
      update: {},
      create: { hackId: hacks[1].id, tagId: tags[2].id }
    }),
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[1].id, tagId: tags[5].id }},
      update: {},
      create: { hackId: hacks[1].id, tagId: tags[5].id }
    }),
    // TypeScript - TypeScript, Advanced
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[2].id, tagId: tags[1].id }},
      update: {},
      create: { hackId: hacks[2].id, tagId: tags[1].id }
    }),
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[2].id, tagId: tags[6].id }},
      update: {},
      create: { hackId: hacks[2].id, tagId: tags[6].id }
    }),
    // Node.js API - Node.js, Intermediate
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[3].id, tagId: tags[3].id }},
      update: {},
      create: { hackId: hacks[3].id, tagId: tags[3].id }
    }),
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[3].id, tagId: tags[5].id }},
      update: {},
      create: { hackId: hacks[3].id, tagId: tags[5].id }
    }),
    // CSS Grid - Beginner
    prisma.hackTag.upsert({
      where: { hackId_tagId: { hackId: hacks[4].id, tagId: tags[4].id }},
      update: {},
      create: { hackId: hacks[4].id, tagId: tags[4].id }
    })
  ])

  // Create hack prerequisites (React requires JavaScript)
  const existingPrereq = await prisma.hackPrerequisite.findFirst({
    where: {
      hackId: hacks[1].id,
      prerequisiteHackId: hacks[0].id
    }
  })

  if (!existingPrereq) {
    await prisma.hackPrerequisite.create({
      data: {
        hackId: hacks[1].id, // React app
        prerequisiteHackId: hacks[0].id // JavaScript basics
      }
    })
  }


  // Add user interactions
  console.log('Adding user interactions...')

  // User likes some hacks
  await prisma.userHack.upsert({
    where: {
      userId_hackId: {
        userId: testUserId,
        hackId: hacks[0].id
      }
    },
    update: {
      status: 'liked'
    },
    create: {
      userId: testUserId,
      hackId: hacks[0].id,
      status: 'liked'
    }
  })

  await prisma.userHack.upsert({
    where: {
      userId_hackId: {
        userId: testUserId,
        hackId: hacks[1].id
      }
    },
    update: {
      status: 'visited',
      completedAt: new Date()
    },
    create: {
      userId: testUserId,
      hackId: hacks[1].id,
      status: 'visited',
      completedAt: new Date()
    }
  })

  // User has interests
  await prisma.userTag.upsert({
    where: {
      userId_tagId: {
        userId: testUserId,
        tagId: tags[0].id
      }
    },
    update: {},
    create: {
      userId: testUserId,
      tagId: tags[0].id // JavaScript
    }
  })

  await prisma.userTag.upsert({
    where: {
      userId_tagId: {
        userId: testUserId,
        tagId: tags[2].id
      }
    },
    update: {},
    create: {
      userId: testUserId,
      tagId: tags[2].id // React
    }
  })


  console.log('✅ Seed completed successfully!')
  console.log('\nTest accounts created:')
  console.log('  User: test@test.com / test123')
  console.log('  Admin: admin@test.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })