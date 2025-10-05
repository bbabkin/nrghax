import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users, Heart, Play, Edit } from 'lucide-react';
import { toggleRoutineLike, startRoutine } from '@/lib/routines/actions';

interface Props {
  params: {
    slug: string;
  };
}

export default async function RoutinePage({ params }: Props) {
  const supabase = await createClient();

  // Try to get the current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get routine with all related data
  const { data: routine, error } = await supabase
    .from('routines')
    .select(`
      *,
      creator:profiles!routines_created_by_fkey(
        id,
        email,
        name
      ),
      routine_hacks(
        position,
        hack:hacks(*)
      ),
      routine_tags(
        tag:tags(*)
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (error || !routine) {
    notFound();
  }

  // Check if this is a private routine and user has access
  if (!routine.is_public) {
    if (!user || (routine.created_by !== user.id)) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id || '')
        .single();

      if (!profile?.is_admin) {
        notFound();
      }
    }
  }

  // Get user's relationship with this routine if logged in
  let userRoutine = null;
  if (user) {
    const { data } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', routine.id)
      .single();
    userRoutine = data;
  }

  // Sort hacks by position
  const sortedHacks = routine.routine_hacks
    ?.sort((a: any, b: any) => a.position - b.position)
    .map((rh: any) => rh.hack) || [];

  // Calculate total time
  const totalTime = sortedHacks.reduce((acc: number, hack: any) =>
    acc + (hack.time_minutes || 0), 0
  );

  // Get follower count
  const { count: followerCount } = await supabase
    .from('user_routines')
    .select('*', { count: 'exact' })
    .eq('routine_id', routine.id)
    .eq('started', true);

  const isOwner = user?.id === routine.created_by;

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.is_admin || false;
  }

  const canEdit = isOwner || isAdmin;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{routine.name}</h1>
            <p className="text-gray-600 text-lg">{routine.description}</p>
          </div>
          {canEdit && (
            <Link href={`/dashboard/routines/${routine.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {totalTime} minutes total
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {followerCount} followers
          </div>
          <div>
            Created by {routine.creator.name || routine.creator.email}
          </div>
          {routine.is_public && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>

        {/* Tags */}
        {routine.routine_tags && routine.routine_tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {routine.routine_tags.map((rt: any) => (
              <Badge key={rt.tag.id} variant="outline">
                {rt.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        {user && (
          <div className="flex gap-2">
            <form action={async () => {
              'use server';
              await startRoutine(routine.id);
            }}>
              <Button type="submit" variant={userRoutine?.started ? 'outline' : 'default'}>
                <Play className="h-4 w-4 mr-2" />
                {userRoutine?.started ? 'Continue' : 'Start Routine'}
              </Button>
            </form>

            <form action={async () => {
              'use server';
              await toggleRoutineLike(routine.id);
            }}>
              <Button type="submit" variant="outline">
                <Heart className={`h-4 w-4 mr-2 ${userRoutine?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                {userRoutine?.liked ? 'Liked' : 'Like'}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Progress (if user has started) */}
      {userRoutine?.started && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{userRoutine.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${userRoutine.progress || 0}%` }}
                />
              </div>
              {userRoutine.completed && (
                <Badge className="mt-2" variant="default">
                  Completed!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hacks List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">
          Hacks ({sortedHacks.length})
        </h2>

        {sortedHacks.map((hack: any, index: number) => (
          <Card key={hack.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {index + 1}. {hack.name}
                  </CardTitle>
                  <CardDescription>{hack.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {hack.difficulty && (
                    <Badge variant="outline">{hack.difficulty}</Badge>
                  )}
                  {hack.time_minutes && (
                    <Badge variant="secondary">{hack.time_minutes} min</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/hacks/${hack.slug || hack.id}`}>
                <Button variant="outline" size="sm">
                  View Hack
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}