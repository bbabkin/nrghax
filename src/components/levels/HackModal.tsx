'use client'

import { useRouter } from 'next/navigation'
import { X, Lock, CheckCircle, Heart, Eye, Clock, ArrowRight, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/youtube'
import { useState, useEffect, useCallback } from 'react'
import { toggleLike, markHackCompleted } from '@/lib/hacks/supabase-actions'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import {
  markHackAsCompleted as markHackCompletedLocal,
  markHackAsIncomplete as markHackAsIncompleteLocal,
  isHackCompleted as isHackCompletedLocal
} from '@/lib/levels/localStorage'
import { Checklist } from '@/components/hacks/Checklist'

interface HackModalProps {
  hack: any
  levelSlug: string
  allLevelHacks?: any[]
}

export function HackModal({ hack, levelSlug, allLevelHacks = [] }: HackModalProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLiked, setIsLiked] = useState(hack.is_liked || false)
  const [likeCount, setLikeCount] = useState(hack.like_count || 0)
  const [isCompleted, setIsCompleted] = useState(hack.is_completed || false)
  const [isLiking, setIsLiking] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [newlyUnlockedHacks, setNewlyUnlockedHacks] = useState<any[]>([])
  const [canCompleteHack, setCanCompleteHack] = useState(true)
  const [checkProgress, setCheckProgress] = useState<any>(null)

  // Initialize completion state from localStorage for anonymous users
  useEffect(() => {
    if (!isAuthenticated) {
      const completed = isHackCompletedLocal(hack.id)
      setIsCompleted(completed)
    }
  }, [isAuthenticated, hack.id])

  // Trigger entrance animation
  useEffect(() => {
    // Small delay to ensure the component is mounted before animating
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    // Wait for animation to complete before navigation
    setTimeout(() => {
      router.push(`/levels/${levelSlug}`)
    }, 200)
  }, [router, levelSlug])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [handleClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Check which hacks were newly unlocked after completing this hack
  const checkNewlyUnlockedHacks = () => {
    if (!isCompleted || allLevelHacks.length === 0) return

    // Find hacks that have this hack as a prerequisite
    const unlocked = allLevelHacks.filter((h: any) => {
      // Skip if it's the current hack
      if (h.id === hack.id) return false

      // Check if this hack is in its prerequisites
      const hasThisAsPrereq = h.prerequisites?.includes(hack.id)
      if (!hasThisAsPrereq) return false

      // Check if all prerequisites are now completed
      const allPrereqsCompleted = h.prerequisites?.every((prereqId: string) => {
        if (prereqId === hack.id) return true // Current hack just completed
        const prereqHack = allLevelHacks.find((ph: any) => ph.id === prereqId)
        return prereqHack?.isCompleted || false
      })

      return allPrereqsCompleted
    })

    setNewlyUnlockedHacks(unlocked)
  }

  const handleCheckProgressChange = useCallback((canComplete: boolean, progress: any) => {
    setCanCompleteHack(canComplete);
    setCheckProgress(progress);
  }, []);

  const handleLike = async () => {
    if (isLiking) return

    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    setIsLiking(true)
    const previousLiked = isLiked
    const previousCount = likeCount

    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      await toggleLike(hack.id)
    } catch (error) {
      setIsLiked(previousLiked)
      setLikeCount(previousCount)
    } finally {
      setIsLiking(false)
    }
  }

  const handleMarkComplete = async () => {
    if (isMarking) return

    setIsMarking(true)
    const previousCompleted = isCompleted
    const wasIncomplete = !isCompleted

    try {
      setIsCompleted(!isCompleted)

      if (isAuthenticated) {
        // Update database for authenticated users
        await markHackCompleted(hack.id, !isCompleted)

        // Also update localStorage so unlock detection works immediately
        // This syncs the database state with localStorage for real-time UI updates
        if (!isCompleted) {
          markHackCompletedLocal(hack.id, hack.level_id || levelSlug)
        } else {
          markHackAsIncompleteLocal(hack.id, hack.level_id || levelSlug)
        }
      } else {
        // For anonymous users, only update localStorage
        if (!isCompleted) {
          markHackCompletedLocal(hack.id, hack.level_id || levelSlug)
        } else {
          markHackAsIncompleteLocal(hack.id, hack.level_id || levelSlug)
        }
      }

      // Auto-close immediately after marking complete
      // This allows users to see the unlock animation on the levels page
      if (wasIncomplete) {
        setTimeout(() => {
          handleClose()
        }, 300)

        // Delay dispatching unlock events until AFTER modal closes and card collapses
        // This ensures the unlock animation triggers at the right time
        setTimeout(() => {
          window.dispatchEvent(new Event('storage'))
          window.dispatchEvent(new Event('localProgressUpdate'))
        }, 800) // Modal close (300ms) + card collapse time (500ms)
      } else {
        // For marking incomplete, dispatch immediately
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new Event('localProgressUpdate'))
      }
    } catch (error) {
      setIsCompleted(previousCompleted)
      console.error('Failed to update completion status:', error)
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className={`cursor-pointer top-0 left-0 right-0 bottom-0 fixed transition-opacity duration-300 bg-foreground/30 dark:bg-foreground/10 z-40 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Close modal"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-full max-w-4xl bg-background pointer-events-auto overflow-hidden relative
            shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_35px_60px_-15px_rgba(255,255,255,0.1)]
            md:[clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)]
            xl:[clip-path:polygon(35px_0,100%_0,100%_calc(100%-35px),calc(100%-35px)_100%,0_100%,0_35px)]
            transition-all duration-300 ease-out ${
              isVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95'
            }`}
          style={{
            clipPath: 'polygon(35px 0, 100% 0, 100% calc(100% - 35px), calc(100% - 35px) 100%, 0 100%, 0 35px)',
            maxHeight: 'calc(100vh - 8rem)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)] p-8">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                {hack.icon && <span className="text-5xl">{hack.icon}</span>}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{hack.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    {hack.difficulty && (
                      <Badge variant="secondary">{hack.difficulty}</Badge>
                    )}
                    {hack.duration_minutes && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(hack.duration_minutes)}
                      </Badge>
                    )}
                    {hack.is_required && (
                      <Badge>Required</Badge>
                    )}
                    {isCompleted && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleLike}
                  variant="outline"
                  size="sm"
                  disabled={isLiking}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isLiked && isAuthenticated ? 'fill-red-500 text-red-500' : ''}`} />
                  {likeCount}
                </Button>

                <Button
                  onClick={handleMarkComplete}
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  disabled={isMarking || (!isCompleted && !canCompleteHack)}
                  className="gap-2"
                  title={!canCompleteHack && !isCompleted ? 'Complete all required checks first' : undefined}
                >
                  {!canCompleteHack && !isCompleted ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>

                {checkProgress && checkProgress.total_checks > 0 && !isCompleted && (
                  <Badge variant="secondary" className="gap-1">
                    {checkProgress.completed_checks}/{checkProgress.total_checks} checks
                  </Badge>
                )}

                {hack.view_count > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    {hack.view_count} views
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {hack.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{hack.description}</p>
              </div>
            )}

            {/* Content */}
            {hack.content_body && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Instructions</h2>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: hack.content_body }}
                />
              </div>
            )}

            {/* Checklist */}
            <div className="mb-6">
              <Checklist
                hackId={hack.id}
                isAuthenticated={isAuthenticated}
                onProgressChange={handleCheckProgressChange}
              />
            </div>

            {/* External Link */}
            {hack.content_type === 'link' && hack.external_link && (
              <div className="mb-6">
                <Button asChild className="w-full">
                  <a
                    href={hack.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open External Resource
                  </a>
                </Button>
              </div>
            )}

            {/* Tags */}
            {hack.tags && hack.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {hack.tags.map((tag: any) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites Warning */}
            {hack.prerequisites && hack.prerequisites.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Prerequisites Required</p>
                    <p className="text-sm">Complete {hack.prerequisites.length} prerequisite hack{hack.prerequisites.length !== 1 ? 's' : ''} first</p>
                  </div>
                </div>
              </div>
            )}

            {/* Newly Unlocked Hacks */}
            {isCompleted && newlyUnlockedHacks.length > 0 && (
              <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-4">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <p className="font-bold text-lg">🎉 New Hacks Unlocked!</p>
                    <p className="text-sm">You can now access {newlyUnlockedHacks.length} new hack{newlyUnlockedHacks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {newlyUnlockedHacks.map((unlockedHack: any) => (
                    <Link
                      key={unlockedHack.id}
                      href={`/levels/${levelSlug}/hacks/${unlockedHack.slug}`}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {unlockedHack.icon && <span className="text-2xl">{unlockedHack.icon}</span>}
                        <div>
                          <p className="font-semibold">{unlockedHack.name}</p>
                          {unlockedHack.difficulty && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {unlockedHack.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
