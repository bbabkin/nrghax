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
    durationMinutes?: number | null;
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
  totalDuration?: number;
  isLiked?: boolean;
  isStarted?: boolean;
  isCompleted?: boolean;
  progress?: number;
  likeCount?: number;
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
            time_minutes,
            duration_minutes
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
    let completedHackIds: string[] = [];
    if (user) {
      const { data } = await supabase
        .from('user_routines')
        .select('routine_id, liked, started, completed, progress')
        .eq('user_id', user.id);

      userRoutines = data || [];

      // Get all completed hacks for this user
      const { data: completedHacks } = await supabase
        .from('user_hacks')
        .select('hack_id')
        .eq('user_id', user.id)
        .eq('viewed', true);

      completedHackIds = completedHacks?.map(h => h.hack_id) || [];
    }

    return (routines || []).map((routine: any) => {
      const userInteraction = userRoutines.find(ur => ur.routine_id === routine.id);

      // Sort hacks by position and filter out null hacks
      const sortedHacks = routine.routine_hacks
        ?.sort((a: any, b: any) => a.position - b.position)
        .filter((rh: any) => rh.hacks !== null)
        .map((rh: any) => ({
          ...rh.hacks,
          durationMinutes: rh.hacks.duration_minutes,
          position: rh.position
        })) || [];

      // Calculate progress based on completed hacks
      let progress = 0;
      if (user && sortedHacks.length > 0) {
        const completedCount = sortedHacks.filter(hack =>
          completedHackIds.includes(hack.id)
        ).length;
        progress = Math.floor((completedCount / sortedHacks.length) * 100);
      }

      // Calculate total duration
      const totalDuration = sortedHacks.reduce((sum, hack) => {
        return sum + (hack.durationMinutes || 0);
      }, 0);

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
        totalDuration: totalDuration > 0 ? totalDuration : undefined,
        isLiked: userInteraction?.liked || false,
        isStarted: userInteraction?.started || false,
        isCompleted: userInteraction?.completed || false,
        progress
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
            time_minutes,
            duration_minutes
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
    let completedHackIds: string[] = [];
    if (userId) {
      const { data } = await supabase
        .from('user_routines')
        .select('routine_id, liked, started, completed, progress')
        .eq('user_id', userId);

      userRoutines = data || [];

      // Get all completed hacks for this user
      const { data: completedHacks } = await supabase
        .from('user_hacks')
        .select('hack_id')
        .eq('user_id', userId)
        .eq('viewed', true);

      completedHackIds = completedHacks?.map(h => h.hack_id) || [];
    }

    return (routines || []).map((routine: any) => {
      const userInteraction = userRoutines.find(ur => ur.routine_id === routine.id);

      // Sort hacks by position and filter out null hacks
      const sortedHacks = routine.routine_hacks
        ?.sort((a: any, b: any) => a.position - b.position)
        .filter((rh: any) => rh.hacks !== null)
        .map((rh: any) => ({
          ...rh.hacks,
          durationMinutes: rh.hacks.duration_minutes,
          position: rh.position
        })) || [];

      // Calculate progress based on completed hacks
      let progress = 0;
      if (userId && sortedHacks.length > 0) {
        const completedCount = sortedHacks.filter(hack =>
          completedHackIds.includes(hack.id)
        ).length;
        progress = Math.floor((completedCount / sortedHacks.length) * 100);
      }

      // Calculate total duration
      const totalDuration = sortedHacks.reduce((sum, hack) => {
        return sum + (hack.durationMinutes || 0);
      }, 0);

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
        totalDuration: totalDuration > 0 ? totalDuration : undefined,
        isLiked: userInteraction?.liked || false,
        isStarted: userInteraction?.started || false,
        isCompleted: userInteraction?.completed || false,
        progress
      };
    });
  } catch (error) {
    console.error('Error in getRoutines:', error);
    return [];
  }
}

export async function getUserRoutines(userId: string) {
  try {
    const supabase = await createClient();

    const { data: userRoutines, error } = await supabase
      .from('user_routines')
      .select(`
        *,
        routines (
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
              time_minutes,
              duration_minutes
            )
          ),
          routine_tags (
            tags (
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user routines:', error);
      return [];
    }

    // Get all completed hacks for this user
    const { data: completedHacks } = await supabase
      .from('user_hacks')
      .select('hack_id')
      .eq('user_id', userId)
      .eq('viewed', true);

    const completedHackIds = completedHacks?.map(h => h.hack_id) || [];

    return (userRoutines || []).map((userRoutine: any) => {
      const routine = userRoutine.routines;

      // Sort hacks by position and filter out null hacks
      const sortedHacks = routine.routine_hacks
        ?.sort((a: any, b: any) => a.position - b.position)
        .filter((rh: any) => rh.hacks !== null)
        .map((rh: any) => ({
          ...rh.hacks,
          durationMinutes: rh.hacks.duration_minutes,
          position: rh.position
        })) || [];

      // Calculate progress based on completed hacks
      let progress = 0;
      if (sortedHacks.length > 0) {
        const completedCount = sortedHacks.filter(hack =>
          completedHackIds.includes(hack.id)
        ).length;
        progress = Math.floor((completedCount / sortedHacks.length) * 100);
      }

      // Calculate total duration
      const totalDuration = sortedHacks.reduce((sum, hack) => {
        return sum + (hack.durationMinutes || 0);
      }, 0);

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
        totalDuration: totalDuration > 0 ? totalDuration : undefined,
        isLiked: userRoutine.liked || false,
        isStarted: userRoutine.started || false,
        isCompleted: userRoutine.completed || false,
        progress
      };
    });
  } catch (error) {
    console.error('Error in getUserRoutines:', error);
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
            time_minutes,
            duration_minutes
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

    // Get like count
    const { count: likeCount } = await supabase
      .from('user_routines')
      .select('*', { count: 'exact' })
      .eq('routine_id', routine.id)
      .eq('liked', true);

    // Sort hacks by position
    const sortedHacks = routine.routine_hacks
      ?.sort((a: any, b: any) => a.position - b.position)
      .map((rh: any) => ({
        ...rh.hacks,
        durationMinutes: rh.hacks.duration_minutes,
        position: rh.position
      })) || [];

    // Calculate total duration
    const totalDuration = sortedHacks.reduce((sum, hack) => {
      return sum + (hack.durationMinutes || 0);
    }, 0);

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
      totalDuration: totalDuration > 0 ? totalDuration : undefined,
      isLiked: userInteraction?.liked || false,
      isStarted: userInteraction?.started || false,
      isCompleted: userInteraction?.completed || false,
      progress: 0,
      likeCount: likeCount || 0
    };
  } catch (error) {
    console.error('Error in getRoutineBySlug:', error);
    return null;
  }
}