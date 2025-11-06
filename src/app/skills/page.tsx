import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import { UnifiedCanvas } from '@/components/levels/UnifiedCanvas';

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

async function getHackPrerequisites(levelId: string) {
  const supabase = await createClient();

  const { data: prerequisites, error } = await supabase
    .from('hack_prerequisites')
    .select('hack_id, prerequisite_hack_id')
    .in('hack_id',
      await supabase
        .from('hacks')
        .select('id')
        .eq('level_id', levelId)
        .then(res => res.data?.map(h => h.id) || [])
    );

  if (error) {
    console.error('Error fetching prerequisites:', error);
    return [];
  }

  return prerequisites || [];
}

async function getAllHacks() {
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

async function getUserProgress(userId: string, levelId: string) {
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

export default async function SkillsViewPage() {
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

  // Get data for skills view
  const levelHacks = await getHacksForLevel(firstLevel.id);
  const prerequisites = await getHackPrerequisites(firstLevel.id);

  // Get data for library view
  const [allHacks, routines] = await Promise.all([
    getAllHacks(),
    getRoutines()
  ]);

  // Get user progress
  const userProgress = user ? await getUserProgress(user.id, firstLevel.id) : {};

  // Merge prerequisites and progress into skills hacks
  const skillsHacksWithData = levelHacks.map(hack => ({
    ...hack,
    level_id: firstLevel.id,
    prerequisites: prerequisites
      .filter((p: any) => p.hack_id === hack.id)
      .map((p: any) => p.prerequisite_hack_id),
    is_completed: userProgress[`hack-${hack.id}`]?.completed || false,
    completion_count: userProgress[`hack-${hack.id}`]?.completion_count || 0
  }));

  // Merge progress into library items
  const libraryHacksWithProgress = allHacks.map(hack => ({
    ...hack,
    is_completed: userProgress[`hack-${hack.id}`]?.completed || false,
    completion_count: userProgress[`hack-${hack.id}`]?.completion_count || 0
  }));

  const routinesWithProgress = routines.map(routine => ({
    ...routine,
    is_completed: userProgress[`routine-${routine.id}`]?.completed || false,
    completion_count: userProgress[`routine-${routine.id}`]?.completion_count || 0
  }));

  return (
    <UnifiedCanvas
      skillsData={{
        hacks: skillsHacksWithData,
        levelSlug: firstLevel.slug,
        levelName: firstLevel.name
      }}
      libraryData={{
        hacks: libraryHacksWithProgress,
        routines: routinesWithProgress
      }}
      isAuthenticated={!!user}
      user={user ? {
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.avatar_url || undefined,
      } : undefined}
    />
  );
}