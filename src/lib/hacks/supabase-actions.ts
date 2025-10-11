'use server';

import { requireAuth, requireAdmin, getCurrentUser } from '@/lib/auth/supabase-user';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export type HackFormData = {
  name: string;
  description: string;
  imageUrl: string;
  imagePath?: string;
  contentType: 'content' | 'link';
  contentBody?: string | null;
  externalLink?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  prerequisiteIds?: string[];
  difficulty?: string;
  timeMinutes?: number;
  durationMinutes?: number | null;
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+/, '')        // Remove leading hyphens
    .replace(/-+$/, '');       // Remove trailing hyphens
}

export async function createHack(formData: HackFormData) {
  const user = await requireAdmin();
  const supabase = await createClient();

  // Validate content XOR link
  if (formData.contentType === 'content' && !formData.contentBody) {
    throw new Error('Content is required for content type');
  }
  if (formData.contentType === 'link' && !formData.externalLink) {
    throw new Error('External link is required for link type');
  }

  // Generate a unique slug
  const baseSlug = generateSlug(formData.name);
  const randomSuffix = crypto.randomUUID().substring(0, 8);
  const slug = `${baseSlug}-${randomSuffix}`;

  // Get the maximum position to add new hack at the end
  const { data: maxPositionData } = await supabase
    .from('hacks')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPositionData?.position ?? -1) + 1;

  // Create the hack
  const { data: hack, error } = await supabase
    .from('hacks')
    .insert({
      name: formData.name,
      slug: slug,
      description: formData.description,
      image_url: formData.imagePath ? '' : formData.imageUrl,
      image_path: formData.imagePath || null,
      content_type: formData.contentType,
      content_body: formData.contentBody,
      external_link: formData.externalLink,
      media_type: formData.mediaType || null,
      media_url: formData.mediaUrl || null,
      difficulty: formData.difficulty,
      time_minutes: formData.timeMinutes,
      duration_minutes: formData.durationMinutes,
      created_by: user.id,
      position: nextPosition
    })
    .select()
    .single();

  if (error) throw error;

  // Add prerequisites if any
  if (formData.prerequisiteIds && formData.prerequisiteIds.length > 0) {
    const prerequisites = formData.prerequisiteIds.map(prereqId => ({
      hack_id: hack.id,
      prerequisite_hack_id: prereqId,
    }));

    const { error: prereqError } = await supabase
      .from('hack_prerequisites')
      .insert(prerequisites);

    if (prereqError) throw prereqError;
  }

  revalidatePath('/admin/hacks');
  return hack;
}

export async function updateHack(id: string, formData: HackFormData) {
  await requireAdmin();
  const supabase = await createClient();

  // Validate content XOR link
  if (formData.contentType === 'content' && !formData.contentBody) {
    throw new Error('Content is required for content type');
  }
  if (formData.contentType === 'link' && !formData.externalLink) {
    throw new Error('External link is required for link type');
  }

  // Get the existing hack to check if name changed
  const { data: existingHack } = await supabase
    .from('hacks')
    .select('name, slug')
    .eq('id', id)
    .single();

  // Generate new slug if name changed
  let updateData: any = {
    name: formData.name,
    description: formData.description,
    image_url: formData.imagePath ? '' : formData.imageUrl,
    image_path: formData.imagePath || null,
    content_type: formData.contentType,
    content_body: formData.contentType === 'content' ? formData.contentBody : null,
    external_link: formData.contentType === 'link' ? formData.externalLink : null,
    media_type: formData.mediaType || null,
    media_url: formData.mediaUrl || null,
    difficulty: formData.difficulty,
    time_minutes: formData.timeMinutes,
    duration_minutes: formData.durationMinutes,
  };

  // If name changed, generate new slug
  if (existingHack && existingHack.name !== formData.name) {
    const baseSlug = generateSlug(formData.name);
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    updateData.slug = `${baseSlug}-${randomSuffix}`;
  }

  // Update the hack
  const { data: hack, error } = await supabase
    .from('hacks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Update prerequisites
  // First delete existing
  await supabase
    .from('hack_prerequisites')
    .delete()
    .eq('hack_id', id);

  // Then add new ones
  if (formData.prerequisiteIds && formData.prerequisiteIds.length > 0) {
    const prerequisites = formData.prerequisiteIds.map(prereqId => ({
      hack_id: id,
      prerequisite_hack_id: prereqId,
    }));

    const { error: prereqError } = await supabase
      .from('hack_prerequisites')
      .insert(prerequisites);

    if (prereqError) throw prereqError;
  }

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hack.slug}`);

  return hack;
}

export async function deleteHack(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('hacks')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');
}

export async function toggleHackLike(hackId: string) {
  const user = await getCurrentUser();
  const supabase = await createClient();

  if (!user) {
    redirect('/auth');
  }

  try {
    // Check if user has already interacted with this hack
    const { data: existingInteraction } = await supabase
      .from('user_hacks')
      .select('*')
      .eq('user_id', user.id)
      .eq('hack_id', hackId)
      .single();

    if (existingInteraction) {
      // Toggle like status
      const { error } = await supabase
        .from('user_hacks')
        .update({ liked: !existingInteraction.liked })
        .eq('id', existingInteraction.id);

      if (error) throw error;
    } else {
      // Create new interaction
      const { error } = await supabase
        .from('user_hacks')
        .insert({
          user_id: user.id,
          hack_id: hackId,
          liked: true,
          viewed: false
        });

      if (error) throw error;
    }

    revalidatePath('/hacks');
    revalidatePath(`/hacks/${hackId}`);
  } catch (error) {
    console.error('Error toggling hack like:', error);
    throw new Error('Failed to toggle like');
  }
}

export async function markHackAsViewed(hackSlug: string) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Get hack by slug
  const { data: hack } = await supabase
    .from('hacks')
    .select('id')
    .eq('slug', hackSlug)
    .single();

  if (!hack) {
    throw new Error('Hack not found');
  }

  const hackId = hack.id;

  if (user) {
    // Authenticated user - increment view count in database
    const { data: viewCount, error } = await supabase
      .rpc('increment_hack_view_count', {
        p_user_id: user.id,
        p_hack_id: hackId
      });

    if (error) {
      console.error('Error incrementing hack view count:', error);
      // Fallback to old method if the function doesn't exist yet
      const { data: existingInteraction } = await supabase
        .from('user_hacks')
        .select('*')
        .eq('user_id', user.id)
        .eq('hack_id', hackId)
        .single();

      if (existingInteraction) {
        // Update viewed status and increment count
        await supabase
          .from('user_hacks')
          .update({
            viewed: true,
            view_count: (existingInteraction.view_count || 0) + 1,
            viewed_at: new Date().toISOString()
          })
          .eq('id', existingInteraction.id);
      } else {
        // Create new interaction with view count of 1
        await supabase
          .from('user_hacks')
          .insert({
            user_id: user.id,
            hack_id: hackId,
            viewed: true,
            view_count: 1,
            viewed_at: new Date().toISOString(),
            liked: false
          });
      }
    }
  } else {
    // Anonymous user - save to cookie
    const visitedCookie = cookieStore.get('visited_hacks');
    let visitedHacks: string[] = [];

    if (visitedCookie) {
      try {
        visitedHacks = JSON.parse(visitedCookie.value);
      } catch {
        visitedHacks = [];
      }
    }

    // Add this hack if not already visited
    if (!visitedHacks.includes(hackId)) {
      visitedHacks.push(hackId);

      // Create a response to set the cookie
      const response = new Response();
      response.headers.set(
        'Set-Cookie',
        `visited_hacks=${JSON.stringify(visitedHacks)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
      );
    }
  }

  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackSlug}`);
}

export async function addHackTags(hackId: string, tagIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();

  if (!tagIds || tagIds.length === 0) return;

  const hackTags = tagIds.map(tagId => ({
    hack_id: hackId,
    tag_id: tagId
  }));

  const { error } = await supabase
    .from('hack_tags')
    .insert(hackTags);

  if (error) throw error;

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');
}

export async function removeHackTag(hackId: string, tagId: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from('hack_tags')
    .delete()
    .eq('hack_id', hackId)
    .eq('tag_id', tagId);

  if (error) throw error;

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');
}

export async function bulkUpdateHackOrder(updates: { id: string; order: number }[]) {
  await requireAdmin();
  const supabase = await createClient();

  // Update position for each hack
  const promises = updates.map(({ id, order }) =>
    supabase
      .from('hacks')
      .update({ position: order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);

  // Check for errors
  for (const result of results) {
    if (result.error) throw result.error;
  }

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');
}

export async function updateHackPositions(hackIds: string[]) {
  await requireAdmin();
  const supabase = await createClient();

  // Update positions based on the order in the array
  const promises = hackIds.map((id, index) =>
    supabase
      .from('hacks')
      .update({ position: index })
      .eq('id', id)
  );

  const results = await Promise.all(promises);

  // Check for errors
  for (const result of results) {
    if (result.error) throw result.error;
  }

  revalidatePath('/admin/hacks');
  revalidatePath('/hacks');

  return { success: true };
}

// Alias for toggleHackLike for backwards compatibility
export const toggleLike = toggleHackLike;

// Alias for markHackAsViewed
export async function markHackVisited(hackSlug: string) {
  return markHackAsViewed(hackSlug);
}