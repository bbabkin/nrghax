'use client'

import { Lock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { LevelTreeNode } from '@/types/levels'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LevelCardProps {
  node: LevelTreeNode
  onClick?: () => void
}

export function LevelCard({ node, onClick }: LevelCardProps) {
  const { level, isLocked, isCompleted, progressPercentage } = node
  const requiredCount = level.required_hacks_count || 0
  const optionalCount = level.optional_hacks_count || 0
  const completedCount = node.userProgress?.hacks_completed || 0

  const cardClasses = `
    transition-all duration-200 cursor-pointer
    ${isLocked ? 'opacity-60 bg-gray-100 dark:bg-gray-900' : ''}
    ${isCompleted ? 'border-green-500 border-2' : ''}
    ${!isLocked && !isCompleted ? 'hover:shadow-lg hover:scale-105' : ''}
  `

  const content = (
    <Card className={cardClasses} onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {level.icon && <span className="text-2xl">{level.icon}</span>}
              {level.name}
              {isLocked && <Lock className="h-4 w-4 text-gray-400" />}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            {level.description && (
              <CardDescription className="mt-2">{level.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {!isLocked && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Required Hacks Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Required Hacks</span>
          <Badge variant={isCompleted ? 'default' : 'secondary'}>
            {completedCount} / {requiredCount}
          </Badge>
        </div>

        {/* Optional Hacks Count */}
        {optionalCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Optional Hacks</span>
            <Badge variant="outline">{optionalCount} available</Badge>
          </div>
        )}

        {/* Lock Message */}
        {isLocked && node.prerequisites.length > 0 && (
          <div className="text-sm text-gray-500 flex items-center gap-2 pt-2 border-t">
            <Lock className="h-3 w-3" />
            <span>Complete prerequisite levels to unlock</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isLocked) {
    return content
  }

  return (
    <Link href={`/levels/${level.slug}`} className="block">
      {content}
    </Link>
  )
}
