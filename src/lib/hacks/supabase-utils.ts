import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';

export type Hack = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  imageUrl: string;
  imagePath?: string | null;
  contentType: 'content' | 'link';
  contentBody: string | null;
  externalLink: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  viewCount?: number;
  isLiked?: boolean;
  isViewed?: boolean;
  prerequisites?: Hack[];
  prerequisiteIds?: string[];
  tags?: Array<{ id: string; name: string; slug: string }>;
  difficulty?: string;
  timeMinutes?: number;
};

export async function getHacks() {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Fetch hacks with tags
    const { data: hacks, error } = await supabase
      .from('hacks')
      .select(`
        *,
        hack_tags (
          tag_id,
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hacks:', error);
      return [];
    }

    // If user is logged in, fetch their interactions
    let userHacks: any[] = [];
    if (user) {
      const { data } = await supabase
        .from('user_hacks')
        .select('hack_id, liked, viewed')
        .eq('user_id', user.id);

      userHacks = data || [];
    }

    // Get like counts
    const { data: likeCounts } = await supabase
      .from('user_hacks')
      .select('hack_id')
      .eq('liked', true);

    const likeCountMap = (likeCounts || []).reduce((acc: any, item) => {
      acc[item.hack_id] = (acc[item.hack_id] || 0) + 1;
      return acc;
    }, {});

    return hacks.map(hack => {
      const userInteraction = userHacks.find(uh => uh.hack_id === hack.id);

      return {
        id: hack.id,
        name: hack.name,
        slug: hack.slug,
        description: hack.description,
        imageUrl: hack.image_url || '',
        imagePath: hack.image_path,
        contentType: hack.content_type as 'content' | 'link',
        contentBody: hack.content_body,
        externalLink: hack.external_link,
        createdAt: hack.created_at,
        updatedAt: hack.updated_at,
        difficulty: hack.difficulty,
        timeMinutes: hack.time_minutes,
        tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
        likeCount: likeCountMap[hack.id] || 0,
        isLiked: userInteraction?.liked || false,
        isViewed: userInteraction?.viewed || false,
      };
    });
  } catch (error) {
    console.error('Error fetching hacks:', error);
    return [];
  }
}

export async function getHackById(id: string) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Fetch hack with tags and prerequisites
    const { data: hack, error } = await supabase
      .from('hacks')
      .select(`
        *,
        hack_tags (
          tag_id,
          tags (
            id,
            name,
            slug
          )
        ),
        hack_prerequisites!hack_prerequisites_hack_id_fkey (
          prerequisite_hack_id,
          prerequisite:hacks!hack_prerequisites_prerequisite_hack_id_fkey (
            id,
            name,
            slug,
            description
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !hack) {
      console.error('Error fetching hack:', error);
      return null;
    }

    // Get user interaction if logged in
    let userInteraction = null;
    if (user) {
      const { data } = await supabase
        .from('user_hacks')
        .select('liked, viewed')
        .eq('user_id', user.id)
        .eq('hack_id', id)
        .single();

      userInteraction = data;
    }

    // Get counts
    const { count: likeCount } = await supabase
      .from('user_hacks')
      .select('id', { count: 'exact' })
      .eq('hack_id', id)
      .eq('liked', true);

    const { count: viewCount } = await supabase
      .from('user_hacks')
      .select('id', { count: 'exact' })
      .eq('hack_id', id)
      .eq('viewed', true);

    return {
      id: hack.id,
      name: hack.name,
      slug: hack.slug,
      description: hack.description,
      imageUrl: hack.image_url || '',
      imagePath: hack.image_path,
      contentType: hack.content_type as 'content' | 'link',
      contentBody: hack.content_body,
      externalLink: hack.external_link,
      createdAt: hack.created_at,
      updatedAt: hack.updated_at,
      difficulty: hack.difficulty,
      timeMinutes: hack.time_minutes,
      tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
      prerequisites: hack.hack_prerequisites?.map((hp: any) => hp.prerequisite).filter(Boolean) || [],
      prerequisiteIds: hack.hack_prerequisites?.map((hp: any) => hp.prerequisite_hack_id).filter(Boolean) || [],
      likeCount: likeCount || 0,
      viewCount: viewCount || 0,
      isLiked: userInteraction?.liked || false,
      isViewed: userInteraction?.viewed || false,
    };
  } catch (error) {
    console.error('Error fetching hack by id:', error);
    return null;
  }
}

export async function getHackBySlug(slug: string) {
  try {
    const supabase = await createClient();

    // First get the hack ID from slug
    const { data: hack, error } = await supabase
      .from('hacks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (error || !hack) {
      console.error('Error fetching hack by slug:', error);
      return null;
    }

    // Then use getHackById for full data
    return getHackById(hack.id);
  } catch (error) {
    console.error('Error fetching hack by slug:', error);
    return null;
  }
}

export async function getUserCompletedHackIds(userId: string): Promise<string[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_hacks')
      .select('hack_id')
      .eq('user_id', userId)
      .eq('viewed', true);

    if (error) {
      console.error('Error fetching user completed hacks:', error);
      return [];
    }

    return data?.map(uh => uh.hack_id) || [];
  } catch (error) {
    console.error('Error fetching user completed hacks:', error);
    return [];
  }
}

export async function getHackPrerequisites() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hack_prerequisites')
      .select('hack_id, prerequisite_hack_id');

    if (error) {
      console.error('Error fetching prerequisites:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching prerequisites:', error);
    return [];
  }
}