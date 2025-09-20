'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { HacksList } from './HacksList';
import { HackCard } from './HackCard';
import { RoutineCard } from '@/components/routines/RoutineCard';
import { cn } from '@/lib/utils';

interface HacksPageContentProps {
  hacks: any[];
  routines: any[];
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function HacksPageContent({
  hacks,
  routines,
  isAuthenticated,
  currentUserId
}: HacksPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Filter hacks based on search query
  const filteredHacks = hacks.filter(hack => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      hack.name.toLowerCase().includes(query) ||
      hack.description.toLowerCase().includes(query) ||
      hack.tags?.some((tag: any) => tag.name.toLowerCase().includes(query))
    );
  });

  // Filter routines based on search query
  const filteredRoutines = routines.filter(routine => {
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
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="all">
            All ({allItems.length})
          </TabsTrigger>
          <TabsTrigger value="hacks">
            Hacks ({filteredHacks.length})
          </TabsTrigger>
          <TabsTrigger value="routines">
            Routines ({filteredRoutines.length})
          </TabsTrigger>
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
                    isAdmin={false}
                    showActions={true}
                  />
                ) : (
                  <RoutineCard
                    key={`routine-${item.id}`}
                    routine={item}
                    currentUserId={currentUserId}
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
            <HacksList
              hacks={filteredHacks}
              isAuthenticated={isAuthenticated}
            />
          )}
        </TabsContent>

        {/* Routines Tab */}
        <TabsContent value="routines" className="mt-6">
          {filteredRoutines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'No routines found for your search.' : 'No public routines available yet.'}
              </p>
              {isAuthenticated && !searchQuery && (
                <p className="text-sm text-gray-400 mt-2">
                  Create your own routine or wait for admins to share public routines.
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
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}