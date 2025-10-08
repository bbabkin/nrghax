import { useState, useEffect, useCallback } from 'react';

interface LocalRoutineProgress {
  currentPosition: number;
  completedHacks: string[];
  progress: number;
  startedAt: string;
  lastPlayedAt: string;
  autoplayEnabled: boolean;
}

interface LocalRoutineStorage {
  routines: {
    [routineId: string]: LocalRoutineProgress;
  };
  version: number;
}

const STORAGE_KEY = 'nrghax_local_routines';
const CURRENT_VERSION = 1;
const MAX_ANONYMOUS_ROUTINES = 3; // Limit for anonymous users

/**
 * Hook to manage routine progress in localStorage for anonymous users
 */
export function useLocalRoutineProgress(routineId: string) {
  const [progress, setProgress] = useState<LocalRoutineProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: LocalRoutineStorage = JSON.parse(stored);

        // Check version compatibility
        if (data.version === CURRENT_VERSION && data.routines[routineId]) {
          setProgress(data.routines[routineId]);
        } else {
          // Initialize new progress for this routine
          setProgress({
            currentPosition: 0,
            completedHacks: [],
            progress: 0,
            startedAt: new Date().toISOString(),
            lastPlayedAt: new Date().toISOString(),
            autoplayEnabled: true,
          });
        }
      } else {
        // First time - initialize
        setProgress({
          currentPosition: 0,
          completedHacks: [],
          progress: 0,
          startedAt: new Date().toISOString(),
          lastPlayedAt: new Date().toISOString(),
          autoplayEnabled: true,
        });
      }
    } catch (error) {
      console.error('Failed to load routine progress from localStorage:', error);
      // Initialize with defaults on error
      setProgress({
        currentPosition: 0,
        completedHacks: [],
        progress: 0,
        startedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        autoplayEnabled: true,
      });
    }
    setIsLoading(false);
  }, [routineId]);

  // Save progress to localStorage
  const saveProgress = useCallback((updates: Partial<LocalRoutineProgress>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: LocalRoutineStorage = stored
        ? JSON.parse(stored)
        : { routines: {}, version: CURRENT_VERSION };

      // Check routine limit for anonymous users
      const routineCount = Object.keys(data.routines).length;
      if (!data.routines[routineId] && routineCount >= MAX_ANONYMOUS_ROUTINES) {
        // Remove oldest routine (by lastPlayedAt)
        const oldestRoutine = Object.entries(data.routines)
          .sort(([, a], [, b]) =>
            new Date(a.lastPlayedAt).getTime() - new Date(b.lastPlayedAt).getTime()
          )[0];

        if (oldestRoutine) {
          delete data.routines[oldestRoutine[0]];
        }
      }

      // Update or create routine progress
      const currentProgress = data.routines[routineId] || progress || {
        currentPosition: 0,
        completedHacks: [],
        progress: 0,
        startedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
        autoplayEnabled: true,
      };

      const updatedProgress = {
        ...currentProgress,
        ...updates,
        lastPlayedAt: new Date().toISOString(),
      };

      data.routines[routineId] = updatedProgress;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setProgress(updatedProgress);

      return true;
    } catch (error) {
      console.error('Failed to save routine progress to localStorage:', error);
      return false;
    }
  }, [routineId, progress]);

  // Update position
  const updatePosition = useCallback((position: number, totalHacks: number) => {
    const progressPercent = Math.floor((position / totalHacks) * 100);
    return saveProgress({
      currentPosition: position,
      progress: progressPercent,
    });
  }, [saveProgress]);

  // Mark hack as completed
  const markHackComplete = useCallback((hackId: string) => {
    const currentCompleted = progress?.completedHacks || [];
    if (!currentCompleted.includes(hackId)) {
      return saveProgress({
        completedHacks: [...currentCompleted, hackId],
      });
    }
    return true;
  }, [progress, saveProgress]);

  // Toggle autoplay
  const toggleAutoplay = useCallback((enabled: boolean) => {
    return saveProgress({ autoplayEnabled: enabled });
  }, [saveProgress]);

  // Clear progress for this routine
  const clearProgress = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: LocalRoutineStorage = JSON.parse(stored);
        delete data.routines[routineId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setProgress(null);
        return true;
      }
    } catch (error) {
      console.error('Failed to clear routine progress:', error);
    }
    return false;
  }, [routineId]);

  return {
    progress,
    isLoading,
    updatePosition,
    markHackComplete,
    toggleAutoplay,
    clearProgress,
    saveProgress,
  };
}

/**
 * Hook to get all local routine progress (for migration)
 */
export function useAllLocalProgress() {
  const [allProgress, setAllProgress] = useState<LocalRoutineStorage['routines'] | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: LocalRoutineStorage = JSON.parse(stored);
        setAllProgress(data.routines);
      }
    } catch (error) {
      console.error('Failed to load all routine progress:', error);
    }
  }, []);

  const clearAllProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAllProgress(null);
      return true;
    } catch (error) {
      console.error('Failed to clear all routine progress:', error);
      return false;
    }
  }, []);

  return {
    allProgress,
    clearAllProgress,
  };
}

/**
 * Hook to check if user has any local progress
 */
export function useHasLocalProgress(): boolean {
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: LocalRoutineStorage = JSON.parse(stored);
        setHasProgress(Object.keys(data.routines).length > 0);
      }
    } catch (error) {
      console.error('Failed to check local progress:', error);
    }
  }, []);

  return hasProgress;
}

/**
 * Get routine count for anonymous users
 */
export function getLocalRoutineCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: LocalRoutineStorage = JSON.parse(stored);
      return Object.keys(data.routines).length;
    }
  } catch (error) {
    console.error('Failed to get routine count:', error);
  }
  return 0;
}

export { MAX_ANONYMOUS_ROUTINES };