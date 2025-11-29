import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { RoutineModalEnhanced } from '@/components/routines/RoutineModalEnhanced'
import { CloseButton } from '@/components/pseudo-modal/CloseButton'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function RoutineDetailPage({ params }: Props) {
  const resolvedParams = await params
  const supabase = await createClient()
  const user = await getCurrentUser()

  // Get routine with all related data
  const { data: routine, error } = await supabase
    .from('routines')
    .select(`
      *,
      creator:profiles!routines_created_by_fkey(
        id,
        email,
        name
      ),
      routine_hacks(
        position,
        hack:hacks(*)
      ),
      routine_tags(
        tag:tags(*)
      )
    `)
    .eq('slug', resolvedParams.slug)
    .single()

  if (error || !routine) {
    notFound()
  }

  // Check if this is a private routine and user has access
  if (!routine.is_public) {
    if (!user || (routine.created_by !== user.id)) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id || '')
        .single()

      if (!profile?.is_admin) {
        notFound()
      }
    }
  }

  // Sort hacks by position
  const sortedHacks = routine.routine_hacks
    ?.sort((a: any, b: any) => a.position - b.position)
    .map((rh: any) => rh.hack) || []

  // Format tags
  const tags = routine.routine_tags?.map((rt: any) => ({
    name: rt.tag.name,
    slug: rt.tag.slug
  })) || []

  // Format routine data for modal
  const routineData = {
    id: routine.id,
    name: routine.name,
    slug: routine.slug,
    description: routine.description,
    image_url: routine.image_url,
    hacks: sortedHacks,
    tags,
    creator: routine.creator,
    is_public: routine.is_public,
  }

  return (
    <div className="relative h-full">
      <CloseButton />
      <RoutineModalEnhanced routine={routineData} />
    </div>
  )
}
