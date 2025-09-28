'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, PlusCircle } from 'lucide-react';
import { HacksList } from './HacksList';
import { HackCard } from './HackCard';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { cn } from '@/lib/utils';
import { useLocalVisits } from '@/hooks/useLocalVisits';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { visitedHacks } = useLocalVisits();

  // Debug logging
  console.log('[HacksPageContent] Props received:', {
    isAdmin,
    isAuthenticated,
    currentUserId,
    hacksCount: hacks.length,
    routinesCount: routines.length
  });

  // Update prerequisite status for anonymous users
  const hacksWithUpdatedStatus = useMemo(() => {
    if (!isAuthenticated) {
      return hacks.map(hack => {
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
    return hacks;
  }, [hacks, isAuthenticated, visitedHacks]);

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

  // Combine for "All" tab
  const allItems = [
    ...filteredHacks.map(hack => ({ ...hack, type: 'hack' })),
    ...filteredRoutines.map(routine => ({ ...routine, type: 'routine' }))
  ].sort((a, b) => {
    // Sort by creation date, newest first
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      {/* Admin Status Banner - Temporary for debugging */}
      {isAdmin && (
        <div className="bg-purple-100 dark:bg-purple-900 border-2 border-purple-500 rounded-lg p-4">
          <p className="text-purple-900 dark:text-purple-100 font-semibold">
            🛡️ Admin Mode Active - You should see admin controls below
          </p>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            Look for: Edit/Delete buttons on cards, floating &ldquo;New Hack&rdquo; button at bottom-right
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search hacks and routines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          "grid w-full max-w-md mx-auto",
          isAuthenticated ? "grid-cols-4" : "grid-cols-3"
        )}>
          <TabsTrigger value="all">
            All ({allItems.length})
          </TabsTrigger>
          <TabsTrigger value="hacks">
            Hacks ({filteredHacks.length})
          </TabsTrigger>
          <TabsTrigger value="routines">
            Routines ({filteredRoutines.length})
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
              <p className="text-gray-500">
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
              <p className="text-gray-500">
                {searchQuery ? 'No hacks found for your search.' : 'No hacks available yet.'}
              </p>
            </div>
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
              <p className="text-gray-500">
                {searchQuery ? 'No routines found for your search.' : 'No routines available yet.'}
              </p>
              {isAuthenticated && !searchQuery && (
                <p className="text-sm text-gray-400 mt-2">
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
                <p className="text-gray-500 mb-4">
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
                className="rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700 text-white"
                title="Create New Routine"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Routine
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/hacks/new">
              <Button
                size="lg"
                className="rounded-full shadow-lg hover:shadow-xl transition-shadow bg-purple-600 hover:bg-purple-700 text-white"
                variant="default"
                title="Create New Hack"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                New Hack (Admin)
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}