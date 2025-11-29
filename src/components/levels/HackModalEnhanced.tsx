'use client'

import { Play, FileText, HelpCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { markHackCompleted } from '@/lib/hacks/supabase-actions'
import { useAuth } from '@/hooks/useAuth'
import {
  markHackAsCompleted as markHackCompletedLocal,
  isHackCompleted as isHackCompletedLocal
} from '@/lib/levels/localStorage'
import {
  incrementHackCompletion,
  getHackCompletionCount,
  canCompleteHack,
  getHackCooldownMinutes
} from '@/lib/anonymous-progress'
import { Checklist } from '@/components/hacks/Checklist'
import { cn } from '@/lib/utils'

interface HackModalEnhancedProps {
  hack: any
  levelSlug: string
  allLevelHacks?: any[]
}

type ContentTabType = 'video' | 'text'
type SecondaryTabType = 'checklist' | 'qa' | 'notes'

export function HackModalEnhanced({ hack, levelSlug, allLevelHacks = [] }: HackModalEnhancedProps) {
  const { isAuthenticated } = useAuth()
  const [isCompleted, setIsCompleted] = useState(hack.is_completed || false)
  const [isMarking, setIsMarking] = useState(false)
  const [activeContentTab, setActiveContentTab] = useState<ContentTabType>('video')
  const [activeSecondaryTab, setActiveSecondaryTab] = useState<SecondaryTabType>('checklist')
  const [checkProgress, setCheckProgress] = useState<any>(null)
  const [canComplete, setCanComplete] = useState(true)
  const [cooldownMinutes, setCooldownMinutes] = useState(0)
  const [completionCount, setCompletionCount] = useState(0)

  // Initialize completion state from localStorage for anonymous users
  useEffect(() => {
    if (!isAuthenticated) {
      const completed = isHackCompletedLocal(hack.id)
      setIsCompleted(completed)

      // Check cooldown and completion count
      const count = getHackCompletionCount(hack.id)
      setCompletionCount(count)

      const canCompleteNow = canCompleteHack(hack.id)
      setCanComplete(canCompleteNow)

      const cooldown = getHackCooldownMinutes(hack.id)
      setCooldownMinutes(cooldown)
    }
  }, [isAuthenticated, hack.id])

  // Update cooldown status every minute
  useEffect(() => {
    if (!isAuthenticated && cooldownMinutes > 0) {
      const timer = setInterval(() => {
        const cooldown = getHackCooldownMinutes(hack.id)
        setCooldownMinutes(cooldown)

        if (cooldown === 0) {
          setCanComplete(true)
        }
      }, 60000) // Check every minute

      return () => clearInterval(timer)
    }
  }, [isAuthenticated, cooldownMinutes, hack.id])

  const handleComplete = async () => {
    if (isMarking || (!canComplete && !isAuthenticated)) return

    setIsMarking(true)
    try {
      if (isAuthenticated) {
        await markHackCompleted(hack.id, !isCompleted)
        setIsCompleted(!isCompleted)
      } else {
        // For anonymous users, always increment when allowed
        if (canComplete) {
          markHackCompletedLocal(hack.id, levelSlug)
          const newCount = incrementHackCompletion(hack.id)

          setIsCompleted(true)
          setCompletionCount(newCount)
          setCanComplete(false)
          setCooldownMinutes(30)

          // Start cooldown timer
          setTimeout(() => {
            const cooldown = getHackCooldownMinutes(hack.id)
            setCooldownMinutes(cooldown)
            if (cooldown === 0) {
              setCanComplete(true)
            }
          }, 60000)
        }
      }
    } catch (error) {
      console.error('Failed to update completion status:', error)
    } finally {
      setIsMarking(false)
    }
  }

  const handleCheckProgress = (canComplete: boolean, progress: any) => {
    // Calculate percentage from progress data
    const percentage = progress.total_checks > 0
      ? (progress.completed_checks / progress.total_checks) * 100
      : 0

    setCheckProgress({
      ...progress,
      percentage,
      completed: progress.completed_checks,
      total: progress.total_checks
    })
  }

  const contentTabs: { id: ContentTabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'video', label: 'Video', icon: <Play className="h-4 w-4" /> },
    { id: 'text', label: 'Text', icon: <FileText className="h-4 w-4" /> }
  ]

  const secondaryTabs: { id: SecondaryTabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'checklist', label: 'Checklist' },
    { id: 'qa', label: 'Q&A', icon: <HelpCircle className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes' }
  ]

  // Content component - shared between embedded and modal views
  const renderModalContent = () => (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gray-100 flex items-center px-6 pr-16 border-b-2 border-yellow-400/30">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
            {hack.image_url && (
              <img src={hack.image_url} alt={hack.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{hack.name}</h2>
            <p className="text-sm text-gray-500">{hack.subtitle || 'Hack Subtitle'}</p>
          </div>
        </div>
      </div>

            {/* Content Tabs (Video/Text) */}
            <div className="absolute top-16 left-0 right-0 h-12 bg-gray-50 flex items-center justify-center px-6 border-b border-gray-200 z-30">
              <div className="flex gap-2">
                {contentTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveContentTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 cursor-pointer",
                      activeContentTab === tab.id
                        ? "text-yellow-600 border-b-2 border-yellow-500"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area (Video/Text) */}
            <div className="absolute top-28 left-0 right-0 bottom-[calc(50%+20px)] overflow-y-auto custom-scrollbar bg-white">
              {activeContentTab === 'video' && (
                <div className="p-6 h-full">
                  <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {hack.video_url ? (
                      <iframe
                        src={hack.video_url}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-gray-600 flex items-center justify-center">
                          <Play className="h-12 w-12 text-gray-500" />
                        </div>
                        <p className="text-gray-400">Video content not available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeContentTab === 'text' && (
                <div className="p-6 h-full overflow-y-auto">
                  <div className="prose prose-gray max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: hack.content || '<p>No text content available.</p>' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Secondary Tabs (Checklist/Q&A/Notes) */}
            <div className="absolute bottom-[calc(50%+20px-48px)] left-0 right-0 h-12 bg-gray-50 flex items-center justify-center px-6 border-b border-gray-200 border-t-2 border-t-yellow-400/30 z-30">
              <div className="flex gap-2">
                {secondaryTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSecondaryTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 cursor-pointer",
                      activeSecondaryTab === tab.id
                        ? "text-yellow-600 border-b-2 border-yellow-500"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Content Area (Checklist/Q&A/Notes) */}
            <div className="absolute bottom-20 left-0 right-0 h-[calc(50%-48px)] overflow-y-auto custom-scrollbar bg-white">
              {activeSecondaryTab === 'checklist' && (
                <div className="p-6">
                  {hack.hack_checks && hack.hack_checks.length > 0 ? (
                    <Checklist
                      hackId={hack.id}
                      isAuthenticated={isAuthenticated}
                      onProgressChange={(canComplete, progress) => handleCheckProgress(canComplete, progress)}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No checklist items available for this hack.</p>
                    </div>
                  )}
                </div>
              )}

              {activeSecondaryTab === 'qa' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Q&A section coming soon</p>
                  </div>
                </div>
              )}

              {activeSecondaryTab === 'notes' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Notes section coming soon</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-100 flex items-center justify-center px-6 border-t-2 border-gray-200">
              <Button
                onClick={handleComplete}
                disabled={
                  isMarking ||
                  (!canComplete && !isAuthenticated) ||
                  (checkProgress && checkProgress.percentage < 100) ||
                  (!checkProgress && hack.hack_checks && hack.hack_checks.length > 0)
                }
                className={cn(
                  "px-8 py-3 font-bold text-lg transition-all",
                  !isAuthenticated && cooldownMinutes > 0
                    ? "bg-gray-700 cursor-not-allowed"
                    : isCompleted || (!isAuthenticated && completionCount > 0)
                    ? "bg-green-600 hover:bg-green-700"
                    : (checkProgress && checkProgress.percentage === 100) || (!hack.hack_checks || hack.hack_checks.length === 0)
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : "bg-gray-600 hover:bg-gray-700 cursor-not-allowed"
                )}
                style={{
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                }}
              >
                {!isAuthenticated && cooldownMinutes > 0 ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Cooldown: {cooldownMinutes} min
                  </>
                ) : !isAuthenticated && completionCount > 0 && canComplete ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Finished Again!
                  </>
                ) : isCompleted || (!isAuthenticated && completionCount > 0) ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Completed
                  </>
                ) : checkProgress && checkProgress.percentage < 100 ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Complete Checklist ({checkProgress.completed}/{checkProgress.total})
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
      </>
  )

  // Render content directly - modal chrome handled by (detail) layout
  return (
    <div className="relative h-full">
      {renderModalContent()}
    </div>
  )
}