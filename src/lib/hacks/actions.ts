'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type HackFormData = {
  name: string;
  description: string;
  image_url: string;
  image_path?: string;
  content_type: 'content' | 'link';
  content_body?: string | null;
  external_link?: string | null;
  prerequisite_ids?: string[];
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
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Validate content XOR link
  if (formData.content_type === 'content' && !formData.content_body) {
    throw new Error('Content is required for content type');
  }
  if (formData.content_type === 'link' && !formData.external_link) {
    throw new Error('External link is required for link type');
  }

  // Generate a unique slug
  const baseSlug = generateSlug(formData.name);
  const randomSuffix = crypto.randomUUID().substring(0, 8);
  const slug = `${baseSlug}-${randomSuffix}`;

  // Create the hack
  const { data: hack, error: hackError } = await supabase
    .from('hacks')
    .insert({
      name: formData.name,
      slug: slug,
      description: formData.description,
      image_url: formData.image_path ? null : formData.image_url,
      image_path: formData.image_path || null,
      content_type: formData.content_type,
      content_body: formData.content_body,
      external_link: formData.external_link,
    })
    .select()
    .single();

  if (hackError) {
    throw new Error(`Failed to create hack: ${hackError.message}`);
  }

  // Add prerequisites if any
  if (formData.prerequisite_ids && formData.prerequisite_ids.length > 0) {
    // Check for circular dependencies
    for (const prereqId of formData.prerequisite_ids) {
      const { data: hasCircular } = await supabase
        .rpc('check_circular_dependency', {
          p_hack_id: hack.id,
          p_prerequisite_id: prereqId,
        });
        
      if (hasCircular) {
        // Delete the hack we just created
        await supabase.from('hacks').delete().eq('id', hack.id);
        throw new Error('Cannot add prerequisite: would create circular dependency');
      }
    }

    const prerequisites = formData.prerequisite_ids.map(prereqId => ({
      hack_id: hack.id,
      prerequisite_hack_id: prereqId,
    }));

    const { error: prereqError } = await supabase
      .from('hack_prerequisites')
      .insert(prerequisites);

    if (prereqError) {
      // Delete the hack we just created
      await supabase.from('hacks').delete().eq('id', hack.id);
      throw new Error(`Failed to add prerequisites: ${prereqError.message}`);
    }
  }

  revalidatePath('/admin/hacks');
  return hack;
}

export async function updateHack(id: string, formData: HackFormData) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Validate content XOR link
  if (formData.content_type === 'content' && !formData.content_body) {
    throw new Error('Content is required for content type');
  }
  if (formData.content_type === 'link' && !formData.external_link) {
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
    image_url: formData.image_path ? null : formData.image_url,
    image_path: formData.image_path || null,
    content_type: formData.content_type,
    content_body: formData.content_body,
    external_link: formData.external_link,
  };

  if (existingHack && existingHack.name !== formData.name) {
    const baseSlug = generateSlug(formData.name);
    const randomSuffix = crypto.randomUUID().substring(0, 8);
    updateData.slug = `${baseSlug}-${randomSuffix}`;
  }

  // Update the hack
  const { error: hackError } = await supabase
    .from('hacks')
    .update(updateData)
    .eq('id', id);

  if (hackError) {
    throw new Error(`Failed to update hack: ${hackError.message}`);
  }

  // Update prerequisites
  // First, delete existing prerequisites
  await supabase
    .from('hack_prerequisites')
    .delete()
    .eq('hack_id', id);

  // Then add new ones if any
  if (formData.prerequisite_ids && formData.prerequisite_ids.length > 0) {
    // Check for circular dependencies
    for (const prereqId of formData.prerequisite_ids) {
      const { data: hasCircular } = await supabase
        .rpc('check_circular_dependency', {
          p_hack_id: id,
          p_prerequisite_id: prereqId,
        });
        
      if (hasCircular) {
        throw new Error('Cannot add prerequisite: would create circular dependency');
      }
    }

    const prerequisites = formData.prerequisite_ids.map(prereqId => ({
      hack_id: id,
      prerequisite_hack_id: prereqId,
    }));

    const { error: prereqError } = await supabase
      .from('hack_prerequisites')
      .insert(prerequisites);

    if (prereqError) {
      throw new Error(`Failed to add prerequisites: ${prereqError.message}`);
    }
  }

  revalidatePath('/admin/hacks');
  revalidatePath(`/admin/hacks/${id}/edit`);
  redirect('/admin/hacks');
}

export async function deleteHack(id: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  if (!profile?.is_admin) {
    throw new Error('Unauthorized: Admin access required');
  }

  const { error } = await supabase
    .from('hacks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete hack: ${error.message}`);
  }

  revalidatePath('/admin/hacks');
}

export async function toggleLike(hackId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Must be logged in to like hacks');
  }

  try {
    // Import Prisma client
    const { default: prisma } = await import('@/lib/db');

    // Check if user has any interaction with this hack
    const existingInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: user.id,
          hackId: hackId
        }
      }
    });

    if (existingInteraction) {
      if (existingInteraction.status === 'liked') {
        // Unlike (remove the record)
        await prisma.userHack.delete({
          where: {
            id: existingInteraction.id
          }
        });
      } else {
        // Update status to liked
        await prisma.userHack.update({
          where: {
            id: existingInteraction.id
          },
          data: {
            status: 'liked'
          }
        });
      }
    } else {
      // Create new like
      await prisma.userHack.create({
        data: {
          userId: user.id,
          hackId: hackId,
          status: 'liked'
        }
      });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    throw new Error(`Failed to toggle like: ${error.message}`);
  }

  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackId}`);
}

export async function markHackVisited(hackId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Must be logged in to track visited hacks');
  }

  try {
    // Import Prisma client
    const { default: prisma } = await import('@/lib/db');

    // Check if user has any interaction with this hack
    const existingInteraction = await prisma.userHack.findUnique({
      where: {
        userId_hackId: {
          userId: user.id,
          hackId: hackId
        }
      }
    });

    if (existingInteraction) {
      // Only update if not already marked as visited
      if (existingInteraction.status !== 'visited') {
        await prisma.userHack.update({
          where: {
            id: existingInteraction.id
          },
          data: {
            status: 'visited',
            completedAt: new Date()
          }
        });
      }
    } else {
      // Create new interaction record
      await prisma.userHack.create({
        data: {
          userId: user.id,
          hackId: hackId,
          status: 'visited',
          completedAt: new Date()
        }
      });
    }
  } catch (error: any) {
    console.error('Error marking hack as visited:', error);
    throw new Error(`Failed to mark as visited: ${error.message}`);
  }

  // Revalidate paths to update the UI
  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackId}`);
  revalidatePath('/profile');
}