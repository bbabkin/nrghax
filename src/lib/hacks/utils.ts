import { createClient } from '@/lib/supabase/server';

export type Hack = {
  id: string;
  name: string;
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
};

export async function getHacks() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get all hacks with their stats
  const { data: hacks, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hack_likes!left(id, user_id),
      user_hack_completions!left(id, user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching hacks:', error);
    return [];
  }

  // Process the data to get counts and user-specific flags
  return hacks.map(hack => {
    const likes = hack.user_hack_likes || [];
    const completions = hack.user_hack_completions || [];
    
    return {
      ...hack,
      like_count: likes.length,
      completion_count: completions.length,
      is_liked: user ? likes.some((like: any) => like.user_id === user.id) : false,
      is_completed: user ? completions.some((comp: any) => comp.user_id === user.id) : false,
      user_hack_likes: undefined,
      user_hack_completions: undefined,
    };
  });
}

export async function getHackById(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get hack with prerequisites
  const { data: hack, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hack_likes!left(id, user_id),
      user_hack_completions!left(id, user_id),
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

  const likes = hack.user_hack_likes || [];
  const completions = hack.user_hack_completions || [];
  const prerequisites = hack.hack_prerequisites?.map((p: any) => p.prerequisite) || [];
  
  return {
    ...hack,
    like_count: likes.length,
    completion_count: completions.length,
    is_liked: user ? likes.some((like: any) => like.user_id === user.id) : false,
    is_completed: user ? completions.some((comp: any) => comp.user_id === user.id) : false,
    prerequisites,
    user_hack_likes: undefined,
    user_hack_completions: undefined,
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
  
  const { data: isCompleted } = await supabase
    .rpc('check_prerequisites_completed', {
      p_user_id: userId,
      p_hack_id: hackId,
    });
    
  return isCompleted || false;
}

export async function getUserCompletedHacks(userId: string) {
  const supabase = await createClient();
  
  const { data: completions, error } = await supabase
    .from('user_hack_completions')
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