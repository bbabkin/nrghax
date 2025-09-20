import { getRoutineBySlug } from '@/lib/routines/utils';
import { getCurrentUser } from '@/lib/auth/user';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HackCard } from '@/components/hacks/HackCard';
import {
  Heart, Globe, Lock, PlayCircle, CheckCircle2,
  ArrowLeft, Edit, Users, BookOpen, Clock
} from 'lucide-react';
import { startRoutine, toggleRoutineLike } from '@/lib/routines/actions';

async function RoutineActions({
  routineId,
  isLiked,
  likeCount,
  isStarted,
  isCompleted
}: {
  routineId: string;
  isLiked: boolean;
  likeCount: number;
  isStarted: boolean;
  isCompleted: boolean;
}) {
  async function handleLike() {
    'use server';
    await toggleRoutineLike(routineId);
  }

  async function handleStart() {
    'use server';
    await startRoutine(routineId);
  }

  return (
    <div className="flex gap-3">
      <form action={handleLike}>
        <Button
          type="submit"
          variant={isLiked ? "default" : "outline"}
          size="sm"
        >
          <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
          {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
        </Button>
      </form>

      {!isStarted && !isCompleted && (
        <form action={handleStart}>
          <Button type="submit" size="sm">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Routine
          </Button>
        </form>
      )}

      {isCompleted && (
        <Badge className="bg-green-500">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Completed
        </Badge>
      )}
    </div>
  );
}

export default async function RoutinePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  const routine = await getRoutineBySlug(resolvedParams.slug);

  if (!routine) {
    notFound();
  }

  const isOwner = user?.id === routine.createdBy;
  const canEdit = isOwner || user?.isAdmin;

  // Calculate total time
  const totalMinutes = routine.hacks.reduce((sum, hack) =>
    sum + (hack.timeMinutes || 0), 0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Get image source
  const getImageSrc = () => {
    if (routine.imagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/routine-images/${routine.imagePath}`;
    }
    return routine.imageUrl || 'data:image/svg+xml,%3Csvg width="800" height="400" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="400" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="24" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Link */}
      <Link
        href="/routines"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Routines
      </Link>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-6">
          <Image
            src={getImageSrc()}
            alt={routine.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 right-4 flex gap-2">
            {routine.isPublic ? (
              <Badge className="bg-green-500">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{routine.name}</h1>
              {canEdit && (
                <Link href={`/routines/${routine.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-gray-600 mb-4">{routine.description}</p>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {routine.creator.image ? (
              <img
                src={routine.creator.image}
                alt={routine.creator.name || 'Creator'}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            )}
            <span>Created by {routine.creator.name || routine.creator.email}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {routine._count?.routineHacks || 0} hacks
            </span>
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {routine._count?.userRoutines || 0} users
            </span>
          </div>

          {/* Tags */}
          {routine.tags && routine.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {routine.tags.map(tag => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          {user && (
            <RoutineActions
              routineId={routine.id}
              isLiked={routine.isLiked || false}
              likeCount={routine.likeCount || 0}
              isStarted={routine.isStarted || false}
              isCompleted={routine.isCompleted || false}
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {user && routine.progress !== undefined && routine.progress > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{routine.progress}% Complete</span>
                <span>
                  {Math.floor(routine.hacks.length * routine.progress / 100)} of{' '}
                  {routine.hacks.length} hacks completed
                </span>
              </div>
              <Progress value={routine.progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hacks List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Hacks in this Routine ({routine.hacks.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routine.hacks.map((hack, index) => (
            <div key={hack.id} className="relative">
              <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <HackCard
                hack={{
                  id: hack.id,
                  name: hack.name,
                  slug: hack.slug,
                  description: hack.description,
                  image_url: hack.imageUrl || '',
                  image_path: hack.imagePath,
                  content_type: hack.contentType as 'content' | 'link',
                  external_link: hack.externalLink,
                  tags: hack.tags
                }}
                showActions={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}