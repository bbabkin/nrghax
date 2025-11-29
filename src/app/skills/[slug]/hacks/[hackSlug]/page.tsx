import { getHackBySlug } from '@/lib/hacks/supabase-actions'
import { getLevelBySlug } from '@/lib/levels/actions'
import { HackModalEnhanced } from '@/components/levels/HackModalEnhanced'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'

export default async function HackModalPage({
  params,
}: {
  params: { slug: string; hackSlug: string }
}) {
  const hack = await getHackBySlug(params.hackSlug)

  if (!hack) {
    notFound()
  }

  // Get all hacks for this level to check for unlocks
  const level = await getLevelBySlug(params.slug)
  if (!level) notFound()

  const user = await getCurrentUser()
  const supabase = await createClient()

  // Get hacks for this level (with user progress if authenticated)
  let allLevelHacks
  if (user) {
    const { data } = await supabase
      .from('hacks')
      .select(`
        *,
        user_hacks!left(completed_at, view_count)
      `)
      .eq('level_id', level.id)
      .eq('user_hacks.user_id', user.id)
      .order('position', { ascending: true })

    allLevelHacks = (data || []).map((h) => ({
      ...h,
      isCompleted: !!h.user_hacks?.[0]?.completed_at,
      viewCount: h.user_hacks?.[0]?.view_count || 0,
    }))
  } else {
    const { data } = await supabase
      .from('hacks')
      .select('*')
      .eq('level_id', level.id)
      .order('position', { ascending: true })

    allLevelHacks = (data || []).map((h) => ({
      ...h,
      isCompleted: false,
      viewCount: 0,
    }))
  }

  // Get hack prerequisites for all hacks in this level
  const hackIds = allLevelHacks.map((h) => h.id)
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
  allLevelHacks = allLevelHacks.map((h) => ({
    ...h,
    prerequisites: hackPrerequisites[h.id] || [],
  }))

  return <HackModalEnhanced hack={hack} levelSlug={params.slug} allLevelHacks={allLevelHacks} />
}
