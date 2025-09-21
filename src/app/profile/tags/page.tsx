import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw, Shield, User, Zap, Loader2 } from 'lucide-react'
import SyncButton from '@/components/tags/SyncButton'

export default async function ProfileTagsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get user's tags with full details
  const { data: userTags } = await supabase
    .from('user_tags')
    .select(`
      tag_id,
      source,
      assigned_at,
      updated_at,
      tags (
        id,
        name,
        slug,
        tag_type,
        description,
        discord_role_name
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Get sync logs for the user
  // TODO: Re-enable when tag_sync_log table is created
  // const { data: syncLogs } = await supabase
  //   .from('tag_sync_log')
  //   .select('*')
  //   .eq('user_id', user.id)
  //   .order('created_at', { ascending: false })
  //   .limit(10)
  const syncLogs = null

  // Organize tags by type
  const tagsByType = {
    user_experience: userTags?.filter(ut => (ut as any).tags?.tag_type === 'user_experience') || [],
    user_interest: userTags?.filter(ut => (ut as any).tags?.tag_type === 'user_interest') || [],
    user_special: userTags?.filter(ut => (ut as any).tags?.tag_type === 'user_special') || [],
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'onboarding':
        return <User className="h-3 w-3" />
      case 'discord':
        return <Zap className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      default:
        return null
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'onboarding':
        return 'bg-blue-500'
      case 'discord':
        return 'bg-purple-500'
      case 'admin':
        return 'bg-red-500'
      case 'system':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Tags & Roles</h1>
            <p className="text-muted-foreground">
              Manage your tags and see how they sync with Discord
            </p>
          </div>

          <div className="flex gap-2">
            <SyncButton />
            <Link href="/onboarding">
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Preferences
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Experience Level */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Level</CardTitle>
            <CardDescription>
              Your current skill level (only one can be active)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tagsByType.user_experience.length > 0 ? (
              <div className="space-y-3">
                {tagsByType.user_experience.map((ut: any) => (
                  <div key={ut.tag_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="text-sm">
                        {ut.tags.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {ut.tags.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getSourceColor(ut.source)}`} />
                      <span className="text-xs text-muted-foreground">
                        via {ut.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No experience level set</p>
            )}
          </CardContent>
        </Card>

        {/* Interest Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Interest Areas</CardTitle>
            <CardDescription>
              Topics you&apos;re interested in learning about
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tagsByType.user_interest.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tagsByType.user_interest.map((ut: any) => (
                  <div key={ut.tag_id} className="group relative">
                    <Badge variant="secondary" className="pr-6">
                      {ut.tags.name}
                    </Badge>
                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${getSourceColor(ut.source)}`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No interests selected</p>
            )}
          </CardContent>
        </Card>

        {/* Special Roles */}
        {tagsByType.user_special.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Special Roles</CardTitle>
              <CardDescription>
                Admin-assigned or earned roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tagsByType.user_special.map((ut: any) => (
                  <div key={ut.tag_id} className="group relative">
                    <Badge variant="outline" className="pr-6">
                      {ut.tags.name}
                    </Badge>
                    <div className={`absolute right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${getSourceColor(ut.source)}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync History */}
        {syncLogs && syncLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>
                Tag synchronization history between web and Discord
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        log.action === 'added' ? 'bg-green-500' :
                        log.action === 'removed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      <span className="text-muted-foreground">
                        Tag {log.action} from {log.source} to {log.target}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span>Discord</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span>System</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}