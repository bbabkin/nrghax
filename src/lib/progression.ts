/**
 * Color progression system for hack completion tracking
 * Based on repetition count:
 * - White outline: Locked/unavailable
 * - Gray: Available but never completed (0 completions)
 * - Green: Completed 1x
 * - Blue: Completed 2-10x
 * - Purple: Completed 11-50x
 * - Orange: Completed 50+ times
 */

export type ProgressionColor = 'locked' | 'gray' | 'green' | 'blue' | 'purple' | 'orange'

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
  // Default to gray for undefined/null/0 completions
  if (completionCount === undefined || completionCount === null || completionCount === 0) return 'gray'
  if (completionCount === 1) return 'green'
  if (completionCount <= 10) return 'blue'
  if (completionCount <= 50) return 'purple'
  return 'orange'
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
      borderClass: '!border-4 !border-gray-600 opacity-50',
      textClass: 'text-gray-400',
      bgClass: 'bg-gray-900',
      shadowClass: '',
    },
    gray: {
      color: 'gray',
      borderClass: '!border-4 !border-gray-500',
      textClass: 'text-gray-400',
      bgClass: 'bg-gray-900',
      shadowClass: '',
    },
    green: {
      color: 'green',
      borderClass: '!border-4 !border-green-500',
      textClass: 'text-green-400',
      bgClass: 'bg-green-950',
      shadowClass: 'shadow-lg shadow-green-500/30',
    },
    blue: {
      color: 'blue',
      borderClass: '!border-4 !border-blue-500',
      textClass: 'text-blue-400',
      bgClass: 'bg-blue-950',
      shadowClass: 'shadow-lg shadow-blue-500/30',
    },
    purple: {
      color: 'purple',
      borderClass: '!border-4 !border-purple-500',
      textClass: 'text-purple-400',
      bgClass: 'bg-purple-950',
      shadowClass: 'shadow-lg shadow-purple-500/30',
    },
    orange: {
      color: 'orange',
      borderClass: '!border-4 !border-orange-500',
      textClass: 'text-orange-400',
      bgClass: 'bg-orange-950',
      shadowClass: 'shadow-xl shadow-orange-500/40',
    },
  }

  return styles[color]
}

/**
 * Get a formatted display string for completion count
 * @param count The completion count
 * @returns Formatted string (e.g., "5x", "50+")
 */
export function formatCompletionCount(count: number): string {
  if (count === 0) return ''
  if (count === 1) return '1x'
  if (count > 50) return '50+'
  return `${count}x`
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