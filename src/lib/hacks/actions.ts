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

  // Create the hack
  const { data: hack, error: hackError } = await supabase
    .from('hacks')
    .insert({
      name: formData.name,
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
  redirect('/admin/hacks');
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

  // Update the hack
  const { error: hackError } = await supabase
    .from('hacks')
    .update({
      name: formData.name,
      description: formData.description,
      image_url: formData.image_path ? null : formData.image_url,
      image_path: formData.image_path || null,
      content_type: formData.content_type,
      content_body: formData.content_body,
      external_link: formData.external_link,
    })
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

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('user_hack_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('hack_id', hackId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('user_hack_likes')
      .delete()
      .eq('id', existingLike.id);
      
    if (error) {
      throw new Error(`Failed to unlike: ${error.message}`);
    }
  } else {
    // Like
    const { error } = await supabase
      .from('user_hack_likes')
      .insert({
        user_id: user.id,
        hack_id: hackId,
      });
      
    if (error) {
      throw new Error(`Failed to like: ${error.message}`);
    }
  }

  revalidatePath('/hacks');
  revalidatePath(`/hacks/${hackId}`);
}

export async function markHackComplete(hackId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Must be logged in to complete hacks');
  }

  // Check if already completed
  const { data: existingCompletion } = await supabase
    .from('user_hack_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('hack_id', hackId)
    .single();

  if (!existingCompletion) {
    // Mark as complete
    const { error } = await supabase
      .from('user_hack_completions')
      .insert({
        user_id: user.id,
        hack_id: hackId,
      });
      
    if (error) {
      throw new Error(`Failed to mark as complete: ${error.message}`);
    }
  }

  // Note: revalidatePath cannot be called during render
  // These paths will be revalidated on next navigation
}