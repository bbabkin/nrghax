'use client';

import { useState, useEffect, useMemo } from 'react';
import { HackCard } from './HackCard';
import { useLocalVisits } from '@/hooks/useLocalVisits';

interface HackData {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  image_path: string | null;
  content_type: 'content' | 'link';
  external_link: string | null;
  like_count: number;
  is_liked: boolean;
  is_completed: boolean;
  tags: Array<{ id: string; name: string; slug: string }>;
  hasIncompletePrerequisites: boolean;
  prerequisiteIds?: string[];
}

interface HacksListProps {
  hacks: HackData[];
  isAuthenticated: boolean;
}

export function HacksList({ hacks, isAuthenticated }: HacksListProps) {
  const { visitedHacks } = useLocalVisits();

  // Memoize the hacks with status to prevent infinite loops
  const hacksWithStatus = useMemo(() => {
    // For anonymous users, check prerequisites client-side
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
    } else {
      // For authenticated users, use server-provided status
      return hacks;
    }
  }, [hacks, isAuthenticated, visitedHacks]);

  if (hacks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-300 dark:text-gray-500">No hacks available yet. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hacksWithStatus.map(hack => (
        <HackCard
          key={hack.id}
          hack={hack}
          hasIncompletePrerequisites={hack.hasIncompletePrerequisites}
          isAdmin={false}
          showActions={true}
        />
      ))}
    </div>
  );
}