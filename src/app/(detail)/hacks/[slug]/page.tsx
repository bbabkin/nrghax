import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { HackModalEnhanced } from '@/components/levels/HackModalEnhanced'
import { CloseButton } from '@/components/pseudo-modal/CloseButton'

interface Props {
  params: Promise<{ slug: string }>
}

async function getHackWithChecks(slug: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // Get hack by slug with checks
  const { data: hack, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_checks(
        id,
        title,
        description,
        is_required,
        position
      ),
      tags:hack_tags(
        tag:tags(*)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !hack) {
    return null
  }

  // Get user progress if authenticated
  let userProgress = null
  if (user) {
    const { data: progress } = await supabase
      .from('user_hacks')
      .select('*')
      .eq('hack_id', hack.id)
      .eq('user_id', user.id)
      .single()

    userProgress = progress
  }

  // Sort hack_checks by position
  const sortedChecks = hack.hack_checks
    ?.sort((a: any, b: any) => a.position - b.position) || []

  return {
    ...hack,
    hack_checks: sortedChecks,
    tags: hack.tags?.map((ht: any) => ht.tag).filter(Boolean) || [],
    is_completed: userProgress?.completed_at != null,
  }
}

export default async function HackDetailPage({ params }: Props) {
  const resolvedParams = await params
  const hack = await getHackWithChecks(resolvedParams.slug)

  if (!hack) {
    notFound()
  }

  // Get the level slug for the hack (needed for HackModalEnhanced)
  const supabase = await createClient()
  const { data: level } = await supabase
    .from('levels')
    .select('slug')
    .eq('id', hack.level_id)
    .single()

  const levelSlug = level?.slug || 'unknown'

  return (
    <div className="relative h-full">
      <CloseButton />
      <HackModalEnhanced
        hack={hack}
        levelSlug={levelSlug}
        allLevelHacks={[]}
      />
    </div>
  )
}
