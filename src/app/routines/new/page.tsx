import { requireAuth } from '@/lib/auth/user';
import { RoutineForm } from '@/components/routines/RoutineForm';
import { createClient } from '@/lib/supabase/server';

export default async function NewRoutinePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get all hacks for selection with full details
  const { data: availableHacks } = await supabase
    .from('hacks')
    .select('id, name, slug, description, difficulty, time_minutes')
    .order('name', { ascending: true });

  // Get all tags for selection
  const { data: availableTags } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  // Transform data to match expected format
  const transformedHacks = (availableHacks || []).map(hack => ({
    id: hack.id,
    name: hack.name,
    slug: hack.slug,
    description: hack.description,
    difficulty: hack.difficulty,
    timeMinutes: hack.time_minutes
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create New Routine</h1>
      <RoutineForm
        availableHacks={transformedHacks}
        availableTags={availableTags || []}
        isAdmin={user.is_admin}
      />
    </div>
  );
}