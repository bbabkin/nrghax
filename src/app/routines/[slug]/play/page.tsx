import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RoutinePlayer } from '@/components/routines/RoutinePlayer';
import { getRoutinePlayState } from '@/lib/routines/player-actions';

interface PlayRoutinePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PlayRoutinePage({ params }: PlayRoutinePageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?redirect=/routines/${resolvedParams.slug}/play`);
  }

  // Get routine with all hacks
  const { data: routine, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_hacks(
        position,
        hack:hacks(
          id,
          name,
          slug,
          description,
          media_type,
          media_url,
          content_type,
          content_body,
          external_link,
          image_url,
          image_path,
          difficulty,
          time_minutes
        )
      )
    `)
    .eq('slug', resolvedParams.slug)
    .single();

  if (error || !routine) {
    notFound();
  }

  // Check if user has access to this routine
  if (!routine.is_public) {
    // Check if user is admin or creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (routine.created_by !== user.id && !profile?.is_admin) {
      notFound();
    }
  }

  // Sort hacks by position
  const sortedHacks = routine.routine_hacks
    ?.sort((a: any, b: any) => a.position - b.position)
    .map((rh: any) => ({
      ...rh.hack,
      mediaType: rh.hack.media_type,
      mediaUrl: rh.hack.media_url,
      contentType: rh.hack.content_type,
      contentBody: rh.hack.content_body,
      externalLink: rh.hack.external_link,
      imageUrl: rh.hack.image_url,
      imagePath: rh.hack.image_path,
      timeMinutes: rh.hack.time_minutes,
    })) || [];

  // Get user's play state for this routine
  const playState = await getRoutinePlayState(routine.id);

  const routineData = {
    id: routine.id,
    name: routine.name,
    slug: routine.slug,
    description: routine.description,
    hacks: sortedHacks,
    currentPosition: playState.data?.currentPosition || 0,
  };

  return (
    <RoutinePlayer
      routine={routineData}
      user={{ id: user.id }}
      autoplayEnabled={playState.data?.autoplayEnabled ?? true}
    />
  );
}
