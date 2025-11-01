'use client'

import type { HackWithLevel } from '@/types/levels'
import { HackTreeNode } from './HackTreeNode'
// Removed ArrowRight - using vertical layout now

interface HackTreeViewProps {
  hacks: (HackWithLevel & {
    isCompleted?: boolean
    viewCount?: number
    prerequisites?: string[]
  })[]
  levelName?: string
  levelSlug?: string
  levelUnlocked?: boolean
}

export function HackTreeView({ hacks, levelName, levelSlug, levelUnlocked = true }: HackTreeViewProps) {
  // Separate required and optional hacks
  const requiredHacks = hacks.filter((h) => h.is_required)
  const optionalHacks = hacks.filter((h) => !h.is_required)

  // Sort by position
  const sortedRequired = [...requiredHacks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const sortedOptional = [...optionalHacks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  if (hacks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No hacks in this level yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Level name header */}
      {levelName && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{levelName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete all required hacks to finish this level
          </p>
        </div>
      )}

      {/* Required Hacks Section */}
      {sortedRequired.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Required Hacks ({sortedRequired.length})
          </h3>

          <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
            {sortedRequired.map((hack, index) => (
              <div key={hack.id} className="flex flex-col items-center w-full">
                <div className="w-full">
                  <HackTreeNode hack={hack} isRequired={true} levelSlug={levelSlug} levelUnlocked={levelUnlocked} />
                </div>
                {index < sortedRequired.length - 1 && (
                  <div className="py-2">
                    <svg
                      className="h-8 w-8 text-gray-400 dark:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Hacks Section */}
      {sortedOptional.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Optional Hacks ({sortedOptional.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOptional.map((hack) => (
              <HackTreeNode key={hack.id} hack={hack} isRequired={false} levelSlug={levelSlug} levelUnlocked={levelUnlocked} />
            ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="border-t pt-6 mt-8">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>
            Total Hacks: {hacks.length} ({requiredHacks.length} required, {optionalHacks.length}{' '}
            optional)
          </span>
          <span>
            Completed: {hacks.filter((h) => h.isCompleted).length} / {hacks.length}
          </span>
        </div>
      </div>
    </div>
  )
}
