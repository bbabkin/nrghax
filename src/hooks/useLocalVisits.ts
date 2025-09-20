'use client';

import { useEffect, useState } from 'react';

const LOCAL_STORAGE_KEY = 'nrghax_visited_hacks';

export interface LocalVisitData {
  hackId: string;
  visitedAt: string;
}

export function useLocalVisits() {
  const [visitedHacks, setVisitedHacks] = useState<Set<string>>(new Set());

  // Load visited hacks from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const data: LocalVisitData[] = JSON.parse(stored);
        setVisitedHacks(new Set(data.map(v => v.hackId)));
      }
    } catch (error) {
      console.error('Error loading visited hacks from local storage:', error);
    }
  }, []);

  // Mark a hack as visited
  const markAsVisited = (hackId: string) => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const visits: LocalVisitData[] = stored ? JSON.parse(stored) : [];

      // Check if already visited
      if (!visits.find(v => v.hackId === hackId)) {
        visits.push({
          hackId,
          visitedAt: new Date().toISOString()
        });

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(visits));
        setVisitedHacks(prev => new Set([...prev, hackId]));
      }
    } catch (error) {
      console.error('Error marking hack as visited in local storage:', error);
    }
  };

  // Check if a hack is visited
  const isVisited = (hackId: string): boolean => {
    return visitedHacks.has(hackId);
  };

  // Get all visited hack IDs
  const getVisitedHackIds = (): string[] => {
    return Array.from(visitedHacks);
  };

  // Clear all visits (useful for testing or reset)
  const clearVisits = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setVisitedHacks(new Set());
    } catch (error) {
      console.error('Error clearing visits:', error);
    }
  };

  // Get visit count
  const getVisitCount = (): number => {
    return visitedHacks.size;
  };

  return {
    markAsVisited,
    isVisited,
    getVisitedHackIds,
    clearVisits,
    getVisitCount,
    visitedHacks
  };
}