'use client'

import { Play, Pause, SkipForward, SkipBack, List, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { formatDuration } from '@/lib/youtube'
import {
  incrementRoutineCompletion,
  canCompleteRoutine,
  getRoutineCooldownMinutes
} from '@/lib/anonymous-progress'

interface Hack {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  duration_minutes?: number
  video_url?: string
  content?: string
  is_completed?: boolean
}

interface RoutineModalEnhancedProps {
  routine: {
    id: string
    name: string
    slug: string
    description: string
    image_url?: string
    duration_minutes?: number
    hacks?: Hack[]
    tags?: { name: string; slug: string }[]
    creator?: { name?: string; email: string }
    is_public?: boolean
  }
}

type TabType = 'playlist' | 'overview'

export function RoutineModalEnhanced({ routine }: RoutineModalEnhancedProps) {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('playlist')
  const [currentHackIndex, setCurrentHackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [completedHacks, setCompletedHacks] = useState<Set<string>>(new Set())
  const [canCompleteR, setCanCompleteR] = useState(true)
  const [cooldownMinutes, setCooldownMinutes] = useState(0)
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false)

  // Calculate total duration
  const totalDuration = routine.hacks?.filter(hack => hack != null).reduce((acc, hack) =>
    acc + (hack.duration_minutes || 0), 0
  ) || 0

  // Get current hack
  const currentHack = routine.hacks?.[currentHackIndex]

  // Check cooldown status for anonymous users
  useEffect(() => {
    if (!isAuthenticated) {
      const canComplete = canCompleteRoutine(routine.id)
      setCanCompleteR(canComplete)

      const cooldown = getRoutineCooldownMinutes(routine.id)
      setCooldownMinutes(cooldown)

      // Check if completed before
      setHasCompletedBefore(cooldown > 0 || !canComplete)
    }
  }, [isAuthenticated, routine.id])

  // Update cooldown timer
  useEffect(() => {
    if (!isAuthenticated && cooldownMinutes > 0) {
      const timer = setInterval(() => {
        const cooldown = getRoutineCooldownMinutes(routine.id)
        setCooldownMinutes(cooldown)

        if (cooldown === 0) {
          setCanCompleteR(true)
        }
      }, 60000) // Check every minute

      return () => clearInterval(timer)
    }
  }, [isAuthenticated, cooldownMinutes, routine.id])

  const handleNext = () => {
    if (routine.hacks && currentHackIndex < routine.hacks.length - 1) {
      setCurrentHackIndex(currentHackIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentHackIndex > 0) {
      setCurrentHackIndex(currentHackIndex - 1)
    }
  }

  const handleHackComplete = (hackId: string) => {
    const newCompleted = new Set(completedHacks)
    if (newCompleted.has(hackId)) {
      newCompleted.delete(hackId)
    } else {
      newCompleted.add(hackId)

      // Check if all hacks are completed
      if (routine.hacks && newCompleted.size === routine.hacks.length && !isAuthenticated) {
        // Only increment if cooldown has passed
        if (canCompleteR) {
          incrementRoutineCompletion(routine.id)
          setHasCompletedBefore(true)
          setCanCompleteR(false)
          setCooldownMinutes(30)

          // Start cooldown timer
          setTimeout(() => {
            const cooldown = getRoutineCooldownMinutes(routine.id)
            setCooldownMinutes(cooldown)
            if (cooldown === 0) {
              setCanCompleteR(true)
            }
          }, 60000)
        }
      }

      // If autoplay is on, go to next hack
      if (autoplay && routine.hacks && currentHackIndex < routine.hacks.length - 1) {
        setTimeout(() => handleNext(), 1500)
      }
    }
    setCompletedHacks(newCompleted)
  }

  const tabs: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'playlist', label: 'Playlist', icon: <List className="h-4 w-4" /> },
    { id: 'overview', label: 'Overview', icon: <Play className="h-4 w-4" /> },
  ]

  // Content component - shared between embedded and modal views
  const renderModalContent = () => (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gray-100 border-b border-gray-200 px-6 pr-16 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-yellow-600">{routine.name}</h2>
            <span className="text-sm text-gray-500">
              {completedHacks.size} / {routine.hacks?.length || 0} completed
            </span>
          </div>
          {/* Autoplay toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Autoplay</span>
            <Switch
              checked={autoplay}
              onCheckedChange={setAutoplay}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

          {/* Content Area */}
          <div className="pt-32 pb-24 px-6 h-full overflow-y-auto bg-white">
            {activeTab === 'playlist' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video/Content Player */}
                <div className="lg:col-span-2">
                  {currentHack && (
                    <div className="space-y-4">
                      {/* Video Player or Image */}
                      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        {currentHack.video_url ? (
                          <div className="flex items-center justify-center h-full">
                            <Play className="h-16 w-16 text-gray-500" />
                            <span className="ml-4 text-gray-400">Video Player Placeholder</span>
                          </div>
                        ) : currentHack.image_url ? (
                          <Image
                            src={currentHack.image_url}
                            alt={currentHack.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">No media available</span>
                          </div>
                        )}
                      </div>

                      {/* Current Hack Info */}
                      <div className="bg-gray-100 rounded-lg p-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{currentHack.name}</h3>
                        <p className="text-gray-600 mb-4">{currentHack.description}</p>

                        {currentHack.duration_minutes && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            {formatDuration(currentHack.duration_minutes)}
                          </div>
                        )}

                        {/* Mark Complete Button */}
                        <Button
                          onClick={() => handleHackComplete(currentHack.id)}
                          className={cn(
                            "mt-4 w-full",
                            completedHacks.has(currentHack.id)
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                          )}
                        >
                          {completedHacks.has(currentHack.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            'Mark as Complete'
                          )}
                        </Button>
                      </div>

                      {/* Content */}
                      {currentHack.content && (
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div
                            className="prose prose-gray max-w-none"
                            dangerouslySetInnerHTML={{ __html: currentHack.content }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Playlist */}
                <div className="bg-gray-100 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <h3 className="font-bold text-gray-800 mb-4">Playlist ({routine.hacks?.length || 0} hacks)</h3>

                  <div className="space-y-2">
                    {routine.hacks?.filter(hack => hack !== null).map((hack, index) => (
                      <button
                        key={hack.id}
                        onClick={() => setCurrentHackIndex(index)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          index === currentHackIndex
                            ? "bg-yellow-400 text-black"
                            : completedHacks.has(hack.id)
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-sm mt-1">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium">{hack.name}</div>
                            {hack.duration_minutes && (
                              <div className="text-xs opacity-70 mt-1">
                                {formatDuration(hack.duration_minutes)}
                              </div>
                            )}
                          </div>
                          {completedHacks.has(hack.id) && (
                            <CheckCircle className="h-4 w-4 mt-1" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Routine Description */}
                <div className="bg-gray-100 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">About this Routine</h3>
                  <p className="text-gray-600">{routine.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {routine.hacks?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500">Hacks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {totalDuration}
                      </div>
                      <div className="text-sm text-gray-500">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {completedHacks.size}
                      </div>
                      <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((completedHacks.size / (routine.hacks?.length || 1)) * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Progress</div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {routine.tags && routine.tags.length > 0 && (
                  <div className="bg-gray-100 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {routine.tags.map(tag => (
                        <span
                          key={tag.slug}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creator */}
                {routine.creator && (
                  <div className="bg-gray-100 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Created By</h3>
                    <p className="text-gray-600">
                      {routine.creator.name || routine.creator.email}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrevious}
                  disabled={currentHackIndex === 0}
                  variant="ghost"
                  size="sm"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant="ghost"
                  size="sm"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!routine.hacks || currentHackIndex === routine.hacks.length - 1}
                  variant="ghost"
                  size="sm"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 mx-8">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentHackIndex + 1) / (routine.hacks?.length || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {currentHackIndex + 1} / {routine.hacks?.length || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </div>
      </>
  )

  // When used inside RoutineModalWrapper, just render the content directly
  // The wrapper handles the modal chrome (backdrop, animation, close button)
  return (
    <div className="relative h-full">
      {renderModalContent()}
    </div>
  )
}