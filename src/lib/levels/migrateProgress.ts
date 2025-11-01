'use server'

/**
 * Server action to migrate local progress to user account
 * This is called after user signs up or signs in
 */

import { createClient } from '@/lib/supabase/server'
import type { LocalProgressData } from './localStorage'

export async function migrateLocalProgressToUser(
  userId: string,
  localProgress: LocalProgressData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Migrate hack progress
    const hackPromises = Object.values(localProgress.hacks).map(async (hack) => {
      if (!hack.completed && hack.viewCount === 0) return // Skip if no meaningful progress

      // Check if user_hack already exists
      const { data: existing } = await supabase
        .from('user_hacks')
        .select('id, view_count, completed_at')
        .eq('user_id', userId)
        .eq('hack_id', hack.hackId)
        .single()

      if (existing) {
        // Update existing record (merge data)
        const newViewCount = Math.max(existing.view_count || 0, hack.viewCount)
        const newCompletedAt = existing.completed_at || hack.completedAt

        await supabase
          .from('user_hacks')
          .update({
            view_count: newViewCount,
            completed_at: newCompletedAt,
            viewed: true,
            viewed_at: hack.lastViewedAt,
          })
          .eq('id', existing.id)
      } else {
        // Create new record
        await supabase.from('user_hacks').insert({
          user_id: userId,
          hack_id: hack.hackId,
          view_count: hack.viewCount,
          completed_at: hack.completedAt,
          viewed: hack.viewCount > 0,
          viewed_at: hack.lastViewedAt,
        })
      }

      // If hack is completed, update level progress
      if (hack.completed) {
        // Get the hack's level_id
        const { data: hackData } = await supabase
          .from('hacks')
          .select('level_id')
          .eq('id', hack.hackId)
          .single()

        if (hackData?.level_id) {
          // Use the RPC function to update level progress
          await supabase.rpc('update_user_level_progress', {
            p_user_id: userId,
            p_level_id: hackData.level_id,
          })
        }
      }
    })

    await Promise.all(hackPromises)

    // Migrate level progress
    // Note: Level progress is recalculated from hack completions,
    // but we can ensure user_levels records exist
    const levelPromises = Object.values(localProgress.levels).map(async (level) => {
      const { data: existing } = await supabase
        .from('user_levels')
        .select('id')
        .eq('user_id', userId)
        .eq('level_id', level.levelId)
        .single()

      if (!existing && level.hacksCompleted > 0) {
        // Trigger level progress update via RPC
        await supabase.rpc('update_user_level_progress', {
          p_user_id: userId,
          p_level_id: level.levelId,
        })
      }
    })

    await Promise.all(levelPromises)

    // Migrate hack check progress
    const checkPromises = Object.values(localProgress.hackChecks).map(async (checkProgress) => {
      if (checkProgress.completedCheckIds.length === 0) return // Skip if no checks completed

      // For each completed check, create a user_hack_checks record
      const checkInserts = checkProgress.completedCheckIds.map(async (checkId) => {
        // Check if the record already exists
        const { data: existing } = await supabase
          .from('user_hack_checks')
          .select('id')
          .eq('user_id', userId)
          .eq('hack_check_id', checkId)
          .single()

        if (!existing) {
          // Insert new check completion record
          await supabase.from('user_hack_checks').insert({
            user_id: userId,
            hack_check_id: checkId,
            completed_at: new Date().toISOString(),
          })
        }
      })

      await Promise.all(checkInserts)
    })

    await Promise.all(checkPromises)

    return { success: true }
  } catch (error) {
    console.error('Error migrating local progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
