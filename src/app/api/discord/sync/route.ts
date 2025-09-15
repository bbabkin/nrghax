import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncWebTagsToDiscord } from '@/lib/tags/sync'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // If no specific changes provided, sync all current tags
    let tagChanges = body.changes

    if (!tagChanges) {
      // Get all user's current tags to sync
      const { data: userTags } = await supabase
        .from('user_tags')
        .select('tag_id')
        .eq('user_id', user.id)

      if (userTags && userTags.length > 0) {
        tagChanges = userTags.map(ut => ({
          tagId: ut.tag_id,
          action: 'add' as const
        }))
      }
    }

    if (!tagChanges || tagChanges.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tags to sync'
      })
    }

    // Trigger sync to Discord
    const result = await syncWebTagsToDiscord(user.id, tagChanges)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Discord sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get current sync status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile with Discord info
    const { data: profile } = await supabase
      .from('profiles')
      .select('discord_id, discord_username, discord_roles')
      .eq('id', user.id)
      .single()

    // Get user's current tags
    const { data: userTags } = await supabase
      .from('user_tags')
      .select(`
        tag_id,
        source,
        updated_at,
        tags (
          name,
          tag_type,
          discord_role_name
        )
      `)
      .eq('user_id', user.id)

    // Get recent sync logs
    const { data: syncLogs } = await supabase
      .from('tag_sync_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Identify tags that need syncing
    const tagsNeedingSync = userTags?.filter(ut => {
      const tag = (ut as any).tags
      return tag?.discord_role_name && ut.source === 'onboarding'
    }) || []

    return NextResponse.json({
      discordConnected: !!profile?.discord_id,
      discordUsername: profile?.discord_username,
      discordRoles: profile?.discord_roles || [],
      currentTags: userTags || [],
      tagsNeedingSync,
      recentSyncs: syncLogs || [],
      lastSyncAt: syncLogs?.[0]?.created_at || null
    })
  } catch (error) {
    console.error('Discord sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}