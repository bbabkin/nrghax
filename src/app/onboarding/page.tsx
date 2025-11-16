import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestionnaireWizard from '@/components/onboarding/QuestionnaireWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) {
    // User has already completed onboarding
    redirect('/library')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to NRGhax!</h1>
            <p className="text-lg text-muted-foreground">
              Let&apos;s personalize your experience. Answer a few questions to help us recommend the best challenges for you.
            </p>
          </div>

          <QuestionnaireWizard userId={user.id} />
        </div>
      </div>
    </div>
  )
}