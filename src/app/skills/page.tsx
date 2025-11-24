import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import dynamic from 'next/dynamic';

const CanvasLayout = dynamic(() => import('@/components/levels/CanvasLayout').then(mod => mod.CanvasLayout), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black flex items-center justify-center">Loading...</div>
});

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

  // Get hack prerequisites
  const hackIds = hacks.map(h => h.id);
  const { data: hackPrereqs } = await supabase
    .from('hack_prerequisites')
    .select('hack_id, prerequisite_hack_id')
    .in('hack_id', hackIds);

  // Build prerequisite map
  const hackPrerequisites: Record<string, string[]> = {};
  if (hackPrereqs) {
    hackPrereqs.forEach((prereq) => {
      if (!hackPrerequisites[prereq.hack_id]) {
        hackPrerequisites[prereq.hack_id] = [];
      }
      hackPrerequisites[prereq.hack_id].push(prereq.prerequisite_hack_id);
    });
  }

  return hacks.map(hack => ({
    id: hack.id,
    name: hack.name,
    slug: hack.slug,
    description: hack.description,
    image_url: hack.image_url || '',
    duration_minutes: hack.duration_minutes,
    tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
    prerequisites: hackPrerequisites[hack.id] || [],
  }));
}

export const metadata = {
  title: 'Skills - NRGHax',
  description: 'Master your skills through our gamified progression system',
}

export default async function SkillsPage() {
  const user = await getCurrentUser();

  // Get ALL levels ordered by position
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from('levels')
    .select('id, name, slug, position')
    .order('position', { ascending: false }); // Reverse order so foundation is at bottom

  if (!levels || levels.length === 0) {
    return <div>No levels found</div>;
  }

  // Get hacks for each level
  const levelsWithHacks = await Promise.all(
    levels.map(async (level) => {
      const levelHacks = await getHacksForLevel(level.id);
      return {
        ...level,
        hacks: levelHacks
      };
    })
  );

  // Get all data needed for library view
  const [allHacks, routines] = await Promise.all([
    getHacks(),
    getRoutines()
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

  // Merge progress into skills hacks for all levels
  const levelsWithProgress = levelsWithHacks.map(level => ({
    ...level,
    hacks: level.hacks.map(hack => ({
      ...hack,
      level_id: level.id,
      is_completed: userProgress[`hack-${hack.id}`]?.completed || false,
      completion_count: userProgress[`hack-${hack.id}`]?.completion_count || 0
    }))
  }));

  return (
    <CanvasLayout
      skillsData={{
        levels: levelsWithProgress,
        levelSlug: levels[0].slug, // Keep first level slug for compatibility
        levelName: levels[0].name  // Keep first level name for compatibility
      }}
      libraryData={{
        hacks: hacksWithProgress,
        routines: routinesWithProgress
      }}
      isAuthenticated={!!user}
      isAdmin={user?.is_admin || false}
      user={user ? {
        name: user.name || undefined,
        email: user.email || undefined,
        image: user.avatar_url || undefined,
      } : undefined}
      initialView="skills"
    />
  );
}