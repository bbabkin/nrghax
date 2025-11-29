'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RoutineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  duration_minutes: z.number().int().positive().optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal('')),
  is_public: z.boolean().default(false),
})

export async function createRoutine(formData: FormData) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Not authorized')
  }

  // Parse and validate form data
  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    duration_minutes: formData.get('duration_minutes')
      ? parseInt(formData.get('duration_minutes') as string)
      : null,
    image_url: formData.get('image_url') || null,
    is_public: formData.get('is_public') === 'true',
  }

  const validated = RoutineSchema.parse(rawData)

  // Create the routine
  const { data: routine, error } = await supabase
    .from('routines')
    .insert({
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      duration_minutes: validated.duration_minutes ?? null,
      image_url: validated.image_url || null,
      is_public: validated.is_public,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating routine:', error)
    throw new Error(`Failed to create routine: ${error.message}`)
  }

  // Handle tags if provided
  const tagIds = formData.getAll('tag_ids[]')
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map(tagId => ({
      routine_id: routine.id,
      tag_id: tagId as string,
    }))

    const { error: tagError } = await supabase
      .from('routine_tags')
      .insert(tagInserts)

    if (tagError) {
      console.error('Error adding tags:', tagError)
    }
  }

  revalidatePath('/admin/routines')
  revalidatePath('/library')
  redirect('/admin/routines')
}

export async function updateRoutine(routineId: string, formData: FormData) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Not authorized')
  }

  // Parse and validate form data
  const rawData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    duration_minutes: formData.get('duration_minutes')
      ? parseInt(formData.get('duration_minutes') as string)
      : null,
    image_url: formData.get('image_url') || null,
    is_public: formData.get('is_public') === 'true',
  }

  const validated = RoutineSchema.parse(rawData)

  // Update the routine
  const { error } = await supabase
    .from('routines')
    .update(validated)
    .eq('id', routineId)

  if (error) {
    console.error('Error updating routine:', error)
    throw new Error(`Failed to update routine: ${error.message}`)
  }

  // Update tags - delete existing and insert new ones
  await supabase
    .from('routine_tags')
    .delete()
    .eq('routine_id', routineId)

  const tagIds = formData.getAll('tag_ids[]')
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map(tagId => ({
      routine_id: routineId,
      tag_id: tagId as string,
    }))

    const { error: tagError } = await supabase
      .from('routine_tags')
      .insert(tagInserts)

    if (tagError) {
      console.error('Error updating tags:', tagError)
    }
  }

  revalidatePath('/admin/routines')
  revalidatePath(`/admin/routines/${routineId}/edit`)
  revalidatePath('/library')
  redirect('/admin/routines')
}

export async function deleteRoutine(routineId: string) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Not authorized')
  }

  // Delete routine (cascade should handle routine_tags and routine_hacks)
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)

  if (error) {
    console.error('Error deleting routine:', error)
    throw new Error(`Failed to delete routine: ${error.message}`)
  }

  revalidatePath('/admin/routines')
  revalidatePath('/library')

  return { success: true }
}

export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
