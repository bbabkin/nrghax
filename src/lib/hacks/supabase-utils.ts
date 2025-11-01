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
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaThumbnailUrl?: string | null;
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
  completionCount?: number;
  completionPercentage?: number;
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
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hacks:', error);
      return [];
    }

    if (!hacks || hacks.length === 0) {
      console.warn('No hacks returned from database');
      return [];
    }

    console.log(`Found ${hacks.length} hacks in database`);

    // If user is logged in, fetch their interactions including completion count
    let userHacks: any[] = [];
    if (user) {
      const { data } = await supabase
        .from('user_hacks')
        .select('hack_id, liked, viewed, view_count, completion_count')
        .eq('user_id', user.id);

      userHacks = data || [];
    }

    // Get like counts - with error handling
    const { data: likeCounts, error: likeCountError } = await supabase
      .from('user_hacks')
      .select('hack_id')
      .eq('liked', true);

    if (likeCountError) {
      console.error('Error fetching like counts:', likeCountError);
    }

    const likeCountMap = (likeCounts || []).reduce((acc: any, item) => {
      acc[item.hack_id] = (acc[item.hack_id] || 0) + 1;
      return acc;
    }, {});

    // For calculating completion percentage, we need to get hack checks if user is logged in
    let hackChecksProgress: Record<string, { total: number; completed: number }> = {};
    if (user) {
      const hackIds = hacks.map(h => h.id);

      // Get all hack checks for these hacks
      const { data: hackChecks } = await supabase
        .from('hack_checks')
        .select('id, hack_id')
        .in('hack_id', hackIds);

      // Get user's completed checks
      const { data: userChecks } = await supabase
        .from('user_hack_checks')
        .select('hack_check_id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (hackChecks) {
        // Group checks by hack_id and count totals
        hackChecks.forEach(check => {
          if (!hackChecksProgress[check.hack_id]) {
            hackChecksProgress[check.hack_id] = { total: 0, completed: 0 };
          }
          hackChecksProgress[check.hack_id].total++;

          // Check if this check is completed by the user
          if (userChecks?.some(uc => uc.hack_check_id === check.id)) {
            hackChecksProgress[check.hack_id].completed++;
          }
        });
      }
    }

    return hacks.map(hack => {
      const userInteraction = userHacks.find(uh => uh.hack_id === hack.id);
      const checkProgress = hackChecksProgress[hack.id];

      // Calculate completion percentage
      let completionPercentage = undefined;
      if (checkProgress && checkProgress.total > 0) {
        completionPercentage = Math.round((checkProgress.completed / checkProgress.total) * 100);
      }

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
        mediaType: hack.media_type,
        mediaUrl: hack.media_url,
        mediaThumbnailUrl: hack.media_thumbnail_url,
        createdAt: hack.created_at,
        updatedAt: hack.updated_at,
        difficulty: hack.difficulty,
        timeMinutes: hack.time_minutes,
        tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
        likeCount: likeCountMap[hack.id] || 0,
        viewCount: userInteraction?.view_count || 0,
        isLiked: userInteraction?.liked || false,
        isViewed: userInteraction?.viewed || false,
        completionCount: userInteraction?.completion_count || 0,
        completionPercentage,
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
        .select('liked, viewed, view_count')
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
      mediaType: hack.media_type,
      mediaUrl: hack.media_url,
      mediaThumbnailUrl: hack.media_thumbnail_url,
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

export async function getAllHacksForSelect() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('hacks')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching hacks for select:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching hacks for select:', error);
    return [];
  }
}

export async function getHackWithPrerequisites(id: string) {
  try {
    const hack = await getHackById(id);
    if (!hack) return null;

    const supabase = await createClient();

    // Get prerequisites
    const { data: prerequisites } = await supabase
      .from('hack_prerequisites')
      .select(`
        prerequisite_hack_id,
        prerequisite:hacks!hack_prerequisites_prerequisite_hack_id_fkey (
          id,
          name
        )
      `)
      .eq('hack_id', id);

    return {
      ...hack,
      prerequisites: prerequisites?.map(p => p.prerequisite).filter(Boolean) || [],
      prerequisiteIds: prerequisites?.map(p => p.prerequisite_hack_id).filter(Boolean) || []
    };
  } catch (error) {
    console.error('Error fetching hack with prerequisites:', error);
    return null;
  }
}

export async function checkPrerequisitesCompleted(hackId: string, userId?: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get hack prerequisites
    const { data: prerequisites } = await supabase
      .from('hack_prerequisites')
      .select('prerequisite_hack_id')
      .eq('hack_id', hackId);

    if (!prerequisites || prerequisites.length === 0) {
      return true; // No prerequisites
    }

    if (!userId) {
      // For anonymous users, check cookies
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const visitedCookie = cookieStore.get('visited_hacks');

      if (!visitedCookie) {
        return false;
      }

      try {
        const visitedHacks = JSON.parse(visitedCookie.value) as string[];
        return prerequisites.every(p => visitedHacks.includes(p.prerequisite_hack_id!));
      } catch {
        return false;
      }
    }

    // For authenticated users
    const prerequisiteIds = prerequisites.map(p => p.prerequisite_hack_id!);

    const { data: completedHacks } = await supabase
      .from('user_hacks')
      .select('hack_id')
      .eq('user_id', userId)
      .eq('viewed', true)
      .in('hack_id', prerequisiteIds);

    const completedIds = completedHacks?.map(h => h.hack_id) || [];
    return prerequisiteIds.every(id => completedIds.includes(id));
  } catch (error) {
    console.error('Error checking prerequisites:', error);
    return false;
  }
}

export async function getUserCompletedHacks(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_hacks')
      .select(`
        hack_id,
        viewed,
        liked,
        updated_at,
        hacks (
          id,
          name,
          slug,
          description,
          image_url,
          image_path,
          content_type,
          difficulty,
          time_minutes,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('viewed', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user completed hacks:', error);
      return [];
    }

    return data?.map(item => ({
      id: item.hacks.id,
      name: item.hacks.name,
      slug: item.hacks.slug,
      description: item.hacks.description,
      image_url: item.hacks.image_url,
      image_path: item.hacks.image_path,
      difficulty: item.hacks.difficulty,
      time_minutes: item.hacks.time_minutes,
      content_type: item.hacks.content_type as 'content' | 'link',
      isViewed: item.viewed,
      isLiked: item.liked,
      viewedAt: item.updated_at,
      createdAt: item.hacks.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching user completed hacks:', error);
    return [];
  }
}

export async function getAllLevelsForSelect() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('levels')
      .select('id, name, slug')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching levels:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching levels:', error);
    return [];
  }
}