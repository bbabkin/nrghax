/**
 * Color progression system for hack completion tracking
 * Based on repetition count:
 * - Dark gray: Unavailable/locked
 * - White: Available but never completed (0 completions)
 * - Green: Completed 1x
 * - Blue: Completed 2-9x
 * - Purple: Completed 10-49x
 * - Orange (#FDB515): Completed 50+ times
 */

export type ProgressionColor = 'locked' | 'white' | 'green' | 'blue' | 'purple' | 'orange'

export interface ProgressionStyle {
  color: ProgressionColor
  borderClass: string
  textClass: string
  bgClass: string
  shadowClass: string
}

/**
 * Get the progression color based on completion count
 * @param completionCount Number of times the hack has been completed
 * @param isLocked Whether the hack is locked (prerequisites not met)
 * @returns The progression color
 */
export function getProgressionColor(
  completionCount: number | null | undefined,
  isLocked: boolean = false
): ProgressionColor {
  if (isLocked) return 'locked'
  // Default to white for undefined/null/0 completions (available but not completed)
  if (completionCount === undefined || completionCount === null || completionCount === 0) return 'white'
  if (completionCount === 1) return 'green'
  if (completionCount >= 2 && completionCount <= 9) return 'blue'
  if (completionCount >= 10 && completionCount <= 49) return 'purple'
  return 'orange' // 50+
}

/**
 * Get Tailwind CSS classes for the progression color
 * @param color The progression color
 * @returns Object with various CSS class strings
 */
export function getProgressionClasses(color: ProgressionColor): ProgressionStyle {
  const styles: Record<ProgressionColor, ProgressionStyle> = {
    locked: {
      color: 'locked',
      borderClass: '!border-4 !border-gray-700 opacity-60',
      textClass: 'text-gray-500',
      bgClass: 'bg-gray-900/50',
      shadowClass: '',
    },
    white: {
      color: 'white',
      borderClass: '!border-4 !border-white',
      textClass: 'text-white',
      bgClass: 'bg-gray-900/80',
      shadowClass: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
    },
    green: {
      color: 'green',
      borderClass: '!border-4 !border-green-500',
      textClass: 'text-green-400',
      bgClass: 'bg-gray-900/80',
      shadowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
    blue: {
      color: 'blue',
      borderClass: '!border-4 !border-blue-500',
      textClass: 'text-blue-400',
      bgClass: 'bg-gray-900/80',
      shadowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    },
    purple: {
      color: 'purple',
      borderClass: '!border-4 !border-purple-500',
      textClass: 'text-purple-400',
      bgClass: 'bg-gray-900/80',
      shadowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
    },
    orange: {
      color: 'orange',
      borderClass: '!border-4 !border-[#FDB515]',
      textClass: 'text-[#FDB515]',
      bgClass: 'bg-gray-900/80',
      shadowClass: 'shadow-[0_0_35px_rgba(253,181,21,0.6)]',
    },
  }

  return styles[color]
}

/**
 * Get a formatted display string for completion count
 * @param count The completion count
 * @returns Formatted string (e.g., "5", "50")
 */
export function formatCompletionCount(count: number): string {
  if (count === 0) return '0'
  if (count >= 50) return '50'
  return `${count}`
}

/**
 * Calculate overall progress percentage for a hack based on checklist completion
 * @param completedChecks Number of completed checklist items
 * @param totalChecks Total number of checklist items
 * @returns Percentage (0-100)
 */
export function calculateProgressPercentage(
  completedChecks: number,
  totalChecks: number
): number {
  if (totalChecks === 0) return 0
  return Math.round((completedChecks / totalChecks) * 100)
}

/**
 * Determine if a hack should show a completion badge
 * @param percentage The completion percentage
 * @returns Whether to show the badge
 */
export function shouldShowCompletionBadge(percentage: number): boolean {
  return percentage > 0 && percentage < 100
}

/**
 * Get the badge color based on completion percentage
 * @param percentage The completion percentage
 * @returns Tailwind color class for the badge
 */
export function getCompletionBadgeColor(percentage: number): string {
  if (percentage >= 75) return 'bg-purple-500 text-white'
  if (percentage >= 50) return 'bg-blue-500 text-white'
  if (percentage >= 25) return 'bg-green-500 text-white'
  return 'bg-gray-500 text-white'
}

/**
 * Check if prerequisites are met for a hack
 * @param hackId The hack ID to check
 * @param completedHackIds Array of completed hack IDs
 * @param prerequisites Array of prerequisite hack IDs for the hack
 * @returns Whether the hack is unlocked
 */
export function isHackUnlocked(
  hackId: string,
  completedHackIds: string[],
  prerequisites: string[]
): boolean {
  if (!prerequisites || prerequisites.length === 0) return true
  return prerequisites.every(prereqId => completedHackIds.includes(prereqId))
}

/**
 * Get the progression color for a routine based on the least completed hack
 * Routines show the color of their least completed hack
 * @param hackCompletionCounts Array of completion counts for all hacks in the routine
 * @param allAvailable Whether all hacks in the routine are available
 * @returns The progression color for the routine
 */
export function getRoutineProgressionColor(
  hackCompletionCounts: (number | null | undefined)[],
  allAvailable: boolean = true
): ProgressionColor {
  if (!allAvailable) return 'locked'

  if (hackCompletionCounts.length === 0) return 'white'

  // Find the minimum completion count (treat null/undefined as 0)
  const counts = hackCompletionCounts.map(c => c ?? 0)
  const minCompletion = Math.min(...counts)

  return getProgressionColor(minCompletion, false)
}