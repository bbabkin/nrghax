import { requireAdmin } from '@/lib/auth/user';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoutineForm } from '@/components/admin/RoutineForm';

export const metadata = {
  title: 'Edit Routine - Admin',
  description: 'Edit routine details',
};

interface EditRoutinePageProps {
  params: {
    id: string;
  };
}

export default async function EditRoutinePage({ params }: EditRoutinePageProps) {
  await requireAdmin();

  const supabase = await createClient();

  // Fetch the routine
  const { data: routine, error } = await supabase
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
    .eq('id', params.id)
    .single();

  if (error || !routine) {
    notFound();
  }

  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name');

  // Extract selected tag IDs
  const selectedTagIds = routine.routine_tags?.map((rt: any) => rt.tags.id) || [];

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/routines"
            className="inline-block text-yellow-400 hover:text-yellow-300 mb-6 transition-colors"
          >
            ← Back to Routines
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
            Edit Routine
          </h1>
          <div className="w-32 h-1 bg-yellow-400 mb-4" />
          <p className="text-gray-400">{routine.name}</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border-2 border-yellow-400/30 p-8"
          style={{
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        >
          <RoutineForm
            routine={routine}
            tags={tags || []}
            selectedTagIds={selectedTagIds}
          />
        </div>
      </div>
    </div>
  );
}
