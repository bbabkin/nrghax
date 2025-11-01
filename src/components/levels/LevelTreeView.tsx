'use client'

import { useEffect, useState } from 'react'
import type { LevelTreeNode } from '@/types/levels'
import { LevelCard } from './LevelCard'
import { ArrowDown } from 'lucide-react'

interface LevelTreeViewProps {
  nodes: LevelTreeNode[]
  onLevelClick?: (levelId: string) => void
}

export function LevelTreeView({ nodes, onLevelClick }: LevelTreeViewProps) {
  const [organizedLevels, setOrganizedLevels] = useState<LevelTreeNode[][]>([])

  useEffect(() => {
    // Organize levels into rows based on their position and prerequisites
    // For now, simple ordering by position
    // TODO: Implement proper tree layout algorithm
    const sorted = [...nodes].sort((a, b) => {
      const posA = a.level.position ?? 0
      const posB = b.level.position ?? 0
      return posA - posB
    })

    // Group into rows of 3-4 levels
    const rows: LevelTreeNode[][] = []
    const itemsPerRow = 3

    for (let i = 0; i < sorted.length; i += itemsPerRow) {
      rows.push(sorted.slice(i, i + itemsPerRow))
    }

    setOrganizedLevels(rows)
  }, [nodes])

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No levels available yet. Check back soon!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {organizedLevels.map((row, rowIndex) => (
        <div key={rowIndex}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {row.map((node) => (
              <LevelCard
                key={node.level.id}
                node={node}
                onClick={() => onLevelClick?.(node.level.id)}
              />
            ))}
          </div>

          {/* Connection arrows between rows */}
          {rowIndex < organizedLevels.length - 1 && (
            <div className="flex justify-center my-4">
              <ArrowDown className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
