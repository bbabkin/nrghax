import { requireAuth } from '@/lib/auth/user';
import { getUserRoutines } from '@/lib/routines/utils';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default async function RoutinesPage() {
  const user = await requireAuth();
  const routines = await getUserRoutines(user.id);

  // Separate routines by category
  const myRoutines = routines.filter(r => r.createdBy === user.id);
  const savedRoutines = routines.filter(r => r.createdBy !== user.id && (r.isLiked || r.isStarted));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Routines</h1>
          <p className="text-gray-600">
            Manage your learning routines and track your progress.
          </p>
        </div>
        <Link href="/routines/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Routine
          </Button>
        </Link>
      </div>

      {/* My Created Routines */}
      {myRoutines.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Created by You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myRoutines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                currentUserId={user.id}
                isAdmin={user.is_admin}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved/Started Routines */}
      {savedRoutines.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Saved Routines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRoutines.map(routine => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                currentUserId={user.id}
                isAdmin={user.is_admin}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {routines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            You haven&apos;t created or saved any routines yet.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/routines/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Routine
              </Button>
            </Link>
            <Link href="/hacks">
              <Button variant="outline">
                Browse Public Routines
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}