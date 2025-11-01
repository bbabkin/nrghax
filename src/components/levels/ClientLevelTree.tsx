'use client'

/**
 * Client-side level tree component that works for both authenticated and anonymous users
 */

import { useEffect, useState } from 'react'
import type { LevelTreeNode } from '@/types/levels'
import { LevelTreeView } from './LevelTreeView'
import { buildLocalLevelTree } from '@/lib/levels/localStorage'

interface ClientLevelTreeProps {
  // Server-side data for authenticated users
  serverNodes?: LevelTreeNode[]
  // Static level data for anonymous users
  levels?: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    icon: string | null
    position: number | null
    required_hacks_count: number
    optional_hacks_count: number
    total_hacks_count: number
  }>
  prerequisites?: Record<string, string[]>
  isAuthenticated: boolean
}

export function ClientLevelTree({
  serverNodes,
  levels,
  prerequisites,
  isAuthenticated,
}: ClientLevelTreeProps) {
  const [nodes, setNodes] = useState<LevelTreeNode[]>(serverNodes || [])
  const [isLoading, setIsLoading] = useState(!isAuthenticated && !serverNodes)

  useEffect(() => {
    if (isAuthenticated && serverNodes) {
      // Use server data for authenticated users
      setNodes(serverNodes)
      setIsLoading(false)
    } else if (!isAuthenticated && levels && prerequisites) {
      // Build client-side tree for anonymous users
      const localNodes = buildLocalLevelTree(levels, prerequisites)
      setNodes(localNodes)
      setIsLoading(false)
    }
  }, [isAuthenticated, serverNodes, levels, prerequisites])

  // Listen for storage changes to update progress in real-time
  useEffect(() => {
    if (isAuthenticated) return // Only for anonymous users

    const handleStorageChange = () => {
      if (levels && prerequisites) {
        const localNodes = buildLocalLevelTree(levels, prerequisites)
        setNodes(localNodes)
      }
    }

    // Listen for storage events (updates from other tabs)
    window.addEventListener('storage', handleStorageChange)

    // Also set up a custom event for same-tab updates
    window.addEventListener('localProgressUpdate', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localProgressUpdate', handleStorageChange)
    }
  }, [isAuthenticated, levels, prerequisites])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Loading levels...</p>
      </div>
    )
  }

  return <LevelTreeView nodes={nodes} />
}
