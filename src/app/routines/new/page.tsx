import { requireAuth } from '@/lib/auth/user';
import { RoutineForm } from '@/components/routines/RoutineForm';
import prisma from '@/lib/db';

export default async function NewRoutinePage() {
  const user = await requireAuth();

  // Get all hacks for selection with full details
  const availableHacks = await prisma.hack.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      difficulty: true,
      timeMinutes: true
    },
    orderBy: { name: 'asc' }
  });

  // Get all tags for selection
  const availableTags = await prisma.tag.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Routine</h1>
      <RoutineForm
        availableHacks={availableHacks}
        availableTags={availableTags}
        isAdmin={user.isAdmin}
      />
    </div>
  );
}