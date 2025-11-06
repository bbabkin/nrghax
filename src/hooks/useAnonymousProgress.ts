'use client';

import { useState, useEffect } from 'react';
import {
  getAnonymousProgress,
  incrementHackCompletion,
  incrementRoutineCompletion,
  mergeAnonymousProgress
} from '@/lib/anonymous-progress';

/**
 * Hook to manage anonymous user progress
 */
export function useAnonymousProgress(
  initialHacks: any[],
  initialRoutines: any[],
  isAuthenticated: boolean
) {
  const [hacks, setHacks] = useState(initialHacks);
  const [routines, setRoutines] = useState(initialRoutines);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load anonymous progress after mount (client-side only)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined' && !isLoaded) {
      // Merge anonymous progress with initial data
      const mergedHacks = mergeAnonymousProgress(initialHacks, 'hacks');
      const mergedRoutines = mergeAnonymousProgress(initialRoutines, 'routines');

      setHacks(mergedHacks);
      setRoutines(mergedRoutines);
      setIsLoaded(true);
    }
  }, [isAuthenticated, isLoaded, initialHacks, initialRoutines]);

  const handleHackComplete = (hackId: string) => {
    if (!isAuthenticated) {
      const newCount = incrementHackCompletion(hackId);

      // Update local state
      setHacks(prevHacks =>
        prevHacks.map(hack =>
          hack.id === hackId
            ? { ...hack, completion_count: newCount }
            : hack
        )
      );

      return newCount;
    }
    return 0;
  };

  const handleRoutineComplete = (routineId: string) => {
    if (!isAuthenticated) {
      const newCount = incrementRoutineCompletion(routineId);

      // Update local state
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === routineId
            ? { ...routine, completion_count: newCount }
            : routine
        )
      );

      return newCount;
    }
    return 0;
  };

  return {
    hacks,
    routines,
    handleHackComplete,
    handleRoutineComplete
  };
}