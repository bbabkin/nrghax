import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import { SkillTreeView } from '@/components/skills/SkillTreeView';
import { redirect } from 'next/navigation';

async function getHacksForLevel(levelId: string) {
  const supabase = await createClient();

  // Get all hacks for this level
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

async function getUserProgress(userId: string, levelId: string) {
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from('user_hacks')
    .select('hack_id, completion_count, completed_at')
    .eq('user_id', userId)
    .in('hack_id',
      await supabase
        .from('hacks')
        .select('id')
        .eq('level_id', levelId)
        .then(res => res.data?.map(h => h.id) || [])
    );

  const progressMap: Record<string, any> = {};
  progress?.forEach(p => {
    progressMap[p.hack_id] = {
      completion_count: p.completion_count || 0,
      completed: !!p.completed_at
    };
  });

  return progressMap;
}

export default async function SkillsViewPage() {
  const user = await getCurrentUser();

  // Get the first level (Foundation)
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

  const hacks = await getHacksForLevel(firstLevel.id);
  const prerequisites = await getHackPrerequisites(firstLevel.id);
  const userProgress = user ? await getUserProgress(user.id, firstLevel.id) : {};

  return (
    <SkillTreeView
      levelId={firstLevel.id}
      levelName={firstLevel.name}
      hacks={hacks}
      prerequisites={prerequisites}
      userProgress={userProgress}
    />
  );
}