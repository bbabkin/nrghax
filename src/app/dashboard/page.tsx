import { requireAuth } from '@/lib/auth/user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import prisma from '@/lib/db'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Check if user has completed onboarding
  const userTags = await prisma.userTag.findMany({
    where: { userId: user.id },
    include: {
      tag: true
    }
  })

  const hasCompletedOnboarding = userTags && userTags.some(ut => ut.source === 'onboarding')

  // If user hasn't completed onboarding, redirect them
  if (!hasCompletedOnboarding) {
    redirect('/onboarding')
  }

  // Get personalized hack recommendations
  // For now, just get recent hacks - we'll implement personalization later
  const recommendedHacks = await prisma.hack.findMany({
    take: 6,
    include: {
      hackTags: {
        include: {
          tag: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Organize user tags by type
  const experienceTag = userTags?.find(ut => ut.tag.tagType === 'user_experience')?.tag
  const interestTags = userTags?.filter(ut => ut.tag.tagType === 'user_interest').map(ut => ut.tag)
  const specialTags = userTags?.filter(ut => ut.tag.tagType === 'user_special').map(ut => ut.tag)

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
                    {hack.timeMinutes && (
                      <span className="text-sm text-muted-foreground">
                        {hack.timeMinutes} min
                      </span>
                    )}
                  </div>
                  {hack.hackTags && hack.hackTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {hack.hackTags.map(ht => (
                        <Badge key={ht.tag.id} variant="secondary" className="text-xs">
                          {ht.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Link href={`/hacks/${hack.slug || hack.id}`}>
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