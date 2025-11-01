/**
 * Local storage utilities for anonymous user level/hack progress
 * This allows unregistered users to track their progression without authentication
 */

import type { LevelTreeNode, UserLevelProgress } from '@/types/levels'

const STORAGE_KEYS = {
  HACK_PROGRESS: 'nrghax_hack_progress',
  LEVEL_PROGRESS: 'nrghax_level_progress',
  VIEWED_HACKS: 'nrghax_viewed_hacks',
  HACK_CHECKS_PREFIX: 'hack_checks_', // Prefix for check progress: hack_checks_{hackId}
} as const

// ============================================================================
// Type Definitions
// ============================================================================

export interface LocalHackProgress {
  hackId: string
  completed: boolean
  completedAt: string | null
  viewCount: number
  lastViewedAt: string | null
}

export interface LocalLevelProgress {
  levelId: string
  hacksCompleted: number
  totalRequiredHacks: number
  completedAt: string | null
  lastUpdatedAt: string
}

export interface LocalHackCheckProgress {
  hackId: string
  completedCheckIds: string[]
}

export interface LocalProgressData {
  hacks: Record<string, LocalHackProgress>
  levels: Record<string, LocalLevelProgress>
  hackChecks: Record<string, LocalHackCheckProgress>
}

// ============================================================================
// Storage Access Functions
// ============================================================================

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Safely get data from localStorage
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return defaultValue
  }
}

/**
 * Safely set data to localStorage
 */
function setToStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error)
  }
}

// ============================================================================
// Hack Progress Functions
// ============================================================================

/**
 * Get all hack progress from local storage
 */
export function getAllHackProgress(): Record<string, LocalHackProgress> {
  return getFromStorage(STORAGE_KEYS.HACK_PROGRESS, {})
}

/**
 * Get progress for a specific hack
 */
export function getHackProgress(hackId: string): LocalHackProgress | null {
  const allProgress = getAllHackProgress()
  return allProgress[hackId] || null
}

/**
 * Mark a hack as viewed (increment view count)
 */
export function markHackAsViewed(hackId: string): LocalHackProgress {
  const allProgress = getAllHackProgress()
  const existing = allProgress[hackId]

  const updated: LocalHackProgress = {
    hackId,
    completed: existing?.completed || false,
    completedAt: existing?.completedAt || null,
    viewCount: (existing?.viewCount || 0) + 1,
    lastViewedAt: new Date().toISOString(),
  }

  allProgress[hackId] = updated
  setToStorage(STORAGE_KEYS.HACK_PROGRESS, allProgress)

  return updated
}

/**
 * Mark a hack as completed
 */
export function markHackAsCompleted(hackId: string, levelId: string): LocalHackProgress {
  const allProgress = getAllHackProgress()
  const existing = allProgress[hackId]

  const updated: LocalHackProgress = {
    hackId,
    completed: true,
    completedAt: new Date().toISOString(),
    viewCount: existing?.viewCount || 1,
    lastViewedAt: existing?.lastViewedAt || new Date().toISOString(),
  }

  allProgress[hackId] = updated
  setToStorage(STORAGE_KEYS.HACK_PROGRESS, allProgress)

  // Also update level progress
  updateLevelProgress(levelId)

  return updated
}

/**
 * Mark a hack as incomplete
 */
export function markHackAsIncomplete(hackId: string, levelId: string): LocalHackProgress {
  const allProgress = getAllHackProgress()
  const existing = allProgress[hackId]

  const updated: LocalHackProgress = {
    hackId,
    completed: false,
    completedAt: null,
    viewCount: existing?.viewCount || 0,
    lastViewedAt: existing?.lastViewedAt || null,
  }

  allProgress[hackId] = updated
  setToStorage(STORAGE_KEYS.HACK_PROGRESS, allProgress)

  // Also update level progress
  updateLevelProgress(levelId)

  return updated
}

/**
 * Check if a hack is completed
 */
export function isHackCompleted(hackId: string): boolean {
  const progress = getHackProgress(hackId)
  return progress?.completed || false
}

// ============================================================================
// Hack Check Progress Functions
// ============================================================================

/**
 * Get all hack check progress from localStorage
 * Scans for all keys matching the hack_checks_{hackId} pattern
 */
export function getAllHackCheckProgress(): Record<string, LocalHackCheckProgress> {
  if (!isBrowser()) return {}

  const result: Record<string, LocalHackCheckProgress> = {}

  try {
    // Scan localStorage for all hack_checks_* keys
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEYS.HACK_CHECKS_PREFIX)) {
        const hackId = key.replace(STORAGE_KEYS.HACK_CHECKS_PREFIX, '')
        const stored = window.localStorage.getItem(key)

        if (stored) {
          try {
            const checkIds = JSON.parse(stored) as string[]
            result[hackId] = {
              hackId,
              completedCheckIds: checkIds
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading hack check progress:', error)
  }

  return result
}

/**
 * Get check progress for a specific hack
 */
export function getHackCheckProgress(hackId: string): LocalHackCheckProgress | null {
  if (!isBrowser()) return null

  const key = `${STORAGE_KEYS.HACK_CHECKS_PREFIX}${hackId}`
  const stored = window.localStorage.getItem(key)

  if (!stored) return null

  try {
    const checkIds = JSON.parse(stored) as string[]
    return {
      hackId,
      completedCheckIds: checkIds
    }
  } catch {
    return null
  }
}

// ============================================================================
// Level Progress Functions
// ============================================================================

/**
 * Get all level progress from local storage
 */
export function getAllLevelProgress(): Record<string, LocalLevelProgress> {
  return getFromStorage(STORAGE_KEYS.LEVEL_PROGRESS, {})
}

/**
 * Get progress for a specific level
 */
export function getLevelProgress(levelId: string): LocalLevelProgress | null {
  const allProgress = getAllLevelProgress()
  return allProgress[levelId] || null
}

/**
 * Update level progress based on completed hacks
 * This should be called after marking a hack as completed
 */
export function updateLevelProgress(
  levelId: string,
  requiredHackIds?: string[]
): LocalLevelProgress {
  const allLevelProgress = getAllLevelProgress()
  const allHackProgress = getAllHackProgress()

  // If requiredHackIds not provided, try to get from existing level data
  const existing = allLevelProgress[levelId]
  const totalRequired = requiredHackIds?.length || existing?.totalRequiredHacks || 0

  // Count how many required hacks are completed
  let completedCount = 0
  if (requiredHackIds) {
    completedCount = requiredHackIds.filter((hackId) =>
      allHackProgress[hackId]?.completed
    ).length
  } else {
    // If we don't know which hacks are required, count all completed hacks for this level
    // This is less accurate but better than nothing
    completedCount = existing?.hacksCompleted || 0
  }

  const isCompleted = totalRequired > 0 && completedCount >= totalRequired

  const updated: LocalLevelProgress = {
    levelId,
    hacksCompleted: completedCount,
    totalRequiredHacks: totalRequired,
    completedAt: isCompleted ? (existing?.completedAt || new Date().toISOString()) : null,
    lastUpdatedAt: new Date().toISOString(),
  }

  allLevelProgress[levelId] = updated
  setToStorage(STORAGE_KEYS.LEVEL_PROGRESS, allLevelProgress)

  return updated
}

/**
 * Initialize level progress if it doesn't exist
 */
export function initializeLevelProgress(
  levelId: string,
  requiredHackIds: string[]
): LocalLevelProgress {
  const existing = getLevelProgress(levelId)
  if (existing) return existing

  return updateLevelProgress(levelId, requiredHackIds)
}

/**
 * Check if a level is completed
 */
export function isLevelCompleted(levelId: string): boolean {
  const progress = getLevelProgress(levelId)
  return !!progress?.completedAt
}

/**
 * Calculate level progress percentage
 */
export function getLevelProgressPercentage(levelId: string): number {
  const progress = getLevelProgress(levelId)
  if (!progress || progress.totalRequiredHacks === 0) return 0
  return Math.round((progress.hacksCompleted / progress.totalRequiredHacks) * 100)
}

// ============================================================================
// Hack Prerequisites
// ============================================================================

/**
 * Check if a hack is unlocked based on prerequisites
 * A hack is unlocked if:
 * 1. It has no prerequisites (entry point hacks), OR
 * 2. All its prerequisite hacks are completed
 */
export function isHackUnlocked(
  hackId: string,
  prerequisiteHackIds: string[],
  levelUnlocked: boolean = true
): boolean {
  // If the level itself is not unlocked, the hack is not unlocked
  if (!levelUnlocked) return false

  // No prerequisites = always unlocked (entry point hacks)
  if (!prerequisiteHackIds || prerequisiteHackIds.length === 0) return true

  // Check if all prerequisite hacks are completed
  return prerequisiteHackIds.every((prereqId) => isHackCompleted(prereqId))
}

// ============================================================================
// Level Tree Calculations
// ============================================================================

/**
 * Check if a level is unlocked based on prerequisites
 * A level is unlocked if:
 * 1. It has no prerequisites (like Foundation level), OR
 * 2. All its prerequisite levels are completed
 */
export function isLevelUnlocked(
  levelId: string,
  prerequisiteLevelIds: string[]
): boolean {
  // No prerequisites = always unlocked
  if (prerequisiteLevelIds.length === 0) return true

  // Check if all prerequisites are completed
  return prerequisiteLevelIds.every((prereqId) => isLevelCompleted(prereqId))
}

/**
 * Build a level tree with local progress data
 * This is the client-side version of getLevelTree for anonymous users
 */
export function buildLocalLevelTree(
  levels: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    position: number | null
    required_hacks_count: number
    optional_hacks_count: number
    total_hacks_count: number
  }>,
  prerequisites: Record<string, string[]> // levelId -> prerequisite level IDs
): LevelTreeNode[] {
  const levelProgress = getAllLevelProgress()

  return levels.map((level) => {
    const prereqIds = prerequisites[level.id] || []
    const progress = levelProgress[level.id]
    const unlocked = isLevelUnlocked(level.id, prereqIds)
    const completed = isLevelCompleted(level.id)
    const progressPercentage = getLevelProgressPercentage(level.id)

    // Build children list (levels that depend on this one)
    const children = Object.entries(prerequisites)
      .filter(([_, prereqs]) => prereqs.includes(level.id))
      .map(([childId]) => childId)

    const node: LevelTreeNode = {
      level: {
        id: level.id,
        name: level.name,
        slug: level.slug,
        description: level.description,
        icon: level.icon,
        position: level.position,
        created_at: '',
        updated_at: '',
        required_hacks_count: level.required_hacks_count,
        optional_hacks_count: level.optional_hacks_count,
        total_hacks_count: level.total_hacks_count,
      },
      userProgress: progress ? {
        id: `local-${level.id}`,
        user_id: 'anonymous',
        level_id: level.id,
        hacks_completed: progress.hacksCompleted,
        total_required_hacks: progress.totalRequiredHacks,
        completed_at: progress.completedAt,
        created_at: '',
        updated_at: progress.lastUpdatedAt,
        progress_percentage: progressPercentage,
        is_unlocked: unlocked,
      } : undefined,
      prerequisites: prereqIds,
      children,
      isLocked: !unlocked,
      isCompleted: completed,
      progressPercentage,
    }

    return node
  })
}

// ============================================================================
// Data Export/Import for User Migration
// ============================================================================

/**
 * Export all local progress data for migration to user account
 */
export function exportLocalProgress(): LocalProgressData {
  return {
    hacks: getAllHackProgress(),
    levels: getAllLevelProgress(),
    hackChecks: getAllHackCheckProgress(),
  }
}

/**
 * Clear all local progress data (after successful migration)
 */
export function clearLocalProgress(): void {
  if (!isBrowser()) return

  try {
    window.localStorage.removeItem(STORAGE_KEYS.HACK_PROGRESS)
    window.localStorage.removeItem(STORAGE_KEYS.LEVEL_PROGRESS)
    window.localStorage.removeItem(STORAGE_KEYS.VIEWED_HACKS)

    // Clear all hack check progress keys
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(STORAGE_KEYS.HACK_CHECKS_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => window.localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing local progress:', error)
  }
}

/**
 * Get summary of local progress for display
 */
export function getLocalProgressSummary() {
  const hacks = getAllHackProgress()
  const levels = getAllLevelProgress()
  const hackChecks = getAllHackCheckProgress()

  const completedHacks = Object.values(hacks).filter((h) => h.completed).length
  const totalHacksViewed = Object.keys(hacks).length
  const completedLevels = Object.values(levels).filter((l) => l.completedAt).length
  const totalLevelsStarted = Object.keys(levels).length
  const totalHacksWithCheckProgress = Object.keys(hackChecks).length
  const totalChecksCompleted = Object.values(hackChecks).reduce(
    (sum, check) => sum + check.completedCheckIds.length,
    0
  )

  return {
    completedHacks,
    totalHacksViewed,
    completedLevels,
    totalLevelsStarted,
    totalHacksWithCheckProgress,
    totalChecksCompleted,
    hasProgress: completedHacks > 0 || totalHacksViewed > 0 || totalChecksCompleted > 0,
  }
}
