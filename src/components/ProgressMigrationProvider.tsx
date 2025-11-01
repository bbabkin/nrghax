'use client'

/**
 * Provider component that handles automatic migration of anonymous user progress
 * when they sign in or sign up. This should be added to the root layout.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProgressMigration } from '@/hooks/useProgressMigration'

export function ProgressMigrationProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const { isMigrating } = useProgressMigration(userId)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Optionally show a migration indicator
  // For now, we just let it happen in the background
  if (isMigrating) {
    // Could show a subtle toast or indicator here
    // For now, migration happens silently
  }

  return <>{children}</>
}
