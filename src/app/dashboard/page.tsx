import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if user has completed onboarding
  const { data: userTags } = await supabase
    .from('user_tags')
    .select(`
      tag_id,
      source,
      tags (
        id,
        name,
        slug,
        tag_type,
        description
      )
    `)
    .eq('user_id', user.id)

  const hasCompletedOnboarding = userTags && userTags.some(ut => ut.source === 'onboarding')

  // If user hasn't completed onboarding, redirect them
  if (!hasCompletedOnboarding) {
    redirect('/onboarding')
  }

  // Get personalized hack recommendations
  const { data: recommendedHacks } = await supabase
    .rpc('get_personalized_hacks', { p_user_id: user.id })
    .limit(6)

  // Organize user tags by type
  const experienceTag = userTags?.find(ut => (ut as any).tags?.tag_type === 'user_experience')?.tags as any
  const interestTags = userTags?.filter(ut => (ut as any).tags?.tag_type === 'user_interest').map(ut => (ut as any).tags) as any[]
  const specialTags = userTags?.filter(ut => (ut as any).tags?.tag_type === 'user_special').map(ut => (ut as any).tags) as any[]

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Welcome back!</h1>

        {/* Display user's tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {experienceTag && (
            <Badge variant="default" className="text-sm">
              {experienceTag.name}
            </Badge>
          )}
          {interestTags?.map(tag => (
            <Badge key={tag.id} variant="secondary" className="text-sm">
              {tag.name}
            </Badge>
          ))}
          {specialTags?.map(tag => (
            <Badge key={tag.id} variant="outline" className="text-sm">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recommended Hacks Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recommended Challenges</h2>
          <Link href="/hacks">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        {recommendedHacks && recommendedHacks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendedHacks.map((hack: any) => (
              <Card key={hack.hack_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{hack.hack_name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {hack.hack_description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="outline">
                      {hack.hack_difficulty || 'Medium'}
                    </Badge>
                    {hack.hack_time_minutes && (
                      <span className="text-sm text-muted-foreground">
                        {hack.hack_time_minutes} min
                      </span>
                    )}
                  </div>
                  {hack.matching_tags && hack.matching_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hack.matching_tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Link href={`/hacks/${hack.hack_id}`}>
                    <Button className="w-full" size="sm">
                      Start Challenge
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No personalized recommendations yet. Explore all challenges to get started!
              </p>
              <Link href="/hacks">
                <Button>Browse All Challenges</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your tags and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile/tags">
              <Button variant="outline" className="w-full">
                Manage Tags
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Track your completed challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile/history">
              <Button variant="outline" className="w-full">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Preferences</CardTitle>
            <CardDescription>Retake the onboarding questionnaire</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding">
              <Button variant="outline" className="w-full">
                Update Preferences
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}