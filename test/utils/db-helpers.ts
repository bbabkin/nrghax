import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

/**
 * Create a test hack
 */
export async function createTestHack(
  supabase: SupabaseClient<Database>,
  hack: Partial<Tables['hacks']['Insert']>
): Promise<Tables['hacks']['Row']> {
  const { data, error } = await supabase
    .from('hacks')
    .insert({
      name: hack.name || `Test Hack ${Date.now()}`,
      slug: hack.slug || `test-hack-${Date.now()}`,
      description: hack.description || 'Test hack description',
      content_type: hack.content_type || 'content',
      content_body: hack.content_body || 'Test content',
      difficulty: hack.difficulty || 'Beginner',
      time_minutes: hack.time_minutes || 5,
      category: hack.category || 'productivity',
      ...hack
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create a test routine
 */
export async function createTestRoutine(
  supabase: SupabaseClient<Database>,
  userId: string,
  routine: Partial<Tables['routines']['Insert']>
): Promise<Tables['routines']['Row']> {
  const { data, error } = await supabase
    .from('routines')
    .insert({
      name: routine.name || `Test Routine ${Date.now()}`,
      slug: routine.slug || `test-routine-${Date.now()}`,
      description: routine.description || 'Test routine description',
      created_by: userId,
      is_public: routine.is_public !== undefined ? routine.is_public : true,
      position: routine.position || 0,
      ...routine
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Add hack to routine
 */
export async function addHackToRoutine(
  supabase: SupabaseClient<Database>,
  routineId: string,
  hackId: string,
  position: number = 0
) {
  const { error } = await supabase
    .from('routine_hacks')
    .insert({
      routine_id: routineId,
      hack_id: hackId,
      position
    })

  if (error) throw error
}

/**
 * Create a test tag
 */
export async function createTestTag(
  supabase: SupabaseClient<Database>,
  tag: Partial<Tables['tags']['Insert']>
): Promise<Tables['tags']['Row']> {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: tag.name || `Test Tag ${Date.now()}`,
      slug: tag.slug || `test-tag-${Date.now()}`,
      tag_type: tag.tag_type || 'content',
      description: tag.description || 'Test tag description',
      category: tag.category || 'Test',
      color: tag.color || '#000000',
      ...tag
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Like a hack
 */
export async function likeHack(
  supabase: SupabaseClient<Database>,
  hackId: string,
  userId: string
) {
  const { error } = await supabase
    .from('hack_likes')
    .insert({
      hack_id: hackId,
      user_id: userId
    })

  if (error && !error.message.includes('duplicate')) throw error
}

/**
 * Complete a hack
 */
export async function completeHack(
  supabase: SupabaseClient<Database>,
  hackId: string,
  userId: string
) {
  const { error } = await supabase
    .from('hack_completions')
    .insert({
      hack_id: hackId,
      user_id: userId
    })

  if (error && !error.message.includes('duplicate')) throw error
}

/**
 * Create a comment
 */
export async function createTestComment(
  supabase: SupabaseClient<Database>,
  comment: {
    content: string
    entity_type: 'hack' | 'routine'
    entity_id: string
    user_id: string
    timestamp_seconds?: number
    parent_id?: string
  }
) {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Start a routine session
 */
export async function startRoutineSession(
  supabase: SupabaseClient<Database>,
  routineId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('routine_sessions')
    .insert({
      routine_id: routineId,
      user_id: userId,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Complete a routine session
 */
export async function completeRoutineSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  completedHacks: string[] = []
) {
  const { error } = await supabase
    .from('routine_sessions')
    .update({
      completed_at: new Date().toISOString(),
      hacks_completed: completedHacks.length,
      duration_minutes: Math.floor(Math.random() * 30) + 10 // Random duration for testing
    })
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Clean up test data
 */
export async function cleanupTestData(
  adminClient: SupabaseClient<Database>,
  prefix: string = 'test'
) {
  // Delete test comments
  await adminClient
    .from('comments')
    .delete()
    .ilike('content', `%${prefix}%`)

  // Delete test routine sessions
  await adminClient
    .from('routine_sessions')
    .delete()
    .in('routine_id',
      adminClient
        .from('routines')
        .select('id')
        .ilike('name', `%${prefix}%`)
    )

  // Delete test routine hacks
  await adminClient
    .from('routine_hacks')
    .delete()
    .in('routine_id',
      adminClient
        .from('routines')
        .select('id')
        .ilike('name', `%${prefix}%`)
    )

  // Delete test routines
  await adminClient
    .from('routines')
    .delete()
    .ilike('name', `%${prefix}%`)

  // Delete test hacks
  await adminClient
    .from('hacks')
    .delete()
    .ilike('name', `%${prefix}%`)

  // Delete test tags
  await adminClient
    .from('tags')
    .delete()
    .ilike('name', `%${prefix}%`)
}

/**
 * Seed sample data for testing
 */
export async function seedTestData(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  // Create tags
  const tag1 = await createTestTag(supabase, {
    name: 'Test Productivity',
    slug: 'test-productivity',
    tag_type: 'content',
    category: 'Productivity',
    color: '#10B981'
  })

  const tag2 = await createTestTag(supabase, {
    name: 'Test Energy',
    slug: 'test-energy',
    tag_type: 'content',
    category: 'Health',
    color: '#F59E0B'
  })

  // Create hacks
  const hack1 = await createTestHack(supabase, {
    name: 'Test Morning Routine',
    description: 'A test morning routine hack',
    content_body: '# Morning Routine\n\n1. Wake up\n2. Exercise\n3. Meditate',
    difficulty: 'Beginner',
    time_minutes: 30,
    category: 'energy'
  })

  const hack2 = await createTestHack(supabase, {
    name: 'Test Focus Technique',
    description: 'A test focus technique',
    content_body: '# Focus Technique\n\nUse the Pomodoro technique',
    difficulty: 'Intermediate',
    time_minutes: 25,
    category: 'productivity'
  })

  const hack3 = await createTestHack(supabase, {
    name: 'Test Video Hack',
    description: 'A hack with video content',
    content_type: 'link',
    external_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    media_type: 'video',
    difficulty: 'Beginner',
    time_minutes: 10,
    category: 'confidence'
  })

  // Create routine
  const routine = await createTestRoutine(supabase, userId, {
    name: 'Test Daily Routine',
    description: 'A comprehensive test routine',
    is_public: true
  })

  // Add hacks to routine
  await addHackToRoutine(supabase, routine.id, hack1.id, 0)
  await addHackToRoutine(supabase, routine.id, hack2.id, 1)
  await addHackToRoutine(supabase, routine.id, hack3.id, 2)

  // Add tags to routine
  await supabase.from('routine_tags').insert([
    { routine_id: routine.id, tag_id: tag1.id },
    { routine_id: routine.id, tag_id: tag2.id }
  ])

  return {
    tags: [tag1, tag2],
    hacks: [hack1, hack2, hack3],
    routine
  }
}