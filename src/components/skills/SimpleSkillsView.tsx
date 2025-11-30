'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, Lock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/youtube'

interface Hack {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  duration_minutes?: number
  position?: number
  tags?: Array<{ id: string; name: string; slug: string }>
  prerequisites?: string[]
  is_completed?: boolean
  completion_count?: number
  level_id?: string
}

interface Level {
  id: string
  name: string
  slug: string
  position: number
  hacks: Hack[]
}

interface SimpleSkillsViewProps {
  levels: Level[]
  userCompletions?: Record<string, { completed: boolean; completion_count: number }>
  isAuthenticated?: boolean
}

export function SimpleSkillsView({
  levels,
  userCompletions = {},
  isAuthenticated = false
}: SimpleSkillsViewProps) {
  // Check if hack is unlocked based on prerequisites
  const isHackUnlocked = (hack: Level['hacks'][0]) => {
    if (!hack.prerequisites || hack.prerequisites.length === 0) {
      return true
    }
    return hack.prerequisites.every((prereqId: string) => {
      const completion = userCompletions[`hack-${prereqId}`]
      return completion?.completed
    })
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-down {
          animation: fadeInDown 0.6s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen pt-8 pb-48 px-4 fade-in-down">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-yellow-600 uppercase tracking-wider mb-2">
            Skills
          </h1>
          <p className="text-gray-600">
            Master your energy through progressive skill development
          </p>
        </div>

        {/* Levels */}
        <div className="space-y-16">
          {levels.map((level, levelIndex) => (
            <div key={level.id} className="relative">
              {/* Level Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-yellow-600 uppercase tracking-wider mb-2">
                  {level.name}
                </h2>
                <div className="w-32 h-1 bg-yellow-500 mx-auto" />
              </div>

              {/* Hacks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {level.hacks
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((hack) => {
                    const isUnlocked = isHackUnlocked(hack)
                    const completion = userCompletions[`hack-${hack.id}`]
                    const isCompleted = completion?.completed || false
                    const completionCount = completion?.completion_count || 0

                    return (
                      <Link
                        key={hack.id}
                        href={isUnlocked ? `/hacks/${hack.slug}` : '#'}
                        className={cn(
                          "block relative overflow-hidden bg-white border-2 rounded-lg transition-all shadow-sm",
                          isUnlocked
                            ? "border-gray-300 hover:border-yellow-500 hover:scale-[1.02] hover:shadow-md"
                            : "border-gray-200 opacity-60 cursor-not-allowed"
                        )}
                      >
                        {/* Image */}
                        <div className="relative h-32 bg-gray-200">
                          {hack.image_url ? (
                            <Image
                              src={hack.image_url}
                              alt={hack.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center">
                                <span className="text-yellow-600 text-xl font-bold">
                                  {hack.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Locked Overlay */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Lock className="w-8 h-8 text-gray-400" />
                            </div>
                          )}

                          {/* Completion Badge */}
                          {isCompleted && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}

                          {/* Completion Count */}
                          {completionCount > 0 && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                              {completionCount}x
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">
                            {hack.name}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                            {hack.description}
                          </p>

                          {/* Duration */}
                          {hack.duration_minutes && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDuration(hack.duration_minutes)}
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
              </div>

              {/* Level Connector */}
              {levelIndex < levels.length - 1 && (
                <div className="flex justify-center mt-8">
                  <div className="w-1 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 opacity-50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
