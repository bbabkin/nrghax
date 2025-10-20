'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Lock, Star, ArrowDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import type { HackWithLevel } from '@/types/levels'
import { isHackUnlocked } from '@/lib/levels/localStorage'

interface HackFlowChartProps {
  hacks: (HackWithLevel & {
    isCompleted?: boolean
    viewCount?: number
    prerequisites?: string[]
  })[]
  levelSlug?: string
  levelUnlocked?: boolean
}

export function HackFlowChart({ hacks, levelSlug, levelUnlocked = true }: HackFlowChartProps) {
  const [hackUnlockStates, setHackUnlockStates] = useState<Record<string, boolean>>({})

  // Check unlock states for all hacks
  useEffect(() => {
    const checkUnlockStates = () => {
      const states: Record<string, boolean> = {}
      hacks.forEach((hack) => {
        states[hack.id] = isHackUnlocked(hack.id, hack.prerequisites || [], levelUnlocked)
      })
      setHackUnlockStates(states)
    }

    checkUnlockStates()

    // Listen for progress updates
    const handleProgressUpdate = () => {
      checkUnlockStates()
    }

    window.addEventListener('storage', handleProgressUpdate)
    window.addEventListener('localProgressUpdate', handleProgressUpdate)

    return () => {
      window.removeEventListener('storage', handleProgressUpdate)
      window.removeEventListener('localProgressUpdate', handleProgressUpdate)
    }
  }, [hacks, levelUnlocked])

  if (hacks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No hacks to display.</p>
      </div>
    )
  }

  // Organize hacks into layers based on prerequisites
  const hackMap = new Map(hacks.map((h) => [h.id, h]))
  const layers: string[][] = []
  const processed = new Set<string>()

  // Build layers: each layer contains hacks whose prerequisites are all in previous layers
  while (processed.size < hacks.length) {
    const currentLayer: string[] = []

    hacks.forEach((hack) => {
      if (processed.has(hack.id)) return

      const prereqs = hack.prerequisites || []
      const allPrereqsProcessed = prereqs.every((prereqId) => processed.has(prereqId))

      if (allPrereqsProcessed) {
        currentLayer.push(hack.id)
      }
    })

    if (currentLayer.length === 0) {
      // Prevent infinite loop if there are circular dependencies
      break
    }

    layers.push(currentLayer)
    currentLayer.forEach((id) => processed.add(id))
  }

  return (
    <div className="w-full space-y-2">
      {layers.map((layer, layerIndex) => (
        <div key={layerIndex} className="space-y-2">
          {/* Layer separator with multiple arrows showing connections */}
          {layerIndex > 0 && (
            <div className="flex justify-center py-4">
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-0.5 bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"></div>
                <ArrowDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Unlocks after completing above</div>
              </div>
            </div>
          )}

          {/* Layer header */}
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">
            {layerIndex === 0 ? '🚀 Start Here - No Prerequisites' : `📍 Layer ${layerIndex} - Requires completion from above`}
          </div>

          {/* Hacks in this layer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center max-w-7xl mx-auto">
            {layer.map((hackId) => {
              const hack = hackMap.get(hackId)!
              const isUnlocked = hackUnlockStates[hackId] ?? true
              const isCompleted = hack.isCompleted || false
              const viewCount = hack.viewCount || 0
              const isRequired = hack.is_required || false

              const hackUrl = levelSlug
                ? `/levels/${levelSlug}/hacks/${hack.slug}`
                : `/hacks/${hack.slug}`

              const cardClasses = `
                p-4 transition-all duration-200
                ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/30 border-2' : 'border'}
                ${!isCompleted && isUnlocked ? 'hover:border-blue-500 hover:shadow-md cursor-pointer' : ''}
                ${!isUnlocked ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : ''}
              `

              const content = (
                <Card className={cardClasses}>
                  <div className="space-y-3">
                    {/* Header with icon and status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {hack.icon && <span className="text-2xl">{hack.icon}</span>}
                        <div className="flex items-center gap-2">
                          {!isUnlocked ? (
                            <Lock className="h-5 w-5 text-gray-500" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col gap-1">
                        {isRequired && viewCount <= 1 && (
                          <Badge
                            variant="default"
                            className={`text-xs ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
                          >
                            Required
                          </Badge>
                        )}
                        {!isRequired && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isCompleted
                                ? 'border-green-500 text-green-700 dark:text-green-400'
                                : ''
                            }`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Optional
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Hack name */}
                    <h3
                      className={`font-semibold text-base ${
                        !isUnlocked
                          ? 'text-gray-500'
                          : isCompleted
                          ? 'text-green-700 dark:text-green-300'
                          : ''
                      }`}
                    >
                      {hack.name}
                    </h3>

                    {/* Description */}
                    {hack.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {hack.description}
                      </p>
                    )}

                    {/* Bottom badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {hack.difficulty && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : ''
                          }`}
                        >
                          {hack.difficulty}
                        </Badge>
                      )}
                      {viewCount > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isCompleted
                              ? 'border-green-500 text-green-700 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {viewCount} {viewCount === 1 ? 'visit' : 'visits'}
                        </Badge>
                      )}
                    </div>

                    {/* Prerequisites info */}
                    {hack.prerequisites && hack.prerequisites.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
                        Requires {hack.prerequisites.length}{' '}
                        {hack.prerequisites.length === 1 ? 'hack' : 'hacks'} to unlock
                      </div>
                    )}
                  </div>
                </Card>
              )

              if (!isUnlocked) {
                return <div key={hackId}>{content}</div>
              }

              return (
                <Link key={hackId} href={hackUrl}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
