'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/supabase-user'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const LevelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
})

type LevelInput = z.infer<typeof LevelSchema>

/**
 * Create a new level
 */
export async function createLevel(data: LevelInput) {
  await requireAdmin()
  const supabase = await createClient()

  const validated = LevelSchema.parse(data)

  const { data: level, error } = await supabase
    .from('levels')
    .insert({
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      icon: validated.icon || null,
      position: validated.position ?? 999,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating level:', error)
    throw new Error(`Failed to create level: ${error.message}`)
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return level
}

/**
 * Update an existing level
 */
export async function updateLevel(id: string, data: Partial<LevelInput>) {
  await requireAdmin()
  const supabase = await createClient()

  const validated = LevelSchema.partial().parse(data)

  const { data: level, error } = await supabase
    .from('levels')
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating level:', error)
    throw new Error(`Failed to update level: ${error.message}`)
  }

  revalidatePath('/admin/levels')
  revalidatePath(`/admin/levels/${id}`)
  revalidatePath('/levels')
  revalidatePath(`/levels/${validated.slug || ''}`)

  return level
}

/**
 * Delete a level
 * Note: This will set level_id to NULL for all hacks in this level
 */
export async function deleteLevel(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('levels')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting level:', error)
    throw new Error(`Failed to delete level: ${error.message}`)
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return { success: true }
}

/**
 * Assign a hack to a level at a specific position
 */
export async function assignHackToLevel(hackId: string, levelId: string, position?: number) {
  await requireAdmin()
  const supabase = await createClient()

  // If no position provided, get the max position + 1
  let hackPosition = position
  if (position === undefined) {
    const { data: maxPos } = await supabase
      .from('hacks')
      .select('position')
      .eq('level_id', levelId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    hackPosition = (maxPos?.position ?? -1) + 1
  }

  const { data: hack, error } = await supabase
    .from('hacks')
    .update({
      level_id: levelId,
      position: hackPosition,
      updated_at: new Date().toISOString(),
    })
    .eq('id', hackId)
    .select()
    .single()

  if (error) {
    console.error('Error assigning hack to level:', error)
    throw new Error(`Failed to assign hack: ${error.message}`)
  }

  revalidatePath(`/admin/levels/${levelId}/hacks`)
  revalidatePath('/levels')

  return hack
}

/**
 * Remove a hack from its level
 */
export async function removeHackFromLevel(hackId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: hack, error } = await supabase
    .from('hacks')
    .update({
      level_id: null,
      position: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', hackId)
    .select()
    .single()

  if (error) {
    console.error('Error removing hack from level:', error)
    throw new Error(`Failed to remove hack: ${error.message}`)
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return hack
}

/**
 * Update hack positions within a level (for drag-and-drop reordering)
 */
export async function updateHackPositions(updates: { hackId: string; position: number }[]) {
  await requireAdmin()
  const supabase = await createClient()

  // Update each hack position
  const promises = updates.map(({ hackId, position }) =>
    supabase
      .from('hacks')
      .update({
        position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hackId)
  )

  const results = await Promise.all(promises)

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error('Errors updating hack positions:', errors)
    throw new Error('Failed to update some hack positions')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return { success: true, updated: updates.length }
}

/**
 * Get all hacks not assigned to any level
 */
export async function getUnassignedHacks() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hacks')
    .select('id, name, slug, description')
    .is('level_id', null)
    .order('name')

  if (error) {
    console.error('Error fetching unassigned hacks:', error)
    throw new Error('Failed to fetch unassigned hacks')
  }

  return data || []
}

/**
 * Get all hacks in a specific level, ordered by position
 */
export async function getHacksByLevel(levelId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hacks')
    .select('id, name, slug, description, position')
    .eq('level_id', levelId)
    .order('position', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('Error fetching hacks for level:', error)
    throw new Error('Failed to fetch hacks')
  }

  return data || []
}

/**
 * Update level positions (for drag-and-drop reordering of levels)
 */
export async function updateLevelPositions(updates: { levelId: string; position: number }[]) {
  await requireAdmin()
  const supabase = await createClient()

  const promises = updates.map(({ levelId, position }) =>
    supabase
      .from('levels')
      .update({
        position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', levelId)
  )

  const results = await Promise.all(promises)

  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error('Errors updating level positions:', errors)
    throw new Error('Failed to update some level positions')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return { success: true, updated: updates.length }
}
