import { getLevelBySlug, checkLevelUnlocked } from '@/lib/levels/actions'
import { ClientLevelDetail } from '@/components/levels'
import { getCurrentUser } from '@/lib/auth/user'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const level = await getLevelBySlug(params.slug)

  if (!level) {
    return {
      title: 'Level Not Found - NRGHax',
    }
  }

  return {
    title: `${level.name} - NRGHax Levels`,
    description: level.description || `Master the ${level.name} level in NRGHax`,
  }
}

export default async function LevelPage({
  params,
}: {
  params: { slug: string }
}) {
  const user = await getCurrentUser()

  const level = await getLevelBySlug(params.slug)
  if (!level) notFound()

  const supabase = await createClient()

  // Get hacks for this level (without user-specific data for anonymous users)
  let hacks
  if (user) {
    // Authenticated: get hacks with user progress
    const { data } = await supabase
      .from('hacks')
      .select(`
        *,
        user_hacks!left(completed_at, view_count)
      `)
      .eq('level_id', level.id)
      .eq('user_hacks.user_id', user.id)
      .order('position', { ascending: true })

    hacks = (data || []).map((hack) => ({
      ...hack,
      isCompleted: !!hack.user_hacks?.[0]?.completed_at,
      viewCount: hack.user_hacks?.[0]?.view_count || 0,
    }))
  } else {
    // Anonymous: get hacks without user data
    const { data } = await supabase
      .from('hacks')
      .select('*')
      .eq('level_id', level.id)
      .order('position', { ascending: true })

    hacks = (data || []).map((hack) => ({
      ...hack,
      isCompleted: false,
      viewCount: 0,
    }))
  }

  // Get hack prerequisites for all hacks in this level
  const hackIds = hacks.map((h) => h.id)
  const { data: hackPrereqs } = await supabase
    .from('hack_prerequisites')
    .select('hack_id, prerequisite_hack_id')
    .in('hack_id', hackIds)

  // Build prerequisite map
  const hackPrerequisites: Record<string, string[]> = {}
  if (hackPrereqs) {
    hackPrereqs.forEach((prereq) => {
      if (!hackPrerequisites[prereq.hack_id]) {
        hackPrerequisites[prereq.hack_id] = []
      }
      hackPrerequisites[prereq.hack_id].push(prereq.prerequisite_hack_id)
    })
  }

  // Add prerequisites to hacks
  hacks = hacks.map((hack) => ({
    ...hack,
    prerequisites: hackPrerequisites[hack.id] || [],
  }))

  // Get prerequisite IDs for this level
  const { data: prereqData } = await supabase
    .from('level_prerequisites')
    .select('prerequisite_level_id')
    .eq('level_id', level.id)

  const prerequisiteLevelIds = prereqData?.map((p) => p.prerequisite_level_id) || []

  // Calculate progress for authenticated users
  let serverProgress
  if (user) {
    const unlockStatus = await checkLevelUnlocked(user.id, level.id)
    const requiredHacks = hacks.filter((h) => h.is_required)
    const completedRequiredHacks = requiredHacks.filter((h) => h.isCompleted)
    const progressPercentage =
      requiredHacks.length > 0
        ? Math.round((completedRequiredHacks.length / requiredHacks.length) * 100)
        : 0
    const isLevelCompleted = progressPercentage === 100

    serverProgress = {
      isUnlocked: unlockStatus.is_unlocked,
      progressPercentage,
      isLevelCompleted,
      completedRequiredHacks: completedRequiredHacks.length,
      requiredHacks: requiredHacks.length,
    }
  }

  return (
    <ClientLevelDetail
      level={level}
      hacks={hacks}
      prerequisiteLevelIds={prerequisiteLevelIds}
      isAuthenticated={!!user}
      serverProgress={serverProgress}
    />
  )
}
