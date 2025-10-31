'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { HackCard } from './HackCard';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LibraryViewProps {
  hacks: any[];
  routines: any[];
  userRoutines?: any[];
  isAuthenticated: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function LibraryView({
  hacks,
  routines,
  userRoutines = [],
  isAuthenticated,
  currentUserId,
  isAdmin = false
}: LibraryViewProps) {
  // Combine public routines with user's private routines
  const allRoutines = useMemo(() => {
    const routineMap = new Map();

    // Add public routines
    routines.forEach(r => routineMap.set(r.id, r));

    // Add/override with user routines (includes both public and private)
    userRoutines.forEach(r => routineMap.set(r.id, r));

    return Array.from(routineMap.values());
  }, [routines, userRoutines]);

  // Take first 6 of each for the library view
  const displayRoutines = allRoutines.slice(0, 6);
  const displayHacks = hacks.slice(0, 12);

  // Add demo completion data for showcasing color progression (when not authenticated)
  const enhancedHacks = displayHacks.map((hack, idx) => {
    // Only add demo data if user is not authenticated
    if (!isAuthenticated) {
      // Create a varied pattern to show all colors
      if (idx % 5 === 0) return { ...hack, completion_count: 1 }; // Green
      if (idx % 5 === 1) return { ...hack, completion_count: 5 }; // Blue
      if (idx % 5 === 2) return { ...hack, completion_count: 25 }; // Purple
      if (idx % 5 === 3) return { ...hack, completion_count: 100 }; // Orange
    }
    return hack; // Keep original data or Gray (no completions)
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Routines Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400 uppercase">Routines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                isOwner={routine.created_by === currentUserId}
                isPublic={routine.is_public}
                hackCount={routine.hack_count}
                creator={routine.creator}
              />
            ))}
            {displayRoutines.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 mb-4">No routines available yet.</p>
                {isAuthenticated && (
                  <Link href="/routines/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Routine
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Hacks Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6 text-yellow-400 uppercase">Hax</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enhancedHacks.map((hack) => (
              <HackCard
                key={hack.id}
                hack={hack}
                hasIncompletePrerequisites={hack.hasIncompletePrerequisites}
                isAdmin={isAdmin}
                showActions={true}
              />
            ))}
            {displayHacks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No hacks available yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}