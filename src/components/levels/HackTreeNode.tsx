'use client'

import { CheckCircle2, Circle, Star, Lock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HackWithLevel } from '@/types/levels'
import { Badge } from '@/components/ui/badge'
import { isHackUnlocked } from '@/lib/levels/localStorage'

interface HackTreeNodeProps {
  hack: HackWithLevel & {
    isCompleted?: boolean
    viewCount?: number
    prerequisites?: string[]
  }
  isRequired: boolean
  levelSlug?: string
  levelUnlocked?: boolean
}

export function HackTreeNode({ hack, isRequired, levelSlug, levelUnlocked = true }: HackTreeNodeProps) {
  const [isUnlocked, setIsUnlocked] = useState(true)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const isCompleted = hack.isCompleted || false
  const viewCount = hack.viewCount || 0
  const prerequisites = hack.prerequisites || []

  // Check if hack is unlocked based on prerequisites
  useEffect(() => {
    const checkUnlocked = () => {
      const unlocked = isHackUnlocked(hack.id, prerequisites, levelUnlocked)
      const wasLocked = !isUnlocked

      setIsUnlocked(unlocked)

      // If this hack just got unlocked, trigger unlock animation
      // The timing is already handled by the delayed event dispatch in HackModal
      if (wasLocked && unlocked) {
        setJustUnlocked(true)
        // Clear the animation state after it completes
        setTimeout(() => setJustUnlocked(false), 1000)
      }
    }

    checkUnlocked()

    // Listen for progress updates
    const handleProgressUpdate = () => {
      checkUnlocked()
    }

    window.addEventListener('storage', handleProgressUpdate)
    window.addEventListener('localProgressUpdate', handleProgressUpdate)

    return () => {
      window.removeEventListener('storage', handleProgressUpdate)
      window.removeEventListener('localProgressUpdate', handleProgressUpdate)
    }
  }, [hack.id, prerequisites, isUnlocked, levelUnlocked])

  const nodeClasses = `
    relative p-4 rounded-lg border-2 transition-all duration-200
    ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
    ${!isCompleted && isUnlocked ? 'border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:shadow-md' : ''}
    ${!isUnlocked ? 'border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed' : ''}
    ${justUnlocked ? 'animate-unlock' : ''}
    flex flex-col gap-2 min-h-[120px] justify-between
  `

  const content = (
    <div className={nodeClasses} data-testid="hack-card">
      {/* Unlock animation overlay */}
      {justUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-lg border-4 border-blue-500 animate-unlock-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-unlock-badge">
              Unlocked!
            </div>
          </div>
        </div>
      )}
      {/* Header with icon and status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {hack.icon && <span className="text-2xl">{hack.icon}</span>}
          {!isUnlocked ? (
            <Lock className="h-5 w-5 text-gray-500 flex-shrink-0" data-testid="lock-icon" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}
        </div>
        {!isRequired && (
          <Badge variant="outline" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Optional
          </Badge>
        )}
      </div>

      {/* Hack name */}
      <div className="flex-1">
        <h3 className={`font-semibold text-sm line-clamp-2 ${!isUnlocked ? 'text-gray-500' : ''}`} data-testid="hack-title">
          {hack.name}
        </h3>
        {!isUnlocked && prerequisites.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Complete {prerequisites.length} prerequisite{prerequisites.length !== 1 ? 's' : ''} first
          </p>
        )}
      </div>

      {/* Footer with view count and difficulty */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {viewCount > 0 && <span>{viewCount} views</span>}
        {hack.difficulty && (
          <Badge variant="secondary" className="text-xs">
            {hack.difficulty}
          </Badge>
        )}
      </div>

      {/* Required indicator */}
      {isRequired && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="text-xs">
            Required
          </Badge>
        </div>
      )}

      {/* Locked overlay badge */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 dark:bg-gray-100/10 rounded-lg pointer-events-none">
          <Badge variant="secondary" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        </div>
      )}
    </div>
  )

  // If locked, render without Link wrapper
  if (!isUnlocked) {
    return content
  }

  // If we have a level slug, use the modal route within the level
  // Otherwise, use the regular hack page
  const hackUrl = levelSlug
    ? `/levels/${levelSlug}/hacks/${hack.slug}`
    : `/hacks/${hack.slug}`

  // If unlocked, wrap in Link
  return (
    <Link href={hackUrl} className="block">
      {content}
    </Link>
  )
}
