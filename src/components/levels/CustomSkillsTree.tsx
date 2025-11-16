'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { formatDuration } from '@/lib/youtube'
import { isHackCompleted } from '@/lib/levels/localStorage'

interface Hack {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  duration_minutes?: number | null
  is_completed?: boolean
  completion_count?: number
  prerequisites?: string[]
  position?: number
  level_id?: string
}

interface Level {
  id: string
  name: string
  slug: string
  position?: number
  hacks: Hack[]
}

interface CustomSkillsTreeProps {
  levels?: Level[] // New: array of levels
  hacks?: Hack[] // Legacy: single level hacks
  levelSlug: string
  levelName: string
  isAuthenticated?: boolean
}

export function CustomSkillsTree({
  levels, // New: multiple levels
  hacks, // Legacy: single level
  levelSlug,
  levelName,
  isAuthenticated = false
}: CustomSkillsTreeProps) {
  const router = useRouter()
  const [completedHacks, setCompletedHacks] = useState<Set<string>>(new Set())
  const [shouldAnimate, setShouldAnimate] = useState(true)

  // Use levels if provided, otherwise fall back to single level
  const allLevels = levels || (hacks ? [{
    id: 'default',
    name: levelName,
    slug: levelSlug,
    position: 0,
    hacks: hacks
  }] : [])

  useEffect(() => {
    // Load completion state for all hacks across all levels
    const completed = new Set<string>()
    allLevels.forEach(level => {
      level.hacks.forEach(hack => {
        if (hack.is_completed || (!isAuthenticated && isHackCompleted(hack.id))) {
          completed.add(hack.id)
        }
      })
    })
    setCompletedHacks(completed)
  }, [allLevels, isAuthenticated])

  const isHackUnlocked = (hack: Hack) => {
    if (!hack.prerequisites || hack.prerequisites.length === 0) return true
    return hack.prerequisites.every(prereqId => completedHacks.has(prereqId))
  }

  const getCompletionBadgeColor = (count: number = 0) => {
    if (count >= 65) return '#f97316' // orange
    if (count >= 15) return '#a855f7' // purple
    if (count >= 5) return '#3b82f6' // blue
    if (count >= 1) return '#10b981' // green
    return '#6b7280' // gray
  }


  // Restore scroll position when returning from modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem('skillsScrollPosition')
      const returnPage = sessionStorage.getItem('returnToPage')

      if (savedPosition && returnPage === 'skills') {
        window.scrollTo(0, parseInt(savedPosition))
        sessionStorage.removeItem('skillsScrollPosition')
        sessionStorage.removeItem('returnToPage')
        // Disable animation when returning from modal
        setShouldAnimate(false)
      }
    }
  }, [])


  const handleLevelHackClick = (hack: Hack, level: Level) => {
    if (!isHackUnlocked(hack)) return

    // Store current scroll position before navigating
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skillsScrollPosition', window.scrollY.toString())
      sessionStorage.setItem('returnToPage', 'skills')
    }

    // Use the level slug for navigation
    router.push(`/skills/${level.slug}/hacks/${hack.slug}?from=skills`)
  }

  return (
    <div className="w-full h-full bg-black overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
        {/* Main Title */}
        <div className="mb-16 text-center pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
            Skills Tree
          </h1>
          <div className="w-48 h-1 bg-yellow-400 mx-auto" />
        </div>

        {/* Render all levels stacked vertically */}
        <div className="flex flex-col gap-20 pb-24">
          {allLevels.map((level, levelIndex) => {
            const sortedHacks = [...level.hacks].sort((a, b) => (a.position || 0) - (b.position || 0))

            return (
              <div key={level.id} className="relative">
                {/* Connection line to next level */}
                {levelIndex < allLevels.length - 1 && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-1 h-20 bg-gradient-to-b from-yellow-400 to-yellow-600 z-0" />
                )}

                {/* Level Header */}
                <div className="mb-8 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
                    {level.name}
                  </h2>
                  <div className="w-24 h-0.5 bg-yellow-400 mx-auto" />
                </div>

                {/* Skills Tree - Linear Progression */}
                <div className="flex flex-col items-center gap-6">
                  {/* Render hacks from bottom to top (reverse order) */}
                  {[...sortedHacks].reverse().map((hack, index) => {
                    const isUnlocked = isHackUnlocked(hack)
                    const isCompleted = completedHacks.has(hack.id)
                    const badgeColor = getCompletionBadgeColor(hack.completion_count)

                    return (
                      <div key={hack.id} className="relative">
                        {/* Connection line to next hack */}
                        {index < sortedHacks.length - 1 && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-600 z-0" />
                        )}

                        <motion.div
                          initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={shouldAnimate ? { delay: index * 0.1 } : { duration: 0 }}
                          className="relative z-10"
                        >
                          <motion.button
                            onClick={() => handleLevelHackClick(hack, level)}
                            disabled={!isUnlocked}
                            data-hack-unlocked={isUnlocked}
                            data-hack-id={hack.id}
                            data-hack-name={hack.name}
                            whileHover={isUnlocked ? { scale: 1.05 } : {}}
                            whileTap={isUnlocked ? { scale: 0.95 } : {}}
                            className={cn(
                              "relative w-72 md:w-96 bg-gray-800 overflow-hidden transition-all duration-300 flex flex-row",
                              isUnlocked ? "cursor-pointer hover:shadow-2xl" : "cursor-not-allowed opacity-60",
                              isCompleted && "ring-4 ring-green-500"
                            )}
                            style={{
                              clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                              boxShadow: isUnlocked
                                ? `0 0 30px ${badgeColor}40, 0 0 60px ${badgeColor}20`
                                : 'none'
                            }}
                          >
                            {/* Image section - now on the left */}
                            <div className="relative w-32 min-w-32 bg-gray-900">
                              {hack.image_url ? (
                                <Image
                                  src={hack.image_url}
                                  alt={hack.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs text-center px-1">No Image</span>
                                </div>
                              )}

                              {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <Lock className="h-8 w-8 text-gray-400" />
                                </div>
                              )}

                              {/* Completed checkmark */}
                              {isCompleted && (
                                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Content section - now on the right */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-bold text-white text-left">{hack.name}</h3>
                                  {/* Completion badge */}
                                  {hack.completion_count && hack.completion_count > 0 && (
                                    <div
                                      className="px-2 py-0.5 rounded-full font-bold text-xs text-white shadow-lg flex-shrink-0"
                                      style={{ backgroundColor: badgeColor }}
                                    >
                                      {hack.completion_count >= 65 ? '65+' :
                                       hack.completion_count >= 15 ? '15+' :
                                       hack.completion_count >= 5 ? '5+' : hack.completion_count}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 text-left line-clamp-2 mb-3">
                                  {hack.description}
                                </p>
                              </div>

                              {/* Duration and progress dots */}
                              <div className="flex items-center justify-between">
                                {hack.duration_minutes && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(hack.duration_minutes)}
                                  </div>
                                )}

                                <div className="flex gap-1">
                                  {[...Array(3)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        isCompleted ? "bg-green-500" : "bg-gray-600"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Border gradient effect */}
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `linear-gradient(135deg, transparent 40%, ${badgeColor}20 50%, transparent 60%)`,
                              }}
                            />
                          </motion.button>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}