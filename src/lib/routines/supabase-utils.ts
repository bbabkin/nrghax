import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';

export type RoutineWithDetails = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  hacks: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    imageUrl: string | null;
    imagePath: string | null;
    contentType: string;
    difficulty?: string | null;
    timeMinutes?: number | null;
    position: number;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  _count?: {
    userRoutines: number;
    routineHacks: number;
  };
  isLiked?: boolean;
  isStarted?: boolean;
  isCompleted?: boolean;
  progress?: number;
};

export async function getPublicRoutines() {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const { data: routines, error } = await supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_created_by_fkey (
          id,
          name,
          email,
          avatar_url
        ),
        routine_hacks (
          position,
          hacks (
            id,
            name,
            slug,
            description,
            image_url,
            image_path,
            content_type,
            difficulty,
            time_minutes
          )
        ),
        routine_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public routines:', error);
      return [];
    }

    // Get user interactions if logged in
    let userRoutines: any[] = [];
    if (user) {
      const { data } = await supabase
        .from('user_routines')
        .select('routine_id, liked, started, completed')
        .eq('user_id', user.id);

      userRoutines = data || [];
    }

    return (routines || []).map((routine: any) => {
      const userInteraction = userRoutines.find(ur => ur.routine_id === routine.id);

      // Sort hacks by position
      const sortedHacks = routine.routine_hacks
        ?.sort((a: any, b: any) => a.position - b.position)
        .map((rh: any) => ({
          ...rh.hacks,
          position: rh.position
        })) || [];

      return {
        id: routine.id,
        name: routine.name,
        slug: routine.slug,
        description: routine.description,
        imageUrl: routine.image_url,
        imagePath: routine.image_path,
        isPublic: routine.is_public,
        createdBy: routine.created_by,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
        creator: {
          id: routine.profiles?.id || routine.created_by,
          name: routine.profiles?.name || null,
          email: routine.profiles?.email || '',
          image: routine.profiles?.avatar_url || null
        },
        hacks: sortedHacks,
        tags: routine.routine_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
        _count: {
          userRoutines: 0, // TODO: Add count query if needed
          routineHacks: sortedHacks.length
        },
        isLiked: userInteraction?.liked || false,
        isStarted: userInteraction?.started || false,
        isCompleted: userInteraction?.completed || false,
        progress: 0 // TODO: Calculate progress if needed
      };
    });
  } catch (error) {
    console.error('Error in getPublicRoutines:', error);
    return [];
  }
}

export async function getRoutines(userId?: string) {
  try {
    const supabase = await createClient();

    // Build the query
    let query = supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_created_by_fkey (
          id,
          name,
          email,
          avatar_url
        ),
        routine_hacks (
          position,
          hacks (
            id,
            name,
            slug,
            description,
            image_url,
            image_path,
            content_type,
            difficulty,
            time_minutes
          )
        ),
        routine_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Filter for public routines or user's own routines
    if (userId) {
      query = query.or(`is_public.eq.true,created_by.eq.${userId}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data: routines, error } = await query;

    if (error) {
      console.error('Error fetching routines:', error);
      return [];
    }

    // Get user interactions if userId provided
    let userRoutines: any[] = [];
    if (userId) {
      const { data } = await supabase
        .from('user_routines')
        .select('routine_id, liked, started, completed')
        .eq('user_id', userId);

      userRoutines = data || [];
    }

    return (routines || []).map((routine: any) => {
      const userInteraction = userRoutines.find(ur => ur.routine_id === routine.id);

      // Sort hacks by position
      const sortedHacks = routine.routine_hacks
        ?.sort((a: any, b: any) => a.position - b.position)
        .map((rh: any) => ({
          ...rh.hacks,
          position: rh.position
        })) || [];

      return {
        id: routine.id,
        name: routine.name,
        slug: routine.slug,
        description: routine.description,
        imageUrl: routine.image_url,
        imagePath: routine.image_path,
        isPublic: routine.is_public,
        createdBy: routine.created_by,
        createdAt: new Date(routine.created_at),
        updatedAt: new Date(routine.updated_at),
        creator: {
          id: routine.profiles?.id || routine.created_by,
          name: routine.profiles?.name || null,
          email: routine.profiles?.email || '',
          image: routine.profiles?.avatar_url || null
        },
        hacks: sortedHacks,
        tags: routine.routine_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
        _count: {
          userRoutines: 0,
          routineHacks: sortedHacks.length
        },
        isLiked: userInteraction?.liked || false,
        isStarted: userInteraction?.started || false,
        isCompleted: userInteraction?.completed || false,
        progress: 0
      };
    });
  } catch (error) {
    console.error('Error in getRoutines:', error);
    return [];
  }
}

export async function getRoutineBySlug(slug: string, userId?: string) {
  try {
    const supabase = await createClient();

    const { data: routine, error } = await supabase
      .from('routines')
      .select(`
        *,
        profiles!routines_created_by_fkey (
          id,
          name,
          email,
          avatar_url
        ),
        routine_hacks (
          position,
          hacks (
            id,
            name,
            slug,
            description,
            image_url,
            image_path,
            content_type,
            difficulty,
            time_minutes
          )
        ),
        routine_tags (
          tags (
            id,
            name,
            slug
          )
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !routine) {
      console.error('Error fetching routine by slug:', error);
      return null;
    }

    // Check if user has access (public or owner)
    if (!routine.is_public && routine.created_by !== userId) {
      return null;
    }

    // Get user interaction if userId provided
    let userInteraction = null;
    if (userId) {
      const { data } = await supabase
        .from('user_routines')
        .select('liked, started, completed')
        .eq('user_id', userId)
        .eq('routine_id', routine.id)
        .single();

      userInteraction = data;
    }

    // Sort hacks by position
    const sortedHacks = routine.routine_hacks
      ?.sort((a: any, b: any) => a.position - b.position)
      .map((rh: any) => ({
        ...rh.hacks,
        position: rh.position
      })) || [];

    return {
      id: routine.id,
      name: routine.name,
      slug: routine.slug,
      description: routine.description,
      imageUrl: routine.image_url,
      imagePath: routine.image_path,
      isPublic: routine.is_public,
      createdBy: routine.created_by,
      createdAt: new Date(routine.created_at),
      updatedAt: new Date(routine.updated_at),
      creator: {
        id: routine.profiles?.id || routine.created_by,
        name: routine.profiles?.name || null,
        email: routine.profiles?.email || '',
        image: routine.profiles?.avatar_url || null
      },
      hacks: sortedHacks,
      tags: routine.routine_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
      _count: {
        userRoutines: 0,
        routineHacks: sortedHacks.length
      },
      isLiked: userInteraction?.liked || false,
      isStarted: userInteraction?.started || false,
      isCompleted: userInteraction?.completed || false,
      progress: 0
    };
  } catch (error) {
    console.error('Error in getRoutineBySlug:', error);
    return null;
  }
}