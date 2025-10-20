'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  LevelWithDetails,
  UserLevelProgress,
  UpdateLevelProgressResult,
  LevelUnlockStatus,
  LevelTreeNode,
} from '@/types/levels'

/**
 * Get all levels with their details (hack counts, prerequisites, etc.)
 */
export async function getAllLevels(): Promise<LevelWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('level_details')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching levels:', error)
    throw new Error('Failed to fetch levels')
  }

  return data as LevelWithDetails[]
}

/**
 * Get a single level by ID with all its hacks
 */
export async function getLevelById(levelId: string): Promise<LevelWithDetails | null> {
  const supabase = await createClient()

  // Get level details
  const { data: level, error: levelError } = await supabase
    .from('level_details')
    .select('*')
    .eq('id', levelId)
    .single()

  if (levelError || !level) {
    console.error('Error fetching level:', levelError)
    return null
  }

  // Get hacks for this level
  const { data: hacks, error: hacksError } = await supabase
    .from('hacks')
    .select('*')
    .eq('level_id', levelId)
    .order('position', { ascending: true })

  if (hacksError) {
    console.error('Error fetching hacks for level:', hacksError)
  }

  // Get prerequisites
  const { data: prereqData, error: prereqError } = await supabase
    .from('level_prerequisites')
    .select(`
      prerequisite_level_id,
      levels!level_prerequisites_prerequisite_level_id_fkey(*)
    `)
    .eq('level_id', levelId)

  if (prereqError) {
    console.error('Error fetching prerequisites:', prereqError)
  }

  return {
    ...level,
    hacks: hacks || [],
    prerequisites: prereqData?.map((p: any) => p.levels).filter(Boolean) || [],
  } as LevelWithDetails
}

/**
 * Get level by slug
 */
export async function getLevelBySlug(slug: string): Promise<LevelWithDetails | null> {
  const supabase = await createClient()

  const { data: level, error } = await supabase
    .from('levels')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !level) {
    return null
  }

  return getLevelById(level.id)
}

/**
 * Get user's progress for all levels
 */
export async function getUserLevelProgress(userId: string): Promise<UserLevelProgress[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_levels')
    .select(`
      *,
      level:levels(*)
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user level progress:', error)
    return []
  }

  return (data || []).map((ul) => ({
    ...ul,
    progress_percentage:
      ul.total_required_hacks > 0
        ? Math.round((ul.hacks_completed / ul.total_required_hacks) * 100)
        : 0,
    is_unlocked: true, // Will be calculated based on prerequisites
  })) as UserLevelProgress[]
}

/**
 * Check if a level is unlocked for a user
 */
export async function checkLevelUnlocked(
  userId: string,
  levelId: string
): Promise<LevelUnlockStatus> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_level_prerequisites_met', {
    p_user_id: userId,
    p_level_id: levelId,
  })

  if (error) {
    console.error('Error checking level prerequisites:', error)
    throw new Error('Failed to check level prerequisites')
  }

  // Get missing prerequisites if locked
  let missingPrerequisites: string[] = []

  if (!data) {
    const { data: prereqs } = await supabase
      .from('level_prerequisites')
      .select('prerequisite_level_id')
      .eq('level_id', levelId)

    const prereqIds = prereqs?.map((p) => p.prerequisite_level_id) || []

    const { data: completedLevels } = await supabase
      .from('user_levels')
      .select('level_id')
      .eq('user_id', userId)
      .in('level_id', prereqIds)
      .not('completed_at', 'is', null)

    const completedIds = new Set(completedLevels?.map((l) => l.level_id) || [])
    missingPrerequisites = prereqIds.filter((id) => !completedIds.has(id))
  }

  return {
    level_id: levelId,
    is_unlocked: !!data,
    missing_prerequisites: missingPrerequisites,
  }
}

/**
 * Update user's progress for a level (call after hack completion)
 */
export async function updateUserLevelProgress(
  userId: string,
  levelId: string
): Promise<UpdateLevelProgressResult> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('update_user_level_progress', {
    p_user_id: userId,
    p_level_id: levelId,
  })

  if (error || !data || data.length === 0) {
    console.error('Error updating user level progress:', error)
    throw new Error('Failed to update level progress')
  }

  const result = data[0]
  const progressPercentage =
    result.total_required_hacks > 0
      ? Math.round((result.hacks_completed / result.total_required_hacks) * 100)
      : 0

  revalidatePath('/levels')
  revalidatePath(`/levels/${levelId}`)

  return {
    ...result,
    progress_percentage: progressPercentage,
  }
}

/**
 * Get the complete level tree for visualization
 * Includes prerequisites, progress, and lock status
 */
export async function getLevelTree(userId: string): Promise<LevelTreeNode[]> {
  const supabase = await createClient()

  // Get all levels
  const levels = await getAllLevels()

  // Get all user progress
  const userProgress = await getUserLevelProgress(userId)
  const progressMap = new Map(userProgress.map((p) => [p.level_id, p]))

  // Get all prerequisites
  const { data: allPrereqs } = await supabase
    .from('level_prerequisites')
    .select('level_id, prerequisite_level_id')

  const prereqMap = new Map<string, string[]>()
  const childrenMap = new Map<string, string[]>()

  allPrereqs?.forEach((prereq) => {
    // Map level to its prerequisites
    const existing = prereqMap.get(prereq.level_id) || []
    prereqMap.set(prereq.level_id, [...existing, prereq.prerequisite_level_id])

    // Map prerequisite to its children (levels that depend on it)
    const children = childrenMap.get(prereq.prerequisite_level_id) || []
    childrenMap.set(prereq.prerequisite_level_id, [...children, prereq.level_id])
  })

  // Build tree nodes
  const treeNodes: LevelTreeNode[] = await Promise.all(
    levels.map(async (level) => {
      const progress = progressMap.get(level.id)
      const prerequisites = prereqMap.get(level.id) || []
      const children = childrenMap.get(level.id) || []

      // Check if locked
      const unlockStatus = await checkLevelUnlocked(userId, level.id)

      return {
        level,
        userProgress: progress,
        prerequisites,
        children,
        isLocked: !unlockStatus.is_unlocked,
        isCompleted: !!progress?.completed_at,
        progressPercentage: progress?.progress_percentage || 0,
      }
    })
  )

  return treeNodes
}

/**
 * Get hacks within a level (for hack tree visualization)
 */
export async function getLevelHacks(levelId: string, userId: string) {
  const supabase = await createClient()

  const { data: hacks, error } = await supabase
    .from('hacks')
    .select(`
      *,
      user_hacks!left(completed_at, view_count)
    `)
    .eq('level_id', levelId)
    .eq('user_hacks.user_id', userId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching level hacks:', error)
    return []
  }

  return hacks.map((hack) => ({
    ...hack,
    isCompleted: !!hack.user_hacks?.[0]?.completed_at,
    viewCount: hack.user_hacks?.[0]?.view_count || 0,
  }))
}

/**
 * Create a new level (admin only)
 */
export async function createLevel(data: {
  name: string
  slug: string
  description?: string
  icon?: string
  position?: number
}) {
  const supabase = await createClient()

  const { data: level, error } = await supabase
    .from('levels')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      position: data.position ?? 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating level:', error)
    throw new Error('Failed to create level')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')

  return level
}

/**
 * Update level (admin only)
 */
export async function updateLevel(
  levelId: string,
  data: {
    name?: string
    slug?: string
    description?: string
    icon?: string
    position?: number
  }
) {
  const supabase = await createClient()

  const { data: level, error } = await supabase
    .from('levels')
    .update(data)
    .eq('id', levelId)
    .select()
    .single()

  if (error) {
    console.error('Error updating level:', error)
    throw new Error('Failed to update level')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')
  revalidatePath(`/levels/${levelId}`)

  return level
}

/**
 * Delete level (admin only)
 */
export async function deleteLevel(levelId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('levels').delete().eq('id', levelId)

  if (error) {
    console.error('Error deleting level:', error)
    throw new Error('Failed to delete level')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')
}

/**
 * Add prerequisite to a level (admin only)
 */
export async function addLevelPrerequisite(levelId: string, prerequisiteLevelId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('level_prerequisites').insert({
    level_id: levelId,
    prerequisite_level_id: prerequisiteLevelId,
  })

  if (error) {
    console.error('Error adding prerequisite:', error)
    throw new Error('Failed to add prerequisite')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')
}

/**
 * Remove prerequisite from a level (admin only)
 */
export async function removeLevelPrerequisite(levelId: string, prerequisiteLevelId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('level_prerequisites')
    .delete()
    .eq('level_id', levelId)
    .eq('prerequisite_level_id', prerequisiteLevelId)

  if (error) {
    console.error('Error removing prerequisite:', error)
    throw new Error('Failed to remove prerequisite')
  }

  revalidatePath('/admin/levels')
  revalidatePath('/levels')
}

/**
 * Assign hack to a level (admin only)
 */
export async function assignHackToLevel(
  hackId: string,
  levelId: string | null,
  isRequired: boolean = true
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hacks')
    .update({
      level_id: levelId,
      is_required: isRequired,
    })
    .eq('id', hackId)

  if (error) {
    console.error('Error assigning hack to level:', error)
    throw new Error('Failed to assign hack to level')
  }

  revalidatePath('/admin/hacks')
  revalidatePath('/admin/levels')
  revalidatePath('/levels')
  if (levelId) {
    revalidatePath(`/levels/${levelId}`)
  }
}
