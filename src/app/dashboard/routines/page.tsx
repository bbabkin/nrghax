import { getCurrentUser } from '@/lib/auth/user';
import { getUserRoutines, getRoutines } from '@/lib/routines/supabase-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Globe, Lock, Users, BookOpen, Clock,
  Heart, PlayCircle, CheckCircle2, Edit, Trash2
} from 'lucide-react';
import { deleteRoutine } from '@/lib/routines/supabase-actions';

async function RoutineCard({ routine, canEdit }: { routine: any; canEdit: boolean }) {
  // Calculate total time
  const totalMinutes = routine.hacks?.reduce((sum: number, hack: any) =>
    sum + (hack.timeMinutes || 0), 0
  ) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Get image source
  const getImageSrc = () => {
    if (routine.imagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
      return `${supabaseUrl}/storage/v1/object/public/routine-images/${routine.imagePath}`;
    }
    return routine.imageUrl || '/placeholder-routine.svg';
  };

  async function handleDelete() {
    'use server';
    await deleteRoutine(routine.id);
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <Image
          src={getImageSrc()}
          alt={routine.name}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
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

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">
              <Link
                href={`/routines/${routine.slug}`}
                className="hover:underline"
              >
                {routine.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {routine.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
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
          </div>

          {/* Status badges */}
          <div className="flex gap-2">
            {routine.isStarted && !routine.isCompleted && (
              <Badge variant="secondary">
                <PlayCircle className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            )}
            {routine.isCompleted && (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {routine.isLiked && (
              <Badge variant="outline">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Liked
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {routine.progress !== undefined && routine.progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${routine.progress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2 pt-2 border-t">
              <Link href={`/dashboard/routines/${routine.id}/edit`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <form action={handleDelete} className="flex-1">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardRoutinesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Please log in to manage your routines.</p>
            <Link href="/auth">
              <Button className="mt-4">Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get user's own routines
  const myRoutines = await getRoutines(user.id);
  const userRoutines = await getUserRoutines(user.id);

  // Separate own routines from followed routines
  const ownRoutines = myRoutines.filter(r => r.createdBy === user.id);
  const followedRoutines = userRoutines.filter(r => r.createdBy !== user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Routines</h1>
            <p className="text-gray-600 mt-2">
              Create and manage your energy hack routines
            </p>
          </div>
          <Link href="/dashboard/routines/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Routine
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="my-routines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-routines">
            My Routines ({ownRoutines.length})
          </TabsTrigger>
          <TabsTrigger value="following">
            Following ({followedRoutines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-routines" className="space-y-4">
          {ownRoutines.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No routines yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first routine to organize your energy hacks
                </p>
                <Link href="/dashboard/routines/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Routine
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  canEdit={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {followedRoutines.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Not following any routines</h3>
                <p className="text-gray-600 mb-4">
                  Discover public routines to follow
                </p>
                <Link href="/routines">
                  <Button variant="outline">
                    Browse Public Routines
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedRoutines.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  canEdit={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}