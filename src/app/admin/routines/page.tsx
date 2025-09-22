import { requireAdmin } from '@/lib/auth/supabase-user';
import { getRoutines } from '@/lib/routines/supabase-utils';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Globe, Lock, Users, BookOpen, Clock, User,
  Heart, Eye, Edit, Trash2, ToggleLeft, ToggleRight,
  Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import { deleteRoutine, toggleRoutinePublic } from '@/lib/routines/supabase-actions';

async function getAllRoutines() {
  const supabase = await createClient();

  const { data: routines, error } = await supabase
    .from('routines')
    .select(`
      *,
      profiles!routines_created_by_fkey (
        id,
        name,
        email,
        avatar_url
      ),
      routine_hacks (
        position
      ),
      user_routines (
        liked,
        started
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all routines:', error);
    return [];
  }

  return routines || [];
}

async function RoutineRow({ routine }: { routine: any }) {
  const hackCount = routine.routine_hacks?.length || 0;
  const likeCount = routine.user_routines?.filter((ur: any) => ur.liked).length || 0;
  const startCount = routine.user_routines?.filter((ur: any) => ur.started).length || 0;

  async function handleDelete() {
    'use server';
    await deleteRoutine(routine.id);
  }

  async function handleTogglePublic() {
    'use server';
    await toggleRoutinePublic(routine.id);
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {routine.image_url || routine.image_path ? (
            <Image
              src={routine.image_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/routine-images/${routine.image_path}`
                : routine.image_url
              }
              alt={routine.name}
              width={40}
              height={40}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <Link
              href={`/routines/${routine.slug}`}
              className="font-medium hover:underline"
            >
              {routine.name}
            </Link>
            <p className="text-sm text-gray-500 line-clamp-1">
              {routine.description}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          {routine.profiles?.avatar_url ? (
            <img
              src={routine.profiles.avatar_url}
              alt={routine.profiles.name || 'Creator'}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <User className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm">
            {routine.profiles?.name || routine.profiles?.email || 'Unknown'}
          </span>
        </div>
      </TableCell>

      <TableCell>
        {routine.is_public ? (
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
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {hackCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {likeCount}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {startCount}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <span className="text-sm text-gray-500">
          {new Date(routine.created_at).toLocaleDateString()}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <form action={handleTogglePublic}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              title={routine.is_public ? "Make Private" : "Make Public"}
            >
              {routine.is_public ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </form>

          <Link href={`/dashboard/routines/${routine.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>

          <form action={handleDelete}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default async function AdminRoutinesPage() {
  await requireAdmin();
  const routines = await getAllRoutines();

  const publicRoutines = routines.filter(r => r.is_public);
  const privateRoutines = routines.filter(r => !r.is_public);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage Routines</h1>
            <p className="text-gray-600 mt-2">
              Oversee and manage all user routines
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Routines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routines.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Public Routines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {publicRoutines.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Private Routines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {privateRoutines.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(routines.map(r => r.created_by)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search routines..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Routines Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Routines ({routines.length})
          </TabsTrigger>
          <TabsTrigger value="public">
            Public ({publicRoutines.length})
          </TabsTrigger>
          <TabsTrigger value="private">
            Private ({privateRoutines.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Routines</CardTitle>
              <CardDescription>
                Manage all routines in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Routine</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routines.map(routine => (
                    <RoutineRow key={routine.id} routine={routine} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="public">
          <Card>
            <CardHeader>
              <CardTitle>Public Routines</CardTitle>
              <CardDescription>
                Routines visible to all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Routine</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicRoutines.map(routine => (
                    <RoutineRow key={routine.id} routine={routine} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private">
          <Card>
            <CardHeader>
              <CardTitle>Private Routines</CardTitle>
              <CardDescription>
                User's personal routines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Routine</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privateRoutines.map(routine => (
                    <RoutineRow key={routine.id} routine={routine} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}