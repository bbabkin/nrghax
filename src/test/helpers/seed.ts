import { createClient } from '@supabase/supabase-js'
import { UserFactory } from '../factories/user.factory'
import { HackFactory } from '../factories/hack.factory'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function getServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for seed operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface SeedData {
  users: Array<{ id: string; email: string }>
  hacks: Array<{ id: string; name: string }>
  profiles: Array<{ id: string }>
}

export async function seedDatabase(): Promise<SeedData> {
  const seedData: SeedData = {
    users: [],
    hacks: [],
    profiles: []
  }

  const serviceClient = getServiceClient()

  try {
    // Create test users
    const adminUser = UserFactory.createAdmin()
    const regularUser = UserFactory.create()

    // Create users via auth.admin
    const { data: adminAuth } = await serviceClient.auth.admin.createUser({
      email: adminUser.email,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: adminUser.full_name
      }
    })

    const { data: regularAuth } = await serviceClient.auth.admin.createUser({
      email: regularUser.email,
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: regularUser.full_name
      }
    })

    if (adminAuth?.user) {
      seedData.users.push({ id: adminAuth.user.id, email: adminUser.email })
      
      // Update admin profile
      await serviceClient
        .from('profiles')
        .update({ is_admin: true, full_name: adminUser.full_name })
        .eq('id', adminAuth.user.id)
      
      seedData.profiles.push({ id: adminAuth.user.id })
    }

    if (regularAuth?.user) {
      seedData.users.push({ id: regularAuth.user.id, email: regularUser.email })
      seedData.profiles.push({ id: regularAuth.user.id })
    }

    // Create test hacks
    const contentHack = HackFactory.createContentHack()
    const linkHack = HackFactory.createLinkHack()

    const { data: hacksData } = await serviceClient
      .from('hacks')
      .insert([
        {
          name: contentHack.name,
          description: contentHack.description,
          image_url: contentHack.image_url,
          content_type: contentHack.content_type,
          content_body: contentHack.content_body
        },
        {
          name: linkHack.name,
          description: linkHack.description,
          image_url: linkHack.image_url,
          content_type: linkHack.content_type,
          external_link: linkHack.external_link
        }
      ])
      .select()

    if (hacksData) {
      seedData.hacks = hacksData.map(h => ({ id: h.id, name: h.name }))
    }

    return seedData
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  }
}

export async function cleanupDatabase(seedData: SeedData) {
  const serviceClient = getServiceClient()
  
  try {
    // Delete hacks
    if (seedData.hacks.length > 0) {
      await serviceClient
        .from('hacks')
        .delete()
        .in('id', seedData.hacks.map(h => h.id))
    }

    // Delete users (this will cascade delete profiles)
    if (seedData.users.length > 0) {
      for (const user of seedData.users) {
        await serviceClient.auth.admin.deleteUser(user.id)
      }
    }
  } catch (error) {
    console.error('Error cleaning up database:', error)
    // Don't throw - cleanup errors shouldn't fail tests
  }
}

export async function createTestUser(overrides?: { email?: string; is_admin?: boolean }) {
  const serviceClient = getServiceClient()
  const user = UserFactory.create(overrides)
  
  const { data: authData, error } = await serviceClient.auth.admin.createUser({
    email: user.email,
    password: 'test123456',
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name
    }
  })

  if (error) throw error

  if (overrides?.is_admin && authData?.user) {
    await serviceClient
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', authData.user.id)
  }

  return authData?.user
}

export async function createTestHack(overrides?: Partial<ReturnType<typeof HackFactory.create>>) {
  const serviceClient = getServiceClient()
  const hack = HackFactory.create(overrides)
  
  const { data, error } = await serviceClient
    .from('hacks')
    .insert({
      name: hack.name,
      description: hack.description,
      image_url: hack.image_url,
      content_type: hack.content_type,
      content_body: hack.content_body,
      external_link: hack.external_link
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTestUser(userId: string) {
  const serviceClient = getServiceClient()
  await serviceClient.auth.admin.deleteUser(userId)
}

export async function deleteTestHack(hackId: string) {
  const serviceClient = getServiceClient()
  await serviceClient.from('hacks').delete().eq('id', hackId)
}