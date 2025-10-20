'use client'

/**
 * Client-side level actions for anonymous users
 * These functions work with local storage instead of the database
 */

import {
  markHackAsViewed as markHackViewedLocal,
  markHackAsCompleted as markHackCompletedLocal,
  updateLevelProgress as updateLevelProgressLocal,
  getHackProgress,
  getLevelProgress,
} from './localStorage'

/**
 * Mark a hack as viewed (client-side)
 */
export async function trackHackView(hackId: string): Promise<void> {
  markHackViewedLocal(hackId)
}

/**
 * Mark a hack as completed (client-side)
 */
export async function completeHack(hackId: string, levelId: string): Promise<void> {
  markHackCompletedLocal(hackId, levelId)
}

/**
 * Get hack completion status (client-side)
 */
export function getHackCompletionStatus(hackId: string): {
  completed: boolean
  viewCount: number
} {
  const progress = getHackProgress(hackId)
  return {
    completed: progress?.completed || false,
    viewCount: progress?.viewCount || 0,
  }
}

/**
 * Get level completion status (client-side)
 */
export function getLevelCompletionStatus(levelId: string): {
  hacksCompleted: number
  totalRequiredHacks: number
  progressPercentage: number
  isCompleted: boolean
} {
  const progress = getLevelProgress(levelId)
  const hacksCompleted = progress?.hacksCompleted || 0
  const totalRequiredHacks = progress?.totalRequiredHacks || 0
  const progressPercentage =
    totalRequiredHacks > 0 ? Math.round((hacksCompleted / totalRequiredHacks) * 100) : 0
  const isCompleted = !!progress?.completedAt

  return {
    hacksCompleted,
    totalRequiredHacks,
    progressPercentage,
    isCompleted,
  }
}
