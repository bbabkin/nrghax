import { requireAdmin } from '@/lib/auth/user';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Edit } from 'lucide-react';
import { DeleteRoutineButton } from '@/components/admin/DeleteRoutineButton';

export const metadata = {
  title: 'Manage Routines - Admin',
  description: 'Create and manage routines',
};

export default async function RoutinesAdminPage() {
  await requireAdmin();

  const supabase = await createClient();

  // Fetch all routines
  const { data: routines, error } = await supabase
    .from('routines')
    .select(`
      *,
      routine_tags (
        tags (
          id,
          name,
          slug
        )
      ),
      routine_hacks (
        hacks (
          id,
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching routines:', error);
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-block text-yellow-400 hover:text-yellow-300 mb-6 transition-colors"
          >
            ← Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
                Manage Routines
              </h1>
              <div className="w-32 h-1 bg-yellow-400 mb-4" />
              <p className="text-gray-400">
                Create and manage routine collections
              </p>
            </div>
            <Link
              href="/admin/routines/new"
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              }}
            >
              <Plus className="h-5 w-5" />
              New Routine
            </Link>
          </div>
        </div>

        {/* Routines List */}
        {!routines || routines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-6">No routines found</p>
            <Link
              href="/admin/routines/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
              style={{
                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              }}
            >
              <Plus className="h-5 w-5" />
              Create Your First Routine
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map((routine: any) => (
              <div
                key={routine.id}
                className="bg-gray-900 border-2 border-yellow-400/30 p-6 relative group"
                style={{
                  clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                }}
              >
                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {routine.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-3">
                    {routine.description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-500 mb-3">
                    <div>
                      <span className="font-semibold text-yellow-400">
                        {routine.routine_hacks?.length || 0}
                      </span>{' '}
                      hacks
                    </div>
                    {routine.duration_minutes && (
                      <div>
                        <span className="font-semibold text-yellow-400">
                          {routine.duration_minutes}
                        </span>{' '}
                        min
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {routine.routine_tags && routine.routine_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {routine.routine_tags.map((rt: any) => (
                        <span
                          key={rt.tags.id}
                          className="px-2 py-1 bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 text-xs rounded"
                        >
                          {rt.tags.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/admin/routines/${routine.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
                    style={{
                      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <DeleteRoutineButton
                    routineId={routine.id}
                    routineName={routine.name}
                  />
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
