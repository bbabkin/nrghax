'use client';

/**
 * Manages completion tracking for anonymous (non-logged-in) users using localStorage
 */

const STORAGE_KEY = 'nrghax_anonymous_progress';

export interface AnonymousProgress {
  hacks: Record<string, { completion_count: number; last_completed: string }>;
  routines: Record<string, { completion_count: number; last_completed: string }>;
}

/**
 * Get anonymous user progress from localStorage
 */
export function getAnonymousProgress(): AnonymousProgress {
  if (typeof window === 'undefined') {
    return { hacks: {}, routines: {} };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading anonymous progress:', error);
  }

  return { hacks: {}, routines: {} };
}

/**
 * Save anonymous user progress to localStorage
 */
export function saveAnonymousProgress(progress: AnonymousProgress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving anonymous progress:', error);
  }
}

/**
 * Check if cooldown period has passed (30 minutes)
 */
export function canCompleteHack(hackId: string): boolean {
  const progress = getAnonymousProgress();
  const hack = progress.hacks[hackId];

  if (!hack || !hack.last_completed) {
    return true; // Never completed before
  }

  const lastCompleted = new Date(hack.last_completed);
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000;

  return (now.getTime() - lastCompleted.getTime()) >= thirtyMinutesInMs;
}

/**
 * Get time remaining until can complete again (in minutes)
 */
export function getHackCooldownMinutes(hackId: string): number {
  const progress = getAnonymousProgress();
  const hack = progress.hacks[hackId];

  if (!hack || !hack.last_completed) {
    return 0;
  }

  const lastCompleted = new Date(hack.last_completed);
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000;
  const timePassed = now.getTime() - lastCompleted.getTime();

  if (timePassed >= thirtyMinutesInMs) {
    return 0;
  }

  return Math.ceil((thirtyMinutesInMs - timePassed) / (60 * 1000));
}

/**
 * Increment completion count for a hack
 */
export function incrementHackCompletion(hackId: string): number {
  const progress = getAnonymousProgress();

  if (!progress.hacks[hackId]) {
    progress.hacks[hackId] = {
      completion_count: 0,
      last_completed: new Date().toISOString()
    };
  }

  progress.hacks[hackId].completion_count++;
  progress.hacks[hackId].last_completed = new Date().toISOString();

  saveAnonymousProgress(progress);
  return progress.hacks[hackId].completion_count;
}

/**
 * Check if cooldown period has passed for routine (30 minutes)
 */
export function canCompleteRoutine(routineId: string): boolean {
  const progress = getAnonymousProgress();
  const routine = progress.routines[routineId];

  if (!routine || !routine.last_completed) {
    return true; // Never completed before
  }

  const lastCompleted = new Date(routine.last_completed);
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000;

  return (now.getTime() - lastCompleted.getTime()) >= thirtyMinutesInMs;
}

/**
 * Get time remaining until can complete routine again (in minutes)
 */
export function getRoutineCooldownMinutes(routineId: string): number {
  const progress = getAnonymousProgress();
  const routine = progress.routines[routineId];

  if (!routine || !routine.last_completed) {
    return 0;
  }

  const lastCompleted = new Date(routine.last_completed);
  const now = new Date();
  const thirtyMinutesInMs = 30 * 60 * 1000;
  const timePassed = now.getTime() - lastCompleted.getTime();

  if (timePassed >= thirtyMinutesInMs) {
    return 0;
  }

  return Math.ceil((thirtyMinutesInMs - timePassed) / (60 * 1000));
}

/**
 * Increment completion count for a routine
 */
export function incrementRoutineCompletion(routineId: string): number {
  const progress = getAnonymousProgress();

  if (!progress.routines[routineId]) {
    progress.routines[routineId] = {
      completion_count: 0,
      last_completed: new Date().toISOString()
    };
  }

  progress.routines[routineId].completion_count++;
  progress.routines[routineId].last_completed = new Date().toISOString();

  saveAnonymousProgress(progress);
  return progress.routines[routineId].completion_count;
}

/**
 * Get completion count for a hack
 */
export function getHackCompletionCount(hackId: string): number {
  const progress = getAnonymousProgress();
  return progress.hacks[hackId]?.completion_count || 0;
}

/**
 * Get completion count for a routine
 */
export function getRoutineCompletionCount(routineId: string): number {
  const progress = getAnonymousProgress();
  return progress.routines[routineId]?.completion_count || 0;
}

/**
 * Merge anonymous progress with user data for display
 */
export function mergeAnonymousProgress<T extends { id: string; completion_count?: number }>(
  items: T[],
  type: 'hacks' | 'routines'
): T[] {
  const progress = getAnonymousProgress();
  const progressData = progress[type];

  return items.map(item => ({
    ...item,
    completion_count: progressData[item.id]?.completion_count || item.completion_count || 0
  }));
}