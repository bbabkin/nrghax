import { requireAuth } from '@/lib/auth/supabase-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Check if user has completed onboarding
  const supabase = await createClient()

  // Check profile for onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  // If user hasn't completed onboarding, redirect them
  if (!profile?.onboarded) {
    redirect('/onboarding')
  }

  // Get user tags for display
  const { data: userTags } = await supabase
    .from('user_tags')
    .select(`
      *,
      tag:tags(*)
    `)
    .eq('user_id', user.id)

  // Get personalized hack recommendations
  // For now, just get recent hacks - we'll implement personalization later
  const { data: recommendedHacks } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags(
        tag:tags(*)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  // Organize user tags by type
  const experienceTag = userTags?.find((ut: any) => ut.tag.tag_type === 'user_experience')?.tag
  const interestTags = userTags?.filter((ut: any) => ut.tag.tag_type === 'user_interest').map((ut: any) => ut.tag)
  const specialTags = userTags?.filter((ut: any) => ut.tag.tag_type === 'user_special').map((ut: any) => ut.tag)

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
            {recommendedHacks.map((hack) => (
              <Card key={hack.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{hack.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {hack.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <Badge variant="outline">
                      {hack.difficulty || 'Medium'}
                    </Badge>
                    {hack.time_minutes && (
                      <span className="text-sm text-muted-foreground">
                        {hack.time_minutes} min
                      </span>
                    )}
                  </div>
                  {hack.hack_tags && hack.hack_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hack.hack_tags.map((ht: any) => (
                        <Badge key={ht.tag.id} variant="secondary" className="text-xs">
                          {ht.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="pr-2">
                    <Link href={`/hacks/${hack.slug || hack.id}`}>
                      <Button className="w-full" size="sm">
                        Start Challenge
                      </Button>
                    </Link>
                  </div>
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
          <CardContent className="pr-8">
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
          <CardContent className="pr-8">
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
          <CardContent className="pr-8">
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