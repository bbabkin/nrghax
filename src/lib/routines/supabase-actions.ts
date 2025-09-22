'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/supabase-user';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  const supabase = await createClient();
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const query = supabase
      .from('routines')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query.neq('id', excludeId);
    }

    const { data } = await query.single();

    if (!data) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

async function calculateRoutineProgress(routineId: string, userId: string): Promise<number> {
  const supabase = await createClient();

  // Get total hacks in routine
  const { count: totalHacks } = await supabase
    .from('routine_hacks')
    .select('*', { count: 'exact' })
    .eq('routine_id', routineId);

  if (!totalHacks || totalHacks === 0) return 0;

  // Get completed hacks
  const { data: routineHacks } = await supabase
    .from('routine_hacks')
    .select('hack_id')
    .eq('routine_id', routineId);

  if (!routineHacks) return 0;

  const hackIds = routineHacks.map(rh => rh.hack_id);

  const { count: completedHacks } = await supabase
    .from('user_hacks')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('viewed', true)
    .in('hack_id', hackIds);

  return Math.round(((completedHacks || 0) / totalHacks) * 100);
}

// Create a new routine
export async function createRoutine(formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const isPublic = formData.get('isPublic') === 'true';
  const hackIds = formData.getAll('hackIds') as string[];
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !description) {
    throw new Error('Name and description are required');
  }

  // Only admins can make routines public
  const finalIsPublic = user.is_admin ? isPublic : false;

  const baseSlug = generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    // Create routine
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        name,
        slug,
        description,
        image_url: imageUrl,
        is_public: finalIsPublic,
        created_by: user.id,
      })
      .select()
      .single();

    if (routineError) throw routineError;

    // Add hacks to routine
    if (hackIds.length > 0) {
      const { error: hacksError } = await supabase
        .from('routine_hacks')
        .insert(
          hackIds.map((hackId, index) => ({
            routine_id: routine.id,
            hack_id: hackId,
            position: index
          }))
        );

      if (hacksError) throw hacksError;
    }

    // Add tags to routine
    if (tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from('routine_tags')
        .insert(
          tagIds.map(tagId => ({
            routine_id: routine.id,
            tag_id: tagId
          }))
        );

      if (tagsError) throw tagsError;
    }

    revalidatePath('/routines');
    revalidatePath('/hacks');
    redirect(`/routines/${routine.slug}`);
  } catch (error) {
    console.error('Error creating routine:', error);
    throw new Error('Failed to create routine');
  }
}

// Update an existing routine
export async function updateRoutine(routineId: string, formData: FormData) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: routine } = await supabase
    .from('routines')
    .select('created_by')
    .eq('id', routineId)
    .single();

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can edit
  if (routine.created_by !== user.id && !user.is_admin) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const isPublic = formData.get('isPublic') === 'true';
  const hackIds = formData.getAll('hackIds') as string[];
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !description) {
    throw new Error('Name and description are required');
  }

  // Only admins can change public status
  const finalIsPublic = user.is_admin ? isPublic : false;

  const baseSlug = generateSlug(name);
  const slug = await ensureUniqueSlug(baseSlug, routineId);

  try {
    // Update routine
    const { error: updateError } = await supabase
      .from('routines')
      .update({
        name,
        slug,
        description,
        image_url: imageUrl,
        is_public: finalIsPublic
      })
      .eq('id', routineId);

    if (updateError) throw updateError;

    // Delete existing hack associations
    await supabase
      .from('routine_hacks')
      .delete()
      .eq('routine_id', routineId);

    // Create new hack associations
    if (hackIds.length > 0) {
      const { error: hacksError } = await supabase
        .from('routine_hacks')
        .insert(
          hackIds.map((hackId, index) => ({
            routine_id: routineId,
            hack_id: hackId,
            position: index
          }))
        );

      if (hacksError) throw hacksError;
    }

    // Delete existing tag associations
    await supabase
      .from('routine_tags')
      .delete()
      .eq('routine_id', routineId);

    // Create new tag associations
    if (tagIds.length > 0) {
      const { error: tagsError } = await supabase
        .from('routine_tags')
        .insert(
          tagIds.map(tagId => ({
            routine_id: routineId,
            tag_id: tagId
          }))
        );

      if (tagsError) throw tagsError;
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${slug}`);
    revalidatePath('/hacks');
    redirect(`/routines/${slug}`);
  } catch (error) {
    console.error('Error updating routine:', error);
    throw new Error('Failed to update routine');
  }
}

// Delete a routine
export async function deleteRoutine(routineId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: routine } = await supabase
    .from('routines')
    .select('created_by')
    .eq('id', routineId)
    .single();

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can delete
  if (routine.created_by !== user.id && !user.is_admin) {
    throw new Error('Unauthorized');
  }

  try {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);

    if (error) throw error;

    revalidatePath('/routines');
    revalidatePath('/hacks');
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw new Error('Failed to delete routine');
  }
}

// Toggle routine like
export async function toggleRoutineLike(routineId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  try {
    const { data: existingLike } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .single();

    if (existingLike) {
      // Toggle the like status
      const { error } = await supabase
        .from('user_routines')
        .update({ liked: !existingLike.liked })
        .eq('id', existingLike.id);

      if (error) throw error;
    } else {
      // Create new user routine with like
      const { error } = await supabase
        .from('user_routines')
        .insert({
          user_id: user.id,
          routine_id: routineId,
          liked: true
        });

      if (error) throw error;
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error toggling routine like:', error);
    throw new Error('Failed to toggle like');
  }
}

// Start a routine
export async function startRoutine(routineId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  try {
    const { data: existingUserRoutine } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .single();

    if (existingUserRoutine) {
      // Update existing record
      const { error } = await supabase
        .from('user_routines')
        .update({
          started: true,
          started_at: existingUserRoutine.started_at || new Date().toISOString()
        })
        .eq('id', existingUserRoutine.id);

      if (error) throw error;
    } else {
      // Create new user routine
      const { error } = await supabase
        .from('user_routines')
        .insert({
          user_id: user.id,
          routine_id: routineId,
          started: true,
          started_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error starting routine:', error);
    throw new Error('Failed to start routine');
  }
}

// Update routine progress
export async function updateRoutineProgress(routineId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  try {
    const progress = await calculateRoutineProgress(routineId, user.id);

    const { data: existingUserRoutine } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .single();

    if (existingUserRoutine) {
      // Update progress and check if completed
      const { error } = await supabase
        .from('user_routines')
        .update({
          progress,
          completed: progress === 100,
          completed_at: progress === 100 ? new Date().toISOString() : null
        })
        .eq('id', existingUserRoutine.id);

      if (error) throw error;
    } else {
      // Create new user routine with progress
      const { error } = await supabase
        .from('user_routines')
        .insert({
          user_id: user.id,
          routine_id: routineId,
          progress,
          completed: progress === 100,
          completed_at: progress === 100 ? new Date().toISOString() : null
        });

      if (error) throw error;
    }

    revalidatePath('/routines');
    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error updating routine progress:', error);
    throw new Error('Failed to update progress');
  }
}

// Toggle routine public status (admin only)
export async function toggleRoutinePublic(routineId: string) {
  const user = await requireAuth();
  const supabase = await createClient();

  if (!user.is_admin) {
    throw new Error('Unauthorized');
  }

  try {
    const { data: routine } = await supabase
      .from('routines')
      .select('is_public')
      .eq('id', routineId)
      .single();

    if (!routine) {
      throw new Error('Routine not found');
    }

    const { error } = await supabase
      .from('routines')
      .update({ is_public: !routine.is_public })
      .eq('id', routineId);

    if (error) throw error;

    revalidatePath('/routines');
    revalidatePath('/hacks');
    revalidatePath('/admin/routines');
  } catch (error) {
    console.error('Error toggling routine public status:', error);
    throw new Error('Failed to toggle public status');
  }
}

// Reorder hacks in a routine
export async function reorderRoutineHacks(
  routineId: string,
  hackIds: string[]
) {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: routine } = await supabase
    .from('routines')
    .select('created_by')
    .eq('id', routineId)
    .single();

  if (!routine) {
    throw new Error('Routine not found');
  }

  // Only the creator or admin can reorder
  if (routine.created_by !== user.id && !user.is_admin) {
    throw new Error('Unauthorized');
  }

  try {
    // Delete existing associations
    await supabase
      .from('routine_hacks')
      .delete()
      .eq('routine_id', routineId);

    // Create new associations with updated positions
    if (hackIds.length > 0) {
      const { error } = await supabase
        .from('routine_hacks')
        .insert(
          hackIds.map((hackId, index) => ({
            routine_id: routineId,
            hack_id: hackId,
            position: index
          }))
        );

      if (error) throw error;
    }

    revalidatePath(`/routines/${routineId}`);
  } catch (error) {
    console.error('Error reordering routine hacks:', error);
    throw new Error('Failed to reorder hacks');
  }
}