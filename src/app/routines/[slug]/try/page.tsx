import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnonymousRoutinePlayer } from '@/components/routines/AnonymousRoutinePlayer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import Link from 'next/link';

interface TryRoutinePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function TryRoutinePage({ params }: TryRoutinePageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to the full player
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You&apos;re already signed in! Redirecting to the full routine player...
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/routines/${resolvedParams.slug}/play`}>
            <Button>Go to Full Player</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get routine with all hacks (public data only)
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
          time_minutes,
          category
        )
      )
    `)
    .eq('slug', resolvedParams.slug)
    .eq('is_public', true) // Only allow public routines for anonymous users
    .single();

  if (error || !routine) {
    notFound();
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

  const routineData = {
    id: routine.id,
    name: routine.name,
    slug: routine.slug,
    description: routine.description,
    hacks: sortedHacks,
  };

  return <AnonymousRoutinePlayer routine={routineData} />;
}