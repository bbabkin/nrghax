'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Zap, ListChecks } from 'lucide-react';
import { HacksList } from './HacksList';
import { HackCard } from './HackCard';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { cn } from '@/lib/utils';
import { useLocalVisits } from '@/hooks/useLocalVisits';
import { useToast } from '@/components/ui/use-toast';
import { BrainCircuit } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableHackCard } from '@/components/admin/SortableHackCard';
import { updateHackPositions } from '@/lib/hacks/supabase-actions';

interface HacksPageContentProps {
  hacks: any[];
  routines: any[];
  userRoutines?: any[];
  isAuthenticated: boolean;
  currentUserId?: string;
  isAdmin?: boolean;
}

export function HacksPageContent({
  hacks,
  routines,
  userRoutines = [],
  isAuthenticated,
  currentUserId,
  isAdmin = false
}: HacksPageContentProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [sortableHacks, setSortableHacks] = useState(hacks);
  const [isSaving, setIsSaving] = useState(false);
  const { visitedHacks } = useLocalVisits();
  const { toast } = useToast();

  // Initialize drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Debug logging
  console.log('[HacksPageContent] Props received:', {
    isAdmin,
    isAuthenticated,
    currentUserId,
    hacksCount: hacks.length,
    routinesCount: routines.length,
    activeTab,
    isAdminMode
  });

  // Sync sortableHacks when hacks prop changes
  useEffect(() => {
    setSortableHacks(hacks);
  }, [hacks]);

  // Handle drag end for reordering hacks
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('[DragEnd] Active:', active.id, 'Over:', over?.id);

    if (!over || active.id === over.id) {
      return;
    }

    // Find the indices of the dragged items
    const oldIndex = sortableHacks.findIndex((hack) => hack.id === active.id);
    const newIndex = sortableHacks.findIndex((hack) => hack.id === over.id);

    console.log('[DragEnd] Old index:', oldIndex, 'New index:', newIndex);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state immediately for smooth UX
    const newHacks = arrayMove(sortableHacks, oldIndex, newIndex);
    setSortableHacks(newHacks);

    // Save to database
    setIsSaving(true);
    try {
      const hackIds = newHacks.map((hack) => hack.id);
      await updateHackPositions(hackIds);

      toast({
        title: 'Success',
        description: 'Hack order updated successfully',
      });
    } catch (error) {
      console.error('Failed to update hack positions:', error);

      // Revert on error
      setSortableHacks(sortableHacks);

      toast({
        title: 'Error',
        description: 'Failed to save new order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update prerequisite status for anonymous users
  const hacksWithUpdatedStatus = useMemo(() => {
    // Use sortableHacks if in admin mode, otherwise use original hacks
    const baseHacks = isAdminMode ? sortableHacks : hacks;

    if (!isAuthenticated) {
      return baseHacks.map(hack => {
        if (hack.prerequisiteIds && hack.prerequisiteIds.length > 0) {
          // Check if all prerequisites are visited
          const allPrerequisitesCompleted = hack.prerequisiteIds.every(id =>
            visitedHacks.has(id)
          );
          return {
            ...hack,
            hasIncompletePrerequisites: !allPrerequisitesCompleted
          };
        }
        return hack;
      });
    }
    return baseHacks;
  }, [hacks, sortableHacks, isAdminMode, isAuthenticated, visitedHacks]);

  // Combine public routines with user's private routines
  const allRoutines = useMemo(() => {
    const routineMap = new Map();

    // Add public routines
    routines.forEach(r => routineMap.set(r.id, r));

    // Add/override with user routines (includes both public and private)
    userRoutines.forEach(r => routineMap.set(r.id, r));

    return Array.from(routineMap.values());
  }, [routines, userRoutines]);

  // Filter hacks based on search query
  const filteredHacks = hacksWithUpdatedStatus.filter(hack => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      hack.name.toLowerCase().includes(query) ||
      hack.description.toLowerCase().includes(query) ||
      hack.tags?.some((tag: any) => tag.name.toLowerCase().includes(query))
    );
  });

  // When in admin mode, use the sortable hacks list for filtering
  const adminModeFilteredHacks = isAdminMode ? sortableHacks.filter(hack => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      hack.name.toLowerCase().includes(query) ||
      hack.description.toLowerCase().includes(query) ||
      hack.tags?.some((tag: any) => tag.name.toLowerCase().includes(query))
    );
  }) : filteredHacks;

  // Filter all routines based on search query
  const filteredRoutines = allRoutines.filter(routine => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      routine.name.toLowerCase().includes(query) ||
      routine.description.toLowerCase().includes(query) ||
      routine.tags?.some((tag: any) => tag.name.toLowerCase().includes(query)) ||
      routine.creator?.name?.toLowerCase().includes(query) ||
      routine.creator?.email?.toLowerCase().includes(query)
    );
  });

  // Filter user's own routines
  const myRoutines = userRoutines.filter(routine => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      routine.name.toLowerCase().includes(query) ||
      routine.description.toLowerCase().includes(query)
    );
  });

  // Combine for "All" tab - routines first, then hacks
  const allItems = [
    ...filteredRoutines.map(routine => ({ ...routine, type: 'routine' })),
    ...filteredHacks.map(hack => ({ ...hack, type: 'hack' }))
  ];

  return (
    <div className="space-y-6">

      {/* Admin Controls */}
      {isAdmin && activeTab === 'hacks' && (
        <div className="flex justify-center">
          <Button
            variant={isAdminMode ? "default" : "outline"}
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="shrink-0"
            title={isAdminMode ? 'Exit reordering mode' : 'Enable drag-and-drop reordering'}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isAdminMode ? 'Exit Admin Mode' : 'Admin Mode'}
          </Button>
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Saving order...
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          "grid w-full max-w-md mx-auto",
          isAuthenticated ? "grid-cols-4" : "grid-cols-3"
        )}>
          <TabsTrigger value="all">
            All ({allItems.length})
          </TabsTrigger>
          <TabsTrigger value="routines">
            Routines ({filteredRoutines.length})
          </TabsTrigger>
          <TabsTrigger value="hacks">
            Hacks ({filteredHacks.length})
          </TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="my-routines">
              My Routines ({myRoutines.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* All Tab */}
        <TabsContent value="all" className="mt-6">
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white dark:text-gray-300">
                {searchQuery ? 'No results found for your search.' : 'No content available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allItems.map((item) =>
                item.type === 'hack' ? (
                  <HackCard
                    key={`hack-${item.id}`}
                    hack={item}
                    hasIncompletePrerequisites={item.hasIncompletePrerequisites}
                    isAdmin={isAdmin}
                    showActions={true}
                  />
                ) : (
                  <RoutineCard
                    key={`routine-${item.id}`}
                    routine={item}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    showActions={true}
                  />
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* Hacks Tab */}
        <TabsContent value="hacks" className="mt-6">
          {filteredHacks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-500">
                {searchQuery ? 'No hacks found for your search.' : 'No hacks available yet.'}
              </p>
            </div>
          ) : isAdminMode && isAdmin ? (
            <>
              {/* Admin mode instructions */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-900">Admin Mode: Reorder Hacks</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Look for the <strong>⋮⋮</strong> grip handle on the LEFT side of each card</li>
                  <li>• Click and drag the grip handle to reorder hacks</li>
                  <li>• Changes are saved automatically</li>
                  <li>• Click &quot;Exit Admin Mode&quot; when done</li>
                </ul>
              </div>

              {/* Drag and drop list */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={adminModeFilteredHacks.map((hack) => hack.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4">
                    {adminModeFilteredHacks.map((hack) => (
                      <SortableHackCard key={hack.id} hack={hack} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHacks.map(hack => (
                <HackCard
                  key={hack.id}
                  hack={hack}
                  hasIncompletePrerequisites={hack.hasIncompletePrerequisites}
                  isAdmin={isAdmin}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Routines Tab */}
        <TabsContent value="routines" className="mt-6">
          {filteredRoutines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-300 dark:text-gray-500">
                {searchQuery ? 'No routines found for your search.' : 'No routines available yet.'}
              </p>
              {isAuthenticated && !searchQuery && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Create your own routine or wait for others to share public routines.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Routines Tab (authenticated users only) */}
        {isAuthenticated && (
          <TabsContent value="my-routines" className="mt-6">
            {myRoutines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-300 mb-4">
                  {searchQuery ? 'No routines found for your search.' : "You haven't created any routines yet."}
                </p>
                {!searchQuery && (
                  <Link href="/routines/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Routine
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRoutines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Floating Action Buttons */}
      {(isAdmin || isAuthenticated) && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {isAuthenticated && (
            <Link href="/routines/new">
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700 text-white"
                title="Create New Routine"
              >
                <ListChecks className="h-5 w-5 mr-2" />
                New Routine
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/hacks/new">
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-shadow bg-purple-600 hover:bg-purple-700 text-white"
                variant="default"
                title="Create New Hack"
              >
                <Zap className="h-5 w-5 mr-2" />
                New Hack
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}