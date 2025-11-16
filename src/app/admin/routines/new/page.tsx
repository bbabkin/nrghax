import { requireAdmin } from '@/lib/auth/user';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { RoutineForm } from '@/components/admin/RoutineForm';

export const metadata = {
  title: 'New Routine - Admin',
  description: 'Create a new routine',
};

export default async function NewRoutinePage() {
  await requireAdmin();

  const supabase = await createClient();

  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name');

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
            Create New Routine
          </h1>
          <div className="w-32 h-1 bg-yellow-400 mb-4" />
        </div>

        {/* Form */}
        <div className="bg-gray-900 border-2 border-yellow-400/30 p-8"
          style={{
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        >
          <RoutineForm tags={tags || []} />
        </div>
      </div>
    </div>
  );
}
