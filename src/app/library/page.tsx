import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import { UnifiedCanvas } from '@/components/levels/UnifiedCanvas';

async function getHacks() {
  const supabase = await createClient();

  const { data: hacks, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags (
        tags (
          id,
          name,
          slug
        )
      )
    `)
    .order('position');

  if (error) {
    console.error('Error fetching hacks:', error);
    return [];
  }

  return hacks.map(hack => ({
    id: hack.id,
    name: hack.name,
    slug: hack.slug,
    description: hack.description,
    image_url: hack.image_url || '',
    duration_minutes: hack.duration_minutes,
    tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
  }));
}

async function getRoutines() {
  const supabase = await createClient();

  const { data: routines, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_tags (
        tags (
          id,
          name,
          slug
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching routines:', error);
    return [];
  }

  return routines.map(routine => ({
    id: routine.id,
    name: routine.name,
    slug: routine.slug,
    description: routine.description,
    image_url: routine.image_url || '',
    tags: routine.routine_tags?.map((rt: any) => rt.tags).filter(Boolean) || [],
  }));
}

async function getUserProgress(userId: string) {
  const supabase = await createClient();

  const { data: hackProgress } = await supabase
    .from('user_hacks')
    .select('hack_id, completion_count, completed_at')
    .eq('user_id', userId);

  const { data: routineProgress } = await supabase
    .from('user_routines')
    .select('routine_id, completed_at')
    .eq('user_id', userId);

  const progressMap: Record<string, any> = {};

  hackProgress?.forEach(p => {
    progressMap[`hack-${p.hack_id}`] = {
      completion_count: p.completion_count || 0,
      completed: !!p.completed_at
    };
  });

  routineProgress?.forEach(p => {
    progressMap[`routine-${p.routine_id}`] = {
      completion_count: 0, // Routines don't track completion count
      completed: !!p.completed_at
    };
  });

  return progressMap;
}

async function getHacksForLevel(levelId: string) {
  const supabase = await createClient();

  const { data: hacks, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags (
        tags (
          id,
          name,
          slug
        )
      )
    `)
    .eq('level_id', levelId)
    .order('position');

  if (error) {
    console.error('Error fetching hacks:', error);
    return [];
  }

  return hacks.map(hack => ({
    id: hack.id,
    name: hack.name,
    slug: hack.slug,
    description: hack.description,
    image_url: hack.image_url || '',
    duration_minutes: hack.duration_minutes,
    tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
  }));
}

export default async function LibraryPage() {
  const user = await getCurrentUser();

  // Get the first level (Foundation) for skills view
  const supabase = await createClient();
  const { data: firstLevel } = await supabase
    .from('levels')
    .select('id, name, slug')
    .order('position')
    .limit(1)
    .single();

  if (!firstLevel) {
    return <div>No levels found</div>;
  }

  // Get all data needed for both views
  const [allHacks, routines, levelHacks] = await Promise.all([
    getHacks(),
    getRoutines(),
    getHacksForLevel(firstLevel.id)
  ]);

  const userProgress = user ? await getUserProgress(user.id) : {};

  // Merge progress into library items
  const hacksWithProgress = allHacks.map(hack => ({
    ...hack,
    is_completed: userProgress[`hack-${hack.id}`]?.completed || false,
    completion_count: userProgress[`hack-${hack.id}`]?.completion_count || 0
  }));

  const routinesWithProgress = routines.map(routine => ({
    ...routine,
    is_completed: userProgress[`routine-${routine.id}`]?.completed || false,
    completion_count: userProgress[`routine-${routine.id}`]?.completion_count || 0
  }));

  // Merge progress into skills hacks
  const skillsHacksWithData = levelHacks.map(hack => ({
    ...hack,
    level_id: firstLevel.id,
    is_completed: userProgress[`hack-${hack.id}`]?.completed || false,
    completion_count: userProgress[`hack-${hack.id}`]?.completion_count || 0
  }));

  return (
    <UnifiedCanvas
      skillsData={{
        hacks: skillsHacksWithData,
        levelSlug: firstLevel.slug,
        levelName: firstLevel.name
      }}
      libraryData={{
        hacks: hacksWithProgress,
        routines: routinesWithProgress
      }}
      isAuthenticated={!!user}
      user={user ? {
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.avatar_url || undefined,
      } : undefined}
      initialView="library"
    />
  );
}