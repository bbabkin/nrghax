'use client'

/**
 * Client-side level detail component that works for both authenticated and anonymous users
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lock, Trophy, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HackFlowChart } from './HackFlowChart'
import {
  getLevelProgress,
  isLevelUnlocked,
  initializeLevelProgress,
  getHackProgress,
} from '@/lib/levels/localStorage'
import type { LevelWithDetails } from '@/types/levels'

interface ClientLevelDetailProps {
  level: LevelWithDetails
  hacks: any[]
  prerequisiteLevelIds: string[]
  isAuthenticated: boolean
  serverProgress?: {
    isUnlocked: boolean
    progressPercentage: number
    isLevelCompleted: boolean
    completedRequiredHacks: number
    requiredHacks: number
  }
}

export function ClientLevelDetail({
  level,
  hacks,
  prerequisiteLevelIds,
  isAuthenticated,
  serverProgress,
}: ClientLevelDetailProps) {
  const [progress, setProgress] = useState(serverProgress || {
    isUnlocked: false,
    progressPercentage: 0,
    isLevelCompleted: false,
    completedRequiredHacks: 0,
    requiredHacks: 0,
  })

  // State for hacks enriched with localStorage data
  const [enrichedHacks, setEnrichedHacks] = useState(hacks)

  useEffect(() => {
    if (isAuthenticated && serverProgress) {
      setProgress(serverProgress)
      setEnrichedHacks(hacks) // Use server-provided data for authenticated users
      return
    }

    // Anonymous user - use local storage
    const requiredHackIds = hacks.filter((h) => h.is_required).map((h) => h.id)

    // Initialize level progress if needed
    initializeLevelProgress(level.id, requiredHackIds)

    const updateLocalProgress = () => {
      // Enrich hacks with localStorage data
      const hacksWithLocalData = hacks.map((hack) => {
        const localProgress = getHackProgress(hack.id)
        return {
          ...hack,
          isCompleted: localProgress?.completed || false,
          viewCount: localProgress?.viewCount || 0,
        }
      })
      setEnrichedHacks(hacksWithLocalData)

      const localProgress = getLevelProgress(level.id)
      const unlocked = isLevelUnlocked(level.id, prerequisiteLevelIds)
      const requiredHacks = hacks.filter((h) => h.is_required)
      const progressPercentage =
        localProgress && localProgress.totalRequiredHacks > 0
          ? Math.round(
              (localProgress.hacksCompleted / localProgress.totalRequiredHacks) * 100
            )
          : 0
      const isLevelCompleted = progressPercentage === 100

      setProgress({
        isUnlocked: unlocked,
        progressPercentage,
        isLevelCompleted,
        completedRequiredHacks: localProgress?.hacksCompleted || 0,
        requiredHacks: requiredHacks.length,
      })
    }

    updateLocalProgress()

    // Listen for progress updates
    const handleProgressUpdate = () => {
      updateLocalProgress()
    }

    window.addEventListener('storage', handleProgressUpdate)
    window.addEventListener('localProgressUpdate', handleProgressUpdate)

    return () => {
      window.removeEventListener('storage', handleProgressUpdate)
      window.removeEventListener('localProgressUpdate', handleProgressUpdate)
    }
  }, [isAuthenticated, serverProgress, level.id, hacks, prerequisiteLevelIds])

  const requiredHacks = hacks.filter((h) => h.is_required)

  return (
    <div className="space-y-8" data-testid="level-page">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm">
        <Link
          href="/levels"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Levels
        </Link>
        <span className="text-gray-400 dark:text-gray-600">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{level.name}</span>
      </div>

      {/* Guest Mode Notice */}
      {!isAuthenticated && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Guest Mode:</strong> Your progress is saved locally in your browser.{' '}
            <a href="/auth/signin" className="underline hover:text-blue-600">
              Sign in
            </a>{' '}
            to sync your progress across devices.
          </p>
        </div>
      )}

      {/* Level Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              {level.icon && <span className="text-5xl">{level.icon}</span>}
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {level.name}
                  {progress.isLevelCompleted && (
                    <Trophy className="h-8 w-8 text-yellow-400" />
                  )}
                </h1>
                <p className="text-blue-100 mt-2">{level.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {!progress.isUnlocked ? (
              <div className="flex items-center gap-2 text-yellow-200 bg-yellow-900/30 px-4 py-2 rounded-lg">
                <Lock className="h-5 w-5" />
                <span>This level is locked. Complete prerequisite levels first.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Level Progress</span>
                  <span className="font-bold">{progress.progressPercentage}%</span>
                </div>
                <Progress value={progress.progressPercentage} className="h-3 bg-white/20" />
                <p className="text-sm text-blue-100">
                  {progress.completedRequiredHacks} of {progress.requiredHacks} required hacks
                  completed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Warning */}
      {!progress.isUnlocked && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Level Locked:</strong> You need to complete the prerequisite levels before
            you can access this one. The hacks below are shown for preview only.
          </AlertDescription>
        </Alert>
      )}

      {/* Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hacks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {level.total_hacks_count || hacks.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Required</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {level.required_hacks_count || requiredHacks.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Optional</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {level.optional_hacks_count || hacks.filter((h) => !h.is_required).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prerequisites Display */}
      {level.prerequisites && level.prerequisites.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Prerequisites
            </h3>
            <div className="flex flex-wrap gap-2">
              {level.prerequisites.map((prereq: any) => (
                <Link
                  key={prereq.id}
                  href={`/levels/${prereq.slug}`}
                  className="inline-flex items-center gap-2"
                >
                  <Badge variant="outline" className="hover:bg-blue-100 dark:hover:bg-blue-800">
                    {prereq.icon && <span>{prereq.icon}</span>}
                    {prereq.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hacks Flowchart */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Progression Path</h2>
      </div>

      <div className={!progress.isUnlocked ? 'opacity-60 pointer-events-none' : ''}>
        <HackFlowChart hacks={enrichedHacks} levelSlug={level.slug} levelUnlocked={progress.isUnlocked} />
      </div>

      {/* Completion Message */}
      {progress.isLevelCompleted && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
              Level Complete!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Congratulations! You&apos;ve completed all required hacks in the {level.name} level.
            </p>
            <Link
              href="/levels"
              className="inline-block mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Continue to Next Level
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
