import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingEditor from '@/components/admin/OnboardingEditor'

export default async function AdminOnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // Get all tags for the editor
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .order('tag_type')
    .order('display_order')

  const tagsByType = tags?.reduce((acc, tag) => {
    const type = tag.tag_type || 'uncategorized'
    if (!acc[type]) acc[type] = []
    acc[type].push(tag)
    return acc
  }, {} as Record<string, typeof tags>) || {}

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Onboarding Management</h1>
        <p className="text-muted-foreground">
          Configure the questions and options for user onboarding
        </p>
      </div>

      <OnboardingEditor
        experienceTags={tagsByType.user_experience || []}
        interestTags={tagsByType.user_interest || []}
      />
    </div>
  )
}