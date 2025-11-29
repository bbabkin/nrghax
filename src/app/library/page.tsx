import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/user';
import { LibraryView } from '@/components/library/LibraryView';

// Helper to convert image_path to full URL
function getImageUrl(supabaseUrl: string, imagePath: string | null, imageUrl: string | null): string {
  if (imageUrl) return imageUrl;
  if (imagePath) {
    return `${supabaseUrl}/storage/v1/object/public/hack-images/${imagePath}`;
  }
  return '';
}

async function getHacks() {
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

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
    image_url: getImageUrl(supabaseUrl, hack.image_path, hack.image_url),
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
      completion_count: 0,
      completed: !!p.completed_at
    };
  });

  return progressMap;
}

export const metadata = {
  title: 'Library - NRGHax',
  description: 'Browse all hacks and routines',
}

export default async function LibraryPage() {
  const user = await getCurrentUser();

  const [allHacks, routines] = await Promise.all([
    getHacks(),
    getRoutines()
  ]);

  const userProgress = user ? await getUserProgress(user.id) : {};

  // Merge progress into items
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

  return (
    <LibraryView
      hacks={hacksWithProgress}
      routines={routinesWithProgress}
      isAuthenticated={!!user}
      isAdmin={user?.is_admin || false}
      currentUserId={user?.id}
    />
  );
}
