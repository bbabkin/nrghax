'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Zap, Brain, Search, X, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { formatDuration } from '@/lib/youtube'
import { getProgressionColor, getProgressionClasses, formatCompletionCount } from '@/lib/progression'
import { useAnonymousProgress } from '@/hooks/useAnonymousProgress'
import { DeleteRoutineButton } from '@/components/admin/DeleteRoutineButton'

interface Hack {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  image_path?: string | null
  duration_minutes?: number | null
  is_completed?: boolean
  completion_count?: number
  tags?: { id?: string; name: string; slug: string }[]
  content_type?: 'content' | 'link'
  external_link?: string | null
  like_count?: number
  view_count?: number
  is_liked?: boolean
  completion_percentage?: number
  hasIncompletePrerequisites?: boolean
}

interface Routine {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string | null
  imagePath?: string | null
  imageUrl?: string | null
  duration_minutes?: number | null
  is_completed?: boolean
  completion_count?: number
  tags?: { id?: string; name: string; slug: string }[]
  isPublic?: boolean
  createdBy?: string
  creator?: any
  _count?: {
    userRoutines: number
    routineHacks: number
  }
  isLiked?: boolean
  isStarted?: boolean
  isCompleted?: boolean
  progress?: number
  totalDuration?: number
}

interface LibraryViewProps {
  hacks: Hack[]
  routines: Routine[]
  isAuthenticated?: boolean
  isAdmin?: boolean
  currentUserId?: string
  scrollContainerRef?: React.RefObject<HTMLDivElement>
}

export function LibraryView({
  hacks: initialHacks,
  routines: initialRoutines,
  isAuthenticated = false,
  isAdmin = false,
  currentUserId,
  scrollContainerRef
}: LibraryViewProps) {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasAnimated, setHasAnimated] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Debug logging
  console.log('[LibraryView] isAdmin:', isAdmin, 'isAuthenticated:', isAuthenticated)

  // Use anonymous progress tracking for non-authenticated users
  const {
    hacks,
    routines,
    handleHackComplete,
    handleRoutineComplete
  } = useAnonymousProgress(initialHacks, initialRoutines, isAuthenticated)

  // Filter hacks based on search query
  const filteredHacks = hacks.filter(hack => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      hack.name.toLowerCase().includes(query) ||
      hack.description?.toLowerCase().includes(query) ||
      hack.tags?.some(tag => tag.name.toLowerCase().includes(query))
    )
  })

  // Handle card click to navigate
  const handleCardClick = (item: Hack | Routine, type: 'hack' | 'routine') => {
    console.log(`[CLICK] Navigating to ${type}: ${item.name} (${item.slug})`)

    // Navigate to the detail page (pseudo-modal in (detail) route group)
    if (type === 'routine') {
      router.push(`/routines/${item.slug}`)
    } else {
      // Navigate to simplified hack URL
      router.push(`/hacks/${item.slug}`)
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      <div className="w-full min-h-screen pt-48 p-4 md:p-6 fade-in-up">

      {/* Contained max-width wrapper */}
      <div className="max-w-7xl mx-auto">
        {/* Routines Section */}
        <div className="mb-12">
          <div className="mb-6">
            {/* Title with Search Icon */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-wider" style={{ color: '#808080' }}>
                Routines
              </h2>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
                aria-label="Toggle search"
              >
                {isSearchOpen ? (
                  <X className="w-6 h-6" style={{ color: '#FFBB00' }} />
                ) : (
                  <Search className="w-6 h-6" style={{ color: '#FFBB00' }} />
                )}
              </button>
            </div>

            {/* Search Input with Chiseled Edge */}
            {isSearchOpen && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hacks by name, description, or tags..."
                    className="w-full bg-white border-2 text-gray-800 px-4 py-3 pr-10 rounded-lg focus:outline-none focus:border-opacity-100 transition-all placeholder:text-gray-400"
                    style={{
                      borderColor: '#FFBB00'
                    }}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="w-full h-0.5" style={{ backgroundColor: '#808080' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {routines.map((routine, index) => {
            const completionCount = routine.completion_count || 0
            const progressionColor = getProgressionColor(completionCount, false)
            const progressionClasses = getProgressionClasses(progressionColor)

            return (
              <div key={routine.id} className="relative pb-2 pr-2">
                {/* Stacked cards effect - only for routines */}
                <div
                  className={cn(
                    "absolute top-2 left-2 right-0 bottom-0 z-10 pointer-events-none rounded-lg",
                    progressionClasses.bgClass,
                    progressionClasses.borderClass,
                    "opacity-50"
                  )}
                />
                <div
                  className={cn(
                    "absolute top-4 left-4 right-0 bottom-0 z-0 pointer-events-none rounded-lg",
                    progressionClasses.bgClass,
                    progressionClasses.borderClass,
                    "opacity-30"
                  )}
                />

                {/* Enhanced Routine Card */}
                <RoutineEnhancedCard
                  routine={routine}
                  progressionColor={progressionColor}
                  progressionClasses={progressionClasses}
                  onClick={() => handleCardClick(routine, 'routine')}
                  index={index}
                  isModalOpen={isModalOpen}
                  isAdmin={isAdmin}
                />
              </div>
            )
          })}
        </div>
      </div>

        {/* Hax Section */}
        <div className="pb-48">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider mb-2" style={{ color: '#808080' }}>
              Techniques
            </h2>
            <div className="w-full h-0.5" style={{ backgroundColor: '#808080' }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredHacks.map((hack, index) => {
            const completionCount = hack.completion_count || 0
            const progressionColor = getProgressionColor(completionCount, hack.hasIncompletePrerequisites)
            const progressionClasses = getProgressionClasses(progressionColor)

            return (
              <HackEnhancedCard
                key={hack.id}
                hack={hack}
                progressionColor={progressionColor}
                progressionClasses={progressionClasses}
                onClick={() => handleCardClick(hack, 'hack')}
                index={index}
                isModalOpen={isModalOpen}
                isAdmin={isAdmin}
              />
            )
          })}
          </div>
        </div>
      </div>
      </div>

    </>
  )
}

// Enhanced Routine Card with visual improvements
function RoutineEnhancedCard({
  routine,
  progressionColor,
  progressionClasses,
  onClick,
  index,
  isModalOpen,
  isAdmin = false
}: any) {
  const router = useRouter()
  const completionCount = routine.completion_count || 0
  const completionLabel = formatCompletionCount(completionCount)

  // Debug logging for each card
  console.log(`[RoutineCard ${routine.name}] isAdmin:`, isAdmin)

  return (
    <div
      onClick={onClick}
      data-type="routine"
      data-name={routine.name}
      className={cn(
        "relative z-20 overflow-hidden transition-all duration-300 hover:scale-105 group flex flex-col w-full h-full cursor-pointer rounded-lg",
        progressionClasses.bgClass,
        progressionClasses.borderClass,
        progressionClasses.shadowClass
      )}
      style={{
        border: `2px solid ${
          progressionColor === 'white' ? '#ffffff' :
          progressionColor === 'green' ? '#10b981' :
          progressionColor === 'blue' ? '#3b82f6' :
          progressionColor === 'purple' ? '#a855f7' :
          progressionColor === 'orange' ? '#FDB515' :
          '#6b7280'
        }`,
        boxShadow: `0 0 20px ${
          progressionColor === 'white' ? 'rgba(255, 255, 255, 0.3)' :
          progressionColor === 'green' ? 'rgba(16, 185, 129, 0.3)' :
          progressionColor === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
          progressionColor === 'purple' ? 'rgba(168, 85, 247, 0.3)' :
          progressionColor === 'orange' ? 'rgba(253, 181, 21, 0.3)' :
          'rgba(107, 114, 128, 0.3)'
        }`
      }}
    >

      {/* Image section */}
      <div className="relative h-36 bg-gray-200">
        {routine.image_url || routine.imageUrl ? (
          <Image
            src={routine.image_url || routine.imageUrl || ''}
            alt={routine.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-gray-200 flex items-center justify-center">
            <Zap className="h-16 w-16 text-yellow-500/50" />
          </div>
        )}

        {/* Completion Badge */}
        <div
          className="absolute top-2 right-2 px-3 py-1.5 font-bold text-sm shadow-lg rounded-full"
          style={{
            backgroundColor: completionCount === 0 ? '#6b7280' :
                            progressionColor === 'white' ? '#ffffff' :
                            progressionColor === 'green' ? '#10b981' :
                            progressionColor === 'blue' ? '#3b82f6' :
                            progressionColor === 'purple' ? '#a855f7' :
                            progressionColor === 'orange' ? '#FDB515' : '#6b7280',
            color: (completionCount === 0 || progressionColor === 'gray') ? '#ffffff' :
                   (progressionColor === 'white' || progressionColor === 'orange') ? '#000000' : '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
          }}
        >
          {completionCount}x
        </div>
      </div>

      {/* Progress bar with matching color */}
      {completionCount > 0 && (
        <div className="px-4 py-2 bg-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full transition-all rounded-full"
                style={{
                  width: `${Math.min((completionCount / 65) * 100, 100)}%`,
                  backgroundColor: progressionColor === 'white' ? '#9ca3af' :
                                   progressionColor === 'green' ? '#10b981' :
                                   progressionColor === 'blue' ? '#3b82f6' :
                                   progressionColor === 'purple' ? '#a855f7' :
                                   progressionColor === 'orange' ? '#FDB515' :
                                   '#6b7280'
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 min-w-[35px] text-right">
              {Math.min(Math.round((completionCount / 65) * 100), 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-3 flex-grow flex flex-col bg-white">
        <h3 className="font-bold text-gray-800 mb-2">{routine.name}</h3>
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-grow">
          {routine.description}
        </p>

        {/* Footer with duration and tags */}
        <div className="flex items-center justify-between">
          {routine.duration_minutes && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatDuration(routine.duration_minutes)}
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-1">
            {routine.tags?.slice(0, 2).map((tag: any) => (
              <span
                key={tag.slug}
                className="px-2 py-0.5 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs rounded"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Controls - Bottom Right */}
      {isAdmin && (
        <div
          className="absolute bottom-2 right-2 flex gap-2 z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/admin/routines/${routine.id}/edit`
            }}
            className="p-2 bg-yellow-400/90 hover:bg-yellow-400 text-black rounded transition-colors relative z-50"
            style={{ width: '30px', height: '30px' }}
            title="Edit routine"
            type="button"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <DeleteRoutineButton routineId={routine.id} routineName={routine.name} variant="small" />
        </div>
      )}

      {/* Enhanced Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t to-transparent",
          progressionColor === 'white' ? "from-white/20" :
          progressionColor === 'green' ? "from-green-500/20" :
          progressionColor === 'blue' ? "from-blue-500/20" :
          progressionColor === 'purple' ? "from-purple-500/20" :
          progressionColor === 'orange' ? "from-[#FDB515]/20" :
          "from-gray-500/20"
        )} />
      </div>
    </div>
  )
}

// Enhanced Hack Card with visual improvements
function HackEnhancedCard({
  hack,
  progressionColor,
  progressionClasses,
  onClick,
  index,
  isModalOpen,
  isAdmin = false
}: any) {
  const router = useRouter()
  const completionCount = hack.completion_count || 0
  const completionLabel = formatCompletionCount(completionCount)

  return (
    <div
      onClick={onClick}
      data-type="hack"
      data-name={hack.name}
      className={cn(
        "relative z-20 overflow-hidden transition-all duration-300 hover:scale-105 group flex flex-col h-full cursor-pointer rounded-lg",
        progressionClasses.bgClass,
        progressionClasses.borderClass,
        progressionClasses.shadowClass
      )}
      style={{
        border: `2px solid ${
          progressionColor === 'white' ? '#ffffff' :
          progressionColor === 'green' ? '#10b981' :
          progressionColor === 'blue' ? '#3b82f6' :
          progressionColor === 'purple' ? '#a855f7' :
          progressionColor === 'orange' ? '#FDB515' :
          '#6b7280'
        }`,
        boxShadow: `0 0 20px ${
          progressionColor === 'white' ? 'rgba(255, 255, 255, 0.3)' :
          progressionColor === 'green' ? 'rgba(16, 185, 129, 0.3)' :
          progressionColor === 'blue' ? 'rgba(59, 130, 246, 0.3)' :
          progressionColor === 'purple' ? 'rgba(168, 85, 247, 0.3)' :
          progressionColor === 'orange' ? 'rgba(253, 181, 21, 0.3)' :
          'rgba(107, 114, 128, 0.3)'
        }`
      }}
    >

      {/* Image section */}
      <div className="relative h-36 bg-gray-200">
        {hack.image_url || hack.image_path ? (
          <Image
            src={hack.image_url || hack.image_path || ''}
            alt={hack.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-gray-200 flex items-center justify-center">
            <Brain className="h-16 w-16 text-green-500/50" />
          </div>
        )}

        {/* Completion Badge */}
        <div
          className="absolute top-2 right-2 px-3 py-1.5 font-bold text-sm shadow-lg rounded-full"
          style={{
            backgroundColor: completionCount === 0 ? '#6b7280' :
                            progressionColor === 'white' ? '#ffffff' :
                            progressionColor === 'green' ? '#10b981' :
                            progressionColor === 'blue' ? '#3b82f6' :
                            progressionColor === 'purple' ? '#a855f7' :
                            progressionColor === 'orange' ? '#FDB515' : '#6b7280',
            color: (completionCount === 0 || progressionColor === 'gray') ? '#ffffff' :
                   (progressionColor === 'white' || progressionColor === 'orange') ? '#000000' : '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
          }}
        >
          {completionCount}x
        </div>
      </div>

      {/* Progress bar with matching color */}
      {completionCount > 0 && (
        <div className="px-4 py-2 bg-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full transition-all rounded-full"
                style={{
                  width: `${Math.min((completionCount / 65) * 100, 100)}%`,
                  backgroundColor: progressionColor === 'white' ? '#9ca3af' :
                                   progressionColor === 'green' ? '#10b981' :
                                   progressionColor === 'blue' ? '#3b82f6' :
                                   progressionColor === 'purple' ? '#a855f7' :
                                   progressionColor === 'orange' ? '#FDB515' :
                                   '#6b7280'
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 min-w-[35px] text-right">
              {Math.min(Math.round((completionCount / 65) * 100), 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-3 flex-grow flex flex-col bg-white">
        <h3 className="font-bold text-gray-800 mb-2">{hack.name}</h3>
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-grow">
          {hack.description}
        </p>

        {/* Footer with duration and tags */}
        <div className="flex items-center justify-between">
          {hack.duration_minutes && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {formatDuration(hack.duration_minutes)}
            </div>
          )}

          {/* Tags */}
          <div className="flex gap-1">
            {hack.tags?.slice(0, 2).map((tag: any) => (
              <span
                key={tag.slug}
                className="px-2 py-0.5 bg-green-100 border border-green-400 text-green-700 text-xs rounded"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Controls - Bottom Right */}
      {isAdmin && (
        <div
          className="absolute bottom-2 right-2 flex gap-2 z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.location.href = `/admin/hacks/${hack.id}/edit`
            }}
            className="p-2 bg-yellow-400/90 hover:bg-yellow-400 text-black rounded transition-colors relative z-50"
            style={{ width: '30px', height: '30px' }}
            title="Edit hack"
            type="button"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Enhanced Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t to-transparent",
          progressionColor === 'white' ? "from-white/20" :
          progressionColor === 'green' ? "from-green-500/20" :
          progressionColor === 'blue' ? "from-blue-500/20" :
          progressionColor === 'purple' ? "from-purple-500/20" :
          progressionColor === 'orange' ? "from-[#FDB515]/20" :
          "from-gray-500/20"
        )} />
      </div>
    </div>
  )
}