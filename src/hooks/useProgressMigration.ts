'use client'

/**
 * Hook to handle migration of local progress to user account after sign in/up
 */

import { useEffect, useState } from 'react'
import { exportLocalProgress, clearLocalProgress, getLocalProgressSummary } from '@/lib/levels/localStorage'
import { migrateLocalProgressToUser } from '@/lib/levels/migrateProgress'

export function useProgressMigration(userId: string | null) {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  useEffect(() => {
    // Only migrate if user just signed in and has local progress
    if (!userId || migrationComplete || isMigrating) return

    const migrateProgress = async () => {
      const summary = getLocalProgressSummary()

      // Check if there's any progress to migrate
      if (!summary.hasProgress) {
        setMigrationComplete(true)
        return
      }

      setIsMigrating(true)

      try {
        // Export local progress
        const localProgress = exportLocalProgress()

        // Migrate to user account
        const result = await migrateLocalProgressToUser(userId, localProgress)

        if (result.success) {
          // Clear local storage after successful migration
          clearLocalProgress()
          setMigrationComplete(true)

          // Optionally show a success message
          console.log('✅ Progress migrated successfully!', summary)

          // Dispatch custom event to trigger UI updates
          window.dispatchEvent(new Event('localProgressUpdate'))
        } else {
          console.error('Failed to migrate progress:', result.error)
        }
      } catch (error) {
        console.error('Error during migration:', error)
      } finally {
        setIsMigrating(false)
      }
    }

    // Delay migration slightly to ensure user is fully authenticated
    const timer = setTimeout(migrateProgress, 1000)

    return () => clearTimeout(timer)
  }, [userId, migrationComplete, isMigrating])

  return {
    isMigrating,
    migrationComplete,
  }
}
