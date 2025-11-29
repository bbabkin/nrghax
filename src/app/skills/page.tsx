import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import { SimpleSkillsView } from '@/components/skills/SimpleSkillsView';

// Helper to convert image_path to full URL
function getImageUrl(supabaseUrl: string, imagePath: string | null, imageUrl: string | null): string {
  if (imageUrl) return imageUrl;
  if (imagePath) {
    return `${supabaseUrl}/storage/v1/object/public/hack-images/${imagePath}`;
  }
  return '';
}

async function getHacksForLevel(levelId: string, supabaseUrl: string) {
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
    image_url: getImageUrl(supabaseUrl, hack.image_path, hack.image_url),
    duration_minutes: hack.duration_minutes,
    position: hack.position,
    tags: hack.hack_tags?.map((ht: any) => ht.tags).filter(Boolean) || [],
    prerequisites: hackPrerequisites[hack.id] || [],
  }));
}

async function getUserProgress(userId: string) {
  const supabase = await createClient();

  const { data: hackProgress } = await supabase
    .from('user_hacks')
    .select('hack_id, completion_count, completed_at')
    .eq('user_id', userId);

  const progressMap: Record<string, any> = {};

  hackProgress?.forEach(p => {
    progressMap[`hack-${p.hack_id}`] = {
      completion_count: p.completion_count || 0,
      completed: !!p.completed_at
    };
  });

  return progressMap;
}

export const metadata = {
  title: 'Skills - NRGHax',
  description: 'Master your skills through our gamified progression system',
}

export default async function SkillsPage() {
  const user = await getCurrentUser();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

  // Get ALL levels ordered by position
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from('levels')
    .select('id, name, slug, position')
    .order('position', { ascending: true }); // Foundation/starter skills first at top

  if (!levels || levels.length === 0) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-600">No levels found</div>;
  }

  // Get hacks for each level
  const levelsWithHacks = await Promise.all(
    levels.map(async (level) => {
      const levelHacks = await getHacksForLevel(level.id, supabaseUrl);
      return {
        ...level,
        hacks: levelHacks
      };
    })
  );

  const userProgress = user ? await getUserProgress(user.id) : {};

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

  // Build user completions map
  const userCompletions: Record<string, { completed: boolean; completion_count: number }> = {};
  levelsWithProgress.forEach(level => {
    level.hacks.forEach(hack => {
      userCompletions[`hack-${hack.id}`] = {
        completed: hack.is_completed || false,
        completion_count: hack.completion_count || 0
      };
    });
  });

  return (
    <SimpleSkillsView
      levels={levelsWithProgress}
      userCompletions={userCompletions}
      isAuthenticated={!!user}
    />
  );
}
