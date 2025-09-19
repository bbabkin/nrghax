import { createClient } from '@/lib/supabase/server';

export type Hack = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  image_url: string;
  image_path?: string | null;
  content_type: 'content' | 'link';
  content_body: string | null;
  external_link: string | null;
  created_at: string;
  updated_at: string;
  like_count?: number;
  completion_count?: number;
  is_liked?: boolean;
  is_completed?: boolean;
  prerequisites?: Hack[];
  prerequisite_ids?: string[];
  tags?: Array<{ id: string; name: string; slug: string }>;
};

export async function getHacks() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // First, get all hacks without complex joins
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hacks:', error);
      return [];
    }

    if (!hacks || hacks.length === 0) return [];

  // Get additional data separately to avoid complex joins
  const hackIds = hacks.map(h => h.id);

  // Get tags for all hacks
  const { data: hackTags } = await supabase
    .from('hack_tags')
    .select('hack_id, tag:tags(id, name, slug)')
    .in('hack_id', hackIds);

  // Get user interactions if user is logged in
  let userHacks: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('user_hacks')
      .select('*')
      .eq('user_id', user.id)
      .in('hack_id', hackIds);
    userHacks = data || [];
  }

  // Process the data to get counts and user-specific flags
  return hacks.map(hack => {
    const hackUserInteractions = userHacks.filter(uh => uh.hack_id === hack.id);
    const tags = hackTags?.filter(ht => ht.hack_id === hack.id)
      .map(ht => ht.tag)
      .filter(Boolean) || [];

    return {
      ...hack,
      like_count: 0, // Simplified for now
      completion_count: 0, // Simplified for now
      is_liked: hackUserInteractions.some(uh => uh.status === 'liked'),
      is_completed: hackUserInteractions.some(uh => uh.status === 'completed'),
      tags,
    };
  });
  } catch (error) {
    console.error('Error in getHacks:', error);
    return [];
  }
}

export async function getHackById(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get hack with prerequisites
  const { data: hack, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hacks!left(id, user_id, status),
      hack_prerequisites!hack_prerequisites_hack_id_fkey(
        prerequisite_hack_id,
        prerequisite:hacks!hack_prerequisites_prerequisite_hack_id_fkey(
          id,
          name,
          description,
          image_url,
          image_path
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !hack) {
    console.error('Error fetching hack:', error);
    return null;
  }

  const userHacks = hack.user_hacks || [];
  const likes = userHacks.filter((uh: any) => uh.status === 'liked');
  const completions = userHacks.filter((uh: any) => uh.status === 'completed');
  const prerequisites = hack.hack_prerequisites?.map((p: any) => p.prerequisite) || [];

  return {
    ...hack,
    like_count: likes.length,
    completion_count: completions.length,
    is_liked: user ? likes.some((like: any) => like.user_id === user.id) : false,
    is_completed: user ? completions.some((comp: any) => comp.user_id === user.id) : false,
    prerequisites,
    user_hacks: undefined,
    hack_prerequisites: undefined,
  } as Hack;
}

export async function getHackBySlug(slug: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Get hack with prerequisites
  const { data: hack, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hacks!left(id, user_id, status),
      hack_prerequisites!hack_prerequisites_hack_id_fkey(
        prerequisite_hack_id,
        prerequisite:hacks!hack_prerequisites_prerequisite_hack_id_fkey(
          id,
          name,
          description,
          image_url,
          image_path
        )
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !hack) {
    return null; // Don't log error for slug lookup, it's expected to fail for UUIDs
  }

  const userHacks = hack.user_hacks || [];
  const likes = userHacks.filter((uh: any) => uh.status === 'liked');
  const completions = userHacks.filter((uh: any) => uh.status === 'completed');
  const prerequisites = hack.hack_prerequisites?.map((p: any) => p.prerequisite) || [];

  return {
    ...hack,
    like_count: likes.length,
    completion_count: completions.length,
    is_liked: user ? likes.some((like: any) => like.user_id === user.id) : false,
    is_completed: user ? completions.some((comp: any) => comp.user_id === user.id) : false,
    prerequisites,
    user_hacks: undefined,
    hack_prerequisites: undefined,
  } as Hack;
}

export async function getHackWithPrerequisites(id: string) {
  const supabase = await createClient();

  const { data: hack, error: hackError } = await supabase
    .from('hacks')
    .select('*')
    .eq('id', id)
    .single();

  if (hackError || !hack) {
    return null;
  }

  // Get prerequisites
  const { data: prerequisites } = await supabase
    .from('hack_prerequisites')
    .select(`
      prerequisite_hack_id,
      prerequisite:hacks!hack_prerequisites_prerequisite_hack_id_fkey(
        id,
        name
      )
    `)
    .eq('hack_id', id);

  return {
    ...hack,
    prerequisite_ids: prerequisites?.map(p => p.prerequisite_hack_id) || [],
  };
}

export async function checkPrerequisitesCompleted(hackId: string, userId: string) {
  const supabase = await createClient();

  // Get prerequisites for this hack
  const { data: prerequisites } = await supabase
    .from('hack_prerequisites')
    .select('prerequisite_hack_id')
    .eq('hack_id', hackId);

  if (!prerequisites || prerequisites.length === 0) {
    return true; // No prerequisites, so they're "completed"
  }

  // Check if user has completed all prerequisites
  const prerequisiteIds = prerequisites.map(p => p.prerequisite_hack_id);
  const { data: completed } = await supabase
    .from('user_hacks')
    .select('hack_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('hack_id', prerequisiteIds);

  return completed?.length === prerequisites.length;
}

export async function getUserCompletedHacks(userId: string) {
  const supabase = await createClient();

  const { data: completions, error } = await supabase
    .from('user_hacks')
    .select(`
      completed_at,
      hack:hacks(
        id,
        name,
        description,
        image_url,
        image_path,
        content_type
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (error || !completions) {
    console.error('Error fetching completed hacks:', error);
    return [];
  }

  return completions
    .filter((c: any) => c.hack)
    .map((c: any) => ({
      id: c.hack.id,
      name: c.hack.name,
      description: c.hack.description,
      image_url: c.hack.image_url,
      image_path: c.hack.image_path,
      content_type: c.hack.content_type as 'content' | 'link',
      completed_at: c.completed_at,
    }));
}

export async function getAllHacksForSelect() {
  const supabase = await createClient();

  const { data: hacks, error } = await supabase
    .from('hacks')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching hacks for select:', error);
    return [];
  }

  return hacks;
}

export async function getRecommendedHacks(userId?: string) {
  const supabase = await createClient();

  // If no user ID provided, try to get current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  // If still no user, return all hacks
  if (!userId) {
    return getHacks();
  }

  // Get user's tags
  const { data: userTags } = await supabase
    .from('user_tags')
    .select('tag_id')
    .eq('user_id', userId);

  if (!userTags || userTags.length === 0) {
    return getHacks(); // No tags, return all hacks
  }

  const tagIds = userTags.map(ut => ut.tag_id);

  // Get hacks that match user's tags
  const { data: hacks, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hacks!left(id, user_id, status),
      hack_tags!inner(
        tag_id,
        tag:tags(id, name, slug)
      )
    `)
    .in('hack_tags.tag_id', tagIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recommended hacks:', error);
    return getHacks();
  }

  // Process the data
  return hacks.map(hack => {
    const userHacks = hack.user_hacks || [];
    const likes = userHacks.filter((uh: any) => uh.status === 'liked');
    const completions = userHacks.filter((uh: any) => uh.status === 'completed');
    const tags = hack.hack_tags?.map((ht: any) => ht.tag).filter(Boolean) || [];

    return {
      ...hack,
      like_count: likes.length,
      completion_count: completions.length,
      is_liked: userId ? likes.some((like: any) => like.user_id === userId) : false,
      is_completed: userId ? completions.some((comp: any) => comp.user_id === userId) : false,
      tags,
      user_hacks: undefined,
      hack_tags: undefined,
    };
  });
}