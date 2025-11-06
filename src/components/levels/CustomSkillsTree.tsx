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

interface CustomSkillsTreeProps {
  hacks: Hack[]
  levelSlug: string
  levelName: string
  isAuthenticated?: boolean
}

export function CustomSkillsTree({
  hacks,
  levelSlug,
  levelName,
  isAuthenticated = false
}: CustomSkillsTreeProps) {
  const router = useRouter()
  const [completedHacks, setCompletedHacks] = useState<Set<string>>(new Set())
  const [shouldAnimate, setShouldAnimate] = useState(true)

  useEffect(() => {
    // Load completion state
    const completed = new Set<string>()
    hacks.forEach(hack => {
      if (hack.is_completed || (!isAuthenticated && isHackCompleted(hack.id))) {
        completed.add(hack.id)
      }
    })
    setCompletedHacks(completed)
  }, [hacks, isAuthenticated])

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

  const handleHackClick = (hack: Hack) => {
    if (!isHackUnlocked(hack)) return

    // Store current scroll position before navigating
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skillsScrollPosition', window.scrollY.toString())
      sessionStorage.setItem('returnToPage', 'skills')
    }

    // Add return parameter to URL
    router.push(`/skills/${levelSlug}/hacks/${hack.slug}?from=skills`)
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

  // Organize hacks into rows for tree structure
  const organizeHacksIntoTree = (hacks: Hack[]) => {
    const rows: Hack[][] = []
    const sortedHacks = [...hacks].sort((a, b) => (a.position || 0) - (b.position || 0))

    // Group hacks based on their prerequisites depth
    const getDepth = (hack: Hack, depth = 0): number => {
      if (!hack.prerequisites || hack.prerequisites.length === 0) return depth
      const maxPrereqDepth = Math.max(
        ...hack.prerequisites.map(prereqId => {
          const prereqHack = hacks.find(h => h.id === prereqId)
          return prereqHack ? getDepth(prereqHack, depth + 1) : depth
        })
      )
      return maxPrereqDepth
    }

    const maxDepth = Math.max(...sortedHacks.map(h => getDepth(h)))

    for (let i = 0; i <= maxDepth; i++) {
      rows.push([])
    }

    sortedHacks.forEach(hack => {
      const depth = getDepth(hack)
      rows[depth].push(hack)
    })

    return rows.filter(row => row.length > 0)
  }

  const treeRows = organizeHacksIntoTree(hacks)
  // Reverse the rows for bottom-up display
  const reversedTreeRows = [...treeRows].reverse()

  return (
    <div className="w-full min-h-screen bg-black p-4 md:p-8 flex flex-col-reverse">
      {/* Skills Tree - rendered in reverse */}
      <div className="max-w-6xl mx-auto w-full">
        {reversedTreeRows.map((row, rowIndex) => {
          // Calculate the actual row index in original order for connections
          const actualRowIndex = reversedTreeRows.length - 1 - rowIndex
          return (
          <div key={rowIndex} className="relative mb-16">
            {/* Row connections */}
            {rowIndex < treeRows.length - 1 && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gray-600" />
            )}

            {/* Hacks in row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {row.map((hack, hackIndex) => {
                const isUnlocked = isHackUnlocked(hack)
                const isCompleted = completedHacks.has(hack.id)
                const badgeColor = getCompletionBadgeColor(hack.completion_count)

                return (
                  <motion.div
                    key={hack.id}
                    initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={shouldAnimate ? { delay: rowIndex * 0.1 + hackIndex * 0.05 } : { duration: 0 }}
                    className="relative"
                  >
                    {/* Connection lines to prerequisites */}
                    {hack.prerequisites && hack.prerequisites.length > 0 && rowIndex > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-gray-600" />
                    )}

                    <motion.button
                      onClick={() => handleHackClick(hack)}
                      disabled={!isUnlocked}
                      whileHover={isUnlocked ? { scale: 1.05 } : {}}
                      whileTap={isUnlocked ? { scale: 0.95 } : {}}
                      className={cn(
                        "relative w-72 md:w-80 bg-gray-800 overflow-hidden transition-all duration-300",
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
                      {/* Image section */}
                      <div className="relative h-40 bg-gray-900">
                        {hack.image_url ? (
                          <Image
                            src={hack.image_url}
                            alt={hack.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Lock className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Completion badge */}
                        {hack.completion_count && hack.completion_count > 0 && (
                          <div
                            className="absolute top-2 right-2 px-3 py-1 rounded-full font-bold text-sm text-white shadow-lg"
                            style={{ backgroundColor: badgeColor }}
                          >
                            {hack.completion_count >= 65 ? '65+' :
                             hack.completion_count >= 15 ? '15+' :
                             hack.completion_count >= 5 ? '5+' : hack.completion_count}
                          </div>
                        )}

                        {/* Completed checkmark */}
                        {isCompleted && (
                          <div className="absolute top-2 left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content section */}
                      <div className="p-4">
                        <h3 className="font-bold text-white mb-2 text-left">{hack.name}</h3>
                        <p className="text-sm text-gray-400 text-left line-clamp-2 mb-3">
                          {hack.description}
                        </p>

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
                )
              })}
            </div>
          </div>
        )
        })}
      </div>

      {/* Level Header - Now at bottom due to flex-col-reverse */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
          {levelName}
        </h2>
        <div className="w-32 h-1 bg-yellow-400 mx-auto" />
      </div>
    </div>
  )
}