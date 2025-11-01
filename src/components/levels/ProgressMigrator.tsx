'use client'

/**
 * Component that handles automatic migration of local progress when user signs in
 * Place this in the app layout to enable automatic migration
 */

import { useEffect } from 'react'
import { useProgressMigration } from '@/hooks/useProgressMigration'

interface ProgressMigratorProps {
  userId: string | null
}

export function ProgressMigrator({ userId }: ProgressMigratorProps) {
  const { isMigrating, migrationComplete } = useProgressMigration(userId)

  // Optional: Show a toast or notification when migration is in progress
  useEffect(() => {
    if (isMigrating) {
      console.log('🔄 Migrating your progress to your account...')
    }
    if (migrationComplete) {
      console.log('✅ Progress migration complete!')
    }
  }, [isMigrating, migrationComplete])

  // This component doesn't render anything visible
  return null
}
